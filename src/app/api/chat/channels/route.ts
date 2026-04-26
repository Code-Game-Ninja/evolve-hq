import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Channel, ReadReceipt, User } from "@/lib/db/models";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Public channels: visible to everyone
    // Private channels + DMs: only if user is a member
    const channels = await Channel.find({
      $or: [
        { type: "public" },
        { type: { $in: ["private", "dm"] }, "members.userId": session.user.id },
      ],
    }).sort({ lastMessageAt: -1, createdAt: -1 }).lean();

    const receipts = await ReadReceipt.find({ userId: session.user.id }).lean();
    const receiptMap = new Map(receipts.map((r: any) => [r.channelId.toString(), r.lastReadAt]));

    // Collect all unique user IDs from DM channels for batch lookup
    const dmUserIds = new Set<string>();
    const dmChannelOtherMembers = new Map<string, string>(); // channelId -> otherUserId

    channels.forEach(channel => {
      if (channel.type === "dm") {
        const otherMember = channel.members.find(
          (m) => m.userId.toString() !== session.user.id
        );
        if (otherMember) {
          const otherId = otherMember.userId.toString();
          dmUserIds.add(otherId);
          dmChannelOtherMembers.set(channel._id.toString(), otherId);
        }
      }
    });

    // Batch fetch all DM user data in a single query
    const userMap = new Map<string, { name: string; image?: string }>();
    if (dmUserIds.size > 0) {
      const users = await User.find({
        _id: { $in: Array.from(dmUserIds).map(id => new mongoose.Types.ObjectId(id)) }
      }).select("name image").lean() as any[];

      users.forEach(user => {
        userMap.set(user._id.toString(), { name: user.name, image: user.image });
      });
    }

    // Enrich channels with display names and unread status
    const enrichedChannels = channels.map((channel) => {
      const lastRead = receiptMap.get(channel._id.toString());
      const hasUnread = channel.lastMessageAt
        ? (!lastRead || new Date(channel.lastMessageAt) > new Date(lastRead))
        : false;

      let displayName = channel.name;

      if (channel.type === "dm") {
        const otherUserId = dmChannelOtherMembers.get(channel._id.toString());
        if (otherUserId) {
          const otherUser = userMap.get(otherUserId);
          if (otherUser) {
            displayName = otherUser.name;
          }
        }
      }

      return { ...channel, name: displayName, hasUnread };
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

    // For DMs: check if one already exists between these two users to avoid duplicates
    if (type === "dm" && memberIds?.length === 1) {
      const otherId = memberIds[0];
      const existing = await Channel.findOne({
        type: "dm",
        "members.userId": { $all: [
          new mongoose.Types.ObjectId(session.user.id),
          new mongoose.Types.ObjectId(otherId),
        ]},
        $expr: { $eq: [{ $size: "$members" }, 2] },
      }).lean();

      if (existing) {
        // Resolve display name for the current user's perspective
        const otherUser = await User.findById(otherId).select("name image").lean() as any;
        return NextResponse.json({ ...existing, name: otherUser?.name || existing.name });
      }
    }

    // Always include the current user as owner
    const allMemberIds = Array.from(new Set([...(memberIds || []), session.user.id]));
    const members = allMemberIds.map((id: string) => ({
      userId: new mongoose.Types.ObjectId(id),
      role: id === session.user.id ? "owner" : "member",
      joinedAt: new Date(),
    }));

    // For DMs, store the other person's name as channel name (resolved per-user in GET)
    let channelName = name;
    if (type === "dm" && memberIds?.length === 1) {
      const otherUser = await User.findById(memberIds[0]).select("name").lean() as any;
      channelName = otherUser?.name || name;
    }

    const channel = await Channel.create({
      name: channelName,
      description,
      type,
      members,
      createdBy: session.user.id,
      lastMessageAt: new Date(),
    });

    // For DMs, return with the other person's name from current user's perspective
    if (type === "dm" && memberIds?.length === 1) {
      const otherUser = await User.findById(memberIds[0]).select("name image").lean() as any;
      const channelObj = channel.toObject();
      return NextResponse.json({ ...channelObj, name: otherUser?.name || channelName }, { status: 201 });
    }

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Create channel error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Only superadmins can delete channels" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("id");
    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    }

    await connectDB();
    await Channel.findByIdAndDelete(channelId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete channel error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
