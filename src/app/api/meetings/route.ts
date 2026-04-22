import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Meeting } from "@/lib/db/models";
import mongoose from "mongoose";

// Workspace meetings route — any logged-in user

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

// GET /api/meetings
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // User must be organizer or attendee
    const filter: Record<string, unknown> = {
      $or: [{ organizerId: userId }, { attendeeIds: userId }],
    };

    if (status) filter.status = status;
    if (from || to) {
      const timeFilter: Record<string, Date> = {};
      if (from) timeFilter.$gte = new Date(from);
      if (to) timeFilter.$lte = new Date(to);
      filter.startTime = timeFilter;
    }

    await connectDB();

    const total = await Meeting.countDocuments(filter);
    const docs = await Meeting.find(filter)
      .populate("organizerId", "name image")
      .populate("attendeeIds", "name image role")
      .populate("actionItems.assignedTo", "name image")
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = (docs as Array<Record<string, unknown>>).map((doc) => {
      const item: Record<string, unknown> = { ...doc };
      item.id = (doc._id as { toString(): string }).toString();
      delete item._id;
      if (item.__v !== undefined) delete item.__v;
      return item;
    });

    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /api/meetings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/meetings
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, startTime, endTime, attendeeIds, location, meetingUrl, description, status, actionItems } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!startTime) {
      return NextResponse.json({ error: "startTime is required" }, { status: 400 });
    }
    if (!endTime) {
      return NextResponse.json({ error: "endTime is required" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "startTime and endTime must be valid dates" }, { status: 400 });
    }
    if (start >= end) {
      return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
    }

    // Validate attendeeIds
    if (attendeeIds !== undefined) {
      if (!Array.isArray(attendeeIds)) {
        return NextResponse.json({ error: "attendeeIds must be an array" }, { status: 400 });
      }
      for (const aid of attendeeIds) {
        if (!mongoose.Types.ObjectId.isValid(aid)) {
          return NextResponse.json(
            { error: `attendeeId "${aid}" is not a valid ObjectId` },
            { status: 400 }
          );
        }
      }
    }

    await connectDB();

    const meeting = await Meeting.create({
      title: title.trim(),
      organizerId: session.user.id,
      attendeeIds: attendeeIds ?? [],
      startTime: start,
      endTime: end,
      location,
      meetingUrl,
      description,
      status: status || "scheduled",
      actionItems: Array.isArray(actionItems) ? actionItems : [],
    });

    const obj = meeting.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;
    if (obj.__v !== undefined) delete obj.__v;

    return NextResponse.json(obj, { status: 201 });
  } catch (err) {
    console.error("POST /api/meetings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
