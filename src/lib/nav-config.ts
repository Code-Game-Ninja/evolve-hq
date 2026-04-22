// Workspace sidebar navigation config
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  CalendarDays,
  Video,
  MessageSquare,
  Users,
  Database,
  Settings,
} from "lucide-react";

export const workspaceNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "My Attendance",
    href: "/attendance",
    icon: Clock,
  },
  {
    label: "My Leaves",
    href: "/leaves",
    icon: CalendarDays,
  },
  {
    label: "Messages",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    label: "Meetings",
    href: "/meetings",
    icon: Video,
  },
];

export const adminNavItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Global Tasks",
    href: "/admin/tasks",
    icon: CheckSquare,
  },
  {
    label: "CRM Console",
    href: "/admin/crm",
    icon: Database,
  },
  {
    label: "System Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];
