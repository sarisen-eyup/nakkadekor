import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured, setAuthenticatedTenantId } from "../lib/supabase";
import { clearAuthSession, clearAllUserTenantCache } from "../utils/pricing";
import { fetchTenantRecord } from "../services/supabaseService";
import { TenantRecord, TenantStatus } from "../types/auth";
import type { Session, User } from "@supabase/supabase-js";

interface AuthGuardContextType {
  session: Session | null;
  user: User | null;
  tenant: TenantRecord | null;
  tenantStatus: TenantStatus;
  isLoading: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  refreshTenant: () => Promise<TenantStatus>;
  signOut: () => Promise<void>;
  enterDevMode: () => void;
  exitDevMode: () => void;
  isDevMode: boolean;
  setManualTenantStatus?: (status: TenantStatus) => void;
}

const AuthGuardContext = createContext<AuthGuardContextType | undefined>(undefined);

export const AuthGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [tenantStatus, setTenantStatus] = useState<TenantStatus>("loading");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      return localStorage.getItem("nakka_dev_mode") === "true";
    }
    return false;
  });

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme_mode");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("theme_mode", next ? "dark" : "light");
      }
      return next;
    });
  }, []);

  const checkUserTenantStatus = useCallback(async (currentUserId: string): Promise<TenantStatus> => {
    try {
      const result = await fetchTenantRecord(currentUserId);
      setTenant(result.tenant);
      setTenantStatus(result.status);
      return result.status;
    } catch (err) {
      console.warn("AuthGuard checkUserTenantStatus error:", err);
      setTenantStatus("needs_onboarding");
      return "needs_onboarding";
    }
  }, []);

  const refreshTenant = useCallback(async (): Promise<TenantStatus> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setTenantStatus("active");
        setIsLoading(false);
        return "active";
      }

      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession?.user) {
        setSession(null);
        setUser(null);
        setTenant(null);
        setTenantStatus("unauthenticated");
        setIsLoading(false);
        return "unauthenticated";
      }

      setSession(freshSession);
      setUser(freshSession.user);
      setAuthenticatedTenantId(freshSession.user.id);

      const status = await checkUserTenantStatus(freshSession.user.id);
      setIsLoading(false);
      return status;
    } catch (err) {
      console.warn("refreshTenant error:", err);
      setIsLoading(false);
      return "error";
    }
  }, [checkUserTenantStatus]);

  const enterDevMode = useCallback(() => {
    if (!import.meta.env.DEV) return;
    setIsDevMode(true);
    localStorage.setItem("nakka_dev_mode", "true");
    setTenantStatus("active");
    const devUser = {
      id: "dev_admin",
      app_metadata: {},
      user_metadata: {
        full_name: "Geliştirici & Tasarımcı",
        name: "Geliştirici & Tasarımcı",
        email: "sarisen@gmail.com",
        role: "admin"
      },
      aud: "authenticated",
      created_at: new Date().toISOString()
    } as unknown as User;
    setUser(devUser);
    setIsLoading(false);
  }, []);

  const exitDevMode = useCallback(() => {
    localStorage.removeItem("nakka_dev_mode");
    setIsDevMode(false);
    setTenantStatus("unauthenticated");
    setUser(null);
    setSession(null);
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    localStorage.removeItem("nakka_dev_mode");
    setIsDevMode(false);
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("SignOut warning:", err);
      }
    }
    clearAuthSession();
    clearAllUserTenantCache();
    setSession(null);
    setUser(null);
    setTenant(null);
    setTenantStatus("unauthenticated");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    let tenantChannel: any = null;

    const setupTenantRealtime = (userId: string) => {
      if (!isSupabaseConfigured() || !userId) return;
      if (tenantChannel) {
        try {
          supabase.removeChannel(tenantChannel);
        } catch {
          // ignore
        }
        tenantChannel = null;
      }
      try {
        tenantChannel = supabase
          .channel(`tenant_status_watch_${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tenants",
              filter: `id=eq.${userId}`
            },
            async (payload) => {
              if (!isMounted) return;
              const newRow = payload.new as any;
              if (newRow) {
                const rawStatus = String(newRow.status || "pending").toLowerCase().trim();
                const mapped: TenantStatus =
                  rawStatus === "active" ? "active" :
                  rawStatus === "suspended" ? "suspended" : "pending";
                setTenant(newRow);
                setTenantStatus(mapped);
              } else {
                await checkUserTenantStatus(userId);
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn("Realtime tenant subscription warning:", e);
      }
    };

    const initAuth = async () => {
      setIsLoading(true);

      // AI Studio Geliştirici / Tasarım Modu aktif ise doğrudan aktif oturum aç
      if (import.meta.env.DEV && localStorage.getItem("nakka_dev_mode") === "true") {
        if (isMounted) {
          setIsDevMode(true);
          setTenantStatus("active");
          const devUser = {
            id: "dev_admin",
            app_metadata: {},
            user_metadata: {
              full_name: "Geliştirici & Tasarımcı",
              name: "Geliştirici & Tasarımcı",
              email: "sarisen@gmail.com",
              role: "admin"
            },
            aud: "authenticated",
            created_at: new Date().toISOString()
          } as unknown as User;
          setUser(devUser);
          setIsLoading(false);
        }
        return;
      }

      if (!isSupabaseConfigured()) {
        // Supabase yapılandırılmamışsa geliştirme ortamında doğrudan aktif aç
        if (isMounted) {
          setTenantStatus("active");
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          setAuthenticatedTenantId(initialSession.user.id);
          await checkUserTenantStatus(initialSession.user.id);
          setupTenantRealtime(initialSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setTenant(null);
          setTenantStatus("unauthenticated");
        }
      } catch (err) {
        console.warn("initAuth error:", err);
        if (isMounted) {
          setTenantStatus("unauthenticated");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Supabase auth değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" && currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        setAuthenticatedTenantId(currentSession.user.id);
        setIsLoading(true);
        await checkUserTenantStatus(currentSession.user.id);
        setupTenantRealtime(currentSession.user.id);
        setIsLoading(false);
      } else if ((event === "USER_UPDATED" || event === "TOKEN_REFRESHED") && currentSession?.user) {
        // Token yenilemelerinde veya arka plan güncellemelerinde ASLA UI loading durumuna sokulmamalıdır!
        // Sessiz (silent) oturum tazelemesi yapılır.
        setSession(currentSession);
        setUser(currentSession.user);
        setAuthenticatedTenantId(currentSession.user.id);
      } else if (event === "SIGNED_OUT") {
        if (tenantChannel) {
          try {
            supabase.removeChannel(tenantChannel);
          } catch {
            // ignore
          }
          tenantChannel = null;
        }
        setSession(null);
        setUser(null);
        setTenant(null);
        setTenantStatus("unauthenticated");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (tenantChannel) {
        try {
          supabase.removeChannel(tenantChannel);
        } catch {
          // ignore
        }
      }
      authListener?.subscription.unsubscribe();
    };
  }, [checkUserTenantStatus]);

  return (
    <AuthGuardContext.Provider
      value={{
        session,
        user,
        tenant,
        tenantStatus,
        isLoading,
        isDarkMode,
        toggleDarkMode,
        refreshTenant,
        signOut,
        enterDevMode,
        exitDevMode,
        isDevMode
      }}
    >
      {children}
    </AuthGuardContext.Provider>
  );
};

export const useAuthGuard = (): AuthGuardContextType => {
  const context = useContext(AuthGuardContext);
  if (!context) {
    throw new Error("useAuthGuard must be used within an AuthGuardProvider");
  }
  return context;
};
