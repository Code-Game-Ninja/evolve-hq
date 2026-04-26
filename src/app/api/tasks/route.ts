import { NextRequest, NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/utils/audit";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Task, User } from "@/lib/db/models";
import mongoose from "mongoose";
import { pusherServer } from "@/lib/pusher";
import { notifyTaskAssigned } from "@/lib/notification-service";

// Workspace tasks route — any logged-in user

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

// GET /api/tasks
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    // Admin/superadmin with all=true can see all tasks
    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    const showAll = searchParams.get("all") === "true" && isAdmin;
    const filter: Record<string, unknown> = showAll ? {} : { assigneeId: session.user.id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }

    await connectDB();

    const total = await Task.countDocuments(filter);
    const docs = await Task.find(filter)
      .populate("assigneeId", "name image")
      .populate("assignedById", "name image")
      .sort({ status: 1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Map _id → id and flatten assignee fields
    const items = (docs as Array<Record<string, unknown>>).map((doc) => {
      const assigneeDoc = doc.assigneeId as { _id: { toString(): string }; name?: string; image?: string } | null;
      const assignedByDoc = doc.assignedById as { _id: { toString(): string }; name?: string; image?: string } | null;

      const item: Record<string, unknown> = {
        ...doc,
        id: (doc._id as { toString(): string }).toString(),
        assigneeId: assigneeDoc ? assigneeDoc._id.toString() : (doc.assigneeId as { toString(): string } | null)?.toString() ?? null,
        assigneeName: assigneeDoc?.name ?? null,
        assigneeImage: assigneeDoc?.image ?? null,
        assignedById: assignedByDoc ? assignedByDoc._id.toString() : (doc.assignedById as { toString(): string } | null)?.toString() ?? null,
        assignedByName: assignedByDoc?.name ?? null,
        assignedByImage: assignedByDoc?.image ?? null,
      };
      delete item._id;
      if (item.__v !== undefined) delete item.__v;
      return item;
    });

    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, assigneeId, project, priority, status, dueDate, description, tags, order } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!assigneeId) {
      return NextResponse.json({ error: "assigneeId is required" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
      return NextResponse.json({ error: "assigneeId is not a valid ObjectId" }, { status: 400 });
    }

    await connectDB();

    const task = await Task.create({
      title: title.trim(),
      assigneeId,
      assignedById: session.user.id,
      project,
      priority,
      status: status || "todo",
      dueDate,
      description,
      tags,
      order,
    });

    const obj = task.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;
    if (obj.__v !== undefined) delete obj.__v;

    // Trigger pusher event
    pusherServer.trigger("tasks-channel", "task-created", obj).catch(console.error);

    // Send notification to assignee (non-blocking)
    const assignee = await User.findById(assigneeId).select("name").lean();
    notifyTaskAssigned({
      assigneeId,
      assigneeName: assignee?.name || "",
      taskTitle: title.trim(),
      assignedByName: session.user.name || "Someone",
    }).catch(console.error);

    // Record Audit Log for Admin actions
    if (["admin", "superadmin"].includes(session.user.role)) {
      await recordAuditLog({
        userId: session.user.id,
        action: "Task Created",
        details: `Assigned task "${title}" to user ${assigneeId}`,
        type: "info",
        targetType: "Task",
        targetId: (obj.id as string)
      });
    }

    return NextResponse.json(obj, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
