import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, clearSession, extractError, getStoredUser, getToken, setSession } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getToken());
  const [booting, setBooting] = useState(true);

  // On first load, if we have a token, verify it with /auth/me
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const res = await authApi.me();
        if (!cancelled) {
          setUser(res.data.user);
          setSession(token, res.data.user);
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setToken("");
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      setSession(res.data.token, res.data.user);
      setToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractError(error) };
    }
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    try {
      const res = await authApi.register({ name, email, password, role });
      setSession(res.data.token, res.data.user);
      setToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractError(error) };
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken("");
  }, []);

  const value = useMemo(
    () => ({ user, token, booting, login, register, logout, isAuthenticated: Boolean(user && token) }),
    [user, token, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}