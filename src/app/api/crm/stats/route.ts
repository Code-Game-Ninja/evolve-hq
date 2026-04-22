import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Lead, Inquiry } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const [totalLeads, openDeals, wonDeals, newInquiries] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ status: { $in: ["qualified", "proposal", "negotiation"] } }),
      Lead.countDocuments({ status: "won" }),
      Inquiry.countDocuments({ status: "new" }),
    ]);

    const pipelineValue = await Lead.aggregate([
      { $match: { status: { $nin: ["won", "lost"] } } },
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);

    return NextResponse.json({
      totalLeads,
      openDeals,
      wonDeals,
      newInquiries,
      pipelineValue: pipelineValue[0]?.total || 0,
    });
  } catch (err) {
    console.error("GET /api/crm/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
