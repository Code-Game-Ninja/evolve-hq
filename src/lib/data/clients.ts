import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/lib/db/models";

export async function getClientsData() {
  await connectDB();
  const clients = await Lead.find({}).sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(clients));
}
