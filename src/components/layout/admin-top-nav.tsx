// Admin top navigation bar (Crextio-style — floating, logo left, rest right)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, ArrowLeft, ShieldCheck, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCrossSubdomainHref } from "@/lib/subdomain";
import { adminNavItems } from "@/lib/admin-nav-config";
import { UserDropdown } from "@/components/layout/user-dropdown";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { useSession } from "next-auth/react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AdminTopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "superadmin";
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 pt-1 md:pt-2 pb-2 pointer-events-none">
      <header className="flex items-center h-[52px] md:h-[60px] rounded-full px-4 sm:px-5 md:px-6 mx-auto max-w-[1400px] pointer-events-auto">
        {/* Left: Logo */}
        <Link href="/admin" className="flex items-center gap-2 shrink-0 group">
          <span className="text-lg font-bold tracking-[0.1em] uppercase transition-colors group-hover:text-[#f3350c]">
            EVOLVE
          </span>
          <div
            className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-white px-2 py-0.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: isSuperAdmin ? "#0a0a0a" : "#f3350c",
              border: isSuperAdmin ? "1px solid rgba(255,255,255,0.15)" : "none",
            }}
          >
            {isSuperAdmin && <ShieldCheck size={10} className="text-[#f3350c]" />}
            {isSuperAdmin ? "Superadmin" : "Admin"}
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto">
          {/* Desktop nav pills */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full p-1 backdrop-blur-lg border border-white/10 shadow-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={cn("flex items-center px-3 py-2 rounded-full text-[12px] font-medium transition-all duration-200 whitespace-nowrap",
                    isActive ? "bg-white text-black shadow-xl scale-[1.02]" : "text-white/60 hover:text-white hover:bg-white/5"
                  )}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block h-5 w-px bg-white/10 mx-1" />

          <a href={getCrossSubdomainHref("hq", "/dashboard")}
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />HQ
          </a>

          <Link href="/admin/settings"
            className="hidden md:flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-medium text-white/70 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all duration-200 backdrop-blur-lg"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <Settings className="h-4 w-4" />Settings
          </Link>

          <NotificationDropdown />
          <UserDropdown size={44} />

          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <button onClick={() => setOpen(true)}
                className="flex items-center justify-center h-10 w-10 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <Menu className="h-5 w-5" />
              </button>
              <SheetContent side="left" className="w-64 p-0 border-white/10" style={{ backgroundColor: "rgba(10,10,10,0.97)" }}>
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <div className="flex items-center h-16 px-5 border-b border-white/10">
                  <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                    <span className="text-lg font-bold tracking-[0.1em] uppercase">EVOLVE</span>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-white px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: isSuperAdmin ? "#0a0a0a" : "#f3350c", border: isSuperAdmin ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                      {isSuperAdmin ? "Superadmin" : "Admin"}
                    </span>
                  </Link>
                </div>
                <nav className="py-3 px-3 space-y-1">
                  {adminNavItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                        className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          isActive ? "bg-white text-black" : "text-white/50 hover:text-white hover:bg-white/5"
                        )}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="px-3 pt-2 border-t border-white/10 space-y-1">
                  <a href={getCrossSubdomainHref("hq", "/dashboard")} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                    <ArrowLeft className="h-4 w-4" />Back to HQ
                  </a>
                  <Link href="/admin/settings" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                    <Settings className="h-4 w-4" />Settings
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  );
}
