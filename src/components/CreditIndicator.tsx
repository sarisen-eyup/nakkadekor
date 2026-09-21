import React, { useEffect, useState, useCallback, useRef } from "react";
import { Coins, Infinity, Loader2, User, Clock } from "lucide-react";
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
  const [pendingCredits, setPendingCredits] = useState<number>(0);
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
    setPendingCredits(prev => (prev === data.pendingCredits ? prev : data.pendingCredits));
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
              const pend = Number(updatedRow.pending_credits ?? 0);

              applyCreditData({
                remainingCredits: rem,
                totalCredits: tot,
                pendingCredits: pend,
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
      const pend = authTenant.pending_credits !== undefined ? Number(authTenant.pending_credits ?? 0) : 0;
      const st = authTenant.subscription_tier || "pay_as_you_go";

      setRemainingCredits(prev => (prev === rem ? prev : rem));
      setTotalCredits(prev => (prev === tot ? prev : tot));
      setPendingCredits(prev => (prev === pend ? prev : pend));
      setSubscriptionTier(prev => (prev === st ? prev : st));
      setIsUnlimited(prev => (prev === unl ? prev : unl));
      setLoading(false);
    }
  }, [
    authTenant?.id,
    authTenant?.remaining_credits,
    authTenant?.total_credits,
    authTenant?.pending_credits,
    authTenant?.subscription_tier
  ]);

  const isLowCredits = !isUnlimited && remainingCredits < 15;

  // Mobil Görünüm
  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider transition-all cursor-pointer shadow-xs ${
          isLowCredits
            ? isDarkMode 
              ? "bg-rose-950/25 border-rose-500/40 text-rose-300"
              : "bg-rose-50 border-rose-300 text-rose-800"
            : isDarkMode 
              ? "bg-[#13161c] border-[#C5A059]/40 hover:border-[#C5A059] text-neutral-200" 
              : "bg-white border-amber-200/90 hover:border-[#B88E3A] text-slate-800"
        }`}
        title={
          isUnlimited 
            ? "Sınırsız Kredi Paketi" 
            : `Kalan Kredi: ${remainingCredits} / Toplam: ${totalCredits}${pendingCredits > 0 ? ` (Onay Bekleyen: ${pendingCredits >= 999999 ? "Sınırsız" : `${pendingCredits} Kredi`})` : ""}`
        }
      >
        <User className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-[#C5A059]" />
        ) : isUnlimited ? (
          <span className={`flex items-center gap-0.5 font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
            <Infinity className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="font-mono text-[9px] font-black">
            {remainingCredits}/{totalCredits}
          </span>
        )}

        {/* Mobil Onay Bekleyen Rozeti */}
        {pendingCredits > 0 && (
          <span 
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black border shrink-0 ${
              isDarkMode 
                ? "bg-amber-500/25 text-amber-300 border-amber-400/50" 
                : "bg-amber-100 border-amber-400 text-amber-950 shadow-xs"
            }`}
            title={`Onay Bekleyen: ${pendingCredits >= 999999 ? "Sınırsız" : `${pendingCredits} Kredi`}`}
          >
            +{pendingCredits >= 999999 ? "∞" : pendingCredits}
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
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
              isDarkMode 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-emerald-50 text-emerald-700 border-emerald-300"
            }`}>
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

        {/* Standalone Onay Bekleyen Kredi Rozeti */}
        {pendingCredits > 0 && (
          <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
            isDarkMode 
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300" 
              : "bg-amber-100/80 border-amber-300 text-amber-950"
          }`}>
            <span className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${isDarkMode ? "text-amber-400" : "text-amber-700"}`} />
              <span>Onay Bekleyen: {pendingCredits >= 999999 ? "Yıllık Sınırsız Paket" : `${pendingCredits} Kredi`}</span>
            </span>
            <span className={`text-[10px] font-mono font-medium ${isDarkMode ? "text-amber-400/90" : "text-amber-800"}`}>
              Havale Bekleniyor
            </span>
          </div>
        )}
      </div>
    );
  }

  // Varsayılan: Desktop Header / Dashboard Üst Çubuğu Butonu
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all uppercase text-[10px] font-bold tracking-wider shadow-xs cursor-pointer select-none ${
        isLowCredits
          ? isDarkMode
            ? "bg-rose-950/25 border-rose-500/40 text-rose-300 hover:bg-rose-900/30"
            : "bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100"
          : isDarkMode 
            ? "bg-[#13161c] border-[#C5A059]/35 hover:border-[#C5A059] hover:bg-[#181d25] text-neutral-200 shadow-sm" 
            : "bg-white border-amber-200/90 hover:border-[#B88E3A] hover:bg-amber-50/40 text-slate-800 shadow-xs"
      }`}
      title={
        isUnlimited 
          ? "Sınırsız Atölye Paketi: Sınırsız Sipariş & PDF İhracı" 
          : `Atölye Kredisi: ${remainingCredits} Kalan / ${totalCredits} Toplam Kota${pendingCredits > 0 ? ` (Onay Bekleyen: ${pendingCredits >= 999999 ? "Sınırsız" : `${pendingCredits} Kredi`})` : ""}`
      }
    >
      <User className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
      <span className={isDarkMode ? "text-neutral-200 font-bold" : "text-slate-800 font-bold"}>HESAP</span>

      {loading ? (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
          isDarkMode ? "bg-white/10 text-neutral-300" : "bg-slate-100 text-slate-600"
        }`}>
          <Loader2 className={`w-2.5 h-2.5 animate-spin ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
          <span>...</span>
        </span>
      ) : isUnlimited ? (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
          isDarkMode 
            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40" 
            : "bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-2xs"
        }`}>
          <Infinity className="w-3 h-3" />
          <span>SINIRSIZ</span>
        </span>
      ) : (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
          isLowCredits
            ? "bg-rose-500/20 text-rose-500 font-bold border border-rose-400/40"
            : isDarkMode 
              ? "bg-[#C5A059]/15 text-[#E5C158] border border-[#C5A059]/30" 
              : "bg-amber-50 text-amber-900 border border-amber-200"
        }`}>
          {remainingCredits} / {totalCredits} Kr.
        </span>
      )}

      {/* Dikkat Çekici Onay Bekleyen Kredi Rozeti (pending_credits > 0 ise) */}
      {pendingCredits > 0 && (
        <span 
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black border shadow-xs animate-pulse ${
            isDarkMode
              ? "bg-amber-500/20 border-amber-400/60 text-amber-300"
              : "bg-amber-100/90 border-amber-400 text-amber-950"
          }`}
          title={`Onay Bekleyen Kredi: ${pendingCredits >= 999999 ? "Yıllık Sınırsız Paket" : `${pendingCredits} Kredi`} (Havale veya WhatsApp ile dekont iletiniz)`}
        >
          <Clock className={`w-2.5 h-2.5 shrink-0 ${isDarkMode ? "text-amber-400" : "text-amber-700"}`} />
          <span>ONAY BEKLEYEN: {pendingCredits >= 999999 ? "SINIRSIZ" : `${pendingCredits} KREDİ`}</span>
        </span>
      )}
    </button>
  );
};

