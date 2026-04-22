// Profile client component
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Pencil,
  Calendar,
  MapPin,
  Clock,
  CheckSquare,
  Timer,
  CalendarDays,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

// Types
interface ActivityItem {
  id: string;
  description: string;
  boldText?: string;
  type: "attendance" | "task" | "leave" | "general";
  time: string;
}

interface TaskItem {
  id: string;
  title: string;
  project: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
}

interface TeamItem {
  name: string;
  color: string;
  members: number;
}

interface StatItem {
  label: string;
  value: string;
  subLabel: string;
  icon: typeof CheckSquare;
  iconBg: string;
  iconColor: string;
  accent: string;
}

// API response types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  positions: string[];
  phone?: string;
  employeeId?: string;
  department?: string;
  bio?: string;
  location?: string;
  workType?: string;
  shift?: { start: string; end: string };
  skills?: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface StatsResponse {
  tasks: { total: number; inProgress: number; doneThisWeek: number };
  attendance: { todayStatus: string; streak: number };
  leaves: { takenThisYear: number; remaining: number };
  upcomingMeetings: number;
}

interface ApiTask {
  id: string;
  title: string;
  project?: string;
  priority?: string;
  status?: string;
}

// Activity dot colors
const ACTIVITY_COLORS: Record<ActivityItem["type"], string> = {
  attendance: "#22c55e",
  task: "#3b82f6",
  leave: "#f59e0b",
  general: "#dddddd",
};

// Project pill styles
const PROJECT_STYLES: Record<string, { bg: string; text: string }> = {
  Website: { bg: "#dbeafe", text: "#1e40af" },
  Backend: { bg: "#f3e8ff", text: "#7c3aed" },
  DevOps: { bg: "#dcfce7", text: "#166534" },
  Mobile: { bg: "#fef3c7", text: "#92400e" },
};

// Priority badge styles
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  High: { bg: "#fee2e2", text: "#991b1b" },
  Medium: { bg: "#fef3c7", text: "#92400e" },
  Low: { bg: "#f1efed", text: "#4d4d4d" },
};

