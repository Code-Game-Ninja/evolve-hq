// POST /api/auth/2fa/check — verify credentials + check if 2FA is required
// Returns a preAuthToken (signed JWT) so authorize() never re-hashes the password
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { checkRouteLimit } from "@/lib/rate-limit";
import { createPreAuthToken } from "@/lib/auth/pre-auth-token";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  const { allowed, retryAfterMs } = checkRouteLimit(`2fa-check:${ip}`, 10, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ email }).select("password twoFactorEnabled isActive");
  if (!user || !user.password || !user.isActive) {
    // Don't reveal whether user exists
    return NextResponse.json({ requires2FA: false });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ requires2FA: false });
  }

  // Issue a pre-auth token so downstream steps skip bcrypt
  const preAuthToken = await createPreAuthToken(email, user._id.toString());

  return NextResponse.json({
    requires2FA: user.twoFactorEnabled ?? false,
    preAuthToken,
  });
}
