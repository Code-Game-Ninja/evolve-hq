// Leaves client
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Umbrella,
  Stethoscope,
  Award,
  X,
} from "lucide-react";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";

// Types
interface LeaveRecord {
  _id: string;
  type: "casual" | "sick" | "earned";
  fromDate: string;
  toDate: string;
  days: number;
  isHalfDay: boolean;
  halfDayPeriod?: "first" | "second";
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
}

interface LeaveBalance {
  type: "casual" | "sick" | "earned";
  total: number;
  used: number;
  pending: number;
  remaining: number;
}

interface LeaveSummary {
  totalQuota: number;
  totalUsed: number;
  totalPending: number;
  totalRemaining: number;
  upcomingCount: number;
}

// Constants
const TYPE_CONFIG = {
  casual: {
    label: "Casual Leave",
    abbr: "CL",
    color: "#3b82f6",
    bgAlpha: "rgba(59,130,246,0.1)",
    icon: Umbrella,
  },
  sick: {
    label: "Sick Leave",
    abbr: "SL",
    color: "#f59e0b",
    bgAlpha: "rgba(245,158,11,0.1)",
    icon: Stethoscope,
  },
  earned: {
    label: "Earned Leave",
    abbr: "EL",
    color: "#22c55e",
    bgAlpha: "rgba(34,197,94,0.1)",
    icon: Award,
  },
} as const;

const STATUS_CONFIG = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Pending" },
  approved: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Approved" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Rejected" },
  cancelled: { color: "#b6b6b6", bg: "#f1efed", label: "Cancelled" },
} as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Helpers
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateInRange(date: Date, from: Date, to: Date): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const f = new Date(from);
  f.setHours(0, 0, 0, 0);
  const t = new Date(to);
  t.setHours(0, 0, 0, 0);
  return d >= f && d <= t;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Mon=0
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function countWorkingDays(from: Date, to: Date): number {
  let days = 0;
  const current = new Date(from);
  while (current <= to) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  return days;
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

// Animated counter hook
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

// Holidays (admin-editable via Settings later)
const HOLIDAYS: { date: Date; label: string }[] = [];

// Animated summary stat for dark card
function AnimatedSummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  const animated = useCountUp(value);
  return (
    <div>
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color }}>
        {animated}
      </p>
    </div>
  );
}

// Animated balance number for leave type cards
function AnimatedBalance({ remaining, total }: { remaining: number; total: number }) {
  const animated = useCountUp(remaining);
  return (
    <div className="mt-5 text-center">
      <span className="text-[2.5rem] font-bold" style={{ color: "#1a1a1a" }}>
        {animated}
      </span>
      <span className="text-xl ml-1" style={{ color: "#bbb" }}>
        / {total}
      </span>
    </div>
  );
}

