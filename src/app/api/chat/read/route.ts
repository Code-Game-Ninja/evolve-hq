import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { ReadReceipt } from "@/lib/db/models";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId } = await req.json();
    if (!channelId) return NextResponse.json({ error: "Missing channelId" }, { status: 400 });

    await connectDB();
    await ReadReceipt.findOneAndUpdate(
      { channelId, userId: session.user.id },
      { lastReadAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Read receipt error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
