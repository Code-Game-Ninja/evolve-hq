import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Attendance, User } from "@/lib/db/models";

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

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    await connectDB();

    let query: any = {};
    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    }

    const [items, total] = await Promise.all([
      Attendance.find(query)
        .populate("userId", "name image role")
        .sort({ date: -1, clockIn: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(query),
    ]);

    // If we are looking for today's attendance but some users haven't clocked in yet,
    // they should still show up as "absent" in the list if they are active employees.
    // This logic is often expected in HR dashboards.
    
    // For now, let's just return what's in the database.
    // The frontend can handle the "absent" state if needed.

    return NextResponse.json({
      items,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("GET /api/admin/hr/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
