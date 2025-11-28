"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { ApiUser } from "../types/api";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: ApiUser }>("/me", { csrf: false });
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);


