import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Meeting } from "@/lib/db/models";
import mongoose from "mongoose";

// Workspace meetings [id] route — organizer or admin for mutations

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

type RouteContext = { params: Promise<{ id: string }> };

function isOrganizer(doc: { organizerId: unknown }, userId: string): boolean {
  const org = doc.organizerId;
  const orgStr =
    org && typeof org === "object" && "_id" in (org as object)
      ? (org as { _id: { toString(): string } })._id.toString()
      : org?.toString?.() ?? "";
  return userId === orgStr;
}

function isAttendee(doc: { attendeeIds: unknown }, userId: string): boolean {
  const ids = doc.attendeeIds;
  if (!Array.isArray(ids)) return false;
  return ids.some((aid: unknown) => {
    const str =
      aid && typeof aid === "object" && "_id" in (aid as object)
        ? (aid as { _id: { toString(): string } })._id.toString()
        : (aid as { toString(): string })?.toString?.() ?? "";
    return str === userId;
  });
}

function mapDoc(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };
  result.id = (result._id as { toString(): string }).toString();
  delete result._id;
  if (result.__v !== undefined) delete result.__v;
  return result;
}

// GET /api/meetings/[id]
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const meeting = await Meeting.findById(id)
      .populate("organizerId", "name image")
      .populate("attendeeIds", "name image role")
      .populate("actionItems.assignedTo", "name image");

    if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    const userId = session.user.id;

    if (!isAdmin && !isOrganizer(meeting, userId) && !isAttendee(meeting, userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(mapDoc(meeting.toObject() as Record<string, unknown>));
  } catch (err) {
    console.error("GET /api/meetings/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/meetings/[id] — full update, organizer or admin only
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const existing = await Meeting.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!isAdmin && !isOrganizer(existing, session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    delete body._id;
    delete body.organizerId; // Prevent overwriting organizer

    // Validate times if provided
    const startTime = body.startTime ? new Date(body.startTime) : existing.startTime;
    const endTime = body.endTime ? new Date(body.endTime) : existing.endTime;
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json({ error: "Invalid date values" }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
    }

    // Validate attendeeIds if provided
    if (body.attendeeIds !== undefined) {
      if (!Array.isArray(body.attendeeIds)) {
        return NextResponse.json({ error: "attendeeIds must be an array" }, { status: 400 });
      }
      for (const aid of body.attendeeIds) {
        if (!mongoose.Types.ObjectId.isValid(aid)) {
          return NextResponse.json(
            { error: `attendeeId "${aid}" is not a valid ObjectId` },
            { status: 400 }
          );
        }
      }
    }

    Object.assign(existing, { ...body, startTime, endTime });
    await existing.save();

    const updated = await Meeting.findById(id)
      .populate("organizerId", "name image")
      .populate("attendeeIds", "name image role");

    return NextResponse.json(mapDoc(updated!.toObject() as Record<string, unknown>));
  } catch (err) {
    console.error("PUT /api/meetings/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/meetings/[id] — partial update (status, actionItems, etc.)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const existing = await Meeting.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!isAdmin && !isOrganizer(existing, session.user.id) && !isAttendee(existing, session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = ["status", "actionItems", "title", "description", "location", "meetingUrl"];
    const update: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        update[key] = body[key];
      }
    }

    // Validate status if provided
    if (update.status) {
      const validStatuses = ["scheduled", "completed", "cancelled"];
      if (!validStatuses.includes(update.status as string)) {
        return NextResponse.json(
          { error: `status must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    Object.assign(existing, update);
    await existing.save();

    const updated = await Meeting.findById(id)
      .populate("organizerId", "name image")
      .populate("attendeeIds", "name image role")
      .populate("actionItems.assignedTo", "name image");

    return NextResponse.json(mapDoc(updated!.toObject() as Record<string, unknown>));
  } catch (err) {
    console.error("PATCH /api/meetings/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/meetings/[id] — organizer or admin only
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const existing = await Meeting.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!isAdmin && !isOrganizer(existing, session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await existing.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/meetings/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
