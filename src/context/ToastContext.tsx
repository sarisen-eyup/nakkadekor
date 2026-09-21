import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  duration?: number;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, options?: ToastOptions) => void;
  toast: {
    success: (message: string, options?: ToastOptions | string) => void;
    error: (message: string, options?: ToastOptions | string) => void;
    warning: (message: string, options?: ToastOptions | string) => void;
    info: (message: string, options?: ToastOptions | string) => void;
  };
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global dispatcher to allow calling toast outside of React hooks if needed
let globalToastDispatcher: ((type: ToastType, message: string, options?: ToastOptions) => void) | null = null;

export const toast = {
  success: (message: string, options?: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    if (globalToastDispatcher) {
      globalToastDispatcher("success", message, opts);
    } else {
      console.log("[Toast fallback: success]", message);
    }
  },
  error: (message: string, options?: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    if (globalToastDispatcher) {
      globalToastDispatcher("error", message, opts);
    } else {
      console.error("[Toast fallback: error]", message);
    }
  },
  warning: (message: string, options?: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    if (globalToastDispatcher) {
      globalToastDispatcher("warning", message, opts);
    } else {
      console.warn("[Toast fallback: warning]", message);
    }
  },
  info: (message: string, options?: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    if (globalToastDispatcher) {
      globalToastDispatcher("info", message, opts);
    } else {
      console.info("[Toast fallback: info]", message);
    }
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const duration = options?.duration ?? (type === "error" ? 5500 : 4000);
    const newItem: ToastItem = {
      id,
      type,
      message,
      title: options?.title,
      duration,
      createdAt: Date.now()
    };

    setToasts((prev) => [newItem, ...prev.slice(0, 4)]); // Keep maximum 5 concurrent toasts
  }, []);

  useEffect(() => {
    globalToastDispatcher = showToast;
    return () => {
      globalToastDispatcher = null;
    };
  }, [showToast]);

  const toastMethods = useRef({
    success: (message: string, options?: ToastOptions | string) => {
      const opts = typeof options === "string" ? { title: options } : options;
      showToast("success", message, opts);
    },
    error: (message: string, options?: ToastOptions | string) => {
      const opts = typeof options === "string" ? { title: options } : options;
      showToast("error", message, opts);
    },
    warning: (message: string, options?: ToastOptions | string) => {
      const opts = typeof options === "string" ? { title: options } : options;
      showToast("warning", message, opts);
    },
    info: (message: string, options?: ToastOptions | string) => {
      const opts = typeof options === "string" ? { title: options } : options;
      showToast("info", message, opts);
    }
  }).current;

  return (
    <ToastContext.Provider
      value={{
        showToast,
        toast: toastMethods,
        dismissToast,
        clearAllToasts
      }}
    >
      {children}

      {/* Global Toast Container - en az z-[9999], burada z-[99999] ile tüm modal ve katmanların en üstünde */}
      <div 
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2.5rem)] sm:max-w-md w-full"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismissToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{ item: ToastItem; onDismiss: () => void }> = ({ item, onDismiss }) => {
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / item.duration) * 100);
      setProgress(remainingPct);
      if (remainingPct <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [item.duration, onDismiss]);

  // Kurumsal Kimlik & Yüksek Kontrast Tasarım Yapısı
  const getVariantStyles = () => {
    switch (item.type) {
      case "success":
        return {
          cardBg: "bg-[#0b1411]/98 border-emerald-500/40 border-l-[5px] border-l-emerald-400 shadow-[0_12px_36px_rgba(16,185,129,0.22)]",
          iconContainer: "bg-emerald-500/20 border-emerald-500/35 text-emerald-400",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          titleColor: "text-emerald-300 font-bold",
          progressBar: "bg-emerald-400"
        };
      case "error":
        return {
          cardBg: "bg-[#160c0f]/98 border-rose-500/40 border-l-[5px] border-l-rose-500 shadow-[0_12px_36px_rgba(244,63,94,0.24)]",
          iconContainer: "bg-rose-500/20 border-rose-500/35 text-rose-400",
          icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
          titleColor: "text-rose-300 font-bold",
          progressBar: "bg-rose-500"
        };
      case "warning":
        return {
          cardBg: "bg-[#17130b]/98 border-amber-500/40 border-l-[5px] border-l-amber-400 shadow-[0_12px_36px_rgba(245,158,11,0.22)]",
          iconContainer: "bg-amber-500/20 border-amber-500/35 text-amber-400",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          titleColor: "text-amber-300 font-bold",
          progressBar: "bg-amber-400"
        };
      case "info":
      default:
        return {
          cardBg: "bg-[#14120e]/98 border-[#C5A059]/50 border-l-[5px] border-l-[#C5A059] shadow-[0_12px_36px_rgba(197,160,89,0.24)]",
          iconContainer: "bg-[#C5A059]/20 border-[#C5A059]/40 text-[#FAE2B3]",
          icon: <Info className="w-5 h-5 text-[#FAE2B3]" />,
          titleColor: "text-[#FAE2B3] font-bold",
          progressBar: "bg-[#C5A059]"
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300 transform translate-y-0 opacity-100 p-3.5 sm:p-4 text-white flex items-start gap-3.5 select-none ${v.cardBg}`}
    >
      {/* Icon Badge */}
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${v.iconContainer}`}>
        {v.icon}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pr-1">
        {item.title && (
          <h4 className={`text-xs uppercase tracking-wider mb-0.5 ${v.titleColor}`}>
            {item.title}
          </h4>
        )}
        <p className="text-xs sm:text-[13px] font-medium text-neutral-100 leading-snug break-words">
          {item.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Bildirimi kapat"
        className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar Timer */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${v.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // If used outside provider, return graceful fallback backed by global toast
    return {
      showToast: (type: ToastType, message: string, options?: ToastOptions) => {
        toast[type](message, options);
      },
      toast,
      dismissToast: () => {},
      clearAllToasts: () => {}
    };
  }
  return context;
};
