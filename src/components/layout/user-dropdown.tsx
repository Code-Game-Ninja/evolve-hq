// UserDropdown — context-aware cross-subdomain links
"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useProfile } from "@/contexts/profile-context";
import {
  User,
  Settings,
  ShieldCheck,
  Handshake,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { getCrossSubdomainHref } from "@/lib/subdomain";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface UserDropdownProps {
  size?: number;
}

export function UserDropdown({ size = 32 }: UserDropdownProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { name: profileName, image: profileImage } = useProfile();

  if (status === "loading") {
    return <Skeleton className="rounded-full" style={{ height: size, width: size }} />;
  }

  if (!session?.user) return null;

  const user = session.user;
  const displayName = profileName || user.name || "";
  const displayImage = profileImage || user.image || null;
  const isAdmin = ["admin", "superadmin"].includes(
    user.role || ""
  );
  const userPositions: string[] = (user.positions || []).map((p: string) => p.toLowerCase());
  const hasCrmAccess =
    isAdmin || userPositions.some((p) => p === "ba" || p === "bd");
  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  // Detect current context via hostname (subdomain) or pathname fallback
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isOnAdmin = hostname.startsWith("admin.") || pathname.startsWith("/admin");
  const isOnCrm = hostname.startsWith("crm.") || pathname.startsWith("/crm");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar style={{ height: size, width: size }} className="border border-white/10">
            {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
            <AvatarFallback className="text-xs font-medium bg-white/5 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl p-1"
        style={{ backgroundColor: "rgba(11, 17, 32, 0.85)" }}
      >
        <DropdownMenuLabel className="font-normal px-3 py-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{displayName}</p>
            <p className="text-xs text-white/50 leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="rounded-full text-white/70 hover:text-white focus:bg-white/5 focus:text-white">
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-full text-white/70 hover:text-white focus:bg-white/5 focus:text-white">
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Context-aware cross-subdomain links */}
        {(isAdmin || hasCrmAccess) && (
          <>
            <DropdownMenuSeparator className="bg-white/5" />

            {/* If on admin → show HQ Workspace link; otherwise show Admin Console */}
            {isOnAdmin ? (
              <DropdownMenuItem asChild className="rounded-full focus:bg-white/5">
                <a
                  href={getCrossSubdomainHref("hq", "/dashboard")}
                  className="cursor-pointer font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  HQ Workspace
                </a>
              </DropdownMenuItem>
            ) : (
              isAdmin && (
                <DropdownMenuItem asChild className="rounded-full focus:bg-white/5">
                  <a
                    href={getCrossSubdomainHref("admin", "/")}
                    className="cursor-pointer font-medium"
                    style={{ color: "var(--primary)" }}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin Console
                  </a>
                </DropdownMenuItem>
              )
            )}

            {/* CRM link — hide when already on CRM */}
            {hasCrmAccess && !isOnCrm && (
              <DropdownMenuItem asChild className="rounded-full focus:bg-white/5">
                <a
                  href={getCrossSubdomainHref("crm", "/crm")}
                  className="cursor-pointer font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  <Handshake className="mr-2 h-4 w-4" />
                  CRM
                </a>
              </DropdownMenuItem>
            )}
          </>
        )}

        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="cursor-pointer text-red-400 focus:text-red-400 rounded-full focus:bg-white/5"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
