// Admin Dashboard Page
import { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getAdminDashboardData } from "@/lib/data/admin";
import { AdminDashboardClient } from "./admin-dashboard-client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard | Evolve HQ",
  description: "Global operations and agency management console.",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    redirect("/login");
  }

  const initialData = await getAdminDashboardData();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <AdminDashboardClient initialData={initialData} />
    </div>
  );
}
