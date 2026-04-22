import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Channel, ReadReceipt } from "@/lib/db/models";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const channels = await Channel.find({
      "members.userId": session.user.id,
    }).sort({ lastMessageAt: -1, createdAt: -1 }).lean();

    const receipts = await ReadReceipt.find({ userId: session.user.id }).lean();
    const receiptMap = new Map(receipts.map((r: any) => [r.channelId.toString(), r.lastReadAt]));

    const enrichedChannels = channels.map(channel => {
      const lastRead = receiptMap.get(channel._id.toString());
      // A channel is unread if it has a message and we've either never read it or read it before the last message
      const hasUnread = channel.lastMessageAt ? (!lastRead || new Date(channel.lastMessageAt) > new Date(lastRead)) : false;
      return { ...channel, hasUnread };
    });

    return NextResponse.json(enrichedChannels);
  } catch (error) {
    console.error("Fetch channels error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, type, memberIds } = await req.json();

    if (!type || !["public", "private", "dm"].includes(type)) {
      return NextResponse.json({ error: "Invalid channel type" }, { status: 400 });
    }

    await connectDB();

    // Ensure current user is in members
    const allMemberIds = Array.from(new Set([...(memberIds || []), session.user.id]));
    
    const members = allMemberIds.map((id) => ({
      userId: id,
      role: id === session.user.id ? "owner" : "member",
      joinedAt: new Date(),
    }));

    const channel = await Channel.create({
      name,
      description,
      type,
      members,
      createdBy: session.user.id,
      lastMessageAt: new Date(),
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Create channel error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
