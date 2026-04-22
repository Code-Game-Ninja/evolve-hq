// Tasks client component — wires all task sub-components
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { type Task, type TaskStatus, type TaskPriority, type TaskProject } from "./task-data";
import { TaskHeader } from "./task-header";
import { TaskStats } from "./task-stats";
import { TaskToolbar, type ViewMode } from "./task-toolbar";
import { TaskListView } from "./task-list-view";
import { TaskBoardView } from "./task-board-view";
import { NewTaskDialog } from "./new-task-dialog";
import { TaskEditDialog } from "./task-edit-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { ToastProvider, useToast } from "./toast";
import { getPusherClient } from "@/lib/pusher";

export function TasksClient() {
  return (
    <ToastProvider>
      <TasksClientInner />
    </ToastProvider>
  );
}

function TasksClientInner() {
  const { toast } = useToast();
  const { data: session } = useSession();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [projectFilter, setProjectFilter] = useState<TaskProject | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks?page=1&limit=50");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      const mapped: Task[] = (data.items ?? []).map((raw: Record<string, unknown>) => ({
        id: raw.id as string,
        title: raw.title as string,
        project: (raw.project as TaskProject) ?? "Other",
        priority: (raw.priority as TaskPriority) ?? "medium",
        dueDate: raw.dueDate
          ? (raw.dueDate as string).split("T")[0]
          : new Date().toISOString().split("T")[0],
        status: raw.status as TaskStatus,
        description: raw.description as string | undefined,
        assignee: (raw.assigneeName as string) ?? undefined,
      }));
      setTasks(mapped);
    } catch {
      toast("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Pusher real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("tasks-channel");

    channel.bind("task-created", (data: { task: any }) => {
      setTasks((prev) => {
        // Avoid duplicates
        if (prev.some((t) => t.id === data.task.id)) return prev;
        return [data.task, ...prev];
      });
    });

    channel.bind("task-updated", (data: { task: any }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === data.task.id ? { ...t, ...data.task } : t))
      );
    });

    channel.bind("task-deleted", (data: { id: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== data.id));
    });

    return () => {
      pusher.unsubscribe("tasks-channel");
    };
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }
      // Project filter
      if (projectFilter !== "all" && task.project !== projectFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, projectFilter]);

  // Toggle task status: todo → in-progress → done → todo (with optimistic update)
  const handleToggleStatus = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const next: TaskStatus =
        task.status === "todo"
          ? "in-progress"
          : task.status === "in-progress"
          ? "done"
          : "todo";

      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));

      try {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) throw new Error("Failed to update status");
      } catch {
        toast("Failed to update task status");
        // Revert optimistic update
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)));
      }
    },
    [tasks, toast]
  );

  // Reorder tasks (drag-and-drop — within column or cross-column)
  const handleReorderTasks = useCallback(
    async (reordered: Task[]) => {
      // 1. Identify which task changed its status by comparing with current state
      const tasksWithStatusChange = reordered.filter((task) => {
        const original = tasks.find((t) => t.id === task.id);
        return original && original.status !== task.status;
      });

      // 2. Optimistic update
      setTasks(reordered);

      try {
        // 3. Persist status changes (cross-column moves)
        // We do this sequentially to avoid race conditions or heavy load, 
        // though usually it's just one task at a time in drag-and-drop.
        for (const task of tasksWithStatusChange) {
          await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: task.status }),
          });
        }
        
        // Note: Full persistence of 'order' within a column requires a bulk update API.
        // For now, we prioritize status integrity for cross-column moves.
      } catch {
        toast("Failed to save task move");
        fetchTasks(); // Revert by refetching
      }
    },
    [tasks, toast, fetchTasks]
  );

  // Delete task (optimistic)
  const handleDeleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
        toast("Task deleted");
      } catch {
        toast("Failed to delete task");
        fetchTasks(); // Revert by refetching
      }
    },
    [toast, fetchTasks]
  );

  // Request delete — opens confirmation dialog
  const requestDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  // Confirm delete — actually deletes + closes dialog
  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      handleDeleteTask(pendingDeleteId);
      setPendingDeleteId(null);
      // Close edit dialog if the deleted task was being edited
      if (editingTask?.id === pendingDeleteId) {
        setEditingTask(null);
      }
    }
  }, [pendingDeleteId, handleDeleteTask, editingTask]);

  // Edit task — PUT full update
  const handleEditTask = useCallback(
    async (updated: Task) => {
      try {
        const res = await fetch(`/api/tasks/${updated.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updated.title,
            project: updated.project,
            priority: updated.priority,
            dueDate: updated.dueDate,
            status: updated.status,
            description: updated.description,
          }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        await fetchTasks();
        setEditingTask(null);
        toast("Task updated");
      } catch {
        toast("Failed to update task");
      }
    },
    [toast, fetchTasks]
  );

  // Add new task — POST to API
  const handleNewTask = useCallback(
    async (taskData: Omit<Task, "id">) => {
      const assigneeId = session?.user?.id;
      if (!assigneeId) {
        toast("Session not ready — please try again");
        return;
      }
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...taskData, assigneeId }),
        });
        if (!res.ok) throw new Error("Failed to create task");
        await fetchTasks();
        toast("Task created");
      } catch {
        toast("Failed to create task");
      }
    },
    [session, toast, fetchTasks]
  );

  // Loading skeleton
  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-5 pb-12">
        <div className="h-12 w-48 rounded-xl animate-pulse" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          ))}
        </div>
        <div className="h-10 rounded-xl animate-pulse" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <TaskHeader onNewTask={() => setDialogOpen(true)} />

      {/* Stats Row */}
      <TaskStats tasks={tasks} />

      {/* Toolbar */}
      <TaskToolbar
        view={view}
        onViewChange={setView}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        projectFilter={projectFilter}
        onProjectChange={setProjectFilter}
      />

      {/* Content Area */}
      {view === "list" ? (
        <TaskListView
          tasks={filteredTasks}
          totalCount={tasks.length}
          onToggleStatus={handleToggleStatus}
          onDeleteTask={requestDelete}
          onEditTask={setEditingTask}
        />
      ) : (
        <TaskBoardView
          tasks={filteredTasks}
          onToggleStatus={handleToggleStatus}
          onReorderTasks={handleReorderTasks}
          onDeleteTask={requestDelete}
          onEditTask={setEditingTask}
          onNewTask={() => setDialogOpen(true)}
        />
      )}

      {/* New Task Dialog */}
      <NewTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleNewTask}
      />

      {/* Edit Task Dialog */}
      <TaskEditDialog
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditTask}
        onDelete={requestDelete}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
