import { connectDB } from "@/lib/db/mongodb";
import { User, Leave, Task, Inquiry, Attendance, Lead, AuditLog } from "@/lib/db/models";

function toRelativeTime(input: Date | string) {
  const timeDiff = Date.now() - new Date(input).getTime();
  if (timeDiff > 1000 * 60 * 60 * 24) {
    return `${Math.floor(timeDiff / (1000 * 60 * 60 * 24))}d ago`;
  }
  if (timeDiff > 1000 * 60 * 60) {
    return `${Math.floor(timeDiff / (1000 * 60 * 60))}h ago`;
  }
  if (timeDiff > 1000 * 60) {
    return `${Math.floor(timeDiff / (1000 * 60))}m ago`;
  }
  return "Just now";
}

export async function getAdminDashboardData() {
  await connectDB();

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Get stats
  const [
    totalEmployees,
    activeTasks,
    inProgressTasks,
    onLeaveToday,
    pendingApprovals,
    newInquiries,
    totalLeads
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: "superadmin" }, isActive: true }),
    Task.countDocuments({ status: { $ne: "done" } }),
    Task.countDocuments({ status: "in-progress" }),
    Leave.countDocuments({
      status: "approved",
      fromDate: { $lt: dayEnd },
      toDate: { $gte: dayStart }
    }),
    Leave.countDocuments({ status: "pending" }),
    Inquiry.countDocuments({ status: "new" }),
    Lead.countDocuments()
  ]);

  // Get team members (top for dashboard)
  const users = await User.find({ role: { $ne: "superadmin" }, isActive: true })
    .limit(8)
    .sort({ lastLogin: -1, createdAt: -1 })
    .lean();

  const userIds = users.map((u) => u._id);
  const [todayLeaves, todayAttendance] = userIds.length
    ? await Promise.all([
        Leave.find({
          userId: { $in: userIds },
          status: "approved",
          fromDate: { $lt: dayEnd },
          toDate: { $gte: dayStart },
        })
          .select("userId")
          .lean(),
        Attendance.find({
          userId: { $in: userIds },
          date: { $gte: dayStart, $lt: dayEnd },
        })
          .select("userId status")
          .lean(),
      ])
    : [[], []];

  const onLeaveSet = new Set(todayLeaves.map((l) => l.userId.toString()));
  const attendanceMap = new Map(
    todayAttendance.map((a) => [a.userId.toString(), a.status])
  );

  // Map users to team members with status
  const teamMembers = users.map((u) => {
    const userId = u._id.toString();
    let status = "absent";

    if (onLeaveSet.has(userId)) {
      status = "leave";
    } else {
      const attendanceStatus = attendanceMap.get(userId);
      if (
        attendanceStatus &&
        ["present", "late", "wfh", "active"].includes(attendanceStatus)
      ) {
        status = "present";
      } else if (
        u.lastLogin &&
        Date.now() - new Date(u.lastLogin).getTime() < 1000 * 60 * 60 * 24
      ) {
        status = "present";
      }
    }

    const name = u.name || "User";
    const role = Array.isArray(u.positions) && u.positions[0]
      ? u.positions[0]
      : u.role || "Team Member";

    return {
      name,
      role,
      status,
      avatar: name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      image: u.image || null,
    };
  });

  // Get pending leaves
  const leaves = await Leave.find({ status: "pending" })
    .populate("userId", "name image")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const pendingLeaves = leaves.map(l => ({
    id: l._id.toString(),
    name: ((l.userId as { name?: string } | null)?.name || "User"),
    avatar: (((l.userId as { name?: string } | null)?.name || "User").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()),
    image: ((l.userId as { image?: string | null } | null)?.image || null),
    type: l.type,
    dates: `${new Date(l.fromDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${new Date(l.toDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
  }));

  // Get attendance data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const attendanceData = await Promise.all(last7Days.map(async (day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const present = await Attendance.countDocuments({
      date: { $gte: day, $lt: nextDay },
      status: { $in: ["present", "late", "wfh", "active"] }
    });

    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      present,
      total: totalEmployees,
      percent: totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0
    };
  }));

  // Get real recent activity from AuditLog
  const logs = await AuditLog.find()
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const recentActivity = logs.map(log => {
    return {
      name: (log.userId as { name?: string } | null)?.name || "System",
      action: log.action,
      time: toRelativeTime(log.createdAt),
      type: log.type
    };
  });

  return {
    stats: {
      totalEmployees,
      activeTasks,
      inProgressTasks,
      onLeaveToday,
      pendingApprovals,
      newInquiries,
      totalLeads
    },
    teamMembers,
    pendingLeaves,
    attendanceData,
    recentActivity
  };
}
