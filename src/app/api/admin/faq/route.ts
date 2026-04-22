// GET + POST /api/admin/faq — admin/superadmin only
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { FAQ } from "@/lib/db/models";
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
        { question: { $regex: escaped, $options: "i" } },
        { answer: { $regex: escaped, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      FAQ.find(filter)
        .sort({ order: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FAQ.countDocuments(filter),
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
    console.error("[admin/faq GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await request.json();

    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "Question is required", field: "question" }, { status: 400 });
    }
    if (!answer) {
      return NextResponse.json({ error: "Answer is required", field: "answer" }, { status: 400 });
    }

    const doc = await FAQ.create({ ...body, question, answer });
    const obj = doc.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;

    return NextResponse.json(obj, { status: 201 });
  } catch (err) {
    console.error("[admin/faq POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
