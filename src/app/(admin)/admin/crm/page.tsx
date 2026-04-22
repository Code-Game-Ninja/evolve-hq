import { Metadata } from "next";
import CRMConsoleClient from "./crm-console-client";

export const metadata: Metadata = {
  title: "CRM Console | Evolve HQ Admin",
  description: "Manage public inquiries and leads.",
};

export default function CRMConsolePage() {
  return <CRMConsoleClient />;
}
