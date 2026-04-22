import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";

export async function getTeamData() {
  await connectDB();
  const users = await User.find({ role: { $ne: "superadmin" } }).sort({ name: 1 });
  return JSON.parse(JSON.stringify(users));
}
