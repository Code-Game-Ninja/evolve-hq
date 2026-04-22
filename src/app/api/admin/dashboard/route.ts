// GET /api/admin/dashboard — aggregated admin dashboard data
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getDashboardData } from "@/lib/data/dashboard";

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

    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/admin/dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
