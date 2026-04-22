import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ProfileProvider } from "@/contexts/profile-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EVOLVE HQ",
    template: "%s | EVOLVE HQ",
  },
  description: "EVOLVE Employee Workspace, Admin Console & CRM — hq.evolve.agency | admin.evolve.agency | crm.evolve.agency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Skip navigation — keyboard accessibility (A1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:rounded-full focus:bg-[#f3350c] focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider>
          <ProfileProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
