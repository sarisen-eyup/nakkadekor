import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
      autoRefreshToken: true
    }
  }
);

export function getTenantId(): string {
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
