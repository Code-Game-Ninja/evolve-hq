// POST /api/public/subscribers — no auth, newsletter sign-up from nexisgo
import { connectDB } from "@/lib/db/mongodb";
import { Subscriber } from "@/lib/db/models";
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

  // Rate limit: 3 per minute per IP
  const rl = checkRouteLimit(`subscribers:${ip}`, 3, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required", field: "email" }, { status: 400, headers });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const source =
    typeof body.source === "string" &&
    ["footer", "contact_form", "hero", "cta", "popup"].includes(body.source)
      ? (body.source as "footer" | "contact_form" | "hero" | "cta" | "popup")
      : "footer";

  try {
    await connectDB();

    const existing = await Subscriber.findOne({ email });

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { success: true, message: "Already subscribed" },
          { status: 200, headers }
        );
      }
      // Re-subscribe
      existing.status = "active";
      existing.unsubscribedAt = undefined;
      await existing.save();
      return NextResponse.json(
        { success: true, message: "Subscribed successfully" },
        { status: 200, headers }
      );
    }

    await Subscriber.create({ email, name, source });
    return NextResponse.json(
      { success: true, message: "Subscribed successfully" },
      { status: 201, headers }
    );
  } catch (err) {
    console.error("[public/subscribers]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers });
  }
}
