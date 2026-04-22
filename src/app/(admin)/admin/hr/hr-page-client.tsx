// Admin HR page — tabs: Attendance Reports, Leave Approvals
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import {
  Clock,
  CalendarDays,
  Headphones,
  Users,
  UserCheck,
  UserX,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Check,
  CheckCircle2,
  XCircle,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Types
type AttendanceStatus =
  | "present"
  | "active"
  | "late"
  | "absent"
  | "on-leave"
  | "wfh"
  | "half-day";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
type LeaveType = "CL" | "SL" | "EL" | "WFH" | "CO";

interface Employee {
  id: string;
  name: string;
  initials: string;
  image?: string;
  position: string;
  department: string;
}

interface AttendanceRecord {
  id: string;
  employee: Employee;
  clockIn: string | null;
  clockOut: string | null;
  breakMin: number | null;
  totalHours: string | null;
  totalMin: number;
  status: AttendanceStatus;
  source?: string;
}

interface LeaveRequest {
  id: string;
  employee: Employee;
  type: LeaveType;
  typeLabel: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  appliedOn: string;
  status: LeaveStatus;
  remainingBalance: string;
}

interface LeaveBalance {
  employee: Employee;
  cl: { used: number; pending: number; total: number };
  sl: { used: number; pending: number; total: number };
  el: { used: number; pending: number; total: number };
}

interface DeptSummary {
  name: string;
  present: number;
  total: number;
}

interface WeekDay {
  label: string;
  present: number;
  late: number;
  absent: number;
}

// Animation
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

// Animated counter
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    if (from === target) return;
    const startTime = performance.now();
    let rafId: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return value;
}

// Leave type mapping (DB values → frontend labels)
const leaveTypeLabel: Record<string, string> = { casual: "CL", sick: "SL", earned: "EL" };
const leaveTypeName: Record<string, string> = { casual: "Casual Leave", sick: "Sick Leave", earned: "Earned Leave" };

// Map raw API leave item → LeaveRequest shape
function mapApiLeave(item: Record<string, unknown>): LeaveRequest {
  const user = (item.userId as Record<string, string>) || {};
  const name = user.name || "Unknown";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const typeKey = (item.type as string) || "";
  const typeCode = (leaveTypeLabel[typeKey] || typeKey.toUpperCase().slice(0, 2)) as LeaveType;
  const fmt = (d: unknown) =>
    d
      ? new Date(d as string).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })
      : "";
  return {
    id: (item.id as string) || (item._id as string) || "",
    employee: {
      id: user._id || "",
      name,
      initials,
      image: user.image || undefined,
      position: user.role || "",
      department: user.role || "",
    },
    type: typeCode,
    typeLabel: leaveTypeName[typeKey] || typeKey,
    from: fmt(item.fromDate),
    to: fmt(item.toDate),
    days: (item.days as number) || 1,
    reason: (item.reason as string) || "",
    appliedOn: fmt(item.createdAt),
    status: (item.status as LeaveStatus) || "pending",
    remainingBalance: "",
  };
}

// Build leave balances from fetched history (approved + pending)
const LEAVE_TOTAL = 4; // Default quota per type per year
function buildLeaveBalances(all: LeaveRequest[]): LeaveBalance[] {
  const map: Record<string, { emp: Employee; cl: number; sl: number; el: number; clP: number; slP: number; elP: number }> = {};
  for (const l of all) {
    const uid = l.employee.id;
    if (!map[uid]) map[uid] = { emp: l.employee, cl: 0, sl: 0, el: 0, clP: 0, slP: 0, elP: 0 };
    if (l.status === "approved") {
      if (l.type === "CL") map[uid].cl += l.days;
      else if (l.type === "SL") map[uid].sl += l.days;
      else if (l.type === "EL") map[uid].el += l.days;
    } else if (l.status === "pending") {
      if (l.type === "CL") map[uid].clP += l.days;
      else if (l.type === "SL") map[uid].slP += l.days;
      else if (l.type === "EL") map[uid].elP += l.days;
    }
  }
  return Object.values(map).map(({ emp, cl, sl, el, clP, slP, elP }) => ({
    employee: emp,
    cl: { used: cl, pending: clP, total: LEAVE_TOTAL },
    sl: { used: sl, pending: slP, total: LEAVE_TOTAL },
    el: { used: el, pending: elP, total: LEAVE_TOTAL },
  }));
}

