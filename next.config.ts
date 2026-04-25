import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output copies only required files — cuts runtime image from ~500MB to ~120MB
  output: "standalone",
  // reactCompiler disabled — it was breaking useSession() re-renders, causing
  // all client components to fire API calls before the session cookie was read,
  // resulting in 401s on every protected route on first load.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.evolve.agency" },
    ],
  },
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
