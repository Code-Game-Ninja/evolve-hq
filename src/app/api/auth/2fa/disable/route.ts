// POST /api/auth/2fa/disable — disable 2FA after verifying code
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { NextRequest, NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
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

  const user = await User.findById(session.user.id).select(
    "+twoFactorSecret +twoFactorEnabled +twoFactorBackupCodes"
  );
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
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
    // TOTP failed — try backup codes
    let backupValid = false;
    if (user.twoFactorBackupCodes?.length) {
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const isMatch = await bcrypt.compare(code.trim(), user.twoFactorBackupCodes[i]);
        if (isMatch) {
          backupValid = true;
          break;
        }
      }
    }
    if (!backupValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }
  }

  // Disable 2FA and clear secret + backup codes
  await User.findByIdAndUpdate(user._id, {
    twoFactorEnabled: false,
    $unset: { twoFactorSecret: 1, twoFactorBackupCodes: 1 },
  });

  return NextResponse.json({ success: true });
}
