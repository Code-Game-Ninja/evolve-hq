"use client";

// useAuthedFetch — returns a fetch wrapper that only fires once the session
// is authenticated. Prevents 401s from components mounting before NextAuth
// has hydrated the session cookie into the client.

import { useSession } from "next-auth/react";
import { useCallback } from "react";

export function useAuthedFetch() {
  const { status } = useSession();
  const isReady = status === "authenticated";

  const authedFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isReady) return Promise.resolve(null);
      return fetch(input, init);
    },
    [isReady]
  );

  return { authedFetch, isReady };
}
