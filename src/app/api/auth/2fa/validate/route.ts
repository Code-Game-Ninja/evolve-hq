// POST /api/auth/2fa/validate — validate TOTP code during login (pre-session)
// Requires a preAuthToken from /api/auth/2fa/check (no bcrypt here)
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { NextRequest, NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";
import { checkRouteLimit } from "@/lib/rate-limit";
import { verifyPreAuthToken } from "@/lib/auth/pre-auth-token";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  const { preAuthToken, code } = await req.json();

  if (!preAuthToken || !code) {
    return NextResponse.json(
      { error: "Pre-auth token and code are required" },
      { status: 400 }
    );
  }

  // Verify the pre-auth token (cryptographic proof of password check)
  const tokenData = await verifyPreAuthToken(preAuthToken);
  if (!tokenData) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Rate limit by IP+email combo (stricter: 5 req/15min)
  const limitKey = `2fa-validate:${ip}:${tokenData.email.toLowerCase()}`;
  const { allowed, retryAfterMs } = checkRouteLimit(limitKey, 5, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  await connectDB();

  const user = await User.findById(tokenData.userId).select(
    "+twoFactorSecret +twoFactorBackupCodes"
  );
  if (!user || !user.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trimmedCode = code.trim();

  // Try TOTP code first
  const totp = new OTPAuth.TOTP({
    issuer: "EVOLVE HQ",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
  });

  const delta = totp.validate({ token: trimmedCode, window: 1 });
  if (delta !== null) {
    return NextResponse.json({ valid: true });
  }

  // Try backup codes
  if (user.twoFactorBackupCodes?.length) {
    for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
      const isMatch = await bcrypt.compare(trimmedCode, user.twoFactorBackupCodes[i]);
      if (isMatch) {
        // Don't consume backup code here — authorize() will consume it on signIn
        return NextResponse.json({ valid: true, backupCodeUsed: true });
      }
    }
  }

  return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
}
