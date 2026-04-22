import type { Metadata } from "next";
import { ClientsClient } from "./clients-client";

export const metadata: Metadata = {
  title: "Client Directory | CRM | EVOLVE HQ",
  description: "Global directory of clients and partners",
};

export default function ClientsPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ClientsClient />
    </div>
  );
}
