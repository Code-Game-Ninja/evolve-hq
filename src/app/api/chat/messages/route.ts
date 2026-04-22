import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Message, Channel } from "@/lib/db/models";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const threadParentId = searchParams.get("threadParentId");
    
    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    }

    await connectDB();
    
    // Verify membership
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const isMember = channel.members.some((m: any) => m.userId.toString() === session.user.id);
    if (!isMember && channel.type !== "public") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query: any = { channelId };
    if (threadParentId) {
      query.threadParentId = threadParentId;
    } else {
      query.threadParentId = { $exists: false }; // Main channel messages
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("senderId", "name email image avatar")
      .limit(50); // Pagination could be added via cursor

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId, content, threadParentId, attachments } = await req.json();

    if (!channelId || !content) {
      return NextResponse.json({ error: "Channel ID and content required" }, { status: 400 });
    }

    await connectDB();

    // Create message
    const message = await Message.create({
      channelId,
      senderId: session.user.id,
      content,
      threadParentId,
      attachments: attachments || [],
    });

    // Update channel last message time
    await Channel.findByIdAndUpdate(channelId, { lastMessageAt: new Date() });
    
    // If thread reply, update parent reply count
    if (threadParentId) {
       await Message.findByIdAndUpdate(threadParentId, { $inc: { replyCount: 1 } });
    }

    const populatedMessage = await message.populate("senderId", "name email image avatar");

    // Trigger Pusher event
    try {
      await pusherServer.trigger(`chat_${channelId}`, "new-message", populatedMessage);
    } catch (e) {
      console.warn("Pusher trigger failed:", e);
    }

    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, content, isPinned } = await req.json();
    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
    }

    await connectDB();
    
    const update: any = {};
    if (content !== undefined) {
      update.content = content;
      update.isEdited = true;
      update.editedAt = new Date();
    }
    if (isPinned !== undefined) {
      update.isPinned = isPinned;
    }

    // If editing content, must be owner
    const query: any = { _id: messageId };
    if (content !== undefined) {
      query.senderId = session.user.id;
    }

    const message = await Message.findOneAndUpdate(query, update, { new: true })
      .populate("senderId", "name email image avatar");

    if (!message) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    // Trigger Pusher event
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

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });

    await connectDB();
    // Only sender can delete for now
    const message = await Message.findOneAndDelete({ _id: messageId, senderId: session.user.id });
    if (!message) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    // Decrement reply count on parent if it was a thread message
    if (message.threadParentId) {
       await Message.findByIdAndUpdate(message.threadParentId, { $inc: { replyCount: -1 } });
    }

    // Trigger Pusher event
    try {
      await pusherServer.trigger(`chat_${message.channelId}`, "message-deleted", { 
        messageId: message._id,
        threadParentId: message.threadParentId 
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
