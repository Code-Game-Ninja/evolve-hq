// Daily Updates API — create/get standup notes
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { DailyUpdate } from "@/lib/db/models";

// Helper: get start of day
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/daily-updates — get today's update for current user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const today = startOfDay(new Date());
  const update = await DailyUpdate.findOne({
    userId: session.user.id,
    date: today,
  }).lean();

  return NextResponse.json({ update: update || null });
}

// POST /api/daily-updates — create or update today's standup
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { yesterday, today: todayPlan } = body;

  if (!yesterday?.trim() && !todayPlan?.trim()) {
    return NextResponse.json(
      { error: "At least one field must be filled" },
      { status: 400 }
    );
  }

  await connectDB();

  const todayDate = startOfDay(new Date());

  // Upsert — one update per user per day
  const update = await DailyUpdate.findOneAndUpdate(
    { userId: session.user.id, date: todayDate },
    {
      userId: session.user.id,
      date: todayDate,
      yesterday: yesterday?.trim() || "",
      today: todayPlan?.trim() || "",
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  return NextResponse.json({ update, message: "Daily update saved" }, { status: 201 });
}
