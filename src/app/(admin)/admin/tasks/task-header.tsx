// Admin task page header — title + New Task button
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
        <h1
          className="text-2xl sm:text-[2rem] font-semibold leading-tight"
          style={{ color: "#1a1a1a" }}
        >
          All Tasks
        </h1>
        <p className="text-sm mt-1" style={{ color: "#737373" }}>
          View and manage tasks across all team members
        </p>
      </div>

      {/* Right — glass New Task button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onNewTask}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
          style={{
            backgroundColor: "rgba(241,239,237,0.45)",
            color: "#f3350c",
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </motion.div>
  );
}
