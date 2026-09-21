import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Building2, 
  X, 
  CheckCircle2, 
  Loader2,
  Compass
} from "lucide-react";
import { CompanyProfile, UserAccount } from "../types/pricing";
import { 
  supabase, 
  signInWithGoogle, 
  isSupabaseConfigured, 
  ensureTenantAndUserExist, 
  setAuthenticatedTenantId 
} from "../lib/supabase";
import { fetchTenantRecord } from "../services/supabaseService";
import { useAuthGuard } from "../context/AuthGuardContext";
import { LegalTermsModal, LegalTermsCheckbox, LegalDocType } from "./LegalTermsModal";

interface LoginScreenProps {
  users?: UserAccount[];
  onLoginSuccess: (user: UserAccount, rememberMe: boolean) => void;
  onRegisterCompany?: (company: CompanyProfile, adminUser: UserAccount) => void;
  onContinueAsGuest?: () => void;
  isDarkMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users = [],
  onLoginSuccess,
  onRegisterCompany,
  onContinueAsGuest,
  isDarkMode
}) => {
  // Legal Terms Agreement
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>("user_agreement");

  // Google OAuth & Supabase Loading State
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals inside login
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const { tenantStatus, refreshTenant } = useAuthGuard();

  // Halihazırda oturum durumu netleştiyse ilgili rotaya yönlendir
  useEffect(() => {
    if (tenantStatus === "active") {
      navigate("/", { replace: true });
    } else if (tenantStatus === "pending" || tenantStatus === "suspended") {
      navigate("/pending", { replace: true });
    } else if (tenantStatus === "needs_onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [tenantStatus, navigate]);

  // Oturum açan kullanıcının atölye/tenant kaydını kontrol edip doğru ekrana yönlendiren fonksiyon
  const processUserAuth = async (u: any) => {
    try {
      setAuthenticatedTenantId(u.id);
      // Yeni kullanıcı ise status: 'pending' ile tenants kaydını AÇIKÇA oluştur
      await ensureTenantAndUserExist(u);
      
      // AuthGuard state'ini veritabanındaki son durum ile güncelle
      const freshStatus = await refreshTenant();
      setIsGoogleLoading(false);

      if (freshStatus === "needs_onboarding") {
        navigate("/onboarding", { replace: true });
        return;
      }

      if (freshStatus === "pending" || freshStatus === "suspended") {
        navigate("/pending", { replace: true });
        return;
      }

      if (freshStatus === "active") {
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
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.warn("processUserAuth error:", err);
      setIsGoogleLoading(false);
    }
  };

  // Supabase Auth Dinleyicisi (Google OAuth ve mevcut oturum)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      // 1. Mevcut aktif Supabase oturumu kontrolü
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          await processUserAuth(session.user);
        }
      });

      // 2. Auth State Değişiklikleri (Google Login Popup veya Yönlendirme Tamamlandığında)
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
          await processUserAuth(session.user);
        }
      });

      // 3. Popup penceresinden gelebilecek mesaj dinleyicisi
      const handlePopupMessage = async (evt: MessageEvent) => {
        if (evt.data?.type === "SUPABASE_AUTH_SUCCESS" && evt.data?.session?.user) {
          await processUserAuth(evt.data.session.user);
        }
      };
      window.addEventListener("message", handlePopupMessage);

      return () => {
        authListener.subscription.unsubscribe();
        window.removeEventListener("message", handlePopupMessage);
      };
    }
  }, [onLoginSuccess, navigate]);

  // Google OAuth ile Giriş Başlatma
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    if (!agreeTerms) {
      setErrorMessage("Lütfen devam etmek için Kullanıcı Sözleşmesi, Kurumsal Fatura ve KVKK Şartları'nı onaylayınız.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMessage("Supabase ortam değişkenleri (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) tanımlanmamış. Lütfen sunucu veya .env yapılandırmasını kontrol edin.");
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

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200 ${
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
              <img 
                src="/favicon.png" 
                alt="Nakka Dekor Logo" 
                className="w-12 h-12 rounded-2xl object-contain shadow-lg shadow-[#C5A059]/20 shrink-0" 
              />
              <div>
                <h1 className="text-xl font-black tracking-widest uppercase text-white">
                  NAKKA <span className="text-[#C5A059]">DEKOR</span>
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
              Sanatsal çerçeve atölyelerine özel; gönye kesim, dinamik paspartu simülasyonu, iş emri ve maliyet hesaplama platformu.
            </p>

            <div className="pt-3 space-y-3 text-xs sm:text-sm text-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C5A059]/25 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] text-xs font-bold shrink-0">✓</div>
                <span className="font-medium">Gerçek zamanlı çerçeve ve paspartu simülasyonu</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] text-xs font-bold shrink-0">✓</div>
                <span className="font-medium">Anlık maliyet, fire analizi ve kâr hesaplama</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] text-xs font-bold shrink-0">✓</div>
                <span className="font-medium">Tek tıkla teklif formu, kesim listesi ve arka etiket çıktısı</span>
              </div>
            </div>
          </div>

          {/* Bottom: B2B Quote / Trust */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit SSL Şifreli Güvenli Giriş</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">© 2026 Nakka Dekor</span>
          </div>
        </div>

        {/* RIGHT PANEL: Form Area (Google Account Only) */}
        <div className={`lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between ${
          isDarkMode ? "bg-[#14171d]" : "bg-white"
        }`}>
          <div>
            {/* Form Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                  isDarkMode ? "bg-white/10 text-[#C5A059]" : "bg-amber-50 text-[#B88E3A] border border-amber-200"
                }`}>
                  Yetkili Erişimi
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isDarkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  Google SSO
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black mt-2.5 tracking-wide uppercase ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                Hesabınıza Giriş Yapın
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Atölye panelinize ve sipariş simülatörünüze Google hesabınızla anında bağlanın.
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Authentication Box */}
            <div className={`p-5 sm:p-6 rounded-2xl border mb-6 transition-all ${
              isDarkMode 
                ? "bg-[#101217] border-white/10" 
                : "bg-slate-50 border-slate-200 shadow-xs"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-200">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    Google Hesabı ile Hızlı Giriş
                  </h4>
                  <p className={`text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    Şifre girmeden tek tıkla güvenli kurumsal erişim
                  </p>
                </div>
              </div>

              {/* Informative Highlights */}
              <div className="space-y-2.5 mb-5 text-xs">
                <div className={`flex items-center gap-2.5 ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Siparişleriniz ve atölye maliyet ayarlarınız Google profilinize bağlanır.</span>
                </div>
                <div className={`flex items-center gap-2.5 ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Tüm bilgisayar, telefon ve tabletlerden aynı hesapla anında devam edebilirsiniz.</span>
                </div>
                <div className={`flex items-center gap-2.5 ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Şifre hatırlama/sıfırlama ihtiyacı olmadan 256-bit şifreli güvenli kimlik doğrulama.</span>
                </div>
              </div>

              {/* Legal Terms Checkbox */}
              <div className="mb-4 pt-3.5 border-t border-white/10 dark:border-white/10 border-slate-200">
                <LegalTermsCheckbox
                  checked={agreeTerms}
                  onChange={(val) => {
                    setAgreeTerms(val);
                    if (val && errorMessage?.includes("şartları")) {
                      setErrorMessage(null);
                    }
                  }}
                  onOpenDoc={(doc) => {
                    setSelectedLegalDoc(doc);
                    setIsLegalModalOpen(true);
                  }}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Google OAuth Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] border min-h-[46px] ${
                  isDarkMode 
                    ? "bg-[#181a20] hover:bg-[#22252e] text-white border-white/20 hover:border-[#C5A059]" 
                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-[#B88E3A]"
                }`}
              >
                {isGoogleLoading ? (
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                    <span>Google ile Doğrulanıyor...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span className="font-extrabold tracking-wide">Google ile Giriş Yap</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Studio Geliştirici & Tasarım Düzenleme Butonu (Sadece DEV Ortamında) */}
            {import.meta.env.DEV && onContinueAsGuest && (
              <div className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isDarkMode 
                  ? "bg-[#C5A059]/10 border-[#C5A059]/30 text-neutral-200" 
                  : "bg-amber-50/80 border-amber-300 text-amber-950"
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">AI Studio Tasarım Düzenleme</div>
                    <div className="text-[10px] opacity-75 truncate">Girişi atlayıp doğrudan simülatörü açar</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#a88237] hover:from-[#d5b069] hover:to-[#b89247] text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 shrink-0"
                >
                  <span>Tasarımı Aç</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer: Quick Access & Licensing */}
          <div className="mt-4 pt-4 border-t border-neutral-700/30 flex items-center justify-between gap-4 text-xs">
            {import.meta.env.DEV && onContinueAsGuest ? (
              <button
                type="button"
                onClick={onContinueAsGuest}
                className={`text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-1.5 ${
                  isDarkMode ? "text-[#C5A059] hover:text-[#FAE2B3]" : "text-[#B88E3A] hover:text-[#8F6A1E]"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Misafir / Tasarım Moduna Geç (Dev)</span>
              </button>
            ) : <div />}

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
                  Nakka Dekor B2B Atölye Sistemi
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
                <span className="font-bold text-[#C5A059]">kurumsal@nakkadekor.com</span>
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

      {/* Legal Terms & KVKK Document Popup Modal */}
      <LegalTermsModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        defaultDoc={selectedLegalDoc}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
