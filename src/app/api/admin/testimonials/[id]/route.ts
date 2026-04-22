// GET + PUT + DELETE /api/admin/testimonials/[id] — admin/superadmin only
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Testimonial } from "@/lib/db/models";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["admin", "superadmin"].includes(session.user.role)) return null;
  return session;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;

    const doc = await Testimonial.findById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const obj = doc.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;

    return NextResponse.json(obj);
  } catch (err) {
    console.error("[admin/testimonials/[id] GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();

    const quote = typeof body.quote === "string" ? body.quote.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim() : "";

    if (!quote) {
      return NextResponse.json({ error: "Quote is required", field: "quote" }, { status: 400 });
    }
    if (!author) {
      return NextResponse.json({ error: "Author is required", field: "author" }, { status: 400 });
    }

    const doc = await Testimonial.findByIdAndUpdate(
      id,
      { ...body, quote, author },
      { new: true, runValidators: true }
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const obj = doc.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;

    return NextResponse.json(obj);
  } catch (err) {
    console.error("[admin/testimonials/[id] PUT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;

    const doc = await Testimonial.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/testimonials/[id] DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
