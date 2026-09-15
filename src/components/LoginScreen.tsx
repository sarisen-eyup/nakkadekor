import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Phone, 
  Building2, 
  User, 
  MapPin,
  X, 
  CheckCircle2, 
  Check, 
  Info, 
  FileText, 
  Receipt, 
  Send, 
  Sparkles,
  Loader2,
  Database,
  Key
} from "lucide-react";
import { CompanyProfile, UserAccount } from "../types/pricing";
import { 
  supabase, 
  signInWithGoogle, 
  isSupabaseConfigured, 
  getSupabaseCredentials, 
  saveSupabaseCustomCredentials, 
  ensureTenantAndUserExist, 
  setAuthenticatedTenantId 
} from "../lib/supabase";

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount, rememberMe: boolean) => void;
  onRegisterCompany?: (company: CompanyProfile, adminUser: UserAccount) => void;
  onContinueAsGuest?: () => void;
  isDarkMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
  onRegisterCompany,
  isDarkMode
}) => {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Login Form State (Temiz ve sahte verisiz)
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  
  // Google OAuth & Supabase Loading State
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Supabase Manual Configuration Modal State
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [dbUrl, setDbUrl] = useState<string>(() => getSupabaseCredentials().url);
  const [dbKey, setDbKey] = useState<string>(() => getSupabaseCredentials().anonKey);
  const [dbSaveNotice, setDbSaveNotice] = useState<string | null>(null);

  // Register Form State (Mali & Fatura Bilgileri)
  const [regForm, setRegForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    city: "",
    taxOffice: "",
    taxNumber: "",
    address: "",
    agreeTerms: true
  });
  const [regSuccess, setRegSuccess] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals inside login
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotSent, setForgotSent] = useState<boolean>(false);

  // Supabase Auth Dinleyicisi (Google OAuth ve mevcut oturum)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      // 1. Mevcut aktif Supabase oturumu kontrolü
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const u = session.user;
          setAuthenticatedTenantId(u.id);
          await ensureTenantAndUserExist(u);
          const loggedAccount: UserAccount = {
            id: u.id,
            fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Yetkili",
            username: u.email?.split("@")[0] || "user",
            email: u.email || "",
            role: "admin",
            avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || "",
            phone: u.user_metadata?.phone || "",
            isEmailVerified: true,
            status: "active",
            lastLoginAt: "Şimdi (Aktif Oturum)"
          };
          onLoginSuccess(loggedAccount, true);
        }
      });

      // 2. Auth State Değişiklikleri (Google Login Popup veya Yönlendirme Tamamlandığında)
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
          const u = session.user;
          setAuthenticatedTenantId(u.id);
          await ensureTenantAndUserExist(u);
          const loggedAccount: UserAccount = {
            id: u.id,
            fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Yetkili",
            username: u.email?.split("@")[0] || "user",
            email: u.email || "",
            role: "admin",
            avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || "",
            phone: u.user_metadata?.phone || "",
            isEmailVerified: true,
            status: "active",
            lastLoginAt: "Şimdi (Aktif Oturum)"
          };
          setIsGoogleLoading(false);
          onLoginSuccess(loggedAccount, true);
        }
      });

      // 3. Popup penceresinden gelebilecek mesaj dinleyicisi
      const handlePopupMessage = (evt: MessageEvent) => {
        if (evt.data?.type === "SUPABASE_AUTH_SUCCESS" && evt.data?.session?.user) {
          const u = evt.data.session.user;
          setAuthenticatedTenantId(u.id);
          ensureTenantAndUserExist(u);
          const loggedAccount: UserAccount = {
            id: u.id,
            fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Yetkili",
            username: u.email?.split("@")[0] || "user",
            email: u.email || "",
            role: "admin",
            avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || "",
            phone: u.user_metadata?.phone || "",
            isEmailVerified: true,
            status: "active",
            lastLoginAt: "Şimdi (Aktif Oturum)"
          };
          setIsGoogleLoading(false);
          onLoginSuccess(loggedAccount, true);
        }
      };
      window.addEventListener("message", handlePopupMessage);

      return () => {
        authListener.subscription.unsubscribe();
        window.removeEventListener("message", handlePopupMessage);
      };
    }
  }, [onLoginSuccess]);

  // Google OAuth ile Giriş Başlatma
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    if (!isSupabaseConfigured()) {
      setIsDbModalOpen(true);
      return;
    }

    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || "Google ile giriş başlatılamadı. Lütfen Supabase ayarlarınızı kontrol edin.");
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Google girişinde beklenmeyen bir hata oluştu.");
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Lütfen kurumsal e-posta adresinizi girin.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Lütfen şifrenizi girin.");
      return;
    }

    setIsSubmitting(true);

    // 1. Supabase Auth ile doğrudan oturum açmayı dene
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password.trim()
        });

        if (!error && data?.user) {
          const u = data.user;
          setAuthenticatedTenantId(u.id);
          await ensureTenantAndUserExist(u);
          const loggedAccount: UserAccount = {
            id: u.id,
            fullName: u.user_metadata?.full_name || u.email?.split("@")[0] || "Yetkili",
            username: u.email?.split("@")[0] || "user",
            email: u.email || cleanEmail,
            role: "admin",
            phone: u.user_metadata?.phone || "",
            isEmailVerified: true,
            status: "active",
            lastLoginAt: "Şimdi (Aktif Oturum)"
          };
          setIsSubmitting(false);
          onLoginSuccess(loggedAccount, rememberMe);
          return;
        } else if (error) {
          console.warn("Supabase auth response:", error.message);
          if (error.message !== "Invalid login credentials") {
            setErrorMessage("Supabase Giriş Hatası: " + error.message);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn("Supabase login exception:", err);
      }
    }

    // 2. Yerel kayıtlı kullanıcı kontrolü (Varsa)
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      setIsSubmitting(false);
      onLoginSuccess(matchedUser, rememberMe);
    } else {
      setIsSubmitting(false);
      setErrorMessage("Kayıtlı kullanıcı bulunamadı. Lütfen 'Google ile Giriş Yap' butonunu kullanın veya kayıt oluşturun.");
    }
  };

  const handleSaveDbSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCustomCredentials(dbUrl.trim(), dbKey.trim());
    setDbSaveNotice("Supabase bağlantı bilgileri kaydedildi! Sayfa yenileniyor...");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Zorunlu alan doğrulamaları: telefon, mail, vergi dairesi, vergi no, adres, ünvan, yetkili
    if (!regForm.companyName.trim()) {
      setErrorMessage("Lütfen firma veya atölye fatura ünvanını girin.");
      return;
    }
    if (!regForm.fullName.trim()) {
      setErrorMessage("Lütfen yetkili adını ve soyadını girin.");
      return;
    }
    if (!regForm.phone.trim()) {
      setErrorMessage("Lütfen kurumsal telefon numaranızı girin.");
      return;
    }
    if (!regForm.email.trim() || !regForm.email.includes("@")) {
      setErrorMessage("Lütfen geçerli bir kurumsal e-posta adresi girin.");
      return;
    }
    if (!regForm.taxOffice.trim()) {
      setErrorMessage("Lütfen bağlı olduğunuz Vergi Dairesini girin.");
      return;
    }
    if (!regForm.taxNumber.trim()) {
      setErrorMessage("Lütfen Vergi Numaranızı veya T.C. Kimlik Numaranızı girin.");
      return;
    }
    if (!regForm.address.trim()) {
      setErrorMessage("Lütfen fatura açık adresinizi girin.");
      return;
    }
    if (!regForm.agreeTerms) {
      setErrorMessage("Lütfen kullanıcı sözleşmesi ve KVKK metnini onaylayın.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newUserId = "user_" + Date.now();
      const username = regForm.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "admin";
      
      const createdUser: UserAccount = {
        id: newUserId,
        fullName: regForm.fullName.trim(),
        username: username,
        email: regForm.email.trim().toLowerCase(),
        phone: regForm.phone.trim(),
        role: "admin",
        title: "Atölye Yöneticisi",
        isEmailVerified: true,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0]
      };

      const newCompany: CompanyProfile = {
        companyName: regForm.companyName.trim(),
        tradeTitle: regForm.companyName.trim() + " San. ve Tic. Ltd. Şti.",
        tagline: "Sanatsal Çerçeve & Tablo Atölyesi",
        phone: regForm.phone.trim(),
        email: regForm.email.trim().toLowerCase(),
        address: regForm.address.trim(),
        city: regForm.city.trim() || "İstanbul",
        website: "",
        taxOffice: regForm.taxOffice.trim(),
        taxNumber: regForm.taxNumber.trim(),
        iban: "",
        includeInQuotes: true,
        logoUrl: null,
        primaryColor: "#C5A059"
      };

      setIsSubmitting(false);
      setRegSuccess(true);
      
      // Save profile for subsequent immediate entry if desired
      if (onRegisterCompany) {
        onRegisterCompany(newCompany, createdUser);
      }
    }, 600);
  };

  const handleSendForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotSent(false);
        setForgotEmail("");
      }, 2000);
    }, 1000);
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200 ${
      isDarkMode ? "bg-[#0b0d10] text-white" : "bg-[#f3f4f6] text-slate-900"
    }`}>
      {/* Background Decorative ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl" />
      </div>

      {/* Main Container */}
      <div className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-sm transition-all duration-300 ${
        isDarkMode ? "bg-[#14171d]/95 border-white/10" : "bg-white border-slate-200/90 shadow-slate-200/50"
      }`}>

        {/* LEFT PANEL: Branding & Inspiration Art */}
        <div className="lg:col-span-5 relative p-8 sm:p-10 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1a1c23] via-[#121419] to-[#0a0c0e] text-white border-b lg:border-b-0 lg:border-r border-white/10">
          {/* Subtle Atelier Geometric Frame Art Texture */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <defs>
                <pattern id="frameGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[#C5A059]" strokeOpacity="0.3" />
                  <circle cx="20" cy="20" r="1" fill="#C5A059" fillOpacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#frameGrid)" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/85 to-transparent pointer-events-none" />

          {/* Top: Logo */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5A059] to-[#805F21] p-0.5 shadow-lg shadow-[#C5A059]/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#121418] rounded-[14px] flex items-center justify-center">
                  <span className="text-xl font-black text-[#C5A059] tracking-wider">N</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-widest uppercase text-white">
                  NAKKA <span className="text-[#C5A059]">DECOR</span>
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C5A059]/90">
                  B2B Sanat & Çerçeve Atölye Portalı
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Slogan & Vision */}
          <div className="relative z-10 my-8 space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Profesyonel <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059]">
                Sanatsal Çerçeve
              </span> <br />
              Simülatörü
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md">
              Sanatsal çerçeve atölyelerine özel; gönye kesim, dinamik paspartu, kurumsal pdf teklif, üretim emri hazırlama ve maliyet hesabı oluşturma sistemi.
            </p>

            <div className="pt-3 space-y-3 text-xs sm:text-sm text-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C5A059]/25 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] text-xs font-bold shrink-0">✓</div>
                <span className="font-medium">Sanatı hak ettiği kusursuz çerçeveyle buluşturun</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] text-xs font-bold shrink-0">✓</div>
                <span className="font-medium">Müşterilerinize hayal ettikleri sonucu anında yaşatın</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] text-xs font-bold shrink-0">✓</div>
                <span className="font-medium">Atölyenizin prestijini ve teklif hızını zirveye taşıyın</span>
              </div>
            </div>
          </div>

          {/* Bottom: B2B Quote / Trust */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit SSL Şifreli Güvenli Giriş</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">© 2026 Nakka Studio</span>
          </div>
        </div>

        {/* RIGHT PANEL: Form Area (Login OR Register) */}
        <div className={`lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between ${
          isDarkMode ? "bg-[#14171d]" : "bg-white"
        }`}>
          <div>
            {authMode === "login" ? (
              /* ================= LOGIN VIEW ================= */
              <div>
                {/* Form Header */}
                <div className="mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    isDarkMode ? "bg-white/10 text-[#C5A059]" : "bg-amber-50 text-[#B88E3A] border border-amber-200"
                  }`}>
                    Yetkili Erişimi
                  </span>
                  <h3 className={`text-xl sm:text-2xl font-black mt-2 tracking-wide uppercase ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}>
                    Hesabınıza Giriş Yapın
                  </h3>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    Atölye panelinize ve sipariş simülatörünüze bağlanın
                  </p>
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Google OAuth Login Button (Supabase Auth) */}
                <div className="mb-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isSubmitting}
                    className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] border ${
                      isDarkMode 
                        ? "bg-[#181a20] hover:bg-[#20232b] text-white border-white/20 hover:border-[#C5A059]/50" 
                        : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {isGoogleLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                        <span>Google ile Doğrulanıyor...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span>Google ile Giriş Yap</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className={`h-[1px] flex-1 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>
                      veya e-posta ile
                    </span>
                    <div className={`h-[1px] flex-1 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      isDarkMode ? "text-neutral-300" : "text-slate-700"
                    }`}>
                      Kurumsal E-Posta
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDarkMode ? "text-neutral-500" : "text-slate-400"
                      }`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@atolye.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059] focus:ring-[#C5A059]/20" 
                            : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A] focus:ring-[#B88E3A]/20"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`block text-xs font-bold uppercase tracking-wider ${
                        isDarkMode ? "text-neutral-300" : "text-slate-700"
                      }`}>
                        Şifre
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(true)}
                        className={`text-xs font-semibold hover:underline cursor-pointer ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}
                      >
                        Şifremi Unuttum?
                      </button>
                    </div>
                    <div className="relative">
                      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isDarkMode ? "text-neutral-500" : "text-slate-400"
                      }`}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059] focus:ring-[#C5A059]/20" 
                            : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A] focus:ring-[#B88E3A]/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer ${
                          isDarkMode ? "text-neutral-500 hover:text-white" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#C5A059] cursor-pointer"
                      />
                      <span className={`text-xs ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                        Beni hatırla (30 gün)
                      </span>
                    </label>
                  </div>

                  {/* Big Prominent Login Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.99] ${
                      isDarkMode 
                        ? "bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] text-black hover:opacity-95 shadow-[#C5A059]/25 font-black" 
                        : "bg-gradient-to-r from-[#B88E3A] to-[#8F6A1E] text-white hover:opacity-95 shadow-amber-900/20 font-black"
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Giriş Doğrulanıyor...</span>
                    ) : (
                      <>
                        <span>GİRİŞ YAP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* ================= REGISTER VIEW ================= */
              <div>
                {regSuccess ? (
                  /* Registration Success View */
                  <div className="text-center py-4 space-y-4 animate-fade-in">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        BAŞVURU ALINDI
                      </span>
                      <h3 className={`text-lg sm:text-xl font-black mt-2 tracking-wide uppercase ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}>
                        Kurumsal Üyelik Başvurunuz Alındı
                      </h3>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                        Firma ve mali bilgileriniz sisteme başarıyla kaydedildi.
                      </p>
                    </div>

                    {/* Prominent Temporary Password Notice */}
                    <div className="p-4 rounded-xl text-left bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 text-xs text-amber-200 leading-relaxed space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <Info className="w-4 h-4 text-[#C5A059] shrink-0" />
                        <span>Önemli Bilgilendirme</span>
                      </div>
                      <p className="text-neutral-200">
                        Üyeliğiniz onaylandıktan sonra <strong>geçici şifreniz mail ile size iletilecektir.</strong>
                      </p>
                      <div className="text-[11px] text-[#FAE2B3] bg-black/30 p-2 rounded-lg border border-[#C5A059]/20">
                        Bildirim E-postası: <span className="font-bold underline">{regForm.email}</span>
                      </div>
                    </div>

                    {/* Summary of Registered Details */}
                    <div className={`p-3 rounded-xl border text-xs text-left space-y-2 ${
                      isDarkMode ? "bg-white/[0.02] border-white/10 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-neutral-400">Fatura Ünvanı:</span>
                        <span className="font-semibold text-right truncate max-w-[200px]">{regForm.companyName}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-neutral-400">Vergi Dairesi / No:</span>
                        <span className="font-semibold text-right">{regForm.taxOffice} - {regForm.taxNumber}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-neutral-400">Yetkili / Tel:</span>
                        <span className="font-semibold text-right">{regForm.fullName} ({regForm.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Fatura Adresi:</span>
                        <span className="font-semibold text-right truncate max-w-[200px]">{regForm.address}</span>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(regForm.email);
                          setAuthMode("login");
                          setRegSuccess(false);
                          setErrorMessage(null);
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isDarkMode 
                            ? "bg-white/10 hover:bg-white/15 text-white border border-white/20" 
                            : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        <span>Giriş Ekranına Dön</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newUserId = "user_" + Date.now();
                          const createdUser: UserAccount = {
                            id: newUserId,
                            fullName: regForm.fullName.trim(),
                            username: regForm.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "admin",
                            email: regForm.email.trim().toLowerCase(),
                            phone: regForm.phone.trim(),
                            role: "admin",
                            title: "Atölye Yöneticisi",
                            isEmailVerified: true,
                            status: "active",
                            createdAt: new Date().toISOString().split("T")[0]
                          };
                          onLoginSuccess(createdUser, true);
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isDarkMode 
                            ? "bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] text-black font-black shadow-lg shadow-[#C5A059]/20" 
                            : "bg-[#B88E3A] text-white font-black"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Simülatörü Hemen Başlat (Test)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form View - Compact 4-Row B2B Layout */
                  <div>
                    {/* Form Header */}
                    <div className="mb-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30" : "bg-amber-50 text-[#B88E3A] border border-amber-200"
                      }`}>
                        B2B KURUMSAL BAŞVURU &amp; FATURA KAYDI
                      </span>
                      <h3 className={`text-lg sm:text-xl font-black mt-1 tracking-wide uppercase ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}>
                        Yeni Atölye &amp; Üyelik Kaydı
                      </h3>
                      <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                        Fatura kesimi ve kurumsal üretim hesabı için bilgilerinizi eksiksiz doldurunuz.
                      </p>
                    </div>

                    {/* Prominent Mandatory Note Box */}
                    <div className="mb-3 p-2.5 rounded-xl border flex items-center gap-2.5 bg-[#C5A059]/10 border-[#C5A059]/35 text-[#FAE2B3] shadow-sm">
                      <Info className="w-4 h-4 shrink-0 text-[#C5A059]" />
                      <div className="text-[11px] leading-snug">
                        <strong className="text-white">Önemli Not: </strong>
                        Üyeliğiniz onaylandıktan sonra geçici şifreniz mail ile size iletilecektir.
                      </div>
                    </div>

                    {/* Error message */}
                    {errorMessage && (
                      <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Registration Form - 4 Rows */}
                    <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                      {/* 1. SATIR: Firma Ünvanı & Yetkili Adı Soyadı */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isDarkMode ? "text-neutral-300" : "text-slate-700"
                          }`}>
                            Firma / Fatura Ünvanı *
                          </label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${
                              isDarkMode ? "text-neutral-500" : "text-slate-400"
                            }`}>
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="text"
                              required
                              value={regForm.companyName}
                              onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                              placeholder="Firma / Atölye Ünvanı"
                              className={`w-full pl-8 pr-2.5 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                                isDarkMode 
                                  ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059]" 
                                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isDarkMode ? "text-neutral-300" : "text-slate-700"
                          }`}>
                            Yetkili Adı Soyadı *
                          </label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${
                              isDarkMode ? "text-neutral-500" : "text-slate-400"
                            }`}>
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="text"
                              required
                              value={regForm.fullName}
                              onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                              placeholder="Ad Soyad"
                              className={`w-full pl-8 pr-2.5 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                                isDarkMode 
                                  ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059]" 
                                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. SATIR: Telefon Numarası & Kurumsal E-Posta */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isDarkMode ? "text-neutral-300" : "text-slate-700"
                          }`}>
                            Telefon Numarası *
                          </label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${
                              isDarkMode ? "text-neutral-500" : "text-slate-400"
                            }`}>
                              <Phone className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="tel"
                              required
                              value={regForm.phone}
                              onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                              placeholder="0532 123 45 67"
                              className={`w-full pl-8 pr-2.5 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                                isDarkMode 
                                  ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059]" 
                                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isDarkMode ? "text-neutral-300" : "text-slate-700"
                          }`}>
                            Kurumsal E-Posta (Şifre Adresi) *
                          </label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${
                              isDarkMode ? "text-neutral-500" : "text-slate-400"
                            }`}>
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="email"
                              required
                              value={regForm.email}
                              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                              placeholder="info@atolyeniz.com"
                              className={`w-full pl-8 pr-2.5 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                                isDarkMode 
                                  ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059]" 
                                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. SATIR: Vergi Dairesi & Vergi No veya T.C. Kimlik No */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isDarkMode ? "text-neutral-300" : "text-slate-700"
                          }`}>
                            Vergi Dairesi *
                          </label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${
                              isDarkMode ? "text-neutral-500" : "text-slate-400"
                            }`}>
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="text"
                              required
                              value={regForm.taxOffice}
                              onChange={(e) => setRegForm({ ...regForm, taxOffice: e.target.value })}
                              placeholder="Örn: Kadıköy V.D."
                              className={`w-full pl-8 pr-2.5 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                                isDarkMode 
                                  ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059]" 
                                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isDarkMode ? "text-neutral-300" : "text-slate-700"
                          }`}>
                            Vergi No / T.C. Kimlik No *
                          </label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${
                              isDarkMode ? "text-neutral-500" : "text-slate-400"
                            }`}>
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="text"
                              required
                              value={regForm.taxNumber}
                              onChange={(e) => setRegForm({ ...regForm, taxNumber: e.target.value })}
                              placeholder="10 Haneli Vergi No veya 11 Haneli TC"
                              className={`w-full pl-8 pr-2.5 py-2 rounded-lg border text-xs focus:outline-none transition-colors ${
                                isDarkMode 
                                  ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059]" 
                                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. SATIR: Fatura Açık Adresi (İl / İlçe Dahil) */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          isDarkMode ? "text-neutral-300" : "text-slate-700"
                        }`}>
                          Fatura Açık Adresi (İlçe ve İl Dahil) *
                        </label>
                        <div className="relative">
                          <div className={`absolute top-2.5 left-2.5 flex items-center pointer-events-none ${
                            isDarkMode ? "text-neutral-500" : "text-slate-400"
                          }`}>
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <textarea
                            rows={2}
                            required
                            value={regForm.address}
                            onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                            placeholder="Mahalle, Cadde/Sokak, No, İlçe ve İl bilgisi..."
                            className={`w-full pl-8 pr-2.5 py-2 rounded-lg border text-xs focus:outline-none resize-none transition-colors ${
                              isDarkMode 
                                ? "bg-[#0f1115] border-white/15 text-white placeholder-neutral-600 focus:border-[#C5A059]" 
                                : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Terms checkbox */}
                      <div className="pt-0.5">
                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={regForm.agreeTerms}
                            onChange={(e) => setRegForm({ ...regForm, agreeTerms: e.target.checked })}
                            className="w-3.5 h-3.5 mt-0.5 rounded accent-[#C5A059] cursor-pointer"
                          />
                          <span className={`text-[10px] leading-tight ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                            Kullanıcı sözleşmesini, kurumsal fatura ve KVKK şartlarını okudum, onaylıyorum. *
                          </span>
                        </label>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.99] mt-1 ${
                          isDarkMode 
                            ? "bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] text-black hover:opacity-95 shadow-[#C5A059]/25 font-black" 
                            : "bg-gradient-to-r from-[#B88E3A] to-[#8F6A1E] text-white hover:opacity-95 shadow-amber-900/20 font-black"
                        }`}
                      >
                        {isSubmitting ? (
                          <span>Mali Bilgiler Kaydediliyor...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>KURUMSAL ÜYELİK BAŞVURUSUNU GÖNDER</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Switching (No Guest Login) */}
          <div className="mt-6 pt-4 border-t border-neutral-700/30 flex items-center justify-between text-xs">
            {authMode === "login" ? (
              <div className={`${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Hesabınız yok mu? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setErrorMessage(null);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${
                    isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                  }`}
                >
                  Hemen Yeni Üyelik Oluşturun →
                </button>
              </div>
            ) : (
              <div className={`${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Zaten bir hesabınız var mı? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setErrorMessage(null);
                  }}
                  className={`font-bold hover:underline cursor-pointer ${
                    isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                  }`}
                >
                  ← Giriş Ekranına Dönün
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsDbModalOpen(true)}
                className={`text-[11px] font-mono flex items-center gap-1.5 hover:underline cursor-pointer ${
                  isSupabaseConfigured() 
                    ? "text-emerald-400/90 hover:text-emerald-300" 
                    : "text-amber-400/90 hover:text-amber-300"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured() ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span>{isSupabaseConfigured() ? "Supabase Bulut Aktif" : "Supabase Bağlantısı Kur"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className={`text-[11px] font-mono hover:underline cursor-pointer ${
                  isDarkMode ? "text-neutral-500 hover:text-neutral-300" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Destek &amp; Lisans
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* B2B Subscription / Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative ${
            isDarkMode ? "bg-[#161920] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Kurumsal Lisans &amp; Bilgi Hattı
                </h3>
                <p className="text-xs text-neutral-400">
                  Nakka Decor B2B Atölye Sistemi
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              Sistemimiz çerçeve atölyelerine özel lisans ve kredi modeliyle sunulmaktadır. Kendi firma logonuz, özel maliyet çarpanlarınız ve personel hesaplarınız ile kurulum desteği almak için bize ulaşabilirsiniz.
            </p>

            <div className="space-y-2.5 mb-6 text-xs font-mono">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? "bg-[#0e1014] border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                <span className="text-neutral-400">Telefon / WhatsApp:</span>
                <span className="font-bold text-[#C5A059]">+90 (212) 245 88 90</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? "bg-[#0e1014] border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                <span className="text-neutral-400">Doğrudan İletişim:</span>
                <span className="font-bold text-[#C5A059]">kurumsal@nakkadecor.com</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? "bg-[#0e1014] border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                <span className="text-neutral-400">Lisans Tipi:</span>
                <span className="text-emerald-400 font-bold">Özel White-Label &amp; Bulut</span>
              </div>
            </div>

            <button
              onClick={() => setIsContactModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#C5A059] text-black font-bold uppercase text-xs tracking-wider cursor-pointer hover:bg-[#b8944c]"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative ${
            isDarkMode ? "bg-[#161920] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold uppercase tracking-wider mb-2">
              Şifre Sıfırlama
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Kayıtlı kurumsal e-posta adresinizi girin, sıfırlama bağlantısını iletelim.
            </p>

            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!</span>
              </div>
            ) : (
              <form onSubmit={handleSendForgotPassword} className="space-y-4">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e-posta@atolye.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                    isDarkMode ? "bg-[#0e1014] border-white/15 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#C5A059] text-black font-bold uppercase text-xs tracking-wider cursor-pointer hover:bg-[#b8944c]"
                >
                  Sıfırlama Bağlantısı Gönder
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Supabase Database Configuration Modal */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative ${
            isDarkMode ? "bg-[#161920] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <button
              onClick={() => {
                setIsDbModalOpen(false);
                setDbSaveNotice(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Supabase Bulut Veritabanı
                </h3>
                <p className="text-xs text-neutral-400">
                  Canlı veritabanı ve Google OAuth entegrasyonu
                </p>
              </div>
            </div>

            {dbSaveNotice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{dbSaveNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveDbSettings} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? "text-neutral-300" : "text-slate-700"
                }`}>
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDarkMode ? "bg-[#0e1014] border-white/15 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? "text-neutral-300" : "text-slate-700"
                }`}>
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  required
                  value={dbKey}
                  onChange={(e) => setDbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDarkMode ? "bg-[#0e1014] border-white/15 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase border cursor-pointer ${
                    isDarkMode ? "border-white/15 text-neutral-300 hover:bg-white/5" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] text-black font-black uppercase text-xs tracking-wider cursor-pointer shadow-md hover:opacity-95"
                >
                  Kaydet &amp; Bağlan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
