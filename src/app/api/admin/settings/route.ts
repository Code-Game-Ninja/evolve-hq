// GET + PUT /api/admin/settings — website-wide settings (admin/superadmin only)
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { SiteSettings } from "@/lib/db/models/settings";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["admin", "superadmin"].includes(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  // Return existing doc, or create defaults on first access
  let settings = await SiteSettings.findOne().lean();
  if (!settings) {
    settings = await SiteSettings.create({});
  }

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const body = await req.json();

  const settings = await SiteSettings.findOneAndUpdate(
    {},
    { ...body },
    { new: true, upsert: true, runValidators: true }
  );

  return NextResponse.json(settings);
}
