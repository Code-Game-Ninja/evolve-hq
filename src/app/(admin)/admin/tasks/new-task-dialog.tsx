// Admin New Task Dialog — with required Assign To field
"use client";

import { useState } from "react";
import { X, CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TaskPriority, TaskProject, Task, TeamMember } from "./task-data";
import { inputStyle, selectStyle, labelStyle, handleFocus, handleBlur } from "./dialog-styles";

interface NewTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, "id">) => void;
  members: TeamMember[];
}

export function NewTaskDialog({ open, onClose, onSubmit, members }: NewTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || "");
  const [project, setProject] = useState<TaskProject>("Website");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      project,
      priority,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      status: "todo",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setAssigneeId(members[0]?.id || "");
    setProject("Website");
    setPriority("medium");
    setDueDate("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          >
            {/* Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Create new task"
              className="w-full max-w-[520px] mx-4 backdrop-blur-xl border border-border bg-card/85 rounded-[24px] shadow-xl p-8"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Create New Task
                </h2>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 backdrop-blur-lg border border-border bg-card/50 hover:border-foreground/30 hover:bg-accent cursor-pointer text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Title */}
                <div>
                  <label style={labelStyle}>
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title..."
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      height: "96px",
                      padding: "12px 16px",
                      resize: "vertical",
                      borderRadius: "16px",
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Assign To + Project row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>
                      Assign To <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      style={selectStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Project</label>
                    <select
                      value={project}
                      onChange={(e) => setProject(e.target.value as TaskProject)}
                      style={selectStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      <option value="Website">Website</option>
                      <option value="Backend">Backend</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Priority + Due Date row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      style={selectStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Due Date</label>
                    <div className="relative">
                      <CalendarIcon
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: "#b6b6b6" }}
                      />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: "40px" }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:text-[#000000] hover:bg-[#e8e5e2] cursor-pointer"
                    style={{ color: "#4d4d4d", backgroundColor: "rgba(241,239,237,0.45)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
                    style={{
                      backgroundColor: title.trim() ? "rgba(241,239,237,0.45)" : "rgba(241,239,237,0.3)",
                      color: title.trim() ? "#f3350c" : "#ccbbbb",
                      cursor: title.trim() ? "pointer" : "not-allowed",
                    }}
                    disabled={!title.trim()}
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
