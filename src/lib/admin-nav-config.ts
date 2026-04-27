import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Briefcase,
  FileText,
  UserCheck,
} from "lucide-react";

export const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Team",
    href: "/admin/team",
    icon: Users,
  },
  {
    label: "Tasks",
    href: "/admin/tasks",
    icon: CheckSquare,
  },
  {
    label: "HR",
    href: "/admin/hr",
    icon: Briefcase,
  },
  {
    label: "CMS",
    href: "/admin/cms",
    icon: FileText,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UserCheck,
  },
];
