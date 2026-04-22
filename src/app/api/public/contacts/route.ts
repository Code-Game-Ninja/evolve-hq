// POST /api/public/contacts — no auth, receives contact form from nexisgo
import { connectDB } from "@/lib/db/mongodb";
import { Inquiry, Subscriber } from "@/lib/db/models";
import { checkRouteLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = ["https://evolve.agency", "https://www.evolve.agency"];

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request);

  // Extract IP — always take first value to prevent x-forwarded-for spoofing
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";

  // Rate limit: 5 per minute per IP
  const rl = checkRouteLimit(`contacts:${ip}`, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  // Validate required fields
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Name is required (max 100 chars)", field: "name" }, { status: 400, headers });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required", field: "email" }, { status: 400, headers });
  }
  if (!message || message.length > 5000) {
    return NextResponse.json({ error: "Message is required (max 5000 chars)", field: "message" }, { status: 400, headers });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 20) : undefined;
  const company = typeof body.company === "string" ? body.company.trim() : undefined;
  const subject = typeof body.subject === "string" ? body.subject.trim() : undefined;
  const subscribe = body.subscribe === true;

  try {
    await connectDB();

    // Strip HTML from all string inputs before persisting
    await Inquiry.create({
      name: stripHtml(name),
      email,
      phone: phone ? stripHtml(phone) : undefined,
      company: company ? stripHtml(company) : undefined,
      subject: subject ? stripHtml(subject) : undefined,
      message: stripHtml(message),
      subscribe,
      ipAddress: ip,
    });

    if (subscribe) {
      await Subscriber.findOneAndUpdate(
        { email },
        {
          $set: { name: stripHtml(name), source: "contact_form", status: "active" },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json(
      { success: true, message: "Message received" },
      { status: 201, headers }
    );
  } catch (err) {
    console.error("[public/contacts]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers });
  }
}
