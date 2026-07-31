"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiLogin, apiGetMe } from "@/lib/api";

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("templumis_token");
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("templumis_token");
    if (stored) {
      apiGetMe(stored)
        .then((u) => {
          setUser(u);
          setToken(stored);
        })
        .catch(() => {
          localStorage.removeItem("templumis_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    localStorage.setItem("templumis_token", res.access_token);
    setToken(res.access_token);
    const u = await apiGetMe(res.access_token);
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
