// Task List View — sortable table with status icons, project pills, priority badges
"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronUp, ChevronDown, Circle, Clock, CheckCircle2, Trash2 } from "lucide-react";
import {
  type Task,
  type TaskStatus,
  projectColors,
  priorityColors,
  formatDate,
  isOverdue,
  isToday,
} from "./task-data";

interface TaskListViewProps {
  tasks: Task[];
  totalCount: number;
  onToggleStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}

type SortField = "title" | "project" | "priority" | "dueDate";
type SortDir = "asc" | "desc";

const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

// Status icon component
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
    return (
      <Clock
        className="h-[18px] w-[18px] shrink-0"
        style={{ color: "#f59e0b" }}
      />
    );
  }
  return (
    <Circle
      className="h-[18px] w-[18px] shrink-0 text-muted-foreground"
      strokeWidth={1.5}
    />
  );
}

export function TaskListView({ tasks, totalCount, onToggleStatus, onDeleteTask, onEditTask }: TaskListViewProps) {
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

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return (
        <ChevronDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-50 text-muted-foreground" />
      );
    }
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 ml-1 text-foreground" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1 text-foreground" />
    );
  }

  return (
    <div
      className="overflow-hidden backdrop-blur-lg border border-border bg-card/50 rounded-[24px]"
    >
      {/* Table Header */}
      <div
        className="hidden sm:grid items-center px-5 py-3"
        style={{
          backgroundColor: "rgba(0,0,0,0.03)",
          gridTemplateColumns: "40px 1fr 140px 100px 100px 40px",
          gap: "8px",
        }}
      >
        <div /> {/* checkbox spacer */}
        <button
          onClick={() => handleSort("title")}
          className={cn("group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors text-left cursor-pointer", sortField === "title" ? "text-foreground" : "text-muted-foreground")}
        >
          Task <SortIcon field="title" />
        </button>
        <button
          onClick={() => handleSort("project")}
          className={cn("group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer", sortField === "project" ? "text-foreground" : "text-muted-foreground")}
        >
          Project <SortIcon field="project" />
        </button>
        <button
          onClick={() => handleSort("priority")}
          className={cn("group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer", sortField === "priority" ? "text-foreground" : "text-muted-foreground")}
        >
          Priority <SortIcon field="priority" />
        </button>
        <button
          onClick={() => handleSort("dueDate")}
          className={cn("group flex items-center text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer", sortField === "dueDate" ? "text-foreground" : "text-muted-foreground")}
        >
          Due <SortIcon field="dueDate" />
        </button>
        <div /> {/* delete spacer */}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-12 w-12 rounded-full flex items-center justify-center backdrop-blur-lg border border-border bg-card/50">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-base font-semibold mt-3 text-muted-foreground">
            No tasks found
          </p>
          <p className="text-sm mt-1 text-muted-foreground/60">
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

        return (
          <div key={task.id}>
            {/* Desktop row (sm+) */}
            <div
              className="hidden sm:grid group items-center px-5 py-3.5 transition-colors cursor-pointer border-b border-border hover:bg-accent/50"
              style={{
                gridTemplateColumns: "40px 1fr 140px 100px 100px 40px",
                gap: "8px",
              }}
              onClick={() => onEditTask(task)}
            >
              {/* Status icon */}
              <button
                onClick={() => onToggleStatus(task.id)}
                className="flex items-center justify-center"
              >
                <StatusIcon status={task.status} />
              </button>

              {/* Task title */}
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                )}
              >
                {task.title}
              </p>

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
                className="text-[13px] font-mono"
                style={{
                  color: overdue ? "#ef4444" : today ? "#f3350c" : "#888",
                  fontWeight: overdue || today ? 600 : 400,
                }}
              >
                {formatDate(task.dueDate)}
              </p>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" style={{ color: "#bbb" }} />
              </button>
            </div>

            {/* Mobile card (<sm) */}
            <div
              className="sm:hidden flex items-start gap-3 px-4 py-3.5 cursor-pointer"
              style={{ borderBottom: "1px solid #f1efed" }}
              onClick={() => onEditTask(task)}
            >
              {/* Status icon */}
              <button
                onClick={() => onToggleStatus(task.id)}
                className="flex items-center justify-center shrink-0 mt-0.5"
              >
                <StatusIcon status={task.status} />
              </button>

              {/* Content */}
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
                <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                  <span
                    className="text-xs font-mono"
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
