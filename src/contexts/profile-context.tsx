// Lightweight profile context — fetches name/image from /api/me for cross-component sync
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface ProfileContextValue {
  name: string;
  image: string;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  name: "",
  image: "",
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      setName(data.name || "");
      setImage(data.image || "");
    } catch {
      // silent — fallback to session data
    }
  }, []);

  // Seed from session, then fetch fresh from API
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || "");
      refreshProfile();
    }
  }, [status, session?.user?.name, session?.user?.image, refreshProfile]);

  return (
    <ProfileContext.Provider value={{ name, image, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
