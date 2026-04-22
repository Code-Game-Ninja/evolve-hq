// Admin loading skeleton — shown while page content loads
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="h-4 w-32 rounded-lg mt-2" style={{ backgroundColor: "rgba(0,0,0,0.04)" }} />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <div className="h-10 w-28 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 backdrop-blur-lg border border-[#dddddd]"
            style={{
              backgroundColor: "rgba(241,239,237,0.45)",
              borderRadius: "24px",
            }}
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="overflow-hidden backdrop-blur-lg border border-[#dddddd]"
        style={{
          backgroundColor: "rgba(241,239,237,0.45)",
          borderRadius: "24px",
        }}
      >
        {/* Table header */}
        <div className="h-12 border-b border-[#dddddd]" style={{ backgroundColor: "rgba(0,0,0,0.02)" }} />
        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 border-b border-[#dddddd] last:border-b-0" />
        ))}
      </div>
    </div>
  );
}
