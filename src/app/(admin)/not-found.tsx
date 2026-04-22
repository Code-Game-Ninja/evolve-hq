"use client";

// Admin 404 — shown when an admin route is not found
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

export default function AdminNotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div
        className="w-full max-w-[440px] text-center p-8 backdrop-blur-lg border border-[#dddddd]"
        style={{
          backgroundColor: "rgba(241,239,237,0.45)",
          borderRadius: "24px",
        }}
      >
        <p className="text-[64px] font-bold leading-none mb-2" style={{ color: "#f3350c" }}>
          404
        </p>
        <h2 className="text-xl font-semibold mb-2" style={{ color: "#1a1a1a" }}>
          Page not found
        </h2>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "#707070" }}>
          This admin page doesn&apos;t exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 bg-[#f3350c] text-white hover:bg-[#c82c09]"
          >
            <Home className="h-3.5 w-3.5" />
            Admin Home
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 border border-[#dddddd] text-[#707070] hover:border-[#aaaaaa] hover:text-[#000000] hover:bg-[#e8e5e2] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
