// Admin Reset Password API — generates a new temporary password for a user
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateTempPassword } from "@/lib/utils/generateTempPassword";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";

// POST /api/admin/users/reset-password — reset a user's password
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerRole = session.user.role;
  if (!["admin", "superadmin"].includes(callerRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only superadmin can reset admin/superadmin passwords
  if (
    ["admin", "superadmin"].includes(user.role) &&
    callerRole !== "superadmin"
  ) {
    return NextResponse.json(
      { error: "Only superadmin can reset admin or superadmin passwords" },
      { status: 403 }
    );
  }

  // Generate and hash new temp password
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    mustChangePassword: true,
  });

  return NextResponse.json({
    success: true,
    userName: user.name,
    userEmail: user.email,
    tempPassword,
  });
}
