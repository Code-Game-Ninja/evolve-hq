import { connectDB } from "@/lib/db/mongodb";
import { User, Leave, Task, Inquiry, Attendance, Lead } from "@/lib/db/models";

export async function getAdminDashboardData() {
  await connectDB();

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
    User.countDocuments({ role: { $ne: "superadmin" } }),
    Task.countDocuments({ status: { $ne: "completed" } }),
    Task.countDocuments({ status: "in-progress" }),
    Leave.countDocuments({
      status: "approved",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }),
    Leave.countDocuments({ status: "pending" }),
    Inquiry.countDocuments({ status: "new" }),
    Lead.countDocuments()
  ]);

  // Get team members (top 5 for dashboard)
  const users = await User.find({ role: { $ne: "superadmin" } })
    .limit(8)
    .sort({ lastLogin: -1 });

  // Map users to team members with status
  const teamMembers = await Promise.all(users.map(async (u) => {
    // Check if on leave today
    const leave = await Leave.findOne({
      user: u._id,
      status: "approved",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    // Simple status logic: if leave, then leave; else present if logged in recently
    let status = "absent";
    if (leave) {
      status = "leave";
    } else if (u.lastLogin && (Date.now() - new Date(u.lastLogin).getTime() < 1000 * 60 * 60 * 24)) {
      status = "present";
    }

    return {
      name: u.name,
      role: u.designation || "Team Member",
      status,
      avatar: u.name.split(" ").map(n => n[0]).join("").toUpperCase(),
      image: u.image
    };
  }));

  // Get pending leaves
  const leaves = await Leave.find({ status: "pending" })
    .populate("user", "name image")
    .sort({ createdAt: -1 })
    .limit(5);

  const pendingLeaves = leaves.map(l => ({
    id: l._id.toString(),
    name: (l.user as any).name,
    avatar: (l.user as any).name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
    image: (l.user as any).image,
    type: l.type,
    dates: `${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`
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
      date: { $gte: day, $lt: nextDay }
    });

    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()[0],
      present,
      total: totalEmployees,
      percent: totalEmployees > 0 ? (present / totalEmployees) * 100 : 0
    };
  }));

  // Mock recent activity (in a real app, this would be from an Activity log model)
  const recentActivity = [
    { name: "Admin", action: "System update completed", time: "2m ago", type: "success" },
    { name: "System", action: "Database backup successful", time: "1h ago", type: "success" },
    { name: "System", action: "New inquiry from contact form", time: "2h ago", type: "warning" },
    { name: "Admin", action: "Policy document updated", time: "4h ago", type: "success" },
  ];

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
