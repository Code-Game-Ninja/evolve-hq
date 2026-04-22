import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Task, Leave, Meeting, Attendance } from "@/lib/db/models";
import mongoose from "mongoose";

// GET /api/me/stats — personal stats for the logged-in user

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon...
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export async function GET() {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const startOfWeek = getStartOfWeek();
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();

    await connectDB();

    // Run all cheap countDocuments in parallel
    const [
      taskTotal,
      taskInProgress,
      taskDoneThisWeek,
      leaveTakenThisYear,
      upcomingMeetings,
      recentAttendance,
    ] = await Promise.all([
      Task.countDocuments({ assigneeId: userId }),
      Task.countDocuments({ assigneeId: userId, status: "in-progress" }),
      Task.countDocuments({
        assigneeId: userId,
        status: "done",
        updatedAt: { $gte: startOfWeek },
      }),
      Leave.countDocuments({
        userId,
        status: "approved",
        fromDate: { $gte: startOfYear },
      }),
      Meeting.countDocuments({
        $or: [{ organizerId: userId }, { attendeeIds: userId }],
        status: "scheduled",
        startTime: { $gte: now },
      }),
      Attendance.find({ userId })
        .sort({ date: -1 })
        .limit(30)
        .lean(),
    ]);

    // Compute attendance streak (consecutive present/wfh/late days ending today)
    const presentStatuses = new Set(["present", "late", "wfh", "active"]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let todayStatus = "no-data";

    // Sort ascending by date for streak counting
    const sortedAttendance = (
      recentAttendance as Array<{ date: string | Date; status: string }>
    ).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Find today's record
    const todayRecord = sortedAttendance.find((r) => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    if (todayRecord) todayStatus = todayRecord.status;

    // Count streak of consecutive present days going backward from today
    const checkDate = new Date(today);
    for (let i = 0; i < 30; i++) {
      const match = sortedAttendance.find((r) => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === checkDate.getTime();
      });
      if (match && presentStatuses.has(match.status)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        // Skip weekends when counting streak
        while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
      } else {
        break;
      }
    }

    const leaveMax = 20;
    const leaveRemaining = Math.max(0, leaveMax - leaveTakenThisYear);

    return NextResponse.json({
      tasks: {
        total: taskTotal,
        inProgress: taskInProgress,
        doneThisWeek: taskDoneThisWeek,
      },
      attendance: {
        todayStatus,
        streak,
      },
      leaves: {
        takenThisYear: leaveTakenThisYear,
        remaining: leaveRemaining,
      },
      upcomingMeetings,
    });
  } catch (err) {
    console.error("GET /api/me/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
