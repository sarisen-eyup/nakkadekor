import React, { useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthGuard } from "../context/AuthGuardContext";
import { createTenantOnboarding } from "../services/supabaseService";
import { CompanyProfile, EMPTY_COMPANY_PROFILE } from "../types/pricing";
import { 
  Building2, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  Sun, 
  Moon, 
  FileText, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export const OnboardingScreen: React.FC = () => {
  const { 
    user, 
    tenantStatus, 
    refreshTenant, 
    signOut, 
    isDarkMode, 
    toggleDarkMode,
    isLoading 
  } = useAuthGuard();

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<CompanyProfile>(() => {
    const defaultEmail = user?.email || "";
    const defaultName = user?.user_metadata?.company_name || "";
    return {
      ...EMPTY_COMPANY_PROFILE,
      companyName: defaultName,
      email: defaultEmail,
      primaryColor: "#C5A059"
    };
  });

  const [contactName, setContactName] = useState<string>(() => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guards
  if (!isLoading && tenantStatus === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!isLoading && tenantStatus === "active") {
    return <Navigate to="/" replace />;
  }

  if (!isLoading && (tenantStatus === "pending" || tenantStatus === "suspended")) {
    return <Navigate to="/pending" replace />;
  }

  const handleChange = (field: keyof CompanyProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Lütfen geçerli bir görsel dosyası (PNG, JPG, WebP) seçiniz.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Logo boyutu maksimum 5MB olmalıdır.");
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        handleChange("logoUrl", result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validasyonu
    if (!formData.companyName.trim()) {
      setErrorMessage("Lütfen atölye / firma adınızı giriniz.");
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMessage("Lütfen iletişim için telefon numaranızı giriniz.");
      return;
    }

    if (!formData.taxOffice.trim()) {
      setErrorMessage("Lütfen yasal faturalandırma için Vergi Dairesi bilginizi giriniz.");
      return;
    }

    const cleanTaxNum = formData.taxNumber.trim().replace(/[\s-]/g, "");
    if (!cleanTaxNum) {
      setErrorMessage("Lütfen fatura kesimi için Vergi No veya TC Kimlik No giriniz.");
      return;
    }

    if (cleanTaxNum.length < 10) {
      setErrorMessage("Vergi Numarası veya T.C. Kimlik Numarası en az 10 haneli olmalıdır (VKN: 10 hane, TCKN: 11 hane).");
      return;
    }

    if (!formData.city.trim()) {
      setErrorMessage("Lütfen işletmenizin bulunduğu İl / İlçe bilgisini giriniz.");
      return;
    }

    if (!formData.address.trim()) {
      setErrorMessage("Lütfen yasal fatura adresinizi eksiksiz giriniz.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createTenantOnboarding(formData, user?.id);

      if (!result.success) {
        setErrorMessage(result.error?.message || "Atölye kaydı oluşturulamadı. Lütfen tekrar deneyiniz.");
        setIsSubmitting(false);
        return;
      }

      // Veritabanı durumunu tazele
      await refreshTenant();

      // Başarılı: Doğrudan Bekleme (Pending) ekranına yönlendir
      navigate("/pending", { replace: true });
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setErrorMessage(err.message || "Beklenmeyen bir hata oluştu.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-200 ${
      isDarkMode ? "bg-[#0b0c0e] text-white" : "bg-[#f4f5f7] text-slate-900"
    }`}>
      {/* Top Header */}
      <header className={`px-4 sm:px-8 py-3.5 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${
        isDarkMode ? "bg-[#0e1013]/90 border-white/10" : "bg-white/90 border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E5C17B] to-[#9E782F] p-0.5 shadow-md flex items-center justify-center">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center font-serif font-black text-xs ${
              isDarkMode ? "bg-[#111317] text-[#E5C17B]" : "bg-white text-[#9E782F]"
            }`}>
              N
            </div>
          </div>
          <div>
            <span className="text-sm font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059]">
              NAKKA STUDIO
            </span>
            <span className={`text-[10px] block font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
              ATÖLYE KURULUM VE KAYIT REHBERİ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User info badge */}
          {user && (
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-xl border text-xs ${
              isDarkMode ? "bg-white/5 border-white/10 text-neutral-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-[11px] truncate max-w-[150px]">{user.email}</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode 
                ? "bg-white/5 border-white/10 text-neutral-300 hover:text-white" 
                : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
            title={isDarkMode ? "Açık Mod" : "Koyu Mod"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={signOut}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isDarkMode
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
            }`}
            title="Oturumu Kapat"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Intro Banner */}
        <div className={`mb-8 p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
          isDarkMode 
            ? "bg-gradient-to-br from-[#121418] via-[#101215] to-[#0c0d10] border-white/10" 
            : "bg-gradient-to-br from-amber-50/50 via-white to-slate-50 border-slate-200/80"
        }`}>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> 1. ADIM: ATÖLYE & ANTET PROFİLİ
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase">
              Atölye Kaydı ve Kurumsal Antet
            </h1>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${
              isDarkMode ? "text-neutral-400" : "text-slate-600"
            }`}>
              Simülatörü, gönye kesim listelerini ve PDF teklif motorunu kullanabilmeniz için firmanızın kurumsal bilgilerini oluşturun. 
              Kayıt tamamlandığında başvurunuz yönetici onayına sunulacaktır.
            </p>
          </div>
        </div>

        {/* Form & Live Preview Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Fields (8 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Bölüm: Temel Firma & İletişim */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${
              isDarkMode ? "bg-[#111317] border-white/10" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/5">
                <Building2 className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Firma ve İletişim Bilgileri
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Firma / Tabela Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="Örn: Sanat Çerçeve & Galeri Atölyesi"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                      isDarkMode 
                        ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      Yetkili Adı Soyadı
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ad Soyad"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      Resmi Şirket Unvanı
                    </label>
                    <input
                      type="text"
                      value={formData.tradeTitle}
                      onChange={(e) => handleChange("tradeTitle", e.target.value)}
                      placeholder="Örn: Sanat Çerçeve Tasarım Ltd. Şti."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      Telefon Numarası <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="Örn: 0532 000 00 00"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      Kurumsal E-posta
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="info@atolye.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Slogan / Belge Alt Başlığı
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="Örn: Sanatsal Çerçeve, Paspartu ve Cam Uygulamaları"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                      isDarkMode 
                        ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 2. Bölüm: Fatura & Resmi Bilgiler */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${
              isDarkMode ? "bg-[#111317] border-white/10" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                    Vergi ve Fatura Adres Bilgileri <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Mali Fatura İçin Zorunlu
                </span>
              </div>

              <p className={`text-[11px] mb-4 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Yazılım aboneliği ve hizmet sözleşmesi faturalandırma süreçleri için yasal şirket bilgilerinizin eksiksiz girilmesi zorunludur.
              </p>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      Vergi Dairesi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.taxOffice}
                      onChange={(e) => handleChange("taxOffice", e.target.value)}
                      placeholder="Örn: Beyoğlu V.D."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      Vergi No / TC Kimlik No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.taxNumber}
                      onChange={(e) => handleChange("taxNumber", e.target.value)}
                      placeholder="Örn: 1234567890 (10 veya 11 hane)"
                      maxLength={11}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all font-mono ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      İl / İlçe <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Örn: Kadıköy / İstanbul"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                      Banka IBAN <span className="text-[10px] font-normal lowercase opacity-70">(antet ve tahsilat için)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.iban}
                      onChange={(e) => handleChange("iban", e.target.value)}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all font-mono ${
                        isDarkMode 
                          ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Açık Adres (Yasal Fatura Adresi) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Faturanızın düzenleneceği yasal atölye / şirket açık adresi..."
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                      isDarkMode 
                        ? "bg-[#16181d] border-neutral-700 text-white focus:border-[#C5A059]" 
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 3. Bölüm: Logo & Marka Rengi */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${
              isDarkMode ? "bg-[#111317] border-white/10" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/5">
                <Upload className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Kurumsal Logo ve Marka Rengi
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Logo Upload Box */}
                <div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {formData.logoUrl ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#C5A059]/40 bg-[#C5A059]/5">
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain rounded-lg bg-white p-1 border"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block truncate text-[#C5A059]">Logo Yüklendi</span>
                        <span className="text-[10px] text-neutral-400 block">Antette gösterilecek</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange("logoUrl", "")}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Logoyu Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-4 px-3 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isDarkMode 
                          ? "border-neutral-700 hover:border-[#C5A059] bg-[#16181d] hover:bg-[#1b1e24]" 
                          : "border-slate-300 hover:border-[#B88E3A] bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <Upload className="w-5 h-5 text-[#C5A059]" />
                      <span className="text-xs font-bold">Logo Seç veya Sürükle</span>
                      <span className="text-[10px] text-neutral-400">PNG, JPG (Önerilen: 300x120px)</span>
                    </button>
                  )}
                </div>

                {/* Marka Rengi */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                    Kurumsal Belge Vurgu Rengi
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor || "#C5A059"}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor || "#C5A059"}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono uppercase focus:outline-none ${
                        isDarkMode ? "bg-[#16181d] border-neutral-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#d4b26f] to-[#b08b47] hover:from-[#b08b47] hover:to-[#9a783b] text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-[#C5A059]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Kayıt Oluşturuluyor & İletiliyor...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Kaydı Tamamla ve Onaya Gönder</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Letterhead Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className={`p-5 rounded-2xl border ${
              isDarkMode ? "bg-[#111317] border-white/10" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#C5A059]">
                  <FileText className="w-4 h-4" />
                  Canlı Antet Önizlemesi
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                  PDF & TEKLİF
                </span>
              </div>

              {/* Mock Document Letterhead Card */}
              <div className="bg-white text-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 font-sans text-xs">
                <div className="flex items-start justify-between gap-3 pb-3 border-b-2" style={{ borderColor: formData.primaryColor || "#C5A059" }}>
                  <div className="min-w-0">
                    {formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo Preview" 
                        className="h-10 object-contain mb-1.5"
                      />
                    ) : null}
                    <h4 className="font-black text-sm tracking-tight truncate uppercase" style={{ color: formData.primaryColor || "#C5A059" }}>
                      {formData.companyName.trim() || "FİRMA / ATÖLYE ADI"}
                    </h4>
                    {formData.tradeTitle && (
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        {formData.tradeTitle}
                      </p>
                    )}
                    {formData.tagline && (
                      <p className="text-[10px] text-slate-400 italic mt-0.5">
                        {formData.tagline}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[9px] text-slate-500 font-mono shrink-0 space-y-0.5">
                    {formData.phone && <div>Tel: {formData.phone}</div>}
                    {formData.email && <div>E-posta: {formData.email}</div>}
                    {formData.city && <div>{formData.city}</div>}
                  </div>
                </div>

                <div className="py-6 text-center text-slate-300 font-mono text-[10px]">
                  — Sanatsal Çerçeve Fiyat Teklifi ve Kesim Listesi —
                </div>

                {formData.taxOffice && formData.taxNumber && (
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>V.D: {formData.taxOffice}</span>
                    <span>V.No: {formData.taxNumber}</span>
                  </div>
                )}
              </div>

              {/* Bilgilendirme Notu */}
              <div className={`mt-4 p-3.5 rounded-xl border text-[11px] leading-relaxed ${
                isDarkMode ? "bg-black/30 border-white/5 text-neutral-400" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}>
                <div className="font-bold text-[#C5A059] flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Onay Sonrası Süreç
                </div>
                Bu form gönderildiğinde atölyeniz için bir tenant kaydı oluşturulacak ve sistem yöneticilerimize bildirim gidecektir. 
                Onay verildikten sonra simülatör ve tüm özellikler anında kullanımınıza açılacaktır.
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
