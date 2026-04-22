// Admin Task List View — sortable table with Assignee column
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown, Circle, Clock, CheckCircle2, MoreHorizontal, Pencil, UserRoundCog, Trash2 } from "lucide-react";
import {
  type Task,
  type TaskStatus,
  projectColors,
  priorityColors,
  formatDate,
  isOverdue,
  isToday,
  getMember,
} from "./task-data";

interface TaskListViewProps {
  tasks: Task[];
  totalCount: number;
  onToggleStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onReassignTask: (task: Task) => void;
}

type SortField = "title" | "assignee" | "project" | "priority" | "dueDate";
type SortDir = "asc" | "desc";

const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

// Status icon
function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "done") {
    return (
      <CheckCircle2
        className="h-[18px] w-[18px] shrink-0"
        style={{ color: "#22c55e" }}
        fill="#22c55e"
        strokeWidth={0}
      />
    );
  }
  if (status === "in-progress") {
    return <Clock className="h-[18px] w-[18px] shrink-0" style={{ color: "#f59e0b" }} />;
  }
  return <Circle className="h-[18px] w-[18px] shrink-0" style={{ color: "#dddddd" }} strokeWidth={1.5} />;
}

// Avatar initials
function Avatar({ name, initials, image }: { name: string; initials: string; image?: string }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className="h-6 w-6 rounded-full object-cover shrink-0"
        title={name}
      />
    );
  }
  return (
    <div
      className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: "#f1efed" }}
      title={name}
    >
      <span className="text-[10px] font-semibold" style={{ color: "#707070" }}>
        {initials}
      </span>
    </div>
  );
}

