import React, { useState } from "react";
import { 
  X, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  Coins, 
  RefreshCw,
  Plus,
  AlertTriangle,
  Building2,
  Infinity
} from "lucide-react";
import { SubscriptionData, isProPlan } from "../types/pricing";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  subscription: SubscriptionData;
  onUpdateSubscription: (sub: SubscriptionData) => void;
  userCount?: number;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  subscription,
  onUpdateSubscription,
  userCount = 3
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(subscription.planId);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const usedCredits = Math.max(0, subscription.totalCredits - subscription.remainingCredits);
  const percentageLeft = Math.round((subscription.remainingCredits / Math.max(1, subscription.totalCredits)) * 100);

  const handleAddCredits = (amount: number, label: string) => {
    const updated: SubscriptionData = {
      ...subscription,
      remainingCredits: subscription.remainingCredits + amount,
      totalCredits: subscription.totalCredits + amount,
      status: "active"
    };
    onUpdateSubscription(updated);
    setSuccessNotice(`Tebrikler! ${amount} Adet Sipariş & PDF Kredisi başarıyla yüklendi.`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleSwitchPlan = (planId: "pay_as_you_go" | "pro_monthly" | "pro_yearly" | "unlimited_enterprise", name: string, credits: number) => {
    if (planId === "pay_as_you_go" && userCount > 3) {
      setSuccessNotice(`UYARI: Sisteminizde şu anda ${userCount} kayıtlı personel bulunmaktadır. Kredili hesaba geçebilmek için en fazla 3 personel olmalıdır. Lütfen önce fazla kullanıcıları silin.`);
      return;
    }
    const isPro = planId === "pro_monthly" || planId === "pro_yearly" || planId === "unlimited_enterprise";
    const renewalLabel = planId === "pro_yearly" 
      ? "1 Yıl Sonra (Yıllık Dönem)" 
      : planId === "pro_monthly" 
      ? "1 Ay Sonra (Aylık Dönem)" 
      : "Dönemsiz (Kredi Bakiyesi)";

    const updated: SubscriptionData = {
      ...subscription,
      planId: planId,
      planName: name,
      isMonthlySubscription: isPro,
      maxUsers: isPro ? 6 : 3,
      remainingCredits: subscription.remainingCredits + credits,
      totalCredits: subscription.totalCredits + credits,
      renewalDate: renewalLabel,
      status: "active"
    };
    setSelectedPlan(planId);
    onUpdateSubscription(updated);
    setSuccessNotice(`Paketiniz "${name}" olarak güncellendi! (${isPro ? "Logo yükleme ve 6 personel yetkisi aktif" : "Maksimum 3 personel, standart antet"})`);
    setTimeout(() => setSuccessNotice(null), 4500);
  };

  const isCurrentPro = isProPlan(subscription);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl flex flex-col overflow-hidden max-h-[92vh] transition-all ${
        isDarkMode ? "bg-[#14171d] border-[#C5A059]/30 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        
        {/* Header */}
        <div className={`p-5 md:p-6 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30" : "bg-[#B88E3A]/20 text-[#B88E3A]"
            }`}>
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-wider uppercase flex items-center gap-2 flex-wrap">
                ABONELİK VE KREDİ YÖNETİMİ
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  B2B ATÖLYE
                </span>
                {isCurrentPro ? (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PRO LOGO İZNİ AÇIK
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
                    KONTÖRLÜ / STANDART
                  </span>
                )}
              </h2>
              <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Kredi bakiyesi, paket detayları ve belge lisansı
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body - Stabilized min-height */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 min-h-[480px] space-y-6">
          {successNotice && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Current Status Card */}
          <div className={`p-5 rounded-2xl border relative overflow-hidden ${
            isDarkMode 
              ? "bg-gradient-to-br from-[#1b1f28] to-[#121419] border-[#C5A059]/40 shadow-lg shadow-[#C5A059]/5" 
              : "bg-gradient-to-br from-amber-50/70 to-white border-[#B88E3A]/30 shadow-sm"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                  Aktif Atölye Paketi
                </span>
                <h3 className="text-xl font-black uppercase tracking-wide mt-0.5 flex items-center gap-2">
                  {subscription.planName}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Dönem Yenilenme Tarihi: <strong>{subscription.renewalDate}</strong></span>
                </p>

                {/* Logo availability status banner in current plan */}
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border">
                  {isCurrentPro ? (
                    <span className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30 font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Firma Logosu Yükleme: <strong>AÇIK</strong> (Abonelik Kapsamında)
                    </span>
                  ) : (
                    <span className="text-amber-300 bg-amber-500/10 border-amber-500/30 font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Firma Logosu Yükleme: <strong>KAPALI</strong> (Kontörlü Hesap - Pro Gerekir)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right">
                {subscription.isUnlimited || subscription.subscriptionTier === "unlimited" ? (
                  <>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                      Sınırsız Paket Kotası
                    </span>
                    <div className="flex items-center sm:justify-end gap-2 text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-0.5">
                      <Infinity className="w-7 h-7" />
                      <span>Sınırsız</span>
                    </div>
                    <div className="text-[11px] font-medium text-neutral-400 mt-0.5">
                      Sınırsız Sipariş &amp; PDF İhracı
                    </div>
                  </>
                ) : subscription.isMonthlySubscription ? (
                  <>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                      Kalan Sipariş &amp; PDF Kredisi
                    </span>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-[#C5A059] mt-0.5">
                      {subscription.remainingCredits} <span className="text-sm font-sans font-normal text-neutral-400">/ {subscription.totalCredits}</span>
                    </div>
                    <div className="text-[11px] font-medium text-neutral-400 mt-0.5">
                      {subscription.planId === "pro_yearly" ? "Yıllık Paket Kotası" : "Aylık Paket Kotası"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl sm:text-5xl font-black font-mono text-[#C5A059] tracking-tight">
                      {subscription.remainingCredits} <span className="text-sm font-sans font-normal text-neutral-400">/ {subscription.totalCredits}</span>
                    </div>
                    <div className="text-xs font-semibold text-neutral-400 mt-1">
                      Kullanılabilir Kredi Bakiyesi
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar - Sadece abonelik paketi olanlar için gösterilir */}
            {subscription.isMonthlySubscription && (
              <div className="space-y-1.5 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>Kullanılan: {usedCredits} Sipariş</span>
                  <span>Kalan Kota: %{percentageLeft}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentageLeft < 15 
                        ? "bg-rose-500" 
                        : percentageLeft < 30 
                        ? "bg-amber-500" 
                        : "bg-gradient-to-r from-[#C5A059] to-[#E5C17B]"
                    }`}
                    style={{ width: `${Math.max(3, Math.min(100, percentageLeft))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Credit Top-Up Buttons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C5A059]" />
                <span>Hızlı Kredi Yükle (Tek Seferlik)</span>
              </h4>
              <span className="text-[10px] text-neutral-400 font-mono">Anında Bakiyeye Eklenir</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleAddCredits(25, "+25 Kredi")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group ${
                  isDarkMode 
                    ? "bg-[#101216] border-white/10 hover:border-[#C5A059] hover:bg-[#181b22]" 
                    : "bg-slate-50 border-slate-200 hover:border-[#B88E3A] hover:bg-amber-50/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-[#C5A059]">+25 KREDİ</span>
                  <Plus className="w-3.5 h-3.5 text-[#C5A059] group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-[11px] text-neutral-400">Atölye Takviye Paketi</div>
                <div className="text-xs font-bold font-mono mt-2">₺250 <span className="text-[10px] font-normal text-neutral-500">(10₺/adet)</span></div>
              </button>

              <button
                type="button"
                onClick={() => handleAddCredits(100, "+100 Kredi")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
                  isDarkMode 
                    ? "bg-[#101216] border-[#C5A059]/40 hover:border-[#C5A059] hover:bg-[#181b22]" 
                    : "bg-amber-50/40 border-[#B88E3A]/40 hover:border-[#B88E3A] hover:bg-amber-50"
                }`}
              >
                <div className="absolute top-0 right-0 bg-[#C5A059] text-black text-[8px] font-black px-2 py-0.5 rounded-bl">
                  POPÜLER
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-[#C5A059]">+100 KREDİ</span>
                  <Plus className="w-3.5 h-3.5 text-[#C5A059] group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-[11px] text-neutral-400">Orta Ölçekli Atölye</div>
                <div className="text-xs font-bold font-mono mt-2">₺750 <span className="text-[10px] font-normal text-neutral-500">(7.5₺/adet)</span></div>
              </button>

              <button
                type="button"
                onClick={() => handleAddCredits(250, "+250 Kredi")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group ${
                  isDarkMode 
                    ? "bg-[#101216] border-white/10 hover:border-[#C5A059] hover:bg-[#181b22]" 
                    : "bg-slate-50 border-slate-200 hover:border-[#B88E3A] hover:bg-amber-50/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-[#C5A059]">+250 KREDİ</span>
                  <Plus className="w-3.5 h-3.5 text-[#C5A059] group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-[11px] text-neutral-400">Yüksek Hacimli Galeri</div>
                <div className="text-xs font-bold font-mono mt-2">₺1.500 <span className="text-[10px] font-normal text-neutral-500">(6₺/adet)</span></div>
              </button>
            </div>
          </div>

          {/* Subscription Plans */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C5A059]" />
                <span>Üyelik Paketleri &amp; Kurumsal Lisans</span>
              </span>
              <span className="text-[11px] font-normal text-neutral-400">
                Logo anteti yükleme <strong>Pro Aylık veya Yıllık</strong> aboneliğe özeldir
              </span>
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {/* 1. Pay as you go (Kredili / Kontörlü) */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                subscription.planId === "pay_as_you_go"
                  ? (isDarkMode ? "bg-[#181c24] border-[#C5A059]" : "bg-amber-50/40 border-[#B88E3A]")
                  : (isDarkMode ? "bg-[#101216] border-white/10" : "bg-slate-50 border-slate-200")
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase">Kredili (Kontörlü)</span>
                    {subscription.planId === "pay_as_you_go" && (
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">MEVCUT</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Aylık sabit ücret yok. İhtiyaç oldukça bakiye kredisi satın alarak çalışın.
                  </p>
                  <div className="text-lg font-black font-mono mt-2">
                    ₺0 <span className="text-xs font-sans text-neutral-400">/ ay</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-1.5 text-rose-400 font-medium">
                      <span className="font-bold">✕</span>
                      <span><strong>Logo Yükleme: KAPALI</strong> (Standart antet kullanılır)</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-amber-400 font-semibold">
                      <span>•</span>
                      <span>Maksimum <strong>3 personel</strong> tanımlanabilir</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-neutral-400">
                      <span>•</span>
                      <span>İstediğiniz zaman tek seferlik kredi takviyesi</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchPlan("pay_as_you_go", "Kullandıkça Öde (Kredili Hesap)", 20)}
                  disabled={subscription.planId === "pay_as_you_go"}
                  className={`mt-4 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    subscription.planId === "pay_as_you_go"
                      ? "bg-neutral-700/40 text-neutral-400 cursor-default"
                      : (isDarkMode ? "bg-white/10 hover:bg-[#C5A059] hover:text-black" : "bg-slate-200 hover:bg-[#B88E3A] hover:text-white")
                  }`}
                >
                  {subscription.planId === "pay_as_you_go" ? "Seçili Plan (Maks 3 Personel)" : "Kredili Plana Geç"}
                </button>
              </div>

              {/* 2. Pro Monthly (Aylık Abonelik) */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative ${
                subscription.planId === "pro_monthly"
                  ? (isDarkMode ? "bg-[#181c24] border-[#C5A059] shadow-md shadow-[#C5A059]/10" : "bg-amber-50/60 border-[#B88E3A]")
                  : (isDarkMode ? "bg-[#101216] border-white/10" : "bg-slate-50 border-slate-200")
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#C5A059]">Pro (Aylık Abonelik)</span>
                    {subscription.planId === "pro_monthly" ? (
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-[#C5A059] text-black">AKTİF</span>
                    ) : (
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">POPÜLER</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Orta ve büyük atölyeler için aylık düzenli sipariş kotası ve kurumsal antet.
                  </p>
                  <div className="text-lg font-black font-mono mt-2 text-[#C5A059]">
                    ₺850 <span className="text-xs font-sans text-neutral-400">/ ay</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-1.5 text-emerald-400 font-semibold">
                      <span>✓</span>
                      <span><strong>Logo Yükleme: AÇIK</strong> (PDF ve formlarda özel logo)</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-emerald-400 font-semibold">
                      <span>✓</span>
                      <span><strong>En fazla 6 personel</strong> tanımlama yetkisi</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-neutral-300">
                      <span>✓</span>
                      <span>Her ay <strong>100 sipariş ve PDF kredisi</strong></span>
                    </div>
                    <div className="flex items-start gap-1.5 text-neutral-300">
                      <span>✓</span>
                      <span>Kurumsal White-label &amp; İş Emri</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchPlan("pro_monthly", "Pro Atölye (Aylık Abonelik)", 100)}
                  disabled={subscription.planId === "pro_monthly"}
                  className={`mt-4 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    subscription.planId === "pro_monthly"
                      ? "bg-[#C5A059]/30 text-[#C5A059] cursor-default border border-[#C5A059]/50"
                      : "bg-[#C5A059] text-black hover:bg-[#b8944c]"
                  }`}
                >
                  {subscription.planId === "pro_monthly" ? "Aktif Aylık Plan" : "Aylık Plana Geç"}
                </button>
              </div>

              {/* 3. Pro Yearly (Yıllık Abonelik) */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative ${
                subscription.planId === "pro_yearly"
                  ? (isDarkMode ? "bg-[#181c24] border-[#C5A059] shadow-md shadow-[#C5A059]/10" : "bg-amber-50/60 border-[#B88E3A]")
                  : (isDarkMode ? "bg-[#101216] border-white/10" : "bg-slate-50 border-slate-200")
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#C5A059]">Pro (Yıllık Abonelik)</span>
                    {subscription.planId === "pro_yearly" ? (
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-[#C5A059] text-black">AKTİF</span>
                    ) : (
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-amber-400 text-black">2 AY HEDİYE</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Yıllık peşin ödemede 2 ay hediye, kesintisiz kota ve öncelikli destek.
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-lg font-black font-mono text-[#C5A059]">₺700</span>
                    <span className="text-xs font-sans text-neutral-400">/ ay (₺8.400 / yıl)</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-1.5 text-emerald-400 font-semibold">
                      <span>✓</span>
                      <span><strong>Logo Yükleme: AÇIK</strong> (PDF ve formlarda özel logo)</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-emerald-400 font-semibold">
                      <span>✓</span>
                      <span><strong>En fazla 6 personel</strong> tanımlama yetkisi</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-neutral-300">
                      <span>✓</span>
                      <span>Yıllık <strong>1.440 sipariş ve PDF kredisi</strong> (120/ay)</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-neutral-300">
                      <span>✓</span>
                      <span>Öncelikli telefon ve WhatsApp desteği</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchPlan("pro_yearly", "Pro Atölye (Yıllık Abonelik)", 1440)}
                  disabled={subscription.planId === "pro_yearly"}
                  className={`mt-4 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    subscription.planId === "pro_yearly"
                      ? "bg-[#C5A059]/30 text-[#C5A059] cursor-default border border-[#C5A059]/50"
                      : "bg-[#C5A059] text-black hover:bg-[#b8944c]"
                  }`}
                >
                  {subscription.planId === "pro_yearly" ? "Aktif Yıllık Plan" : "Yıllık Plana Geç (2 Ay Hediye)"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 md:p-5 border-t flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kredi kartı gerektirmeyen B2B kurumsal cari faturalandırma</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#C5A059] text-black font-bold uppercase text-xs tracking-wider cursor-pointer hover:bg-[#b8944c]"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
