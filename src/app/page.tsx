import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export default async function Home() {
  const session = await auth();
  
  if (session?.user?.role === "admin" || session?.user?.role === "superadmin") {
    redirect("/admin");
  }
  
  redirect("/dashboard");
}
