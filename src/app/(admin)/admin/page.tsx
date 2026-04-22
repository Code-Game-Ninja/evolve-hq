// Admin Dashboard Page
import { Metadata } from "next";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin Console",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
