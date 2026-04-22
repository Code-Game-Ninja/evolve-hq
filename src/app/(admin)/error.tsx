// Admin error boundary — catches runtime errors and shows recovery UI
"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div
        className="w-full max-w-[440px] text-center p-8 backdrop-blur-lg border border-[#dddddd]"
        style={{
          backgroundColor: "rgba(241,239,237,0.45)",
          borderRadius: "24px",
        }}
      >
        <div
          className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
          style={{ backgroundColor: "rgba(243,53,12,0.08)" }}
        >
          <AlertTriangle className="h-7 w-7" style={{ color: "#f3350c" }} />
        </div>

        <h2 className="text-xl font-semibold mb-2" style={{ color: "#1a1a1a" }}>
          Something went wrong
        </h2>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "#707070" }}>
          An unexpected error occurred in the admin console. Try again or return to the admin dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer bg-[#f3350c] text-white hover:bg-[#c82c09]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 border border-[#dddddd] text-[#707070] hover:border-[#aaaaaa] hover:text-[#000000] hover:bg-[#e8e5e2]"
          >
            <Home className="h-3.5 w-3.5" />
            Admin Home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-5 text-[11px]" style={{ color: "#b0b0b0" }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