// Row action menu
function RowActionMenu({
  onEdit,
  onReassign,
  onDelete,
}: {
  onEdit: () => void;
  onReassign: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center justify-center h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/5 cursor-pointer"
        aria-label="Task actions"
      >
        <MoreHorizontal className="h-4 w-4" style={{ color: "#737373" }} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 min-w-[160px] z-50 rounded-2xl border border-[#dddddd] backdrop-blur-lg shadow-lg p-1"
          style={{ backgroundColor: "rgba(241,239,237,0.92)" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer hover:bg-black/5"
            style={{ color: "#4d4d4d" }}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReassign(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer hover:bg-black/5"
            style={{ color: "#4d4d4d" }}
          >
            <UserRoundCog className="h-3.5 w-3.5" /> Reassign
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer hover:bg-red-50"
            style={{ color: "#ef4444" }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskListView({
  tasks,
  totalCount,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
  onReassignTask,
}: TaskListViewProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
      case "assignee":
        cmp = getMember(a.assigneeId).name.localeCompare(getMember(b.assigneeId).name);
        break;
      case "project":
        cmp = a.project.localeCompare(b.project);
        break;
      case "priority":
        cmp = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        break;
      case "dueDate":
        cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIndicator = useCallback(({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-50" style={{ color: "#737373" }} />;
    }
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 ml-1" style={{ color: "#1a1a1a" }} />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" style={{ color: "#1a1a1a" }} />
    );
  }, [sortField, sortDir]);

  return (
    <div
      className="overflow-hidden backdrop-blur-lg border border-[#dddddd]"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        borderRadius: "24px",
      }}
    >
      {/* Table Header */}
      <div
        className="hidden sm:grid items-center px-5 py-3"
        style={{
          backgroundColor: "rgba(0,0,0,0.03)",
          gridTemplateColumns: "40px 1fr 140px 120px 90px 90px 40px",
          gap: "8px",
        }}
      >
        <div />
        <button
          onClick={() => handleSort("title")}
          className="group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors text-left cursor-pointer"
          style={{ color: sortField === "title" ? "#1a1a1a" : "#999" }}
        >
          Task <SortIndicator field="title" />
        </button>
        <button
          onClick={() => handleSort("assignee")}
          className="group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer"
          style={{ color: sortField === "assignee" ? "#1a1a1a" : "#999" }}
        >
          Assignee <SortIndicator field="assignee" />
        </button>
        <button
          onClick={() => handleSort("project")}
          className="group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer"
          style={{ color: sortField === "project" ? "#1a1a1a" : "#999" }}
        >
          Project <SortIndicator field="project" />
        </button>
        <button
          onClick={() => handleSort("priority")}
          className="group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer"
          style={{ color: sortField === "priority" ? "#1a1a1a" : "#999" }}
        >
          Priority <SortIndicator field="priority" />
        </button>
        <button
          onClick={() => handleSort("dueDate")}
          className="group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer"
          style={{ color: sortField === "dueDate" ? "#1a1a1a" : "#999" }}
        >
          Due <SortIndicator field="dueDate" />
        </button>
        <div />
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center backdrop-blur-lg border border-[#dddddd]"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          >
            <CheckCircle2 className="h-6 w-6" style={{ color: "#dddddd" }} />
          </div>
          <p className="text-base font-semibold mt-3" style={{ color: "#737373" }}>
            No tasks found
          </p>
          <p className="text-sm mt-1" style={{ color: "#bbb" }}>
            Try adjusting your filters or create a new task.
          </p>
        </div>
      )}

      {/* Table Rows */}
      {sorted.map((task) => {
        const overdue = isOverdue(task.dueDate, task.status);
        const today = isToday(task.dueDate);
        const pColors = projectColors[task.project];
        const prColors = priorityColors[task.priority];
        const member = getMember(task.assigneeId);

        return (
          <div key={task.id}>
            {/* Desktop row */}
            <div
              className="hidden sm:grid group items-center px-5 py-3.5 transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: "40px 1fr 140px 120px 90px 90px 40px",
                gap: "8px",
                borderBottom: "1px solid #f1efed",
              }}
              onClick={() => onEditTask(task)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {/* Status icon */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id); }}
                className="flex items-center justify-center"
                aria-label={`Toggle status: ${task.status}`}
              >
                <StatusIcon status={task.status} />
              </button>

              {/* Task title */}
              <p
                className="text-sm font-medium truncate"
                style={{
                  color: task.status === "done" ? "#bbb" : "#1a1a1a",
                  textDecoration: task.status === "done" ? "line-through" : "none",
                }}
              >
                {task.title}
              </p>

              {/* Assignee */}
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={member.name} initials={member.initials} image={member.image} />
                <span className="text-[13px] truncate" style={{ color: "#707070" }}>
                  {member.name.split(" ")[0]}
                </span>
              </div>

              {/* Project pill */}
              <div>
                <span
                  className="inline-block text-[11px] font-medium px-2.5 py-0.5"
                  style={{
                    backgroundColor: pColors.bg,
                    color: pColors.text,
                    borderRadius: "9999px",
                  }}
                >
                  {task.project}
                </span>
              </div>

              {/* Priority badge */}
              <div>
                <span
                  className="inline-block text-[11px] font-semibold px-2.5 py-0.5 capitalize"
                  style={{
                    backgroundColor: prColors.bg,
                    color: prColors.text,
                    borderRadius: "9999px",
                  }}
                >
                  {task.priority}
                </span>
              </div>

              {/* Due date */}
              <p
                className="text-[13px]"
                style={{
                  color: overdue ? "#ef4444" : today ? "#f3350c" : "#888",
                  fontWeight: overdue || today ? 600 : 400,
                }}
              >
                {formatDate(task.dueDate)}
              </p>

              {/* Actions menu */}
              <RowActionMenu
                onEdit={() => onEditTask(task)}
                onReassign={() => onReassignTask(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            </div>

            {/* Mobile card */}
            <div
              className="sm:hidden flex items-start gap-3 px-4 py-3.5 cursor-pointer"
              style={{ borderBottom: "1px solid #f1efed" }}
              onClick={() => onEditTask(task)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id); }}
                className="flex items-center justify-center shrink-0 mt-0.5"
              >
                <StatusIcon status={task.status} />
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium leading-snug"
                  style={{
                    color: task.status === "done" ? "#bbb" : "#1a1a1a",
                    textDecoration: task.status === "done" ? "line-through" : "none",
                  }}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Avatar name={member.name} initials={member.initials} image={member.image} />
                  <span className="text-xs" style={{ color: "#737373" }}>
                    {member.name.split(" ")[0]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className="inline-block text-[11px] font-medium px-2.5 py-0.5"
                    style={{ backgroundColor: pColors.bg, color: pColors.text, borderRadius: "9999px" }}
                  >
                    {task.project}
                  </span>
                  <span
                    className="inline-block text-[11px] font-semibold px-2.5 py-0.5 capitalize"
                    style={{ backgroundColor: prColors.bg, color: prColors.text, borderRadius: "9999px" }}
                  >
                    {task.priority}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: overdue ? "#ef4444" : today ? "#f3350c" : "#888",
                      fontWeight: overdue || today ? 600 : 400,
                    }}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      {sorted.length > 0 && (
        <div className="flex justify-center py-3">
          <p className="text-xs" style={{ color: "#737373" }}>
            Showing {sorted.length} of {totalCount} tasks
          </p>
        </div>
      )}
    </div>
  );
}
