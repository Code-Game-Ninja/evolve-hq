// Admin Task Board View — Kanban columns with drag-and-drop, assignee on cards
"use client";

import { useState, useMemo } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type Task,
  type TaskStatus,
  statusColors,
  projectColors,
  formatDate,
  isOverdue,
  getMember,
} from "./task-data";

interface TaskBoardViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onReorderTasks: (reordered: Task[]) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onNewTask: () => void;
}

const columnOrder: TaskStatus[] = ["todo", "in-progress", "done"];

// Card content (shared between real card and drag overlay)
function TaskCardContent({
  task,
  isDragging,
  onDelete,
  onEdit,
}: {
  task: Task;
  isDragging?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
}) {
  const pColors = projectColors[task.project];
  const overdue = isOverdue(task.dueDate, task.status);
  const isDone = task.status === "done";
  const member = getMember(task.assigneeId);

  return (
    <div
      className={`
        group backdrop-blur-lg border transition-all duration-200
        ${isDragging
          ? "border-[#aaaaaa] shadow-xl scale-[1.03]"
          : "border-[#dddddd]/50 hover:border-[#bbbbbb] hover:shadow-sm"
        }
      `}
      style={{
        backgroundColor: isDragging
          ? "rgba(255,255,255,0.92)"
          : "rgba(255,255,255,0.6)",
        borderRadius: "18px",
        padding: "16px",
        opacity: isDragging ? 0.95 : 1,
      }}
    >
      {/* Title row with drag handle */}
      <div className="flex items-start gap-2">
        <GripVertical
          className="h-4 w-4 mt-0.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: "#737373" }}
        />
        <p
          className="text-sm font-medium mb-2 leading-snug flex-1 cursor-pointer"
          style={{
            color: isDone ? "#bbb" : "#1a1a1a",
            textDecoration: isDone ? "line-through" : "none",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(task);
          }}
        >
          {task.title}
        </p>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(task.id);
            }}
            className="h-5 w-5 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-pointer"
            title="Delete task"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3.5 w-3.5" style={{ color: "#bbb" }} />
          </button>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p
          className="text-xs mb-3 line-clamp-2 pl-6"
          style={{ color: "#888" }}
        >
          {task.description}
        </p>
      )}

      {/* Assignee row */}
      <div className="flex items-center gap-2 pl-6 mb-3">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image}
            alt={member.name}
            className="h-5 w-5 rounded-full object-cover shrink-0"
            title={member.name}
          />
        ) : (
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#f1efed" }}
            title={member.name}
          >
            <span className="text-[9px] font-semibold" style={{ color: "#707070" }}>
              {member.initials}
            </span>
          </div>
        )}
        <span className="text-xs" style={{ color: "#707070" }}>
          {member.name.split(" ")[0]}
        </span>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pl-6">
        <span
          className="text-[11px] font-medium px-2.5 py-0.5"
          style={{
            backgroundColor: pColors.bg,
            color: pColors.text,
            borderRadius: "9999px",
          }}
        >
          {task.project}
        </span>

        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor:
                task.priority === "high"
                  ? "#ef4444"
                  : task.priority === "medium"
                  ? "#f59e0b"
                  : "#dddddd",
            }}
          />
          <span
            className="text-xs font-mono"
            style={{
              color: overdue ? "#ef4444" : "#888",
              fontWeight: overdue ? 600 : 400,
            }}
          >
            {formatDate(task.dueDate)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Sortable task card
function SortableTaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task, status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-manipulation"
      onDoubleClick={onToggle}
    >
      <TaskCardContent task={task} onDelete={onDelete} onEdit={onEdit} />
    </div>
  );
}

