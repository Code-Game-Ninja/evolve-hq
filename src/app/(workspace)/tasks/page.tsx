// My Tasks Page
import { Metadata } from "next";
import { TasksClient } from "./tasks-client";

export const metadata: Metadata = {
  title: "My Tasks",
};

export default function TasksPage() {
  return <TasksClient />;
}
