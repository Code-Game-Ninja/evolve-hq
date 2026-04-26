// Subdomain helpers for cross-subdomain navigation & detection
// Production: hq.evolve.agency | admin.evolve.agency | crm.evolve.agency
// Development: localhost:3002 (pathname-based fallback)

export type Subdomain = "hq" | "admin" | "crm";

const PRODUCTION_DOMAIN = "evolve.agency";

// Base URLs for each subdomain (set via env vars)
export const subdomainUrls: Record<Subdomain, string> = {
  hq: process.env.NEXT_PUBLIC_HQ_URL || "http://localhost:3002",
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002",
  crm: process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3002",
};

// Get the full base URL for a subdomain
export function getSubdomainUrl(subdomain: Subdomain): string {
  return subdomainUrls[subdomain];
}

// Detect subdomain from Host header
export function getSubdomain(host: string): Subdomain | null {
  // Strip port
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  // Check for *.evolve.agency pattern
  if (parts.length >= 3 && parts.slice(-2).join(".") === PRODUCTION_DOMAIN) {
    const sub = parts[0] as Subdomain;
    if (sub === "hq" || sub === "admin" || sub === "crm") return sub;
  }

  // Alternate admin domain (different TLD)
  if (hostname === "admin.evolve.agency") return "admin";

  return null; // localhost or unknown — use pathname-based routing
}

// Check if we're in production (subdomain mode)
export function isSubdomainMode(host: string): boolean {
  return getSubdomain(host) !== null;
}

// Get cross-subdomain link (returns full URL in prod, relative path in dev/single-domain)
export function getCrossSubdomainHref(
  subdomain: Subdomain,
  path: string
): string {
  const base = subdomainUrls[subdomain];
  // In dev all subdomains resolve to same origin — just use relative path
  if (base.includes("localhost")) {
    return path;
  }

  // Check if all subdomains point to the same URL (single-domain setup like Vercel)
  const hqBase = subdomainUrls.hq;
  const adminBase = subdomainUrls.admin;
  const crmBase = subdomainUrls.crm;

  // If all bases are the same, we're in single-domain mode - use relative paths
  if (hqBase === adminBase && adminBase === crmBase) {
    // Map paths based on target subdomain
    if (subdomain === "admin") {
      // Going to admin - prefix with /admin (except for root)
      return path === "/" ? "/admin" : `/admin${path}`;
    }
    // Going to HQ or CRM - strip /admin prefix if present
    if (path.startsWith("/admin")) {
      return path.replace("/admin", "") || "/";
    }
    return path;
  }

  // Multi-domain setup - return full URL
  return `${base}${path}`;
}

// Cookie domain — not set so each hostname gets its own session.
// Required because admin.evolve.agency is on a different TLD than evolve.agency
// and browsers reject cross-TLD domain cookies.
export function getAuthCookieDomain(): string | undefined {
  return undefined;
}
