// PATCH /api/admin/hr/leaves/[id] — approve or reject a leave request
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Leave } from "@/lib/db/models";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["admin", "superadmin"].includes(session.user.role)) return null;
  return session;
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const { status, reviewNote } = body;

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        { error: "Invalid status. Allowed: approved, rejected", field: "status" },
        { status: 400 }
      );
    }

    // Fetch the leave to get userId + dates for overlap check
    const leave = await Leave.findById(id);
    if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Overlap check only when approving
    if (status === "approved") {
      const overlap = await Leave.findOne({
        userId: leave.userId,
        status: "approved",
        _id: { $ne: id },
        $or: [{ fromDate: { $lte: leave.toDate }, toDate: { $gte: leave.fromDate } }],
      });
      if (overlap) {
        return NextResponse.json(
          { error: "Leave dates overlap with an existing approved leave" },
          { status: 409 }
        );
      }
    }

    const doc = await Leave.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        ...(reviewNote !== undefined ? { reviewNote } : {}),
      },
      { new: true, runValidators: true }
    )
      .populate("userId", "name role image")
      .populate("reviewedBy", "name role image");

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const obj = doc.toObject() as Record<string, unknown>;
    obj.id = (obj._id as { toString(): string }).toString();
    delete obj._id;

    return NextResponse.json(obj);
  } catch (err) {
    console.error("[admin/hr/leaves/[id] PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
