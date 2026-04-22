import { connectDB } from "@/lib/db/mongodb";
import { Attendance, Leave, User } from "@/lib/db/models";

export async function getHRData() {
  await connectDB();

  // IST today boundaries
  const IST_MS = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_MS);
  const startOfDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST_MS);
  const endOfDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 23, 59, 59, 999) - IST_MS);

  const [attendanceDocs, leaveDocs] = await Promise.all([
    Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate("userId", "name image role")
      .sort({ clockIn: -1 })
      .lean(),
    Leave.find({})
      .populate("userId", "name role image")
      .populate("reviewedBy", "name role image")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return JSON.parse(JSON.stringify({
    attendance: attendanceDocs,
    leaves: leaveDocs
  }));
}
