// Employee Dashboard Page
import { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  
  if (session?.user?.role === "admin" || session?.user?.role === "superadmin") {
    redirect("/admin");
  }

  return <DashboardClient />;
}
