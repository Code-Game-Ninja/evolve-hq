// POST /api/auth/change-password — changes password and clears mustChangePassword flag
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { Session as SessionModel } from "@/lib/db/models/session";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword) ||
    !/[^A-Za-z0-9]/.test(newPassword)
  ) {
    return NextResponse.json(
      { error: "Password must include uppercase, lowercase, number, and special character." },
      { status: 400 }
    );
  }

  await connectDB();

  const user = await User.findById(session.user.id).select("+password");
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password || "");
  if (!passwordMatch) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await User.findByIdAndUpdate(session.user.id, {
    password: hashedPassword,
    mustChangePassword: false,
  });

  // Invalidate all other sessions (keep only the current one)
  const currentJti = session.user.sessionJti;
  if (currentJti) {
    await SessionModel.deleteMany({
      userId: session.user.id,
      sessionId: { $ne: currentJti },
    });
  }

  return NextResponse.json({ success: true });
}
