// CRM navigation config
import {
  LayoutDashboard,
  Users,
  Handshake,
  FileText,
  TrendingUp,
} from "lucide-react";

export const crmNavItems = [
  {
    label: "CRM Dashboard",
    href: "/crm",
    icon: LayoutDashboard,
  },
  {
    label: "Leads",
    href: "/crm/leads",
    icon: TrendingUp,
  },
  {
    label: "Inquiries",
    href: "/crm/inquiries",
    icon: FileText,
  },
  {
    label: "Clients",
    href: "/crm/clients",
    icon: Users,
  },
  {
    label: "Deals",
    href: "/crm/deals",
    icon: Handshake,
  },
];
