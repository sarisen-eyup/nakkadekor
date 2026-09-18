import React, { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  Upload, 
  Check, 
  Sparkles, 
  Mail, 
  Phone, 
  CreditCard, 
  Coins, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Clock,
  Plus,
  ArrowRight,
  Globe,
  MapPin,
  FileText,
  Receipt,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { 
  CompanyProfile, 
  UserAccount, 
  SubscriptionData, 
  isProPlan,
  EMPTY_COMPANY_PROFILE 
} from "../types/pricing";
import { 
  fetchCompanyProfileFromSupabase, 
  saveCompanyProfileToSupabase,
  uploadImageToSupabaseStorage,
  isSupabaseConfigured
} from "../services/supabaseService";
import { compressImage } from "../utils/imageCompressor";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  subscription: SubscriptionData;
  onUpdateSubscription: (sub: SubscriptionData) => void;
  activeUser?: UserAccount;
  onLogout?: () => void;
  initialTab?: "company" | "credits";
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  companyProfile,
  onSaveCompanyProfile,
  subscription,
  onUpdateSubscription,
  activeUser,
  onLogout,
  initialTab = "company"
}) => {
  const [activeTab, setActiveTab] = useState<"company" | "credits">(initialTab);
  const [localCompany, setLocalCompany] = useState<CompanyProfile>(companyProfile || EMPTY_COMPANY_PROFILE);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [creditNotice, setCreditNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "company");
      setSavedSuccess(false);
      setSaveStatusMsg(null);
      setCreditNotice(null);
      if (companyProfile) {
        setLocalCompany(companyProfile);
      }
      (async () => {
        try {
          const { data, error } = await fetchCompanyProfileFromSupabase();
          if (error) {
            console.warn("Firma profili yüklenirken hata:", error);
          } else if (data && Object.keys(data).length > 0) {
            setLocalCompany(data);
          }
        } catch (err) {
          console.warn("Firma profili yüklenirken beklenmeyen hata:", err);
        }
      })();
    }
  }, [isOpen, initialTab, companyProfile]);

  if (!isOpen) return null;

  const canUploadLogo = subscription ? isProPlan(subscription) : true;

  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isPng = file.type === "image/png";
      const compressed = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
        mimeType: isPng ? "image/png" : "image/jpeg",
        preserveTransparency: isPng
      });
      setLocalCompany(prev => ({ ...prev, logoUrl: compressed.dataUrl }));
    } catch (err) {
      console.warn("Logo sıkıştırma hatası, fallback okunuyor:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setLocalCompany(prev => ({ ...prev, logoUrl: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCompanyLogo = () => {
    setLocalCompany(prev => ({ ...prev, logoUrl: "" }));
  };

  const handleCompanyChange = (field: keyof CompanyProfile, val: any) => {
    setLocalCompany(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    setSaveStatusMsg(null);
    setSavedSuccess(false);

    try {
      // 1. Supabase'e kaydet (saveCompanyProfileToSupabase içinde hemen taze kayıt da okunur)
      const res = await saveCompanyProfileToSupabase(localCompany);
      
      if (!res.success) {
        throw res.error || new Error("Veritabanına kaydedilemedi.");
      }

      // 2. Doğrulama: Dönen güncel veriyi veya doğrudan Supabase'den taze okunmuş veriyi al
      let freshData = res.data;
      if (!freshData) {
        const freshFetch = await fetchCompanyProfileFromSupabase();
        if (freshFetch.data) freshData = freshFetch.data;
      }

      const finalProfile = freshData || localCompany;

      // 3. Ekrandaki formu ve üst component'i hemen yeni veriyle güncelle
      setLocalCompany(finalProfile);
      onSaveCompanyProfile(finalProfile);

      setSavedSuccess(true);
      setSaveStatusMsg({
        type: "success",
        text: "Firma bilgileri veritabanına başarıyla kaydedildi ve güncel veriler senkronize edildi."
      });

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error("Firma bilgileri kaydedilemedi:", err);
      setSaveStatusMsg({
        type: "error",
        text: err?.message ? `Kayıt Hatası: ${err.message}` : "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Kredi İşlemleri
  const handleAddCredits = (amount: number) => {
    const updated: SubscriptionData = {
      ...subscription,
      remainingCredits: subscription.remainingCredits + amount,
      totalCredits: subscription.totalCredits + amount,
      status: "active"
    };
    onUpdateSubscription(updated);
    setCreditNotice(`Tebrikler! Hesabınıza ${amount} sipariş/teklif kredisi başarıyla tanımlandı.`);
    setTimeout(() => setCreditNotice(null), 3500);
  };

  const handleSwitchPlan = (
    planId: "pay_as_you_go" | "pro_monthly" | "pro_yearly" | "unlimited_enterprise", 
    name: string, 
    credits: number
  ) => {
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
    onUpdateSubscription(updated);
    setCreditNotice(`Abonelik paketiniz "${name}" olarak güncellendi!`);
    setTimeout(() => setCreditNotice(null), 3500);
  };

  const usedCredits = Math.max(0, subscription.totalCredits - subscription.remainingCredits);
  const percentageLeft = Math.round((subscription.remainingCredits / Math.max(1, subscription.totalCredits)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className={`w-full max-w-4xl h-[90vh] min-h-[580px] max-h-[860px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
        isDarkMode 
          ? "bg-[#111317] border-[#C5A059]/40 text-neutral-100" 
          : "bg-white border-slate-300 text-slate-900"
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDarkMode ? "bg-[#161920] border-neutral-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isDarkMode 
                ? "bg-[#C5A059]/15 border-[#C5A059]/30 text-[#C5A059]" 
                : "bg-amber-100/80 border-amber-300 text-[#8F6A1E]"
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-black tracking-wider uppercase ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}>
                  HESAP YÖNETİMİ
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  BULUT SENKRON
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Firma kurumsal anteti, iletişim bilgileri ve kredi bakiyesi yönetimi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
            }`}
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Tab Navigation (Firma Bilgileri & Kredi Bilgileri) */}
        <div className={`flex border-b px-6 shrink-0 ${
          isDarkMode ? "bg-[#14171d] border-neutral-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
              activeTab === "company"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#B88E3A] text-[#B88E3A] bg-[#B88E3A]/10")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-white" : "border-transparent text-slate-600 hover:text-slate-900")
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Firma Bilgileri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credits")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
              activeTab === "credits"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#B88E3A] text-[#B88E3A] bg-[#B88E3A]/10")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-white" : "border-transparent text-slate-600 hover:text-slate-900")
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>2. Kredi Bilgileri</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              subscription.remainingCredits < 15
                ? "bg-rose-500/20 text-rose-300"
                : isDarkMode ? "bg-white/10 text-[#C5A059]" : "bg-amber-100 text-[#B88E3A]"
            }`}>
              {subscription.remainingCredits} Kredi
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[440px] space-y-6">
          
          {/* TAB 1: FİRMA BİLGİLERİ */}
          {activeTab === "company" && (
            <div className="space-y-6">
              
              {/* Aktif Kullanıcı Özeti */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                isDarkMode ? "bg-[#161922] border-[#C5A059]/25 shadow-sm" : "bg-amber-50/50 border-amber-200 shadow-sm"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] text-black font-black flex items-center justify-center text-base shadow-md shrink-0">
                    {(activeUser?.fullName || localCompany.companyName || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {activeUser?.fullName || localCompany.companyName || "Atölye Yöneticisi"}
                      </span>
                      <span className="text-xs font-mono text-[#C5A059] font-semibold">
                        @{activeUser?.username || "yonetici"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {activeUser?.role === "admin" ? "Yönetici (Admin)" : "Atölye Sahibi"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-neutral-500" />
                        {activeUser?.email || localCompany.email || "atölye@nakka.com"}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Çevrimiçi Hesap
                      </span>
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode 
                        ? "bg-black/30 border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-400/40" 
                        : "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300"
                    }`}
                    title="Oturumu Kapat"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                )}
              </div>

              {/* Kurumsal Profil Formu */}
              <div className={`border rounded-2xl p-5 md:p-6 space-y-6 shadow-sm transition-all ${
                isDarkMode ? "bg-[#16181b] border-white/10" : "bg-white border-slate-200"
              }`}>
                {/* Header & Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-700/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30" : "bg-[#B88E3A]/10 text-[#B88E3A] border border-[#B88E3A]/20"}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                          FİRMA RESMİ BİLGİLERİ VE BELGE ANTETİ
                        </h3>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                        Teklif dökümlerinde, sipariş fişlerinde ve atölye iş emirlerinde yer alan kurumsal antetiniz
                      </p>
                    </div>
                  </div>

                  <label className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                    localCompany.includeInQuotes
                      ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/50 text-[#C5A059]" : "bg-amber-50 border-amber-300 text-amber-900")
                      : (isDarkMode ? "bg-black/20 border-white/10 text-neutral-400" : "bg-slate-50 border-slate-200 text-slate-500")
                  }`}>
                    <input
                      type="checkbox"
                      checked={localCompany.includeInQuotes}
                      onChange={(e) => handleCompanyChange("includeInQuotes", e.target.checked)}
                      className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                    />
                    <span>Belgelerde Anteti Göster</span>
                  </label>
                </div>

                {/* Logo & Form Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Logo Kutusu */}
                  <div className={`lg:col-span-4 flex flex-col items-center text-center p-5 border rounded-2xl transition-all ${
                    isDarkMode ? "bg-[#111315] border-white/10" : "bg-slate-50/70 border-slate-200"
                  }`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      FİRMA LOGOSU
                    </span>

                    <div className={`w-36 h-36 rounded-2xl border flex items-center justify-center overflow-hidden mb-3.5 relative shadow-inner ${
                      isDarkMode ? "bg-black/40 border-neutral-800" : "bg-white border-slate-200"
                    }`}>
                      {localCompany.logoUrl ? (
                        <img 
                          src={localCompany.logoUrl} 
                          alt="Firma Logosu" 
                          className="w-full h-full object-contain p-2.5 drop-shadow-sm"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-neutral-400">
                          <Building2 className="w-10 h-10 mb-1.5 opacity-30 stroke-1" />
                          <span className="text-[11px] font-medium opacity-60">Logo Eklenmedi</span>
                        </div>
                      )}
                    </div>

                    <p className={`text-[10px] mb-3.5 leading-relaxed ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>
                      PNG, JPG veya SVG formatı önerilir.<br />Şeffaf zeminli logo en temiz çıktıyı sağlar.
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center w-full">
                      <label className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm ${
                        isDarkMode 
                          ? "bg-[#C5A059] text-black hover:bg-[#b08c48] active:scale-95" 
                          : "bg-[#B88E3A] text-white hover:bg-[#9E7728] active:scale-95"
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{localCompany.logoUrl ? "Logoyu Değiştir" : "Logo Yükle"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleCompanyLogoUpload}
                          className="hidden" 
                        />
                      </label>
                      {localCompany.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveCompanyLogo}
                          className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                            isDarkMode 
                              ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/15" 
                              : "border-rose-200 text-rose-600 hover:bg-rose-50"
                          }`}
                          title="Logoyu Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Kaldır</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Girdi Alanları */}
                  <div className="lg:col-span-8 space-y-4 text-xs">
                    {/* Satır 1: İsimler */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className={`block font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Firma / Atölye Adı (Başlık) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={localCompany.companyName}
                            onChange={(e) => handleCompanyChange("companyName", e.target.value)}
                            placeholder="Örn: Sanat Çerçeve Atölyesi"
                            className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                              isDarkMode 
                                ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                                : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Resmi Ticari Ünvan
                        </label>
                        <input
                          type="text"
                          value={localCompany.tradeTitle}
                          onChange={(e) => handleCompanyChange("tradeTitle", e.target.value)}
                          placeholder="Örn: Sanat Çerçevecilik San. ve Tic. Ltd. Şti."
                          className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                                : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Satır 2: İletişim */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className={`flex items-center gap-1.5 font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Telefon *</span>
                        </label>
                        <input
                          type="text"
                          value={localCompany.phone}
                          onChange={(e) => handleCompanyChange("phone", e.target.value)}
                          placeholder="0212 555 01 23"
                          className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                              : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`flex items-center gap-1.5 font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>E-posta *</span>
                        </label>
                        <input
                          type="email"
                          value={localCompany.email}
                          onChange={(e) => handleCompanyChange("email", e.target.value)}
                          placeholder="info@cerceveatolyesi.com"
                          className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                              : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`flex items-center gap-1.5 font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Web Sitesi</span>
                        </label>
                        <input
                          type="text"
                          value={localCompany.website}
                          onChange={(e) => handleCompanyChange("website", e.target.value)}
                          placeholder="www.cerceveci.com"
                          className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                              : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Satır 3: Şehir ve Vergi Bilgileri (3 dengeli kolon) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className={`flex items-center gap-1.5 font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Şehir / İl</span>
                        </label>
                        <input
                          type="text"
                          value={localCompany.city}
                          onChange={(e) => handleCompanyChange("city", e.target.value)}
                          placeholder="İstanbul"
                          className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                              : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`flex items-center gap-1.5 font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          <Receipt className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Vergi Dairesi</span>
                        </label>
                        <input
                          type="text"
                          value={localCompany.taxOffice}
                          onChange={(e) => handleCompanyChange("taxOffice", e.target.value)}
                          placeholder="Örn: Beşiktaş"
                          className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                              : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`flex items-center gap-1.5 font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Vergi Numarası</span>
                        </label>
                        <input
                          type="text"
                          value={localCompany.taxNumber}
                          onChange={(e) => handleCompanyChange("taxNumber", e.target.value)}
                          placeholder="Örn: 1234567890"
                          className={`w-full border rounded-xl px-3 py-2.5 font-mono focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                              : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Satır 4: Açık Adres */}
                    <div>
                      <label className={`block font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Açık Adres (Atölye / Mağaza Konumu)
                      </label>
                      <textarea
                        rows={2}
                        value={localCompany.address}
                        onChange={(e) => handleCompanyChange("address", e.target.value)}
                        placeholder="Örn: Nispetiye Cad. No:14/A Levent, Beşiktaş / İstanbul"
                        className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none resize-none transition-colors ${
                          isDarkMode 
                            ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                            : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                        }`}
                      />
                    </div>

                    {/* Satır 5: Banka & IBAN */}
                    <div>
                      <label className={`flex items-center gap-1.5 font-bold mb-1.5 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        <CreditCard className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Banka &amp; IBAN Bilgisi (Ödemeler ve Havale için)</span>
                      </label>
                      <input
                        type="text"
                        value={localCompany.iban}
                        onChange={(e) => handleCompanyChange("iban", e.target.value)}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        className={`w-full border rounded-xl px-3 py-2.5 font-mono focus:outline-none transition-colors ${
                          isDarkMode 
                            ? "bg-[#111315] border-neutral-700 text-white focus:border-[#C5A059]" 
                            : "bg-slate-50/50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                        }`}
                      />
                    </div>

                  </div>
                </div>

                {/* PDF Canlı Antet Önizlemesi */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      PDF Teklif &amp; Sipariş Belgesi Canlı Antet Önizlemesi
                    </span>
                    <span className="text-[10px] font-medium text-neutral-400">
                      A4 Başlık Formatı
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {localCompany.logoUrl ? (
                        <img 
                          src={localCompany.logoUrl} 
                          alt="Logo Önizleme" 
                          className="h-12 w-auto max-w-[130px] object-contain shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-28 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-mono shrink-0">
                          FİRMA LOGOSU
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm uppercase tracking-wide text-slate-900 truncate">
                          {localCompany.companyName || "FİRMA / ATÖLYE ADI"}
                        </h4>
                        {localCompany.tradeTitle && (
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {localCompany.tradeTitle}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 font-mono mt-1 flex flex-wrap items-center gap-x-2">
                          {localCompany.phone && <span>Tel: {localCompany.phone}</span>}
                          {localCompany.phone && localCompany.email && <span>•</span>}
                          {localCompany.email && <span>{localCompany.email}</span>}
                          {localCompany.website && <span>•</span>}
                          {localCompany.website && <span>{localCompany.website}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2.5 sm:pt-0 w-full sm:w-auto text-[10px] text-slate-500 font-mono shrink-0">
                      <div>{localCompany.city ? `${localCompany.city} / ` : ""}{localCompany.address ? localCompany.address.slice(0, 35) + (localCompany.address.length > 35 ? "..." : "") : "Atölye Adresi"}</div>
                      {localCompany.taxOffice && (
                        <div className="text-[9px] text-slate-400 mt-0.5">V.D: {localCompany.taxOffice} {localCompany.taxNumber ? `- No: ${localCompany.taxNumber}` : ""}</div>
                      )}
                      <div className="text-emerald-700 font-semibold text-[10px] mt-1 flex items-center sm:justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                        <span>Resmi antet çıktısı aktiftir</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geri Bildirim ve Kaydet Butonu */}
                <div className="space-y-3 pt-1">
                  {saveStatusMsg && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      saveStatusMsg.type === "success"
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                        : "bg-rose-500/15 border border-rose-500/40 text-rose-300"
                    }`}>
                      {saveStatusMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="flex-1">{saveStatusMsg.text}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className={`text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Belge antetiniz tüm yazdırma işlemlerinde ve tekliflerde otomatik olarak kullanılır.
                    </span>

                    <button
                      type="button"
                      onClick={handleSaveCompany}
                      disabled={isSaving}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 font-mono font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer ${
                        savedSuccess
                          ? "bg-emerald-600 text-white"
                          : isSaving
                          ? "bg-neutral-600 text-neutral-300 cursor-not-allowed"
                          : (isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black active:scale-95" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white active:scale-95")
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>KAYDEDİLİYOR VE DOĞRULANIYOR...</span>
                        </>
                      ) : savedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>KAYDEDİLDİ VE SENKRONİZE EDİLDİ!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>FİRMA BİLGİLERİNİ KAYDET</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: KREDİ BİLGİLERİ */}
          {activeTab === "credits" && (
            <div className="space-y-6">
              
              {/* Başarı Bildirimi */}
              {creditNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{creditNotice}</span>
                </div>
              )}

              {/* Kredi Bakiye Kartı */}
              <div className={`p-6 rounded-2xl border transition-all ${
                isDarkMode 
                  ? "bg-gradient-to-br from-[#1b1f28] via-[#14171d] to-[#0e1013] border-[#C5A059]/40 shadow-xl" 
                  : "bg-gradient-to-br from-amber-50 via-white to-slate-50 border-amber-300 shadow-md"
              }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C5A059]">
                        MEVCUT KREDİ BAKİYESİ
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {subscription.status === "active" ? "Aktif" : "Süresi Doldu"}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#C5A059]">
                        {subscription.remainingCredits}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-neutral-400">
                        Adet Sipariş / Teklif Kredisi
                      </span>
                    </div>

                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Paketiniz: <strong className={`font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>{subscription.planName}</strong>
                      {subscription.renewalDate && (
                        <span> • Yenileme: <span className="text-[#C5A059] font-mono">{subscription.renewalDate}</span></span>
                      )}
                    </p>
                  </div>

                  {/* Kredi Kullanım Oranı İlerleme Çubuğu */}
                  <div className={`w-full md:w-64 p-4 rounded-xl border ${
                    isDarkMode ? "bg-black/30 border-white/10" : "bg-white border-slate-200"
                  }`}>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className={isDarkMode ? "text-neutral-400" : "text-slate-600"}>Harcanan: {usedCredits}</span>
                      <span className="text-[#C5A059] font-bold">Kalan: %{percentageLeft}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-[#C5A059] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, percentageLeft))}%` }}
                      />
                    </div>
                    <div className={`text-[10px] mt-2 text-center font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-500"}`}>
                      Toplam Yüklenen: {subscription.totalCredits} Kredi
                    </div>
                  </div>

                </div>
              </div>

              {/* Hızlı Kredi Yükleme Paketleri */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C5A059]" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      HIZLI KREDİ YÜKLEME PAKETLERİ
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#C5A059] font-mono">Kredilerin son kullanma tarihi yoktur</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Paket 1: 50 Kredi */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                    isDarkMode ? "bg-[#181b20] border-neutral-700/60" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Başlangıç Paketi</span>
                        <Coins className={`w-4 h-4 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`} />
                      </div>
                      <div className={`text-2xl font-mono font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>+50 KREDİ</div>
                      <div className={`text-xs font-mono mb-4 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>50 Sipariş / Teklif Dökümü</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCredits(50)}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isDarkMode ? "bg-neutral-800 hover:bg-[#C5A059] text-neutral-200 hover:text-black" : "bg-slate-100 hover:bg-[#B88E3A] text-slate-800 hover:text-white"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>₺350 • Yükle</span>
                    </button>
                  </div>

                  {/* Paket 2: 150 Kredi (Popüler) */}
                  <div className={`p-4 rounded-xl border relative flex flex-col justify-between transition-all hover:scale-[1.02] ${
                    isDarkMode ? "bg-[#1f242c] border-[#C5A059] shadow-lg" : "bg-amber-50/70 border-amber-400 shadow-md"
                  }`}>
                    <div className="absolute -top-2.5 right-4 bg-[#C5A059] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                      EN ÇOK TERCİH EDİLEN
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[#C5A059]">Atölye Paketi</span>
                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <div className={`text-2xl font-mono font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>+150 KREDİ</div>
                      <div className={`text-xs font-mono mb-4 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>150 Sipariş &amp; HD Görsel</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCredits(150)}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#C5A059] hover:bg-[#b08c48] text-black shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>₺850 • Yükle</span>
                    </button>
                  </div>

                  {/* Paket 3: 500 Kredi */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                    isDarkMode ? "bg-[#181b20] border-neutral-700/60" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Büyük Atölye</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className={`text-2xl font-mono font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>+500 KREDİ</div>
                      <div className={`text-xs font-mono mb-4 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>Süper Avantajlı Birim Fiyat</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCredits(500)}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isDarkMode ? "bg-neutral-800 hover:bg-[#C5A059] text-neutral-200 hover:text-black" : "bg-slate-100 hover:bg-[#B88E3A] text-slate-800 hover:text-white"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>₺2.200 • Yükle</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Kredi Kullanım ve Bilgilendirme Kılavuzu */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                isDarkMode ? "bg-black/20 border-white/10 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <h4 className="font-bold text-[#C5A059] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> Kredi Kullanım Kuralları:
                </h4>
                <ul className={`list-disc list-inside space-y-1 text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                  <li>Her tamamlanan sipariş arşivi, HD müşteri görseli ve PDF teklif dökümü 1 kredi düşürür.</li>
                  <li>Yüklenen kredilerin kullanım süresi sınırı yoktur; hesabınızda süresiz olarak kalır.</li>
                  <li>Krediniz tükendiğinde hesap kilitlenmez, sadece yeni teklif yazdırma işleminde kredi yükleme uyarısı verilir.</li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t shrink-0 ${
          isDarkMode ? "bg-[#161920] border-neutral-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`text-xs flex items-center gap-2 font-medium ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
            <Coins className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <span>Kalan Bakiye: <strong className={`font-mono font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{subscription.remainingCredits} Kredi</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
              isDarkMode ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-900"
            }`}
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
