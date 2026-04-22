// GET /api/auth/2fa/status — check if 2FA is enabled for current user
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select("twoFactorEnabled");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ enabled: user.twoFactorEnabled ?? false });
}
