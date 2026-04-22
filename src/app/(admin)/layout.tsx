// Admin console layout — top navigation bar + bottom nav on mobile
import { AdminTopNav } from "@/components/layout/admin-top-nav";
import { AdminBottomNav } from "@/components/layout/admin-bottom-nav";
import { TopBlur } from "@/components/layout/top-blur";
import { BackgroundOrbs } from "@/components/ui/background-orbs";
import { PageTransition } from "@/components/ui/page-transition";

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <div className="relative h-screen overflow-y-auto bg-background transition-colors duration-500">
      <BackgroundOrbs />
      <AdminTopNav />
      <TopBlur />
      <main id="main-content" className="relative w-full min-w-0 max-w-[1400px] mx-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-[72px] sm:pt-[76px] md:pt-[80px] pb-24 md:pb-6">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <AdminBottomNav />
    </div>
  );
}
