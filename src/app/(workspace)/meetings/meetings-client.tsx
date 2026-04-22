// Meetings client component
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassPillTabs } from "@/components/ui/glass-pill-tabs";
import {
  Search,
  SlidersHorizontal,
  Video,
  Clock,
  CalendarDays,
  ListChecks,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  AlertCircle,
  Hash,
  Calendar,
  ArrowRight,
  ChevronDown,
  Circle,
} from "lucide-react";

// Types
interface Participant {
  initials: string;
  name: string;
  gradient: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  duration: string;
  durationMinutes: number;
  status: "Completed" | "Scheduled" | "Cancelled";
  description?: string;
  meetingUrl?: string;
  participants: Participant[];
}

interface UpcomingMeeting {
  id: string;
  title: string;
  dateLabel: string;
  location: string;
  participants: number;
  color: string;
}

interface ActionItem {
  id: string;
  task: string;
  assignedTo: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  overdue: boolean;
  meetingId: string;
}

interface StatItem {
  label: string;
  value: string;
  subLabel: string;
  icon: typeof Video;
  iconBg: string;
  iconColor: string;
  accent: string;
}

// Status styles
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Completed: { color: "#22c55e", bg: "rgba(34,197,94,0.15)", label: "Completed" },
  Scheduled: { color: "#3b82f6", bg: "rgba(59,130,246,0.15)", label: "Scheduled" },
  Cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "Cancelled" },
};

// Priority dot colors
const PRIORITY_COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#dddddd",
};

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

// Glass card styles
const glassLight = { backgroundColor: "rgba(241,239,237,0.45)" };
const glassDark = {
  backgroundColor: "rgba(10,10,10,0.88)",
  boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
};

// Animated counter hook
function useCountUp(target: string, duration = 600) {
  const [display, setDisplay] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const match = target.match(/^([\d.]+)(.*)$/);
    if (!match) { setDisplay(target); return; }
    const end = parseFloat(match[1]);
    const suffix = match[2];
    const isFloat = target.includes(".");
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;
      setDisplay((isFloat ? current.toFixed(1) : Math.round(current).toString()) + suffix);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

// Stat card sub-component
function StatCard({ stat }: { stat: StatItem }) {
  const animatedValue = useCountUp(stat.value);
  return (
    <div
      className="relative rounded-[24px] p-5 backdrop-blur-lg border border-[#dddddd] overflow-hidden"
      style={glassLight}
    >
      <div className="flex justify-end mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: stat.iconBg }}
        >
          <stat.icon size={16} style={{ color: stat.iconColor }} />
        </div>
      </div>
      <p className="text-xs mb-1" style={{ color: "#737373" }}>{stat.label}</p>
      <p className="text-[2.5rem] font-bold leading-none" style={{ color: "#1a1a1a" }}>{animatedValue}</p>
      <p className="text-xs mt-1" style={{ color: "#bbb" }}>{stat.subLabel}</p>
    </div>
  );
}

// Data transformation helpers
const GRADIENTS = [
  "linear-gradient(135deg, #f3350c, #ff6b47)",
  "linear-gradient(135deg, #3b82f6, #60a5fa)",
  "linear-gradient(135deg, #22c55e, #4ade80)",
  "linear-gradient(135deg, #f59e0b, #fbbf24)",
  "linear-gradient(135deg, #a855f7, #c084fc)",
  "linear-gradient(135deg, #ef4444, #f87171)",
];

const UPCOMING_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatMeetingDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function formatMeetingTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
}

function formatUpcomingLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  return `${day}, ${date} \u00b7 ${time}`;
}

function computeDuration(start: string, end: string): { label: string; minutes: number } {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { label: m > 0 ? `${h}h ${m}m` : `${h}h`, minutes };
  }
  return { label: `${minutes} min`, minutes };
}

function mapStatus(apiStatus: string): Meeting["status"] {
  switch (apiStatus) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Scheduled";
  }
}

interface ApiUser {
  _id?: string;
  name: string;
  image?: string;
  role?: string;
}

interface ApiActionItem {
  _id?: string;
  task: string;
  assignedTo?: ApiUser | string;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
  completed?: boolean;
}

interface ApiMeeting {
  id: string;
  title: string;
  description?: string;
  organizerId: ApiUser;
  attendeeIds: ApiUser[];
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  status: string;
  actionItems?: ApiActionItem[];
  createdAt: string;
  updatedAt: string;
}

