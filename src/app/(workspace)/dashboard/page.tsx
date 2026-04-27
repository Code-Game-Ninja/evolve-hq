// Employee Dashboard Page
import { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";
import { auth } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  // All users including admins and superadmins can access employee dashboard
  // Admin dashboard is available via separate navigation

  return <DashboardClient />;
}
