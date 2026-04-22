// Admin Users API — list all users, create user, update user, delete user
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateTempPassword } from "@/lib/utils/generateTempPassword";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { Session } from "@/lib/db/models/session";

// GET /api/admin/users — list all users
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (!["admin", "superadmin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const users = await User.find({})
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users });
}

// POST /api/admin/users — create a new user with temp password
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerRole = session.user.role;
  if (!["admin", "superadmin"].includes(callerRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, role, positions, phone, department, position, location, discordId } = body;

  // Validate required fields
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Validate role
  const validRoles = ["superadmin", "admin", "manager", "employee"];
  const userRole = role && validRoles.includes(role) ? role : "employee";

  // Only superadmin can create admin/superadmin users
  if (["admin", "superadmin"].includes(userRole) && callerRole !== "superadmin") {
    return NextResponse.json(
      { error: "Only superadmin can create admin or superadmin users" },
      { status: 403 }
    );
  }

  await connectDB();

  // Check if user already exists
  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  // Generate temp password and hash it
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  // Build positions array
  const userPositions: string[] = Array.isArray(positions)
    ? positions.filter((p: string) => typeof p === "string" && p.trim())
    : position?.trim()
      ? [position.trim()]
      : [];

  // Create user
  const newUser = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    role: userRole,
    positions: userPositions,
    isActive: true,
    mustChangePassword: true,
    ...(phone?.trim() && { phone: phone.trim() }),
    ...(department?.trim() && { department: department.trim() }),
    ...(location?.trim() && { location: location.trim() }),
    ...(discordId?.trim() && { discordId: discordId.trim() }),
  });

  // Return user (without password hash) + the temp password (shown once)
  const userResponse = {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    positions: newUser.positions,
    isActive: newUser.isActive,
    mustChangePassword: newUser.mustChangePassword,
    createdAt: newUser.createdAt,
  };

  return NextResponse.json(
    { user: userResponse, tempPassword },
    { status: 201 }
  );
}

// PATCH /api/admin/users — update a user's position or role
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (!["admin", "superadmin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, positions, userRole, isActive, discordId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await connectDB();

  // Build update object — only include fields that were sent
  const update: Record<string, any> = {};
  if (Array.isArray(positions)) update.positions = positions;
  if (typeof userRole === "string") {
    // Only superadmin can change roles
    if (role !== "superadmin") {
      return NextResponse.json(
        { error: "Only superadmin can change roles" },
        { status: 403 }
      );
    }
    const validRoles = ["superadmin", "admin", "manager", "employee"];
    if (!validRoles.includes(userRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    update.role = userRole;
  }
  if (typeof isActive === "boolean") update.isActive = isActive;
  if (typeof discordId === "string") {
    const trimmed = discordId.trim();
    update.discordId = trimmed || null;
  } else if (discordId === null) {
    update.discordId = null;
  }
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.email === "string" && body.email.trim()) update.email = body.email.trim().toLowerCase();
  if (typeof body.phone === "string") update.phone = body.phone.trim();
  if (typeof body.department === "string") update.department = body.department.trim();
  if (typeof body.location === "string") update.location = body.location.trim();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await User.findByIdAndUpdate(userId, update, { new: true })
    .select("-password")
    .lean();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}

// DELETE /api/admin/users — permanently delete a user
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "superadmin") {
    return NextResponse.json(
      { error: "Only superadmin can delete users" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  // Can't delete yourself
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  await connectDB();

  const target = await User.findById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent deleting the last superadmin
  if (target.role === "superadmin") {
    const superadminCount = await User.countDocuments({ role: "superadmin" });
    if (superadminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last superadmin" },
        { status: 400 }
      );
    }
  }

  // Delete user's sessions and the user record
  await Session.deleteMany({ userId });
  await User.findByIdAndDelete(userId);

  return NextResponse.json({ success: true });
}
