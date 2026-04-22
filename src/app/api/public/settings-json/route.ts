// GET /api/public/settings-json — no auth, serves nexisgo
import { connectDB } from "@/lib/db/mongodb";
import { SiteSettings } from "@/lib/db/models";
import { NextRequest, NextResponse } from "next/server";

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = [
    "https://evolve.agency",
    "https://www.evolve.agency",
    ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
  ];
  const corsOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    Vary: "Origin",
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const settings = await SiteSettings.findOne()
      .select("siteName siteDescription contactEmail contactPhone address socialLinks")
      .lean();

    return NextResponse.json(settings ?? {}, { headers: corsHeaders(request) });
  } catch (err) {
    console.error("[public/settings-json]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
