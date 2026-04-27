// Deals Page — Shows closed/won deals and deal history
import { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { DealsClient } from "./deals-client";
import { getLeadsData } from "@/lib/data/leads";
import { Lead } from "../lead-data";

export const metadata: Metadata = {
  title: "Deals | Evolve CRM",
  description: "Closed deals and won opportunities",
};

export default async function DealsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const leads: Lead[] = await getLeadsData();
  const wonDeals = leads.filter((l: Lead) => l.status === "won");
  const lostDeals = leads.filter((l: Lead) => l.status === "lost");

  return <DealsClient wonDeals={wonDeals} lostDeals={lostDeals} />;
}