// Status badge styles
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  "To Do": { bg: "#f1efed", text: "#b6b6b6" },
  "In Progress": { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  Done: { bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
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

// Map API task status to display labels
function mapTaskStatus(status?: string): "To Do" | "In Progress" | "Done" {
  switch (status) {
    case "done": return "Done";
    case "in-progress": return "In Progress";
    default: return "To Do";
  }
}

// Map API priority to display labels
function mapPriority(priority?: string): "High" | "Medium" | "Low" {
  switch (priority) {
    case "high": return "High";
    case "medium": return "Medium";
    default: return "Low";
  }
}

// Format shift for display
function formatShift(shift?: { start: string; end: string }): string {
  if (!shift?.start || !shift?.end) return "—";
  return `${shift.start} – ${shift.end}`;
}

// Format workType for display
function formatWorkType(workType?: string): string {
  if (!workType) return "—";
  return workType.charAt(0).toUpperCase() + workType.slice(1);
}

// Build stat cards from API response
function buildStats(stats: StatsResponse): StatItem[] {
  return [
    {
      label: "Tasks",
      value: String(stats.tasks.total),
      subLabel: `${stats.tasks.inProgress} in progress`,
      icon: CheckSquare,
      iconBg: "rgba(243,53,12,0.1)",
      iconColor: "#f3350c",
      accent: "#f3350c",
    },
    {
      label: "Attendance",
      value: `${stats.attendance.streak}d`,
      subLabel: "Current streak",
      icon: Clock,
      iconBg: "rgba(34,197,94,0.1)",
      iconColor: "#22c55e",
      accent: "#22c55e",
    },
    {
      label: "Meetings",
      value: String(stats.upcomingMeetings),
      subLabel: "Upcoming",
      icon: Timer,
      iconBg: "rgba(59,130,246,0.1)",
      iconColor: "#3b82f6",
      accent: "#3b82f6",
    },
    {
      label: "Leaves",
      value: String(stats.leaves.remaining),
      subLabel: "Remaining",
      icon: CalendarDays,
      iconBg: "rgba(245,158,11,0.1)",
      iconColor: "#f59e0b",
      accent: "#f59e0b",
    },
  ];
}

// Format relative time
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// Glass card styles
const glassLight = {
  backgroundColor: "rgba(241,239,237,0.45)",
};

const glassDark = {
  backgroundColor: "rgba(10,10,10,0.88)",
  boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
};

// Activity stagger variant
const activityItemVariant = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

// Animated counter hook
function useCountUp(target: string, duration = 600) {
  const [display, setDisplay] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Extract numeric part and suffix
    const match = target.match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplay(target);
      return;
    }
    const end = parseFloat(match[1]);
    const suffix = match[2]; // e.g. "%", "h", ""
    const isFloat = target.includes(".");
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;
      setDisplay(
        (isFloat ? current.toFixed(1) : Math.round(current).toString()) + suffix,
      );
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

// Stat card with counter + accent strip animation
function StatCard({ stat }: { stat: StatItem }) {
  const animatedValue = useCountUp(stat.value);

  return (
    <div
      className="relative rounded-[24px] p-5 backdrop-blur-lg border border-[#dddddd] overflow-hidden"
      style={glassLight}
    >
      {/* Icon badge */}
      <div className="flex justify-end mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: stat.iconBg }}
        >
          <stat.icon size={16} style={{ color: stat.iconColor }} />
        </div>
      </div>
      {/* Content */}
      <p className="text-xs mb-1" style={{ color: "#737373" }}>
        {stat.label}
      </p>
      <p
        className="text-[2.5rem] font-bold leading-none"
        style={{ color: "#1a1a1a" }}
      >
        {animatedValue}
      </p>
      <p className="text-xs mt-1" style={{ color: "#bbb" }}>
        {stat.subLabel}
      </p>
    </div>
  );
}

interface ProfileClientProps {
  settingsPath?: string;
  tasksPath?: string;
}

export function ProfileClient({
  settingsPath = "/settings",
  tasksPath = "/tasks",
}: ProfileClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // API state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile data from APIs
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [profileRes, statsRes, tasksRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/me/stats"),
          fetch("/api/tasks?limit=5"),
        ]);

        if (profileRes.ok) {
          const profileData: UserProfile = await profileRes.json();
          setProfile(profileData);
        }

        if (statsRes.ok) {
          const statsData: StatsResponse = await statsRes.json();
          setStats(buildStats(statsData));

          // Derive activities from stats
          const derivedActivities: ActivityItem[] = [];
          if (statsData.attendance.todayStatus !== "no-data") {
            derivedActivities.push({
              id: "act-att",
              description: `Today's status: ${statsData.attendance.todayStatus}`,
              type: "attendance",
              time: "Today",
            });
          }
          if (statsData.tasks.doneThisWeek > 0) {
            derivedActivities.push({
              id: "act-task",
              description: `Completed ${statsData.tasks.doneThisWeek} task${statsData.tasks.doneThisWeek > 1 ? "s" : ""} this week`,
              type: "task",
              time: "This week",
            });
          }
          if (statsData.leaves.takenThisYear > 0) {
            derivedActivities.push({
              id: "act-leave",
              description: `${statsData.leaves.takenThisYear} leave${statsData.leaves.takenThisYear > 1 ? "s" : ""} taken this year`,
              type: "leave",
              time: String(new Date().getFullYear()),
            });
          }
          if (statsData.upcomingMeetings > 0) {
            derivedActivities.push({
              id: "act-meet",
              description: `${statsData.upcomingMeetings} upcoming meeting${statsData.upcomingMeetings > 1 ? "s" : ""}`,
              type: "general",
              time: "Upcoming",
            });
          }
          setActivities(derivedActivities);
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const mapped: TaskItem[] = (tasksData.items || []).map(
            (t: ApiTask) => ({
              id: t.id,
              title: t.title,
              project: t.project || "General",
              priority: mapPriority(t.priority),
              status: mapTaskStatus(t.status),
            })
          );
          setTasks(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [status]);

  // Derived display values
  const userName = profile?.name || session?.user?.name || "User";
  const userEmail = profile?.email || session?.user?.email || "";
  const userImage = profile?.image || session?.user?.image || "";
  const displayRole = profile?.role || (session?.user as { role?: string } | undefined)?.role || "Employee";
  const displayDepartment = profile?.department || "—";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
    : "—";
  const lastActive = profile?.lastLogin ? timeAgo(profile.lastLogin) : "Just now";
  const skills = profile?.skills || [];
  const teams: TeamItem[] = profile?.positions?.length
    ? profile.positions.map((pos, i) => ({
        name: pos.toUpperCase(),
        color: ["#3b82f6", "#a855f7", "#f59e0b", "#22c55e"][i % 4],
        members: 0,
      }))
    : [];

  // Loading skeleton
  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-40 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
            <div className="h-4 w-80 mt-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />
          </div>
          <div className="hidden sm:block h-10 w-36 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        </div>
        {/* Hero skeleton */}
        <div className="rounded-3xl h-[200px]" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-3xl h-[340px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-3xl h-[160px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
            ))}
          </div>
        </div>
        {/* Activity + Skills skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-5">
          <div className="rounded-3xl h-[360px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="rounded-3xl h-[360px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        </div>
        {/* Tasks skeleton */}
        <div className="rounded-3xl h-[320px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* SECTION 1: Page Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div>
          <h1
            className="text-2xl sm:text-[2rem] font-semibold leading-tight"
            style={{ color: "#1a1a1a" }}
          >
            My Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            View your personal information and activity.
          </p>
        </div>
        {/* Desktop: Edit Profile pill button */}
        <button
          onClick={() => router.push(`${settingsPath}?tab=profile`)}
          className="hidden sm:flex items-center gap-2 rounded-full backdrop-blur-lg border border-[#dddddd] px-5 h-10 cursor-pointer transition-all duration-200 hover:border-[#aaaaaa]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e8e5e2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(241,239,237,0.45)";
          }}
        >
          <Pencil size={16} style={{ color: "#707070" }} />
          <span className="text-sm font-medium" style={{ color: "#4d4d4d" }}>
            Edit Profile
          </span>
        </button>
        {/* Mobile: icon-only button */}
        <button
          onClick={() => router.push(`${settingsPath}?tab=profile`)}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-lg border border-[#dddddd] cursor-pointer transition-all duration-200 hover:border-[#aaaaaa]"
          style={{ backgroundColor: "rgba(241,239,237,0.45)" }}
        >
          <Pencil size={16} style={{ color: "#707070" }} />
        </button>
      </motion.div>

      {/* SECTION 2: Profile Hero Card (DARK) */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        className="rounded-[24px] p-6 sm:p-8 relative overflow-hidden backdrop-blur-lg border"
        style={{
          ...glassDark,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Top row: Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          {/* Avatar with scale animation */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
            className="flex-shrink-0 w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] rounded-full flex items-center justify-center"
            style={{
              background: userImage
                ? undefined
                : "linear-gradient(135deg, #f3350c, #ff6b47)",
              border: "3px solid rgba(255,255,255,0.12)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-2xl sm:text-[32px] font-bold text-white">
                {initials}
              </span>
            )}
          </motion.div>

          {/* Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            {/* Name + Online status */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {userName}
              </h2>
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "#22c55e" }}
                />
                <span className="text-xs" style={{ color: "#22c55e" }}>
                  Online
                </span>
              </span>
            </div>
            {/* Role & Department */}
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              {displayRole} · {displayDepartment}
            </p>
            {/* Contact */}
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {userEmail}{profile?.phone ? ` · ${profile.phone}` : ""}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div
          className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Member since {memberSince}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {profile?.location || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Last active: {lastActive}
            </span>
          </div>
        </div>
      </motion.div>

      {/* SECTION 3: About Me + Work Details | Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT: About Me + Work Details */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={glassLight}
        >
          {/* About Me */}
          <h3 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
            About Me
          </h3>
          {profile?.bio ? (
            <p
              className="text-sm mt-3 leading-relaxed"
              style={{ color: "#707070" }}
            >
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm mt-3 italic" style={{ color: "#bbb" }}>
              No bio added yet.
            </p>
          )}

          {/* Divider */}
          <div className="h-px my-5" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

          {/* Work Details */}
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1a1a1a" }}>
            Work Details
          </h3>
          <div className="space-y-0">
            {[
              { label: "Department", value: displayDepartment },
              { label: "Position", value: displayRole },
              { label: "Employee ID", value: profile?.employeeId || "—" },
              { label: "Work Type", value: formatWorkType(profile?.workType) },
              { label: "Shift", value: formatShift(profile?.shift) },
              { label: "Reports To", value: "—" },
            ].map((item, idx, arr) => (
              <div
                key={item.label}
                className="flex justify-between py-2.5"
                style={{
                  borderBottom:
                    idx < arr.length - 1
                      ? "1px solid rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                <span className="text-[13px]" style={{ color: "#737373" }}>
                  {item.label}
                </span>
                <span
                  className="text-[13px] font-semibold"
                  style={{
                    color: item.value === "—" ? "#bbb" : "#1a1a1a",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: Quick Stats 2x2 */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
        >
          <div className="grid grid-cols-2 gap-4 h-full">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* SECTION 4: Recent Activity | Skills & Teams */}
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-5">
        {/* LEFT: Recent Activity Feed */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={glassLight}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
              Recent Activity
            </h3>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#707070" }}
            >
              {activities.length}
            </span>
          </div>

          {/* Activity list with stagger animation */}
          <div>
            {activities.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: "#bbb" }}>
                No recent activity
              </p>
            ) : (
            activities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={activityItemVariant}
                className="flex items-start gap-3 py-3"
                style={{
                  borderBottom:
                    idx < activities.length - 1
                      ? "1px solid rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                {/* Dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: ACTIVITY_COLORS[activity.type] }}
                />
                {/* Content — bold task names */}
                <span className="flex-1 text-sm" style={{ color: "#1a1a1a" }}>
                  {activity.boldText
                    ? activity.description.split(activity.boldText).map((part, pi, arr) => (
                        <span key={pi}>
                          {part}
                          {pi < arr.length - 1 && (
                            <span className="font-medium">{activity.boldText}</span>
                          )}
                        </span>
                      ))
                    : activity.description}
                </span>
                {/* Time */}
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "#bbb" }}
                >
                  {activity.time}
                </span>
              </motion.div>
            ))
            )}
          </div>

          {/* Footer link */}
          <div className="text-center mt-4">
            <button
              className="text-[13px] font-semibold cursor-pointer hover:underline"
              style={{ color: "#f3350c" }}
            >
              View All Activity
            </button>
          </div>
        </motion.div>

        {/* RIGHT: Skills & Teams */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariant}
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[#dddddd]"
          style={glassLight}
        >
          {/* Skills */}
          <h3 className="text-base font-semibold mb-3" style={{ color: "#1a1a1a" }}>
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.length === 0 ? (
              <p className="text-sm italic" style={{ color: "#bbb" }}>No skills added yet.</p>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium rounded-full px-3.5 py-1.5 transition-colors duration-200 cursor-default hover:bg-[rgba(0,0,0,0.08)]"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.04)",
                    color: "#4d4d4d",
                  }}
                >
                  {skill}
                </span>
              ))
            )}
          </div>

          {/* Divider */}
          <div className="h-px my-5" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

          {/* Teams */}
          <h3 className="text-base font-semibold mb-3" style={{ color: "#1a1a1a" }}>
            Teams
          </h3>
          <div className="space-y-2">
            {teams.length === 0 ? (
              <p className="text-sm italic py-2" style={{ color: "#bbb" }}>No teams assigned.</p>
            ) : (
            teams.map((team) => (
              <div
                key={team.name}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors duration-200 cursor-pointer hover:bg-[rgba(0,0,0,0.05)]"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                {/* Color dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                    {team.name}
                  </p>
                  <p className="text-xs" style={{ color: "#737373" }}>
                    {team.members} members
                  </p>
                </div>
                {/* Chevron */}
                <ChevronRight size={14} style={{ color: "#bbb" }} />
              </div>
            ))
            )}
          </div>
        </motion.div>
      </div>

      {/* SECTION 5: Recent Tasks Table */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={cardVariant}
        className="rounded-[24px] overflow-hidden backdrop-blur-lg border border-[#dddddd]"
        style={glassLight}
      >
        {/* Title row */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-base font-semibold" style={{ color: "#1a1a1a" }}>
            Recent Tasks
          </h3>
          <button
            onClick={() => router.push(tasksPath)}
            className="flex items-center gap-1 text-[13px] font-semibold cursor-pointer hover:underline"
            style={{ color: "#f3350c" }}
          >
            View All Tasks
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          {/* Header row */}
          <div
            className="grid px-6 py-3 text-xs uppercase font-medium tracking-wider"
            style={{
              gridTemplateColumns: "1fr 140px 100px 120px",
              backgroundColor: "rgba(0,0,0,0.03)",
              color: "#737373",
            }}
          >
            <span>Task</span>
            <span>Project</span>
            <span>Priority</span>
            <span>Status</span>
          </div>
          {/* Rows */}
          {tasks.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm" style={{ color: "#bbb" }}>No tasks assigned yet.</p>
            </div>
          ) : (
          tasks.map((task, idx) => (
            <div
              key={task.id}
              className="grid items-center px-6 py-3.5 transition-colors duration-200 hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
              style={{
                gridTemplateColumns: "1fr 140px 100px 120px",
                borderBottom:
                  idx < tasks.length - 1
                    ? "1px solid rgba(0,0,0,0.05)"
                    : "none",
              }}
            >
              <span
                className="text-sm font-medium truncate"
                style={{
                  color: task.status === "Done" ? "#bbb" : "#1a1a1a",
                  textDecoration: task.status === "Done" ? "line-through" : "none",
                }}
              >
                {task.title}
              </span>
              <span>
                <span
                  className="text-[11px] font-medium rounded-full px-2.5 py-0.5"
                  style={{
                    backgroundColor: PROJECT_STYLES[task.project]?.bg || "#f1efed",
                    color: PROJECT_STYLES[task.project]?.text || "#4d4d4d",
                  }}
                >
                  {task.project}
                </span>
              </span>
              <span>
                <span
                  className="text-[11px] font-semibold rounded-full px-2.5 py-0.5"
                  style={{
                    backgroundColor: PRIORITY_STYLES[task.priority]?.bg,
                    color: PRIORITY_STYLES[task.priority]?.text,
                  }}
                >
                  {task.priority}
                </span>
              </span>
              <span>
                <span
                  className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: STATUS_STYLES[task.status]?.bg,
                    color: STATUS_STYLES[task.status]?.text,
                  }}
                >
                  {task.status}
                </span>
              </span>
            </div>
          ))
          )}
        </div>

        {/* Mobile: Card-based layout */}
        <div className="md:hidden px-4 pb-4 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl p-3"
              style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            >
              <p
                className="text-sm font-medium mb-2"
                style={{
                  color: task.status === "Done" ? "#bbb" : "#1a1a1a",
                  textDecoration: task.status === "Done" ? "line-through" : "none",
                }}
              >
                {task.title}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[11px] font-medium rounded-full px-2.5 py-0.5"
                  style={{
                    backgroundColor: PROJECT_STYLES[task.project]?.bg || "#f1efed",
                    color: PROJECT_STYLES[task.project]?.text || "#4d4d4d",
                  }}
                >
                  {task.project}
                </span>
                <span
                  className="text-[11px] font-semibold rounded-full px-2.5 py-0.5"
                  style={{
                    backgroundColor: PRIORITY_STYLES[task.priority]?.bg,
                    color: PRIORITY_STYLES[task.priority]?.text,
                  }}
                >
                  {task.priority}
                </span>
                <span
                  className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: STATUS_STYLES[task.status]?.bg,
                    color: STATUS_STYLES[task.status]?.text,
                  }}
                >
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="text-center py-4"
          style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
        >
          <span className="text-xs" style={{ color: "#737373" }}>
            Showing {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
