import React, { useEffect, useState, useCallback, useRef } from "react";
import { Coins, Infinity, Loader2, User } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { fetchTenantSubscriptionCredits, TenantCreditsResult } from "../services/supabaseService";
import { useAuthGuard } from "../context/AuthGuardContext";

interface CreditIndicatorProps {
  tenantId?: string;
  isDarkMode: boolean;
  variant?: "desktop" | "mobile" | "standalone";
  onClick?: () => void;
  onCreditUpdate?: (info: TenantCreditsResult) => void;
}

export const CreditIndicator: React.FC<CreditIndicatorProps> = ({
  tenantId: propTenantId,
  isDarkMode,
  variant = "desktop",
  onClick,
  onCreditUpdate
}) => {
  const { user: authUser, tenant: authTenant } = useAuthGuard();
  const [loading, setLoading] = useState<boolean>(true);
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("pay_as_you_go");
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);

  const effectiveTenantId = propTenantId || authUser?.id || authTenant?.id;

  const onCreditUpdateRef = useRef(onCreditUpdate);
  useEffect(() => {
    onCreditUpdateRef.current = onCreditUpdate;
  }, [onCreditUpdate]);

  const applyCreditData = useCallback((data: TenantCreditsResult) => {
    setRemainingCredits(prev => (prev === data.remainingCredits ? prev : data.remainingCredits));
    setTotalCredits(prev => (prev === data.totalCredits ? prev : data.totalCredits));
    setSubscriptionTier(prev => (prev === data.subscriptionTier ? prev : data.subscriptionTier));
    setIsUnlimited(prev => (prev === data.isUnlimited ? prev : data.isUnlimited));
    onCreditUpdateRef.current?.(data);
  }, []);

  const loadCredits = useCallback(async (tId?: string) => {
    if (!tId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await fetchTenantSubscriptionCredits(tId);
      if (data && !error) {
        applyCreditData(data);
      }
    } catch (err) {
      console.warn("CreditIndicator yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  }, [applyCreditData]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadCredits(effectiveTenantId);

    // Supabase Realtime bağlantısı: Atölyenin kredisi güncellendiğinde anında ekrana yansıt
    if (effectiveTenantId && effectiveTenantId !== "dev_admin" && isSupabaseConfigured()) {
      let channel: any = null;
      try {
        const uniqueChannelId = `rt-cr-${effectiveTenantId}-${Math.random().toString(36).slice(2, 9)}`;
        channel = supabase
          .channel(uniqueChannelId)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "tenants",
              filter: `id=eq.${effectiveTenantId}`
            },
            (payload) => {
              if (!isMounted || !payload.new) return;
              const updatedRow = payload.new as any;
              const tier = String(updatedRow.subscription_tier || "").toLowerCase().trim();
              const unl = tier === "unlimited" || tier.includes("unlimited") || tier === "unlimited_enterprise";
              const rem = Number(updatedRow.remaining_credits ?? 0);
              const tot = Number(updatedRow.total_credits ?? 0);

              applyCreditData({
                remainingCredits: rem,
                totalCredits: tot,
                subscriptionTier: updatedRow.subscription_tier || "pay_as_you_go",
                subscriptionStatus: updatedRow.subscription_status || "active",
                isUnlimited: unl,
                status: updatedRow.status || "active",
                name: updatedRow.name
              });
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("CreditIndicator realtime subscription warning:", err);
      }

      return () => {
        isMounted = false;
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch {
            // ignore
          }
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [effectiveTenantId, loadCredits]);

  // Auth context tenant verisi güncellendiğinde senkronize et
  useEffect(() => {
    if (authTenant) {
      const tier = String(authTenant.subscription_tier || "").toLowerCase().trim();
      const unl = tier === "unlimited" || tier.includes("unlimited") || tier === "unlimited_enterprise";
      const rem = authTenant.remaining_credits !== undefined ? Number(authTenant.remaining_credits ?? 0) : 0;
      const tot = authTenant.total_credits !== undefined ? Number(authTenant.total_credits ?? 0) : 0;
      const st = authTenant.subscription_tier || "pay_as_you_go";

      setRemainingCredits(prev => (prev === rem ? prev : rem));
      setTotalCredits(prev => (prev === tot ? prev : tot));
      setSubscriptionTier(prev => (prev === st ? prev : st));
      setIsUnlimited(prev => (prev === unl ? prev : unl));
      setLoading(false);
    }
  }, [
    authTenant?.id,
    authTenant?.remaining_credits,
    authTenant?.total_credits,
    authTenant?.subscription_tier
  ]);

  const isLowCredits = !isUnlimited && remainingCredits < 15;

  // Mobil Görünüm
  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
          isLowCredits
            ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
            : isUnlimited
              ? isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-emerald-50 border-emerald-300 text-emerald-700"
              : isDarkMode 
                ? "bg-[#101216] border-[#C5A059]/40 text-[#C5A059]" 
                : "bg-white border-[#B88E3A]/40 text-[#B88E3A]"
        }`}
        title={isUnlimited ? "Sınırsız Kredi Paketi" : `Kalan Kredi: ${remainingCredits} / Toplam: ${totalCredits}`}
      >
        <User className="w-3.5 h-3.5" />
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-[#C5A059]" />
        ) : isUnlimited ? (
          <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
            <Infinity className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="font-mono text-[9px] font-black">
            {remainingCredits}/{totalCredits}
          </span>
        )}
      </button>
    );
  }

  // Standalone / Bağımsız Panel Görünümü (örneğin Dashboard içi widget)
  if (variant === "standalone") {
    return (
      <div 
        onClick={onClick}
        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
          isDarkMode ? "bg-[#111317] border-white/10 hover:border-[#C5A059]/50" : "bg-white border-slate-200 hover:border-[#B88E3A]/50 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider block ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                Atölye Kredi Bakiyesi
              </span>
              <span className="text-[10px] text-neutral-400">
                {isUnlimited ? "Sınırsız Abonelik" : `${subscriptionTier} Paketi`}
              </span>
            </div>
          </div>

          {isUnlimited ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Infinity className="w-3 h-3" /> Sınırsız
            </span>
          ) : isLowCredits ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Kritik Bakiye
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Aktif
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          {loading ? (
            <div className="flex items-center gap-2 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" />
              <span className="text-xs text-neutral-400 font-medium">Krediler yükleniyor...</span>
            </div>
          ) : isUnlimited ? (
            <div className="flex items-center gap-2">
              <Infinity className="w-7 h-7 text-emerald-400" />
              <span className="text-2xl font-black font-mono text-emerald-400">Sınırsız</span>
              <span className="text-xs font-bold text-neutral-400 ml-1">Sipariş & PDF Kotası</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-[#C5A059]">
                {remainingCredits}
              </span>
              <span className="text-base font-bold text-neutral-400">
                / {totalCredits}
              </span>
              <span className="text-xs font-bold text-neutral-400 ml-1">
                Kalan Kredi
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Varsayılan: Desktop Header / Dashboard Üst Çubuğu Butonu
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all uppercase text-[10px] font-bold tracking-wider shadow-sm cursor-pointer select-none ${
        isLowCredits
          ? "bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
          : isUnlimited
            ? isDarkMode
              ? "bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-emerald-50 border-emerald-300 hover:border-emerald-500 text-emerald-800 hover:bg-emerald-100"
            : isDarkMode 
              ? "bg-[#101216] border-[#C5A059]/40 hover:border-[#C5A059] text-[#C5A059]" 
              : "bg-white border-[#B88E3A]/40 hover:border-[#B88E3A] text-[#B88E3A]"
      }`}
      title={
        isUnlimited 
          ? "Sınırsız Atölye Paketi: Sınırsız Sipariş & PDF İhracı" 
          : `Atölye Kredisi: ${remainingCredits} Kalan / ${totalCredits} Toplam Kota`
      }
    >
      <User className="w-3.5 h-3.5" />
      <span>HESAP</span>

      {loading ? (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/10 text-neutral-300">
          <Loader2 className="w-2.5 h-2.5 animate-spin text-[#C5A059]" />
          <span>...</span>
        </span>
      ) : isUnlimited ? (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
          isDarkMode 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
        }`}>
          <Infinity className="w-3 h-3" />
          <span>SINIRSIZ</span>
        </span>
      ) : (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
          isLowCredits
            ? "bg-rose-500/20 text-rose-500 font-bold border border-rose-400/40"
            : isDarkMode 
              ? "bg-[#C5A059]/20 text-[#E5C158] border border-[#C5A059]/30" 
              : "bg-amber-100 text-amber-900 border border-amber-300"
        }`}>
          {remainingCredits} / {totalCredits} Kr.
        </span>
      )}
    </button>
  );
};
