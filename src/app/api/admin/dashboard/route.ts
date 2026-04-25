// GET /api/admin/dashboard — aggregated admin dashboard data
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAdminDashboardData } from "@/lib/data/admin";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user as { role?: string };
    if (!role || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getAdminDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/admin/dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
