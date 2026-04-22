// GET /api/admin/hr/leaves — admin/superadmin only
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Leave } from "@/lib/db/models";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["admin", "superadmin"].includes(session.user.role)) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (from || to) {
      filter.fromDate = {};
      if (from) filter.fromDate.$gte = new Date(from);
      if (to) filter.fromDate.$lte = new Date(to);
    }

    const [docs, total] = await Promise.all([
      Leave.find(filter)
        .populate("userId", "name role image")
        .populate("reviewedBy", "name role image")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Leave.countDocuments(filter),
    ]);

    const items = docs.map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = doc as any;
      d.id = d._id.toString();
      delete d._id;
      return d;
    });

    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    console.error("[admin/hr/leaves GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