// Main Component
export function LeavesClient() {
  const { status } = useSession();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [showAll, setShowAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [leaveYear, setLeaveYear] = useState(2025); // Apr 2025 – Mar 2026
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Form state
  const [formType, setFormType] = useState<"casual" | "sick" | "earned">("casual");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formHalfDay, setFormHalfDay] = useState(false);
  const [formHalfPeriod, setFormHalfPeriod] = useState<"first" | "second">("first");
  const [submitting, setSubmitting] = useState(false);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [summary, setSummary] = useState<LeaveSummary>({
    totalQuota: 0,
    totalUsed: 0,
    totalPending: 0,
    totalRemaining: 0,
    upcomingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaves from API
  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/leaves");
      if (!res.ok) throw new Error("Failed to fetch leaves");
      const data = await res.json();
      setLeaves(data.leaves || []);
      setBalances(data.balances || []);
      setSummary(data.summary || {
        totalQuota: 0, totalUsed: 0, totalPending: 0,
        totalRemaining: 0, upcomingCount: 0,
      });
    } catch (err) {
      console.error("Error fetching leaves:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return leaves
      .filter(
        (l) =>
          new Date(l.fromDate) >= today &&
          ["pending", "approved"].includes(l.status)
      )
      .sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime())
      .slice(0, 3);
  }, [leaves]);

  // Filtered & paginated history
  const filteredLeaves = useMemo(() => {
    let list = leaves;
    if (filter !== "all") list = list.filter((l) => l.status === filter);
    list = [...list].sort(
      (a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
    );
    return showAll ? list : list.slice(0, 5);
  }, [leaves, filter, showAll]);

  const totalFiltered = useMemo(() => {
    if (filter === "all") return leaves.length;
    return leaves.filter((l) => l.status === filter).length;
  }, [leaves, filter]);

  // Calendar days
  const calendarDays = useMemo(
    () => getCalendarDays(calYear, calMonth),
    [calYear, calMonth]
  );

  // Form helpers
  const formDays = useMemo(() => {
    if (!formFrom || !formTo) return 0;
    const workDays = countWorkingDays(new Date(formFrom), new Date(formTo));
    if (formHalfDay && workDays === 1) return 0.5;
    return workDays;
  }, [formFrom, formTo, formHalfDay]);

  // Auto-reset half-day when dates change to multi-day range
  useEffect(() => {
    if (!formFrom || !formTo) return;
    if (countWorkingDays(new Date(formFrom), new Date(formTo)) > 1 && formHalfDay) {
      setFormHalfDay(false);
    }
  }, [formFrom, formTo, formHalfDay]);

  const formBalance = useMemo(() => {
    const b = balances.find((b) => b.type === formType);
    return b ? b.remaining : 0;
  }, [balances, formType]);

  // Handle apply
  const handleApply = async () => {
    if (!formFrom || !formTo || !formReason.trim() || formDays <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          fromDate: new Date(formFrom).toISOString(),
          toDate: new Date(formTo).toISOString(),
          reason: formReason.trim(),
          isHalfDay: formHalfDay,
          halfDayPeriod: formHalfDay ? formHalfPeriod : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to apply leave");
        return;
      }
      await fetchLeaves();
      setShowModal(false);
      setFormType("casual");
      setFormFrom("");
      setFormTo("");
      setFormReason("");
      setFormHalfDay(false);
    } catch (err) {
      console.error("Error applying leave:", err);
      alert("Failed to apply leave. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = async (id: string) => {
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", leaveId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to cancel leave");
        return;
      }
      await fetchLeaves();
    } catch (err) {
      console.error("Error cancelling leave:", err);
      alert("Failed to cancel leave. Please try again.");
    }
  };

  // Ring calc
  const ringRadius = 64;
  const circumference = 2 * Math.PI * ringRadius;
  const ringProgress = summary.totalQuota > 0
    ? summary.totalRemaining / summary.totalQuota
    : 0;
  const ringColor = ringProgress > 0.5 ? "#22c55e" : ringProgress > 0.25 ? "#f59e0b" : "#ef4444";

  // Loading skeleton
  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div className="flex justify-between items-end">
          <div>
            <div className="h-9 w-48 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
            <div className="h-4 w-72 mt-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />
          </div>
          <div className="h-10 w-40 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        </div>
        <div className="h-[220px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          ))}
        </div>
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
          <div className="h-[400px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="h-[400px] rounded-3xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* SECTION 1: Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1
            className="text-2xl sm:text-[2rem] font-semibold leading-tight"
            style={{ color: "#1a1a1a" }}
          >
            My Leaves
          </h1>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            Manage your leave balance, apply and track requests.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Year pill with chevrons */}
          <div
            className="flex items-center gap-1 px-4 py-2.5 rounded-full backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] transition-all duration-200"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          >
            <button
              onClick={() => setLeaveYear((y) => y - 1)}
              className="p-0.5 rounded-full hover:bg-[#e8e5e2] transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} style={{ color: "#888" }} />
            </button>
            <span className="text-[13px] font-semibold min-w-[130px] text-center" style={{ color: "#1a1a1a" }}>
              Apr {leaveYear} – Mar {leaveYear + 1}
            </span>
            <button
              onClick={() => setLeaveYear((y) => y + 1)}
              className="p-0.5 rounded-full hover:bg-[#e8e5e2] transition-colors cursor-pointer"
            >
              <ChevronRight size={14} style={{ color: "#888" }} />
            </button>
          </div>
          {/* Apply button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)]"
            style={{ backgroundColor: "#f3350c" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c82c09")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3350c")}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Apply for Leave</span>
          </button>
        </div>
      </motion.div>

      {/* SECTION 2: Leave Summary (dark accent card) */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 sm:p-8 relative overflow-hidden backdrop-blur-lg border border-[rgba(255,255,255,0.08)]"
          style={{
            backgroundColor: "rgba(10,10,10,0.88)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Balance Ring */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <svg width="160" height="160" viewBox="0 0 160 160" className="w-[120px] h-[120px] md:w-[160px] md:h-[160px]">
                <circle
                  cx="80" cy="80" r={ringRadius}
                  fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"
                />
                <circle
                  cx="80" cy="80" r={ringRadius}
                  fill="none" stroke={ringColor} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - ringProgress)}
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
                <text
                  x="80" y="78" textAnchor="middle"
                  fill="#ffffff" fontSize="40" fontWeight="700"
                  fontFamily="var(--font-sans)"
                >
                  {summary.totalRemaining}
                </text>
                <text
                  x="80" y="98" textAnchor="middle"
                  fill="rgba(255,255,255,0.4)" fontSize="12"
                >
                  of {summary.totalQuota} total
                </text>
              </svg>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <p className="text-sm font-semibold text-white">
                Leave Year: Apr {leaveYear} – Mar {leaveYear + 1}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-5">
                {[
                  { label: "Total Available", value: summary.totalRemaining, color: "#22c55e" },
                  { label: "Total Used", value: summary.totalUsed, color: "#ffffff" },
                  { label: "Pending Requests", value: summary.totalPending, color: "#f59e0b" },
                  { label: "Upcoming", value: summary.upcomingCount, color: "#3b82f6" },
                ].map((stat) => (
                  <AnimatedSummaryStat key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
                ))}
              </div>

              {/* Mini balance pills */}
              <div className="flex flex-wrap gap-2 mt-6">
                {balances.map((b) => (
                  <span
                    key={b.type}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs text-white/60"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: TYPE_CONFIG[b.type].color }}
                    />
                    {TYPE_CONFIG[b.type].abbr}: {b.remaining} left
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECTION 3: Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balances.map((bal, i) => {
          const cfg = TYPE_CONFIG[bal.type];
          const usedPct = bal.total > 0 ? (bal.used / bal.total) * 100 : 0;
          const remainPct = bal.total > 0 ? (bal.remaining / bal.total) * 100 : 0;
          const barColor = remainPct > 50 ? cfg.color : remainPct > 25 ? cfg.color : "#ef4444";

          return (
            <motion.div
              key={bal.type}
              custom={i + 1}
              initial="hidden"
              animate="visible"
              variants={cardVariant}
              className="relative overflow-hidden backdrop-blur-lg border border-[#dddddd]"
              style={{
                backgroundColor: "rgba(241,239,237,0.45)",
                borderRadius: "24px",
                padding: "24px",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
                  {cfg.label}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: cfg.bgAlpha }}
                >
                  <cfg.icon size={16} style={{ color: cfg.color }} />
                </div>
              </div>

              {/* Animated balance display */}
              <AnimatedBalance remaining={bal.remaining} total={bal.total} />

              {/* Progress bar */}
              <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1efed" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${usedPct}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              {/* Stats breakdown */}
              <div className="mt-4 space-y-2">
                {[
                  { label: "Remaining", value: bal.remaining, color: "#1a1a1a", weight: "font-semibold" },
                  { label: "Used", value: bal.used, color: "#737373", weight: "font-normal" },
                  { label: "Pending", value: bal.pending, color: bal.pending > 0 ? "#f59e0b" : "#bbb", weight: "font-normal" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-[13px]">
                    <span style={{ color: "#737373" }}>{row.label}</span>
                    <span className={row.weight} style={{ color: row.color }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SECTION 4: Two-column bento */}
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* 4A: Leave History Table */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariant}>
          <div
            className="rounded-[24px] overflow-hidden h-full backdrop-blur-lg border border-[#dddddd]"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-6 pb-4 gap-3">
              <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
                Leave History
              </h2>
              {/* Filter tabs — reusable glass pill tabs */}
              <GlassPillTabs
                tabs={[
                  { label: "All", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Approved", value: "approved" },
                  { label: "Rejected", value: "rejected" },
                ]}
                activeValue={filter}
                onChange={(val) => { setFilter(val as typeof filter); setShowAll(false); }}
                layoutId="leaveFilterPill"
                variant="subtle"
                size="sm"
              />
            </div>

            {/* Column Headers — desktop only */}
            <div
              className="hidden md:grid px-6 py-3 text-xs uppercase font-medium tracking-wider"
              style={{
                backgroundColor: "rgba(0,0,0,0.03)",
                color: "#737373",
                gridTemplateColumns: "60px 100px 100px 60px 100px 60px",
              }}
            >
              <span>Type</span>
              <span>From</span>
              <span>To</span>
              <span>Days</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {/* Rows */}
            <div className="max-h-[360px] overflow-y-auto">
              {filteredLeaves.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: "#bbb" }}>No leave requests found</p>
                </div>
              ) : (
                filteredLeaves.map((lv) => {
                  const typeCfg = TYPE_CONFIG[lv.type];
                  const statusCfg = STATUS_CONFIG[lv.status];

                  return (
                    <div key={lv._id}>
                      {/* Desktop row */}
                      <div
                        className="hidden md:grid px-6 py-3.5 items-center hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                        style={{
                          gridTemplateColumns: "60px 100px 100px 60px 100px 60px",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                          style={{ backgroundColor: typeCfg.bgAlpha, color: typeCfg.color }}
                        >
                          {typeCfg.abbr}
                        </span>
                        <span className="text-[13px]" style={{ color: "#1a1a1a" }}>
                          {formatDate(lv.fromDate)}
                        </span>
                        <span className="text-[13px]" style={{ color: "#1a1a1a" }}>
                          {formatDate(lv.toDate)}
                        </span>
                        <span className="text-[13px] font-semibold" style={{ color: "#1a1a1a" }}>
                          {lv.days}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: statusCfg.color }}
                          />
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                        <div>
                          {lv.status === "pending" && (
                            <button
                              onClick={() => handleCancel(lv._id)}
                              className="text-[13px] text-[#ef4444] hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mobile card */}
                      <div
                        className="md:hidden px-5 py-4"
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: typeCfg.bgAlpha, color: typeCfg.color }}
                          >
                            {typeCfg.abbr}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: statusCfg.color }}
                            />
                            <span
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-[13px] font-medium" style={{ color: "#1a1a1a" }}>
                          {formatDate(lv.fromDate)} – {formatDate(lv.toDate)}
                          <span className="ml-2 font-semibold">({lv.days} day{lv.days !== 1 ? "s" : ""})</span>
                        </p>
                        {lv.reason && (
                          <p className="text-xs mt-1 line-clamp-1" style={{ color: "#737373" }}>
                            {lv.reason}
                          </p>
                        )}
                        {lv.status === "pending" && (
                          <button
                            onClick={() => handleCancel(lv._id)}
                            className="text-[13px] text-[#ef4444] hover:underline cursor-pointer mt-2"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div
              className="flex items-center justify-center px-6 py-4"
              style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
            >
              {!showAll && totalFiltered > 5 ? (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-[13px] font-medium text-[#f3350c] hover:underline cursor-pointer"
                >
                  Show all ({totalFiltered} requests)
                </button>
              ) : (
                <span className="text-xs" style={{ color: "#707070" }}>
                  Showing {filteredLeaves.length} of {totalFiltered} requests
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* 4B: Upcoming & Calendar */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariant}>
          <div
            className="rounded-[24px] p-6 h-full backdrop-blur-lg border border-[#dddddd]"
            style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          >
            {/* Upcoming Leaves */}
            <h3 className="text-base font-semibold mb-4" style={{ color: "#1a1a1a" }}>
              Upcoming Leaves
            </h3>

            {upcoming.length === 0 ? (
              <p className="text-[13px] text-center py-5" style={{ color: "#bbb" }}>
                No upcoming leaves
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((lv) => {
                  const typeCfg = TYPE_CONFIG[lv.type];
                  const statusCfg = STATUS_CONFIG[lv.status];
                  return (
                    <div
                      key={lv._id}
                      className="rounded-2xl p-3.5 flex items-start gap-3"
                      style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: typeCfg.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                          {typeCfg.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#737373" }}>
                          {formatDate(lv.fromDate)} – {formatDate(lv.toDate)} ({lv.days} day{lv.days !== 1 ? "s" : ""})
                        </p>
                        <span
                          className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1.5"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Divider */}
            <div className="my-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }} />

            {/* Leave Calendar */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a1a1a" }}>
                Leave Calendar
              </h3>

              {/* Month nav */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
                    else setCalMonth((m) => m - 1);
                  }}
                  className="p-1 rounded-full hover:bg-[#e8e5e2] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} style={{ color: "#888" }} />
                </button>
                <span className="text-[13px] font-semibold" style={{ color: "#1a1a1a" }}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
                    else setCalMonth((m) => m + 1);
                  }}
                  className="p-1 rounded-full hover:bg-[#e8e5e2] transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} style={{ color: "#888" }} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <div key={d} className="text-[11px] text-center py-1" style={{ color: "#bbb" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="w-full aspect-square" />;
                  }

                  const today = isSameDay(day, new Date());
                  const isWknd = day.getDay() === 0 || day.getDay() === 6;
                  const isPast = day < new Date() && !today;

                  // Check if this day has approved/pending leave
                  const leaveForDay = leaves.find(
                    (l) =>
                      ["approved", "pending"].includes(l.status) &&
                      isDateInRange(day, new Date(l.fromDate), new Date(l.toDate))
                  );

                  // Check if holiday
                  const holiday = HOLIDAYS.find((h) => isSameDay(h.date, day));

                  let cellBg = "transparent";
                  let cellColor = "#1a1a1a";
                  let cellBorder = "none";

                  if (today) {
                    cellBg = "#0a0a0a";
                    cellColor = "#ffffff";
                  } else if (holiday) {
                    cellBg = "rgba(239,68,68,0.08)";
                    cellColor = "#ef4444";
                  } else if (leaveForDay) {
                    const lTypeCfg = TYPE_CONFIG[leaveForDay.type];
                    if (leaveForDay.status === "approved") {
                      cellBg = lTypeCfg.bgAlpha.replace("0.1", "0.15");
                      cellColor = lTypeCfg.color;
                    } else {
                      // Pending — dashed border
                      cellBorder = `1.5px dashed ${lTypeCfg.color}`;
                      cellColor = lTypeCfg.color;
                    }
                  } else if (isWknd) {
                    cellColor = "#bbb";
                  } else if (isPast) {
                    cellColor = "#bbb";
                  }

                  return (
                    <div
                      key={day.toISOString()}
                      className="w-full aspect-square flex items-center justify-center rounded-lg text-xs cursor-default hover:bg-[rgba(0,0,0,0.03)] transition-colors"
                      style={{
                        backgroundColor: cellBg,
                        color: cellColor,
                        border: cellBorder,
                        fontWeight: today ? 700 : 400,
                        borderRadius: today ? "9999px" : "8px",
                      }}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3">
                {(["casual", "sick", "earned"] as const).map((t) => (
                  <div key={t} className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: TYPE_CONFIG[t].color }}
                    />
                    <span className="text-[11px]" style={{ color: "#737373" }}>
                      {TYPE_CONFIG[t].abbr}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                  <span className="text-[11px]" style={{ color: "#737373" }}>Holiday</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* APPLY MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) setShowModal(false);
            }}
          >

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-[480px] backdrop-blur-xl border border-[#dddddd]"
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
                  Apply for Leave
                </h2>
                <button
                  onClick={() => !submitting && setShowModal(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
                  style={{
                    backgroundColor: "rgba(241,239,237,0.45)",
                  }}
                >
                  <X className="h-4 w-4" style={{ color: "#737373" }} />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-5">
                {/* Leave Type */}
                <div>
                  <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1a1a1a" }}>
                    Leave Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as typeof formType)}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 cursor-pointer focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    style={{
                      backgroundColor: "#f8f7f3",
                      border: "1.5px solid #f1efed",
                      color: "#1a1a1a",
                    }}
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="earned">Earned Leave</option>
                  </select>
                </div>

                {/* From Date */}
                <div>
                  <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1a1a1a" }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={formFrom}
                    onChange={(e) => setFormFrom(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    style={{
                      backgroundColor: "#f8f7f3",
                      border: "1.5px solid #f1efed",
                      color: formFrom ? "#1a1a1a" : "#bbb",
                    }}
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1a1a1a" }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={formTo}
                    onChange={(e) => setFormTo(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    style={{
                      backgroundColor: "#f8f7f3",
                      border: "1.5px solid #f1efed",
                      color: formTo ? "#1a1a1a" : "#bbb",
                    }}
                  />
                </div>

                {/* Duration */}
                {formFrom && formTo && (
                  <div>
                    <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1a1a1a" }}>
                      Duration
                    </label>
                    <p className="text-sm font-semibold" style={{ color: formDays > 0 ? "#1a1a1a" : "#ef4444" }}>
                      {formDays > 0
                        ? `${formDays} day${formDays !== 1 ? "s" : ""}`
                        : "Invalid date range"}
                    </p>
                  </div>
                )}

                {/* Half day toggle (only for 1-day leave) */}
                {formDays === 1 && !formHalfDay && (
                  <div>
                    <button
                      onClick={() => setFormHalfDay(true)}
                      className="text-[13px] font-medium text-[#f3350c] hover:underline cursor-pointer"
                    >
                      Apply for half day instead?
                    </button>
                  </div>
                )}
                {formHalfDay && (
                  <div>
                    <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1a1a1a" }}>
                      Half Day
                    </label>
                    <div className="flex gap-2">
                      {(["first", "second"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFormHalfPeriod(p)}
                          className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer"
                          style={{
                            backgroundColor: formHalfPeriod === p ? "#0a0a0a" : "#f8f7f3",
                            color: formHalfPeriod === p ? "#ffffff" : "#999",
                            border: formHalfPeriod === p ? "none" : "1.5px solid #f1efed",
                          }}
                        >
                          {p === "first" ? "First half" : "Second half"}
                        </button>
                      ))}
                      <button
                        onClick={() => setFormHalfDay(false)}
                        className="text-xs text-[#737373] hover:text-[#1a1a1a] cursor-pointer ml-1"
                      >
                        Full day
                      </button>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1a1a1a" }}>
                    Reason
                  </label>
                  <textarea
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="Briefly describe the reason..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    style={{
                      backgroundColor: "#f8f7f3",
                      border: "1.5px solid #f1efed",
                      color: "#1a1a1a",
                    }}
                  />
                </div>

                {/* Balance info */}
                <p className="text-xs" style={{ color: formBalance <= 0 ? "#ef4444" : "#999" }}>
                  {formBalance > 0
                    ? `Available balance: ${formBalance} ${TYPE_CONFIG[formType].abbr} remaining`
                    : `Insufficient balance (0 ${TYPE_CONFIG[formType].abbr} remaining)`}
                </p>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 mt-7">
                <button
                  onClick={() => !submitting && setShowModal(false)}
                  className="h-10 px-6 rounded-full text-sm font-medium border border-[#dddddd] hover:bg-[#f1efed] transition-all duration-200 cursor-pointer"
                  style={{ color: "#737373" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={submitting || !formFrom || !formTo || !formReason.trim() || formDays <= 0 || formBalance <= 0}
                  className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)]"
                  style={{ backgroundColor: "#f3350c" }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#c82c09"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f3350c"; }}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
