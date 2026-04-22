import type { Metadata } from "next";
import { InquiriesClient } from "./inquiries-client";

export const metadata: Metadata = {
  title: "Inquiries | Evolve CRM",
};

export default function CrmInquiriesPage() {
  return <InquiriesClient />;
}
