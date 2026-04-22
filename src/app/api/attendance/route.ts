import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Attendance } from "@/lib/db/models";
import mongoose from "mongoose";

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

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const now = new Date();
    const todayStart = startOfDayIST(now);

    // If month/year provided, fetch for that month
    let query: any = { userId };
    if (!isNaN(month) && !isNaN(year)) {
      const monthStart = new Date(Date.UTC(year, month - 1, 1) - IST_MS);
      const monthEnd = new Date(Date.UTC(year, month, 1) - IST_MS);
      query.date = { $gte: monthStart, $lt: monthEnd };
    }

    const records = await Attendance.find(query).sort({ date: -1 }).lean();

    // Find today's record
    const today = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) }
    }).lean();

    return NextResponse.json({
      records,
      today
    });
  } catch (err) {
    console.error("GET /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, workMode = "office", note } = await req.json();
    if (!["in", "out"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const now = new Date();
    const todayStart = startOfDayIST(now);

    let attendance = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (type === "in") {
      if (attendance && !attendance.clockOut) {
        return NextResponse.json({ error: "Already clocked in" }, { status: 400 });
      }

      if (!attendance) {
        // First clock-in of the day
        // Check for late arrival (IST 10:15 AM)
        const istNow = new Date(now.getTime() + IST_MS);
        const hours = istNow.getUTCHours();
        const minutes = istNow.getUTCMinutes();
        const isLateArrival = hours > 10 || (hours === 10 && minutes > 15);

        attendance = new Attendance({
          userId,
          date: todayStart,
          clockIn: now,
          status: "active",
          workMode,
          logs: [{ time: now, type: "in", note: isLateArrival ? "Late arrival" : note }]
        });
      } else {
        // Re-clock in after a break
        attendance.clockOut = undefined; // Clear clockOut to mark as active
        attendance.status = "active";
        attendance.logs.push({ time: now, type: "in", note });
      }
    } else {
      // Clock out
      if (!attendance || attendance.status !== "active") {
        return NextResponse.json({ error: "Not clocked in" }, { status: 400 });
      }

      attendance.clockOut = now;
      attendance.logs.push({ time: now, type: "out", note });

      // Calculate total duration from logs
      let totalMs = 0;
      let lastIn: number | null = null;
      for (const log of attendance.logs) {
        if (log.type === "in") {
          lastIn = new Date(log.time).getTime();
        } else if (log.type === "out" && lastIn !== null) {
          totalMs += new Date(log.time).getTime() - lastIn;
          lastIn = null;
        }
      }
      attendance.duration = Math.round(totalMs / 60000);
      
      // Determine final status
      const hoursWorked = totalMs / 3600000;
      const firstLog = attendance.logs[0];
      const isLateArrival = firstLog?.note === "Late arrival";

      if (hoursWorked >= 8) {
        attendance.status = isLateArrival ? "late" : "present";
      } else if (hoursWorked >= 4) {
        attendance.status = "half-day";
      } else {
        // If they worked very little, it's still technically a 'present' if they clocked in/out?
        // Usually, < 4 hours is absent or 'short-leave'. 
        // For now, let's stick to 'absent' as a penalty for very low hours.
        attendance.status = "absent";
      }
    }

    await attendance.save();

    return NextResponse.json(attendance);
  } catch (err) {
    console.error("POST /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
