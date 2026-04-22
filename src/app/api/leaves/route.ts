// Leave API — get leaves, apply, cancel
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Leave } from "@/lib/db/models/leave";

// Leave year config: Apr 2025 – Mar 2026
// Configurable via env vars so quota can be changed without a code deploy
const LEAVE_QUOTA = {
  casual: parseInt(process.env.LEAVE_QUOTA_CASUAL || "4"),
  sick: parseInt(process.env.LEAVE_QUOTA_SICK || "4"),
  earned: parseInt(process.env.LEAVE_QUOTA_EARNED || "4"),
};

// IST (UTC+5:30) helpers — timezone-safe regardless of server location
const IST_MS = 5.5 * 60 * 60 * 1000;

function getLeaveYear() {
  // Use IST to determine current month/year
  const istNow = new Date(Date.now() + IST_MS);
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth(); // 0-indexed
  // Leave year: April to March
  const startYear = month >= 3 ? year : year - 1;
  // Return IST-aware boundaries as UTC timestamps
  return {
    start: new Date(Date.UTC(startYear, 3, 1) - IST_MS), // Apr 1 00:00 IST
    end: new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999) - IST_MS), // Mar 31 23:59:59 IST
    label: `Apr ${startYear} – Mar ${startYear + 1}`,
  };
}

// GET /api/leaves — get leave records, balances, stats
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const leaveYear = getLeaveYear();

  await connectDB();

  // All leaves for this leave year
  const leaves = await Leave.find({
    userId,
    fromDate: { $gte: leaveYear.start, $lte: leaveYear.end },
  })
    .sort({ fromDate: -1 })
    .lean();

  // Calculate balances per type
  const balances = (["casual", "sick", "earned"] as const).map((type) => {
    const typeLeaves = leaves.filter((l) => l.type === type);
    const used = typeLeaves
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + l.days, 0);
    const pending = typeLeaves
      .filter((l) => l.status === "pending")
      .reduce((sum, l) => sum + l.days, 0);
    const total = LEAVE_QUOTA[type];
    return {
      type,
      total,
      used,
      pending,
      remaining: Math.max(0, total - used),
    };
  });

  const totalUsed = balances.reduce((s, b) => s + b.used, 0);
  const totalPending = balances.reduce((s, b) => s + b.pending, 0);
  const totalRemaining = balances.reduce((s, b) => s + b.remaining, 0);
  const totalQuota = balances.reduce((s, b) => s + b.total, 0);

  // Upcoming leaves (approved or pending, from today onward)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = leaves.filter(
    (l) =>
      new Date(l.fromDate) >= today &&
      ["pending", "approved"].includes(l.status)
  );

  return NextResponse.json({
    leaves,
    balances,
    summary: {
      totalQuota,
      totalUsed,
      totalPending,
      totalRemaining,
      upcomingCount: upcoming.length,
    },
    leaveYear: leaveYear.label,
    upcoming,
  });
}

// POST /api/leaves — apply for leave or cancel
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { action } = body;

  await connectDB();

  // Cancel a leave
  if (action === "cancel") {
    const { leaveId } = body;
    if (!leaveId) {
      return NextResponse.json({ error: "leaveId required" }, { status: 400 });
    }
    const leave = await Leave.findOne({ _id: leaveId, userId, status: "pending" });
    if (!leave) {
      return NextResponse.json(
        { error: "Leave not found or cannot be cancelled" },
        { status: 404 }
      );
    }
    leave.status = "cancelled";
    await leave.save();
    return NextResponse.json({ message: "Leave cancelled", leave });
  }

  // Apply for leave
  const { type, fromDate, toDate, reason, isHalfDay, halfDayPeriod } = body;

  if (!type || !fromDate || !toDate || !reason) {
    return NextResponse.json(
      { error: "type, fromDate, toDate, and reason are required" },
      { status: 400 }
    );
  }

  if (!["casual", "sick", "earned"].includes(type)) {
    return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (from > to) {
    return NextResponse.json(
      { error: "fromDate must be before toDate" },
      { status: 400 }
    );
  }

  // Calculate working days (excluding weekends)
  let days = 0;
  const current = new Date(from);
  while (current <= to) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  if (isHalfDay) days = 0.5;

  // Check balance
  const leaveYear = getLeaveYear();
  const existingUsed = await Leave.find({
    userId,
    type,
    status: { $in: ["approved", "pending"] },
    fromDate: { $gte: leaveYear.start, $lte: leaveYear.end },
  });
  const usedDays = existingUsed.reduce((s, l) => s + l.days, 0);
  const remaining = LEAVE_QUOTA[type as keyof typeof LEAVE_QUOTA] - usedDays;

  if (days > remaining) {
    return NextResponse.json(
      { error: `Insufficient ${type} leave balance (${remaining} remaining)` },
      { status: 400 }
    );
  }

  const leave = await Leave.create({
    userId,
    type,
    fromDate: from,
    toDate: to,
    days,
    isHalfDay: !!isHalfDay,
    halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
    reason,
    status: "pending",
  });

  return NextResponse.json({ message: "Leave applied successfully", leave });
}
