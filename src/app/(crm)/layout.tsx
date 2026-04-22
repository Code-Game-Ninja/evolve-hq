// CRM layout — top navigation bar with subtle background
import { CrmTopNav } from "@/components/layout/crm-top-nav";
import { TopBlur } from "@/components/layout/top-blur";
import { BackgroundOrbs } from "@/components/ui/background-orbs";
import { PageTransition } from "@/components/ui/page-transition";

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen overflow-y-auto bg-background dark transition-colors duration-500">
      <BackgroundOrbs />
      <CrmTopNav />
      <TopBlur />
      <main className="relative z-[1] w-full min-w-0 max-w-[1400px] mx-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-[72px] sm:pt-[76px] md:pt-[80px] pb-24 md:pb-6">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