function mapParticipants(attendees: ApiUser[]): Participant[] {
  return attendees.map((u, idx) => ({
    initials: getInitials(u.name || "??"),
    name: u.name || "Unknown",
    gradient: GRADIENTS[idx % GRADIENTS.length],
  }));
}

function mapApiMeeting(m: ApiMeeting): Meeting {
  const dur = computeDuration(m.startTime, m.endTime);
  return {
    id: m.id,
    title: m.title,
    date: formatMeetingDate(m.startTime),
    time: formatMeetingTime(m.startTime),
    location: m.location || m.meetingUrl || "",
    duration: dur.label,
    durationMinutes: dur.minutes,
    status: mapStatus(m.status),
    description: m.description,
    meetingUrl: m.meetingUrl,
    participants: mapParticipants(m.attendeeIds || []),
  };
}

function computeStats(meetings: Meeting[]): StatItem[] {
  const totalMeetings = meetings.length;
  const totalMinutes = meetings.reduce((acc, m) => acc + m.durationMinutes, 0);
  const totalHours = Math.round(totalMinutes / 60);

  const now = new Date();
  const thisMonth = meetings.filter((m) => {
    const d = new Date(m.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return [
    { label: "Total Meetings", value: String(totalMeetings), subLabel: "All meetings", icon: Video, iconBg: "rgba(243,53,12,0.1)", iconColor: "#f3350c", accent: "#f3350c" },
    { label: "Total Hours", value: `${totalHours}h`, subLabel: "Recorded", icon: Clock, iconBg: "rgba(59,130,246,0.1)", iconColor: "#3b82f6", accent: "#3b82f6" },
    { label: "This Month", value: String(thisMonth), subLabel: now.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }), icon: CalendarDays, iconBg: "rgba(34,197,94,0.1)", iconColor: "#22c55e", accent: "#22c55e" },
    { label: "Action Items", value: "0", subLabel: "Pending", icon: ListChecks, iconBg: "rgba(245,158,11,0.1)", iconColor: "#f59e0b", accent: "#f59e0b" },
  ];
}

function extractActionItems(apiMeetings: ApiMeeting[]): ActionItem[] {
  const items: ActionItem[] = [];
  const now = new Date();

  for (const m of apiMeetings) {
    if (!m.actionItems?.length) continue;
    for (const ai of m.actionItems) {
      const assignedName =
        typeof ai.assignedTo === "object" && ai.assignedTo
          ? getInitials(ai.assignedTo.name || "??")
          : "—";
      const dueDate = ai.dueDate ? new Date(ai.dueDate) : undefined;
      const dueDateLabel = dueDate
        ? dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })
        : "—";
      items.push({
        id: ai._id || `${m.id}-${items.length}`,
        task: ai.task,
        assignedTo: assignedName,
        dueDate: dueDateLabel,
        priority: ai.priority || "Medium",
        completed: ai.completed ?? false,
        overdue: dueDate ? dueDate < now && !ai.completed : false,
        meetingId: m.id,
      });
    }
  }
  return items;
}

function extractUpcoming(apiMeetings: ApiMeeting[]): UpcomingMeeting[] {
  const now = new Date();
  return apiMeetings
    .filter((m) => m.status === "scheduled" && new Date(m.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5)
    .map((m, idx) => ({
      id: m.id,
      title: m.title,
      dateLabel: formatUpcomingLabel(m.startTime),
      location: m.location || m.meetingUrl || "",
      participants: (m.attendeeIds?.length || 0) + 1,
      color: UPCOMING_COLORS[idx % UPCOMING_COLORS.length],
    }));
}

// Audio player sub-component (dark card version)
function AudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHandle, setShowHandle] = useState(false);
  const totalSeconds = 45 * 60;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Simulate playback
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setPlaying(false); return 100; }
        return p + 0.05;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [playing]);

  const currentSeconds = Math.floor((progress / 100) * totalSeconds);

  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4 mt-5"
      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Play/Pause */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setPlaying(!playing)}
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200"
        style={{ backgroundColor: "#f3350c" }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#c82c09"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f3350c"; }}
      >
        {playing ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white ml-0.5" />}
      </motion.button>

      {/* Progress area */}
      <div
        className="flex-1 min-w-0"
        onMouseEnter={() => setShowHandle(true)}
        onMouseLeave={() => setShowHandle(false)}
      >
        {/* Track */}
        <div
          className="relative h-1.5 rounded-full cursor-pointer"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setProgress(((e.clientX - rect.left) / rect.width) * 100);
          }}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: "#f3350c" }}
          />
          {/* Scrub handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md transition-opacity duration-200"
            style={{
              left: `${progress}%`,
              marginLeft: -6,
              opacity: showHandle ? 1 : 0,
            }}
          />
        </div>
        {/* Times */}
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
            {formatTime(currentSeconds)}
          </span>
          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
            {formatTime(totalSeconds)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <button className="flex-shrink-0 hidden sm:flex items-center justify-center cursor-pointer">
        <Volume2 size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
      </button>
    </div>
  );
}

