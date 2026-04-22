import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/lib/db/models";
import mongoose from "mongoose";

// CRM Leads API
// Access control: Only admin, superadmin, or assigned user

async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    await connectDB();

    const isAdmin = ["admin", "superadmin"].includes(session.user.role);
    const filter: Record<string, unknown> = {};
    
    // If not admin, only show leads assigned to them (or maybe all if team is small)
    // For agency CRM, usually sales team sees their own, admins see all.
    if (!isAdmin) {
      filter.assignedTo = session.user.id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const items = await Lead.find(filter)
      .populate("assignedTo", "name image")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(items.map((doc: any) => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
      __v: undefined,
    })));
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, email, phone, company, status, priority, value, notes, tags } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await connectDB();

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      status: status || "new",
      priority: priority || "medium",
      value,
      notes,
      tags,
      assignedTo: session.user.id, // Default to creator
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
