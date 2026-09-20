import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthGuard } from "../context/AuthGuardContext";
import { ShieldCheck, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { tenantStatus, isLoading, isDarkMode, isDevMode } = useAuthGuard();
  const location = useLocation();

  if (isDevMode) {
    return <>{children}</>;
  }

  if (isLoading || tenantStatus === "loading") {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-6 ${
        isDarkMode ? "bg-[#0b0c0e] text-white" : "bg-[#f8f9fa] text-slate-900"
      }`}>
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mb-5 shadow-lg shadow-[#C5A059]/5">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
            <span className="text-sm font-bold tracking-wide uppercase">Yetkiler Doğrulanıyor</span>
          </div>
          <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
            Atölye kaydınız ve erişim izinleriniz kontrol ediliyor, lütfen bekleyiniz...
          </p>
        </div>
      </div>
    );
  }

  if (tenantStatus === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (tenantStatus === "needs_onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (tenantStatus === "pending" || tenantStatus === "suspended") {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};
