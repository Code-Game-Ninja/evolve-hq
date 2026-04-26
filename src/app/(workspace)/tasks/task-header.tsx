// Task page header
"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface TaskHeaderProps {
  onNewTask: () => void;
}

export function TaskHeader({ onNewTask }: TaskHeaderProps) {
  return (
    <motion.div
      className="flex items-start justify-between gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Left */}
      <div>
        <h1 className="text-2xl sm:text-[2rem] font-semibold leading-tight text-foreground">
          My Tasks
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          View and manage your assigned tasks.
        </p>
      </div>

      {/* Right — glass buttons matching nav Settings button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* New Task button */}
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 backdrop-blur-lg border border-border bg-card/50 hover:border-foreground/30 hover:bg-accent text-primary cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>
    </motion.div>
  );
}
