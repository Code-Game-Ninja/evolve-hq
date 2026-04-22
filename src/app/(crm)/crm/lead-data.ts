// Lead data types and helpers
export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type LeadPriority = "high" | "medium" | "low";

export interface LeadActivity {
  id?: string;
  type: "status_change" | "note_added" | "contacted" | "system";
  content: string;
  performedBy: {
    id: string;
    name: string;
    image?: string;
  } | string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  value: number;
  source?: string;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        image?: string;
      };
  notes?: string;
  tags: string[];
  activities?: LeadActivity[];
  lastContactedAt?: string;
  createdAt: string;
}

export const leadStatusColors: Record<LeadStatus, { label: string; bg: string; text: string; dot: string }> = {
  new: { label: "New", bg: "#fef3f2", text: "#b42318", dot: "#f3350c" },
  contacted: { label: "Contacted", bg: "#fdf2fa", text: "#c11574", dot: "#c11574" },
  qualified: { label: "Qualified", bg: "#ecfdf3", text: "#027a48", dot: "#12b76a" },
  proposal: { label: "Proposal", bg: "#eff8ff", text: "#175cd3", dot: "#2e90fa" },
  negotiation: { label: "Negotiation", bg: "#fff9f2", text: "#b93815", dot: "#f79009" },
  won: { label: "Won", bg: "#ecfdf3", text: "#027a48", dot: "#12b76a" },
  lost: { label: "Lost", bg: "#f2f4f7", text: "#344054", dot: "#667085" },
};

export const leadPriorityColors: Record<LeadPriority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export const statusConfig = leadStatusColors;
export const priorityConfig: Record<LeadPriority, { label: string; color: string }> = {
  high: { label: "High", color: "#ef4444" },
  medium: { label: "Medium", color: "#f59e0b" },
  low: { label: "Low", color: "#10b981" },
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