// Avatar stack sub-component
function AvatarStack({ participants, max = 4 }: { participants: Participant[]; max?: number }) {
  const shown = participants.slice(0, max);
  const extra = participants.length - max;
  return (
    <div className="flex items-center group">
      {shown.map((p, i) => (
        <div
          key={p.initials}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white transition-all duration-200 group-hover:ml-0"
          style={{
            background: p.gradient,
            border: "2px solid rgba(10,10,10,0.88)",
            marginLeft: i === 0 ? 0 : -8,
            zIndex: max - i,
          }}
          title={p.name}
        >
          {p.initials}
        </div>
      ))}
      {extra > 0 && (
        <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          +{extra} more
        </span>
      )}
    </div>
  );
}

// Status icon for meeting list
function StatusIcon({ status }: { status: Meeting["status"] }) {
  switch (status) {
    case "Completed":
      return <CheckCircle size={16} style={{ color: "#22c55e" }} />;
    case "Scheduled":
      return <Circle size={16} style={{ color: "#3b82f6" }} />;
    case "Cancelled":
      return <AlertCircle size={16} style={{ color: "#ef4444" }} />;
  }
}

export function MeetingsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showFilterDrop, setShowFilterDrop] = useState(false);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  // API-wired state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch meetings from API
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchMeetings() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/meetings?limit=100");
        if (!res.ok) throw new Error("Failed to fetch meetings");
        const data = await res.json();
        const apiMeetings: ApiMeeting[] = data.items || [];

        // Transform to client Meeting shape
        const mapped = apiMeetings.map(mapApiMeeting);
        setMeetings(mapped);
        setTotalMeetings(data.total || mapped.length);

        // Compute stats
        const computedStats = computeStats(mapped);
        // Count pending action items
        const allActions = extractActionItems(apiMeetings);
        const pendingCount = allActions.filter((a) => !a.completed).length;
        computedStats[3] = { ...computedStats[3], value: String(pendingCount) };
        setStats(computedStats);

        // Extract upcoming and action items
        setUpcomingMeetings(extractUpcoming(apiMeetings));
        setActionItems(allActions);
      } catch (err) {
        console.error("Failed to fetch meetings:", err);
        setMeetings([]);
        setStats(computeStats([]));
        setUpcomingMeetings([]);
        setActionItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMeetings();
  }, [status]);

  const latestMeeting = meetings[0] || null;

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleAction = (id: string) => {
    setCompletedActions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Loading skeleton
  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-48 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
            <div className="h-4 w-96 mt-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />
          </div>
          <div className="hidden sm:flex gap-3">
            <div className="h-10 w-60 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
            <div className="h-10 w-24 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl h-[140px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          ))}
        </div>
        <div className="rounded-3xl h-[280px]" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-5">
          <div className="rounded-3xl h-[420px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="rounded-3xl h-[420px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
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
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[2rem] font-semibold leading-tight" style={{ color: "#1a1a1a" }}>
              My Meetings
            </h1>
            <p className="text-sm mt-1" style={{ color: "#737373" }}>
              View recordings, transcripts and meeting summaries.
            </p>
          </div>
          {/* Search + Filter (desktop) */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#bbb" }}
              />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-60 pl-10 pr-4 rounded-full backdrop-blur-lg border border-[#dddddd] text-[13px] outline-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                style={{ backgroundColor: "rgba(241,239,237,0.45)", color: "#1a1a1a" }}
              />
            </div>
            {/* Filter button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDrop(!showFilterDrop)}
                className="hidden sm:flex items-center gap-2 rounded-full backdrop-blur-lg border border-[#dddddd] px-5 h-10 cursor-pointer transition-all duration-200 hover:border-[#aaaaaa]"
                style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e8e5e2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(241,239,237,0.45)"; }}
              >
                <SlidersHorizontal size={16} style={{ color: "#707070" }} />
                <span className="text-[13px] font-medium" style={{ color: "#4d4d4d" }}>Filter</span>
                <ChevronDown size={12} style={{ color: "#707070" }} />
              </button>
              {/* Mobile: icon only */}
              <button
                onClick={() => setShowFilterDrop(!showFilterDrop)}
                className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-lg border border-[#dddddd] cursor-pointer"
                style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
              >
                <SlidersHorizontal size={16} style={{ color: "#707070" }} />
              </button>
              {/* Dropdown */}
              {showFilterDrop && (
                <div
                  className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-[#dddddd] backdrop-blur-lg p-1 shadow-lg"
                  style={{ backgroundColor: "rgba(241,239,237,0.92)" }}
                >
                  {["All", "Completed", "Scheduled", "Cancelled"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setStatusFilter(opt); setShowFilterDrop(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors duration-150 cursor-pointer"
                      style={{
                        color: statusFilter === opt ? "#1a1a1a" : "#707070",
                        backgroundColor: statusFilter === opt ? "rgba(0,0,0,0.06)" : "transparent",
                        fontWeight: statusFilter === opt ? 600 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Mobile search */}
        <div className="sm:hidden mt-3 relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#bbb" }}
          />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full pl-10 pr-4 rounded-full backdrop-blur-lg border border-[#dddddd] text-[13px] outline-none transition-all duration-200 focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
            style={{ backgroundColor: "rgba(241,239,237,0.45)", color: "#1a1a1a" }}
          />
        </div>
      </motion.div>

      {/* SECTION 2: Stats Row */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </motion.div>

      {/* SECTION 3: Latest Meeting (DARK CARD) */}
      {latestMeeting && (
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        className="rounded-[24px] p-6 sm:p-8 relative overflow-hidden backdrop-blur-lg border"
        style={{ ...glassDark, borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs uppercase font-semibold tracking-widest"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Latest Meeting
          </span>
          {/* Status badge */}
          <span
            className="flex items-center gap-1.5 text-[11px] uppercase font-semibold rounded-full px-2.5 py-1"
            style={{
              backgroundColor: STATUS_CONFIG[latestMeeting.status]?.bg,
              color: STATUS_CONFIG[latestMeeting.status]?.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: STATUS_CONFIG[latestMeeting.status]?.color }}
            />
            {latestMeeting.status}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          {latestMeeting.title}
        </h2>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1.5">
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Calendar size={13} />
            {latestMeeting.date}, {latestMeeting.time}
          </span>
          <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>&middot;</span>
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Clock size={13} />
            {latestMeeting.duration}
          </span>
          <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>&middot;</span>
          {latestMeeting.location && (
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Hash size={13} />
            {latestMeeting.location}
          </span>
          )}
        </div>

        {/* Description */}
        {latestMeeting.description && (
          <div className="mt-4">
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
              Summary:
            </span>
            <p
              className="text-sm mt-1 leading-relaxed line-clamp-2"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {latestMeeting.description}
            </p>
          </div>
        )}

        {/* Audio Player */}
        <AudioPlayer />

        {/* Participants row */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Participants:
            </span>
            <AvatarStack participants={latestMeeting.participants} />
          </div>
          <button
            onClick={() => router.push(`/meetings/${latestMeeting.id}`)}
            className="flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer hover:underline"
            style={{ color: "#f3350c" }}
          >
            View Full
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
      )}

      {/* Empty state when no meetings */}
      {!latestMeeting && !isLoading && (
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] p-8 text-center backdrop-blur-lg border border-[#dddddd]"
          style={glassLight}
        >
          <Video size={48} className="mx-auto mb-4" style={{ color: "#bbb" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>No meetings yet</h3>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>Your meetings will appear here once scheduled.</p>
        </motion.div>
      )}

      {/* SECTION 4: All Meetings | Upcoming + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-5">
        {/* LEFT: All Meetings */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd]"
          style={glassLight}
        >
          {/* Title row */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h3 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
              All Meetings
            </h3>
            <GlassPillTabs
              tabs={[
                { label: "All", value: "All" },
                { label: "Completed", value: "Completed" },
                { label: "Scheduled", value: "Scheduled" },
              ]}
              activeValue={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              layoutId="meetingStatusPill"
              variant="subtle"
              size="sm"
            />
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div
              className="grid px-6 py-3 text-xs uppercase font-medium tracking-wider"
              style={{
                gridTemplateColumns: "1fr 120px 100px 60px",
                backgroundColor: "rgba(0,0,0,0.03)",
                color: "#737373",
              }}
            >
              <span>Meeting</span>
              <span>Location</span>
              <span>Duration</span>
              <span className="text-right">Status</span>
            </div>
            {filteredMeetings.map((meeting, idx) => (
              <div
                key={meeting.id}
                onClick={() => router.push(`/meetings/${meeting.id}`)}
                className="grid items-center px-6 py-3.5 transition-colors duration-200 hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
                style={{
                  gridTemplateColumns: "1fr 120px 100px 60px",
                  borderBottom: idx < filteredMeetings.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>
                    {meeting.title}
                  </p>
                  <p className="text-xs" style={{ color: "#bbb" }}>{meeting.date}</p>
                </div>
                <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "#707070" }}>
                  <Hash size={12} style={{ color: "#bbb" }} />
                  {meeting.location || "—"}
                </span>
                <span className="text-[13px] font-mono" style={{ color: "#707070" }}>
                  {meeting.duration}
                </span>
                <span className="flex justify-end">
                  <StatusIcon status={meeting.status} />
                </span>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden px-4 pb-4 space-y-2">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => router.push(`/meetings/${meeting.id}`)}
                className="rounded-2xl p-3 cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.05)]"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                    {meeting.title}
                  </p>
                  <StatusIcon status={meeting.status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs" style={{ color: "#bbb" }}>{meeting.date}</span>
                  {meeting.location && (
                  <span className="text-xs flex items-center gap-1" style={{ color: "#737373" }}>
                    <Hash size={10} />
                    {meeting.location}
                  </span>
                  )}
                  <span className="text-xs font-mono" style={{ color: "#737373" }}>{meeting.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
          >
            <span className="text-xs" style={{ color: "#737373" }}>
              Showing {filteredMeetings.length} of {totalMeetings} meetings
            </span>
            {filteredMeetings.length < totalMeetings && (
              <button
                className="text-[13px] font-semibold cursor-pointer hover:underline"
                style={{ color: "#f3350c" }}
              >
                Load more
              </button>
            )}
          </div>
        </motion.div>

        {/* RIGHT: Upcoming + Action Items */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={glassLight}
        >
          {/* Upcoming Meetings */}
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1a1a1a" }}>
            Upcoming Meetings
          </h3>
          <div className="space-y-3">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((um) => (
                <div
                  key={um.id}
                  className="relative rounded-2xl px-4 py-3.5 cursor-pointer transition-colors duration-200 hover:bg-[rgba(0,0,0,0.05)] overflow-hidden"
                  style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                >
                  {/* Left color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full transition-all duration-200"
                    style={{ backgroundColor: um.color }}
                  />
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                    {um.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#737373" }}>
                    {um.dateLabel}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#bbb" }}>
                    {um.location ? `${um.location} \u00b7 ` : ""}{um.participants} ppl
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm italic text-center py-5" style={{ color: "#bbb" }}>
                No upcoming meetings
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px my-5" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

          {/* Key Action Items */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
                Key Action Items
              </h3>
              <p className="text-xs" style={{ color: "#737373" }}>
                From recent meetings
              </p>
            </div>
          </div>
          <div className="space-y-0">
            {actionItems.length > 0 ? (
            actionItems.map((item, idx) => {
              const isDone = completedActions.has(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3"
                  style={{
                    borderBottom: idx < actionItems.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleAction(item.id)}
                    className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full border-[1.5px] flex items-center justify-center cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: isDone ? "#22c55e" : "#dddddd",
                      backgroundColor: isDone ? "#22c55e" : "transparent",
                    }}
                  >
                    {isDone && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        width="10" height="10" viewBox="0 0 12 12" fill="none"
                      >
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </button>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm transition-all duration-300"
                      style={{
                        color: isDone ? "#bbb" : "#1a1a1a",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {item.task}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#bbb" }}>
                      Assigned to: {item.assignedTo} &middot; Due:{" "}
                      <span
                        style={{
                          color: item.overdue && !isDone ? "#ef4444" : "#bbb",
                          fontWeight: item.overdue && !isDone ? 600 : 400,
                        }}
                      >
                        {item.dueDate}
                      </span>
                    </p>
                  </div>
                  {/* Priority dot */}
                  <span
                    className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                    style={{ backgroundColor: PRIORITY_COLORS[item.priority] }}
                  />
                </div>
              );
            })
            ) : (
              <p className="text-sm italic text-center py-5" style={{ color: "#bbb" }}>
                No action items
              </p>
            )}
          </div>

          {/* Footer link */}
          <div className="text-center mt-4">
            <button
              className="text-[13px] font-semibold cursor-pointer hover:underline"
              style={{ color: "#f3350c" }}
            >
              View All Action Items
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
