import React, { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  Upload, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  Send, 
  Check, 
  Trash2, 
  Save, 
  ShieldCheck,
  Globe,
  MapPin,
  CreditCard,
  UserCheck,
  Lock,
  Sparkles
} from "lucide-react";
import { 
  CompanyProfile, 
  UserAccount, 
  UserRole, 
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
  users: UserAccount[];
  onSaveUsers: (users: UserAccount[]) => void;
  activeUser: UserAccount;
  onSetActiveUser: (user: UserAccount) => void;
  subscription: SubscriptionData;
  onOpenSubscriptionModal: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  companyProfile,
  onSaveCompanyProfile,
  users,
  onSaveUsers,
  activeUser,
  onSetActiveUser,
  subscription,
  onOpenSubscriptionModal
}) => {
  const [localCompany, setLocalCompany] = useState<CompanyProfile>(companyProfile || EMPTY_COMPANY_PROFILE);
  const [localUsers, setLocalUsers] = useState<UserAccount[]>(users);
  const [activeUserAccount, setActiveUserAccount] = useState<UserAccount>(activeUser);
  const [emailActionNotice, setEmailActionNotice] = useState<string | null>(null);
  const [simulatedEmailSent, setSimulatedEmailSent] = useState<UserAccount | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // User limit calculations based on subscription tier
  const maxAllowedUsers = subscription?.isMonthlySubscription ? 6 : 3;
  const isCreditAccount = !subscription?.isMonthlySubscription;
  const isLimitReached = localUsers.length >= maxAllowedUsers;

  const [newUserForm, setNewUserForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    role: "sales" as UserRole
  });

  // Modal açıldığında verileri doğrudan Supabase'den giriş yapan kullanıcının ID'siyle çek
  useEffect(() => {
    if (isOpen) {
      setLocalUsers(users);
      setActiveUserAccount(activeUser);
      setEmailActionNotice(null);
      setSimulatedEmailSent(null);
      setSaveToast(false);

      // Doğrudan Supabase'den çek
      setIsLoadingCompany(true);
      fetchCompanyProfileFromSupabase()
        .then(({ data }) => {
          if (data) {
            setLocalCompany(data);
          } else {
            // Eğer yeni bir kullanıcıysa ve veritabanında henüz bir firma kaydı yoksa, form BOMBOŞ gelsin
            setLocalCompany(EMPTY_COMPANY_PROFILE);
          }
        })
        .catch(err => {
          console.warn("Firma profili Supabase'den yüklenirken uyarı:", err);
          setLocalCompany(companyProfile || EMPTY_COMPANY_PROFILE);
        })
        .finally(() => {
          setIsLoadingCompany(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Company logo upload handler
  const canUploadLogo = isProPlan(subscription);

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadLogo) {
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

  // User management handlers
  const handleSendVerificationEmail = (user: UserAccount) => {
    const updatedUsers = localUsers.map(u => 
      u.id === user.id ? { ...u, verificationSentAt: "Az önce gönderildi" } : u
    );
    setLocalUsers(updatedUsers);
    setSimulatedEmailSent(user);
    setEmailActionNotice(`Doğrulama ve üyelik aktivasyon e-postası "${user.email}" adresine iletildi.`);
    setTimeout(() => setEmailActionNotice(null), 5000);
  };

  const handleConfirmEmailVerification = (userId: string) => {
    const updatedUsers = localUsers.map(u => 
      u.id === userId 
        ? { ...u, isEmailVerified: true, status: "active" as const, verificationSentAt: undefined } 
        : u
    );
    setLocalUsers(updatedUsers);
    setSimulatedEmailSent(null);
    setEmailActionNotice("E-posta adresi başarıyla onaylandı! Üyelik aktif edildi.");
    setTimeout(() => setEmailActionNotice(null), 4000);
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName.trim() || !newUserForm.email.trim()) return;

    // Strict User Limit Check
    if (localUsers.length >= maxAllowedUsers) {
      if (isCreditAccount) {
        setEmailActionNotice("Kredili hesaplarda en fazla 3 kullanıcı tanımlanabilir. 3'ten fazla personel için kredili hesap yerine Aylık Premium Abonelik sistemine geçilmesi zorunludur.");
      } else {
        setEmailActionNotice("Aylık abonelik seçeneğinde en fazla 6 personel üye kaydı yapılabilir.");
      }
      return;
    }
    
    const newUsername = newUserForm.username.trim() || newUserForm.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const created: UserAccount = {
      id: `usr_${Date.now()}`,
      fullName: newUserForm.fullName.trim(),
      username: newUsername,
      email: newUserForm.email.trim(),
      phone: newUserForm.phone.trim() || undefined,
      role: newUserForm.role,
      isEmailVerified: false,
      status: "pending_verification",
      createdAt: new Date().toISOString().split("T")[0],
      verificationSentAt: "Aktivasyon bağlantısı gönderildi"
    };

    const nextList = [...localUsers, created];
    setLocalUsers(nextList);
    setSimulatedEmailSent(created);
    setEmailActionNotice(`Davet e-postası hazırlandı ve ${created.email} adresine gönderildi.`);
    setTimeout(() => setEmailActionNotice(null), 5000);

    setNewUserForm({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      role: "sales"
    });
  };

  const handleDeleteUser = (userId: string) => {
    setLocalUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (activeUserAccount.id === userId) {
      setActiveUserAccount(prev => ({ ...prev, role: newRole }));
    }
  };

  const handleSaveAll = async () => {
    setIsSavingCompany(true);
    try {
      await saveCompanyProfileToSupabase(localCompany);
    } catch (err) {
      console.warn("Supabase firma profili kaydetme hatası:", err);
    } finally {
      setIsSavingCompany(false);
    }
    onSaveCompanyProfile(localCompany);
    onSaveUsers(localUsers);
    onSetActiveUser(activeUserAccount);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-5xl h-[85vh] min-h-[580px] max-h-[840px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isDarkMode 
          ? "bg-[#111317] border-[#C5A059]/40 text-neutral-100" 
          : "bg-white border-slate-300 text-slate-900"
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDarkMode ? "bg-[#14171d] border-neutral-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/20 text-[#B88E3A]"
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-wider uppercase flex items-center gap-2">
                HESAP & FİRMA YÖNETİMİ
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ONLİNE BULUT SİSTEMİ
                </span>
              </h2>
              <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Kurumsal firma anteti & logo ayarları ile e-posta onaylı personel/üye hesap ataması
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
            }`}
            title="Pencereyi Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[480px] space-y-6">
          {/* Notification Banner */}
          {emailActionNotice && (
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{emailActionNotice}</span>
            </div>
          )}

          {/* 1. SECTION: FIRMA & KURUMSAL BİLGİLER */}
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
                    FİRMA PROFİLİ & KURUMSAL BİLGİLER
                  </h3>
                  <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    Teklif dökümlerinde, sipariş formunda ve PDF çıktılarında görünecek resmi antet ve logo
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

            {/* Logo & Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Logo Upload Box (4 cols) */}
              <div className={`md:col-span-4 flex flex-col items-center text-center p-4 border rounded-lg transition-all ${
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
                        PRO
                      </span>
                    </div>

                    <div className="w-32 h-32 rounded-lg border flex items-center justify-center overflow-hidden mb-3 bg-neutral-900/60 border-neutral-700 relative group">
                      {localCompany.logoUrl ? (
                        <img 
                          src={localCompany.logoUrl} 
                          alt="Firma Logosu" 
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-neutral-500">
                          <Building2 className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[10px]">Logo Yok</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center w-full">
                      <label className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                        isDarkMode ? "bg-[#C5A059] text-black hover:bg-[#b08c48]" : "bg-[#B88E3A] text-white hover:bg-[#9E7728]"
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{localCompany.logoUrl ? "Değiştir" : "Logo Yükle"}</span>
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
                          className="px-2.5 py-1.5 rounded text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-2">PNG (şeffaf) veya JPG (Maks. 2MB)</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 mb-2 text-amber-400">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        FİRMA LOGOSU
                      </span>
                    </div>

                    <div className="w-32 h-32 rounded-lg border flex flex-col items-center justify-center overflow-hidden mb-3 bg-black/40 border-amber-500/30 p-2 text-center">
                      <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 mb-1.5 border border-amber-500/30">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-300">KREDİLİ HESAP</span>
                      <span className="text-[8px] text-neutral-400 mt-0.5 leading-tight">
                        Logo yükleme kilitli
                      </span>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-200/90 text-center leading-relaxed">
                        Logo eklemek için <strong>Pro Abonelik</strong> (Aylık/Yıllık) gereklidir.
                      </div>

                      <button
                        type="button"
                        onClick={onOpenSubscriptionModal}
                        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold bg-[#C5A059] text-black hover:bg-[#b08c48] cursor-pointer transition-all shadow-sm shadow-[#C5A059]/20"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Pro Pakete Geç</span>
                      </button>

                      {localCompany.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveCompanyLogo}
                          className="text-[9px] text-neutral-400 hover:text-rose-400 underline transition-colors cursor-pointer"
                        >
                          Kayıtlı Eski Logoyu Kaldır
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Form fields (8 cols) */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Firma Kısa İsmi / Marka
                  </label>
                  <input
                    type="text"
                    value={localCompany.companyName}
                    onChange={(e) => handleCompanyChange("companyName", e.target.value)}
                    placeholder="Örn: Atölye / Marka Adınız"
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Resmi Ticari Ünvan
                  </label>
                  <input
                    type="text"
                    value={localCompany.tradeTitle}
                    onChange={(e) => handleCompanyChange("tradeTitle", e.target.value)}
                    placeholder="Örn: Çerçeve Sanat Tic. Ltd. Şti."
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={localCompany.taxOffice}
                    onChange={(e) => handleCompanyChange("taxOffice", e.target.value)}
                    placeholder="Örn: Vergi Dairesi"
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Vergi No / TCKN
                  </label>
                  <input
                    type="text"
                    value={localCompany.taxNumber}
                    onChange={(e) => handleCompanyChange("taxNumber", e.target.value)}
                    placeholder="Örn: 1234567890"
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Kurumsal Telefon
                  </label>
                  <input
                    type="text"
                    value={localCompany.phone}
                    onChange={(e) => handleCompanyChange("phone", e.target.value)}
                    placeholder="Örn: 0532 ... / 0212 ..."
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Kurumsal E-posta
                  </label>
                  <input
                    type="email"
                    value={localCompany.email}
                    onChange={(e) => handleCompanyChange("email", e.target.value)}
                    placeholder="ornek@firma.com"
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Web Sitesi
                  </label>
                  <input
                    type="text"
                    value={localCompany.website}
                    onChange={(e) => handleCompanyChange("website", e.target.value)}
                    placeholder="www.firmaniz.com"
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Şehir / İlçe
                  </label>
                  <input
                    type="text"
                    value={localCompany.city}
                    onChange={(e) => handleCompanyChange("city", e.target.value)}
                    placeholder="İl / İlçe"
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Atölye / Mağaza Açık Adresi
                  </label>
                  <input
                    type="text"
                    value={localCompany.address}
                    onChange={(e) => handleCompanyChange("address", e.target.value)}
                    placeholder="Atölye açık adresi..."
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-medium ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Banka & IBAN Numarası (Teklif dökümlerinde gösterilir)
                  </label>
                  <input
                    type="text"
                    value={localCompany.iban}
                    onChange={(e) => handleCompanyChange("iban", e.target.value)}
                    placeholder="TR..."
                    className={`w-full px-3 py-2 text-xs rounded border outline-none font-mono ${
                      isDarkMode ? "bg-neutral-900 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. SECTION: KULLANICI ROLLERİ & ÇEVRİMİÇİ ÜYELİK SİSTEMİ */}
          <div className={`border rounded-xl p-5 space-y-5 ${
            isDarkMode ? "bg-[#181b20] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-neutral-700/40">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/20 text-[#B88E3A]"}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    KULLANICI ROLLERİ & E-POSTA ONAYLI ÜYELİK SİSTEMİ
                  </h3>
                  <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    Çok kullanıcılı online giriş altyapısı, e-posta doğrulama ve rol yetkilendirmesi
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 self-start sm:self-auto">
                ONLİNE BULUT DESTEĞİ
              </span>
            </div>

            {/* Active Session Card */}
            <div className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDarkMode ? "bg-neutral-900/80 border-neutral-700" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C5A059] to-amber-200 text-black font-bold flex items-center justify-center text-sm shadow-md">
                  {activeUserAccount.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{activeUserAccount.fullName}</span>
                    <span className="text-[10px] font-mono text-neutral-400">(@{activeUserAccount.username})</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      {activeUserAccount.role === "admin" ? "Yönetici (Admin)" : activeUserAccount.role === "sales" ? "Satış" : "Atölye"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span>{activeUserAccount.email}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> E-posta Onaylı Hesap
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-neutral-400 text-right">
                Aktif Oturum • Son Giriş: {activeUserAccount.lastLoginAt || "Şimdi"}
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    SİSTEMDE KAYITLI PERSONEL & ÜYELER ({localUsers.length} / {maxAllowedUsers})
                  </h4>
                  {isCreditAccount ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isLimitReached 
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}>
                      {isLimitReached ? "Kredili Hesap: Kota Doldu (3/3)" : "Kredili Hesap: Maks. 3 Personel"}
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isLimitReached 
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" 
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}>
                      {isLimitReached ? "Aylık Abonelik: Kota Doldu (6/6)" : "Aylık Abonelik: Maks. 6 Personel"}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-500">
                  Üyeler e-posta onayı tamamlandığında yetkilerini kullanabilir
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden border-neutral-700/60 divide-y divide-neutral-700/40">
                {localUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isDarkMode ? "bg-neutral-900/50 hover:bg-neutral-900" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        user.role === "admin" 
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                          : user.role === "sales" 
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}>
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold">{user.fullName}</span>
                          <span className="text-[10px] font-mono text-neutral-400">@{user.username}</span>
                          {user.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" /> E-posta Onaylandı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertCircle className="w-2.5 h-2.5" /> Onay Bekliyor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-neutral-500" /> {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-neutral-500" /> {user.phone}
                            </span>
                          )}
                          {user.verificationSentAt && !user.isEmailVerified && (
                            <span className="text-amber-400/80 italic text-[10px]">
                              ({user.verificationSentAt})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Role Selector */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeUserRole(user.id, e.target.value as UserRole)}
                        className={`px-2.5 py-1 text-xs rounded border font-mono outline-none cursor-pointer ${
                          isDarkMode ? "bg-neutral-800 border-neutral-700 text-white" : "bg-slate-100 border-slate-300 text-slate-800"
                        }`}
                      >
                        <option value="admin">Yönetici (Admin)</option>
                        <option value="sales">Satış Danışmanı</option>
                        <option value="workshop">Atölye Ustası</option>
                      </select>

                      {!user.isEmailVerified && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSendVerificationEmail(user)}
                            title="Doğrulama E-postası Gönder"
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> E-posta Gönder
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmEmailVerification(user.id)}
                            title="E-postayı Şimdi Doğrula (Hızlı Test)"
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Doğrula
                          </button>
                        </>
                      )}

                      {localUsers.length > 1 && user.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quota Exceeded Alert / Upgrade Card */}
            {isCreditAccount && isLimitReached && (
              <div className="p-4 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs font-black uppercase tracking-wider text-amber-300">
                        KULLANICI KOTASI DOLDU (3 / 3 PERSONEL)
                      </h5>
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/30 text-amber-200">
                        KREDİLİ HESAP LİMİTİ
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                      Sisteme kredili hesapta en fazla <strong>3 personel</strong> tanımlanabilir. 3'ten fazla kullanıcı için kredili hesap yerine <strong>Aylık Premium Abonelik</strong> sistemine geçilmesi zorunludur. Aylık abonelik seçeneğinde <strong>en fazla 6 personel</strong> üye kaydı yapılabilir.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenSubscriptionModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#E5C17B] hover:from-[#b08c48] hover:to-[#C5A059] text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all hover:scale-[1.02] border border-amber-300/40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Aylık Aboneliğe Geç (6 Personel)</span>
                </button>
              </div>
            )}

            {!isCreditAccount && isLimitReached && (
              <div className="p-4 rounded-xl border border-purple-500/50 bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs font-black uppercase tracking-wider text-purple-300">
                        AYLIK ABONELİK MAKSİMUM KOTASINA ULAŞILDI (6 / 6)
                      </h5>
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200">
                        TAM KAPASİTE
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                      Aylık abonelik paketinde maksimum <strong>6 personel</strong> üye kaydı yapılabilir. Yeni bir personel tanımlamak için lütfen mevcut listedeki personellerden birini siliniz.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add New User Invitation Form */}
            <form onSubmit={handleAddNewUser} className={`p-4 rounded-xl border space-y-3 transition-opacity ${
              isLimitReached ? "opacity-85" : "opacity-100"
            } ${
              isDarkMode ? "bg-neutral-900/60 border-neutral-700/80" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
                  <h5 className="text-xs font-bold uppercase tracking-wider">
                    YENİ PERSONEL / ÜYE DAVET ET (E-POSTA İLE)
                  </h5>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  Kalan Kontenjan: <strong className={isLimitReached ? "text-rose-400" : "text-emerald-400"}>{Math.max(0, maxAllowedUsers - localUsers.length)}</strong> / {maxAllowedUsers}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLimitReached}
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Örn: Ayşe Kaya"
                    className={`w-full px-3 py-1.5 text-xs rounded border outline-none ${
                      isLimitReached ? "opacity-60 cursor-not-allowed" : ""
                    } ${
                      isDarkMode ? "bg-neutral-800 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    disabled={isLimitReached}
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Örn: ayse.kaya"
                    className={`w-full px-3 py-1.5 text-xs rounded border outline-none ${
                      isLimitReached ? "opacity-60 cursor-not-allowed" : ""
                    } ${
                      isDarkMode ? "bg-neutral-800 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isLimitReached}
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ayse@vizyonart.com"
                    className={`w-full px-3 py-1.5 text-xs rounded border outline-none ${
                      isLimitReached ? "opacity-60 cursor-not-allowed" : ""
                    } ${
                      isDarkMode ? "bg-neutral-800 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Yetki Rolü
                  </label>
                  <select
                    disabled={isLimitReached}
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className={`w-full px-3 py-1.5 text-xs rounded border outline-none font-mono ${
                      isLimitReached ? "opacity-60 cursor-not-allowed" : ""
                    } ${
                      isDarkMode ? "bg-neutral-800 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                    }`}
                  >
                    <option value="sales">Satış Danışmanı (Müşteri Modu)</option>
                    <option value="workshop">Atölye Ustası (İmalat / Kesim)</option>
                    <option value="admin">Yönetici (Tam Yetkili)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-neutral-500">
                  {isCreditAccount && isLimitReached ? (
                    <span className="text-amber-400 font-semibold">
                      * Kredili hesapta en fazla 3 kullanıcı tanımlanabilir. 3'ten fazla için Aylık Abonelik zorunludur.
                    </span>
                  ) : !isCreditAccount && isLimitReached ? (
                    <span className="text-purple-400 font-semibold">
                      * Aylık abonelik seçeneğinde en fazla 6 personel tanımlanabilir. Kota dolmuştur.
                    </span>
                  ) : (
                    <span>
                      * Kaydedildiğinde kullanıcıya sistem aktivasyonu ve şifre belirleme bağlantısı içeren onay e-postası gönderilir.
                    </span>
                  )}
                </p>

                {isCreditAccount && isLimitReached ? (
                  <button
                    type="button"
                    onClick={onOpenSubscriptionModal}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 cursor-pointer shadow-md transition-all shrink-0"
                    title="Aylık aboneliğe geçerek 6 personele kadar kullanıcı ekleyin"
                  >
                    <Lock className="w-3.5 h-3.5" /> 3 Kullanıcı Sınırı (Aylık Aboneliğe Geçin)
                  </button>
                ) : !isCreditAccount && isLimitReached ? (
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5" /> Maksimum 6 Personel Kotası Doldu
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                      isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" /> DAVET ET ({maxAllowedUsers - localUsers.length} Kontenjan)
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Simulated Email Verification Modal / Dialog */}
          {simulatedEmailSent && (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
                  <Mail className="w-4 h-4" />
                  GÖNDERİLEN ONAY E-POSTASI ÖNİZLEMESİ
                </div>
                <button
                  type="button"
                  onClick={() => setSimulatedEmailSent(null)}
                  className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>
              <div className={`p-4 rounded-lg border text-xs space-y-2 font-mono ${
                isDarkMode ? "bg-neutral-900 border-neutral-700 text-neutral-300" : "bg-white border-slate-300 text-slate-800"
              }`}>
                <div className="border-b pb-2 border-neutral-700/50">
                  <div><strong>Kime:</strong> {simulatedEmailSent.fullName} &lt;{simulatedEmailSent.email}&gt;</div>
                  <div><strong>Konu:</strong> {localCompany.companyName || "Atölye Sistemi"} - Üyelik ve E-posta Onayı</div>
                </div>
                <p className="text-xs">
                  Merhaba <strong>{simulatedEmailSent.fullName}</strong>,<br />
                  <strong>{localCompany.tradeTitle || localCompany.companyName || "Atölyemiz"}</strong> bünyesinde <strong>{simulatedEmailSent.role === "admin" ? "Yönetici" : simulatedEmailSent.role === "sales" ? "Satış Danışmanı" : "Atölye Ustası"}</strong> yetkisiyle sisteme davet edildiniz.
                  Hesabınızı etkinleştirmek ve kullanıcı adınızla giriş yapmak için lütfen aşağıdaki butona tıklayarak e-posta adresinizi onaylayın:
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmEmailVerification(simulatedEmailSent.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> [Simüle Link]: E-Postamı Onayla ve Üyeliğimi Başlat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between px-6 py-4 border-t shrink-0 ${
          isDarkMode ? "bg-[#14171d] border-neutral-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div>
            {saveToast && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Firma & Hesap Ayarları Kaydedildi!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                isDarkMode 
                  ? "border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800" 
                  : "border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer ${
                isDarkMode 
                  ? "bg-[#C5A059] text-black hover:bg-[#b5924d]" 
                  : "bg-[#B88E3A] text-white hover:bg-[#a67e2f]"
              }`}
            >
              <Save className="w-4 h-4" />
              DEĞİŞİKLİKLERİ KAYDET
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
