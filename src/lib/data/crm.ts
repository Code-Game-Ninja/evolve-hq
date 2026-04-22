import { connectDB } from "@/lib/db/mongodb";
import { Lead, Inquiry } from "@/lib/db/models";

export async function getCrmStats() {
  await connectDB();
  
  const [totalLeads, wonDeals, openDeals, newInquiries, pipelineValue] = await Promise.all([
    Lead.countDocuments({}),
    Lead.countDocuments({ status: "won" }),
    Lead.countDocuments({ status: { $nin: ["won", "lost"] } }),
    Inquiry.countDocuments({ status: "new" }),
    Lead.aggregate([
      { $match: { status: { $nin: ["won", "lost"] } } },
      { $group: { _id: null, total: { $sum: "$value" } } }
    ])
  ]);

  return {
    totalLeads,
    wonDeals,
    openDeals,
    newInquiries,
    pipelineValue: pipelineValue[0]?.total || 0,
  };
}
