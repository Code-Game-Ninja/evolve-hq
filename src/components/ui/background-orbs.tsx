// BackgroundOrbs — pure CSS animations, no Framer Motion on viewport-sized elements
// Framer Motion on 40-70vw blur elements was killing GPU compositing on every frame
export function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] opacity-40 select-none">
      <div
        className="absolute rounded-full"
        style={{
          top: "-10%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          background: "radial-gradient(circle, rgba(243,53,12,0.3) 0%, rgba(232,127,36,0.15) 50%, transparent 70%)",
          filter: "blur(120px)",
          animation: "float-orb-1 20s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: "-20%",
          right: "-10%",
          width: "70vw",
          height: "70vw",
          background: "radial-gradient(circle, rgba(11,17,32,0.4) 0%, rgba(30,41,59,0.2) 50%, transparent 70%)",
          filter: "blur(140px)",
          animation: "float-orb-2 25s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "20%",
          right: "10%",
          width: "40vw",
          height: "40vw",
          background: "radial-gradient(circle, rgba(255,200,30,0.2) 0%, rgba(243,53,12,0.1) 50%, transparent 70%)",
          filter: "blur(100px)",
          animation: "float-orb-3 18s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: "10%",
          left: "5%",
          width: "35vw",
          height: "35vw",
          background: "radial-gradient(circle, rgba(115,165,202,0.2) 0%, transparent 70%)",
          filter: "blur(110px)",
          animation: "float-orb-4 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </div>
  );
}
