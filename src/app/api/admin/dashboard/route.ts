// GET /api/admin/dashboard — aggregated admin dashboard data
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User, Task, Leave, Attendance, Inquiry, Lead } from "@/lib/db/models";

// IST (UTC+5:30) helpers — timezone-safe regardless of server location
const IST_MS = 5.5 * 60 * 60 * 1000;
function startOfDayIST(date: Date): Date {
  const istDate = new Date(date.getTime() + IST_MS);
  return new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()) - IST_MS);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!role || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const todayStart = startOfDayIST(now);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalEmployees,
      activeTasks,
      onLeaveToday,
      pendingApprovals,
      recentTeamMembers,
      pendingLeaveRequests,
      weeklyAttendance,
      totalUsers,
      inProgressTasks,
      newInquiries,
      totalLeads,
    ] = await Promise.all([
      // 1. Total employees (active users)
      User.countDocuments({ isActive: true }),
      
      // 2. Active tasks (not done)
      Task.countDocuments({ status: { $ne: "done" } }),
      
      // 3. On leave today
      Leave.countDocuments({
        status: "approved",
        fromDate: { $lte: todayEnd },
        toDate: { $gte: todayStart },
      }),
      
      // 4. Pending approvals
      Leave.countDocuments({ status: "pending" }),
      
      // 5. Recent team members
      User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select("name role positions image isActive createdAt").lean(),
      
      // 6. Pending leave requests
      Leave.find({ status: "pending" }).sort({ createdAt: -1 }).limit(5).populate("userId", "name image").lean(),
      
      // 7. Weekly attendance
      (async () => {
        const days: { day: string; date: Date }[] = [];
        let cursor = new Date(todayStart);
        while (days.length < 5) {
          const istCursor = new Date(cursor.getTime() + IST_MS);
          const istWeekday = istCursor.getUTCDay();
          if (istWeekday !== 0 && istWeekday !== 6) {
            days.unshift({
              day: cursor.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }),
              date: new Date(cursor),
            });
          }
          cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
        }
        const result = [];
        for (const { day, date } of days) {
          const dayStart = date;
          const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
          const count = await Attendance.countDocuments({
            date: { $gte: dayStart, $lt: dayEnd },
            status: { $in: ["present", "late", "wfh", "active"] },
          });
          result.push({ day, present: count });
        }
        return result;
      })(),
      
      // Total users for percentage
      User.countDocuments({ isActive: true }),
      
      // In progress tasks
      Task.countDocuments({ status: "in-progress" }),

      // 8. New inquiries
      Inquiry.countDocuments({ status: "new" }),

      // 9. Total leads
      Lead.countDocuments({ status: { $nin: ["won", "lost"] } }),
    ]);

    // Format team members with real status
    const teamUserIds = (recentTeamMembers as Array<Record<string, unknown>>).map(
      (u) => (u._id as { toString(): string }).toString()
    );

    // Fetch today's attendance for these team members
    const [teamAttendance, teamOnLeave] = await Promise.all([
      Attendance.find({
        userId: { $in: teamUserIds },
        date: { $gte: todayStart, $lt: todayEnd },
      }).lean(),
      Leave.find({
        userId: { $in: teamUserIds },
        status: "approved",
        fromDate: { $lte: todayEnd },
        toDate: { $gte: todayStart },
      })
        .select("userId")
        .lean(),
    ]);

    const attendanceMap = new Map<string, string>();
    for (const a of teamAttendance as Array<{ userId: { toString(): string }; status: string }>) {
      attendanceMap.set(a.userId.toString(), a.status);
    }
    const onLeaveSet = new Set(
      (teamOnLeave as Array<{ userId: { toString(): string } }>).map((l) => l.userId.toString())
    );

    const teamMembers = (recentTeamMembers as Array<Record<string, unknown>>).map((u) => {
      const name = (u.name as string) || "User";
      const uid = (u._id as { toString(): string }).toString();
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      let status = "absent";
      if (onLeaveSet.has(uid)) {
        status = "leave";
      } else if (attendanceMap.has(uid)) {
        const attStatus = attendanceMap.get(uid)!;
        status = attStatus === "active" || attStatus === "present" || attStatus === "wfh" || attStatus === "late"
          ? "present"
          : attStatus;
      }

      return {
        name,
        role: (u.role as string) || "employee",
        avatar: initials,
        image: u.image || null,
        status,
      };
    });

    // Format pending leaves
    const pendingLeaves = (pendingLeaveRequests as Array<Record<string, unknown>>).map((l) => {
      const user = l.userId as { name?: string; image?: string } | null;
      const userName = user?.name || "User";
      const initials = userName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const fromDate = new Date(l.fromDate as string);
      const toDate = new Date(l.toDate as string);
      const sameDay = fromDate.toDateString() === toDate.toDateString();
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
      const dates = sameDay ? fmt(fromDate) : `${fmt(fromDate)} – ${fmt(toDate)}`;

      return {
        id: (l._id as { toString(): string }).toString(),
        name: userName,
        avatar: initials,
        image: user?.image || null,
        type: (l.leaveType as string) || "Leave",
        dates,
      };
    });

    // Format weekly attendance with percentage
    const attendanceData = (weeklyAttendance as Array<{ day: string; present: number }>).map((d) => ({
      day: d.day,
      present: d.present,
      total: totalUsers,
      percent: totalUsers > 0 ? Math.round((d.present / totalUsers) * 100) : 0,
    }));

    // 8. Recent Activity — Combine latest users, tasks, and leaves
    const [latestUsers, latestTasks, latestLeaves] = await Promise.all([
      User.find({ isActive: true }).sort({ createdAt: -1 }).limit(3).select("name createdAt").lean(),
      Task.find().sort({ createdAt: -1 }).limit(3).select("title createdAt").lean(),
      Leave.find().sort({ createdAt: -1 }).limit(3).populate("userId", "name").select("createdAt leaveType").lean(),
    ]);

    const activityList = [
      ...(latestUsers as any[]).map(u => ({
        name: u.name,
        action: "joined the team",
        time: u.createdAt,
        type: "success"
      })),
      ...(latestTasks as any[]).map(t => ({
        name: "",
        action: `New task created: ${t.title}`,
        time: t.createdAt,
        type: "warning"
      })),
      ...(latestLeaves as any[]).map(l => ({
        name: l.userId?.name || "Someone",
        action: `requested ${l.leaveType}`,
        time: l.createdAt,
        type: "error"
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
     .slice(0, 5)
     .map(a => {
        const d = new Date(a.time);
        const diff = Date.now() - d.getTime();
        let timeStr = "Just now";
        if (diff > 86400000) timeStr = `${Math.floor(diff / 86400000)}d ago`;
        else if (diff > 3600000) timeStr = `${Math.floor(diff / 3600000)}h ago`;
        else if (diff > 60000) timeStr = `${Math.floor(diff / 60000)}m ago`;
        
        return { ...a, time: timeStr };
     });

    return NextResponse.json({
      stats: {
        totalEmployees,
        activeTasks,
        inProgressTasks,
        onLeaveToday,
        pendingApprovals,
        newInquiries,
        totalLeads,
      },
      teamMembers,
      pendingLeaves,
      attendanceData,
      recentActivity: activityList,
    });
  } catch (err) {
    console.error("GET /api/admin/dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
