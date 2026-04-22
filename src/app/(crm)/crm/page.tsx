// CRM Dashboard Page
import { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getCrmStats } from "@/lib/data/crm";
import { CrmDashboardClient } from "./crm-dashboard-client";

export const metadata: Metadata = {
  title: "CRM Dashboard | Evolve HQ",
  description: "Real-time insights into your sales pipeline and agency growth",
};

export default async function CrmDashboardPage() {
  const session = await auth();
  if (!session) return null;

  const stats = await getCrmStats();

  return <CrmDashboardClient initialData={stats} />;
}
