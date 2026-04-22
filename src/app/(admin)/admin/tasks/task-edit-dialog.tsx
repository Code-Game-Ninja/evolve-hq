// Admin Task Edit Dialog — with Assign To field
"use client";

import { useState, useEffect } from "react";
import { X, CalendarIcon, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, TaskPriority, TaskProject, TaskStatus, TeamMember } from "./task-data";
import { statusColors } from "./task-data";
import { inputStyle, selectStyle, labelStyle, handleFocus, handleBlur } from "./dialog-styles";

interface TaskEditDialogProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  onDelete: (id: string) => void;
  members: TeamMember[];
}

export function TaskEditDialog({
  task,
  onClose,
  onSubmit,
  onDelete,
  members,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || "");
  const [project, setProject] = useState<TaskProject>("Website");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");

  // Sync form with incoming task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setAssigneeId(task.assigneeId);
      setProject(task.project);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate);
    }
  }, [task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !title.trim()) return;

    onSubmit({
      ...task,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      project,
      priority,
      status,
      dueDate: dueDate || task.dueDate,
    });
  }

  function handleDelete() {
    if (!task) return;
    onDelete(task.id);
  }

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
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
              aria-label="Edit task"
              className="w-full max-w-[520px] mx-4 backdrop-blur-xl border border-[#dddddd]"
              style={{
                backgroundColor: "rgba(241,239,237,0.85)",
                borderRadius: "24px",
                boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
                padding: "32px",
              }}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
                  Edit Task
                </h2>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
                  style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
                >
                  <X className="h-4 w-4" style={{ color: "#737373" }} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Title */}
                <div>
                  <label style={labelStyle}>
                    Task Title <span style={{ color: "#ef4444" }}>*</span>
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

                {/* Assign To + Status row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>
                      Assign To <span style={{ color: "#ef4444" }}>*</span>
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
                    <label style={labelStyle}>Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      style={selectStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      <option value="todo">{statusColors.todo.label}</option>
                      <option value="in-progress">{statusColors["in-progress"].label}</option>
                      <option value="done">{statusColors.done.label}</option>
                    </select>
                  </div>
                </div>

                {/* Project + Priority row */}
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* Due Date */}
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

                {/* Footer buttons */}
                <div className="flex items-center justify-between mt-2">
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:bg-red-50 cursor-pointer"
                    style={{ color: "#ef4444", backgroundColor: "rgba(241,239,237,0.45)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>

                  {/* Save / Cancel */}
                  <div className="flex gap-3">
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
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
