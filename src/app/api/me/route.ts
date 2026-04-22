// GET & PATCH /api/me — current user profile
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models";

// Fields the user can update via PATCH
const EDITABLE_FIELDS = [
  "name",
  "phone",
  "department",
  "bio",
  "location",
  "skills",
  "image",
] as const;

// GET /api/me — return full profile (excluding password)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("-password -__v")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Normalize _id to id
    const { _id, ...rest } = user as Record<string, unknown>;
    return NextResponse.json({ ...rest, id: (_id as { toString(): string }).toString() });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/me — update own profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Only allow editable fields
    const updates: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Validate skills is an array of strings if provided
    if (updates.skills !== undefined) {
      if (
        !Array.isArray(updates.skills) ||
        !(updates.skills as unknown[]).every((s) => typeof s === "string")
      ) {
        return NextResponse.json(
          { error: "skills must be an array of strings" },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { returnDocument: "after" }
    )
      .select("-password -__v")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { _id, ...rest } = updated as Record<string, unknown>;
    return NextResponse.json({ ...rest, id: (_id as { toString(): string }).toString() });
  } catch (err) {
    console.error("PATCH /api/me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
