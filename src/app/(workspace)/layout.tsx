// Workspace layout — top navigation bar with gradient bg + floating orbs
import { TopNav } from "@/components/layout/top-nav";
import { TopBlur } from "@/components/layout/top-blur";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { PageTransition } from "@/components/ui/page-transition";
import { GlobalSidebar } from "@/components/layout/global-sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative h-screen overflow-y-auto bg-background dark"
    >
      <FloatingOrbs />

      <TopNav />
      <TopBlur />
      <GlobalSidebar />
      <main id="main-content" className="relative z-[1] w-full min-w-0 max-w-[1400px] mx-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-[72px] sm:pt-[76px] md:pt-[80px] pb-24 md:pb-6">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
