// GET + POST /api/admin/testimonials — admin/superadmin only
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

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { author: { $regex: escaped, $options: "i" } },
        { quote: { $regex: escaped, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      Testimonial.find(filter)
        .sort({ order: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Testimonial.countDocuments(filter),
    ]);

    const items = docs.map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = doc as any;
      d.id = d._id.toString();
      delete d._id;
      return d;
    });

    return NextResponse.json({ items, total, page, limit });
  } catch (err) {
    console.error("[admin/testimonials GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await request.json();

    const quote = typeof body.quote === "string" ? body.quote.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim() : "";

    if (!quote) {
      return NextResponse.json({ error: "Quote is required", field: "quote" }, { status: 400 });
    }
    if (!author) {
      return NextResponse.json({ error: "Author is required", field: "author" }, { status: 400 });
    }

    const doc = await Testimonial.create({ ...body, quote, author });
    const obj = doc.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;

    return NextResponse.json(obj, { status: 201 });
  } catch (err) {
    console.error("[admin/testimonials POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
