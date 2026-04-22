// GET, PATCH, DELETE /api/notifications
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Notification } from "@/lib/db/models";

// GET /api/notifications — fetch current user's notifications (latest 50)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark as read
// Body: { id: string } to mark one, or { all: true } to mark all read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    if (body.all === true) {
      await Notification.updateMany(
        { userId: session.user.id, read: false },
        { $set: { read: true } }
      );
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await Notification.updateOne(
        { _id: body.id, userId: session.user.id },
        { $set: { read: true } }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Provide 'id' or 'all: true'" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/notifications — dismiss a notification
// Body: { id: string }
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Notification id required" }, { status: 400 });
    }

    await Notification.deleteOne({ _id: body.id, userId: session.user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
