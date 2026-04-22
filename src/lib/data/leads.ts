import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/lib/db/models/lead";

export async function getLeadsData() {
  await connectDB();
  // We don't use auth here because it's called from a server component that should have already checked auth
  // But for safety, you'd usually pass the session.
  // For now, following the pattern of the dashboard fetcher.
  
  const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
  
  // Transform _id to string for serialization
  return JSON.parse(JSON.stringify(leads));
}
