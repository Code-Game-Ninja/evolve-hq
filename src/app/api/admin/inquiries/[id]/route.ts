// GET + PATCH + DELETE /api/admin/inquiries/[id] — admin/superadmin only
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Inquiry } from "@/lib/db/models";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["admin", "superadmin"].includes(session.user.role)) return null;
  return session;
}

const ALLOWED_STATUSES = ["read", "replied", "archived"] as const;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;

    const doc = await Inquiry.findById(id).select("-ipAddress");
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const obj = doc.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;

    return NextResponse.json(obj);
  } catch (err) {
    console.error("[admin/inquiries/[id] GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};

    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status. Allowed: read, replied, archived", field: "status" },
          { status: 400 }
        );
      }
      update.status = body.status;
    }

    if (body.notes !== undefined) {
      update.notes = typeof body.notes === "string" ? body.notes.trim() : "";
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const doc = await Inquiry.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select("-ipAddress");
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const obj = doc.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;

    return NextResponse.json(obj);
  } catch (err) {
    console.error("[admin/inquiries/[id] PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;

    const doc = await Inquiry.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/inquiries/[id] DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
