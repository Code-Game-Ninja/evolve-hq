// Admin Dashboard Client
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  CalendarDays,
  Clock,
  ChevronRight,
  UserPlus,
  Plus,
  FolderPlus,
  BarChart3,
  Settings,
  Loader2,
  Contact,
  ShieldCheck,
} from "lucide-react";
import { ProgressTimeCard } from "@/components/dashboard/progress-time-card";

// Types
interface StatItem {
  label: string;
  value: number;
  icon: typeof Users;
  iconColor: string;
  iconBg: string;
  description: string;
}

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

// Count-up hook
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// Animation variants
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

// Config-only — not mock data
const quickActions = [
  { label: "Add Employee", icon: UserPlus, href: "/admin/team" },
  { label: "Create Task", icon: Plus, href: "/admin/tasks" },
  { label: "Manage Projects", icon: FolderPlus, href: "/admin/cms" },
  { label: "View Reports", icon: BarChart3, href: "/admin/hr" },
  { label: "CRM Console", icon: Contact, href: "/admin/crm" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

const statusDot: Record<string, string> = {
  present: "#22c55e",
  leave: "#f59e0b",
  absent: "#ef4444",
};

const activityDot: Record<string, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

function barColor(percent: number) {
  if (percent >= 90) return "#22c55e";
  if (percent >= 70) return "#f59e0b";
  return "#ef4444";
}

// Stat card with premium dark aesthetic
function StatCard({
  stat,
  index,
}: {
  stat: StatItem;
  index: number;
}) {
  const animated = useCountUp(stat.value);
  const Icon = stat.icon;

  return (
    <motion.div
      custom={index + 1}
      initial="hidden"
      animate="visible"
      variants={cardVariant}
      className="relative overflow-hidden backdrop-blur-xl border border-white/10 group hover:border-white/20 transition-all duration-300 shadow-2xl"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderRadius: "24px",
        padding: "24px",
      }}
    >
      <div
        className="mb-4 w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: stat.iconBg }}
      >
        <Icon size={22} style={{ color: stat.iconColor }} />
      </div>
      <p
        className="text-[11px] uppercase font-bold tracking-[0.15em] opacity-40 mb-1"
        style={{ color: "#ffffff" }}
      >
        {stat.label}
      </p>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold tracking-tight text-white">
          {animated}
        </p>
      </div>
      <p className="text-[11px] mt-1.5 opacity-30 font-medium" style={{ color: "#ffffff" }}>
        {stat.description}
      </p>

      {/* Decorative gradient flare */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#f3350c]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
  );
}

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

export function AdminDashboardClient() {
  const { status, data: sessionData } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [processingLeave, setProcessingLeave] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchDashboard() {
      setIsLoading(true);
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
  }, [status]);

  // Build stat cards from API data
  const stats: StatItem[] = data
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
          iconColor: "#0a0a0a",
          iconBg: "rgba(0,0,0,0.06)",
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
      ]    : [];
  
  const teamMembers = data?.teamMembers || [];
  const pendingLeaves = data?.pendingLeaves || [];
  const attendanceData = data?.attendanceData || [];
  const recentActivity = data?.recentActivity || [];

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
            <h1
              className="text-2xl sm:text-[2.2rem] font-bold tracking-tight text-white leading-tight"
            >
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
        <div className="flex flex-col items-end gap-1">
          <p className="text-[13px] font-bold tracking-widest uppercase text-white/20">
            System Pulse
          </p>
          <p className="text-[13px] font-medium shrink-0 text-white/50">
            {formatToday()}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Time Tracker */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={cardVariant}
      >
        <ProgressTimeCard />
      </motion.div>

      {/* Team Overview + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        {/* Team Overview */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[32px] overflow-hidden backdrop-blur-xl border border-white/10 flex flex-col shadow-2xl group/card"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
        >
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Team Pulse</h2>
              <p className="text-[11px] font-medium text-white/30 uppercase tracking-widest mt-0.5">Real-time Presence</p>
            </div>
            <Link
              href="/admin/team"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-[#f3350c] hover:bg-[#f3350c] hover:text-white transition-all duration-300"
            >
              Directory
            </Link>
          </div>

          <div className="px-8 pb-4 flex-1">
            {teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                <Users size={32} className="mb-2" />
                <p className="text-sm">No team members online</p>
              </div>
            ) : (
            <div className="space-y-1">
              {teamMembers.map((member, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3.5 transition-all duration-300 rounded-2xl px-3 -mx-3 hover:bg-white/[0.05] group"
                >
                  {/* Avatar with status ring */}
                  <div className="relative shrink-0">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-white/20 transition-all"
                      />
                    ) : (
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-bold uppercase tracking-tighter shrink-0 transition-all"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.9)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {member.avatar}
                        </div>
                    )}
                    <div
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a] z-10"
                      style={{
                        backgroundColor: statusDot[member.status] || "#444",
                        boxShadow: `0 0 10px ${statusDot[member.status] || "#444"}88`,
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold truncate text-white tracking-tight">
                      {member.name}
                    </p>
                    <p className="text-xs text-white/30 font-medium mt-0.5">
                      {member.role}
                    </p>
                  </div>

                  {/* Status label */}
                  <div className="hidden sm:block">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-white/30"
                      style={{ 
                        color: member.status === 'present' ? '#22c55e' : member.status === 'leave' ? '#f59e0b' : '#ffffff44'
                      }}
                    >
                      {member.status === 'present' ? 'Active' : member.status === 'leave' ? 'On Leave' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          <div
            className="px-8 py-5 mt-auto bg-gradient-to-t from-white/[0.02] to-transparent border-t border-white/5"
          >
            <Link
              href="/admin/team"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              Full Workforce Registry
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity — Timeline Style */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[32px] overflow-hidden backdrop-blur-xl border border-white/10 flex flex-col shadow-2xl"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
        >
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Activity Log</h2>
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-widest mt-0.5">Agency Operations History</p>
          </div>

          <div className="px-8 pb-4 flex-1">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                <Clock size={32} className="mb-2" />
                <p className="text-sm">No recent activities logged</p>
              </div>
            ) : (
            <div className="relative space-y-0 pb-4">
              {/* Vertical timeline line */}
              <div className="absolute left-1 top-2 bottom-6 w-px bg-white/5" />
              
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="relative flex gap-5 py-4 transition-all duration-300 rounded-2xl px-4 -mx-4 group hover:bg-white/[0.04]"
                >
                  {/* Indicator Dot */}
                  <div
                    className="relative z-10 w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: activityDot[item.type] || "#f3350c",
                      boxShadow: `0 0 12px ${activityDot[item.type] || "#f3350c"}66`,
                    }}
                  />
                  
                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] text-white/90 leading-snug">
                        {item.name ? (
                          <><span className="font-bold text-white">{item.name}</span>{" "}{item.action}</>
                        ) : (
                          <span className="font-medium">{item.action}</span>
                        )}
                      </p>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider shrink-0">
                        {item.time}
                      </span>
                    </div>
                    {/* Optional metadata or type tag */}
                    <div className="flex items-center gap-2 mt-1.5">
                       <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                          {item.type || 'system'}
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          <div
            className="px-8 py-5 mt-auto bg-gradient-to-t from-white/[0.02] to-transparent border-t border-white/5"
          >
            <Link
              href="/admin/tasks"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              Full Operational Log
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Pending Leaves + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        {/* Pending Leave Requests */}
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] overflow-hidden backdrop-blur-md border border-white/5 flex flex-col shadow-2xl"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2
              className="text-base font-semibold text-white"
            >
              Pending Leaves
            </h2>
            <span
              className="inline-flex items-center justify-center text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#f59e0b" }}
            >
              {pendingLeaves.length}
            </span>
          </div>

          <div className="px-6 pb-2 space-y-3 flex-1">
            {pendingLeaves.length === 0 ? (
              <div className="flex items-center justify-center h-full py-12">
                <p className="text-sm" style={{ color: "#999" }}>No pending leave requests</p>
              </div>
            ) : (
            pendingLeaves.map((leave, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 border border-white/5"
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {leave.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={leave.image}
                      alt={leave.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {leave.avatar}
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-white"
                    >
                      {leave.name}
                    </p>
                    <p className="text-xs text-white/50">
                      {leave.type}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {leave.dates}
                    </p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleLeaveAction(leave.id, "approved")}
                    disabled={processingLeave === leave.id}
                    className="flex-1 text-xs font-medium text-white py-1.5 rounded-full transition-colors cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#22c55e" }}
                  >
                    {processingLeave === leave.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Approve"}
                  </button>
                  <button
                    onClick={() => handleLeaveAction(leave.id, "rejected")}
                    disabled={processingLeave === leave.id}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-full border border-white/10 text-white/50 transition-colors cursor-pointer hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
            )}
          </div>

          <div className="px-6 py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Link
              href="/admin/hr"
              className="text-[11px] font-bold uppercase tracking-widest text-[#f3350c] hover:opacity-80 transition-opacity"
            >
              View All Requests →
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions — Dark Card */}
        <motion.div
          custom={8}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] p-6 relative overflow-hidden backdrop-blur-lg border"
          style={{
            backgroundColor: "rgba(10,10,10,0.88)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
          }}
        >
          <h2 className="text-base font-semibold text-white mb-4">
            Quick Actions
          </h2>

          <div className="space-y-2">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors group"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.10)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.06)")
                  }
                >
                  <Icon size={16} style={{ color: "#f3350c" }} />
                  <span className="text-sm font-medium text-white flex-1">
                    {action.label}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{ color: "#707070" }}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Attendance Overview — Full Width */}
      <motion.div
        custom={9}
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        className="rounded-[24px] overflow-hidden backdrop-blur-md border border-white/5 shadow-2xl"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2
            className="text-base font-semibold text-white"
          >
            Attendance Overview
          </h2>
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-full border"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            This Week
          </span>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-4">
          {attendanceData.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No attendance data this week</p>
            </div>
          ) : (
          attendanceData.map((day, i) => (
            <div key={i} className="flex items-center gap-4">
              {/* Day label */}
              <span
                className="text-xs font-bold w-10 shrink-0 text-white/40"
              >
                {day.day}
              </span>
              {/* Bar track */}
              <div
                className="flex-1 h-3 rounded-full overflow-hidden bg-white/5"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: barColor(day.percent),
                    boxShadow: `0 0 10px ${barColor(day.percent)}33`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${day.percent}%` }}
                  transition={{
                    delay: 0.6 + i * 0.08,
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                />
              </div>
              {/* Percentage */}
              <span
                className="text-xs font-bold w-12 text-right shrink-0 text-white"
              >
                {day.percent}%
              </span>
              {/* Detail */}
              <span
                className="text-xs hidden sm:inline w-32 shrink-0 text-white/30"
              >
                ({day.present}/{day.total} present)
              </span>
            </div>
          ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