// Droppable + sortable column
function SortableColumn({
  status,
  tasks,
  isOver,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
  onNewTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  isOver: boolean;
  onToggleStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onNewTask: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const sc = statusColors[status];
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[400px] flex flex-col backdrop-blur-lg border transition-all duration-200
        ${isOver
          ? "border-[#f3350c]/40 shadow-[0_0_20px_rgba(243,53,12,0.08)]"
          : "border-[#dddddd]"
        }
      `}
      style={{
        backgroundColor: isOver
          ? "rgba(243,53,12,0.04)"
          : "rgba(241,239,237,0.45)",
        borderRadius: "20px",
        padding: "16px",
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full transition-transform duration-200"
            style={{
              backgroundColor: sc.dot,
              transform: isOver ? "scale(1.3)" : "scale(1)",
            }}
          />
          <span
            className="text-sm font-semibold uppercase"
            style={{ color: "#1a1a1a" }}
          >
            {sc.label}
          </span>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 border border-[#dddddd]/50"
          style={{
            color: "#737373",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: "9999px",
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop indicator when hovering empty column */}
      {isOver && tasks.length === 0 && (
        <div
          className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-[#f3350c]/20 mb-3"
          style={{ minHeight: "80px" }}
        >
          <span className="text-xs" style={{ color: "#f3350c", opacity: 0.5 }}>
            Drop here
          </span>
        </div>
      )}

      {/* Sortable task cards */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 flex-1">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onToggle={() => onToggleStatus(task.id)}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add task button */}
      <button
        onClick={onNewTask}
        className="group mt-3 flex items-center justify-center gap-2 w-full py-3 transition-colors cursor-pointer"
        style={{
          border: "1.5px dashed #dddddd",
          borderRadius: "9999px",
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.6)";
          e.currentTarget.style.borderColor = "#aaaaaa";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "#dddddd";
        }}
      >
        <Plus className="h-4 w-4" style={{ color: "#bbb" }} />
        <span className="text-[13px]" style={{ color: "#bbb" }}>
          Add task
        </span>
      </button>
    </div>
  );
}

// Find which column a task or droppable id belongs to
function findColumnForId(
  id: string,
  tasks: Task[]
): TaskStatus | null {
  if (columnOrder.includes(id as TaskStatus)) return id as TaskStatus;
  const task = tasks.find((t) => t.id === id);
  return task?.status ?? null;
}

export function TaskBoardView({
  tasks,
  onToggleStatus,
  onReorderTasks,
  onDeleteTask,
  onEditTask,
  onNewTask,
}: TaskBoardViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  // Group tasks by column
  const columnTasks = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    for (const t of tasks) {
      map[t.status]?.push(t);
    }
    return map;
  }, [tasks]);

  // Sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined;
    if (!overId) {
      setOverColumn(null);
      return;
    }
    const col = findColumnForId(overId, tasks);
    setOverColumn(col);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnForId(activeId, tasks);
    const overCol = findColumnForId(overId, tasks);

    if (!activeCol || !overCol) return;

    // Same column — reorder
    if (activeCol === overCol) {
      const colItems = [...columnTasks[activeCol]];
      const oldIndex = colItems.findIndex((t) => t.id === activeId);
      const newIndex = columnOrder.includes(overId as TaskStatus)
        ? colItems.length - 1
        : colItems.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(colItems, oldIndex, newIndex);
      const newTasks: Task[] = [];
      for (const status of columnOrder) {
        if (status === activeCol) {
          newTasks.push(...reordered);
        } else {
          newTasks.push(...columnTasks[status]);
        }
      }
      const boardIds = new Set(newTasks.map((t) => t.id));
      for (const t of tasks) {
        if (!boardIds.has(t.id)) newTasks.push(t);
      }
      onReorderTasks(newTasks);
    } else {
      // Cross-column — move task to new status + insert at drop position
      const sourceItems = columnTasks[activeCol].filter(
        (t) => t.id !== activeId
      );
      const movedTask = tasks.find((t) => t.id === activeId);
      if (!movedTask) return;

      const updatedTask = { ...movedTask, status: overCol };
      const destItems = [...columnTasks[overCol]];

      const overIndex = columnOrder.includes(overId as TaskStatus)
        ? destItems.length
        : destItems.findIndex((t) => t.id === overId);

      if (overIndex === -1) {
        destItems.push(updatedTask);
      } else {
        destItems.splice(overIndex, 0, updatedTask);
      }

      const newTasks: Task[] = [];
      for (const status of columnOrder) {
        if (status === activeCol) {
          newTasks.push(...sourceItems);
        } else if (status === overCol) {
          newTasks.push(...destItems);
        } else {
          newTasks.push(...columnTasks[status]);
        }
      }
      const boardIds = new Set(newTasks.map((t) => t.id));
      for (const t of tasks) {
        if (!boardIds.has(t.id)) newTasks.push(t);
      }
      onReorderTasks(newTasks);
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
    setOverColumn(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columnOrder.map((status) => (
          <SortableColumn
            key={status}
            status={status}
            tasks={columnTasks[status]}
            isOver={overColumn === status}
            onToggleStatus={onToggleStatus}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
            onNewTask={onNewTask}
          />
        ))}
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeTask ? (
          <div style={{ width: "100%", maxWidth: "340px" }}>
            <TaskCardContent task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
