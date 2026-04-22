// Admin Dashboard Client
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Users,
  CheckSquare,
  CalendarDays,
  Clock,
  Contact,
  ShieldCheck,
} from "lucide-react";
import { ProgressTimeCard } from "@/components/dashboard/progress-time-card";

// Extracted Components
import { StatCard } from "./components/stat-card";
import { TeamPulse } from "./components/team-pulse";
import { RecentActivity } from "./components/recent-activity";
import { AttendanceOverview } from "./components/attendance-overview";
import { PendingLeaves } from "./components/pending-leaves";
import { QuickActions } from "./components/quick-actions";

// Types
interface TeamMemberItem {
  name: string;
  role: string;
  status: string;
  avatar: string;
  image?: string | null;
}

interface PendingLeaveItem {
  id: string;
  name: string;
  avatar: string;
  image?: string | null;
  type: string;
  dates: string;
}

interface AttendanceDay {
  day: string;
  present: number;
  total: number;
  percent: number;
}

interface DashboardData {
  stats: {
    totalEmployees: number;
    activeTasks: number;
    inProgressTasks: number;
    onLeaveToday: number;
    pendingApprovals: number;
    newInquiries: number;
    totalLeads: number;
  };
  teamMembers: TeamMemberItem[];
  pendingLeaves: PendingLeaveItem[];
  attendanceData: AttendanceDay[];
  recentActivity: { name: string; action: string; time: string; type: string }[];
}

interface AdminDashboardClientProps {
  initialData?: DashboardData;
}

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// Format date for header
function formatToday(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const { status, data: sessionData } = useSession();
  const [isLoading, setIsLoading] = useState(!initialData);
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [processingLeave, setProcessingLeave] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (initialData && data) return; // Skip initial fetch if data is already provided

    async function fetchDashboard() {
      if (!initialData) setIsLoading(true);
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json: DashboardData = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch admin dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [status, initialData, data]);

  // Build stat cards from API data
  const stats = data
    ? [
        {
          label: "Total Employees",
          value: data.stats.totalEmployees,
          icon: Users,
          iconColor: "#f3350c",
          iconBg: "rgba(243,53,12,0.1)",
          description: "Active users",
        },
        {
          label: "Active Tasks",
          value: data.stats.activeTasks,
          icon: CheckSquare,
          iconColor: "#ffffff",
          iconBg: "rgba(255,255,255,0.06)",
          description: `${data.stats.inProgressTasks} in progress`,
        },
        {
          label: "On Leave Today",
          value: data.stats.onLeaveToday,
          icon: CalendarDays,
          iconColor: "#f3350c",
          iconBg: "rgba(243,53,12,0.1)",
          description: "Approved leaves",
        },
        {
          label: "Pending Approvals",
          value: data.stats.pendingApprovals,
          icon: Clock,
          iconColor: "#f59e0b",
          iconBg: "rgba(245,158,11,0.1)",
          description: "Leave requests",
        },
        {
          label: "New Inquiries",
          value: data.stats.newInquiries,
          icon: Contact,
          iconColor: "#0ea5e9",
          iconBg: "rgba(14,165,233,0.1)",
          description: "Unread messages",
        },
      ]
    : [];

  // Add Total Clients if available
  if (data && stats.length > 0) {
    stats.push({
      label: "Total Clients",
      value: data.stats.totalLeads,
      icon: Contact,
      iconColor: "#0ea5e9",
      iconBg: "rgba(14,165,233,0.1)",
      description: "CRM Directory",
    });
  }

  // Approve or reject a leave from the dashboard
  async function handleLeaveAction(leaveId: string, action: "approved" | "rejected") {
    setProcessingLeave(leaveId);
    try {
      const res = await fetch(`/api/admin/hr/leaves/${leaveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        console.error("Leave action failed:", err.error);
        return;
      }
      // Remove from list & update pending count
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingLeaves: prev.pendingLeaves.filter((l) => l.id !== leaveId),
          stats: {
            ...prev.stats,
            pendingApprovals: Math.max(0, prev.stats.pendingApprovals - 1),
          },
        };
      });
    } catch (err) {
      console.error("Leave action error:", err);
    } finally {
      setProcessingLeave(null);
    }
  }

  // Loading skeleton
  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div>
          <div className="h-9 w-56 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-80 mt-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[140px] rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
        <div className="h-[380px] rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="h-[380px] rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="h-[380px] rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="h-[340px] rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="h-[340px] rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
        </div>
        <div className="h-[220px] rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
      </div>
    );
  }

  const userRole = sessionData?.user?.role;
  const isActuallySuperAdmin = userRole === "superadmin";

  if (!data) return null;

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[2.2rem] font-bold tracking-tight text-white leading-tight">
              {isActuallySuperAdmin ? "Global Operations" : "Admin Console"}
            </h1>
            {isActuallySuperAdmin && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-white/5 text-white/40 border border-white/10 mt-1 backdrop-blur-md">
                <ShieldCheck size={12} className="text-[#f3350c]" />
                Super User
              </div>
            )}
          </div>
          <p className="text-sm mt-1.5 text-white/40 font-medium">
            {isActuallySuperAdmin 
              ? "Welcome back, Commander. Here's the agency's current pulse." 
              : "Monitor agency health, team efficiency, and operational metrics."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <p className="text-[11px] font-bold tracking-widest uppercase text-white/20">
            System Pulse
          </p>
          <p className="text-[13px] font-medium shrink-0 text-white/50">
            {formatToday()}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat as any} index={i} />
        ))}
      </div>

      {/* Time Tracker */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={cardVariant as any}
      >
        <ProgressTimeCard />
      </motion.div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <TeamPulse members={data.teamMembers} />
        <RecentActivity activities={data.recentActivity} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <AttendanceOverview data={data.attendanceData} />
        <PendingLeaves 
          leaves={data.pendingLeaves} 
          onAction={handleLeaveAction} 
          processingId={processingLeave} 
        />
      </div>

      <QuickActions />
    </div>
  );
}
