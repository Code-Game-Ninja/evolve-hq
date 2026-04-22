// Login page
import type { Metadata } from "next";
import LoginForm from "./login-form";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to EVOLVE HQ",
};

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    if (session.user.role === "superadmin" || session.user.role === "admin") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div
      className="relative flex min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, #f5efe8 0%, #f8f7f3 30%, #f2ebe4 55%, #f8f7f3 75%, #f4ece5 100%)",
      }}
    >
      <FloatingOrbs />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative z-[1]">
        <div className="text-center px-12 max-w-md">
          {/* Logo */}
          <h1 className="text-6xl font-bold tracking-[0.14em] uppercase mb-3" style={{ color: "#1a1a1a" }}>
            EVOLVE
          </h1>
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-12" style={{ backgroundColor: "rgba(0,0,0,0.15)" }} />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "#737373" }}>
              HQ Workspace
            </span>
            <div className="h-px w-12" style={{ backgroundColor: "rgba(0,0,0,0.15)" }} />
          </div>

          <p className="text-sm leading-relaxed mb-10" style={{ color: "#888" }}>
            Employee workspace and admin console for EVOLVE Private Limited team members.
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["Tasks", "Attendance", "Leaves", "CRM"].map((label) => (
              <span
                key={label}
                className="text-[11px] font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full border backdrop-blur-sm"
                style={{
                  backgroundColor: "rgba(241,239,237,0.5)",
                  borderColor: "rgba(0,0,0,0.08)",
                  color: "#777",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 relative z-[1]">
        <div className="w-full max-w-[400px]">
          {/* Glass card */}
          <div
            className="rounded-3xl border backdrop-blur-xl p-8 sm:p-10"
            style={{
              backgroundColor: "rgba(241,239,237,0.55)",
              borderColor: "#dddddd",
              boxShadow: "0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold tracking-[0.12em] uppercase" style={{ color: "#1a1a1a" }}>
                EVOLVE
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mt-1.5" style={{ color: "#737373" }}>
                HQ Workspace
              </p>
            </div>

            <div className="mb-7">
              <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: "#1a1a1a" }}>
                Welcome back
              </h2>
              <p className="text-[13px] mt-1" style={{ color: "#737373" }}>
                Sign in to your account to continue
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
