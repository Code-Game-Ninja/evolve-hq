// Admin Team API — users enriched with task counts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { User, Task } from "@/lib/db/models";

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

  // Fetch users and task stats in parallel
  const [users, taskStats] = await Promise.all([
    User.find({}).select("-password").sort({ createdAt: -1 }).lean(),
    Task.aggregate([
      {
        $group: {
          _id: "$assigneeId",
          completed: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  // Build a map of userId → { completed, inProgress }
  const statsMap = new Map<string, { completed: number; inProgress: number }>();
  for (const s of taskStats) {
    statsMap.set(String(s._id), { completed: s.completed, inProgress: s.inProgress });
  }

  // Map users to team member shape
  const members = users.map((u) => {
    const id = String(u._id);
    const stats = statsMap.get(id) || { completed: 0, inProgress: 0 };
    const initials = (u.name || "")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return {
      id,
      name: u.name || "",
      role: u.role || "employee",
      position: Array.isArray(u.positions) && u.positions.length > 0 ? u.positions[0] : "",
      status: u.isActive ? "active" : "absent",
      avatar: initials,
      email: u.email || "",
      phone: u.phone || "",
      department: u.department || "",
      joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "",
      location: u.location || "",
      discordId: u.discordId || "",
      image: u.image || null,
      tasksCompleted: stats.completed,
      tasksInProgress: stats.inProgress,
    };
  });

  return NextResponse.json({ members });
}
