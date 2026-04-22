import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/lib/db/models";
import { startOfMonth, subMonths } from "date-fns";
import { CRM_CONFIG } from "@/lib/crm-config";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // 1. Pipeline Distribution (Status)
    const distribution = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$value" } } }
    ]);

    // 2. Priority Distribution
    const priority = await Lead.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    // 3. Monthly Trend (Last 6 months)
    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    
    const trend = await Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          leads: { $sum: 1 },
          value: { $sum: "$value" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 4. Source Breakdown
    const sources = await Lead.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 5. Conversion Funnel (Optimized to single aggregation)
    const funnelCounts = await Lead.aggregate([
      { $match: { status: { $in: CRM_CONFIG.funnelStages } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const funnelMap = funnelCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const funnel = CRM_CONFIG.funnelStages.map(stage => ({
      stage,
      count: funnelMap[stage] || 0
    }));

    // 6. Revenue Forecast (Weighted by probability from config)
    const forecastData = await Lead.aggregate([
      { $match: { status: { $nin: ["won", "lost"] } } },
      { $group: { _id: "$status", totalValue: { $sum: "$value" } } }
    ]);

    const projectedRevenue = forecastData.reduce((acc, curr) => {
      return acc + (curr.totalValue * (CRM_CONFIG.probabilities[curr._id] || 0));
    }, 0);

    // 7. Lead Velocity (Avg days in pipeline for 'won' deals)
    const wonLeads = await Lead.find({ status: CRM_CONFIG.velocityCalculation.targetStatus })
      .select("createdAt activities");
    
    let totalDays = 0;
    let wonCount = 0;

    wonLeads.forEach(lead => {
      const wonActivity = lead.activities.find((a: any) => 
        a.type === CRM_CONFIG.velocityCalculation.activityType && 
        a.content.includes(CRM_CONFIG.velocityCalculation.targetStatus)
      );
      if (wonActivity) {
        const diffTime = Math.abs(wonActivity.createdAt.getTime() - lead.createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        wonCount++;
      }
    });

    const avgVelocity = wonCount > 0 ? Math.round(totalDays / wonCount) : 0;

    return NextResponse.json({
      distribution,
      priority,
      trend,
      sources,
      funnel,
      projectedRevenue,
      avgVelocity
    });
  } catch (err) {
    console.error("GET /api/crm/analytics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
