// POST /api/admin/projects/reorder — admin/superadmin only
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Project } from "@/lib/db/models";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["admin", "superadmin"].includes(session.user.role)) return null;
  return session;
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await request.json();
    const items: { id: string; order: number }[] = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    await Promise.all(
      items.map(({ id, order }) =>
        Project.findByIdAndUpdate(id, { order })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/projects/reorder POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
