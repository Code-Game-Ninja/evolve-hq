// Admin Tasks client — wires all admin task sub-components
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { type Task, type TaskStatus, type TaskPriority, type TaskProject, type TeamMember, registerMember } from "./task-data";
import { TaskHeader } from "./task-header";
import { TaskStats } from "./task-stats";
import { TaskToolbar, type ViewMode } from "./task-toolbar";
import { TaskListView } from "./task-list-view";
import { TaskBoardView } from "./task-board-view";
import { NewTaskDialog } from "./new-task-dialog";
import { TaskEditDialog } from "./task-edit-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { ToastProvider, useToast } from "./toast";

export function AdminTasksClient() {
  return (
    <ToastProvider>
      <AdminTasksInner />
    </ToastProvider>
  );
}

function AdminTasksInner() {
  const { toast } = useToast();

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [projectFilter, setProjectFilter] = useState<TaskProject | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Fetch team members for assignee dropdowns
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return;
      const data = await res.json();
      const list: TeamMember[] = ((data.users || []) as Record<string, unknown>[])
        .filter((u) => u.isActive)
        .map((u) => {
          const name = (u.name as string) || "";
          const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
          const id = (u._id as string) || "";
          return { id, name, initials, image: (u.image as string) || undefined };
        });
      setMembers(list);
      list.forEach(registerMember);
    } catch { /* ignore */ }
  }, []);

  // Fetch all tasks (admin sees all)
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks?all=true&page=1&limit=50");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: Task[] = (data.items || []).map((item: Record<string, unknown>) => {
        const name = (item.assigneeName as string) || "Unknown";
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const assigneeId = (item.assigneeId as string) || "";
        registerMember({ id: assigneeId, name, initials, image: (item.assigneeImage as string) || undefined });
        return {
          id: (item.id as string) || "",
          title: (item.title as string) || "",
          project: ((item.project as string) || "Other") as TaskProject,
          priority: ((item.priority as string) || "medium") as Task["priority"],
          dueDate: item.dueDate
            ? new Date(item.dueDate as string).toISOString().split("T")[0]
            : "",
          status: ((item.status as string) || "todo") as TaskStatus,
          description: (item.description as string) || "",
          assigneeId,
        };
      });
      setTasks(items);
    } catch {
      toast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMembers();
    fetchTasks();
  }, [fetchMembers, fetchTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Assignee
      if (assigneeFilter !== "all" && task.assigneeId !== assigneeFilter) {
        return false;
      }
      // Status
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }
      // Priority
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }
      // Project
      if (projectFilter !== "all" && task.project !== projectFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, search, assigneeFilter, statusFilter, priorityFilter, projectFilter]);

  // Toggle status cycle: todo → in-progress → done → todo
  const handleToggleStatus = useCallback(async (id: string) => {
    const prev = tasks.find((t) => t.id === id);
    if (!prev) return;
    const next: TaskStatus =
      prev.status === "todo"
        ? "in-progress"
        : prev.status === "in-progress"
        ? "done"
        : "todo";
    // Optimistic update
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: next } : t)));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: prev.status } : t)));
      toast("Failed to update status", "error");
    }
  }, [tasks, toast]);

  // Reorder tasks (drag-and-drop)
  const handleReorderTasks = useCallback((reordered: Task[]) => {
    setTasks(reordered);
  }, []);

  // Delete task
  const handleDeleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Task deleted");
    } catch {
      toast("Delete failed", "error");
      fetchTasks(); // re-sync on failure
    }
  }, [toast, fetchTasks]);

  // Request delete — opens confirmation
  const requestDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      handleDeleteTask(pendingDeleteId);
      setPendingDeleteId(null);
      if (editingTask?.id === pendingDeleteId) {
        setEditingTask(null);
      }
    }
  }, [pendingDeleteId, handleDeleteTask, editingTask]);

  // Edit task
  const handleEditTask = useCallback(async (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTask(null);
    try {
      const res = await fetch(`/api/tasks/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      toast("Task updated");
    } catch {
      toast("Update failed", "error");
      fetchTasks();
    }
  }, [toast, fetchTasks]);

  // Reassign task (opens edit dialog focused on assignee)
  const handleReassignTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  // Add new task
  const handleNewTask = useCallback(async (taskData: Omit<Task, "id">) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error();
      toast("Task created");
      fetchTasks();
    } catch {
      toast("Failed to create task", "error");
    }
  }, [toast, fetchTasks]);

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
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        projectFilter={projectFilter}
        onProjectChange={setProjectFilter}
        members={members}
      />

      {/* Content Area */}
      {view === "list" ? (
        <TaskListView
          tasks={filteredTasks}
          totalCount={tasks.length}
          onToggleStatus={handleToggleStatus}
          onDeleteTask={requestDelete}
          onEditTask={setEditingTask}
          onReassignTask={handleReassignTask}
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
        members={members}
      />

      {/* Edit Task Dialog */}
      <TaskEditDialog
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditTask}
        onDelete={requestDelete}
        members={members}
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
