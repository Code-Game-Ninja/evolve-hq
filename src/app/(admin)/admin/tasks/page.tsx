// Admin All Tasks page
import { Metadata } from "next";
import { AdminTasksClient } from "./admin-tasks-client";

export const metadata: Metadata = {
  title: "All Tasks",
};

export default function AdminTasksPage() {
  return <AdminTasksClient />;
}
