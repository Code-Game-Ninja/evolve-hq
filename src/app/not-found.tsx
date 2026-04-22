"use client";

// Global 404 page — glass theme, matches workspace/admin not-found
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
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
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl mb-5" style={{ backgroundColor: "rgba(243,53,12,0.08)" }}>
          <Search className="h-7 w-7" style={{ color: "#f3350c" }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: "#1a1a1a" }}>
          404 — This page could not be found.
        </h2>
        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "#707070" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 bg-[#f3350c] text-white hover:bg-[#c82c09]"
          >
            Home
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
