import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Channel } from "@/lib/db/models";
import mongoose from "mongoose";

// POST /api/chat/channels/[id]/join
// Auto-joins the current user to a public channel if not already a member
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const channel = await Channel.findById(id);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Only auto-join public channels
    if (channel.type !== "public") {
      return NextResponse.json({ ok: true }); // silently ignore for private/dm
    }

    const alreadyMember = channel.members.some(
      (m) => m.userId.toString() === session.user.id
    );

    if (!alreadyMember) {
      channel.members.push({
        userId: new mongoose.Types.ObjectId(session.user.id),
        role: "member",
        joinedAt: new Date(),
      });
      await channel.save();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Join channel error:", error);
    // Differentiate validation errors from server errors
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: "Invalid channel data" }, { status: 400 });
    }
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ error: "Invalid channel ID" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
