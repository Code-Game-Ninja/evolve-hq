// NextAuth API route — with URL fix for Docker standalone mode.
// Next.js standalone sets req.nextUrl.origin to http://0.0.0.0:3000 (the bind
// address). Auth.js uses that origin for post-login redirects and callback-url
// cookies, which the browser can't reach. We intercept every response and
// rewrite any 0.0.0.0 references using the real host from nginx headers.
import { handlers } from "@/lib/auth/auth";
import { NextRequest } from "next/server";

const INTERNAL_RE = /https?:\/\/0\.0\.0\.0(:\d+)?/g;

function realOrigin(req: NextRequest): string | null {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : null;
}

function fixResponse(res: Response, origin: string): Response {
  const h = new Headers(res.headers);
  let changed = false;

  // Fix Location header (redirects)
  const location = h.get("location");
  if (location && INTERNAL_RE.test(location)) {
    h.set("location", location.replace(INTERNAL_RE, origin));
    changed = true;
  }

  // Fix Set-Cookie headers (callback-url cookies contain encoded 0.0.0.0)
  const cookies = res.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    const encodedInternal = encodeURIComponent("https://0.0.0.0:3000");
    const encodedOrigin = encodeURIComponent(origin);
    const needsFix = cookies.some((c) => c.includes(encodedInternal));
    if (needsFix) {
      h.delete("set-cookie");
      for (const cookie of cookies) {
        h.append("set-cookie", cookie.replaceAll(encodedInternal, encodedOrigin));
      }
      changed = true;
    }
  }

  if (!changed) return res;
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: h,
  });
}

export async function GET(req: NextRequest) {
  const res = await handlers.GET(req);
  const origin = realOrigin(req);
  return origin ? fixResponse(res, origin) : res;
}

export async function POST(req: NextRequest) {
  const res = await handlers.POST(req);
  const origin = realOrigin(req);
  return origin ? fixResponse(res, origin) : res;
}
