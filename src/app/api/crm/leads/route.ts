import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/lib/db/models";
import { leadCreateSchema } from "@/lib/validation/crm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check CRM access
    const isBA = session.user.positions?.includes("ba");
    const isBD = session.user.positions?.includes("bd");
    const isAdmin = ["admin", "superadmin"].includes(session.user.role);

    if (!isBA && !isBD && !isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await connectDB();

    // Query leads
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Optional: Filter by assignedTo if not admin
    if (!isAdmin && !isBD) {
      // BAs might only see their own leads, or all leads?
      // For now, let's allow all CRM users to see all leads for the pipeline.
    }

    const leads = await Lead.find(query)
      .sort({ updatedAt: -1 })
      .populate("assignedTo", "name email")
      .populate("activities.performedBy", "name email");

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error("CRM Leads GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const validatedData = leadCreateSchema.parse(body);

    const lead = await Lead.create({
      ...validatedData,
      activities: [
        {
          type: "system",
          content: "Lead created",
          performedBy: session.user.id,
        },
      ],
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("CRM Leads POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
