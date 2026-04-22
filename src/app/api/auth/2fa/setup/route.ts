// POST /api/auth/2fa/setup — generate TOTP secret + QR code data URL
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select("+twoFactorSecret +twoFactorEnabled");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
  }

  // Generate new TOTP secret
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "EVOLVE HQ",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUri = totp.toString();

  // Store secret temporarily (not enabled yet until verified)
  await User.findByIdAndUpdate(user._id, {
    twoFactorSecret: secret.base32,
  });

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(otpauthUri, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#f8f7f3" },
  });

  return NextResponse.json({
    qrCode: qrDataUrl,
    secret: secret.base32,
    otpauthUri,
  });
}
