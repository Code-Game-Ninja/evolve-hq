import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Task } from "@/lib/db/models";
import mongoose from "mongoose";
import { pusherServer } from "@/lib/pusher";

// Workspace tasks [id] route — ownership or admin required

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

type RouteContext = { params: Promise<{ id: string }> };

// Check ownership: assignee, assignedBy, or admin
function canAccess(
  doc: { assigneeId: unknown; assignedById: unknown },
  userId: string,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  const assigneeId = doc.assigneeId;
  const assignedById = doc.assignedById;
  const assigneeStr =
    assigneeId && typeof assigneeId === "object" && "_id" in (assigneeId as object)
      ? (assigneeId as { _id: { toString(): string } })._id.toString()
      : assigneeId?.toString?.() ?? "";
  const assignedByStr =
    assignedById && typeof assignedById === "object" && "_id" in (assignedById as object)
      ? (assignedById as { _id: { toString(): string } })._id.toString()
      : assignedById?.toString?.() ?? "";
  return userId === assigneeStr || userId === assignedByStr;
}

function canDelete(
  doc: { assignedById: unknown },
  userId: string,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  const assignedById = doc.assignedById;
  const assignedByStr =
    assignedById && typeof assignedById === "object" && "_id" in (assignedById as object)
      ? (assignedById as { _id: { toString(): string } })._id.toString()
      : assignedById?.toString?.() ?? "";
  return userId === assignedByStr;
}

function mapDoc(task: Record<string, unknown>) {
  const assigneeDoc = task.assigneeId as { _id: { toString(): string }; name?: string; image?: string } | null;
  const assignedByDoc = task.assignedById as { _id: { toString(): string }; name?: string; image?: string } | null;

  const obj: Record<string, unknown> = {
    ...task,
    id: (task._id as { toString(): string }).toString(),
    assigneeId: assigneeDoc ? assigneeDoc._id.toString() : (task.assigneeId as { toString(): string } | null)?.toString() ?? null,
    assigneeName: assigneeDoc?.name ?? null,
    assigneeImage: assigneeDoc?.image ?? null,
    assignedById: assignedByDoc ? assignedByDoc._id.toString() : (task.assignedById as { toString(): string } | null)?.toString() ?? null,
    assignedByName: assignedByDoc?.name ?? null,
    assignedByImage: assignedByDoc?.image ?? null,
  };
  delete obj._id;
  if (obj.__v !== undefined) delete obj.__v;
  return obj;
}

// GET /api/tasks/[id]
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const task = await Task.findById(id)
      .populate("assigneeId", "name image")
      .populate("assignedById", "name image");

    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!canAccess(task, session.user.id, isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(mapDoc(task.toObject() as Record<string, unknown>));
  } catch (err) {
    console.error("GET /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tasks/[id] — full update
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const existing = await Task.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!canAccess(existing, session.user.id, isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    // Prevent overwriting assignedById
    delete body._id;
    delete body.assignedById;

    Object.assign(existing, body);
    await existing.save();

    const updated = await Task.findById(id)
      .populate("assigneeId", "name image")
      .populate("assignedById", "name image");

    const mapped = mapDoc(updated!.toObject() as Record<string, unknown>);
    
    // Trigger pusher event
    pusherServer.trigger("tasks-channel", "task-updated", mapped).catch(console.error);

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("PUT /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/tasks/[id] — update status only
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body as { status?: string };
    const validStatuses = ["todo", "in-progress", "done"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Task.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!canAccess(existing, session.user.id, isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    existing.status = status as "todo" | "in-progress" | "done";
    await existing.save();

    const updated = await Task.findById(id)
      .populate("assigneeId", "name image")
      .populate("assignedById", "name image");

    const mapped = mapDoc(updated!.toObject() as Record<string, unknown>);

    // Trigger pusher event
    pusherServer.trigger("tasks-channel", "task-updated", mapped).catch(console.error);

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — only creator (assignedById) or admin
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    const existing = await Task.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!canDelete(existing, session.user.id, isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await existing.deleteOne();
    
    // Trigger pusher event
    pusherServer.trigger("tasks-channel", "task-deleted", { id }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
