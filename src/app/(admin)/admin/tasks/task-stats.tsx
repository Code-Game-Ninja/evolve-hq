// Admin task stats row — 4 animated glass stat cards
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ListTodo, Circle, Clock, CheckCircle2 } from "lucide-react";
import { type Task } from "./task-data";

interface TaskStatsProps {
  tasks: Task[];
}

// Animation variants
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

// Animated counter hook — re-animates when target changes
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;

    if (from === target) return;

    const startTime = performance.now();
    let rafId: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}

// Stat card sub-component
function StatCard({
  stat,
  index,
  count,
}: {
  stat: (typeof stats)[number];
  index: number;
  count: number;
}) {
  const animatedValue = useCountUp(count);
  const Icon = stat.icon;

  return (
    <motion.div
      custom={index + 1}
      initial="hidden"
      animate="visible"
      variants={cardVariant}
      className="relative overflow-hidden backdrop-blur-lg border border-border bg-card/50 rounded-[24px] p-5"
    >
      <div
        className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: stat.iconBg }}
      >
        <Icon size={16} style={{ color: stat.iconColor }} />
      </div>
      <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
        {stat.label}
      </p>
      <p className="text-3xl font-bold mt-1 text-foreground">
        {animatedValue}
      </p>
      <p className="text-xs mt-0.5 text-muted-foreground/70">
        {stat.description}
      </p>
    </motion.div>
  );
}

const stats = [
  { key: "total" as const, label: "Total", description: "All tasks", icon: ListTodo, iconBg: "hsl(var(--foreground) / 0.08)", iconColor: "hsl(var(--foreground))" },
  { key: "todo" as const, label: "To Do", description: "Pending", icon: Circle, iconBg: "rgba(59,130,246,0.15)", iconColor: "#3b82f6" },
  { key: "in-progress" as const, label: "In Progress", description: "Active", icon: Clock, iconBg: "rgba(245,158,11,0.15)", iconColor: "#f59e0b" },
  { key: "done" as const, label: "Completed", description: "Finished", icon: CheckCircle2, iconBg: "rgba(34,197,94,0.15)", iconColor: "#22c55e" },
];

export function TaskStats({ tasks }: TaskStatsProps) {
  const counts = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.key} stat={stat} index={i} count={counts[stat.key]} />
      ))}
    </div>
  );
}
