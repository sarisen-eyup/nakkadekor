import React, { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  Upload, 
  Check, 
  Lock, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Coins, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck,
  Building,
  ArrowRight
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
  saveCompanyProfileToSupabase 
} from "../services/supabaseService";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  users?: UserAccount[];
  onSaveUsers?: (users: UserAccount[]) => void;
  activeUser?: UserAccount;
  onSetActiveUser?: (user: UserAccount) => void;
  subscription?: SubscriptionData;
  onOpenSubscriptionModal?: () => void;
  onLogout?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  companyProfile,
  onSaveCompanyProfile,
  activeUser,
  subscription,
  onOpenSubscriptionModal,
  onLogout
}) => {
  const [localCompany, setLocalCompany] = useState<CompanyProfile>(companyProfile || EMPTY_COMPANY_PROFILE);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal açıldığında hem prop'tan hem de doğrudan Supabase'den verileri güncelle
  useEffect(() => {
    if (isOpen) {
      setSavedSuccess(false);
      if (companyProfile) {
        setLocalCompany(companyProfile);
      }
      // Supabase'den en güncel profil verisini yükle
      fetchCompanyProfileFromSupabase()
        .then(({ data }) => {
          if (data && Object.keys(data).length > 0) {
            setLocalCompany(data);
          }
        })
        .catch(err => {
          console.warn("Supabase firma profili okunurken hata:", err);
        });
    }
  }, [isOpen, companyProfile]);

  if (!isOpen) return null;

  // Pro Plan / Kredi Hesabı Kontrolü
  const canUploadLogo = subscription ? isProPlan(subscription) : true;

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadLogo && onOpenSubscriptionModal) {
      onOpenSubscriptionModal();
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLocalCompany(prev => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCompanyLogo = () => {
    setLocalCompany(prev => ({ ...prev, logoUrl: "" }));
  };

  const handleCompanyChange = (field: keyof CompanyProfile, val: any) => {
    setLocalCompany(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Üst state'i ve LocalStorage'ı güncelle
      onSaveCompanyProfile(localCompany);
      // 2. Supabase bulut veritabanına kalıcı olarak kaydet
      await saveCompanyProfileToSupabase(localCompany);
    } catch (err) {
      console.warn("Firma profili kaydedilirken hata:", err);
    } finally {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    }
  };

  const userInitial = (activeUser?.fullName || activeUser?.username || "Y").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className={`w-full max-w-4xl h-[88vh] min-h-[580px] max-h-[840px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isDarkMode 
          ? "bg-[#111317] border-[#C5A059]/40 text-neutral-100" 
          : "bg-white border-slate-300 text-slate-900"
      }`}>
        
        {/* Üst Başlık (Modal Header) */}
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
                  HESAP &amp; WHITE-LABEL
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  BULUT SENKRON
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Kullanıcı hesabı, şirket anteti, logo ve resmi PDF/sipariş döküm ayarları
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

        {/* Kaydırılabilir Gövde */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[460px] space-y-6">
          
          {/* 1. BÖLÜM: HESAP VE ABONELİK BİLGİLERİ */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            isDarkMode 
              ? "bg-[#161922] border-[#C5A059]/25 shadow-sm" 
              : "bg-amber-50/50 border-amber-200 shadow-sm"
          }`}>
            {/* Kullanıcı Profili */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] text-black font-black flex items-center justify-center text-base shadow-md shrink-0">
                {userInitial}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {activeUser?.fullName || "Yönetici Kullanıcı"}
                  </span>
                  <span className="text-xs font-mono text-[#C5A059] font-semibold">
                    @{activeUser?.username || "yonetici"}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {activeUser?.role === "admin" ? "Yönetici (Admin)" : "Atölye"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    {activeUser?.email || "yonetici@nakka.com"}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Çevrimiçi Hesap
                  </span>
                </div>
              </div>
            </div>

            {/* Kredi / Paket & Çıkış Aksiyonları */}
            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
              {subscription && (
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
                  isDarkMode ? "bg-black/30 border-white/10 text-neutral-300" : "bg-white border-slate-200 text-slate-700"
                }`}>
                  <Coins className="w-4 h-4 text-[#C5A059]" />
                  <span>
                    {subscription.remainingCredits} <span className="text-[10px] font-normal text-neutral-400">KREDİ</span>
                  </span>
                </div>
              )}

              {onOpenSubscriptionModal && (
                <button
                  type="button"
                  onClick={onOpenSubscriptionModal}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDarkMode 
                      ? "bg-[#C5A059]/15 border-[#C5A059]/40 hover:bg-[#C5A059]/25 text-[#FAE2B3]" 
                      : "bg-amber-100 border-amber-300 hover:bg-amber-200 text-[#8F6A1E]"
                  }`}
                  title="Abonelik ve Kredi Yönetimi"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Paketler</span>
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-black/30 border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-400/40" 
                      : "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300"
                  }`}
                  title="Oturumu Kapat (Giriş Ekranına Dön)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. BÖLÜM: FİRMA PROFİLİ & WHITE-LABEL ÖZELLEŞTİRME */}
          <div className={`border rounded-xl p-5 space-y-5 ${
            isDarkMode ? "bg-[#181b20] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-neutral-700/40">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/20 text-[#B88E3A]"}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    FİRMA PROFİLİ &amp; WHITE-LABEL ÖZELLEŞTİRME
                  </h3>
                  <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    PDF teklif dökümlerinde ve sipariş formlarında basılacak şirket logonuz ve bilgileriniz
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={localCompany.includeInQuotes}
                  onChange={(e) => handleCompanyChange("includeInQuotes", e.target.checked)}
                  className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                />
                <span className={isDarkMode ? "text-neutral-300" : "text-slate-700"}>
                  Tekliflerde Göster
                </span>
              </label>
            </div>

            {/* Logo & Form Alanları Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Logo Kutusu (4 kolon) */}
              <div className={`md:col-span-4 flex flex-col items-center text-center p-4 border rounded-xl transition-all ${
                canUploadLogo 
                  ? "bg-black/20 border-dashed border-neutral-700" 
                  : (isDarkMode ? "bg-amber-950/10 border-amber-500/30" : "bg-amber-50/60 border-amber-400/40")
              }`}>
                {canUploadLogo ? (
                  <>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                        FİRMA LOGOSU
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        PRO AKTİF
                      </span>
                    </div>

                    <div className="w-36 h-36 rounded-xl border flex items-center justify-center overflow-hidden mb-3 bg-neutral-900/60 border-neutral-700 relative group">
                      {localCompany.logoUrl ? (
                        <img 
                          src={localCompany.logoUrl} 
                          alt="Firma Logosu" 
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-neutral-500">
                          <Building2 className="w-10 h-10 mb-1 opacity-40" />
                          <span className="text-[11px]">Logo Yüklenmedi</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center w-full">
                      <label className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm ${
                        isDarkMode ? "bg-[#C5A059] text-black hover:bg-[#b08c48]" : "bg-[#B88E3A] text-white hover:bg-[#9E7728]"
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{localCompany.logoUrl ? "Logoyu Değiştir" : "Logo Yükle (PNG/JPG)"}</span>
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
                          className="px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-2">
                      Şeffaf PNG veya kare/yatay logo önerilir (Maks 2MB)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-2 text-amber-400">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        FİRMA LOGOSU
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        PRO ÖZELLİK
                      </span>
                    </div>

                    <div className="w-36 h-36 rounded-xl border flex flex-col items-center justify-center overflow-hidden mb-3 bg-black/40 border-amber-500/30 p-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 mb-2 border border-amber-500/30">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-amber-300">KONTÖRLÜ HESAP</span>
                      <span className="text-[9px] text-neutral-400 mt-1 leading-tight">
                        Logo yükleme özelliği kilitlidir
                      </span>
                    </div>

                    <div className="w-full space-y-2.5">
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/90 text-center leading-relaxed">
                        Teklif ve dökümlere kendi logonuzu eklemek için <strong>Pro Abonelik</strong> gereklidir.
                      </div>

                      {onOpenSubscriptionModal && (
                        <button
                          type="button"
                          onClick={onOpenSubscriptionModal}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#C5A059] text-black hover:bg-[#b08c48] cursor-pointer transition-all shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pro Pakete Yükselt</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Kurumsal Bilgi Alanları (8 kolon) */}
              <div className="md:col-span-8 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Firma Adı */}
                  <div>
                    <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Firma / Atölye Adı (PDF Başlığı) *
                    </label>
                    <input
                      type="text"
                      value={localCompany.companyName}
                      onChange={(e) => handleCompanyChange("companyName", e.target.value)}
                      placeholder="Örn: Nakka Decor & Sanat"
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                    />
                  </div>

                  {/* Ticari Ünvan */}
                  <div>
                    <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Resmi Ticari Ünvan
                    </label>
                    <input
                      type="text"
                      value={localCompany.tradeTitle}
                      onChange={(e) => handleCompanyChange("tradeTitle", e.target.value)}
                      placeholder="Örn: Nakka Çerçeve Sanat Tic. Ltd. Şti."
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Telefon */}
                  <div>
                    <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Telefon (PDF İletişim Bilgisi) *
                    </label>
                    <input
                      type="text"
                      value={localCompany.phone}
                      onChange={(e) => handleCompanyChange("phone", e.target.value)}
                      placeholder="Örn: 0212 555 01 23 / 0532 ..."
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                    />
                  </div>

                  {/* Kurumsal E-posta */}
                  <div>
                    <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Kurumsal E-posta
                    </label>
                    <input
                      type="email"
                      value={localCompany.email}
                      onChange={(e) => handleCompanyChange("email", e.target.value)}
                      placeholder="info@nakkadecor.com"
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                    />
                  </div>
                </div>

                {/* Açık Adres */}
                <div>
                  <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                    Atölye / Mağaza Adresi (PDF Alt Bilgisi) *
                  </label>
                  <textarea
                    rows={2}
                    value={localCompany.address}
                    onChange={(e) => handleCompanyChange("address", e.target.value)}
                    placeholder="Örn: Sanatkarlar Cad. No:14 Kadıköy / İstanbul"
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none resize-none transition-colors ${
                      isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vergi Dairesi & No */}
                  <div>
                    <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Vergi Dairesi &amp; No
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={localCompany.taxOffice}
                        onChange={(e) => handleCompanyChange("taxOffice", e.target.value)}
                        placeholder="Kadıköy V.D."
                        className={`w-1/2 border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <input
                        type="text"
                        value={localCompany.taxNumber}
                        onChange={(e) => handleCompanyChange("taxNumber", e.target.value)}
                        placeholder="1234567890"
                        className={`w-1/2 border rounded-lg px-3 py-2 focus:outline-none font-mono transition-colors ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Ödeme / IBAN */}
                  <div>
                    <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Ödeme / Banka IBAN
                    </label>
                    <input
                      type="text"
                      value={localCompany.iban}
                      onChange={(e) => handleCompanyChange("iban", e.target.value)}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none font-mono transition-colors ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BÖLÜM: CANLI KURUMSAL PDF & SİPARİŞ ANTETİ ÖNİZLEMESİ */}
            <div className="mt-4 pt-4 border-t border-neutral-700/30">
              <span className="block text-[11px] font-mono uppercase font-bold tracking-wider mb-2 text-[#C5A059]">
                CANLI KURUMSAL PDF &amp; SİPARİŞ ANTETİ ÖNİZLEMESİ
              </span>

              <div className="p-4 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {localCompany.logoUrl ? (
                    <img 
                      src={localCompany.logoUrl} 
                      alt="Firma Logosu" 
                      className="w-12 h-12 object-contain border border-slate-200 rounded p-1 bg-slate-50 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      {localCompany.companyName || "FİRMA / ATÖLYE ADI"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {localCompany.tradeTitle || "Resmi Ticari Ünvan"}
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                      {localCompany.phone ? `Tel: ${localCompany.phone}` : ""}{localCompany.phone && localCompany.email ? " • " : ""}{localCompany.email || ""}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto text-[10px] text-slate-500 font-mono">
                  <div>Adres: {localCompany.address ? localCompany.address.slice(0, 40) + "..." : "Atölye Adresi"}</div>
                  <div className="text-emerald-600 font-bold mt-0.5 flex items-center gap-1 justify-start sm:justify-end">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PDF Çıktısında Bu Başlık Basılacaktır</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Alt Butonlar (Footer Actions) */}
        <div className={`flex items-center justify-between px-6 py-4 border-t shrink-0 ${
          isDarkMode ? "bg-[#161920] border-neutral-800" : "bg-slate-50 border-slate-200"
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-xs font-mono rounded-xl border transition-colors cursor-pointer ${
              isDarkMode 
                ? "border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300" 
                : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
            }`}
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 font-mono font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer active:scale-95 ${
              savedSuccess
                ? "bg-emerald-600 text-white"
                : (isDarkMode 
                    ? "bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] hover:from-white hover:to-[#E5C17B] text-black" 
                    : "bg-[#B88E3A] hover:bg-[#9E7728] text-white")
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>KAYDEDİLDİ!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isSaving ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
