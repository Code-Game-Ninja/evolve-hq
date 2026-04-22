// Floating gradient orbs background — shared by workspace layout and login page
export function FloatingOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Large orange orb — top left */}
      <div
        className="absolute rounded-full"
        style={{
          width: "600px",
          height: "600px",
          top: "-120px",
          left: "-100px",
          background: "radial-gradient(circle, rgba(232,127,36,0.12) 0%, rgba(232,127,36,0.04) 45%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float-orb-1 20s ease-in-out infinite",
        }}
      />
      {/* Medium gold orb — top right */}
      <div
        className="absolute rounded-full"
        style={{
          width: "450px",
          height: "450px",
          top: "60px",
          right: "-80px",
          background: "radial-gradient(circle, rgba(255,200,30,0.10) 0%, rgba(255,200,30,0.03) 50%, transparent 70%)",
          filter: "blur(50px)",
          animation: "float-orb-2 25s ease-in-out infinite",
        }}
      />
      {/* Small orange orb — center */}
      <div
        className="absolute rounded-full"
        style={{
          width: "350px",
          height: "350px",
          top: "40%",
          left: "30%",
          background: "radial-gradient(circle, rgba(232,127,36,0.08) 0%, rgba(232,127,36,0.02) 50%, transparent 70%)",
          filter: "blur(35px)",
          animation: "float-orb-3 18s ease-in-out infinite",
        }}
      />
      {/* Bottom left gold glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: "500px",
          height: "500px",
          bottom: "-150px",
          left: "10%",
          background: "radial-gradient(circle, rgba(255,200,30,0.09) 0%, rgba(255,200,30,0.03) 50%, transparent 70%)",
          filter: "blur(45px)",
          animation: "float-orb-4 22s ease-in-out infinite",
        }}
      />
      {/* Bottom right subtle orange orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: "300px",
          height: "300px",
          bottom: "15%",
          right: "5%",
          background: "radial-gradient(circle, rgba(232,127,36,0.07) 0%, rgba(232,127,36,0.02) 50%, transparent 70%)",
          filter: "blur(30px)",
          animation: "float-orb-5 16s ease-in-out infinite",
        }}
      />
    </div>
  );
}
