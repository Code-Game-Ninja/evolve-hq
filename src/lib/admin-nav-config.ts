import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Briefcase,
  FileText,
  UserCheck,
  Contact,
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
    label: "CRM",
    href: "/admin/crm",
    icon: Contact,
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
