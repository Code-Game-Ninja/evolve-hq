import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/lib/db/models";
import { leadUpdateSchema } from "@/lib/validation/crm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const lead = await Lead.findById(id)
      .populate("assignedTo", "name email")
      .populate("activities.performedBy", "name email");

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("CRM Lead GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const validatedData = leadUpdateSchema.parse(body);
    const { id } = await params;

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // If status changed, add activity
    if (validatedData.status && validatedData.status !== lead.status) {
      lead.activities.push({
        type: "status_change",
        content: `Status changed from ${lead.status} to ${validatedData.status}`,
        performedBy: session.user.id,
      });
    }

    // Update fields
    Object.assign(lead, validatedData);
    await lead.save();

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("CRM Lead PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: "Only admins can delete leads" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    await Lead.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CRM Lead DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
