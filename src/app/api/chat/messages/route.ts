import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Message, Channel, Notification } from "@/lib/db/models";
import { pusherServer } from "@/lib/pusher";

// ── GET /api/chat/messages ────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const threadParentId = searchParams.get("threadParentId");
    if (!channelId) return NextResponse.json({ error: "Channel ID required" }, { status: 400 });

    await connectDB();

    const channel = await Channel.findById(channelId);
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const isMember = channel.members.some((m: any) => m.userId.toString() === session.user.id);
    if (!isMember && channel.type !== "public") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query: any = { channelId };
    if (threadParentId) {
      query.threadParentId = threadParentId;
    } else {
      query.threadParentId = { $exists: false };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("senderId", "name email image avatar")
      .limit(100);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST /api/chat/messages ───────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId, content, threadParentId, attachments } = await req.json();
    if (!channelId || !content) {
      return NextResponse.json({ error: "Channel ID and content required" }, { status: 400 });
    }

    await connectDB();

    const message = await Message.create({
      channelId,
      senderId: session.user.id,
      content,
      threadParentId,
      attachments: attachments || [],
    });

    await Channel.findByIdAndUpdate(channelId, { lastMessageAt: new Date() });

    if (threadParentId) {
      await Message.findByIdAndUpdate(threadParentId, { $inc: { replyCount: 1 } });
    }

    const populatedMessage = await message.populate("senderId", "name email image avatar");

    // Real-time: push to channel subscribers
    try {
      await pusherServer.trigger(`chat_${channelId}`, "new-message", populatedMessage);
    } catch (e) {
      console.warn("Pusher trigger failed:", e);
    }

    // Notify other channel members (non-blocking)
    notifyChannelMembers({
      channelId,
      senderId: session.user.id,
      senderName: session.user.name || "Someone",
      content,
      threadParentId,
    }).catch(console.error);

    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── PATCH /api/chat/messages ──────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messageId, content, isPinned } = await req.json();
    if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });

    await connectDB();

    const update: any = {};
    if (content !== undefined) { update.content = content; update.isEdited = true; update.editedAt = new Date(); }
    if (isPinned !== undefined) { update.isPinned = isPinned; }

    const query: any = { _id: messageId };
    if (content !== undefined) query.senderId = session.user.id;

    const message = await Message.findOneAndUpdate(query, update, { new: true })
      .populate("senderId", "name email image avatar");

    if (!message) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    try {
      await pusherServer.trigger(`chat_${message.channelId}`, "message-updated", message);
    } catch (e) {
      console.warn("Pusher trigger failed:", e);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Edit message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE /api/chat/messages ─────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });

    await connectDB();

    const message = await Message.findOneAndDelete({ _id: messageId, senderId: session.user.id });
    if (!message) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    if (message.threadParentId) {
      await Message.findByIdAndUpdate(message.threadParentId, { $inc: { replyCount: -1 } });
    }

    try {
      await pusherServer.trigger(`chat_${message.channelId}`, "message-deleted", {
        messageId: message._id,
        threadParentId: message.threadParentId,
      });
    } catch (e) {
      console.warn("Pusher trigger failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── Helper: notify all channel members except sender ─────────────────────────
async function notifyChannelMembers({
  channelId,
  senderId,
  senderName,
  content,
  threadParentId,
}: {
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  threadParentId?: string;
}) {
  const channel = await Channel.findById(channelId).lean() as any;
  if (!channel) return;

  const channelName = channel.name || "a channel";
  const preview = content.length > 60 ? content.slice(0, 60) + "…" : content;
  const title = channel.type === "dm"
    ? `${senderName} sent you a message`
    : `${senderName} in #${channelName}`;
  const description = threadParentId ? `Replied in thread: ${preview}` : preview;

  const recipientIds: string[] = channel.members
    .map((m: any) => m.userId.toString())
    .filter((id: string) => id !== senderId);

  if (recipientIds.length === 0) return;

  const notifications = await Notification.insertMany(
    recipientIds.map((userId: string) => ({
      userId,
      type: "chat_message",
      title,
      description,
      href: "/chat",
      read: false,
    }))
  );

  // Push real-time notification to each recipient's personal channel
  for (let i = 0; i < recipientIds.length; i++) {
    try {
      await pusherServer.trigger(`user-${recipientIds[i]}`, "new-notification", notifications[i]);
    } catch (e) {
      // Non-critical — notification is already saved in DB
    }
  }
}
