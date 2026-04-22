// Admin task types, mock data, and color tokens
import {
  Globe,
  Server,
  Container,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

// Types
export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "high" | "medium" | "low";
export type TaskProject = "Website" | "Backend" | "DevOps" | "Mobile" | "Other";

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  image?: string;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  project: TaskProject;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  description?: string;
  assigneeId: string;
}

// Dynamic members registered at runtime from API responses
const dynamicMembers: TeamMember[] = [];

export function registerMember(m: TeamMember) {
  if (!dynamicMembers.find((x) => x.id === m.id)) {
    dynamicMembers.push(m);
  }
}

export function getMember(id: string): TeamMember {
  return (
    dynamicMembers.find((m) => m.id === id) ??
    dynamicMembers[0] ?? { id, name: "Unknown", avatar: "?", color: "#999" }
  );
}

// Project color tokens
export const projectColors: Record<
  TaskProject,
  { bg: string; text: string; icon: LucideIcon }
> = {
  Website: { bg: "#dbeafe", text: "#1e40af", icon: Globe },
  Backend: { bg: "#f3e8ff", text: "#7c3aed", icon: Server },
  DevOps: { bg: "#dcfce7", text: "#166534", icon: Container },
  Mobile: { bg: "#fef3c7", text: "#92400e", icon: Smartphone },
  Other: { bg: "#f1efed", text: "#4d4d4d", icon: Globe },
};

// Priority color tokens
export const priorityColors: Record<
  TaskPriority,
  { bg: string; text: string }
> = {
  high: { bg: "#fee2e2", text: "#991b1b" },
  medium: { bg: "#fef3c7", text: "#92400e" },
  low: { bg: "#f1efed", text: "#4d4d4d" },
};

// Status tokens
export const statusColors: Record<
  TaskStatus,
  { dot: string; label: string }
> = {
  todo: { dot: "#dddddd", label: "To Do" },
  "in-progress": { dot: "#f59e0b", label: "In Progress" },
  done: { dot: "#22c55e", label: "Done" },
};

// Shared utility functions
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
}

export function isOverdue(dueDate: string, status: TaskStatus): boolean {
  if (status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export function isToday(dueDate: string): boolean {
  const today = new Date();
  const d = new Date(dueDate);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}
