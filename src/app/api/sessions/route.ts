import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Session } from "@/lib/db/models/session";

// GET /api/sessions — list active sessions for current user
export async function GET() {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const sessions = await Session.find({
    userId: authSession.user.id,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActive: -1 })
    .lean();

  const currentJti = authSession.user.sessionJti;

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s._id.toString(),
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.sessionId === currentJti,
    })),
  });
}

// DELETE /api/sessions — revoke all sessions except current
export async function DELETE(req: Request) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");
  const currentJti = authSession.user.sessionJti;

  await connectDB();

  if (sessionId) {
    // Revoke a specific session
    const target = await Session.findOne({
      _id: sessionId,
      userId: authSession.user.id,
    });
    if (!target) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    await Session.deleteOne({ _id: sessionId });
    return NextResponse.json({ success: true });
  }

  // Revoke all except current
  if (currentJti) {
    await Session.deleteMany({ userId: authSession.user.id, sessionId: { $ne: currentJti } });
  } else {
    await Session.deleteMany({ userId: authSession.user.id });
  }
  return NextResponse.json({ success: true });
}
