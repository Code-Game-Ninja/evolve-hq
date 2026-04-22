// Admin task toolbar — view toggle, search, filters (with Assignee filter)
"use client";

import { Search, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { statusColors, type TeamMember, type TaskPriority, type TaskProject, type TaskStatus } from "./task-data";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";

export type ViewMode = "list" | "board";

interface TaskToolbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus | "all";
  onStatusChange: (value: TaskStatus | "all") => void;
  priorityFilter: TaskPriority | "all";
  onPriorityChange: (value: TaskPriority | "all") => void;
  projectFilter: TaskProject | "all";
  onProjectChange: (value: TaskProject | "all") => void;
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  members: TeamMember[];
}

// Glass-styled dropdown
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const displayLabel =
    value === "all" ? label : options.find((o) => o.value === value)?.label || label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:text-[#1a1a1a] hover:bg-[#e8e5e2] cursor-pointer"
        style={{
          color: open ? "#1a1a1a" : "#4d4d4d",
          backgroundColor: open ? "#e8e5e2" : "rgba(241,239,237,0.45)",
          borderColor: open ? "#aaaaaa" : undefined,
        }}
      >
        {displayLabel}
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{
            color: open ? "#1a1a1a" : "#999",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 min-w-[160px] z-50 rounded-2xl border border-[#dddddd] backdrop-blur-lg shadow-lg p-1"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-full text-[13px] transition-colors cursor-pointer"
              style={{
                color: value === opt.value ? "#1a1a1a" : "#4d4d4d",
                fontWeight: value === opt.value ? 600 : 400,
                backgroundColor:
                  value === opt.value ? "rgba(0,0,0,0.05)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value)
                  e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Mobile filter bottom sheet
function MobileFilterSheet({
  open,
  onClose,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  projectFilter,
  onProjectChange,
  assigneeFilter,
  onAssigneeChange,
  members,
}: {
  open: boolean;
  onClose: () => void;
  statusFilter: TaskStatus | "all";
  onStatusChange: (v: TaskStatus | "all") => void;
  priorityFilter: TaskPriority | "all";
  onPriorityChange: (v: TaskPriority | "all") => void;
  projectFilter: TaskProject | "all";
  onProjectChange: (v: TaskProject | "all") => void;
  assigneeFilter: string;
  onAssigneeChange: (v: string) => void;
  members: TeamMember[];
}) {
  const activeCount = [
    statusFilter !== "all",
    priorityFilter !== "all",
    projectFilter !== "all",
    assigneeFilter !== "all",
  ].filter(Boolean).length;

  function clearAll() {
    onStatusChange("all");
    onPriorityChange("all");
    onProjectChange("all");
    onAssigneeChange("all");
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    backgroundColor: "rgba(255,255,255,0.6)",
    border: "1px solid #dddddd",
    borderRadius: "9999px",
    padding: "0 36px 0 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#1a1a1a",
    outline: "none",
    backdropFilter: "blur(8px)",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23707070' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "6px",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-[#dddddd]"
            style={{
              backgroundColor: "rgba(241,239,237,0.95)",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 36px",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.1)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#dddddd" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
                Filters
              </h3>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button onClick={clearAll} className="text-xs font-medium" style={{ color: "#f3350c" }}>
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2]"
                  style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
                >
                  <X className="h-4 w-4" style={{ color: "#737373" }} />
                </button>
              </div>
            </div>

            {/* Filter selects */}
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>Assignee</label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => onAssigneeChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">All Members</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusChange(e.target.value as TaskStatus | "all")}
                  style={selectStyle}
                >
                  <option value="all">All</option>
                  <option value="todo">{statusColors.todo.label}</option>
                  <option value="in-progress">{statusColors["in-progress"].label}</option>
                  <option value="done">{statusColors.done.label}</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "all")}
                  style={selectStyle}
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Project</label>
                <select
                  value={projectFilter}
                  onChange={(e) => onProjectChange(e.target.value as TaskProject | "all")}
                  style={selectStyle}
                >
                  <option value="all">All</option>
                  <option value="Website">Website</option>
                  <option value="Backend">Backend</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Apply */}
            <button
              onClick={onClose}
              className="w-full mt-5 py-3 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer"
              style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}
            >
              Apply Filters
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TaskToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  projectFilter,
  onProjectChange,
  assigneeFilter,
  onAssigneeChange,
  members,
}: TaskToolbarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFilterCount = [
    statusFilter !== "all",
    priorityFilter !== "all",
    projectFilter !== "all",
    assigneeFilter !== "all",
  ].filter(Boolean).length;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left — View toggle */}
        <GlassPillTabs
          tabs={[
            { label: "List", value: "list" },
            { label: "Board", value: "board" },
          ]}
          activeValue={view}
          onChange={(val) => onViewChange(val as ViewMode)}
          layoutId="admin-task-view-pill"
          variant="subtle"
          size="sm"
          className="shrink-0"
        />

        {/* Right — Search + Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-[260px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "#b6b6b6" }}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-full text-[13px] font-medium outline-none transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
              style={{
                backgroundColor: "rgba(241,239,237,0.45)",
                color: "#1a1a1a",
              }}
            />
          </div>

          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="sm:hidden flex items-center justify-center h-10 w-10 rounded-full transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] shrink-0 relative cursor-pointer"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          >
            <SlidersHorizontal className="h-4 w-4" style={{ color: "#4d4d4d" }} />
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "#f3350c", color: "#ffffff" }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Assignee filter — hidden on mobile */}
          <div className="hidden sm:block">
            <FilterDropdown
              label="Assignee"
              value={assigneeFilter}
              options={[
                { label: "All", value: "all" },
                ...members.map((m) => ({ label: m.name.split(" ")[0], value: m.id })),
              ]}
              onChange={onAssigneeChange}
            />
          </div>

          {/* Status filter */}
          <div className="hidden sm:block">
            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={[
                { label: "All", value: "all" },
                { label: statusColors.todo.label, value: "todo" },
                { label: statusColors["in-progress"].label, value: "in-progress" },
                { label: statusColors.done.label, value: "done" },
              ]}
              onChange={(v) => onStatusChange(v as TaskStatus | "all")}
            />
          </div>

          {/* Priority filter */}
          <div className="hidden sm:block">
            <FilterDropdown
              label="Priority"
              value={priorityFilter}
              options={[
                { label: "All", value: "all" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ]}
              onChange={(v) => onPriorityChange(v as TaskPriority | "all")}
            />
          </div>

          {/* Project filter */}
          <div className="hidden lg:block">
            <FilterDropdown
              label="Project"
              value={projectFilter}
              options={[
                { label: "All", value: "all" },
                { label: "Website", value: "Website" },
                { label: "Backend", value: "Backend" },
                { label: "DevOps", value: "DevOps" },
                { label: "Mobile", value: "Mobile" },
                { label: "Other", value: "Other" },
              ]}
              onChange={(v) => onProjectChange(v as TaskProject | "all")}
            />
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
        priorityFilter={priorityFilter}
        onPriorityChange={onPriorityChange}
        projectFilter={projectFilter}
        onProjectChange={onProjectChange}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={onAssigneeChange}
        members={members}
      />
    </>
  );
}
