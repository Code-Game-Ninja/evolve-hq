// CRM top navigation bar (matching admin-top-nav pattern)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Settings, Bell, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCrossSubdomainHref } from "@/lib/subdomain";
import { crmNavItems } from "@/lib/crm-nav-config";
import { UserDropdown } from "@/components/layout/user-dropdown";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function CrmTopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 px-3 sm:px-4 md:px-6 pt-2 md:pt-3 pb-2 pointer-events-none">
      <header className="flex items-center h-[52px] md:h-[60px] rounded-full px-4 md:px-6 mx-auto max-w-[1400px] pointer-events-auto">
        {/* Left: Logo with CRM badge */}
        <Link href="/crm" className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-bold tracking-[0.1em] uppercase">
            EVOLVE
          </span>
          <span
            className="text-[10px] font-semibold tracking-wider uppercase text-white px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#f3350c" }}
          >
            CRM
          </span>
        </Link>

        {/* Right: Nav pills + Back link + Setting + Bell + Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto">
          {/* Pill navigation (desktop) */}
          <nav
            className="hidden lg:flex items-center gap-1 rounded-full p-1 backdrop-blur-lg border border-white/10 shadow-2xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
          >
            {crmNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/crm" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-white text-black shadow-xl"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="hidden lg:block h-5 w-px bg-white/10" />

          {/* Back to HQ workspace */}
          <a
            href={getCrossSubdomainHref("hq", "/dashboard")}
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            HQ
          </a>

          {/* Setting button */}
          <button
            className="hidden md:flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-medium text-white/70 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all duration-200 backdrop-blur-lg shadow-xl cursor-pointer"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
            Setting
          </button>

          {/* Notification bell */}
          <NotificationDropdown />

          {/* User avatar dropdown */}
          <UserDropdown size={44} />

          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 cursor-pointer">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 border-white/10" style={{ backgroundColor: "rgba(10,10,10,0.95)" }}>
                <SheetTitle className="sr-only">CRM Navigation</SheetTitle>
                {/* Mobile logo */}
                <div className="flex items-center h-16 px-5 border-b border-white/10">
                  <Link
                    href="/crm"
                    className="flex items-center gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-lg font-bold tracking-[0.1em] uppercase">
                      EVOLVE
                    </span>
                    <span
                      className="text-[10px] font-semibold tracking-wider uppercase text-white px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "#f3350c" }}
                    >
                      CRM
                    </span>
                  </Link>
                </div>

                {/* Back to HQ workspace */}
                <div className="px-3 pt-3 pb-1">
                  <a
                    href={getCrossSubdomainHref("hq", "/dashboard")}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to HQ
                  </a>
                </div>

                {/* Mobile nav items */}
                <nav className="py-2 px-3 space-y-1">
                  {crmNavItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/crm" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-white text-black"
                            : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile: Settings & Notifications */}
                <div className="px-3 pt-2 pb-4 border-t border-white/10 mt-2 space-y-1">
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <Settings className="h-4 w-4 shrink-0" />
                    Settings
                  </button>
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <Bell className="h-4 w-4 shrink-0" />
                    Notifications
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#f3350c]" />
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  );
}
