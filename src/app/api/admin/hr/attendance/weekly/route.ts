import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Attendance, User } from "@/lib/db/models";

// IST (UTC+5:30) helpers
const IST_MS = 5.5 * 60 * 60 * 1000;
function startOfDayIST(date: Date): Date {
  const istDate = new Date(date.getTime() + IST_MS);
  return new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()) - IST_MS);
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!role || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const totalActiveUsers = await User.countDocuments({ isActive: true });
    
    // Calculate last 4 weeks
    const weeks = [];
    const now = new Date();
    const todayStart = startOfDayIST(now);
    
    // Find the Monday of the current week
    const currentDay = todayStart.getDay(); // 0 = Sun, 1 = Mon
    const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay;
    const currentMonday = new Date(todayStart.getTime() + mondayDiff * 24 * 60 * 60 * 1000);

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(currentMonday.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
      const daysData = [];

      for (let d = 0; d < 5; d++) {
        const dayDate = new Date(weekStart.getTime() + d * 24 * 60 * 60 * 1000);
        const dayNextDate = new Date(dayDate.getTime() + 24 * 60 * 60 * 1000);

        if (dayDate > todayStart) {
          daysData.push({ label: weekDays[d], present: 0, late: 0, absent: 0 });
          continue;
        }

        const stats = await Attendance.aggregate([
          {
            $match: {
              date: { $gte: dayDate, $lt: dayNextDate }
            }
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]);

        const statusCounts: Record<string, number> = {};
        stats.forEach(s => {
          statusCounts[s._id] = s.count;
        });

        const present = (statusCounts["present"] || 0) + (statusCounts["wfh"] || 0) + (statusCounts["active"] || 0);
        const late = statusCounts["late"] || 0;
        const absent = Math.max(0, totalActiveUsers - (present + late + (statusCounts["half-day"] || 0)));

        daysData.push({
          label: weekDays[d],
          present,
          late,
          absent
        });
      }

      weeks.push({
        weekLabel: w === 0 ? "Current Week" : `Week of ${weekStart.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}`,
        days: daysData
      });
    }

    return NextResponse.json({ weeks });
  } catch (err) {
    console.error("GET /api/admin/hr/attendance/weekly error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
