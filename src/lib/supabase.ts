import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://bzhbfopuujfsodzrlbup.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6aGJmb3B1dWpmc29kenJsYnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjkzMTgsImV4cCI6MjEwNTIwNTMxOH0.X36MQ1bwsLx6rvlXJP0IPL2-VuuwMXpkudPD_C05Iik";
export const DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111";

let currentAuthUserId: string | null = null;

// Doğrudan tanımlı Supabase kimlik bilgileri (import.meta.env bağımlılığı kaldırılmıştır)
export function getSupabaseCredentials(): { url: string; anonKey: string; tenantId: string } {
  const localUrl = typeof window !== "undefined" ? localStorage.getItem("nakka_supabase_url") || "" : "";
  const localKey = typeof window !== "undefined" ? localStorage.getItem("nakka_supabase_key") || "" : "";
  const localTenant = typeof window !== "undefined" ? localStorage.getItem("nakka_tenant_id") || "" : "";

  const url = (localUrl || SUPABASE_URL).trim();
  const anonKey = (localKey || SUPABASE_ANON_KEY).trim();
  const tenantId = (localTenant || DEFAULT_TENANT_ID).trim();

  return { url, anonKey, tenantId };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith("http") && anonKey.length > 10);
}

const creds = getSupabaseCredentials();

export const supabase: SupabaseClient = createClient(
  creds.url || SUPABASE_URL,
  creds.anonKey || SUPABASE_ANON_KEY,
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
    const rawUsername = 
      user.user_metadata?.user_name || 
      user.user_metadata?.username || 
      user.email?.split("@")[0] || 
      "yonetici";
    const username = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 50);

    const fullName = 
      user.user_metadata?.full_name || 
      user.user_metadata?.name || 
      user.email?.split("@")[0] || 
      "Atölye Yöneticisi";

    const email = user.email || "";

    // 1. Tenants tablosunda atölye kaydını garantiye al
    try {
      const { data: existingTenant, error: existingTenantErr } = await supabase
        .from("tenants")
        .select("id")
        .eq("id", tenantId)
        .maybeSingle();

      if (existingTenantErr) {
        console.warn("Tenant kontrol hatası:", existingTenantErr.message);
      }

      if (!existingTenant) {
        const slug = `tenant-${tenantId.slice(0, 8)}`;
        const tenantName = user.user_metadata?.company_name || fullName || "Atölye";

        // Tablonun beklediği tüm gerekli ve ilişkisel alanlar
        const tenantPayload: Record<string, any> = {
          id: tenantId,
          name: tenantName,
          slug: slug,
          email: email,
          subscription_status: "active",
          status: "active"
        };

        const { error: tErr } = await supabase.from("tenants").insert([tenantPayload]);
        if (tErr) {
          console.warn("Tenants tablosu tam şema uyarısı, minimal alanlarla deneniyor:", tErr.message);
          const { error: minTErr } = await supabase.from("tenants").insert([{
            id: tenantId,
            name: tenantName,
            slug: slug
          }]);
          if (minTErr) {
            console.warn("Tenants tablosu minimal şema uyarısı:", minTErr.message);
          }
        }
      }
    } catch (tErr) {
      console.warn("Tenant kaydı bilgisi:", tErr);
    }

    // 2. Users tablosunda kullanıcı profilini garantiye al
    try {
      const { data: existingUser, error: existingUserErr } = await supabase
        .from("users")
        .select("id")
        .eq("id", tenantId)
        .maybeSingle();

      if (existingUserErr) {
        console.warn("User kontrol hatası:", existingUserErr.message);
      }

      if (!existingUser) {
        // Tablonun beklediği tüm gerekli (NOT NULL) ve ilişkisel sütunlar:
        // id, auth_user_id, tenant_id, full_name, username, email, role, status
        const fullUserPayload: Record<string, any> = {
          id: tenantId,
          auth_user_id: tenantId,
          tenant_id: tenantId,
          full_name: fullName,
          username: username,
          email: email,
          role: "owner",
          status: "active",
          is_email_verified: true
        };

        const { error: uErr } = await supabase.from("users").insert([fullUserPayload]);
        
        // Eğer veritabanı tablosu farklı sütun kısıtlarına sahipse dinamik uyarlama
        if (uErr) {
          console.warn("Users tablosu tam şema uyarısı, çekirdek sütunlarla deneniyor:", uErr.message);
          
          const coreUserPayload: Record<string, any> = {
            id: tenantId,
            tenant_id: tenantId,
            full_name: fullName,
            username: username,
            email: email,
            role: "owner"
          };
          const { error: coreErr } = await supabase.from("users").insert([coreUserPayload]);

          if (coreErr) {
            console.warn("Users tablosu temel alanlar uyarısı, sade şema deneniyor:", coreErr.message);
            const { error: simpleErr } = await supabase.from("users").upsert({
              id: tenantId,
              email: email,
              full_name: fullName
            }, { onConflict: "id" });
            if (simpleErr) {
              console.warn("Users tablosu sade şema uyarısı:", simpleErr.message);
            }
          }
        }
      } else {
        // Mevcut kullanıcıyı hafif güncelle (örneğin son profil adı)
        const { error: updateErr } = await supabase.from("users").update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        }).eq("id", tenantId);
        if (updateErr) {
          console.warn("Users tablosu güncelleme uyarısı:", updateErr.message);
        }
      }
    } catch (uErr) {
      console.warn("User kaydı bilgisi:", uErr);
    }
  } catch (err) {
    console.warn("Tenant/User upsert bilgisi:", err);
  }
}
