import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { getSubdomain, isSubdomainMode } from "@/lib/subdomain";
import { checkRateLimit } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

// Use Edge runtime (Next.js middleware default)

const publicRoutes = ["/login", "/forgot-password"];
const publicApiRoutes = ["/api/public", "/api/auth"];
const adminRoutes = ["/admin"];
const adminApiRoutes = ["/api/admin"];
const crmRoutes = ["/crm"];
const crmApiRoutes = ["/api/crm"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user?.id;
  const userRole = req.auth?.user?.role;
  const userPositions: string[] = (req.auth?.user?.positions || []).map((p: string) => p.toLowerCase());
  const pathname = nextUrl.pathname;
  const host = req.headers.get("host") || "";

  // Detect subdomain
  const subdomain = getSubdomain(host);
  const hasSubdomain = isSubdomainMode(host);

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isApiRoute = pathname.startsWith("/api");
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminApiRoute = adminApiRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isCrmRoute = crmRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isCrmApiRoute = crmApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRole = ["admin", "superadmin"].includes(userRole || "");
  const hasCrmAccess =
    isAdminRole ||
    userPositions.some((p: string) => p === "ba" || p === "bd");

  // Allow public API routes
  if (isPublicApiRoute) {
    // Rate-limit the credentials login endpoint (S3)
    const isLoginEndpoint =
      pathname === "/api/auth/callback/credentials" && req.method === "POST";
    if (isLoginEndpoint) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const { allowed, retryAfterMs } = checkRateLimit(ip);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          {
            status: 429,
            headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
          }
        );
      }
    }
    return NextResponse.next();
  }

  // Protect internal API routes
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protect admin API routes
  if (isAdminApiRoute && isLoggedIn) {
    if (!isAdminRole) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
  }

  // Protect CRM API routes
  if (isCrmApiRoute && isLoggedIn) {
    if (!hasCrmAccess) {
      return NextResponse.json(
        { error: "Forbidden - CRM access required" },
        { status: 403 }
      );
    }
  }

  // Redirect logged-in users away from login
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect workspace & admin routes
  if (!isPublicRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  // Force password change before accessing any other page (S1)
  const mustChange = req.auth?.user?.mustChangePassword;
  const isChangePasswordRoute = pathname === "/change-password";
  if (isLoggedIn && mustChange && !isChangePasswordRoute) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  // Subdomain-based access control (production only)
  if (hasSubdomain && isLoggedIn) {
    const hqUrl = process.env.NEXT_PUBLIC_HQ_URL || "https://hq.evolve.agency";

    // admin.evolve.agency — only admin/superadmin
    if (subdomain === "admin") {
      if (!isAdminRole) {
        return NextResponse.redirect(new URL("/dashboard", hqUrl));
      }
      // Rewrite clean URLs to /admin/* internally (e.g. /tasks → /admin/tasks)
      if (!isAdminRoute && !isApiRoute && !isPublicRoute && !pathname.startsWith("/change-password")) {
        const rewritePath = pathname === "/" ? "/admin" : `/admin${pathname}`;
        const rewriteUrl = nextUrl.clone();
        rewriteUrl.pathname = rewritePath;
        return NextResponse.rewrite(rewriteUrl);
      }
    }

    // crm.evolve.agency — only sales/BA/BD + admin/superadmin
    if (subdomain === "crm") {
      if (!hasCrmAccess) {
        return NextResponse.redirect(new URL("/dashboard", hqUrl));
      }
      // Redirect non-crm routes to /crm
      if (!isCrmRoute && !isCrmApiRoute && !isApiRoute && !pathname.startsWith("/change-password")) {
        return NextResponse.redirect(new URL("/crm", req.url));
      }
    }

    // hq.evolve.agency — block admin/crm routes (should use their own subdomain)
    if (subdomain === "hq") {
      if (isAdminRoute) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.evolve.agency";
        // Strip /admin prefix for clean admin subdomain URLs
        const cleanPath = pathname.replace(/^\/admin/, "") || "/";
        return NextResponse.redirect(new URL(cleanPath, adminUrl));
      }
      if (isCrmRoute) {
        const crmUrl = process.env.NEXT_PUBLIC_CRM_URL || "https://crm.evolve.agency";
        return NextResponse.redirect(new URL(pathname, crmUrl));
      }
    }
  }

  // Pathname-based access control (development / fallback)
  if (!hasSubdomain && isLoggedIn) {
    // Protect admin routes - check role
    if (isAdminRoute && !isAdminRole) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect CRM routes - check position / role
    if (isCrmRoute && !hasCrmAccess) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes EXCEPT:
    // - Next.js internals (_next/static, _next/image)
    // - Static assets (images, fonts, icons, css, js bundles)
    // - favicon
    // - Public API routes (handled inside the middleware itself)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico)$).*)",
  ],
};
