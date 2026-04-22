import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Message } from "@/lib/db/models";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, emoji } = await req.json();
    if (!messageId || !emoji) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();
    
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);

    if (reactionIndex > -1) {
      const users = message.reactions[reactionIndex].users;
      const userIndex = users.indexOf(userId as any);
      
      if (userIndex > -1) {
        // Remove reaction
        message.reactions[reactionIndex].users.splice(userIndex, 1);
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user to existing emoji
        message.reactions[reactionIndex].users.push(userId as any);
      }
    } else {
      // Add new emoji reaction
      message.reactions.push({ emoji, users: [userId as any] });
    }

    await message.save();
    const populatedMessage = await message.populate("senderId", "name email image avatar");

    // Trigger Pusher event
    try {
      await pusherServer.trigger(`chat_${message.channelId}`, "message-updated", populatedMessage);
    } catch (e) {
      console.warn("Pusher trigger failed:", e);
    }

    return NextResponse.json(populatedMessage);
  } catch (error) {
    console.error("Reaction toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
