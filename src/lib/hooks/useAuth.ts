"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { setAuthToken, getAuthToken } from "../api/client";

export function useAuth() {
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const token = searchParams.get("token");
    if (token) {
      setAuthToken(token);
      // Remove token from URL for security
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }
    initialized.current = true;
  }, [searchParams]);

  return {
    isAuthenticated: !!getAuthToken(),
    token: getAuthToken(),
  };
}
