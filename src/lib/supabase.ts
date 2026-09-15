import { createClient, SupabaseClient } from "@supabase/supabase-js";

let currentAuthUserId: string | null = null;

// Helper to safely retrieve environment variables or localStorage overrides
export function getSupabaseCredentials(): { url: string; anonKey: string; tenantId: string } {
  const envUrl = 
    import.meta.env.VITE_SUPABASE_URL || 
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL || 
    (import.meta.env as any).SUPABASE_URL || 
    "";

  const envKey = 
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    (import.meta.env as any).SUPABASE_ANON_KEY || 
    "";

  const localUrl = typeof window !== "undefined" ? localStorage.getItem("nakka_supabase_url") || "" : "";
  const localKey = typeof window !== "undefined" ? localStorage.getItem("nakka_supabase_key") || "" : "";
  const localTenant = typeof window !== "undefined" ? localStorage.getItem("nakka_tenant_id") || "" : "";

  const url = (localUrl || envUrl || "").trim();
  const anonKey = (localKey || envKey || "").trim();
  const tenantId = (localTenant || import.meta.env.VITE_DEFAULT_TENANT_ID || "11111111-1111-1111-1111-111111111111").trim();

  return { url, anonKey, tenantId };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith("http") && anonKey.length > 10);
}

// Fallback dummy client for offline/unconfigured environments to prevent runtime crashes
const dummyUrl = "https://unconfigured-project.supabase.co";
const dummyKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy";

const creds = getSupabaseCredentials();

export const supabase: SupabaseClient = createClient(
  creds.url || dummyUrl,
  creds.anonKey || dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export function setAuthenticatedTenantId(uid: string | null) {
  currentAuthUserId = uid;
  if (typeof window !== "undefined") {
    if (uid && uid.trim().length > 0) {
      localStorage.setItem("nakka_tenant_id", uid.trim());
      localStorage.setItem("nakka_auth_user_id", uid.trim());
    } else {
      localStorage.removeItem("nakka_tenant_id");
      localStorage.removeItem("nakka_auth_user_id");
    }
  }
}

export function getTenantId(): string {
  if (currentAuthUserId && currentAuthUserId.trim().length > 0) {
    return currentAuthUserId.trim();
  }
  if (typeof window !== "undefined") {
    const storedAuth = localStorage.getItem("nakka_auth_user_id") || localStorage.getItem("nakka_tenant_id");
    if (storedAuth && storedAuth.trim().length > 0) {
      return storedAuth.trim();
    }
  }
  return getSupabaseCredentials().tenantId;
}

export function saveSupabaseCustomCredentials(url: string, key: string, tenantId?: string) {
  if (typeof window !== "undefined") {
    if (url) localStorage.setItem("nakka_supabase_url", url);
    else localStorage.removeItem("nakka_supabase_url");

    if (key) localStorage.setItem("nakka_supabase_key", key);
    else localStorage.removeItem("nakka_supabase_key");

    if (tenantId) localStorage.setItem("nakka_tenant_id", tenantId);
    else localStorage.removeItem("nakka_tenant_id");
  }
}

/**
 * Google OAuth ile Supabase Girişi
 * AI Studio iframe ortamında ve normal pencerede güvenli açılır pencere (popup) yönetimi ile çalışır.
 */
export async function signInWithGoogle(): Promise<{ error: any }> {
  if (!isSupabaseConfigured()) {
    return {
      error: new Error("Supabase henüz yapılandırılmamış. Lütfen Supabase URL ve Anon Key bilgilerinizi kaydedin.")
    };
  }

  try {
    const isIframe = typeof window !== "undefined" && window.self !== window.top;
    
    // Popup tabanlı Google OAuth akışı
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "select_account"
        },
        skipBrowserRedirect: isIframe
      }
    });

    if (error) return { error };

    if (data?.url) {
      const width = 560;
      const height = 660;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        data.url,
        "google_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (!popup) {
        // Tarayıcı popup engelleyici aktifse pencereyi yönlendir
        window.location.href = data.url;
      }
    }

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Giriş yapan kullanıcının tenant_id kaydını garantiye alır
 * Foreign key kısıtları ve RLS kuralları için tenants ve users tablolarına idempotent upsert uygular.
 */
export async function ensureTenantAndUserExist(user: any) {
  if (!isSupabaseConfigured() || !user?.id) return;
  const tenantId = user.id;

  try {
    const fullName = 
      user.user_metadata?.full_name || 
      user.user_metadata?.name || 
      user.email?.split("@")[0] || 
      "Atölye Sahibi";

    // 1. Tenants tablosunda kaydı garantiye al
    await supabase.from("tenants").upsert({
      id: tenantId,
      name: `${fullName} Çerçeve Atölyesi`,
      slug: `tenant-${tenantId.slice(0, 8)}`,
      status: "active"
    }, { onConflict: "id" });

    // 2. Users tablosunda kaydı garantiye al
    await supabase.from("users").upsert({
      id: tenantId,
      auth_user_id: tenantId,
      tenant_id: tenantId,
      email: user.email || "",
      full_name: fullName,
      role: "admin",
      status: "active"
    }, { onConflict: "id" });
  } catch (err) {
    console.warn("Tenant/User upsert notifikasyonu (şema veya RLS kaynaklı opsiyonel):", err);
  }
}