// Status badge configs
const attendanceStatusConfig: Record<
  AttendanceStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  present: { label: "Present", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  active: { label: "Active", dot: "#f3350c", bg: "rgba(243,53,12,0.1)", text: "#f3350c" },
  late: { label: "Late", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  absent: { label: "Absent", dot: "#ef4444", bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
  "on-leave": { label: "On Leave", dot: "#3b82f6", bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  wfh: { label: "WFH", dot: "#3b82f6", bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  "half-day": { label: "Half Day", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

const leaveStatusConfig: Record<
  LeaveStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending: { label: "Pending", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  approved: { label: "Approved", dot: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  rejected: { label: "Rejected", dot: "#ef4444", bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
  cancelled: { label: "Cancelled", dot: "#b6b6b6", bg: "#f1efed", text: "#b6b6b6" },
};

const leaveTypeConfig: Record<LeaveType, { bg: string; text: string }> = {
  CL: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  SL: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  EL: { bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
  WFH: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  CO: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
};

// Tab config
const tabs = [
  { label: "Attendance", value: "attendance" },
  { label: "Leaves", value: "leaves" },
];

// Shared badge component
function StatusBadge({
  dot,
  bg,
  text,
  label,
  pulse,
}: {
  dot: string;
  bg: string;
  text: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: bg, color: text }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full${pulse ? " animate-pulse" : ""}`}
        style={{ backgroundColor: dot }}
      />
      {label}
    </span>
  );
}

// Shared avatar circle
function AvatarCircle({
  initials,
  size = 36,
  image,
}: {
  initials: string;
  size?: number;
  image?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={initials}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: "#f1efed",
        color: "#707070",
      }}
    >
      {initials}
    </div>
  );
}

// Stat card
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  description,
  index,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description?: string;
  index: number;
}) {
  const animated = useCountUp(value);
  return (
    <motion.div
      custom={index + 1}
      initial="hidden"
      animate="visible"
      variants={cardVariant}
      className="relative overflow-hidden backdrop-blur-lg border border-[#dddddd]"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        borderRadius: "24px",
        padding: "20px 24px",
      }}
    >
      <div
        className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <p
        className="text-xs uppercase font-medium tracking-wider"
        style={{ color: "#737373" }}
      >
        {label}
      </p>
      <p className="text-[2rem] sm:text-[3rem] font-bold mt-1 leading-tight" style={{ color: "#1a1a1a" }}>
        {animated}
      </p>
      {description && (
        <p className="text-xs mt-0.5" style={{ color: "#bbb" }}>
          {description}
        </p>
      )}
    </motion.div>
  );
}

// Main component
export function HRPageClient({ initialData }: { initialData: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "attendance";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
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
            HR
          </h1>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            Attendance reports and leave approvals
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <GlassPillTabs
          tabs={tabs}
          activeValue={activeTab}
          onChange={handleTabChange}
          layoutId="admin-hr-tabs"
          variant="subtle"
          size="sm"
        />
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {activeTab === "attendance" && <AttendanceTab initialData={initialData.attendance} />}
        {activeTab === "leaves" && <LeavesTab initialData={initialData.leaves} />}
      </motion.div>
    </div>
  );
}

// ── Attendance Tab ──
function AttendanceTab({ initialData }: { initialData?: any[] }) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  // Initial transform function
  const transformAttendance = useCallback((items: any[]) => {
    return items.map((item: any) => {
      const user = item.userId || {};
      const name = user.name || "Unknown";
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const role = user.role || "employee";
      const fmtTime = (d: any) =>
        d
          ? new Date(d).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Kolkata",
            })
          : null;
      const totalMin = item.duration || 0;
      const hours = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      const totalHours = totalMin > 0 ? `${hours}h ${mins}m` : null;

      let breakMin = 0;
      const logs = item.logs || [];
      if (logs.length >= 2) {
        const firstIn = new Date(logs[0].time).getTime();
        const lastLog = logs[logs.length - 1];
        const endTime = lastLog.type === "out" ? new Date(lastLog.time).getTime() : Date.now();
        const totalElapsedMs = endTime - firstIn;
        const totalWorkedMs = totalMin * 60000;
        breakMin = Math.max(0, Math.round((totalElapsedMs - totalWorkedMs) / 60000));
      }

      return {
        id: item.id || item._id || "",
        employee: { id: user._id || "", name, initials, image: user.image || undefined, position: role, department: role },
        clockIn: fmtTime(item.clockIn),
        clockOut: fmtTime(item.clockOut),
        breakMin: breakMin || null,
        totalHours,
        totalMin,
        status: (item.status as AttendanceStatus) || "absent",
        source: (item.source as string) || undefined,
      };
    });
  }, []);

  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(initialData ? transformAttendance(initialData) : []);
  const [deptSummaryData, setDeptSummaryData] = useState<DeptSummary[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [weeklyChartData, setWeeklyChartData] = useState<{ weekLabel: string; days: WeekDay[] }[]>([]);

  // Fetch today's attendance from API
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Build IST today boundaries
      const IST_MS = 5.5 * 60 * 60 * 1000;
      const now = new Date();
      const istNow = new Date(now.getTime() + IST_MS);
      const startOfDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST_MS);
      const endOfDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 23, 59, 59, 999) - IST_MS);
      const res = await fetch(`/api/admin/hr/attendance?page=1&limit=50&from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: AttendanceRecord[] = (data.items || []).map(
        (item: Record<string, unknown>) => {
          const user = (item.userId as Record<string, string>) || {};
          const name = user.name || "Unknown";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const role = user.role || "employee";
          const fmtTime = (d: unknown) =>
            d
              ? new Date(d as string).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                })
              : null;
          const totalMin = (item.duration as number) || 0;
          const hours = Math.floor(totalMin / 60);
          const mins = totalMin % 60;
          const totalHours = totalMin > 0 ? `${hours}h ${mins}m` : null;

          // Calculate break minutes from logs if available
          let breakMin = 0;
          const logs = (item.logs as any[]) || [];
          if (logs.length >= 2) {
            const firstIn = new Date(logs[0].time).getTime();
            const lastLog = logs[logs.length - 1];
            const endTime = lastLog.type === "out" ? new Date(lastLog.time).getTime() : Date.now();
            const totalElapsedMs = endTime - firstIn;
            const totalWorkedMs = totalMin * 60000;
            breakMin = Math.max(0, Math.round((totalElapsedMs - totalWorkedMs) / 60000));
          }

          return {
            id: (item.id as string) || (item._id as string) || "",
            employee: { id: user._id || "", name, initials, image: user.image || undefined, position: role, department: role },
            clockIn: fmtTime(item.clockIn),
            clockOut: fmtTime(item.clockOut),
            breakMin: breakMin || null,
            totalHours,
            totalMin,
            status: (item.status as AttendanceStatus) || "absent",
            source: (item.source as string) || undefined,
          };
        }
      );
      setAttendanceList(items);
      // Derive dept summary by role
      const roleMap: Record<string, { present: number; total: number }> = {};
      for (const rec of items) {
        const dept = rec.employee.department;
        if (!roleMap[dept]) roleMap[dept] = { present: 0, total: 0 };
        roleMap[dept].total++;
        if (rec.status === "present" || rec.status === "active" || rec.status === "late") {
          roleMap[dept].present++;
        }
      }
      setDeptSummaryData(Object.entries(roleMap).map(([n, v]) => ({ name: n, ...v })));
      // Fetch weekly chart data
      try {
        const weeklyRes = await fetch("/api/admin/hr/attendance/weekly?weeks=3");
        if (weeklyRes.ok) {
          const weeklyJson = await weeklyRes.json();
          setWeeklyChartData(weeklyJson.weeks || []);
        }
      } catch {
        // Non-critical — chart stays empty
      }
    } catch {
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Stats (derived from fetched data)
  const totalEmp = attendanceList.length;
  const presentCount = attendanceList.filter(
    (r) => r.status === "present" || r.status === "active"
  ).length;
  const lateCount = attendanceList.filter((r) => r.status === "late").length;
  const absentCount = attendanceList.filter((r) => r.status === "absent").length;

  const attendanceStats = [
    { label: "Total Employees", value: totalEmp, icon: Users, iconBg: "rgba(243,53,12,0.1)", iconColor: "#f3350c", description: `${deptSummaryData.length} departments` },
    { label: "Present Today", value: presentCount, icon: UserCheck, iconBg: "rgba(34,197,94,0.1)", iconColor: "#22c55e", description: totalEmp > 0 ? `${Math.round((presentCount / totalEmp) * 100)}% attendance` : "—" },
    { label: "Late Today", value: lateCount, icon: Clock, iconBg: "rgba(245,158,11,0.1)", iconColor: "#f59e0b", description: lateCount > 0 ? "Needs attention" : "All on time" },
    { label: "Absent Today", value: absentCount, icon: UserX, iconBg: "rgba(239,68,68,0.1)", iconColor: "#ef4444", description: absentCount > 0 ? "Incl. on leave" : "Full attendance" },
  ];

  // Filter + sort
  const filtered = useMemo(() => {
    let data = [...attendanceList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.employee.name.toLowerCase().includes(q) ||
          r.employee.position.toLowerCase().includes(q) ||
          r.employee.department.toLowerCase().includes(q)
      );
    }
    if (sortCol) {
      data.sort((a, b) => {
        let va = "",
          vb = "";
        if (sortCol === "name") {
          va = a.employee.name;
          vb = b.employee.name;
        } else if (sortCol === "status") {
          va = a.status;
          vb = b.status;
        } else if (sortCol === "clockIn") {
          va = a.clockIn || "zzz";
          vb = b.clockIn || "zzz";
        } else if (sortCol === "hours") {
          return sortDir === "asc" ? a.totalMin - b.totalMin : b.totalMin - a.totalMin;
        }
        const cmp = va.localeCompare(vb);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [attendanceList, search, sortCol, sortDir]);

  function toggleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronDown size={12} style={{ color: "#b6b6b6" }} />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} style={{ color: "#1a1a1a" }} />
    ) : (
      <ChevronDown size={12} style={{ color: "#1a1a1a" }} />
    );
  }

  // Hours color
  function hoursColor(h: string | null) {
    if (!h) return "#b6b6b6";
    const num = parseInt(h);
    if (num >= 8) return "#22c55e";
    if (num >= 6) return "#1a1a1a";
    return "#f59e0b";
  }

  return (
    <div className="space-y-5">
      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px]" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />
          ))}
        </div>
      )}
      {/* Error state */}
      {error && (
        <div className="rounded-[24px] p-6 text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)" }}>
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
          <button onClick={fetchAttendance} className="mt-2 text-sm underline" style={{ color: "#ef4444" }}>Retry</button>
        </div>
      )}
      {!loading && !error && (
        <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {attendanceStats.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* Team attendance table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd] flex flex-col"
        style={{
          backgroundColor: "rgba(241,239,237,0.45)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
              Today&apos;s Team Attendance
            </h2>
            <span className="text-sm font-medium" style={{ color: "#707070" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
            </span>
          </div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "#b6b6b6" }}
              />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-full text-[13px] font-medium outline-none transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                style={{
                  backgroundColor: "rgba(241,239,237,0.45)",
                  color: "#1a1a1a",
                }}
              />
            </div>
            <button
              className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
              style={{
                color: "#4d4d4d",
                backgroundColor: "rgba(241,239,237,0.45)",
              }}
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Table header — desktop only */}
        <div
          className="hidden lg:grid items-center px-6 py-3 text-[11px] uppercase font-semibold tracking-[0.05em] select-none"
          style={{
            color: "#707070",
            backgroundColor: "#f8f7f3",
            gridTemplateColumns: "2fr 100px 100px 80px 100px 100px 40px",
          }}
        >
          <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("name")}>
            Employee <SortIcon col="name" />
          </button>
          <button className="flex items-center gap-1" onClick={() => toggleSort("clockIn")}>
            Clock In <SortIcon col="clockIn" />
          </button>
          <span>Clock Out</span>
          <span>Break</span>
          <button className="flex items-center gap-1" onClick={() => toggleSort("hours")}>
            Hours <SortIcon col="hours" />
          </button>
          <button className="flex items-center gap-1" onClick={() => toggleSort("status")}>
            Status <SortIcon col="status" />
          </button>
          <span />
        </div>

        {/* Table rows — desktop */}
        <div className="hidden lg:block">
          {filtered.map((row, i) => {
            const sCfg = attendanceStatusConfig[row.status];
            return (
              <div
                key={row.id || `${row.employee.id}-${i}`}
                className="grid items-center px-6 py-3.5 transition-colors hover:bg-[rgba(0,0,0,0.02)] group cursor-default"
                style={{
                  gridTemplateColumns: "2fr 100px 100px 80px 100px 100px 40px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}
              >
                {/* Employee */}
                <div className="flex items-center gap-3">
                  <AvatarCircle initials={row.employee.initials} image={row.employee.image} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                      {row.employee.name}
                    </p>
                    <p className="text-xs" style={{ color: "#707070" }}>
                      {row.employee.position}
                    </p>
                  </div>
                </div>
                {/* Clock In */}
                <span
                  className="text-[13px] font-mono"
                  style={{
                    color: row.status === "late" ? "#f59e0b" : row.clockIn ? "#1a1a1a" : "#b6b6b6",
                    fontWeight: row.status === "late" ? 600 : 400,
                  }}
                >
                  {row.clockIn || "—"}
                </span>
                {/* Clock Out */}
                <span className="text-[13px] font-mono">
                  {row.clockOut ? (
                    <span style={{ color: "#1a1a1a" }}>{row.clockOut}</span>
                  ) : row.status === "active" ? (
                    <StatusBadge {...attendanceStatusConfig.active} pulse />
                  ) : (
                    <span style={{ color: "#b6b6b6" }}>—</span>
                  )}
                </span>
                {/* Break */}
                <span
                  className="text-xs font-mono"
                  style={{ color: row.breakMin != null ? "#707070" : "#b6b6b6" }}
                >
                  {row.breakMin != null ? `${row.breakMin}m` : "—"}
                </span>
                {/* Hours */}
                <span
                  className="text-sm font-mono font-semibold inline-flex items-center gap-1"
                  style={{ color: hoursColor(row.totalHours) }}
                >
                  {row.totalHours || "—"}
                  {row.source === "discord" && (
                    <span title="Tracked via Discord voice channel">
                      <Headphones className="w-3.5 h-3.5 text-indigo-500" />
                    </span>
                  )}
                </span>
                {/* Status */}
                <StatusBadge {...sCfg} pulse={row.status === "active"} />
                {/* Detail CTA */}
                <button
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 sm:opacity-0"
                  style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
                  onClick={(e) => { e.stopPropagation(); setDetailEmployee(row.employee); }}
                  title="View details"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)"; }}
                >
                  <Eye size={14} style={{ color: "#4d4d4d" }} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Table rows — mobile cards */}
        <div className="lg:hidden px-4 py-3 space-y-2">
          {filtered.map((row, i) => {
            const sCfg = attendanceStatusConfig[row.status];
            return (
              <div
                key={row.id || `${row.employee.id}-${i}`}
                className="rounded-2xl p-3 shadow-sm cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.01)]"
                style={{ backgroundColor: "#ffffff" }}
                onClick={() => setDetailEmployee(row.employee)}
              >
                {/* Top: Avatar + Name + Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AvatarCircle initials={row.employee.initials} size={32} image={row.employee.image} />
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "#1a1a1a" }}>
                        {row.employee.name}
                      </p>
                      <p className="text-[11px]" style={{ color: "#707070" }}>
                        {row.employee.position}
                      </p>
                    </div>
                  </div>
                  <StatusBadge {...sCfg} pulse={row.status === "active"} />
                </div>
                {/* Bottom: Clock In, Clock Out, Hours */}
                <div className="flex items-center gap-4 mt-2.5 ml-[42px]">
                  <div>
                    <p className="text-[10px] uppercase font-medium tracking-wide" style={{ color: "#737373" }}>In</p>
                    <p className="text-xs font-mono font-medium" style={{ color: row.status === "late" ? "#f59e0b" : row.clockIn ? "#1a1a1a" : "#b6b6b6" }}>
                      {row.clockIn || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-medium tracking-wide" style={{ color: "#737373" }}>Out</p>
                    <p className="text-xs font-mono font-medium" style={{ color: row.clockOut ? "#1a1a1a" : "#b6b6b6" }}>
                      {row.clockOut || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-medium tracking-wide" style={{ color: "#737373" }}>Hours</p>
                    <p className="text-xs font-mono font-semibold inline-flex items-center gap-1" style={{ color: hoursColor(row.totalHours) }}>
                      {row.totalHours || "—"}
                      {row.source === "discord" && (
                        <span title="Tracked via Discord voice channel">
                          <Headphones className="w-3 h-3 text-indigo-500" />
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-center text-xs"
          style={{ color: "#707070", borderTop: "1px solid rgba(0,0,0,0.05)" }}
        >
          Showing {filtered.length} of {attendanceList.length} employees
        </div>
      </motion.div>

      {/* Bento row — Department summary + Weekly chart */}
      <div className="grid lg:grid-cols-2 gap-5">
        <DepartmentSummary data={deptSummaryData} />
        <WeeklyChart weeks={weeklyChartData} total={totalEmp} />
      </div>

      {/* Employee detail sheet */}
      <AnimatePresence>
        {detailEmployee && (
          <EmployeeDetailSheet
            employee={detailEmployee}
            onClose={() => setDetailEmployee(null)}
          />
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}

// Department Summary Card
function DepartmentSummary({ data }: { data: DeptSummary[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd]"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        padding: "24px",
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
        Department Summary
      </h2>
      <div className="mt-5 space-y-4">
        {data.map((d) => {
          const pct = d.total > 0 ? (d.present / d.total) * 100 : 0;
          const barColor = pct === 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
          return (
            <div key={d.name} className="flex items-center gap-4">
              <span
                className="text-sm font-medium w-28 shrink-0"
                style={{ color: "#1a1a1a" }}
              >
                {d.name}
              </span>
              <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#f1efed" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
                />
              </div>
              <span className="text-[13px] w-10 text-right" style={{ color: "#707070" }}>
                {d.present}/{d.total}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Weekly Attendance Chart (simple CSS bar chart)
function WeeklyChart({ weeks, total }: { weeks: { weekLabel: string; days: WeekDay[] }[]; total: number }) {
  const [weekIdx, setWeekIdx] = useState(Math.max(0, weeks.length - 1));

  // Update weekIdx when weeks data changes (loads from API)
  useEffect(() => {
    if (weeks.length > 0) setWeekIdx(weeks.length - 1);
  }, [weeks.length]);

  // Handle empty weeks data
  if (weeks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd] flex items-center justify-center"
        style={{ backgroundColor: "rgba(241,239,237,0.45)", padding: "24px", minHeight: "200px" }}
      >
        <p className="text-sm" style={{ color: "#bbb" }}>No weekly attendance data yet</p>
      </motion.div>
    );
  }

  const current = weeks[weekIdx];
  const data = current.days;
  const maxVal = total;

  const canPrev = weekIdx > 0;
  const canNext = weekIdx < weeks.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd]"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        padding: "24px",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
            Weekly Attendance
          </h2>
          <p className="text-xs mt-1" style={{ color: "#707070" }}>
            {current.weekLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{ backgroundColor: canPrev ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.02)" }}
            onClick={() => canPrev && setWeekIdx((i) => i - 1)}
            disabled={!canPrev}
            onMouseEnter={(e) => { if (canPrev) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = canPrev ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.02)"; }}
          >
            <ChevronLeft size={14} style={{ color: canPrev ? "#4d4d4d" : "#cccccc" }} />
          </button>
          <button
            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{ backgroundColor: canNext ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.02)" }}
            onClick={() => canNext && setWeekIdx((i) => i + 1)}
            disabled={!canNext}
            onMouseEnter={(e) => { if (canNext) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = canNext ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.02)"; }}
          >
            <ChevronRight size={14} style={{ color: canNext ? "#4d4d4d" : "#cccccc" }} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 flex items-end gap-4 justify-between h-40">
        {data.map((d, i) => {
          const totalDay = d.present + d.late + d.absent;
          const hasData = totalDay > 0;
          return (
            <div
              key={d.label}
              className="flex flex-col items-center gap-2 flex-1 group relative"
            >
              {/* Tooltip */}
              {hasData && (
                <div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium"
                  style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}
                >
                  {d.label}: {d.present} present{d.late > 0 ? `, ${d.late} late` : ""}{d.absent > 0 ? `, ${d.absent} absent` : ""}
                </div>
              )}
              <div className="flex flex-col justify-end w-full h-32 gap-px cursor-default">
                {hasData ? (
                  <>
                    {d.absent > 0 && (
                      <motion.div
                        className="w-full rounded-t-md"
                        style={{ backgroundColor: "#ef4444" }}
                        initial={{ height: 0 }}
                        animate={{
                          height: `${(d.absent / maxVal) * 100}%`,
                        }}
                        transition={{ duration: 0.5, delay: 0.6 + i * 0.05 }}
                      />
                    )}
                    {d.late > 0 && (
                      <motion.div
                        className="w-full"
                        style={{ backgroundColor: "#f59e0b" }}
                        initial={{ height: 0 }}
                        animate={{
                          height: `${(d.late / maxVal) * 100}%`,
                        }}
                        transition={{ duration: 0.5, delay: 0.55 + i * 0.05 }}
                      />
                    )}
                    <motion.div
                      className={`w-full ${d.absent === 0 && d.late === 0 ? "rounded-t-md" : ""}`}
                      style={{ backgroundColor: "#22c55e" }}
                      initial={{ height: 0 }}
                      animate={{
                        height: `${(d.present / maxVal) * 100}%`,
                      }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                    />
                  </>
                ) : (
                  <div
                    className="w-full h-1 rounded-full self-end"
                    style={{ backgroundColor: "#f1efed" }}
                  />
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: "#707070" }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        {[
          { color: "#22c55e", label: "Present" },
          { color: "#f59e0b", label: "Late" },
          { color: "#ef4444", label: "Absent" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: l.color }}
            />
            <span className="text-xs" style={{ color: "#707070" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Employee Detail Sheet (overlay from right)
function EmployeeDetailSheet({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthLog, setMonthLog] = useState<
    { date: string; clockIn: string | null; clockOut: string | null; hours: string | null; status: string }[]
  >([]);
  const [stats, setStats] = useState({ avgHours: "—", present: 0, late: 0, absent: 0 });
  const [monthLabel, setMonthLabel] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch employee attendance for the selected month
  useEffect(() => {
    if (!employee.id) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/hr/attendance/employee?userId=${encodeURIComponent(employee.id)}&month=${currentMonth}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setMonthLog(
          (data.log || []).map(
            (r: { date: string; clockIn: string | null; clockOut: string | null; hours: string | null; status: string }) => ({
              date: r.date,
              clockIn: r.clockIn,
              clockOut: r.clockOut,
              hours: r.hours,
              status: r.status,
            })
          )
        );
        setStats(data.stats || { avgHours: "—", present: 0, late: 0, absent: 0 });
        setMonthLabel(data.monthLabel || currentMonth);
      })
      .catch(() => {
        if (!cancelled) {
          setMonthLog([]);
          setStats({ avgHours: "—", present: 0, late: 0, absent: 0 });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employee.id, currentMonth]);

  function navigateMonth(delta: number) {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Don't allow navigating into the future
  const now = new Date();
  const [curY, curM] = currentMonth.split("-").map(Number);
  const canNext = curY < now.getFullYear() || (curY === now.getFullYear() && curM < now.getMonth() + 1);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const statusColorMap: Record<string, string> = {
    present: "#22c55e",
    active: "#f3350c",
    late: "#f59e0b",
    "half-day": "#f59e0b",
    wfh: "#3b82f6",
    absent: "#b6b6b6",
    weekend: "#b6b6b6",
    holiday: "#8b5cf6",
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-[80]"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      {/* Sheet */}
      <motion.div
        className="fixed top-0 right-0 bottom-0 z-[80] w-full sm:w-[440px] overflow-y-auto"
        style={{
          backgroundColor: "#f8f7f3",
          borderLeft: "1px solid #dddddd",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AvatarCircle initials={employee.initials} size={48} image={employee.image} />
            <div>
              <p
                className="text-lg font-semibold"
                style={{ color: "#1a1a1a" }}
              >
                {employee.name}
              </p>
              <p className="text-[13px]" style={{ color: "#707070" }}>
                {employee.position} — {employee.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#f1efed]"
          >
            <X size={16} style={{ color: "#707070" }} />
          </button>
        </div>

        {/* Mini stats */}
        <div className="px-6 grid grid-cols-2 gap-3">
          {[
            { label: "Avg Hours", value: stats.avgHours },
            { label: "Present", value: String(stats.present) },
            { label: "Late", value: String(stats.late) },
            { label: "Absent", value: String(stats.absent) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl text-center py-4"
              style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            >
              <p
                className="text-[11px] uppercase font-medium tracking-wide"
                style={{ color: "#737373" }}
              >
                {s.label}
              </p>
              <p
                className="text-xl font-bold mt-1"
                style={{ color: "#1a1a1a" }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Month header */}
        <div className="px-6 mt-6 flex items-center justify-between">
          <h3
            className="text-sm font-semibold"
            style={{ color: "#1a1a1a" }}
          >
            {monthLabel}
          </h3>
          <div className="flex items-center gap-1">
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f1efed] cursor-pointer"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft size={14} style={{ color: "#707070" }} />
            </button>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{ opacity: canNext ? 1 : 0.4 }}
              onClick={() => canNext && navigateMonth(1)}
              disabled={!canNext}
            >
              <ChevronRight size={14} style={{ color: canNext ? "#707070" : "#cccccc" }} />
            </button>
          </div>
        </div>

        {/* Log table */}
        <div className="px-6 mt-3 pb-6">
          {/* Header */}
          <div
            className="grid py-2 text-[10px] uppercase font-semibold tracking-[0.05em]"
            style={{
              color: "#707070",
              gridTemplateColumns: "70px 55px 55px 65px auto",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <span>Date</span>
            <span>In</span>
            <span>Out</span>
            <span>Hours</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "#b6b6b6" }}>Loading...</p>
            </div>
          ) : monthLog.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "#b6b6b6" }}>No attendance records for this month</p>
            </div>
          ) : (
            monthLog.map((row, i) => (
              <div
                key={i}
                className="grid py-2.5 text-xs"
                style={{
                  gridTemplateColumns: "70px 55px 55px 65px auto",
                  borderBottom:
                    i < monthLog.length - 1
                      ? "1px solid rgba(0,0,0,0.04)"
                      : "none",
                  color: "#1a1a1a",
                }}
              >
                <span className="font-medium">{row.date}</span>
                <span className="font-mono" style={{ color: row.clockIn ? "#1a1a1a" : "#b6b6b6" }}>
                  {row.clockIn || "—"}
                </span>
                <span className="font-mono" style={{ color: row.clockOut ? "#1a1a1a" : "#b6b6b6" }}>
                  {row.clockOut || "—"}
                </span>
                <span className="font-mono font-semibold" style={{ color: row.hours ? "#1a1a1a" : "#b6b6b6" }}>
                  {row.hours || "—"}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: statusColorMap[row.status] || "#b6b6b6" }}
                >
                  {row.status}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Leaves Tab ──
function LeavesTab({ initialData }: { initialData?: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // API state
  const initialMapped = (initialData || []).map(mapApiLeave);
  const [pendingLeavesData, setPendingLeavesData] = useState<LeaveRequest[]>(initialMapped.filter(l => l.status === "pending"));
  const [allLeavesData, setAllLeavesData] = useState<LeaveRequest[]>(initialMapped);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hr/leaves?status=pending&page=1&limit=20");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPendingLeavesData((data.items || []).map(mapApiLeave));
    } catch { /* silent */ }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hr/leaves?page=1&limit=100");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAllLeavesData((data.items || []).map(mapApiLeave));
    } catch { /* silent */ }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchPending(), fetchAll()]);
  }, [fetchPending, fetchAll]);

  useEffect(() => { refetch(); }, [refetch]);

  // Optimistically hide approved/rejected cards while refetch is in-flight
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  const activePending = pendingLeavesData.filter(
    (l) => !approvedIds.includes(l.id) && !rejectedIds.includes(l.id)
  );

  // Leave stats
  const pendingCount = activePending.length;
  const approvedMonth = allLeavesData.filter((l) => l.status === "approved").length;
  const rejectedMonth = allLeavesData.filter((l) => l.status === "rejected").length;
  const totalLeaves = allLeavesData.length;
  const leaveBalances = buildLeaveBalances(allLeavesData);

  const leaveStats = [
    { label: "Pending Requests", value: pendingCount, icon: Clock, iconBg: "rgba(245,158,11,0.1)", iconColor: "#f59e0b", description: "Awaiting review" },
    { label: "Approved This Mo.", value: approvedMonth, icon: CheckCircle2, iconBg: "rgba(34,197,94,0.1)", iconColor: "#22c55e", description: "This year" },
    { label: "Rejected This Mo.", value: rejectedMonth, icon: XCircle, iconBg: "rgba(239,68,68,0.1)", iconColor: "#ef4444", description: "This year" },
    { label: "Total Leaves", value: totalLeaves, icon: CalendarDays, iconBg: "rgba(243,53,12,0.1)", iconColor: "#f3350c", description: "All time records" },
  ];

  // Filtered leave history
  const filteredHistory = useMemo(() => {
    let data = [...allLeavesData];
    if (statusFilter !== "all") {
      data = data.filter((l) => l.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((l) => l.employee.name.toLowerCase().includes(q));
    }
    return data;
  }, [allLeavesData, statusFilter, search]);

  async function handleApprove(id: string) {
    const leave = pendingLeavesData.find((l) => l.id === id);
    setApprovedIds((prev) => [...prev, id]);
    try {
      const res = await fetch(`/api/admin/hr/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error();
      if (leave) {
        setToast({
          message: `Approved ${leave.employee.name}'s ${leave.typeLabel.toLowerCase()} (${leave.from}${leave.from !== leave.to ? ` — ${leave.to}` : ""})`,
          type: "success",
        });
        setTimeout(() => setToast(null), 3500);
      }
      await refetch();
      setApprovedIds((prev) => prev.filter((x) => x !== id));
    } catch {
      setApprovedIds((prev) => prev.filter((x) => x !== id));
      setToast({ message: "Approval failed", type: "error" });
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function handleReject(id: string) {
    const leave = pendingLeavesData.find((l) => l.id === id);
    const note = rejectReason;
    setRejectedIds((prev) => [...prev, id]);
    setShowRejectDialog(null);
    setRejectReason("");
    try {
      const res = await fetch(`/api/admin/hr/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reviewNote: note }),
      });
      if (!res.ok) throw new Error();
      if (leave) {
        setToast({
          message: `Rejected ${leave.employee.name}'s ${leave.typeLabel.toLowerCase()} request`,
          type: "error",
        });
        setTimeout(() => setToast(null), 3500);
      }
      await refetch();
      setRejectedIds((prev) => prev.filter((x) => x !== id));
    } catch {
      setRejectedIds((prev) => prev.filter((x) => x !== id));
      setToast({ message: "Rejection failed", type: "error" });
      setTimeout(() => setToast(null), 3500);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-6 left-1/2 z-[80] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg pointer-events-auto"
            style={{
              backgroundColor: toast.type === "success" ? "#22c55e" : "#ef4444",
              color: "#ffffff",
              transform: "translateX(-50%)",
            }}
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveStats.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      {/* Pending Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
            Pending Approvals ({activePending.length})
          </h2>
          {activePending.length > 1 && (
            <button
              className="text-[13px] font-medium hover:underline"
              style={{ color: "#f3350c" }}
              onClick={() =>
                setExpandedId(expandedId ? null : activePending[0]?.id || null)
              }
            >
              {expandedId ? "Collapse" : "Expand all"}
            </button>
          )}
        </div>

        {activePending.length === 0 ? (
          <div
            className="rounded-[24px] p-12 flex flex-col items-center justify-center text-center backdrop-blur-lg border border-[#dddddd]"
            style={{
              backgroundColor: "rgba(241,239,237,0.45)",
            }}
          >
            <CheckCircle2 size={48} style={{ color: "#22c55e" }} />
            <p
              className="text-base font-semibold mt-3"
              style={{ color: "#1a1a1a" }}
            >
              All caught up!
            </p>
            <p className="text-sm mt-1" style={{ color: "#707070" }}>
              No pending leave requests to review
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {activePending.map((leave) => {
                const isExpanded = expandedId === leave.id;
                const tCfg = leaveTypeConfig[leave.type];
                return (
                  <motion.div
                    key={leave.id}
                    layout
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="rounded-[20px] overflow-hidden cursor-pointer transition-shadow backdrop-blur-lg border border-[#dddddd]"
                    style={{
                      backgroundColor: "rgba(241,239,237,0.45)",
                    }}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : leave.id)
                    }
                    whileHover={{ y: -1 }}
                  >
                  {/* Collapsed header */}
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AvatarCircle initials={leave.employee.initials} size={40} image={leave.employee.image} />
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#1a1a1a" }}
                        >
                          {leave.employee.name}
                        </p>
                        <p className="text-xs" style={{ color: "#707070" }}>
                          {leave.from}
                          {leave.from !== leave.to ? ` — ${leave.to}` : ""} ·{" "}
                          {leave.days} day{leave.days > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium rounded-full px-3 py-0.5"
                        style={{ backgroundColor: tCfg.bg, color: tCfg.text }}
                      >
                        {leave.typeLabel}
                      </span>
                      <StatusBadge {...leaveStatusConfig.pending} />
                    </div>
                  </div>

                  {/* Expanded section */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="px-5 pb-5 pt-3"
                          style={{
                            borderTop: "1px solid rgba(0,0,0,0.05)",
                          }}
                        >
                          <p
                            className="text-sm"
                            style={{ color: "#4d4d4d" }}
                          >
                            {leave.reason}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span
                              className="text-xs"
                              style={{ color: "#707070" }}
                            >
                              Applied: {leave.appliedOn}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "#707070" }}
                            >
                              {leave.remainingBalance}
                            </span>
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-semibold text-white transition-colors"
                              style={{ backgroundColor: "#22c55e" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#16a34a";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#22c55e";
                              }}
                              onClick={() => handleApprove(leave.id)}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                              style={{
                                border: "1px solid #ef4444",
                                color: "#ef4444",
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(239,68,68,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                              onClick={() => {
                                setShowRejectDialog(leave.id);
                              }}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Bento row — Leave balance + History */}
      <div className="grid lg:grid-cols-2 gap-5">
        <LeaveBalanceOverview balances={leaveBalances} />
        <LeaveHistoryCard
          data={filteredHistory}
          total={allLeavesData.length}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      {/* Reject dialog overlay */}
      <AnimatePresence>
        {showRejectDialog && (
          <RejectDialog
            leave={pendingLeavesData.find((l) => l.id === showRejectDialog)!}
            reason={rejectReason}
            onReasonChange={setRejectReason}
            onReject={() => handleReject(showRejectDialog)}
            onCancel={() => {
              setShowRejectDialog(null);
              setRejectReason("");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Leave Balance Overview
function LeaveBalanceOverview({ balances }: { balances: LeaveBalance[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd] flex flex-col"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        padding: "24px",
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
          Team Leave Balances
        </h2>
        <span
          className="text-xs font-medium px-3 py-1 rounded-lg"
          style={{ backgroundColor: "#f1efed", color: "#707070" }}
        >
          2025-26
        </span>
      </div>
      <div className="mt-5 space-y-4 overflow-y-auto max-h-[400px] pr-1">
        {balances.map((b) => {
          const totalUsed = b.cl.used + b.sl.used + b.el.used;
          const totalPending = b.cl.pending + b.sl.pending + b.el.pending;
          const totalAll = b.cl.total + b.sl.total + b.el.total;
          const pctUsed = totalAll > 0 ? Math.round(((totalUsed + totalPending) / totalAll) * 100) : 0;
          const barColor =
            pctUsed > 80 ? "#ef4444" : pctUsed > 50 ? "#f59e0b" : "#22c55e";
          return (
            <div key={b.employee.id}>
              <div className="flex items-center gap-3">
                <AvatarCircle initials={b.employee.initials} size={32} image={b.employee.image} />
                <span
                  className="text-sm font-medium flex-1"
                  style={{ color: "#1a1a1a" }}
                >
                  {b.employee.name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-11">
                <span
                  className="text-[11px] font-medium px-2 py-px rounded-full"
                  style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
                >
                  CL: {b.cl.used}{b.cl.pending > 0 ? ` (+${b.cl.pending})` : ""}
                </span>
                <span
                  className="text-[11px] font-medium px-2 py-px rounded-full"
                  style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
                >
                  SL: {b.sl.used}{b.sl.pending > 0 ? ` (+${b.sl.pending})` : ""}
                </span>
                <span
                  className="text-[11px] font-medium px-2 py-px rounded-full"
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                >
                  EL: {b.el.used}{b.el.pending > 0 ? ` (+${b.el.pending})` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-11">
                <div
                  className="flex-1 h-1 rounded-full"
                  style={{ backgroundColor: "#f1efed" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pctUsed}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
                  />
                </div>
                <span className="text-[11px]" style={{ color: "#707070" }}>
                  {pctUsed}% used
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Leave History Card
function LeaveHistoryCard({
  data,
  total,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  data: LeaveRequest[];
  total?: number;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: "all" | LeaveStatus;
  onStatusFilterChange: (v: "all" | LeaveStatus) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd] flex flex-col"
      style={{
        backgroundColor: "rgba(241,239,237,0.45)",
        padding: "24px",
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
        Leave History
      </h2>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mt-4">
        <LeaveStatusDropdown
          value={statusFilter}
          onChange={onStatusFilterChange}
        />
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: "#b6b6b6" }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-8 pr-4 rounded-full text-[13px] font-medium outline-none transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
            style={{
              backgroundColor: "rgba(241,239,237,0.45)",
              color: "#1a1a1a",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-3 overflow-y-auto max-h-[360px] pr-1">
        {data.map((leave, i) => {
          const sCfg = leaveStatusConfig[leave.status];
          return (
            <div
              key={leave.id}
              className="flex items-center justify-between py-3"
              style={{
                borderBottom:
                  i < data.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <AvatarCircle initials={leave.employee.initials} size={32} image={leave.employee.image} />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#1a1a1a" }}
                  >
                    {leave.employee.name}{" "}
                    <span style={{ color: "#707070" }}>— {leave.type}</span>
                  </p>
                  <p className="text-xs" style={{ color: "#707070" }}>
                    {leave.from}
                    {leave.from !== leave.to ? ` — ${leave.to}` : ""} ·{" "}
                    {leave.days} day{leave.days > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <StatusBadge {...sCfg} />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="mt-3 pt-3 text-center text-xs"
        style={{ color: "#707070", borderTop: "1px solid rgba(0,0,0,0.05)" }}
      >
        Showing {data.length} of {total ?? data.length}
      </div>
    </motion.div>
  );
}

// Glass-styled leave status dropdown (matching tasks FilterDropdown)
const leaveFilterOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

function LeaveStatusDropdown({
  value,
  onChange,
}: {
  value: "all" | LeaveStatus;
  onChange: (v: "all" | LeaveStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const displayLabel =
    value === "all" ? "Status" : leaveFilterOptions.find((o) => o.value === value)?.label || "Status";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:text-[#1a1a1a] hover:bg-[#e8e5e2] cursor-pointer shrink-0"
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
          className="absolute top-full left-0 mt-2 min-w-[140px] z-50 rounded-2xl border border-[#dddddd] backdrop-blur-lg shadow-lg p-1"
          style={{ backgroundColor: "rgba(248,247,243,0.95)" }}
        >
          {leaveFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value as "all" | LeaveStatus);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-full text-[13px] transition-colors cursor-pointer"
              style={{
                color: value === opt.value ? "#1a1a1a" : "#4d4d4d",
                fontWeight: value === opt.value ? 600 : 400,
                backgroundColor: value === opt.value ? "rgba(0,0,0,0.05)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = "transparent";
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

// Reject Dialog
function RejectDialog({
  leave,
  reason,
  onReasonChange,
  onReject,
  onCancel,
}: {
  leave: LeaveRequest;
  reason: string;
  onReasonChange: (v: string) => void;
  onReject: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[70]"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <motion.div
        className="fixed z-[70] top-1/2 left-1/2 w-[90vw] max-w-[420px]"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          padding: "32px",
          transform: "translate(-50%, -50%)",
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <h3
          className="text-lg font-semibold"
          style={{ color: "#1a1a1a" }}
        >
          Reject Leave Request
        </h3>
        <div className="flex items-center gap-2 mt-3">
          <AvatarCircle initials={leave.employee.initials} size={28} image={leave.employee.image} />
          <span className="text-sm" style={{ color: "#707070" }}>
            {leave.employee.name} — {leave.typeLabel}, {leave.from}
            {leave.from !== leave.to ? ` — ${leave.to}` : ""}
          </span>
        </div>
        <textarea
          rows={3}
          placeholder="Rejection reason (optional)"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full mt-4 rounded-2xl p-4 text-sm outline-none resize-none"
          style={{
            border: "1px solid #dddddd",
            backgroundColor: "rgba(255,255,255,0.6)",
            color: "#1a1a1a",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#0a0a0a";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#dddddd";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div className="flex items-center gap-2 mt-5">
          <button
            className="flex-1 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{
              border: "1px solid #dddddd",
              color: "#707070",
            }}
            onClick={onCancel}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1efed";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#ef4444" }}
            onClick={onReject}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
            }}
          >
            Reject
          </button>
        </div>
      </motion.div>
    </>
  );
}
