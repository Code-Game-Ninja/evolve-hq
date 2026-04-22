// POST /api/auth/2fa/verify — verify TOTP code and enable 2FA, return backup codes
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { NextRequest, NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select("+twoFactorSecret +twoFactorEnabled");
  if (!user || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA setup not initiated" }, { status: 400 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
  }

  // Verify the TOTP code
  const totp = new OTPAuth.TOTP({
    issuer: "EVOLVE HQ",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
  });

  const delta = totp.validate({ token: code.trim(), window: 1 });
  if (delta === null) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  // Generate backup codes
  const rawBackupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(4).toString("hex"); // 8-char hex codes
    rawBackupCodes.push(raw);
    hashedBackupCodes.push(await bcrypt.hash(raw, 10));
  }

  // Enable 2FA and store hashed backup codes
  await User.findByIdAndUpdate(user._id, {
    twoFactorEnabled: true,
    twoFactorBackupCodes: hashedBackupCodes,
  });

  return NextResponse.json({
    success: true,
    backupCodes: rawBackupCodes,
  });
}
