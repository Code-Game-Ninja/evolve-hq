// Leads Pipeline Page
import { auth } from "@/lib/auth/auth";
import { getLeadsData } from "@/lib/data/leads";
import { LeadsClient } from "./leads-client";

export const metadata = {
  title: "Leads Pipeline | Evolve CRM",
  description: "Manage your sales pipeline and track leads.",
};

export default async function LeadsPage() {
  const session = await auth();
  if (!session) return null;
  
  const initialData = await getLeadsData();
  
  return <LeadsClient initialData={initialData} />;
}
