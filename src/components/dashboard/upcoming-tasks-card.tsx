// Upcoming tasks — dark contrast card
"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Server,
  Container,
  Smartphone,
  ArrowUpRight,
  ListTodo,
} from "lucide-react";
import Link from "next/link";

// Map project → icon
const projectIcon: Record<string, React.ElementType> = {
  Website: Globe,
  Backend: Server,
  DevOps: Container,
  Mobile: Smartphone,
  Other: ListTodo,
};

// Map priority → accent color
const priorityColor: Record<string, string> = {
  high: "var(--primary)",
  medium: "var(--primary-gold)",
  low: "#22c55e", // Keep green for success/low risk
};

interface ApiTask {
  id: string;
  title: string;
  dueDate?: string;
  priority?: string;
  project?: string;
  status?: string;
}

function fmtDueDate(dateStr: string | undefined): string {
  if (!dateStr) return "No due date";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
}

export function UpcomingTasksCard() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks?status=todo&limit=5")
      .then((r) => r.json())
      .then((data) => setTasks(data.items ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = 0; // todo tasks are not done

  return (
    <div
      className="h-full flex flex-col overflow-hidden backdrop-blur-xl border border-white/10 bg-glass-bg"
      style={{
        borderRadius: "24px",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ListTodo className="h-4 w-4 text-white/40" />
          <h3 className="text-[14px] font-semibold text-white/90">
            Upcoming Tasks
          </h3>
          <Link
            href="/tasks"
            className="flex items-center justify-center h-5 w-5 rounded-full transition-colors hover:bg-white/10"
          >
            <ArrowUpRight className="h-3 w-3 text-white/30" />
          </Link>
        </div>
        <span className="text-[1.3rem] font-bold text-white tabular-nums">
          {completedCount}/{tasks.length}
        </span>
      </div>

      <div className="mx-5 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {loading ? (
          // Loading skeleton
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-lg flex-shrink-0 animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
              <div className="flex-1 space-y-1.5">
                <div
                  className="h-3 rounded animate-pulse"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", width: "70%" }}
                />
                <div
                  className="h-2 rounded animate-pulse"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", width: "40%" }}
                />
              </div>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <p
            className="text-[13px] py-4 text-center"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            No upcoming tasks
          </p>
        ) : (
          tasks.map((task) => {
            const iconColor = priorityColor[task.priority ?? "medium"] ?? "#f59e0b";
            const IconComp = (projectIcon[task.project ?? "Other"] ?? ListTodo) as React.ElementType;
            return (
              <div key={task.id} className="flex items-center gap-2.5">
                {/* Category icon */}
                <div
                  className="flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${iconColor}15` }}
                >
                  <IconComp
                    className="h-3.5 w-3.5"
                    style={{ color: iconColor }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate text-white/90">
                    {task.title}
                  </p>
                  <p
                    className="text-[10px] tabular-nums text-white/40"
                  >
                    {fmtDueDate(task.dueDate)}
                  </p>
                </div>

                {/* Unchecked circle (todo = not done) */}
                <div
                  className="flex-shrink-0"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "1.5px solid rgba(255,255,255,0.2)",
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
