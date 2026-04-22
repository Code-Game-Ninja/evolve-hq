import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/lib/db/models";
import mongoose from "mongoose";

type RouteContext = { params: Promise<{ id: string }> };

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    await connectDB();

    const existing = await Lead.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check permissions (Admin or Assigned)
    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    const isAssigned = existing.assignedTo?.toString() === session.user.id;
    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Track changes for activity history
    const oldStatus = existing.status;
    const oldNotes = existing.notes;

    // Update fields
    Object.assign(existing, body);

    // Record activity if status changed
    if (body.status && body.status !== oldStatus) {
      existing.activities.push({
        type: "status_change",
        content: `Status updated from ${oldStatus} to ${body.status}`,
        performedBy: session.user.id,
        createdAt: new Date(),
      });
    }

    // Record activity if notes added/updated
    if (body.notes && body.notes !== oldNotes) {
      existing.activities.push({
        type: "note_added",
        content: body.notes.length > 50 ? "Note updated" : `Note: ${body.notes}`,
        performedBy: session.user.id,
        createdAt: new Date(),
      });
    }

    await existing.save();

    return NextResponse.json(existing);
  } catch (err) {
    console.error("PATCH /api/leads/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const existing = await Lead.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await existing.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/leads/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
