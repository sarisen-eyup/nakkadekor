import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthGuard } from "../context/AuthGuardContext";
import { 
  Clock, 
  LogOut, 
  RefreshCw, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert, 
  Sun, 
  Moon, 
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Compass
} from "lucide-react";

export const PendingApprovalScreen: React.FC = () => {
  const { 
    tenant, 
    tenantStatus, 
    user, 
    signOut, 
    refreshTenant, 
    isDarkMode, 
    toggleDarkMode, 
    isLoading,
    enterDevMode
  } = useAuthGuard();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Status checks for routing
  if (!isLoading && tenantStatus === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!isLoading && tenantStatus === "active") {
    return <Navigate to="/" replace />;
  }

  if (!isLoading && tenantStatus === "needs_onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      const newStatus = await refreshTenant();
      if (newStatus === "active") {
        setRefreshMessage("Tebrikler! Hesabınız onaylandı. Simülatöre aktarılıyorsunuz...");
        setTimeout(() => {
          navigate("/");
        }, 1200);
      } else {
        setRefreshMessage("Başvurunuz halen inceleme aşamasındadır. Yönetici onayı bekleniyor.");
        setTimeout(() => setRefreshMessage(null), 4000);
      }
    } catch {
      setRefreshMessage("Durum kontrol edilirken bir hata oluştu.");
      setTimeout(() => setRefreshMessage(null), 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isSuspended = tenantStatus === "suspended";

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-200 ${
      isDarkMode ? "bg-[#0a0c0e] text-white" : "bg-[#f4f5f7] text-slate-900"
    }`}>
      {/* Top Bar */}
      <header className={`px-4 sm:px-8 py-4 border-b flex items-center justify-between ${
        isDarkMode ? "bg-[#0e1013]/90 border-white/10" : "bg-white/90 border-slate-200"
      } backdrop-blur-md sticky top-0 z-20`}>
        <div className="flex items-center gap-3">
          <img 
            src="/favicon.png" 
            alt="Nakka Dekor Logo" 
            className="w-8 h-8 rounded-full object-contain shadow-sm shrink-0" 
          />
          <div>
            <span className="text-sm font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059]">
              NAKKA DEKOR
            </span>
            <span className={`text-[10px] block font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
              B2B ÇERÇEVE ATÖLYE SİSTEMİ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode 
                ? "bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10" 
                : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
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
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çıkış Yap</span>
          </button>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 sm:p-10 text-center transition-all ${
          isDarkMode 
            ? "bg-[#111317] border-white/10 shadow-black/60" 
            : "bg-white border-slate-200/90 shadow-slate-200/50"
        }`}>
          {/* Status Badge & Icon */}
          <div className="flex flex-col items-center mb-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 relative ${
              isSuspended
                ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                : "bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059]"
            }`}>
              {isSuspended ? (
                <ShieldAlert className="w-10 h-10" />
              ) : (
                <Clock className="w-10 h-10 animate-pulse" />
              )}
              <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 ${
                isDarkMode ? "border-[#111317]" : "border-white"
              } ${isSuspended ? "bg-rose-500" : "bg-[#C5A059] animate-ping"}`} />
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isSuspended
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                : "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isSuspended ? "bg-rose-500" : "bg-[#C5A059] animate-pulse"}`} />
              {isSuspended ? "HESAP ASKIYA ALINDI" : "BAŞVURU İNCELEMEDE"}
            </div>
          </div>

          {/* User Request Verbatim Headline */}
          <h1 className={`text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-snug mb-3 ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}>
            {isSuspended ? (
              "Hesabınız Geçici Olarak Askıya Alınmıştır"
            ) : (
              "Başvurunuz alınmıştır. Yönetici onayının ardından sisteminiz aktif edilecektir."
            )}
          </h1>

          {/* Subtext */}
          <p className={`text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-8 ${
            isDarkMode ? "text-neutral-400" : "text-slate-600"
          }`}>
            {isSuspended
              ? "Atölye hesabınız yönetici tarafından durdurulmuştur. Destek ekibimizle iletişime geçerek detaylı bilgi alabilirsiniz."
              : "Atölye kayıt talebiniz sistem yöneticilerimize iletildi. Yetkilendirme incelemesinin ardından simülatör, üretim dökümleri ve atölye araçları erişiminize açılacaktır."}
          </p>

          {/* Notification Message if refresh triggered */}
          {refreshMessage && (
            <div className="mb-6 p-3 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] text-xs font-medium flex items-center justify-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{refreshMessage}</span>
            </div>
          )}

          {/* Submitted Tenant Summary Card */}
          {tenant && (
            <div className={`text-left p-4 sm:p-5 rounded-2xl border mb-8 ${
              isDarkMode ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  Kayıtlı Atölye Bilgileri
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                  Statü: {tenant.status || "pending"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Firma Adı:</span>
                  <span className="font-bold truncate block">{tenant.name || "Belirtilmedi"}</span>
                </div>
                {tenant.trade_title && (
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Resmi Unvan:</span>
                    <span className="font-medium truncate block">{tenant.trade_title}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-neutral-400 block flex items-center gap-1">
                    <User className="w-3 h-3" /> Yetkili / E-posta:
                  </span>
                  <span className="font-mono text-[11px] truncate block text-neutral-300">
                    {user?.email || tenant.email || "Belirtilmedi"}
                  </span>
                </div>
                {tenant.phone && (
                  <div>
                    <span className="text-[10px] text-neutral-400 block flex items-center gap-1">
                      <Phone className="w-3 h-3" /> İletişim Telefonu:
                    </span>
                    <span className="font-mono text-[11px] truncate block">{tenant.phone}</span>
                  </div>
                )}
                {tenant.city && (
                  <div>
                    <span className="text-[10px] text-neutral-400 block flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Şehir:
                    </span>
                    <span className="truncate block">{tenant.city}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#b08b47] hover:from-[#b08b47] hover:to-[#9a783b] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#C5A059]/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Kontrol Ediliyor..." : "Durumu Yenile & Kontrol Et"}</span>
            </button>

            <button
              type="button"
              onClick={signOut}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl border text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isDarkMode 
                  ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300" 
                  : "border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Oturumu Kapat</span>
            </button>

            {/* AI Studio Geliştirici & Tasarım Düzenleme Butonu (Sadece DEV Ortamında) */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => {
                  enterDevMode();
                  navigate("/");
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#C5A059]/40 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>AI Studio Tasarım Düzenle</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 px-6 text-center text-xs border-t ${
        isDarkMode ? "border-white/5 text-neutral-500" : "border-slate-200 text-slate-400"
      }`}>
        <p className="flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          Aktivasyon süreciyle ilgili sorularınız için sistem yöneticinizle irtibata geçebilirsiniz.
        </p>
      </footer>
    </div>
  );
};
