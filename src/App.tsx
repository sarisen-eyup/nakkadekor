import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  Upload, 
  Download, 
  Sparkles, 
  Maximize2, 
  Sliders, 
  Info, 
  Grid, 
  RefreshCw, 
  Image as ImageIcon, 
  Check, 
  ChevronRight, 
  HelpCircle, 
  BookOpen,
  ArrowRight,
  Settings,
  Layers,
  Calculator,
  Scissors,
  Database,
  DollarSign,
  Tag,
  Crop,
  Scan,
  Sun,
  Moon,
  X,
  Lock,
  Unlock,
  KeyRound,
  Shield,
  Truck,
  Store,
  Phone,
  User,
  Calendar,
  Palette,
  ArrowLeftRight,
  CheckCircle2,
  FileText,
  Archive,
  LogOut,
  Coins,
  Printer,
  Home,
  Move,
  RotateCcw,
  Loader2,
  Plus,
  AlertTriangle,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { SettingsModal } from "./components/SettingsModal";
import { CostBreakdownModal } from "./components/CostBreakdownModal";
import { CuttingListModal } from "./components/CuttingListModal";
import { FrameProfileSelector } from "./components/FrameProfileSelector";
import { ImageCropModal } from "./components/ImageCropModal";
import { ArtworkStep } from "./components/ArtworkStep";
import { FramingStep } from "./components/FramingStep";
import { OrderStep } from "./components/OrderStep";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthGuardProvider, useAuthGuard } from "./context/AuthGuardContext";
import { useToast } from "./context/ToastContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { PendingApprovalScreen } from "./components/PendingApprovalScreen";
import { LoginScreen } from "./components/LoginScreen";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { AccountModal } from "./components/AccountModal";
import { CreditIndicator } from "./components/CreditIndicator";
import { OrderArchiveModal } from "./components/OrderArchiveModal";
import { PrintCenterModal } from "./components/PrintCenterModal";
import { CustomerWallPreviewModal } from "./components/CustomerWallPreviewModal";
import { exportAndDownloadHD } from "./utils/hdCanvasExporter";
import { DEFAULT_ROOM_TEMPLATES } from "./types/roomPreview";
import { initGlobalDragScroll } from "./utils/dragScroll";
import { 
  UnitPricesSettings, 
  FrameProfileItem, 
  CostCalculationBreakdown, 
  CompleteCutList,
  MaterialInclusionFlags,
  DEFAULT_PASPARTU_COLORS,
  CompanyProfile,
  UserAccount,
  SubscriptionData,
  OrderArchiveItem,
  OrderStatus,
  PriceSnapshot,
  isProPlan,
  EMPTY_COMPANY_PROFILE,
  DEFAULT_FRAME_PROFILES
} from "./types/pricing";
import { 
  fetchFrameProfilesFromSupabase, 
  fetchOrdersFromSupabase, 
  fetchTenantSettingsFromSupabase,
  fetchVisualizationsFromSupabase,
  createVisualizationInSupabase,
  createOrderInSupabase,
  deleteOrderFromSupabase,
  updateOrderStatusInSupabase,
  saveTenantSettingsToSupabase,
  fetchCompanyProfileFromSupabase,
  uploadImageToSupabaseStorage,
  deductTenantCreditInSupabase,
  TenantCreditsResult
} from "./services/supabaseService";
import { compressImage } from "./utils/imageCompressor";
import { 
  isSupabaseConfigured,
  supabase,
  setAuthenticatedTenantId,
  ensureTenantAndUserExist,
  getTenantId
} from "./lib/supabase";
import { 
  loadSettingsFromStorage, 
  saveSettingsToStorage, 
  loadProfilesFromStorage, 
  saveProfilesToStorage, 
  loadCompanyProfileFromStorage,
  saveCompanyProfileToStorage,
  loadUsersFromStorage,
  saveUsersToStorage,
  calculateCostsAndPricing, 
  generateCutList,
  generateOrderNumber,
  getPaspartuColorName,
  loadSubscriptionFromStorage,
  saveSubscriptionToStorage,
  deductSubscriptionCredit,
  loadOrdersArchiveFromStorage,
  saveArchiveOrdersToStorage,
  resolveOrderQuantity,
  addOrderToArchive,
  deleteOrderFromArchive,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
  clearAllUserTenantCache
} from "./utils/pricing";
import { 
  loadWorkspaceDraft, 
  saveWorkspaceDraft, 
  clearWorkspaceDraft 
} from "./utils/workspaceDraft";
import { 
  triggerImagePrintWindow, 
  triggerBackLabelPrintWindow, 
  triggerCuttingListPrintWindow, 
  triggerCostBreakdownPrintWindow 
} from "./utils/printHelper";

const NakkaLogo = ({ size = 36 }: { size?: number }) => (
  <img 
    src="/favicon.png" 
    alt="Nakka Dekor Logo" 
    width={size} 
    height={size} 
    style={{ width: size, height: size }}
    className="shrink-0 transition-transform duration-300 hover:scale-105 rounded-full object-contain shadow-sm"
  />
);

// Türkiye telefon numarası formatlayıcı (5XX XXX XX XX)
const formatTrPhone = (input: string): string => {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  let formatted = "";
  if (digits.length > 0) {
    formatted += digits.slice(0, 3);
  }
  if (digits.length > 3) {
    formatted += " " + digits.slice(3, 6);
  }
  if (digits.length > 6) {
    formatted += " " + digits.slice(6, 8);
  }
  if (digits.length > 8) {
    formatted += " " + digits.slice(8, 10);
  }
  return formatted;
};

const PaspartuColorPicker = ({
  label,
  selectedColor,
  onChangeColor,
  isDarkMode
}: {
  label: string;
  selectedColor: string;
  onChangeColor: (color: string) => void;
  isDarkMode: boolean;
}) => {
  const isPreset = DEFAULT_PASPARTU_COLORS.some(
    (c) => c.value.toLowerCase() === selectedColor.toLowerCase()
  );
  const colorName = getPaspartuColorName(selectedColor);

  return (
    <div className="space-y-2 mt-3 pt-2.5 border-t border-dashed border-slate-300 dark:border-neutral-700/60">
      <div className="flex items-center justify-between">
        <label className={`text-[10px] uppercase tracking-wider font-bold ${
          isDarkMode ? "text-neutral-300" : "text-slate-700"
        }`}>
          {label}
        </label>
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
          isDarkMode ? "text-[#C5A059] bg-[#C5A059]/10" : "text-[#B88E3A] bg-[#B88E3A]/10"
        }`}>
          {colorName}
        </span>
      </div>

      {/* Swatches Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {DEFAULT_PASPARTU_COLORS.map((item) => {
          const isSelected = selectedColor.toLowerCase() === item.value.toLowerCase();
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChangeColor(item.value)}
              className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all text-left cursor-pointer ${
                isSelected
                  ? (isDarkMode ? "border-[#C5A059] bg-[#C5A059]/20 font-bold shadow-sm" : "border-[#B88E3A] bg-[#B88E3A]/20 font-bold shadow-sm")
                  : (isDarkMode ? "border-[#2e3440] bg-[#181a1e] hover:border-neutral-500 text-neutral-300" : "border-slate-200 bg-white hover:border-slate-300 text-slate-700")
              }`}
              title={item.name}
            >
              {item.value === "transparent" ? (
                <span className="w-3.5 h-3.5 rounded-full border border-sky-400/80 bg-gradient-to-tr from-sky-300/40 via-white/80 to-sky-100/30 shrink-0 shadow-sm relative overflow-hidden">
                  <span className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.8)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.8)_75%,transparent_75%)] bg-[length:4px_4px] opacity-40" />
                </span>
              ) : (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0 shadow-inner"
                  style={{ backgroundColor: item.value }}
                />
              )}
              <span className="text-[10px] font-medium truncate leading-none">
                {item.name.split('/')[0].trim()}
              </span>
            </button>
          );
        })}

        {/* Custom Color Selector */}
        <div
          className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all relative cursor-pointer ${
            !isPreset
              ? (isDarkMode ? "border-[#C5A059] bg-[#C5A059]/20 font-bold shadow-sm" : "border-[#B88E3A] bg-[#B88E3A]/20 font-bold shadow-sm")
              : (isDarkMode ? "border-[#2e3440] bg-[#181a1e] hover:border-neutral-500 text-neutral-300" : "border-slate-200 bg-white hover:border-slate-300 text-slate-700")
          }`}
          title="Özel Paspartu Rengi Seç"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0 shadow-inner"
            style={{ backgroundColor: isPreset || selectedColor === "transparent" ? "#888888" : selectedColor }}
          />
          <span className="text-[10px] font-bold truncate leading-none">
            Özel
          </span>
          <input
            type="color"
            value={isPreset || selectedColor === "transparent" ? "#FAF9F5" : selectedColor}
            onChange={(e) => onChangeColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

function SimulatorMain() {
  const { 
    user: authGuardUser, 
    tenant: authGuardTenant, 
    signOut: authGuardSignOut, 
    refreshTenant,
    decrementCredit,
    incrementCredit
  } = useAuthGuard();
  const navigate = useNavigate();

  // Theme Mode State (AI Studio Dark default & Light mode toggle)
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("nakka_theme_mode");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  useEffect(() => {
    initGlobalDragScroll();
  }, []);

  useEffect(() => {
    localStorage.setItem("nakka_theme_mode", themeMode);
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [themeMode]);

  const isDarkMode = themeMode === "dark";

  // Tarihleri PostgreSQL / HTML5 uyumlu ISO (YYYY-MM-DD) formatına normalize eden yardımcı
  const normalizeDateToIso = (dStr?: string | null): string => {
    if (!dStr) return "";
    const trimmed = dStr.trim();
    if (trimmed.includes('.')) {
      const parts = trimmed.split('.');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 3 && parts[0].length <= 2) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return trimmed;
  };

  // Çalışma alanı taslağını (sekme değişimi veya arka plan belleğe alma durumları için) oku
  const initialDraft = loadWorkspaceDraft();

  // State management for custom visual configurator
  const [customPaintingUrl, setCustomPaintingUrl] = useState<string | null>(() => initialDraft?.customPaintingUrl ?? null);
  const [customPaintingFile, setCustomPaintingFile] = useState<string>(() => initialDraft?.customPaintingFile ?? "Henüz görsel seçilmedi");
  
  // Custom states for keyboard inputs (stored as string to prevent mid-typing lockups)
  const [widthInput, setWidthInput] = useState<string>(() => initialDraft?.widthInput ?? "50");
  const [heightInput, setHeightInput] = useState<string>(() => initialDraft?.heightInput ?? "70");
  
  // Custom frame profile uploader
  const [customFrameUrl, setCustomFrameUrl] = useState<string | null>(() => initialDraft?.customFrameUrl ?? null);
  const [customFrameFile, setCustomFrameFile] = useState<string>(() => initialDraft?.customFrameFile ?? "Çerçeve Seçilmedi");
  const [frameWidthInput, setFrameWidthInput] = useState<string>(() => initialDraft?.frameWidthInput ?? "4.0");
  const [matWidthInput, setMatWidthInput] = useState<string>(() => initialDraft?.matWidthInput ?? "0"); // Default 0.0 cm (Paspartusuz)

  // Custom outer frame profile uploader
  const [customOuterFrameUrl, setCustomOuterFrameUrl] = useState<string | null>(() => initialDraft?.customOuterFrameUrl ?? null);
  const [customOuterFrameFile, setCustomOuterFrameFile] = useState<string>(() => initialDraft?.customOuterFrameFile ?? "Yok");
  const [outerFrameWidthInput, setOuterFrameWidthInput] = useState<string>(() => initialDraft?.outerFrameWidthInput ?? "0.0"); // Default 0.0 cm (disabled/hidden)
  const [outerFrameLayoutMode, setOuterFrameLayoutMode] = useState<string>(() => initialDraft?.outerFrameLayoutMode ?? "repeat"); // "miter-stretch" or "repeat"
  const [middleMatWidthInput, setMiddleMatWidthInput] = useState<string>(() => initialDraft?.middleMatWidthInput ?? "0.0"); // Default 0.0 cm (3D Paspartusuz)
  const [innerMatColor, setInnerMatColor] = useState<string>(() => initialDraft?.innerMatColor ?? "#FAF9F5"); // İç paspartu rengi (Varsayılan Krem)
  const [outerMatColor, setOuterMatColor] = useState<string>(() => initialDraft?.outerMatColor ?? "#FAF9F5"); // Dış/Ara paspartu rengi (Varsayılan Krem)
  const [deliveryMethod, setDeliveryMethod] = useState<"store" | "shipping">(() => initialDraft?.deliveryMethod ?? "store");
  const [customerName, setCustomerName] = useState<string>(() => initialDraft?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState<string>(() => initialDraft?.customerPhone ?? "");
  const [deliveryDate, setDeliveryDate] = useState<string>(() => initialDraft?.deliveryDate ?? "");
  // Sipariş Adedi: Her zaman temiz varsayılan olarak 1 ile başlar, tarayıcıda asılı kalmaz.
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [customerNameError, setCustomerNameError] = useState<boolean>(false);
  const [customerPhoneError, setCustomerPhoneError] = useState<boolean>(false);
  const [deliveryDateError, setDeliveryDateError] = useState<boolean>(false);
  const [deliveryDateErrorMessage, setDeliveryDateErrorMessage] = useState<string | null>(null);
  const [loadedOrderOriginalDeliveryDate, setLoadedOrderOriginalDeliveryDate] = useState<string | null>(null);

  // Pricing, Database & Modal States
  const [unitPricesSettings, setUnitPricesSettings] = useState<UnitPricesSettings>(() => loadSettingsFromStorage());
  const [frameProfiles, setFrameProfiles] = useState<FrameProfileItem[]>(() => loadProfilesFromStorage());
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => loadCompanyProfileFromStorage());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => loadUsersFromStorage());
  const [activeUser, setActiveUser] = useState<UserAccount>(() => {
    const list = loadUsersFromStorage();
    return list[0];
  });
  const [customOverridePrice, setCustomOverridePrice] = useState<number | null>(() => initialDraft?.customOverridePrice ?? null);

  const [orderNumber, setOrderNumber] = useState<string>(() => initialDraft?.orderNumber ?? generateOrderNumber());
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => initialDraft?.activeOrderId ?? null);
  const [activeOrderCreatedAt, setActiveOrderCreatedAt] = useState<string | null>(null);
  const { toast } = useToast();
  const setToastMessage = (msg: { text: string; type?: "success" | "info" | "error" | "warning" } | null) => {
    if (!msg) return;
    if (msg.type === "error") toast.error(msg.text);
    else if (msg.type === "info") toast.info(msg.text);
    else if (msg.type === "warning") toast.warning(msg.text);
    else toast.success(msg.text);
  };
  const [isSchemaPending, setIsSchemaPending] = useState<boolean>(false);

  const [activeSidebarTab, setActiveSidebarTab] = useState<"artwork" | "framing" | "materials" | "all">("artwork");
  const [inclusionFlags, setInclusionFlags] = useState<MaterialInclusionFlags>(() => initialDraft?.inclusionFlags ?? {
    includeArtworkPrint: false,
    includeInnerMat: false,
    includeInnerFrame: true,
    includeMiddleMat: false,
    includeOuterFrame: false,
    includeGlass: false,
    includeBackingBoard: false,
    includeBackingCloth: false,
    includeKraftTape: false,
    includeBackingPaper: false,
    includeLaborCost: true
  });

  const handleToggleFlag = (flagKey: keyof MaterialInclusionFlags) => {
    setInclusionFlags(prev => {
      if (flagKey === 'includeBackingPaper' || flagKey === 'includeBackingCloth') {
        const nextVal = !prev.includeBackingCloth;
        return {
          ...prev,
          includeBackingCloth: nextVal,
          includeBackingPaper: nextVal,
          includeKraftTape: false,
        };
      }
      return {
        ...prev,
        [flagKey]: !prev[flagKey]
      };
    });
  };

  const [selectedInnerProfileId, setSelectedInnerProfileId] = useState<string>("");
  const [selectedOuterProfileId, setSelectedOuterProfileId] = useState<string>("");

  // Shop Privacy & PIN Protection State (controlled from Settings)
  const [isShopMode, setIsShopMode] = useState<boolean>(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<"prices" | "profiles" | "privacy">("prices");
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false);
  const [isCutListModalOpen, setIsCutListModalOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountModalInitialTab, setAccountModalInitialTab] = useState<"company" | "credits">("company");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isPrintCenterModalOpen, setIsPrintCenterModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isOrderModifiedWarningOpen, setIsOrderModifiedWarningOpen] = useState<boolean>(false);
  const [confirmResetAction, setConfirmResetAction] = useState<
    | { type: "new" }
    | { type: "load"; order: OrderArchiveItem; options?: { autoPrint?: "order_form" | "cutting_list" | "label" | "cost" } }
    | null
  >(null);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [revisionNote, setRevisionNote] = useState<string>("");
  const [referencedOrderNumber, setReferencedOrderNumber] = useState<string>("");
  const [loadedOrderStatus, setLoadedOrderStatus] = useState<OrderStatus | null>(null);
  const [loadedPriceSnapshot, setLoadedPriceSnapshot] = useState<PriceSnapshot | null>(null);

  const [loadedOrderSnapshot, setLoadedOrderSnapshot] = useState<{
    orderNumber: string;
    orderId: string;
    customerName: string;
    customerPhone: string;
    deliveryDate: string;
    deliveryMethod: "store" | "shipping";
    orderQuantity: number;
    artworkWidth: number;
    artworkHeight: number;
    customPaintingUrl: string | null;
    selectedInnerProfileId: string;
    frameWidth: number;
    selectedOuterProfileId: string;
    outerFrameWidth: number;
    matWidth: number;
    middleMatWidth: number;
    innerMatColor: string;
    outerMatColor: string;
    inclusionFlags: MaterialInclusionFlags;
    customOverridePrice: number | null;
    status?: OrderStatus;
  } | null>(null);

  // B2B Subscription, Order Archive, and Session state
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>(() => loadSubscriptionFromStorage());
  const [archiveOrders, setArchiveOrders] = useState<OrderArchiveItem[]>(() => loadOrdersArchiveFromStorage());
  const [pendingAutoPrint, setPendingAutoPrint] = useState<"order_form" | "cutting_list" | "label" | "cost" | null>(null);

  // Arşiv siparişleri güncellendiğinde yerel depolamayı her zaman güncel tut
  useEffect(() => {
    if (archiveOrders) {
      saveArchiveOrdersToStorage(archiveOrders);
    }
  }, [archiveOrders]);
  
  // Derived state: Is the current order saved/created in archive or Supabase?
  const isOrderCreated = Boolean(activeOrderId || archiveOrders.some(o => o.orderNumber === orderNumber));

  // Sekmeler arası geçişlerde ve olası sayfa yenilemelerinde çalışma alanını otomatik koruma
  useEffect(() => {
    const timer = setTimeout(() => {
      saveWorkspaceDraft({
        customPaintingUrl,
        customPaintingFile,
        widthInput,
        heightInput,
        customFrameUrl,
        customFrameFile,
        frameWidthInput,
        matWidthInput,
        customOuterFrameUrl,
        customOuterFrameFile,
        outerFrameWidthInput,
        outerFrameLayoutMode,
        middleMatWidthInput,
        innerMatColor,
        outerMatColor,
        deliveryMethod,
        customerName,
        customerPhone,
        deliveryDate,
        selectedInnerProfileId,
        selectedOuterProfileId,
        inclusionFlags,
        orderNumber,
        activeOrderId,
        customOverridePrice,
        timestamp: Date.now()
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    customPaintingUrl,
    customPaintingFile,
    widthInput,
    heightInput,
    customFrameUrl,
    customFrameFile,
    frameWidthInput,
    matWidthInput,
    customOuterFrameUrl,
    customOuterFrameFile,
    outerFrameWidthInput,
    outerFrameLayoutMode,
    middleMatWidthInput,
    innerMatColor,
    outerMatColor,
    deliveryMethod,
    customerName,
    customerPhone,
    deliveryDate,
    selectedInnerProfileId,
    selectedOuterProfileId,
    inclusionFlags,
    orderNumber,
    activeOrderId,
    customOverridePrice
  ]);

  const [authSession, setAuthSession] = useState<{
    isLoggedIn: boolean;
    userId: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
    rememberMe: boolean;
    loginTime: string;
  } | null>(() => loadAuthSession());

  // Supabase Auth Guard ile oturum ve kullanıcıyı senkronize et
  useEffect(() => {
    if (authGuardUser && (!authSession || !authSession.isLoggedIn)) {
      const u = authGuardUser;
      const userObj: UserAccount = {
        id: u.id,
        fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Atölye Yöneticisi",
        username: u.email?.split("@")[0] || "yonetici",
        email: u.email || "",
        role: "admin",
        avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || "",
        phone: u.user_metadata?.phone || "",
        isEmailVerified: true,
        status: "active",
        lastLoginAt: "Şimdi (Aktif Oturum)"
      };
      setActiveUser(userObj);
      const session = {
        isLoggedIn: true,
        userId: userObj.id,
        email: userObj.email,
        username: userObj.username,
        fullName: userObj.fullName,
        role: userObj.role,
        rememberMe: true,
        loginTime: new Date().toISOString()
      };
      saveAuthSession(session);
      setAuthSession(session);
    }
  }, [authGuardUser, authSession]);

  // Atölyenin Supabase public.tenants tablosundaki gerçek kredi verisini senkronize et
  useEffect(() => {
    if (authGuardTenant) {
      const tier = String(authGuardTenant.subscription_tier || "").toLowerCase().trim();
      const isUnlimited = tier === "unlimited" || tier.includes("unlimited") || tier === "unlimited_enterprise";
      const remaining = Number(authGuardTenant.remaining_credits ?? 0);
      const total = Number(authGuardTenant.total_credits ?? 0);
      const pending = Number(authGuardTenant.pending_credits ?? 0);
      const subTier = authGuardTenant.subscription_tier || "pay_as_you_go";
      const targetStatus = isUnlimited ? "active" : remaining <= 0 ? "exhausted" : remaining < 15 ? "expiring_soon" : "active";

      setSubscriptionData(prev => {
        if (
          prev.remainingCredits === remaining &&
          prev.totalCredits === total &&
          prev.pendingCredits === pending &&
          prev.subscriptionTier === subTier &&
          prev.isUnlimited === isUnlimited &&
          prev.status === targetStatus
        ) {
          return prev;
        }
        return {
          ...prev,
          remainingCredits: remaining,
          totalCredits: total,
          pendingCredits: pending,
          subscriptionTier: subTier,
          isUnlimited,
          status: targetStatus
        };
      });
    }
  }, [
    authGuardTenant?.id,
    authGuardTenant?.remaining_credits,
    authGuardTenant?.total_credits,
    authGuardTenant?.pending_credits,
    authGuardTenant?.subscription_tier
  ]);

  const handleCreditUpdate = useCallback((info: TenantCreditsResult) => {
    setSubscriptionData(prev => {
      const nextStatus = info.isUnlimited ? "active" : info.remainingCredits <= 0 ? "exhausted" : info.remainingCredits < 15 ? "expiring_soon" : "active";
      if (
        prev.remainingCredits === info.remainingCredits &&
        prev.totalCredits === info.totalCredits &&
        prev.pendingCredits === info.pendingCredits &&
        prev.subscriptionTier === info.subscriptionTier &&
        prev.isUnlimited === info.isUnlimited &&
        prev.status === nextStatus
      ) {
        return prev;
      }
      return {
        ...prev,
        remainingCredits: info.remainingCredits,
        totalCredits: info.totalCredits,
        pendingCredits: info.pendingCredits,
        subscriptionTier: info.subscriptionTier,
        isUnlimited: info.isUnlimited,
        status: nextStatus
      };
    });
  }, []);

  const handleLoginSuccess = (user: UserAccount, rememberMe: boolean) => {
    setActiveUser(user);
    const session = {
      isLoggedIn: true,
      userId: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      rememberMe: rememberMe,
      loginTime: new Date().toISOString()
    };
    saveAuthSession(session);
    setAuthSession(session);
  };

  const handleRegisterCompany = (newCompany: CompanyProfile, adminUser: UserAccount) => {
    setCompanyProfile(newCompany);
    saveCompanyProfileToStorage(newCompany);

    const updatedUsers = [adminUser, ...userAccounts.filter(u => u.email.toLowerCase() !== adminUser.email.toLowerCase())];
    setUserAccounts(updatedUsers);
    saveUsersToStorage(updatedUsers);

    setActiveUser(adminUser);
    const session = {
      isLoggedIn: true,
      userId: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
      fullName: adminUser.fullName,
      role: adminUser.role,
      rememberMe: true,
      loginTime: new Date().toISOString()
    };
    saveAuthSession(session);
    setAuthSession(session);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signout warning:", err);
      }
    }
    await authGuardSignOut();
    clearAuthSession();
    clearAllUserTenantCache();
    clearWorkspaceDraft();
    setOrderQuantity(1);
    setAuthSession(null);
    setFrameProfiles([]);
    setCompanyProfile(EMPTY_COMPANY_PROFILE);
    setArchiveOrders([]);
    setCustomPaintingUrl(null);
    setCustomPaintingFile("Henüz görsel seçilmedi");
    handleResetSimulator();
    navigate("/login");
  };

  const handleContinueAsGuest = () => {
    if (!import.meta.env.DEV) {
      console.warn("Guest mode is only available in development environment.");
      return;
    }
    const defaultUser: UserAccount = userAccounts[0] || {
      id: "dev_admin",
      email: "yonetici@nakka.com",
      username: "yonetici",
      fullName: "Geliştirici & Tasarımcı",
      role: "admin",
      isEmailVerified: true,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0]
    };
    setActiveUser(defaultUser);
    const session = {
      isLoggedIn: true,
      userId: defaultUser.id,
      email: defaultUser.email,
      username: defaultUser.username,
      fullName: defaultUser.fullName,
      role: defaultUser.role,
      rememberMe: true,
      loginTime: new Date().toISOString()
    };
    saveAuthSession(session);
    setAuthSession(session);

    // Önizleme ve test için kayıtlı profiller varsa yükle
    const storedProfiles = loadProfilesFromStorage();
    if (storedProfiles && storedProfiles.length > 0) {
      setFrameProfiles(storedProfiles);
    }
  };

  const handleDeleteArchiveOrder = (orderId: string) => {
    setArchiveOrders(prev => prev.filter(o => o.id !== orderId));
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await deleteOrderFromSupabase(orderId);
          if (error) {
            console.warn("Supabase deleteOrder warning:", error);
          }
        } catch (err) {
          console.warn("Supabase deleteOrder exception:", err);
        }
      })();
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setArchiveOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      return updated;
    });
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await updateOrderStatusInSupabase(orderId, newStatus);
          if (error) {
            console.warn("Supabase updateOrderStatus warning:", error);
          }
        } catch (err) {
          console.warn("Supabase updateOrderStatus exception:", err);
        }
      })();
    }
  };

  // Supabase Auth State listener & auto-session restoration
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // 1. Check existing Supabase session immediately
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Supabase getSession warning:", error.message);
          return;
        }
        const session = data?.session;
        if (session?.user) {
          setAuthenticatedTenantId(session.user.id);
          const name =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Atölye Kullanıcısı";

          const userAccount: UserAccount = {
            id: session.user.id,
            email: session.user.email || "",
            username: session.user.email?.split("@")[0] || "kullanici",
            fullName: name,
            role: "admin",
            isEmailVerified: true,
            status: "active",
            createdAt: new Date().toISOString().split("T")[0]
          };

          setActiveUser(userAccount);
          const sess = {
            isLoggedIn: true,
            userId: session.user.id,
            email: userAccount.email,
            username: userAccount.username,
            fullName: userAccount.fullName,
            role: userAccount.role,
            rememberMe: true,
            loginTime: new Date().toISOString()
          };
          saveAuthSession(sess);
          setAuthSession(sess);
          await ensureTenantAndUserExist(session.user);
        }
      } catch (err) {
        console.warn("Supabase session check exception:", err);
      }
    })();

    // 2. Listen to ongoing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthenticatedTenantId(session.user.id);
        await ensureTenantAndUserExist(session.user);

        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "Atölye Kullanıcısı";

        const userAccount: UserAccount = {
          id: session.user.id,
          email: session.user.email || "",
          username: session.user.email?.split("@")[0] || "kullanici",
          fullName: name,
          role: "admin",
          isEmailVerified: true,
          status: "active",
          createdAt: new Date().toISOString().split("T")[0]
        };

        setActiveUser(userAccount);
        const sess = {
          isLoggedIn: true,
          userId: session.user.id,
          email: userAccount.email,
          username: userAccount.username,
          fullName: userAccount.fullName,
          role: userAccount.role,
          rememberMe: true,
          loginTime: new Date().toISOString()
        };
        saveAuthSession(sess);
        setAuthSession(sess);
      } else if (event === "SIGNED_OUT") {
        clearAuthSession();
        clearAllUserTenantCache();
        setAuthSession(null);
        setFrameProfiles([]);
        setCompanyProfile(EMPTY_COMPANY_PROFILE);
        setArchiveOrders([]);
        setCustomPaintingUrl(null);
        setCustomPaintingFile("Henüz görsel seçilmedi");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ProtectedRoute: Geçerli oturum yoksa /app veya /dashboard elle girilse dahi /login sayfasına fırlat
  useEffect(() => {
    if (typeof window === "undefined") return;

    const enforceProtectedRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const isProtectedPath = path.startsWith("/app") || path.startsWith("/dashboard");

      if (!authSession?.isLoggedIn && isProtectedPath) {
        // Oturum açılmamışken korumalı yollara erişim engellenir
        if (window.location.pathname !== "/login") {
          window.history.replaceState(null, "", "/login");
        }
      } else if (authSession?.isLoggedIn && path === "/login") {
        // Oturum açıkken /login sayfasına gidilirse ana uygulamaya (/app) yönlendir
        window.history.replaceState(null, "", "/app");
      }
    };

    enforceProtectedRoute();
    window.addEventListener("popstate", enforceProtectedRoute);
    return () => {
      window.removeEventListener("popstate", enforceProtectedRoute);
    };
  }, [authSession?.isLoggedIn]);

  // Supabase Cloud Sync (Runs when user is logged in or tenant changes)
  useEffect(() => {
    if (!isSupabaseConfigured() || !authSession?.isLoggedIn) return;
    let isMounted = true;

    // 1. Fetch Cloud Frame Profiles for this tenant (Doğrudan Supabase'den çekilir; sadece kullanıcının yüklediği çerçeveler gelir)
    fetchFrameProfilesFromSupabase().then(({ data, isSchemaMissing }) => {
      if (!isMounted) return;
      if (data) {
        setFrameProfiles(data);
      }
      if (isSchemaMissing) {
        setIsSchemaPending(true);
      }
    });

    // 2. Fetch Cloud Orders Archive for this tenant (Doğrudan Supabase'den çekilir)
    fetchOrdersFromSupabase().then(({ data, error }) => {
      if (!isMounted) return;
      if (data && !error) {
        setArchiveOrders(data);
      }
    });

    // 3. Fetch Tenant Settings
    fetchTenantSettingsFromSupabase().then(({ data, error }) => {
      if (!isMounted) return;
      if (data && !error) {
        setUnitPricesSettings(data);
        saveSettingsToStorage(data);
      }
    });

    // 4. Fetch Cloud Visualizations for this tenant
    fetchVisualizationsFromSupabase().then(({ data, error }) => {
      if (!isMounted) return;
      if (data && !error && data.length > 0) {
        const latest = data[0];
        if (latest.image_url) {
          setCustomPaintingUrl(latest.image_url);
          if (latest.title) setCustomPaintingFile(latest.title);
          if (latest.artwork_width_cm) setWidthInput(String(latest.artwork_width_cm));
          if (latest.artwork_height_cm) setHeightInput(String(latest.artwork_height_cm));
        }
      }
    });

    // 5. Fetch Company Profile (White-Label) for this tenant
    fetchCompanyProfileFromSupabase().then(({ data, error }) => {
      if (!isMounted) return;
      if (data && !error) {
        setCompanyProfile(data);
        saveCompanyProfileToStorage(data);
      } else {
        setCompanyProfile(EMPTY_COMPANY_PROFILE);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [authSession?.userId, authSession?.isLoggedIn]);

  const handleUpdateSubscription = (sub: SubscriptionData) => {
    setSubscriptionData(sub);
    saveSubscriptionToStorage(sub);
  };

  // Computed numeric values with fallback to prevent graphics breaking
  const artworkWidth = Math.max(1, parseFloat(widthInput) || 50);
  const artworkHeight = Math.max(1, parseFloat(heightInput) || 70);
  const frameWidth = Math.max(0, parseFloat(frameWidthInput) || 0);
  const outerFrameWidth = Math.max(0, parseFloat(outerFrameWidthInput) || 0);
  const middleMatWidth = Math.max(0, parseFloat(middleMatWidthInput) || 0);
  const matWidth = Math.max(0, parseFloat(matWidthInput) || 0);

  // Active profiles
  const activeInnerProfile = frameProfiles.find(p => p.id === selectedInnerProfileId);
  const activeOuterProfile = frameProfiles.find(p => p.id === selectedOuterProfileId);

  // Dynamic flags synchronized with dimensions (paspartu, 3d paspartu, outer frame automatically enabled when > 0)
  const effectiveInclusionFlags: MaterialInclusionFlags = {
    ...inclusionFlags,
    includeInnerMat: matWidth > 0 && inclusionFlags.includeInnerMat,
    includeMiddleMat: middleMatWidth > 0 && inclusionFlags.includeMiddleMat,
    includeOuterFrame: outerFrameWidth > 0 && selectedOuterProfileId !== "" && inclusionFlags.includeOuterFrame,
    includeInnerFrame: frameWidth > 0 && inclusionFlags.includeInnerFrame,
  };

  const activeInnerRabbetMm = activeInnerProfile?.rabbetDepthMm ?? activeInnerProfile?.rabbet_depth ?? 6;
  const activeOuterRabbetMm = activeOuterProfile?.rabbetDepthMm ?? activeOuterProfile?.rabbet_depth ?? 6;

  // Compute live Cost Breakdown
  const costBreakdown: CostCalculationBreakdown = calculateCostsAndPricing({
    artworkWidthCm: artworkWidth,
    artworkHeightCm: artworkHeight,
    matWidthCm: matWidth,
    frameWidthCm: frameWidth,
    middleMatWidthCm: middleMatWidth,
    outerFrameWidthCm: outerFrameWidth,
    innerMatColor: innerMatColor,
    outerMatColor: outerMatColor,
    selectedInnerProfileMeterPrice: activeInnerProfile?.unitPricePerMeter,
    selectedOuterProfileMeterPrice: activeOuterProfile?.unitPricePerMeter,
    innerRabbetDepthMm: activeInnerRabbetMm,
    outerRabbetDepthMm: activeOuterRabbetMm,
    customOverridePrice: customOverridePrice,
    deliveryMethod: deliveryMethod,
    settings: unitPricesSettings,
    flags: effectiveInclusionFlags
  });

  // Compute live Cut List
  const cutList: CompleteCutList = generateCutList({
    artworkWidthCm: artworkWidth,
    artworkHeightCm: artworkHeight,
    matWidthCm: matWidth,
    frameWidthCm: frameWidth,
    middleMatWidthCm: middleMatWidth,
    outerFrameWidthCm: outerFrameWidth,
    innerRabbetDepthMm: activeInnerRabbetMm,
    outerRabbetDepthMm: activeOuterRabbetMm,
    innerFrameCode: activeInnerProfile ? `${activeInnerProfile.code} (${activeInnerProfile.name})` : customFrameFile,
    outerFrameCode: activeOuterProfile ? `${activeOuterProfile.code} (${activeOuterProfile.name})` : customOuterFrameFile,
    innerMatColor: innerMatColor,
    outerMatColor: outerMatColor,
    orderNumber: orderNumber,
    flags: effectiveInclusionFlags
  });

  // 2. Maliyet Tablosu (Cost Table) Render Mantığı (Kural 2):
  // Arşivden eski bir sipariş yüklendiğinde, ekrandaki 'Maliyet Tablosu' bileşenini sistemin güncel (live)
  // malzeme fiyatlarından DEĞİL, siparişin içine kaydettiğimiz bu price_snapshot verisinden besle.
  const displayCostBreakdown: CostCalculationBreakdown = useMemo(() => {
    if (loadedPriceSnapshot) {
      return calculateCostsAndPricing({
        artworkWidthCm: artworkWidth,
        artworkHeightCm: artworkHeight,
        matWidthCm: matWidth,
        frameWidthCm: frameWidth,
        middleMatWidthCm: middleMatWidth,
        outerFrameWidthCm: outerFrameWidth,
        innerMatColor: innerMatColor,
        outerMatColor: outerMatColor,
        selectedInnerProfileMeterPrice: loadedPriceSnapshot.innerProfileMeterPrice ?? activeInnerProfile?.unitPricePerMeter,
        selectedOuterProfileMeterPrice: loadedPriceSnapshot.outerProfileMeterPrice ?? activeOuterProfile?.unitPricePerMeter,
        innerRabbetDepthMm: activeInnerRabbetMm,
        outerRabbetDepthMm: activeOuterRabbetMm,
        customOverridePrice: customOverridePrice,
        deliveryMethod: deliveryMethod,
        settings: loadedPriceSnapshot.unitPrices,
        flags: effectiveInclusionFlags
      });
    }
    return costBreakdown;
  }, [
    loadedPriceSnapshot,
    costBreakdown,
    artworkWidth,
    artworkHeight,
    matWidth,
    frameWidth,
    middleMatWidth,
    outerFrameWidth,
    innerMatColor,
    outerMatColor,
    activeInnerProfile?.unitPricePerMeter,
    activeOuterProfile?.unitPricePerMeter,
    activeInnerRabbetMm,
    activeOuterRabbetMm,
    customOverridePrice,
    deliveryMethod,
    effectiveInclusionFlags
  ]);

  const displayUnitPricesSettings: UnitPricesSettings = useMemo(() => {
    if (loadedPriceSnapshot) {
      return loadedPriceSnapshot.unitPrices;
    }
    return unitPricesSettings;
  }, [loadedPriceSnapshot, unitPricesSettings]);

  // Takip ve Değişiklik Kontrolü (Kural 1 & 2):
  // Maliyeti ETKİLEYEN alanlardaki değişiklikler (En, Boy, Profil, Cam, Adet vb.)
  const isCostAffectingModified = useMemo(() => {
    if (!loadedOrderSnapshot) return false;
    
    if (artworkWidth !== loadedOrderSnapshot.artworkWidth) return true;
    if (artworkHeight !== loadedOrderSnapshot.artworkHeight) return true;
    if (selectedInnerProfileId !== loadedOrderSnapshot.selectedInnerProfileId) return true;
    if (Math.abs(frameWidth - loadedOrderSnapshot.frameWidth) > 0.05) return true;
    if (selectedOuterProfileId !== loadedOrderSnapshot.selectedOuterProfileId) return true;
    if (Math.abs(outerFrameWidth - loadedOrderSnapshot.outerFrameWidth) > 0.05) return true;
    if (Math.abs(matWidth - loadedOrderSnapshot.matWidth) > 0.05) return true;
    if (Math.abs(middleMatWidth - loadedOrderSnapshot.middleMatWidth) > 0.05) return true;
    if (innerMatColor !== loadedOrderSnapshot.innerMatColor) return true;
    if (outerMatColor !== loadedOrderSnapshot.outerMatColor) return true;
    if (orderQuantity !== loadedOrderSnapshot.orderQuantity) return true;
    if (customOverridePrice !== loadedOrderSnapshot.customOverridePrice) return true;
    if (customPaintingUrl !== loadedOrderSnapshot.customPaintingUrl) return true;

    const curF = effectiveInclusionFlags;
    const snapF = loadedOrderSnapshot.inclusionFlags;
    if (
      Boolean(curF.includeArtworkPrint) !== Boolean(snapF.includeArtworkPrint) ||
      Boolean(curF.includeInnerFrame) !== Boolean(snapF.includeInnerFrame) ||
      Boolean(curF.includeOuterFrame) !== Boolean(snapF.includeOuterFrame) ||
      Boolean(curF.includeInnerMat) !== Boolean(snapF.includeInnerMat) ||
      Boolean(curF.includeMiddleMat) !== Boolean(snapF.includeMiddleMat) ||
      Boolean(curF.includeGlass) !== Boolean(snapF.includeGlass) ||
      Boolean(curF.includeBackingBoard) !== Boolean(snapF.includeBackingBoard) ||
      Boolean(curF.includeBackingCloth) !== Boolean(snapF.includeBackingCloth) ||
      Boolean(curF.includeKraftTape) !== Boolean(snapF.includeKraftTape) ||
      Boolean(curF.includeBackingPaper) !== Boolean(snapF.includeBackingPaper) ||
      Boolean(curF.includeLaborCost) !== Boolean(snapF.includeLaborCost)
    ) {
      return true;
    }

    return false;
  }, [
    loadedOrderSnapshot,
    artworkWidth,
    artworkHeight,
    selectedInnerProfileId,
    frameWidth,
    selectedOuterProfileId,
    outerFrameWidth,
    matWidth,
    middleMatWidth,
    innerMatColor,
    outerMatColor,
    orderQuantity,
    customOverridePrice,
    customPaintingUrl,
    effectiveInclusionFlags
  ]);

  // Maliyeti ETKİLEMEYEN alanlardaki değişiklikler (Müşteri Adı, Telefon, Teslim Tarihi, Teslimat Şekli)
  const isNonCostModified = useMemo(() => {
    if (!loadedOrderSnapshot) return false;
    if (customerName.trim() !== loadedOrderSnapshot.customerName.trim()) return true;

    // Telefon karşılaştırması: format farklarını (+90, 0, boşluk, parantez) temizleyip saf rakamları karşılaştır
    const cleanCurPhone = (customerPhone || "").replace(/\D/g, "").replace(/^(90|0)/, "");
    const cleanSnapPhone = (loadedOrderSnapshot.customerPhone || "").replace(/\D/g, "").replace(/^(90|0)/, "");
    if (cleanCurPhone !== cleanSnapPhone) return true;

    // Tarih karşılaştırması: format farklarını (ISO vs DD.MM.YYYY) normalize edip karşılaştır
    const normCurDate = normalizeDateToIso(deliveryDate) || (deliveryDate || "").trim();
    const normSnapDate = normalizeDateToIso(loadedOrderSnapshot.deliveryDate) || (loadedOrderSnapshot.deliveryDate || "").trim();
    if (normCurDate !== normSnapDate) return true;

    if (deliveryMethod !== loadedOrderSnapshot.deliveryMethod) return true;
    return false;
  }, [
    loadedOrderSnapshot,
    customerName,
    customerPhone,
    deliveryDate,
    deliveryMethod
  ]);

  // Herhangi bir değişiklik var mı?
  const isOrderModified = useMemo(() => {
    return isCostAffectingModified || isNonCostModified;
  }, [isCostAffectingModified, isNonCostModified]);

  // Aktif Sipariş Durumu & Kural 1 (Üretim ve Teslimat Koruması):
  const activeOrderInArchive = useMemo(() => {
    return archiveOrders.find(o => (activeOrderId && o.id === activeOrderId) || o.orderNumber === orderNumber);
  }, [archiveOrders, activeOrderId, orderNumber]);

  const currentOrderStatus: OrderStatus | null = useMemo(() => {
    return activeOrderInArchive?.status || loadedOrderStatus || loadedOrderSnapshot?.status || null;
  }, [activeOrderInArchive, loadedOrderStatus, loadedOrderSnapshot]);

  const isProductionOrDelivered = useMemo(() => {
    return Boolean(
      currentOrderStatus && (
        currentOrderStatus === "production" ||
        (currentOrderStatus as string) === "in_production" ||
        currentOrderStatus === "delivered"
      )
    );
  }, [currentOrderStatus]);

  // Ekranda kaydedilmemiş bir sipariş veya değişiklik var mı? (Madde 4)
  const hasUnsavedWork = useMemo(() => {
    if (loadedOrderSnapshot) {
      return isOrderModified;
    }
    // Arşivden yüklenmemişse, kullanıcının yaptığı değişiklikler/girişler var mı?
    const isDefaultClean = 
      !customPaintingUrl &&
      !customerName?.trim() &&
      !customerPhone?.trim() &&
      !deliveryDate?.trim() &&
      orderQuantity === 1 &&
      widthInput === "50" &&
      heightInput === "70" &&
      matWidthInput === "0" &&
      outerFrameWidthInput === "0.0" &&
      middleMatWidthInput === "0.0" &&
      customOverridePrice === null &&
      (!selectedInnerProfileId || (frameProfiles.length > 0 && selectedInnerProfileId === frameProfiles[0]?.id));

    return !isDefaultClean;
  }, [
    loadedOrderSnapshot,
    isOrderModified,
    customPaintingUrl,
    customerName,
    customerPhone,
    deliveryDate,
    orderQuantity,
    widthInput,
    heightInput,
    matWidthInput,
    outerFrameWidthInput,
    middleMatWidthInput,
    customOverridePrice,
    selectedInnerProfileId,
    frameProfiles
  ]);

  // Settings & Profile save handlers
  const handleSaveSettings = (newSettings: UnitPricesSettings) => {
    setUnitPricesSettings(newSettings);
    saveSettingsToStorage(newSettings);
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await saveTenantSettingsToSupabase(newSettings);
          if (error) {
            console.warn("Supabase saveTenantSettings warning:", error);
          }
        } catch (err) {
          console.warn("Supabase saveTenantSettings exception:", err);
        }
      })();
    }
  };

  const handleSaveProfiles = (newProfiles: FrameProfileItem[]) => {
    setFrameProfiles(newProfiles);
  };

  const handleSaveCompanyProfile = (newProfile: CompanyProfile) => {
    setCompanyProfile(newProfile);
    saveCompanyProfileToStorage(newProfile);
  };

  const handleSaveUsers = (newUsers: UserAccount[]) => {
    setUserAccounts(newUsers);
    saveUsersToStorage(newUsers);
  };

  const handleResetDefaults = () => {
    localStorage.removeItem("nakka_unit_prices_v1");
    localStorage.removeItem("nakka_frame_profiles_v1");
    const defSettings = loadSettingsFromStorage();
    const defProfiles = loadProfilesFromStorage();
    setUnitPricesSettings(defSettings);
    setFrameProfiles(defProfiles);
  };

  // Profile select handlers
  const handleSelectInnerProfile = (profId: string) => {
    setSelectedInnerProfileId(profId);
    const prof = frameProfiles.find(p => p.id === profId);
    if (prof) {
      setFrameWidthInput(prof.widthCm.toString());
      setCustomFrameUrl(prof.imageUrl);
      setCustomFrameFile(`${prof.code} - ${prof.name}`);
      setFrameLayoutMode(prof.isRepeatingPattern ?? true ? "repeat" : "miter-stretch");
    }
  };

  const handleSelectOuterProfile = (profId: string) => {
    setSelectedOuterProfileId(profId);
    const prof = frameProfiles.find(p => p.id === profId);
    if (prof) {
      setOuterFrameWidthInput(prof.widthCm.toString());
      setCustomOuterFrameUrl(prof.imageUrl);
      setCustomOuterFrameFile(`${prof.code} - ${prof.name}`);
      setOuterFrameLayoutMode(prof.isRepeatingPattern ?? true ? "repeat" : "miter-stretch");
      setInclusionFlags(prev => ({ ...prev, includeOuterFrame: true }));
    } else {
      setOuterFrameWidthInput("0.0");
      setCustomOuterFrameUrl(null);
      setCustomOuterFrameFile("Yok");
      setInclusionFlags(prev => ({ ...prev, includeOuterFrame: false }));
    }
  };

  const executeLoadOrderToWorkspace = (
    order: OrderArchiveItem,
    options?: { autoPrint?: "order_form" | "cutting_list" | "label" | "cost" }
  ) => {
    // 1. Sipariş Kimliğini ve Numarasını güncelle
    const resolvedId = order.id || ("ord_" + (order.orderNumber ? order.orderNumber.replace(/[^0-9]/g, '') : Date.now()));
    setActiveOrderId(resolvedId);
    if (order.orderNumber) {
      setOrderNumber(order.orderNumber);
    }
    if (order.createdAt) {
      setActiveOrderCreatedAt(order.createdAt);
    }

    // Sipariş Adedini yükle (En yüksek doğruluklu çözümleyici ile)
    const loadedQty = resolveOrderQuantity(order);
    setOrderQuantity(loadedQty);

    // Arşiv listesinde mevcut siparişin id, numara ve çözülen adedini senkronize et (isOrderCreated garantisi)
    setArchiveOrders(prev => {
      const exists = prev.some(o => o.orderNumber === order.orderNumber || o.id === resolvedId);
      if (exists) {
        return prev.map(o => (o.orderNumber === order.orderNumber || o.id === resolvedId) ? { ...o, ...order, id: resolvedId, quantity: loadedQty } : o);
      }
      return [{ ...order, id: resolvedId, quantity: loadedQty }, ...prev];
    });

    // 2. Müşteri ve Teslimat Bilgilerini yükle
    const resolvedCustomerName = order.customerName || "";
    const cleanPhoneForInput = formatTrPhone(order.customerPhone || "");
    const resolvedCustomerPhone = cleanPhoneForInput || (order.customerPhone || "");
    setCustomerName(resolvedCustomerName);
    setCustomerPhone(resolvedCustomerPhone);
    
    let resolvedDeliveryDate = "";
    if (order.deliveryDate) {
      const isoDate = normalizeDateToIso(order.deliveryDate);
      resolvedDeliveryDate = isoDate || order.deliveryDate;
      setDeliveryDate(resolvedDeliveryDate);
      setLoadedOrderOriginalDeliveryDate(resolvedDeliveryDate);
    } else {
      setDeliveryDate("");
      setLoadedOrderOriginalDeliveryDate(null);
    }
    setDeliveryDateError(false);
    setDeliveryDateErrorMessage(null);

    const resolvedDeliveryMethod = order.deliveryMethod === "pickup" ? "store" : (order.deliveryMethod || "store");
    setDeliveryMethod(resolvedDeliveryMethod);

    // 3. Eser Ölçülerini yükle
    const resolvedArtW = order.artworkWidthCm || 50;
    const resolvedArtH = order.artworkHeightCm || 70;
    setWidthInput(String(resolvedArtW));
    setHeightInput(String(resolvedArtH));

    // 4. Kayıtlı eser görselini yükle
    const savedPainting = order.customPaintingUrl || order.simulatorConfig?.customPaintingUrl;
    if (savedPainting) {
      setCustomPaintingUrl(savedPainting);
      setCustomPaintingFile(order.customPaintingFile || order.simulatorConfig?.customPaintingFile || "Kayıtlı Eser Görseli");
    } else {
      setCustomPaintingUrl(null);
      setCustomPaintingFile("Özel Eser (Görselsiz)");
    }

    // 5. İç Çerçeve Profilini bul ve yükle
    let resolvedInnerProfileId = "";
    let resolvedFrameWidth = 4.0;
    const targetInnerId = order.innerProfileId || order.simulatorConfig?.innerProfileId;
    let foundInner = targetInnerId ? frameProfiles.find(p => p.id === targetInnerId) : null;
    if (!foundInner && order.innerFrameTitle && order.innerFrameTitle !== "Çerçeve Seçilmedi" && order.innerFrameTitle !== "Yok") {
      const cleanTitle = order.innerFrameTitle.toLowerCase().trim();
      foundInner = frameProfiles.find(p => 
        (p.code && cleanTitle.includes(p.code.toLowerCase())) || 
        (p.name && cleanTitle.includes(p.name.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(cleanTitle))
      );
    }
    // Profil listesinden güvenli eşleşme
    if (!foundInner && frameProfiles.length > 0) {
      foundInner = frameProfiles[0];
    }

    if (foundInner) {
      handleSelectInnerProfile(foundInner.id);
      resolvedInnerProfileId = foundInner.id;
      const customW = order.frameWidthCm || order.simulatorConfig?.frameWidthCm || foundInner.widthCm;
      if (customW) {
        resolvedFrameWidth = Number(customW);
        setFrameWidthInput(String(customW));
      }
      setInclusionFlags(prev => ({ ...prev, includeInnerFrame: true }));
    } else if (order.innerFrameTitle && order.innerFrameTitle !== "Çerçeve Seçilmedi" && order.innerFrameTitle !== "Yok") {
      setCustomFrameFile(order.innerFrameTitle);
      const widthMatch = order.innerFrameTitle.match(/([\d.,]+)\s*cm/i);
      if (widthMatch) {
        resolvedFrameWidth = parseFloat(widthMatch[1].replace(",", ".")) || 4.0;
        setFrameWidthInput(String(resolvedFrameWidth));
      } else if (order.frameWidthCm) {
        resolvedFrameWidth = Number(order.frameWidthCm);
        setFrameWidthInput(String(order.frameWidthCm));
      }
      setInclusionFlags(prev => ({ ...prev, includeInnerFrame: true }));
    }

    // 6. Dış Çerçeve Profilini bul ve yükle
    let resolvedOuterProfileId = "";
    let resolvedOuterFrameWidth = 0.0;
    const targetOuterId = order.outerProfileId || order.simulatorConfig?.outerProfileId;
    let foundOuter = targetOuterId ? frameProfiles.find(p => p.id === targetOuterId) : null;
    if (!foundOuter && order.outerFrameTitle && order.outerFrameTitle !== "Yok" && order.outerFrameTitle !== "Çerçeve Seçilmedi") {
      const cleanTitle = order.outerFrameTitle.toLowerCase().trim();
      foundOuter = frameProfiles.find(p => 
        (p.code && cleanTitle.includes(p.code.toLowerCase())) || 
        (p.name && cleanTitle.includes(p.name.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(cleanTitle))
      );
    }

    if (foundOuter) {
      handleSelectOuterProfile(foundOuter.id);
      resolvedOuterProfileId = foundOuter.id;
      const customOuterW = order.outerFrameWidthCm || order.simulatorConfig?.outerFrameWidthCm || foundOuter.widthCm;
      if (customOuterW) {
        resolvedOuterFrameWidth = Number(customOuterW);
        setOuterFrameWidthInput(String(customOuterW));
      }
      setInclusionFlags(prev => ({ ...prev, includeOuterFrame: true }));
    } else if (order.outerFrameWidthCm && Number(order.outerFrameWidthCm) > 0) {
      const fallbackOuter = frameProfiles.length > 1 ? frameProfiles[1] : (frameProfiles[0] || null);
      if (fallbackOuter) {
        handleSelectOuterProfile(fallbackOuter.id);
        resolvedOuterProfileId = fallbackOuter.id;
      }
      resolvedOuterFrameWidth = Number(order.outerFrameWidthCm);
      setOuterFrameWidthInput(String(order.outerFrameWidthCm));
      setInclusionFlags(prev => ({ ...prev, includeOuterFrame: true }));
    } else {
      handleSelectOuterProfile("");
      setOuterFrameWidthInput("0");
      setInclusionFlags(prev => ({ ...prev, includeOuterFrame: false }));
    }

    // 7. Paspartu ve Renkleri
    let resolvedMatW = 0;
    let resolvedInnerMatColor = "#FAF9F5";
    let resolvedOuterMatColor = "#FAF9F5";
    if (order.matWidthCm !== undefined) {
      resolvedMatW = Number(order.matWidthCm);
      setMatWidthInput(String(order.matWidthCm));
      setInclusionFlags(prev => ({ ...prev, includeInnerMat: resolvedMatW > 0 }));
    } else if (order.matInfo) {
      if (order.matInfo.toLowerCase().includes("paspartusuz") || order.matInfo.toLowerCase().includes("yok")) {
        setMatWidthInput("0");
        setInclusionFlags(prev => ({ ...prev, includeInnerMat: false }));
      } else {
        const matMatch = order.matInfo.match(/([\d.,]+)\s*cm/i);
        if (matMatch) {
          const parsedWidth = matMatch[1].replace(",", ".");
          resolvedMatW = parseFloat(parsedWidth) || 0;
          setMatWidthInput(parsedWidth);
          setInclusionFlags(prev => ({ ...prev, includeInnerMat: resolvedMatW > 0 }));
        }
        const matText = order.matInfo.toLowerCase();
        if (matText.includes("siyah")) resolvedInnerMatColor = "#1C1C1E";
        else if (matText.includes("beyaz")) resolvedInnerMatColor = "#FFFFFF";
        else if (matText.includes("krem")) resolvedInnerMatColor = "#FAF9F5";
        else if (matText.includes("antrasit")) resolvedInnerMatColor = "#2C2C2E";
        else if (matText.includes("şeffaf") || matText.includes("seffaf") || matText.includes("cam")) resolvedInnerMatColor = "transparent";
      }
    }

    if (order.innerMatColor || order.simulatorConfig?.innerMatColor) {
      resolvedInnerMatColor = order.innerMatColor || order.simulatorConfig?.innerMatColor;
      setInnerMatColor(resolvedInnerMatColor);
    }
    if (order.outerMatColor || order.simulatorConfig?.outerMatColor) {
      resolvedOuterMatColor = order.outerMatColor || order.simulatorConfig?.outerMatColor;
      setOuterMatColor(resolvedOuterMatColor);
    }

    // 8. 3D Ara Paspartu
    let resolvedMiddleMatW = 0.0;
    const middleMatW = order.middleMatWidthCm ?? order.simulatorConfig?.middleMatWidthCm;
    if (middleMatW !== undefined) {
      resolvedMiddleMatW = Number(middleMatW);
      setMiddleMatWidthInput(String(middleMatW));
      setInclusionFlags(prev => ({ ...prev, includeMiddleMat: Number(middleMatW) > 0 }));
    }

    // 9. Malzeme Dahil Edilme Bayrakları
    const resolvedFlags: MaterialInclusionFlags = order.inclusionFlags || order.simulatorConfig?.flags || {
      includeArtworkPrint: false,
      includeInnerMat: resolvedMatW > 0,
      includeInnerFrame: true,
      includeMiddleMat: resolvedMiddleMatW > 0,
      includeOuterFrame: resolvedOuterFrameWidth > 0,
      includeGlass: false,
      includeBackingBoard: false,
      includeBackingCloth: false,
      includeKraftTape: false,
      includeBackingPaper: false,
      includeLaborCost: true
    };
    setInclusionFlags(resolvedFlags);

    // 10. Özel Fiyat / İskonto
    const override = order.customOverridePrice ?? order.simulatorConfig?.customOverridePrice;
    setCustomOverridePrice(override ?? null);

    // 10.1 Notlar, Revizyon Referansı ve Sipariş Durumu
    setOrderNotes(order.notes || "");
    setRevisionNote(order.revisionNote || "");
    setReferencedOrderNumber(order.referencedOrderNumber || "");
    setLoadedOrderStatus(order.status || "quote");

    // 10.2 Tarihsel Fiyat Anlık Görüntüsü (Price Snapshot - Kural 2)
    let snapshotToLoad: PriceSnapshot | null = order.price_snapshot || order.simulatorConfig?.price_snapshot || null;
    if (!snapshotToLoad && (order.cost_breakdown || order.simulatorConfig?.cost_breakdown)) {
      snapshotToLoad = {
        unitPrices: { ...unitPricesSettings },
        costBreakdown: (order.cost_breakdown || order.simulatorConfig?.cost_breakdown)!,
        innerProfileMeterPrice: foundInner?.unitPricePerMeter,
        outerProfileMeterPrice: foundOuter?.unitPricePerMeter,
        innerProfileId: resolvedInnerProfileId,
        outerProfileId: resolvedOuterProfileId,
        snapshotDate: order.createdAt || new Date().toISOString()
      };
    } else if (!snapshotToLoad) {
      const computedHistoricalBreakdown = calculateCostsAndPricing({
        artworkWidthCm: resolvedArtW,
        artworkHeightCm: resolvedArtH,
        matWidthCm: resolvedMatW,
        frameWidthCm: resolvedFrameWidth,
        middleMatWidthCm: resolvedMiddleMatW,
        outerFrameWidthCm: resolvedOuterFrameWidth,
        innerMatColor: resolvedInnerMatColor,
        outerMatColor: resolvedOuterMatColor,
        selectedInnerProfileMeterPrice: foundInner?.unitPricePerMeter,
        selectedOuterProfileMeterPrice: foundOuter?.unitPricePerMeter,
        innerRabbetDepthMm: order.innerRabbetDepthMm,
        outerRabbetDepthMm: order.outerRabbetDepthMm,
        customOverridePrice: override ?? null,
        deliveryMethod: resolvedDeliveryMethod,
        settings: unitPricesSettings,
        flags: resolvedFlags
      });
      snapshotToLoad = {
        unitPrices: { ...unitPricesSettings },
        costBreakdown: computedHistoricalBreakdown,
        innerProfileMeterPrice: foundInner?.unitPricePerMeter,
        outerProfileMeterPrice: foundOuter?.unitPricePerMeter,
        innerProfileId: resolvedInnerProfileId,
        outerProfileId: resolvedOuterProfileId,
        snapshotDate: order.createdAt || new Date().toISOString()
      };
    }
    setLoadedPriceSnapshot(snapshotToLoad);

    // 11. Snapshot Kaydet (Değişiklik tespiti için tam temiz referans)
    setLoadedOrderSnapshot({
      orderNumber: order.orderNumber,
      orderId: resolvedId,
      customerName: resolvedCustomerName,
      customerPhone: resolvedCustomerPhone,
      deliveryDate: resolvedDeliveryDate,
      deliveryMethod: resolvedDeliveryMethod,
      orderQuantity: loadedQty,
      artworkWidth: resolvedArtW,
      artworkHeight: resolvedArtH,
      customPaintingUrl: savedPainting || null,
      selectedInnerProfileId: resolvedInnerProfileId,
      frameWidth: resolvedFrameWidth,
      selectedOuterProfileId: resolvedOuterProfileId,
      outerFrameWidth: resolvedOuterFrameWidth,
      matWidth: resolvedMatW,
      middleMatWidth: resolvedMiddleMatW,
      innerMatColor: resolvedInnerMatColor,
      outerMatColor: resolvedOuterMatColor,
      inclusionFlags: resolvedFlags,
      customOverridePrice: override ?? null,
      status: order.status || "quote"
    });

    // 12. Modalı kapat
    setIsArchiveModalOpen(false);

    // 13. Çerçeveleme sekmesini aktif yap (kullanıcı hemen görseli ve ölçüleri görsün)
    setActiveSidebarTab("framing");

    // 14. Sayfayı simülatör görsel alanına kaydır
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 15. Otomatik yazdırma isteği varsa kuyruğa al
    if (options?.autoPrint) {
      setPendingAutoPrint(options.autoPrint);
    } else {
      // Bilgilendirici Toast uyarısı ver
      setToastMessage({
        text: `${order.orderNumber} numaralı sipariş simülatöre aktarıldı. Tüm bileşenler yüklendi.`,
        type: "success"
      });
    }
  };

  const handleLoadOrderToWorkspace = (
    order: OrderArchiveItem,
    options?: { autoPrint?: "order_form" | "cutting_list" | "label" | "cost" }
  ) => {
    // Madde 4: Ekranda kaydedilmemiş bir sipariş veya değişiklik varsa onay iste
    if (hasUnsavedWork) {
      setConfirmResetAction({ type: "load", order, options });
      setIsResetConfirmOpen(true);
      return;
    }
    executeLoadOrderToWorkspace(order, options);
  };

  // Simülatördeki Tüm Seçenekleri Sıfırlayıp Yeni Çerçeve Tasarımı Başlatma (Madde 3)
  const handleResetSimulator = () => {
    // 1. Resim ve eser bilgilerini sıfırla
    setCustomPaintingUrl(null);
    setCustomPaintingFile("Henüz görsel seçilmedi");
    setWidthInput("50");
    setHeightInput("70");

    // 2. Çerçeve ve profil seçimlerini varsayılana getir
    if (frameProfiles.length > 0) {
      handleSelectInnerProfile(frameProfiles[0].id);
    } else {
      setSelectedInnerProfileId("");
      setCustomFrameUrl(null);
      setCustomFrameFile("Çerçeve Seçilmedi");
      setFrameWidthInput("4.0");
    }

    // 3. Paspartu ve renkleri sıfırla
    setMatWidthInput("0");
    setInnerMatColor("#FAF9F5");
    setOuterMatColor("#FAF9F5");

    // 4. Dış çerçeve ve 3D Paspartuyu kapat
    handleSelectOuterProfile("");
    setMiddleMatWidthInput("0.0");

    // 5. Müşteri ve teslimat bilgilerini temizle, sipariş adedini varsayılan 1'e sıfırla (Madde 3)
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryDate("");
    setDeliveryMethod("store");
    setOrderQuantity(1); // Madde 3: Yeni butonuna basıldığında adet kesinlikle 1'e sıfırlanır
    setCustomerNameError(false);
    setCustomerPhoneError(false);
    setDeliveryDateError(false);
    setOrderNotes("");
    setRevisionNote("");
    setReferencedOrderNumber("");
    setLoadedOrderStatus(null);
    setLoadedPriceSnapshot(null);

    // 6. Özel fiyat ve malzeme bayraklarını sıfırla (Madde 3)
    setCustomOverridePrice(null); // Madde 3: İskonto kesinlikle sıfırlanır
    setInclusionFlags({
      includeArtworkPrint: false,
      includeInnerMat: false,
      includeInnerFrame: true,
      includeMiddleMat: false,
      includeOuterFrame: false,
      includeGlass: false,
      includeBackingBoard: false,
      includeBackingCloth: false,
      includeKraftTape: false,
      includeBackingPaper: false,
      includeLaborCost: true
    });

    // 7. Oda ve duvar görselini sıfırla
    setWallMode("color");
    setCustomerRoomImage(null);

    // 8. Yeni benzersiz sipariş numarası oluştur ve aktif sipariş kimliğini sıfırla
    const newNum = generateOrderNumber();
    setOrderNumber(newNum);
    setActiveOrderId(null);
    setActiveOrderCreatedAt(null);
    setLoadedOrderOriginalDeliveryDate(null);
    setDeliveryDateErrorMessage(null);
    setDeliveryDateError(false);
    setLoadedOrderSnapshot(null); // Sıfırlanınca snapshot da temizlenir
    clearWorkspaceDraft();

    // 9. Sekmeyi 1. Eser adımına getir
    setActiveSidebarTab("artwork");

    // 10. Onay modalını kapat
    setIsResetConfirmOpen(false);
    setConfirmResetAction(null);

    // 11. Sayfa başına yumuşak kaydır
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 12. Başarılı sıfırlama bildirimi
    setToastMessage({
      text: `✨ Simülatör sıfırlandı! Yeni sipariş (#${newNum}) için hazır.`,
      type: "info"
    });
  };

  // 1. Form Sıfırlama (Reset) / Yeni Sipariş Fonksiyonu
  const resetForm = () => {
    handleResetSimulator();
    setOrderQuantity(1);
  };

  // Header "YENİ" butonuna tıklandığında kontrol (Madde 4)
  const handleNewOrderClick = () => {
    // Madde 4: Ekranda kaydedilmemiş bir sipariş veya değişiklik varsa onay iste
    if (hasUnsavedWork) {
      setConfirmResetAction({ type: "new" });
      setIsResetConfirmOpen(true);
      return;
    }
    handleResetSimulator();
  };

  // Select initial inner frame profile if none selected, or synchronize if previous profile was removed
  useEffect(() => {
    if (frameProfiles.length === 0) {
      if (selectedInnerProfileId) {
        setSelectedInnerProfileId("");
      }
      return;
    }

    if (!selectedInnerProfileId || !frameProfiles.some(p => p.id === selectedInnerProfileId)) {
      handleSelectInnerProfile(frameProfiles[0].id);
    }
  }, [frameProfiles, selectedInnerProfileId]);

  // ESC key listener to close confirmation modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isResetConfirmOpen) {
          setIsResetConfirmOpen(false);
          setConfirmResetAction(null);
        }
        if (isOrderModifiedWarningOpen) {
          setIsOrderModifiedWarningOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isResetConfirmOpen, isOrderModifiedWarningOpen]);

  // Sync inclusionFlags when matWidth / middleMatWidth change
  useEffect(() => {
    setInclusionFlags(prev => ({
      ...prev,
      includeInnerMat: matWidth > 0,
      includeMiddleMat: middleMatWidth > 0
    }));
  }, [matWidth, middleMatWidth]);

  // Custom background wall color picker system
  const [wallColor, setWallColor] = useState<string>("#58111A"); // Default: 1. Bordo
  const [lightingStyle, setLightingStyle] = useState<string>("daylight"); // cozy-lamp, spotlight, daylight

  // Öntanımlı 4 Duvar Rengi + 5. Özel
  const wallColorPalette = [
    { name: "1. Bordo", value: "#58111A" },
    { name: "2. Antrasit", value: "#26292B" },
    { name: "3. Şampanya", value: "#EAD9C3" },
    { name: "4. Beyaz", value: "#FFFFFF" }
  ];

  // Customer Room / Wall Preview System
  const [wallMode, setWallMode] = useState<"color" | "room">("color");
  const [customerRoomImage, setCustomerRoomImage] = useState<string | null>(null);
  const [roomFrameScale, setRoomFrameScale] = useState<number>(1);
  const [roomFramePos, setRoomFramePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [roomBrightness, setRoomBrightness] = useState<number>(100);
  const [roomShadowIntensity, setRoomShadowIntensity] = useState<number>(1);
  const [roomBgFit, setRoomBgFit] = useState<"cover" | "contain">("cover");
  const [roomBgScale, setRoomBgScale] = useState<number>(1);
  const [roomBgPos, setRoomBgPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [roomActiveTarget, setRoomActiveTarget] = useState<"frame" | "room">("frame");
  const [isCustomerPresentationOpen, setIsCustomerPresentationOpen] = useState<boolean>(false);
  const [isDraggingWallFrame, setIsDraggingWallFrame] = useState<boolean>(false);
  const [isDraggingWallRoom, setIsDraggingWallRoom] = useState<boolean>(false);
  const wallFrameDragStart = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const wallRoomDragStart = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleWallFramePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (wallMode !== "room") return;
    e.stopPropagation();
    e.preventDefault(); // Prevent native image drag ghosting
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    wallFrameDragStart.current = {
      startX: clientX,
      startY: clientY,
      posX: roomFramePos.x,
      posY: roomFramePos.y
    };
    setIsDraggingWallFrame(true);

    let rafId: number | null = null;

    const onMove = (moveEv: MouseEvent | TouchEvent) => {
      const cx = "touches" in moveEv ? moveEv.touches[0].clientX : (moveEv as MouseEvent).clientX;
      const cy = "touches" in moveEv ? moveEv.touches[0].clientY : (moveEv as MouseEvent).clientY;
      const newX = Math.round(wallFrameDragStart.current.posX + (cx - wallFrameDragStart.current.startX));
      const newY = Math.round(wallFrameDragStart.current.posY + (cy - wallFrameDragStart.current.startY));

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setRoomFramePos({ x: newX, y: newY });
      });
    };

    const onUp = () => {
      setIsDraggingWallFrame(false);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp, { capture: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp, { capture: true });
  };

  const handleWallRoomPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (wallMode !== "room") return;
    // Only drag room when clicking on room background, not on frame
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-drag-scroll='true']")) return;

    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    wallRoomDragStart.current = {
      startX: clientX,
      startY: clientY,
      posX: roomBgPos.x,
      posY: roomBgPos.y
    };
    setIsDraggingWallRoom(true);

    let rafId: number | null = null;

    const onMove = (moveEv: MouseEvent | TouchEvent) => {
      const cx = "touches" in moveEv ? moveEv.touches[0].clientX : (moveEv as MouseEvent).clientX;
      const cy = "touches" in moveEv ? moveEv.touches[0].clientY : (moveEv as MouseEvent).clientY;
      const newX = Math.round(wallRoomDragStart.current.posX + (cx - wallRoomDragStart.current.startX));
      const newY = Math.round(wallRoomDragStart.current.posY + (cy - wallRoomDragStart.current.startY));

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setRoomBgPos({ x: newX, y: newY });
      });
    };

    const onUp = () => {
      setIsDraggingWallRoom(false);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp, { capture: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp, { capture: true });
  };

  // Çerçevenin resim yerleşimi ve ölçek ince ayar modları
  const [frameLayoutMode, setFrameLayoutMode] = useState<string>("miter-stretch"); // "miter-stretch" veya "repeat"
  const [frameSlice] = useState<number>(40);

  // Dynamic preview measurement refs - Mobil, tablet ve masaüstü ilk açılışta anında gerçek boyut alma
  const getInitialStageDimensions = () => {
    if (typeof window !== "undefined") {
      const isMobileOrTablet = window.innerWidth < 1024;
      const padding = window.innerWidth < 640 ? 24 : window.innerWidth < 1024 ? 40 : 64;
      const w = isMobileOrTablet 
        ? Math.max(260, window.innerWidth - padding) 
        : Math.min(Math.max(400, (window.innerWidth - 460) * 0.95), 900);
      const h = window.innerWidth < 640 ? 460 : window.innerWidth < 1024 ? 540 : Math.min(window.innerHeight * 0.72, 720);
      return { w, h };
    }
    return { w: 600, h: 600 };
  };

  const [stageWidth, setStageWidth] = useState<number>(() => getInitialStageDimensions().w);
  const [stageHeight, setStageHeight] = useState<number>(() => getInitialStageDimensions().h);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageResizeObserverRef = useRef<ResizeObserver | null>(null);

  // Callback Ref: DOM elemanı bağlandığı anda anında gerçek genişlik ve yüksekliği ölçer (F5 beklemeden)
  const setStageRef = useCallback((node: HTMLDivElement | null) => {
    if (stageResizeObserverRef.current) {
      stageResizeObserverRef.current.disconnect();
      stageResizeObserverRef.current = null;
    }
    stageRef.current = node;

    if (node) {
      // 1. DOM'a bağlanır bağlanmaz anında içerik boyutunu al
      const w = node.clientWidth || node.getBoundingClientRect().width;
      const h = node.clientHeight || node.getBoundingClientRect().height;
      if (w > 0) {
        setStageWidth(w);
      }
      if (h > 0) {
        setStageHeight(h);
      }

      // 2. Dinamik boyut değişiklikleri için ResizeObserver dinleyicisini bağla
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 0) {
            setStageWidth(cr.width);
          }
          if (cr.height > 0) {
            setStageHeight(cr.height);
          }
        }
      });
      observer.observe(node);
      stageResizeObserverRef.current = observer;
    }
  }, []);

  // Pencere boyutu ve cihaz yön değişimi (orientationchange) dinleyicisi
  useEffect(() => {
    const handleWindowResize = () => {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        if (rect.width > 0) setStageWidth(rect.width);
        if (rect.height > 0) setStageHeight(rect.height);
      } else if (typeof window !== "undefined") {
        const dims = getInitialStageDimensions();
        setStageWidth(dims.w);
        setStageHeight(dims.h);
      }
    };

    window.addEventListener("resize", handleWindowResize, { passive: true });
    window.addEventListener("orientationchange", handleWindowResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("orientationchange", handleWindowResize);
      if (stageResizeObserverRef.current) {
        stageResizeObserverRef.current.disconnect();
        stageResizeObserverRef.current = null;
      }
    };
  }, []);

  // Oturum açılışında veya sekme geçişlerinde sahne ölçüsünü hemen tazele
  useEffect(() => {
    if (authSession?.isLoggedIn) {
      const timer = setTimeout(() => {
        if (stageRef.current) {
          const rect = stageRef.current.getBoundingClientRect();
          if (rect.width > 0) setStageWidth(rect.width);
          if (rect.height > 0) setStageHeight(rect.height);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [authSession?.isLoggedIn]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameFileInputRef = useRef<HTMLInputElement | null>(null);
  const outerFrameFileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local image uploads & camera captures - Base64 İptali & Supabase Storage Entegrasyonu
  const processPaintingFile = async (file: File) => {
    // 1. Tarayıcıda anında yerel önizleme aç (kullanıcı hiç beklemesin)
    const localBlobPreview = URL.createObjectURL(file);
    setCustomPaintingUrl(localBlobPreview);
    setCustomPaintingFile(file.name);
    setIsCropModalOpen(true); // Otomatik kırpma & köşe hizalama modalını aç

    // 2. Tarayıcı tarafında maksimum 1920px genişlik ve %80 kaliteye sıkıştır
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.80,
        mimeType: "image/jpeg"
      });

      // 3. Sıkıştırılmış binary dosyayı Supabase Storage'a yükle
      if (isSupabaseConfigured()) {
        const { publicUrl, error: uploadErr } = await uploadImageToSupabaseStorage(
          compressed.blob,
          "artworks",
          file.name
        );

        if (publicUrl) {
          // Kalıcı Storage Public URL'ine güncelle
          setCustomPaintingUrl(publicUrl);

          // 4. Veritabanına ASLA Base64 metni kaydetme! Sadece kısa Storage public URL'ini yaz
          const { error: dbErr } = await createVisualizationInSupabase({
            artwork_url: publicUrl,
            artwork_name: file.name,
            artwork_width_cm: artworkWidth,
            artwork_height_cm: artworkHeight,
            mat_width_cm: matWidth,
            inner_frame_profile_id: selectedInnerProfileId || undefined
          });

          if (dbErr) {
            console.warn("Supabase visualization save warning:", dbErr);
          }
        } else if (uploadErr) {
          console.warn("Supabase Storage upload warning:", uploadErr);
        }
      }
    } catch (err) {
      console.error("Görsel sıkıştırma veya Storage aktarım hatası:", err);
    }
  };

  const handlePaintingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processPaintingFile(file);
  };

  const handleFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setCustomFrameUrl(localPreview);
    setCustomFrameFile(file.name);

    if (isSupabaseConfigured()) {
      try {
        const compressed = await compressImage(file, { maxWidth: 1080, quality: 0.80 });
        const { publicUrl } = await uploadImageToSupabaseStorage(compressed.blob, "custom-frames", file.name);
        if (publicUrl) {
          setCustomFrameUrl(publicUrl);
        }
      } catch (err) {
        console.warn("Frame texture compression error:", err);
      }
    }
  };

  const handleOuterFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setCustomOuterFrameUrl(localPreview);
    setCustomOuterFrameFile(file.name);

    if (isSupabaseConfigured()) {
      try {
        const compressed = await compressImage(file, { maxWidth: 1080, quality: 0.80 });
        const { publicUrl } = await uploadImageToSupabaseStorage(compressed.blob, "custom-frames", file.name);
        if (publicUrl) {
          setCustomOuterFrameUrl(publicUrl);
        }
      } catch (err) {
        console.warn("Outer frame texture compression error:", err);
      }
    }
  };

  // Milimetrik hesaplama motoru (Bini Payı Formülü: Kesim Uzunluğu = Girilen Müşteri Ölçüsü + (2 * Profil Genişliği) - (2 * Bini Payı))
  const innerRabbetCm = activeInnerRabbetMm / 10;
  const outerRabbetCm = activeOuterRabbetMm / 10;
  const innerMatW = artworkWidth + 2 * matWidth;
  const innerMatH = artworkHeight + 2 * matWidth;
  const innerFrameW = frameWidth > 0 ? innerMatW + (2 * frameWidth) - (2 * innerRabbetCm) : innerMatW;
  const innerFrameH = frameWidth > 0 ? innerMatH + (2 * frameWidth) - (2 * innerRabbetCm) : innerMatH;
  const midMatW = innerFrameW + 2 * middleMatWidth;
  const midMatH = innerFrameH + 2 * middleMatWidth;
  const totalW = outerFrameWidth > 0 ? midMatW + (2 * outerFrameWidth) - (2 * outerRabbetCm) : (frameWidth > 0 ? innerFrameW : innerMatW);
  const totalH = outerFrameWidth > 0 ? midMatH + (2 * outerFrameWidth) - (2 * outerRabbetCm) : (frameWidth > 0 ? innerFrameH : innerMatH);
  const finalOuterWidthCm = totalW;
  const finalOuterHeightCm = totalH;
  const totalAspect = totalW / totalH;

  // Sanal duvar sahnesinin 4 etrafından mobilde 16px, tablette 20px, masaüstünde 28px içerde kalacak şekilde hassas ölçeklendirme
  const minPaddingPx = typeof window !== "undefined" 
    ? (window.innerWidth < 640 ? 16 : window.innerWidth < 1024 ? 20 : 28) 
    : 20;
  const maxAvailableW = Math.max(100, stageWidth - (minPaddingPx * 2));
  const maxAvailableH = Math.max(100, stageHeight - (minPaddingPx * 2));

  let displayWidth = 0;
  let displayHeight = 0;

  if (totalW / maxAvailableW > totalH / maxAvailableH) {
    // Genişlik sınırı belirleyici
    displayWidth = maxAvailableW;
    displayHeight = maxAvailableW / totalAspect;
  } else {
    // Yükseklik sınırı belirleyici
    displayHeight = maxAvailableH;
    displayWidth = maxAvailableH * totalAspect;
  }
  const pxPerCm = displayWidth / totalW;

  // Alt elemanların kusursuz milimetrik piksel karşılıkları
  const outerFrameWidthPx = outerFrameWidth * pxPerCm;
  const middleMatWidthPx = middleMatWidth * pxPerCm;
  const frameWidthPx = frameWidth * pxPerCm;
  const matWidthPx = matWidth * pxPerCm;
  const artworkWidthPx = artworkWidth * pxPerCm;
  const artworkHeightPx = artworkHeight * pxPerCm;
  const totalWidthPx = totalW * pxPerCm;
  const totalHeightPx = totalH * pxPerCm;

  // Helper functions for safe canvas image loading to avoid CORS cache taint issues
  const getSafeCanvasUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("data:")) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}canvas_cb=${Date.now()}`;
  };

  const loadImagePromise = (url: string | null, fallbackUrl?: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.referrerPolicy = "no-referrer";
      
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (fallbackUrl && url !== fallbackUrl) {
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = "anonymous";
          fallbackImg.referrerPolicy = "no-referrer";
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = getSafeCanvasUrl(fallbackUrl);
        } else {
          resolve(null);
        }
      };
      
      const targetSrc = url || fallbackUrl || "";
      if (targetSrc) {
        img.src = getSafeCanvasUrl(targetSrc);
      } else {
        resolve(null);
      }
    });
  };

  const createSafeLinearGradient = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): CanvasGradient => {
    const safeX0 = Number.isFinite(x0) ? x0 : 0;
    const safeY0 = Number.isFinite(y0) ? y0 : 0;
    let safeX1 = Number.isFinite(x1) ? x1 : safeX0 + 1;
    let safeY1 = Number.isFinite(y1) ? y1 : safeY0 + 1;
    if (Math.abs(safeX1 - safeX0) < 0.001 && Math.abs(safeY1 - safeY0) < 0.001) {
      safeX1 = safeX0 + 1;
      safeY1 = safeY0 + 1;
    }
    return ctx.createLinearGradient(safeX0, safeY0, safeX1, safeY1);
  };

  const createSafeRadialGradient = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): CanvasGradient => {
    const safeX0 = Number.isFinite(x0) ? x0 : 0;
    const safeY0 = Number.isFinite(y0) ? y0 : 0;
    const safeR0 = Number.isFinite(r0) && r0 >= 0 ? r0 : 0;
    const safeX1 = Number.isFinite(x1) ? x1 : safeX0;
    const safeY1 = Number.isFinite(y1) ? y1 : safeY0;
    const safeR1 = Number.isFinite(r1) && r1 > 0 ? r1 : safeR0 + 10;
    return ctx.createRadialGradient(safeX0, safeY0, safeR0, safeX1, safeY1, safeR1);
  };

  const [isDownloadingHD, setIsDownloadingHD] = useState<boolean>(false);

  const handleDownloadHdWallColor = async () => {
    setIsDownloadingHD(true);
    try {
      const stageEl = stageRef.current;
      const sRect = stageEl?.getBoundingClientRect();
      const frameEl = stageEl?.querySelector('[data-frame-root="true"]') as HTMLElement | null;
      const fRect = frameEl?.getBoundingClientRect();

      await exportAndDownloadHD({
        wallMode: wallMode,
        wallColor: wallColor,
        customerRoomImage: customerRoomImage,
        roomBrightness: roomBrightness,
        roomShadowIntensity: roomShadowIntensity,
        roomBgFit: roomBgFit,
        roomBgScale: roomBgScale,
        roomBgPos: roomBgPos,
        roomFrameScale: roomFrameScale,
        roomFramePos: roomFramePos,
        artworkWidth: artworkWidth,
        artworkHeight: artworkHeight,
        matWidth: matWidth,
        middleMatWidth: middleMatWidth,
        frameWidth: frameWidth,
        outerFrameWidth: outerFrameWidth,
        frameWidthCm: totalW,
        frameHeightCm: totalH,
        customPaintingUrl: customPaintingUrl,
        customFrameUrl: activeInnerProfile?.imageUrl || activeInnerProfile?.textureUrl || customFrameUrl,
        customOuterFrameUrl: activeOuterProfile?.imageUrl || activeOuterProfile?.textureUrl || customOuterFrameUrl,
        innerMatColor: innerMatColor,
        outerMatColor: outerMatColor,
        frameLayoutMode: activeInnerProfile?.layoutMode || (activeInnerProfile?.isRepeatingPattern ? "repeat" : "miter-stretch") || frameLayoutMode,
        outerFrameLayoutMode: activeOuterProfile?.layoutMode || (activeOuterProfile?.isRepeatingPattern ? "repeat" : "miter-stretch") || outerFrameLayoutMode,
        lightingStyle: lightingStyle,
        customerName: customerName || "Değerli Müşterimiz",
        customerPhone: customerPhone || "",
        orderNumber: orderNumber || "",
        companyName: companyProfile.companyName || "Nakka Dekor",
        activeProfileName: activeInnerProfile?.name || activeInnerProfile?.code || "Klasik Profil",
        outerProfileName: activeOuterProfile?.name || activeOuterProfile?.code || "",
        totalPrice: costBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity),
        quantity: Math.max(1, orderQuantity),
        containerRect: sRect ? {
          left: sRect.left,
          top: sRect.top,
          width: sRect.width,
          height: sRect.height,
        } : undefined,
        frameRect: fRect && sRect ? {
          left: fRect.left,
          top: fRect.top,
          width: fRect.width,
          height: fRect.height,
        } : undefined,
      });
    } catch (err) {
      console.error("HD Download error:", err);
    } finally {
      setIsDownloadingHD(false);
    }
  };

  // Dynamic Image Compositer and Download Handler (HTML5 Canvas magic)
  const downloadCompositedImage = async () => {
    if (!isOrderCreated) {
      toast.error("⚠️ Sipariş formu basabilmek için lütfen önce 'Siparişi Oluştur' butonuna basarak siparişi kaydediniz.");
      return;
    }

    if (isOrderModified) {
      setIsOrderModifiedWarningOpen(true);
      toast.error("⚠️ Lütfen siparişi güncelleyin veya yeni bir sipariş olarak kaydedin.");
      return;
    }

    // Kredi Kontrolü: Sınırsız değilse ve kredi sıfır veya altındaysa engelle ve uyar
    const isUnlimited = subscriptionData.isUnlimited || subscriptionData.subscriptionTier === "unlimited";
    if (!isUnlimited && subscriptionData.remainingCredits <= 0) {
      toast.error("Krediniz yetersiz, lütfen kredi yükleyin.");
      setIsSubscriptionModalOpen(true);
      return;
    }

    // Validate required fields softly and provide defaults so print never fails
    const isNameEmpty = !customerName || !customerName.trim();
    const isPhoneEmpty = !customerPhone || !customerPhone.trim();
    const isDateEmpty = !deliveryDate || !deliveryDate.trim();

    if (isNameEmpty) {
      setCustomerNameError(true);
    }
    if (isPhoneEmpty) {
      setCustomerPhoneError(true);
    }
    if (isDateEmpty) {
      setDeliveryDateError(true);
    }

    const effectiveCustomerName = customerName?.trim() || "Değerli Müşterimiz";
    const effectiveCustomerPhone = customerPhone?.trim() || "05XX XXX XX XX";
    const effectiveDeliveryDate = deliveryDate?.trim() || new Date(Date.now() + 3 * 86400000).toLocaleDateString("tr-TR");

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High resolution square canvas setup (1200px visual square for clean frame image only)
    canvas.width = 1200;
    canvas.height = 1200;

    // Load frame texture and painting images in parallel
    const frameDefault = "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop";
    const artDefault = ""; // No default fallbacks for paintings, as we have customPaintingUrl

    const [frameImg, outerFrameImg, artImg] = await Promise.all([
      loadImagePromise(customFrameUrl, frameDefault),
      loadImagePromise(customOuterFrameUrl, frameDefault),
      loadImagePromise(customPaintingUrl, artDefault)
    ]);

    // 1. Fill Background Wall Color OR Customer Room Photo
    if (wallMode === "room" && (customerRoomImage || DEFAULT_ROOM_TEMPLATES[0].url)) {
      try {
        const roomImg = await loadImagePromise(customerRoomImage || DEFAULT_ROOM_TEMPLATES[0].url, "");
        if (roomImg) {
          ctx.save();
          ctx.filter = `brightness(${roomBrightness}%)`;
          const canvasAspect = canvas.width / canvas.height;
          const imgAspect = roomImg.width / roomImg.height;
          let sx = 0, sy = 0, sw = roomImg.width, sh = roomImg.height;
          if (imgAspect > canvasAspect) {
            sw = sh * canvasAspect;
            sx = (roomImg.width - sw) / 2;
          } else {
            sh = sw / canvasAspect;
            sy = (roomImg.height - sh) / 2;
          }
          ctx.drawImage(roomImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else {
          ctx.fillStyle = wallColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } catch {
        ctx.fillStyle = wallColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      ctx.fillStyle = wallColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Light lighting overlay simulation
    if (lightingStyle === "cozy-lamp") {
      const radialGrad = createSafeRadialGradient(ctx, canvas.width * 0.3, canvas.height * 0.75, 50, canvas.width * 0.3, canvas.height * 0.75, 800);
      radialGrad.addColorStop(0, "rgba(253, 230, 138, 0.45)");
      radialGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (lightingStyle === "spotlight") {
      const radialGrad = createSafeRadialGradient(ctx, canvas.width * 0.5, canvas.height * 0.3, 100, canvas.width * 0.5, canvas.height * 0.3, 700);
      radialGrad.addColorStop(0, "rgba(255, 255, 255, 0.33)");
      radialGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Position frame inside visual 1200x1200px canvas (Milimetrik oranlama sistemi)
    const canvasTotalW = artworkWidth + 2 * (outerFrameWidth + middleMatWidth + frameWidth + matWidth);
    const canvasTotalH = artworkHeight + 2 * (outerFrameWidth + middleMatWidth + frameWidth + matWidth);
    const canvasTotalAspect = canvasTotalW / canvasTotalH;

    let drawW = 0;
    let drawH = 0;
    let canvasPxPerCm = 1;
    let x = 0;
    let y = 0;

    // Fit canvas bounds inside 1/1 square beautifully, leaving 12% border padding for professional visual breathing space
    const maxCanvasDim = 1200 * 0.78;
    if (canvasTotalAspect > 1) {
      drawW = maxCanvasDim;
      drawH = maxCanvasDim / canvasTotalAspect;
    } else {
      drawH = maxCanvasDim;
      drawW = drawH * canvasTotalAspect;
    }

    canvasPxPerCm = drawW / canvasTotalW;
    x = (1200 - drawW) / 2;
    y = (1200 - drawH) / 2;

    const cOuterFrameW = outerFrameWidth * canvasPxPerCm;
    const cMiddleMatW = middleMatWidth * canvasPxPerCm;
    const cFrameW = frameWidth * canvasPxPerCm;
    const cMatW = matWidth * canvasPxPerCm;
    const cArtW = artworkWidth * canvasPxPerCm;
    const cArtH = artworkHeight * canvasPxPerCm;

    // Reusable helper to draw a mitered/border-slice picture frame
    const drawFrameOnCanvas = (
      img: HTMLImageElement | null,
      mode: string,
      fx: number,
      fy: number,
      fW: number,
      fH: number,
      fWidthPx: number
    ) => {
      const mx = fx + fWidthPx;
      const my = fy + fWidthPx;
      const mW = fW - 2 * fWidthPx;
      const mH = fH - 2 * fWidthPx;

      if (img && fWidthPx > 0) {
        if (mode === "border-slice") {
          ctx.fillStyle = ctx.createPattern(img, 'repeat') || "#a18262";
          ctx.fillRect(fx, fy, fW, fH);
          ctx.clearRect(mx, my, mW, mH);
        } else {
          // MITER JOINT ENHANCED CANVAS RENDERING
          const imgW = img.naturalWidth || img.width || 100;
          const imgH = img.naturalHeight || img.height || 100;
          const tileW = Math.max(1, fWidthPx * (imgW / imgH));

          // Helper to draw one side bar (either stretch or tiled repeat)
          const drawSideBar = (sideLength: number) => {
            if (mode === "miter-stretch") {
              ctx.drawImage(img, -sideLength / 2, -fWidthPx / 2, sideLength, fWidthPx);
            } else {
              // Tiled repeat mode: scale texture height to frame thickness, tile along length
              const startX = -sideLength / 2;
              const endX = sideLength / 2;
              for (let curX = startX; curX < endX; curX += tileW) {
                ctx.drawImage(img, curX, -fWidthPx / 2, tileW, fWidthPx);
              }
            }
          };

          // 1. Top Side (Flipped vertically so texture inner lip faces inner frame edge)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + fW, fy);
          ctx.lineTo(mx + mW, my);
          ctx.lineTo(mx, my);
          ctx.closePath();
          ctx.clip();
          ctx.translate(fx + fW / 2, fy + fWidthPx / 2);
          ctx.scale(1, -1);
          drawSideBar(fW);
          ctx.restore();

          // 2. Bottom Side (Normal 0 degrees)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fx, fy + fH);
          ctx.lineTo(fx + fW, fy + fH);
          ctx.lineTo(mx + mW, my + mH);
          ctx.lineTo(mx, my + mH);
          ctx.closePath();
          ctx.clip();
          ctx.translate(fx + fW / 2, fy + fH - fWidthPx / 2);
          drawSideBar(fW);
          ctx.restore();

          // 3. Left Side (Rotated 90 degrees)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(mx, my);
          ctx.lineTo(mx, my + mH);
          ctx.lineTo(fx, fy + fH);
          ctx.closePath();
          ctx.clip();
          ctx.translate(fx + fWidthPx / 2, fy + fH / 2);
          ctx.rotate(Math.PI / 2);
          drawSideBar(fH);
          ctx.restore();

          // 4. Right Side (Rotated 90 degrees + Flipped vertically so inner lip faces inner frame edge)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fx + fW, fy);
          ctx.lineTo(mx + mW, my);
          ctx.lineTo(mx + mW, my + mH);
          ctx.lineTo(fx + fW, fy + fH);
          ctx.closePath();
          ctx.clip();
          ctx.translate(fx + fW - fWidthPx / 2, fy + fH / 2);
          ctx.rotate(Math.PI / 2);
          ctx.scale(1, -1);
          drawSideBar(fH);
          ctx.restore();
        }
      } else if (fWidthPx > 0) {
        // Solid fallback frame outline if frame pattern fails to load
        ctx.fillStyle = "#333333";
        ctx.fillRect(fx, fy, fW, fH);
        ctx.clearRect(mx, my, mW, mH);
      }

      if (fWidthPx > 0) {
        // Bevel border lines to simulate 3D frame mitres
        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 4;
        ctx.strokeRect(fx, fy, fW, fH);
        ctx.strokeRect(mx, my, mW, mH);

        // Diagonals representing miter joints
        ctx.beginPath();
        ctx.moveTo(fx, fy); ctx.lineTo(mx, my);
        ctx.moveTo(fx + fW, fy); ctx.lineTo(mx + mW, my);
        ctx.moveTo(fx, fy + fH); ctx.lineTo(mx, my + mH);
        ctx.moveTo(fx + fW, fy + fH); ctx.lineTo(mx + mW, my + mH);
        ctx.stroke();
      }
    };

    // 3. Render Outer Drop Shadow for outermost boundary
    const shadowTargetWidth = outerFrameWidth > 0 ? outerFrameWidth : frameWidth;
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = Math.round(shadowTargetWidth * 6);
    ctx.shadowOffsetX = Math.round(shadowTargetWidth * 3);
    ctx.shadowOffsetY = Math.round(shadowTargetWidth * 4);

    // Draw Outer Frame (if present)
    if (outerFrameWidth > 0) {
      drawFrameOnCanvas(outerFrameImg, outerFrameLayoutMode, x, y, drawW, drawH, cOuterFrameW);
      // Reset shadow for the layers inside the outer frame
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw Middle Mat (Ara Paspartu) if present (represented as a 3D bevel cardboard mat)
    if (middleMatWidth > 0) {
      const midMatX = x + cOuterFrameW;
      const midMatY = y + cOuterFrameW;
      const midMatW = drawW - 2 * cOuterFrameW;
      const midMatH = drawH - 2 * cOuterFrameW;

      // Cardboard/matte background
      if (outerMatColor === "transparent" || outerMatColor === "glass") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
        ctx.fillRect(midMatX, midMatY, midMatW, midMatH);
        const sheenGrad = createSafeLinearGradient(ctx, midMatX, midMatY, midMatX + midMatW, midMatY + midMatH);
        sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.07)");
        sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
        sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0.05)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(midMatX, midMatY, midMatW, midMatH);
      } else {
        ctx.fillStyle = outerMatColor;
        ctx.fillRect(midMatX, midMatY, midMatW, midMatH);
      }

      // Clean 3D cardboard borders and light-bevel shadow representation
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(midMatX, midMatY, midMatW, midMatH);

      // Draw thick depth inner shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      // Top shadow
      ctx.fillRect(midMatX, midMatY, midMatW, 6);
      // Left shadow
      ctx.fillRect(midMatX, midMatY, 6, midMatH);
    }

    // Draw Inner Frame
    const innerX = x + cOuterFrameW + cMiddleMatW;
    const innerY = y + cOuterFrameW + cMiddleMatW;
    const innerW = drawW - 2 * (cOuterFrameW + cMiddleMatW);
    const innerH = drawH - 2 * (cOuterFrameW + cMiddleMatW);
    
    // Draw Inner Frame (has shadow if there are no outer layers)
    if (outerFrameWidth === 0 && middleMatWidth === 0) {
      drawFrameOnCanvas(frameImg, frameLayoutMode, innerX, innerY, innerW, innerH, cFrameW);
      // Reset shadow
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      drawFrameOnCanvas(frameImg, frameLayoutMode, innerX, innerY, innerW, innerH, cFrameW);
    }

    // 4. Draw Matte (Paspartu) Inner Area
    const mx = innerX + cFrameW;
    const my = innerY + cFrameW;
    const mW = innerW - 2 * cFrameW;
    const mH = innerH - 2 * cFrameW;

    if (innerMatColor === "transparent" || innerMatColor === "glass") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.fillRect(mx, my, mW, mH);
      const sheenGrad = createSafeLinearGradient(ctx, mx, my, mx + mW, my + mH);
      sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.07)");
      sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
      sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0.05)");
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(mx, my, mW, mH);
    } else {
      ctx.fillStyle = innerMatColor;
      ctx.fillRect(mx, my, mW, mH);
    }

    // Add inner border wrapping artwork
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;

    const ax = mx + cMatW;
    const ay = my + cMatW;
    const aW = cArtW;
    const aH = cArtH;
    ctx.strokeRect(ax - 2, ay - 2, aW + 4, aH + 4);

    // Inner drop shadow on artwork
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(ax, ay, aW, aH);

    // 5. Draw Artwork Painting Canvas
    if (artImg) {
      ctx.drawImage(artImg, ax, ay, aW, aH);
    } else {
      // Fallback empty beige canvas if image fails to load
      ctx.fillStyle = "#EAE6DF";
      ctx.fillRect(ax, ay, aW, aH);
      ctx.fillStyle = "#888888";
      ctx.font = "italic 20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Tablo Seçilmedi / Yüklenemedi", ax + aW / 2, ay + aH / 2);
    }

    // Add final highlight representation
    ctx.beginPath();
    let glossGrad = createSafeLinearGradient(ctx, ax, ay, ax + aW, ay + aH);
    glossGrad.addColorStop(0, "rgba(255,255,255,0.08)");
    glossGrad.addColorStop(0.5, "rgba(255,255,255,0.01)");
    glossGrad.addColorStop(1, "rgba(0,0,0,0.1)");
    ctx.fillStyle = glossGrad;
    ctx.fillRect(ax, ay, aW, aH);

    // Reset baseline and alignment for safety
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const formattedDeliveryDate = deliveryDate.includes('-') 
      ? deliveryDate.split('-').reverse().join('.') 
      : deliveryDate;

    const fullPhone = customerPhone.trim() 
      ? (customerPhone.startsWith('+90') ? customerPhone : `+90 ${customerPhone}`) 
      : 'Belirtilmedi';

    // Generate functional QR Code (Karakod) for the A4 document
    const qrText = `NAKKA DEKOR | IS EMRI
Siparis No: ${orderNumber}
Tarih: ${new Date().toLocaleDateString('tr-TR')}
Musteri: ${customerName || 'Belirtilmedi'}
Telefon: ${fullPhone}
Teslim Tarihi: ${formattedDeliveryDate || 'Belirtilmedi'}
Sanat Eseri: ${artworkWidth}x${artworkHeight} cm
Paspartu: ${matWidth > 0 ? `${matWidth} cm` : 'Yok'}
Ara Paspartu (3D): ${middleMatWidth > 0 ? `${middleMatWidth} cm` : 'Yok'}
Ic Cerceve: ${frameWidth} cm (Profil: ${customFrameFile})
Dis Cerceve: ${outerFrameWidth > 0 ? `${outerFrameWidth} cm (Profil: ${customOuterFrameFile})` : 'Yok'}
Toplam Olcu: ${totalW.toFixed(2)}x${totalH.toFixed(2)} cm
Fiyat: TL ${(costBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity)).toLocaleString('tr-TR')}${orderQuantity > 1 ? ` (${orderQuantity} Adet Toplamı)` : ''}
Durum: Onaylandi / Uretime Hazir${referencedOrderNumber ? `\nRevizyon Ref: #${referencedOrderNumber}` : ''}${(revisionNote || orderNotes) ? `\nNot: ${(revisionNote || orderNotes).replace(/\n/g, ' ')}` : ''}`;

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(qrText, {
        margin: 1,
        color: {
          dark: "#121415",
          light: "#FFFFFF"
        },
        width: 300
      });
    } catch (err) {
      console.error("QR Code generation failed:", err);
    }

    // Open A4 printable document with clean 1200x1200px PNG image and vector HTML text
    const dataUrl = canvas.toDataURL("image/png");
    
    // Dynamic PDF/PNG file name format: tarih, siparis_no, musteri_ismi
    const todayFormatted = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cleanCustomerName = customerName.trim()
      ? customerName.trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, "_")
      : "Musteri";
    const docTitle = `${todayFormatted}_${orderNumber}_${cleanCustomerName}`;
    const fileName = `${docTitle}.png`;

    triggerImagePrintWindow(
      docTitle,
      dataUrl,
      fileName,
      {
        orderNumber,
        customerName: customerName.trim() || effectiveCustomerName,
        customerPhone: fullPhone === 'Belirtilmedi' ? effectiveCustomerPhone : fullPhone,
        deliveryDate: deliveryDate.trim() || effectiveDeliveryDate,
        artworkWidth,
        artworkHeight,
        matWidth,
        middleMatWidth,
        frameWidth,
        outerFrameWidth,
        innerRabbetDepthMm: activeInnerRabbetMm,
        outerRabbetDepthMm: activeOuterRabbetMm,
        totalW,
        totalH,
        customPaintingFile,
        customFrameFile,
        customOuterFrameFile,
        effectivePrice: costBreakdown.effectiveFinalPriceWithVat,
        totalPrice: Math.round(costBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity)),
        deliveryMethod,
        shippingCost: costBreakdown.shippingCost,
        qrDataUrl,
        flags: effectiveInclusionFlags,
        companyProfile: companyProfile.includeInQuotes ? {
          ...companyProfile,
          logoUrl: isProPlan(subscriptionData) ? companyProfile.logoUrl : ""
        } : undefined,
        authorUser: activeUser?.fullName,
        quantity: orderQuantity,
        notes: orderNotes,
        revisionNote: revisionNote,
        referencedOrderNumber: referencedOrderNumber
      }
    );

    // Save to order archive
    const newArchiveItem: OrderArchiveItem = {
      id: "ord_" + Date.now(),
      orderNumber: orderNumber,
      createdAt: new Date().toLocaleDateString("tr-TR") + " " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      customerName: customerName.trim() || "İsimsiz Müşteri",
      customerPhone: fullPhone === "Belirtilmedi" ? "" : fullPhone,
      deliveryDate: deliveryDate || undefined,
      artworkWidthCm: artworkWidth,
      artworkHeightCm: artworkHeight,
      innerFrameTitle: activeInnerProfile ? `${activeInnerProfile.code} - ${activeInnerProfile.name}` : customFrameFile,
      outerFrameTitle: outerFrameWidth > 0 ? (activeOuterProfile ? `${activeOuterProfile.code} - ${activeOuterProfile.name}` : customOuterFrameFile) : "Yok",
      matInfo: matWidth > 0 ? `${matWidth} cm ${getPaspartuColorName(innerMatColor)}` : "Paspartusuz",
      totalAmount: costBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity),
      quantity: Math.max(1, orderQuantity),
      currency: "₺",
      status: "quote",
      deliveryMethod: deliveryMethod,
      authorUser: activeUser?.fullName || "Yetkili Personel",

      // Simülatör yapılandırma anlık görüntüsü
      innerProfileId: selectedInnerProfileId,
      outerProfileId: selectedOuterProfileId,
      matWidthCm: matWidth,
      frameWidthCm: frameWidth,
      middleMatWidthCm: middleMatWidth,
      outerFrameWidthCm: outerFrameWidth,
      innerMatColor: innerMatColor,
      outerMatColor: outerMatColor,
      customPaintingUrl: customPaintingUrl,
      customPaintingFile: customPaintingFile,
      renderedFrameDataUrl: dataUrl,
      inclusionFlags: effectiveInclusionFlags,
      customOverridePrice: customOverridePrice,
      simulatorConfig: {
        innerProfileId: selectedInnerProfileId,
        outerProfileId: selectedOuterProfileId,
        matWidthCm: matWidth,
        frameWidthCm: frameWidth,
        middleMatWidthCm: middleMatWidth,
        outerFrameWidthCm: outerFrameWidth,
        innerMatColor: innerMatColor,
        outerMatColor: outerMatColor,
        customPaintingUrl: customPaintingUrl,
        customPaintingFile: customPaintingFile,
        flags: effectiveInclusionFlags,
        customOverridePrice: customOverridePrice,
        quantity: Math.max(1, orderQuantity),
        orderQuantity: Math.max(1, orderQuantity)
      }
    };

    // Mevcut siparişleri ezmeden yeni siparişi başa ekle
    setArchiveOrders(prev => {
      const filtered = prev.filter(o => o.orderNumber !== newArchiveItem.orderNumber && o.id !== newArchiveItem.id);
      return [newArchiveItem, ...filtered];
    });

    toast.success("Sipariş başarıyla oluşturuldu.");

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { data, error } = await createOrderInSupabase(newArchiveItem);
          if (error) {
            console.warn("Supabase createOrder sync warning:", error);
          } else if (data && data.id) {
            setArchiveOrders(prev => prev.map(o => o.orderNumber === newArchiveItem.orderNumber ? { ...o, id: data.id } : o));
          }
        } catch (err) {
          console.warn("Supabase createOrder sync exception:", err);
        }
      })();
    }

    // Deduct 1 credit from subscription if not unlimited
    if (!subscriptionData.isUnlimited && subscriptionData.subscriptionTier !== "unlimited") {
      const updatedSub = deductSubscriptionCredit();
      setSubscriptionData(updatedSub);
      decrementCredit(1);
      if (isSupabaseConfigured()) {
        deductTenantCreditInSupabase(authGuardTenant?.id || activeUser?.id);
      }
    }
  };

  // Arşivden çağrılan siparişi sahnede tam oluşturup anında eksiksiz yazdırma
  useEffect(() => {
    if (!pendingAutoPrint) return;
    const action = pendingAutoPrint;
    setPendingAutoPrint(null);

    const timer = setTimeout(() => {
      if (action === "order_form") {
        downloadCompositedImage();
      } else if (action === "cutting_list") {
        triggerCuttingListPrintWindow({
          cutList,
          customerName,
          deliveryDate,
          artworkWidthCm: artworkWidth,
          artworkHeightCm: artworkHeight,
          companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined
        });
      } else if (action === "label") {
        triggerBackLabelPrintWindow({
          orderNumber,
          customerName,
          customerPhone,
          deliveryDate,
          artworkWidth,
          artworkHeight,
          totalW,
          totalH,
          innerFrameTitle: activeInnerProfile ? `${activeInnerProfile.code} - ${activeInnerProfile.name}` : customFrameFile,
          outerFrameTitle: outerFrameWidth > 0 ? (activeOuterProfile ? `${activeOuterProfile.code} - ${activeOuterProfile.name}` : customOuterFrameFile) : "Yok",
          matInfo: matWidth > 0 ? `${matWidth} cm ${getPaspartuColorName(innerMatColor)}` : "Paspartusuz",
          effectivePrice: costBreakdown.effectiveFinalPriceWithVat,
          quantity: Math.max(1, orderQuantity),
          companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined,
          authorUser: activeUser?.fullName
        });
      } else if (action === "cost") {
        triggerCostBreakdownPrintWindow({
          breakdown: costBreakdown,
          settings: unitPricesSettings,
          artworkWidthCm: artworkWidth,
          artworkHeightCm: artworkHeight,
          orderNumber,
          customerName,
          deliveryDate,
          flags: effectiveInclusionFlags,
          companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined,
          quantity: Math.max(1, orderQuantity),
          customOverridePrice
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pendingAutoPrint]);

  // Simülatörden Doğrudan Sipariş Oluşturma (Görsel 3 & 4 Doğrulaması)
  const handleCreateOrderFromSimulator = async (options?: { asNewOrder?: boolean }) => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const normalizeDateToIso = (dStr?: string | null): string => {
      if (!dStr) return "";
      const trimmed = dStr.trim();
      if (trimmed.includes('.')) {
        const parts = trimmed.split('.');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        if (parts.length === 3 && parts[0].length <= 2) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return trimmed;
    };

    const isNameEmpty = !customerName || !customerName.trim();
    const isPhoneEmpty = !customerPhone || !customerPhone.trim();
    const isDateEmpty = !deliveryDate || !deliveryDate.trim();
    const isDateInvalid = isDateEmpty;

    if (isNameEmpty || isPhoneEmpty || isDateInvalid) {
      if (isNameEmpty) setCustomerNameError(true);
      if (isPhoneEmpty) setCustomerPhoneError(true);

      const dateErrMsg = "Lütfen teslim tarihini belirleyiniz.";

      if (isDateInvalid) {
        setDeliveryDateError(true);
        setDeliveryDateErrorMessage(dateErrMsg);
      }

      if (isDateInvalid && !isNameEmpty && !isPhoneEmpty) {
        toast.error(dateErrMsg);
      } else {
        toast.error("Siparişi oluşturmak için lütfen kırmızı ile belirtilen zorunlu alanları doldurunuz.");
      }

      if (isNameEmpty) {
        document.getElementById("customer-name-input")?.focus();
      } else if (isPhoneEmpty) {
        document.getElementById("customer-phone-input")?.focus();
      } else if (isDateInvalid) {
        document.getElementById("delivery-date-input")?.focus();
      }
      return;
    }

    const trimmedPhone = formatTrPhone(customerPhone) || customerPhone.trim();
    const fullPhone = trimmedPhone.startsWith('+90') 
      ? trimmedPhone 
      : `+90 ${trimmedPhone}`;

    // Standardize ISO date (YYYY-MM-DD) for PostgreSQL
    const isoDeliveryDate = normalizeDateToIso(deliveryDate) || deliveryDate.trim();

    const asNewOrder = options?.asNewOrder === true;

    const existingOrder = !asNewOrder ? archiveOrders.find(
      o => o.orderNumber === orderNumber || (activeOrderId && o.id === activeOrderId)
    ) : undefined;
    const isUpdate = !asNewOrder && Boolean(activeOrderId || existingOrder);

    // Kural 1 & 2: Güncelleme Kilit ve Maliyet Kontrolleri
    if (isUpdate && existingOrder) {
      const orderSt = existingOrder.status;
      const isProdOrDeliv = orderSt === "production" || (orderSt as string) === "in_production" || orderSt === "delivered";
      if (isProdOrDeliv) {
        toast.error("Üretimde veya teslim edilmiş bir siparişi güncelleyemezsiniz.");
        return;
      }
      if (isCostAffectingModified) {
        toast.error("Maliyeti etkileyen alanlar (En, Boy, Profil, Cam, Adet) değiştirildiğinde mevcut sipariş güncellenemez. Lütfen 'Yeni Sipariş Oluştur' butonunu kullanın.");
        return;
      }
    }

    let currentOrderNum = orderNumber;
    let oldReferencedOrderNum = referencedOrderNumber;
    let finalNotes = orderNotes;
    let finalRevisionNote = revisionNote;
    let effectiveOverridePrice = customOverridePrice;

    if (asNewOrder) {
      // Kural 3: Formdaki verileri koru ancak order_id değerini sıfırla, yeni sipariş numarası ata
      oldReferencedOrderNum = orderNumber; // Arşivden çağrılan eski sipariş numarası
      currentOrderNum = generateOrderNumber();
      setOrderNumber(currentOrderNum);
      setActiveOrderId(null);
      setActiveOrderCreatedAt(null);

      // Kural 3: Güncel malzeme fiyatlarıyla yeni bir 'Genel Toplam' hesaplat (Eski manuel override sıfırlanır)
      effectiveOverridePrice = null;
      setCustomOverridePrice(null);

      // Kural 4: Otomatik Referans Notu
      const autoRefNote = `Sistem Notu: Revize edilen referans sipariş no: ${oldReferencedOrderNum}`;
      finalRevisionNote = autoRefNote;
      const trimmedNotes = orderNotes.trim();
      if (trimmedNotes) {
        if (!trimmedNotes.includes(autoRefNote)) {
          finalNotes = `${trimmedNotes}\n${autoRefNote}`;
        } else {
          finalNotes = trimmedNotes;
        }
      } else {
        finalNotes = autoRefNote;
      }
      setOrderNotes(finalNotes);
      setRevisionNote(autoRefNote);
      setReferencedOrderNumber(oldReferencedOrderNum);
    }

    // Kredi Kontrolü: Yeni sipariş oluşturulurken (güncelleme değilse) kredi sıfır veya altındaysa engelle
    const isUnlimited = subscriptionData.isUnlimited || subscriptionData.subscriptionTier === "unlimited";
    if (!isUpdate && !isUnlimited && subscriptionData.remainingCredits <= 0) {
      toast.error("Krediniz yetersiz, lütfen kredi yükleyin.");
      setIsSubscriptionModalOpen(true);
      return;
    }

    // 1, 3, 4: Tarihsel Tutarlılık (Historical Accuracy) ve Price Snapshot Yönetimi
    let finalPriceSnapshot: PriceSnapshot;
    let finalCostBreakdownForOrder: CostCalculationBreakdown;

    if (asNewOrder) {
      // Kural 4: Yeni Fiyatlara Geçiş (Sadece Revizyonda):
      // Eski snapshot'ı sil, sistemdeki en güncel (zamlı) malzeme birim fiyatlarını çekerek yepyeni maliyet tablosu ve yeni snapshot oluştur.
      const freshCostBreakdown = calculateCostsAndPricing({
        artworkWidthCm: artworkWidth,
        artworkHeightCm: artworkHeight,
        matWidthCm: matWidth,
        frameWidthCm: frameWidth,
        middleMatWidthCm: middleMatWidth,
        outerFrameWidthCm: outerFrameWidth,
        innerMatColor: innerMatColor,
        outerMatColor: outerMatColor,
        selectedInnerProfileMeterPrice: activeInnerProfile?.unitPricePerMeter,
        selectedOuterProfileMeterPrice: activeOuterProfile?.unitPricePerMeter,
        innerRabbetDepthMm: activeInnerRabbetMm,
        outerRabbetDepthMm: activeOuterRabbetMm,
        customOverridePrice: null, // Revizyonda eski manuel override sıfırlanır
        deliveryMethod: deliveryMethod,
        settings: unitPricesSettings, // En güncel birim fiyatlar
        flags: effectiveInclusionFlags
      });

      const freshSnapshot: PriceSnapshot = {
        unitPrices: { ...unitPricesSettings },
        costBreakdown: freshCostBreakdown,
        innerProfileMeterPrice: activeInnerProfile?.unitPricePerMeter,
        outerProfileMeterPrice: activeOuterProfile?.unitPricePerMeter,
        innerProfileId: selectedInnerProfileId,
        outerProfileId: selectedOuterProfileId,
        snapshotDate: new Date().toLocaleDateString("tr-TR") + " " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      };
      setLoadedPriceSnapshot(freshSnapshot);
      finalPriceSnapshot = freshSnapshot;
      finalCostBreakdownForOrder = freshCostBreakdown;
    } else if (isUpdate) {
      // Kural 3: Maliyeti Etkilemeyen Güncellemeler:
      // Kullanıcı sadece 'Müşteri Adı' veya 'Not' vb. değiştirip 'Siparişi Güncelle' dediğinde,
      // mevcut price_snapshot verisini koru, kesinlikle güncel fiyatlarla ezme.
      const preservedSnapshot: PriceSnapshot = loadedPriceSnapshot || existingOrder?.price_snapshot || existingOrder?.simulatorConfig?.price_snapshot || {
        unitPrices: { ...unitPricesSettings },
        costBreakdown: existingOrder?.cost_breakdown || costBreakdown,
        innerProfileMeterPrice: activeInnerProfile?.unitPricePerMeter,
        outerProfileMeterPrice: activeOuterProfile?.unitPricePerMeter,
        innerProfileId: selectedInnerProfileId,
        outerProfileId: selectedOuterProfileId,
        snapshotDate: existingOrder?.createdAt || new Date().toISOString()
      };
      setLoadedPriceSnapshot(preservedSnapshot);
      finalPriceSnapshot = preservedSnapshot;
      finalCostBreakdownForOrder = preservedSnapshot.costBreakdown;
    } else {
      // Kural 1: İlk Kez Yeni Sipariş Oluşturulduğunda o anki GÜNCEL malzeme birim fiyatlarıyla snapshot al:
      const initialSnapshot: PriceSnapshot = {
        unitPrices: { ...unitPricesSettings },
        costBreakdown: costBreakdown,
        innerProfileMeterPrice: activeInnerProfile?.unitPricePerMeter,
        outerProfileMeterPrice: activeOuterProfile?.unitPricePerMeter,
        innerProfileId: selectedInnerProfileId,
        outerProfileId: selectedOuterProfileId,
        snapshotDate: new Date().toLocaleDateString("tr-TR") + " " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      };
      setLoadedPriceSnapshot(initialSnapshot);
      finalPriceSnapshot = initialSnapshot;
      finalCostBreakdownForOrder = costBreakdown;
    }

    const resolvedId = (!asNewOrder && (activeOrderId || existingOrder?.id)) || ("ord_" + Date.now());

    const canvas = document.querySelector(".canvas-container canvas") as HTMLCanvasElement;
    let currentPreviewDataUrl: string | undefined = undefined;
    if (canvas) {
      try {
        currentPreviewDataUrl = canvas.toDataURL("image/png");
      } catch (e) {
        console.warn("Could not capture canvas preview:", e);
      }
    }

    // Kural 2 & 3: Teklif/Onaylandı durumunda sadece maliyeti etkilemeyen alanlar güncellendiğinde eski fiyat korunur
    const finalTotalAmount = isUpdate && existingOrder && !isCostAffectingModified
      ? (existingOrder.totalAmount ?? (finalCostBreakdownForOrder.effectiveFinalPriceWithVat * Math.max(1, orderQuantity)))
      : (asNewOrder
          ? (finalCostBreakdownForOrder.calculatedPriceWithVat * Math.max(1, orderQuantity))
          : (displayCostBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity)));

    const finalCustomOverride = isUpdate && existingOrder && !isCostAffectingModified
      ? (existingOrder.customOverridePrice ?? customOverridePrice)
      : effectiveOverridePrice;

    const finalStatus: OrderStatus = asNewOrder ? "quote" : ((!asNewOrder && existingOrder?.status) || "quote");

    const newArchiveItem: OrderArchiveItem = {
      id: resolvedId,
      orderNumber: currentOrderNum,
      createdAt: (!asNewOrder && existingOrder?.createdAt) || (new Date().toLocaleDateString("tr-TR") + " " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })),
      customerName: customerName.trim(),
      customerPhone: fullPhone,
      deliveryDate: isoDeliveryDate,
      artworkWidthCm: artworkWidth,
      artworkHeightCm: artworkHeight,
      innerFrameTitle: activeInnerProfile ? `${activeInnerProfile.code} - ${activeInnerProfile.name}` : (customFrameFile || "Standart Profil"),
      outerFrameTitle: outerFrameWidth > 0 ? (activeOuterProfile ? `${activeOuterProfile.code} - ${activeOuterProfile.name}` : customOuterFrameFile) : "Yok",
      matInfo: matWidth > 0 ? `${matWidth} cm ${getPaspartuColorName(innerMatColor)}` : "Paspartusuz",
      totalAmount: finalTotalAmount,
      quantity: Math.max(1, orderQuantity),
      currency: "₺",
      status: finalStatus,
      deliveryMethod: deliveryMethod,
      authorUser: activeUser?.fullName || "Yetkili Personel",
      notes: finalNotes,
      revisionNote: finalRevisionNote,
      referencedOrderNumber: oldReferencedOrderNum,

      // Tarihsel Fiyat Kaydı (Price Snapshot)
      price_snapshot: finalPriceSnapshot,
      cost_breakdown: finalCostBreakdownForOrder,

      // Simülatör anlık yapılandırma görüntüsü
      innerProfileId: selectedInnerProfileId,
      outerProfileId: selectedOuterProfileId,
      innerRabbetDepthMm: activeInnerRabbetMm,
      outerRabbetDepthMm: activeOuterRabbetMm,
      matWidthCm: matWidth,
      frameWidthCm: frameWidth,
      middleMatWidthCm: middleMatWidth,
      outerFrameWidthCm: outerFrameWidth,
      innerMatColor: innerMatColor,
      outerMatColor: outerMatColor,
      customPaintingUrl: customPaintingUrl,
      customPaintingFile: customPaintingFile,
      renderedFrameDataUrl: currentPreviewDataUrl || existingOrder?.renderedFrameDataUrl,
      inclusionFlags: effectiveInclusionFlags,
      customOverridePrice: finalCustomOverride,
      simulatorConfig: {
        innerProfileId: selectedInnerProfileId,
        outerProfileId: selectedOuterProfileId,
        innerRabbetDepthMm: activeInnerRabbetMm,
        outerRabbetDepthMm: activeOuterRabbetMm,
        matWidthCm: matWidth,
        frameWidthCm: frameWidth,
        middleMatWidthCm: middleMatWidth,
        outerFrameWidthCm: outerFrameWidth,
        innerMatColor: innerMatColor,
        outerMatColor: outerMatColor,
        customPaintingUrl: customPaintingUrl,
        customPaintingFile: customPaintingFile,
        flags: effectiveInclusionFlags,
        customOverridePrice: finalCustomOverride,
        quantity: Math.max(1, orderQuantity),
        price_snapshot: finalPriceSnapshot,
        cost_breakdown: finalCostBreakdownForOrder
      }
    };

    setActiveOrderId(resolvedId);

    setArchiveOrders(prev => {
      if (isUpdate) {
        return prev.map(o => (o.orderNumber === newArchiveItem.orderNumber || o.id === newArchiveItem.id) ? newArchiveItem : o);
      }
      return [newArchiveItem, ...prev];
    });

    if (isUpdate) {
      toast.success(`${currentOrderNum} numaralı sipariş başarıyla güncellendi (Eski onaylı fiyat korundu).`);
    } else if (asNewOrder) {
      toast.success(`${currentOrderNum} numaralı revize sipariş güncel fiyatlarla oluşturuldu. (Ref: #${oldReferencedOrderNum})`);
    } else {
      toast.success("Sipariş başarıyla oluşturuldu.");
    }

    // Form state'lerini normalize edilmiş değerlerle senkronize et
    setCustomerPhone(trimmedPhone);
    if (isoDeliveryDate) {
      setDeliveryDate(isoDeliveryDate);
    }

    // Sipariş kaydedildiğinde/güncellendiğinde snapshot senkronize edilir (Madde 2)
    setLoadedOrderSnapshot({
      orderNumber: currentOrderNum,
      orderId: resolvedId,
      customerName: customerName.trim(),
      customerPhone: fullPhone,
      deliveryDate: isoDeliveryDate || (deliveryDate || "").trim(),
      deliveryMethod: deliveryMethod,
      orderQuantity: Math.max(1, orderQuantity),
      artworkWidth: artworkWidth,
      artworkHeight: artworkHeight,
      customPaintingUrl: customPaintingUrl,
      selectedInnerProfileId: selectedInnerProfileId,
      frameWidth: frameWidth,
      selectedOuterProfileId: selectedOuterProfileId,
      outerFrameWidth: outerFrameWidth,
      matWidth: matWidth,
      middleMatWidth: middleMatWidth,
      innerMatColor: innerMatColor,
      outerMatColor: outerMatColor,
      inclusionFlags: { ...effectiveInclusionFlags },
      customOverridePrice: finalCustomOverride,
      status: finalStatus
    });
    setLoadedOrderStatus(finalStatus);

    setLoadedOrderOriginalDeliveryDate(null);
    setDeliveryDateErrorMessage(null);
    setDeliveryDateError(false);

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { data, error } = await createOrderInSupabase(newArchiveItem);
          if (error) {
            console.warn("Supabase createOrder sync warning:", error);
          } else if (data && data.id) {
            setActiveOrderId(String(data.id));
            setArchiveOrders(prev => prev.map(o => o.orderNumber === newArchiveItem.orderNumber ? { ...o, id: String(data.id) } : o));
          }
        } catch (err) {
          console.warn("Supabase createOrder sync exception:", err);
        }
      })();
    }

    if (!isUpdate) {
      if (!subscriptionData.isUnlimited && subscriptionData.subscriptionTier !== "unlimited") {
        const updatedSub = deductSubscriptionCredit();
        setSubscriptionData(updatedSub);
        decrementCredit(1);
        if (isSupabaseConfigured()) {
          deductTenantCreditInSupabase(authGuardTenant?.id || activeUser?.id);
        }
      }
    }
  };

  const handlePrintBackLabel = async () => {
    if (!isOrderCreated) {
      setToastMessage({
        text: "⚠️ Arka etiket basabilmek için lütfen önce 'Siparişi Oluştur' butonuna basarak siparişi kaydediniz.",
        type: "error"
      });
      return;
    }

    if (isOrderModified) {
      setIsOrderModifiedWarningOpen(true);
      toast.error("⚠️ Lütfen siparişi güncelleyin veya yeni bir sipariş olarak kaydedin.");
      return;
    }

    let qrDataUrl = "";
    try {
      let qrText = `SİPARİŞ NO: ${orderNumber}
MÜŞTERİ: ${customerName || 'Belirtilmedi'}
ESER: ${artworkWidth}x${artworkHeight} cm
DIŞ EBAT: ${totalW.toFixed(2)}x${totalH.toFixed(2)} cm
TARİH: ${new Date().toLocaleDateString('tr-TR')}
ATÖLYE: ${companyProfile?.companyName || 'Nakka Dekor'}`;

      if (referencedOrderNumber) {
        qrText += `\nREVİZYON REF: #${referencedOrderNumber}`;
      }
      if (revisionNote || orderNotes) {
        qrText += `\nNOT: ${(revisionNote || orderNotes).replace(/\n/g, ' ')}`;
      }

      qrDataUrl = await QRCode.toDataURL(qrText, {
        margin: 1,
        color: {
          dark: "#121415",
          light: "#FFFFFF"
        },
        width: 250
      });
    } catch (err) {
      console.error("QR generation error:", err);
    }

    triggerBackLabelPrintWindow({
      orderNumber,
      customerName,
      customerPhone,
      deliveryDate,
      artworkWidthCm: artworkWidth,
      artworkHeightCm: artworkHeight,
      finalOuterWidthCm: totalW,
      finalOuterHeightCm: totalH,
      frameProfileName: activeInnerProfile ? `${activeInnerProfile.code} - ${activeInnerProfile.name}` : customFrameFile,
      companyProfile: {
        ...companyProfile,
        logoUrl: isProPlan(subscriptionData) ? companyProfile.logoUrl : ""
      },
      qrDataUrl,
      isPro: isProPlan(subscriptionData),
      quantity: orderQuantity,
      notes: orderNotes,
      revisionNote: revisionNote,
      referencedOrderNumber: referencedOrderNumber
    });
  };

  const handlePrintCuttingList = () => {
    if (!isOrderCreated) {
      setToastMessage({
        text: "⚠️ Üretim emri basabilmek için lütfen önce 'Siparişi Oluştur' butonuna basarak siparişi kaydediniz.",
        type: "error"
      });
      return;
    }

    if (isOrderModified) {
      setIsOrderModifiedWarningOpen(true);
      toast.error("⚠️ Lütfen siparişi güncelleyin veya yeni bir sipariş olarak kaydedin.");
      return;
    }

    triggerCuttingListPrintWindow({
      cutList,
      customerName,
      deliveryDate,
      artworkWidthCm: artworkWidth,
      artworkHeightCm: artworkHeight,
      companyProfile: {
        ...companyProfile,
        logoUrl: isProPlan(subscriptionData) ? companyProfile.logoUrl : ""
      },
      quantity: orderQuantity,
      notes: orderNotes,
      revisionNote: revisionNote,
      referencedOrderNumber: referencedOrderNumber
    });
  };

  const handlePrintCostBreakdown = () => {
    if (!isOrderCreated) {
      setToastMessage({
        text: "⚠️ Maliyet tablosu basabilmek için lütfen önce 'Siparişi Oluştur' butonuna basarak siparişi kaydediniz.",
        type: "error"
      });
      return;
    }

    if (isOrderModified) {
      setIsOrderModifiedWarningOpen(true);
      toast.error("⚠️ Lütfen siparişi güncelleyin veya yeni bir sipariş olarak kaydedin.");
      return;
    }

    triggerCostBreakdownPrintWindow({
      breakdown: displayCostBreakdown,
      settings: displayUnitPricesSettings,
      artworkWidthCm: artworkWidth,
      artworkHeightCm: artworkHeight,
      orderNumber,
      customerName,
      deliveryDate,
      flags: effectiveInclusionFlags,
      companyProfile: {
        ...companyProfile,
        logoUrl: isProPlan(subscriptionData) ? companyProfile.logoUrl : ""
      },
      quantity: orderQuantity,
      notes: orderNotes,
      revisionNote: revisionNote,
      referencedOrderNumber: referencedOrderNumber,
      customOverridePrice: customOverridePrice,
      isHistoricalSnapshot: Boolean(loadedPriceSnapshot),
      snapshotDate: loadedPriceSnapshot?.snapshotDate
    });
  };


  const renderMiteredFrame = (
    url: string | null,
    widthPx: number,
    mode: string,
    outerOffsetPx: number,
    containerHeightPx: number,
    isOuterMost: boolean
  ) => {
    if (widthPx <= 0) return null;

    const shadowFilter = isOuterMost
      ? `drop-shadow(${Math.min(15, Math.max(3, Math.round((widthPx / pxPerCm) * 1.5)))}px ${Math.min(15, Math.max(4, Math.round((widthPx / pxPerCm) * 1.8)))}px ${Math.min(22, Math.max(5, Math.round((widthPx / pxPerCm) * 2.2)))}px rgba(0,0,0,0.52))`
      : "none";

    if (!url) {
      // Solid wood look fallback
      return (
        <div 
          className="absolute transition-all duration-300"
          style={{
            top: `${outerOffsetPx}px`,
            bottom: `${outerOffsetPx}px`,
            left: `${outerOffsetPx}px`,
            right: `${outerOffsetPx}px`,
            borderStyle: "solid",
            borderWidth: `${widthPx}px`,
            backgroundColor: "#a18262",
            backgroundImage: "linear-gradient(135deg, #a18262 0%, #7d6143 100%)",
            filter: shadowFilter,
          }}
        />
      );
    }

    if (mode === "border-slice") {
      return (
        <div 
          className="absolute transition-all duration-300"
          style={{
            top: `${outerOffsetPx}px`,
            bottom: `${outerOffsetPx}px`,
            left: `${outerOffsetPx}px`,
            right: `${outerOffsetPx}px`,
            borderStyle: "solid",
            borderWidth: `${widthPx}px`,
            borderImageSource: `url(${url})`,
            borderImageSlice: "115 fill",
            borderImageRepeat: "repeat",
            filter: shadowFilter,
          }}
        />
      );
    }

    // 4-Sided Miter Construction
    return (
      <div 
        className="absolute transition-all duration-300 overflow-hidden"
        style={{
          top: `${outerOffsetPx}px`,
          bottom: `${outerOffsetPx}px`,
          left: `${outerOffsetPx}px`,
          right: `${outerOffsetPx}px`,
          filter: shadowFilter,
        }}
      >
        {/* Top Side */}
        <div 
          className="absolute top-0 left-0 w-full transition-all duration-300 overflow-hidden"
          style={{
            height: `${widthPx}px`,
            clipPath: `polygon(0% 0%, 100% 0%, calc(100% - ${widthPx}px) 100%, ${widthPx}px 100%)`,
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url(${url})`,
              backgroundSize: mode === "miter-stretch" ? "100% 100%" : "auto 100%",
              backgroundRepeat: mode === "miter-stretch" ? "no-repeat" : "repeat",
              backgroundPosition: "center",
              transform: "rotate(180deg)",
              transformOrigin: "center center",
            }}
          />
        </div>

        {/* Bottom Side */}
        <div 
          className="absolute bottom-0 left-0 w-full transition-all duration-300 overflow-hidden"
          style={{
            height: `${widthPx}px`,
            clipPath: `polygon(${widthPx}px 0%, calc(100% - ${widthPx}px) 0%, 100% 100%, 0% 100%)`,
          }}
        >
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url(${url})`,
              backgroundSize: mode === "miter-stretch" ? "100% 100%" : "auto 100%",
              backgroundRepeat: mode === "miter-stretch" ? "no-repeat" : "repeat",
              backgroundPosition: "center",
            }}
          />
        </div>

        {/* Left Side */}
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-300 overflow-hidden"
          style={{
            width: `${widthPx}px`,
            clipPath: `polygon(0% 0%, 100% ${widthPx}px, 100% calc(100% - ${widthPx}px), 0% 100%)`,
          }}
        >
          <div 
            className="absolute top-1/2 left-1/2"
            style={{
              width: `${containerHeightPx}px`,
              height: `${widthPx}px`,
              transform: "translate(-50%, -50%) rotate(90deg)",
              backgroundImage: `url(${url})`,
              backgroundSize: mode === "miter-stretch" ? "100% 100%" : "auto 100%",
              backgroundRepeat: mode === "miter-stretch" ? "no-repeat" : "repeat",
              backgroundPosition: "center",
            }}
          />
        </div>

        {/* Right Side */}
        <div 
          className="absolute top-0 right-0 h-full transition-all duration-300 overflow-hidden"
          style={{
            width: `${widthPx}px`,
            clipPath: `polygon(0% ${widthPx}px, 100% 0%, 100% 100%, 0% calc(100% - ${widthPx}px))`,
          }}
        >
          <div 
            className="absolute top-1/2 left-1/2"
            style={{
              width: `${containerHeightPx}px`,
              height: `${widthPx}px`,
              transform: "translate(-50%, -50%) rotate(-90deg)",
              backgroundImage: `url(${url})`,
              backgroundSize: mode === "miter-stretch" ? "100% 100%" : "auto 100%",
              backgroundRepeat: mode === "miter-stretch" ? "no-repeat" : "repeat",
              backgroundPosition: "center",
            }}
          />
        </div>

        {/* Inner 3D bezel line depth simulation overlays */}
        <div className="absolute inset-0 border border-black/10 pointer-events-none z-10" />
        <div className="absolute inset-0 border border-white/5 pointer-events-none z-10" style={{ margin: "1px" }} />
        <div className="absolute inset-0 border border-black/15 pointer-events-none z-30"></div>
        <div className="absolute inset-0 border border-white/5 pointer-events-none z-30" style={{ margin: "2px" }}></div>
      </div>
    );
  };

  const renderFrameLayers = (scaleMultiplier: number = 1) => (
    <div 
      style={{
        width: `${totalWidthPx * scaleMultiplier}px`,
        height: `${totalHeightPx * scaleMultiplier}px`,
        maxWidth: "100%",
        maxHeight: "100%",
        position: "relative",
      }}
      className="h-auto flex items-center justify-center select-none"
    >
      {/* 1. Outer Frame */}
      {outerFrameWidthPx > 0 && renderMiteredFrame(
        customOuterFrameUrl,
        outerFrameWidthPx * scaleMultiplier,
        outerFrameLayoutMode,
        0,
        totalHeightPx * scaleMultiplier,
        true
      )}

      {/* 1.5 Middle Mat */}
      {middleMatWidthPx > 0 && (
        <div 
          className="absolute transition-all border-t border-l border-white/50 border-r border-b border-black/15"
          style={{
            top: `${outerFrameWidthPx * scaleMultiplier}px`,
            bottom: `${outerFrameWidthPx * scaleMultiplier}px`,
            left: `${outerFrameWidthPx * scaleMultiplier}px`,
            right: `${outerFrameWidthPx * scaleMultiplier}px`,
            backgroundColor: (outerMatColor === "transparent" || outerMatColor === "glass") ? "rgba(255, 255, 255, 0.06)" : outerMatColor,
            backdropFilter: (outerMatColor === "transparent" || outerMatColor === "glass") ? "blur(1px) brightness(1.03) contrast(0.98)" : "none",
            backgroundImage: (outerMatColor === "transparent" || outerMatColor === "glass") ? "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)" : "none",
            boxShadow: (outerMatColor === "transparent" || outerMatColor === "glass") ? "inset 0 0 8px rgba(255,255,255,0.15)" : "inset 0 4px 10px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.15)"
          }}
        />
      )}

      {/* 2. Inner Frame */}
      {renderMiteredFrame(
        customFrameUrl,
        frameWidthPx * scaleMultiplier,
        frameLayoutMode,
        (outerFrameWidthPx + middleMatWidthPx) * scaleMultiplier,
        (totalHeightPx - 2 * (outerFrameWidthPx + middleMatWidthPx)) * scaleMultiplier,
        outerFrameWidthPx === 0 && middleMatWidthPx === 0
      )}
      
      {/* Paspartu inner gap wrapper */}
      <div 
        className="absolute transition-all"
        style={{
          top: `${(outerFrameWidthPx + middleMatWidthPx + frameWidthPx) * scaleMultiplier}px`,
          bottom: `${(outerFrameWidthPx + middleMatWidthPx + frameWidthPx) * scaleMultiplier}px`,
          left: `${(outerFrameWidthPx + middleMatWidthPx + frameWidthPx) * scaleMultiplier}px`,
          right: `${(outerFrameWidthPx + middleMatWidthPx + frameWidthPx) * scaleMultiplier}px`,
          padding: `${matWidthPx * scaleMultiplier}px`,
          backgroundColor: (innerMatColor === "transparent" || innerMatColor === "glass") ? "rgba(255, 255, 255, 0.06)" : innerMatColor,
          backdropFilter: (innerMatColor === "transparent" || innerMatColor === "glass") ? "blur(1px) brightness(1.03) contrast(0.98)" : "none",
          backgroundImage: (innerMatColor === "transparent" || innerMatColor === "glass") ? "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)" : "none",
          boxShadow: (innerMatColor === "transparent" || innerMatColor === "glass") ? "inset 0 0 8px rgba(255,255,255,0.15)" : "inset 0 2px 6px rgba(0,0,0,0.18)"
        }}
      >
        {/* The Canvas artwork inside */}
        <div className="w-full h-full relative overflow-hidden bg-stone-100 shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)]">
          {customPaintingUrl ? (
            <img 
              src={customPaintingUrl} 
              alt="Artwork" 
              draggable={false}
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center font-serif text-stone-400">
              <ImageIcon className="w-10 h-10 mb-2 opacity-45" />
              <span className="text-[10px] font-sans tracking-widest font-bold uppercase opacity-50">Sanat Eserinizi Seçin</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!authSession || !authSession.isLoggedIn) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-6 ${
        isDarkMode ? "bg-[#0b0c0e] text-white" : "bg-[#f8f9fa] text-slate-900"
      }`}>
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mb-4">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Atölye Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen lg:h-screen font-sans flex flex-col lg:overflow-hidden transition-colors duration-200 ${
      isDarkMode ? "bg-[#0e1013] text-white" : "bg-[#f4f5f7] text-slate-900"
    }`}>
      
      {/* 1. Header with AI Studio styling & Gold Highlights */}
      <header className={`w-full h-auto xl:h-18 py-2.5 sm:py-3 xl:py-0 border-b flex flex-col xl:flex-row items-center justify-between px-3 sm:px-5 xl:px-7 flex-shrink-0 z-20 shadow-sm gap-2.5 xl:gap-3 transition-colors duration-200 rounded-none ${
        isDarkMode ? "bg-[#14171e] border-white/10" : "bg-white border-slate-200"
      }`}>
        {/* Top bar on Mobile & Tablet / Left Branding on Desktop */}
        <div className="flex items-center justify-between w-full xl:w-auto gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 select-none">
            <NakkaLogo size={34} />
            <div className="shrink-0 min-w-0">
              <h1 className={`text-base sm:text-lg font-black tracking-widest uppercase whitespace-nowrap leading-none ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                NAKKA <span className={isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}>DEKOR</span>
              </h1>
              <p className={`text-[9px] sm:text-[10px] uppercase tracking-[0.14em] font-bold whitespace-nowrap hidden sm:block mt-1 leading-none ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                B2B Sanat & Çerçeve Atölye Portalı
              </p>
            </div>
          </div>

          {/* Mobile & Tablet Quick System Bar (Aligned to the right on top row - both portrait & landscape) */}
          <div className="flex xl:hidden items-center gap-1.5 shrink-0">
            {/* Account & Credit Indicator */}
            <CreditIndicator
              variant="mobile"
              isDarkMode={isDarkMode}
              remainingCredits={subscriptionData.remainingCredits}
              totalCredits={subscriptionData.totalCredits}
              isUnlimited={subscriptionData.isUnlimited || subscriptionData.subscriptionTier === "unlimited"}
              onClick={() => {
                setAccountModalInitialTab("company");
                setIsAccountModalOpen(true);
              }}
              onCreditUpdate={handleCreditUpdate}
            />

            {/* Settings */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-[#101216] border-white/10 text-neutral-300 hover:text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
              }`}
              title="Birim Fiyat Ayarları & Çerçeve Veritabanı"
            >
              <Settings className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            </button>

            {/* Theme Switcher */}
            <button
              onClick={() => setThemeMode(isDarkMode ? "light" : "dark")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-[#101216] border-white/10 text-[#C5A059] hover:bg-[#1a1e26]"
                  : "bg-slate-100 border-slate-200 text-[#B88E3A] hover:bg-slate-200"
              }`}
              title={isDarkMode ? "Açık Moda Geç" : "Koyu Moda Geç"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#C5A059]" /> : <Moon className="w-3.5 h-3.5 text-[#B88E3A]" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-[#101216] border-white/10 text-neutral-400 hover:text-rose-400"
                  : "bg-white border-slate-200 text-slate-500 hover:text-rose-600"
              }`}
              title="Oturumu Kapat"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Core Actions & System Controls - 4 Ana Buton Mobilde ve Tablette Ortalı */}
        <div className="w-full xl:w-auto flex items-center justify-center xl:justify-end gap-1.5 sm:gap-2.5 xl:gap-2.5 shrink-0 py-0.5 xl:py-0 mx-auto xl:mx-0">
          
          {/* 1. GRUP: YENİ */}
          <button
            onClick={handleNewOrderClick}
            className={`flex-1 max-w-[85px] sm:max-w-none sm:flex-initial h-8 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 rounded-xl border transition-all uppercase text-[10px] sm:text-xs font-bold tracking-wider shadow-sm cursor-pointer active:scale-95 select-none whitespace-nowrap ${
              isDarkMode
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/60"
                : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs"
            }`}
            title="Simülatörü sıfırla ve yeni bir çerçeve siparişi başlat"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>YENİ</span>
          </button>

          {/* Grup Ayırıcı */}
          <div className={`hidden sm:block h-5 w-px shrink-0 ${isDarkMode ? "bg-white/15" : "bg-slate-300"}`} />

          {/* 2. GRUP: TUTAR & YAZDIR */}
          {/* Canlı Fiyat & Tutar */}
          <button 
            onClick={() => setIsCostModalOpen(true)}
            className={`flex-1 max-w-[105px] sm:max-w-none sm:flex-initial h-8 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 rounded-xl border transition-all uppercase text-[10px] sm:text-xs font-bold tracking-wider shadow-sm cursor-pointer active:scale-95 select-none whitespace-nowrap ${
              isDarkMode
                ? "bg-[#101216] border-white/10 hover:border-[#C5A059]/50 text-white"
                : "bg-white border-slate-200 hover:border-[#B88E3A]/50 text-slate-900"
            }`}
            title="Maliyet Dökümü & Kalem Kalem Fiyat Analizi"
          >
            <Calculator className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <span className="hidden sm:inline text-neutral-400 dark:text-neutral-400">TUTAR:</span>
            <strong className={`font-mono text-[10px] sm:text-xs ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
              ₺{Math.round(costBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity)).toLocaleString("tr-TR")}
            </strong>
            {orderQuantity > 1 && (
              <span className={`hidden sm:inline-block text-[9px] font-mono font-bold px-1 py-0.5 rounded-md ${
                isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/15 text-[#B88E3A]"
              }`}>
                {orderQuantity} Adet
              </span>
            )}
          </button>

          {/* Yazdır */}
          <button 
            onClick={() => {
              if (isOrderModified) {
                setIsOrderModifiedWarningOpen(true);
                toast.error("⚠️ Lütfen siparişi güncelleyin veya yeni bir sipariş olarak kaydedin.");
                return;
              }
              setIsPrintCenterModalOpen(true);
            }}
            className={`flex-1 max-w-[95px] sm:max-w-none sm:flex-initial h-8 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 rounded-xl border transition-all uppercase text-[10px] sm:text-xs font-bold tracking-wider shadow-md active:scale-95 cursor-pointer select-none whitespace-nowrap ${
              isOrderModified
                ? (isDarkMode ? "bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30" : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200")
                : isDarkMode
                  ? "bg-[#C5A059] text-black border-[#d6b169] hover:bg-[#b5924d]"
                  : "bg-[#B88E3A] text-white border-[#a67e2f] hover:bg-[#a67e2f]"
            }`}
            title={isOrderModified ? "Siparişte değişiklik yapıldı! Yazdırmak için siparişi güncelleyin veya yeni kaydedin." : "Belge Yazdır: Sipariş Formu, Üretim Emri, Maliyet Tablosu, 60x30 Termal Arka Etiket"}
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>YAZDIR</span>
            {isOrderModified ? (
              <span className="text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-mono font-black bg-amber-500 text-black">
                !
              </span>
            ) : (
              <span className={`text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-mono font-black ${
                isDarkMode ? "bg-black/25 text-black" : "bg-black/20 text-white"
              }`}>
                4
              </span>
            )}
          </button>

          {/* Grup Ayırıcı */}
          <div className={`hidden sm:block h-5 w-px shrink-0 ${isDarkMode ? "bg-white/15" : "bg-slate-300"}`} />

          {/* 3. GRUP: ARŞİV */}
          <button
            onClick={() => setIsArchiveModalOpen(true)}
            className={`flex-1 max-w-[85px] sm:max-w-none sm:flex-initial h-8 sm:h-9 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 rounded-xl border transition-all uppercase text-[10px] sm:text-xs font-bold tracking-wider shadow-sm cursor-pointer active:scale-95 select-none whitespace-nowrap ${
              isDarkMode
                ? "bg-[#101216] border-white/10 text-neutral-300 hover:text-white"
                : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
            }`}
            title="Geçmiş Sipariş ve Teklif Arşivi"
          >
            <Archive className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <span>ARŞİV</span>
            <span className={`px-1 sm:px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
              isDarkMode ? "bg-white/10 text-[#C5A059]" : "bg-slate-100 text-[#B88E3A]"
            }`}>
              {archiveOrders.length}
            </span>
          </button>

          {/* Desktop Grup Ayırıcı */}
          <div className={`hidden xl:block h-5 w-px shrink-0 ${isDarkMode ? "bg-white/15" : "bg-slate-300"}`} />

          {/* 4. GRUP: HESAP, AYARLAR (Masaüstü için, mobilde ve tablette üst barda yer alır) */}
          <div className="hidden xl:flex items-center gap-1.5 shrink-0">
            {/* Hesap ve Kredi Göstergesi */}
            <CreditIndicator
              variant="desktop"
              isDarkMode={isDarkMode}
              remainingCredits={subscriptionData.remainingCredits}
              totalCredits={subscriptionData.totalCredits}
              isUnlimited={subscriptionData.isUnlimited || subscriptionData.subscriptionTier === "unlimited"}
              onClick={() => {
                setAccountModalInitialTab("company");
                setIsAccountModalOpen(true);
              }}
              onCreditUpdate={handleCreditUpdate}
            />

            {/* Ayarlar Butonu */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`h-9 flex items-center justify-center gap-1.5 px-3 rounded-xl border transition-all uppercase text-[11px] sm:text-xs font-bold tracking-wider shadow-sm cursor-pointer active:scale-95 select-none whitespace-nowrap ${
                isDarkMode
                  ? "bg-[#101216] border-white/10 text-neutral-300 hover:text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
              }`}
              title="Birim Fiyat Ayarları & Çerçeve Veritabanı"
            >
              <Settings className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
              <span>AYARLAR</span>
            </button>
          </div>

          {/* Desktop Grup Ayırıcı */}
          <div className={`hidden xl:block h-5 w-px shrink-0 ${isDarkMode ? "bg-white/15" : "bg-slate-300"}`} />

          {/* 5. GRUP: AÇIK MOD / KOYU MOD, ÇIKIŞ (Masaüstü için, mobilde ve tablette üst barda yer alır) */}
          <div className="hidden xl:flex items-center gap-1.5 shrink-0">
            {/* Açık Mod / Koyu Mod */}
            <button
              onClick={() => setThemeMode(isDarkMode ? "light" : "dark")}
              className={`h-9 flex items-center justify-center gap-1.5 px-3 rounded-xl border transition-all uppercase text-[11px] sm:text-xs font-bold tracking-wider shadow-sm cursor-pointer active:scale-95 select-none whitespace-nowrap ${
                isDarkMode
                  ? "bg-[#101216] border-white/10 text-[#C5A059] hover:bg-[#1a1e26]"
                  : "bg-slate-100 border-slate-200 text-[#B88E3A] hover:bg-slate-200"
              }`}
              title={isDarkMode ? "Açık Moda Geç" : "Koyu Moda Geç"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#C5A059]" /> : <Moon className="w-3.5 h-3.5 text-[#B88E3A]" />}
              <span>{isDarkMode ? "AÇIK MOD" : "KOYU MOD"}</span>
            </button>

            {/* Çıkış */}
            <button
              onClick={handleLogout}
              className={`h-9 flex items-center justify-center gap-1.5 px-3 rounded-xl border transition-all uppercase text-[11px] sm:text-xs font-bold tracking-wider shadow-sm cursor-pointer active:scale-95 select-none whitespace-nowrap ${
                isDarkMode
                  ? "bg-[#101216] border-white/10 text-neutral-300 hover:text-rose-400 hover:border-rose-400/40"
                  : "bg-white border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300"
              }`}
              title="Oturumu Kapat (Giriş Ekranına Dön)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ÇIKIŞ</span>
            </button>
          </div>

        </div>
      </header>

      {/* Schema Pending Banner */}
      {isSchemaPending && (
        <div className={`px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b z-10 transition-all ${
          isDarkMode ? "bg-amber-950/40 border-amber-800/60 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Supabase Veritabanı Kurulumu:</strong> Projenize bağlanıldı ancak henüz tablolar oluşturulmadı (varsayılan çıtalar devrede). Tabloları aktifleştirmek için <code>src/db/schema.sql</code> dosyasını Supabase SQL Editor'de çalıştırabilirsiniz.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Ayarları Aç
            </button>
            <button
              onClick={() => setIsSchemaPending(false)}
              className="p-1 opacity-70 hover:opacity-100 cursor-pointer rounded"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden processing canvas used as a background worker */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Visualizer Workspace Layout */}
      <main className="flex-grow flex flex-col lg:flex-row lg:overflow-hidden">
          
          {/* Left Control Panel / Inputs sidebar */}
          <aside className={`w-full lg:w-[35%] xl:w-[35%] 2xl:w-[35%] lg:min-w-[400px] rounded-none p-4 sm:p-5 flex flex-col gap-4 flex-shrink-0 z-10 shadow-sm overflow-y-auto order-last lg:order-none transition-colors duration-200 border ${
            isDarkMode ? "bg-[#14171d] border-white/10 text-neutral-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            {/* Step Navigation Pill Bar */}
            <div 
              data-drag-scroll="true"
              className={`p-1 rounded-2xl border flex items-center gap-1 shadow-inner shrink-0 overflow-x-auto no-scrollbar drag-scroll select-none ${
              isDarkMode ? "bg-[#0e1013] border-white/10" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setActiveSidebarTab("artwork")}
                className={`flex-1 min-w-[70px] sm:min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeSidebarTab === "artwork"
                    ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-900 shadow-sm border border-slate-200/80")
                    : (isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
                title="1. Sanat Eseri ve Ölçü"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>1. Eser</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab("framing")}
                className={`flex-1 min-w-[75px] sm:min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeSidebarTab === "framing"
                    ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-900 shadow-sm border border-slate-200/80")
                    : (isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
                title="2. Çerçeve ve Profil Seçimi"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>2. Çerçeve</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab("materials")}
                className={`flex-1 min-w-[72px] sm:min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeSidebarTab === "materials"
                    ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-900 shadow-sm border border-slate-200/80")
                    : (isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
                title="3. Cam, Arka Panel ve Sipariş Kalemleri"
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>3. Sipariş</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab(activeSidebarTab === "all" ? "artwork" : "all")}
                className={`px-2.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeSidebarTab === "all"
                    ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-[#B88E3A] text-white shadow-sm")
                    : (isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                }`}
                title={activeSidebarTab === "all" ? "Adımlı Görünüme Dön" : "Tüm Ayarları Tek Ekranda Göster"}
              >
                <span>{activeSidebarTab === "all" ? "✓ Tümü" : "Tümü"}</span>
              </button>
            </div>

            {/* Active Steps */}
            {(activeSidebarTab === "artwork" || activeSidebarTab === "all") && (
              <ArtworkStep
                fileInputRef={fileInputRef}
                customPaintingFile={customPaintingFile}
                customPaintingUrl={customPaintingUrl}
                handlePaintingUpload={handlePaintingUpload}
                onCapturePaintingFile={processPaintingFile}
                setIsCropModalOpen={setIsCropModalOpen}
                widthInput={widthInput}
                setWidthInput={setWidthInput}
                heightInput={heightInput}
                setHeightInput={setHeightInput}
                wallColor={wallColor}
                setWallColor={setWallColor}
                wallColorPalette={wallColorPalette}
                isDarkMode={isDarkMode}
                onNextStep={activeSidebarTab === "artwork" ? () => setActiveSidebarTab("framing") : undefined}
                wallMode={wallMode}
                setWallMode={setWallMode}
                customerRoomImage={customerRoomImage}
                onSelectRoomImage={setCustomerRoomImage}
                roomFrameScale={roomFrameScale}
                setRoomFrameScale={setRoomFrameScale}
                onResetRoomPosition={() => { setRoomFramePos({ x: 0, y: 0 }); setRoomFrameScale(1); }}
                onOpenCustomerPresentation={() => setIsCustomerPresentationOpen(true)}
                roomBgFit={roomBgFit}
                setRoomBgFit={setRoomBgFit}
                roomBgScale={roomBgScale}
                setRoomBgScale={setRoomBgScale}
                onResetRoomBg={() => { setRoomBgPos({ x: 0, y: 0 }); setRoomBgScale(1); }}
                onDownloadHdWallColor={handleDownloadHdWallColor}
                isDownloadingHD={isDownloadingHD}
              />
            )}

            {/* Step 2: Framing & Paspartu */}
            {(activeSidebarTab === "framing" || activeSidebarTab === "all") && (
              <FramingStep
                selectedInnerProfileId={selectedInnerProfileId}
                selectedOuterProfileId={selectedOuterProfileId}
                frameProfiles={frameProfiles}
                handleSelectInnerProfile={handleSelectInnerProfile}
                handleSelectOuterProfile={handleSelectOuterProfile}
                activeInnerProfile={activeInnerProfile}
                activeOuterProfile={activeOuterProfile}
                frameWidthInput={frameWidthInput}
                matWidthInput={matWidthInput}
                setMatWidthInput={setMatWidthInput}
                matWidth={matWidth}
                innerMatColor={innerMatColor}
                setInnerMatColor={setInnerMatColor}
                middleMatWidthInput={middleMatWidthInput}
                setMiddleMatWidthInput={setMiddleMatWidthInput}
                middleMatWidth={middleMatWidth}
                outerMatColor={outerMatColor}
                setOuterMatColor={setOuterMatColor}
                isDarkMode={isDarkMode}
                onNextStep={activeSidebarTab === "framing" ? () => setActiveSidebarTab("materials") : undefined}
                onPrevStep={activeSidebarTab === "framing" ? () => setActiveSidebarTab("artwork") : undefined}
                onManageProfiles={() => {
                  setSettingsInitialTab("profiles");
                  setIsSettingsOpen(true);
                }}
              />
            )}

            {/* Step 3: Materials & Order */}
            {(activeSidebarTab === "materials" || activeSidebarTab === "all") && (
              <OrderStep
                inclusionFlags={inclusionFlags}
                handleToggleFlag={handleToggleFlag}
                costBreakdown={displayCostBreakdown}
                deliveryMethod={deliveryMethod}
                setDeliveryMethod={setDeliveryMethod}
                defaultShippingCost={unitPricesSettings.defaultShippingCost ?? 150}
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerNameError={customerNameError}
                setCustomerNameError={setCustomerNameError}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerPhoneError={customerPhoneError}
                setCustomerPhoneError={setCustomerPhoneError}
                deliveryDate={deliveryDate}
                setDeliveryDate={setDeliveryDate}
                deliveryDateError={deliveryDateError}
                setDeliveryDateError={setDeliveryDateError}
                deliveryDateErrorMessage={deliveryDateErrorMessage}
                setDeliveryDateErrorMessage={setDeliveryDateErrorMessage}
                loadedOrderOriginalDeliveryDate={loadedOrderOriginalDeliveryDate}
                formatTrPhone={formatTrPhone}
                isDarkMode={isDarkMode}
                orderNumber={orderNumber}
                artworkWidth={artworkWidth}
                artworkHeight={artworkHeight}
                finalOuterWidthCm={finalOuterWidthCm}
                finalOuterHeightCm={finalOuterHeightCm}
                activeInnerProfileName={activeInnerProfile?.name}
                matWidth={matWidth}
                innerMatColorName={getPaspartuColorName(innerMatColor)}
                downloadCompositedImage={downloadCompositedImage}
                onOpenCostModal={() => setIsCostModalOpen(true)}
                onOpenPrintCenter={() => setIsPrintCenterModalOpen(true)}
                onCreateOrder={handleCreateOrderFromSimulator}
                onCreateNewOrder={() => handleCreateOrderFromSimulator({ asNewOrder: true })}
                onPrevStep={activeSidebarTab === "materials" ? () => setActiveSidebarTab("framing") : undefined}
                isExistingOrder={Boolean(activeOrderId || archiveOrders.some(o => o.orderNumber === orderNumber))}
                isOrderModified={isOrderModified}
                isCostAffectingModified={isCostAffectingModified}
                isProductionOrDelivered={isProductionOrDelivered}
                loadedOrderStatus={currentOrderStatus}
                orderNotes={orderNotes}
                onOrderNotesChange={setOrderNotes}
                revisionNote={revisionNote}
                referencedOrderNumber={referencedOrderNumber}
                quantity={orderQuantity}
                onQuantityChange={setOrderQuantity}
                customOverridePrice={customOverridePrice}
                onSetCustomOverridePrice={setCustomOverridePrice}
              />
            )}
          </aside>

          {/* Central High-Resolution Wide Virtual Wall Canvas Visualizer & Bottom Actions Bar */}
          <div className="flex-1 lg:w-[65%] flex flex-col min-w-0 order-first lg:order-none overflow-hidden relative">
            <section 
              ref={setStageRef} 
              data-no-drag-scroll="true"
              onWheel={(e) => {
                if (wallMode === "room") {
                  e.preventDefault();
                  const delta = e.deltaY < 0 ? 0.05 : -0.05;
                  if (roomActiveTarget === "frame") {
                    setRoomFrameScale((prev) => Math.min(1.0, Math.max(0.10, Number((prev + delta).toFixed(2)))));
                  } else {
                    setRoomBgScale((prev) => Math.min(2.5, Math.max(0.50, Number((prev + delta).toFixed(2)))));
                  }
                }
              }}
              className="w-full flex-grow h-[460px] sm:h-[580px] lg:h-auto relative flex items-center justify-center p-3 sm:p-6 overflow-hidden z-0 transition-colors duration-300 shadow-inner rounded-none border border-black/10 select-none min-h-[380px]"
              style={{ 
                backgroundColor: wallMode === "room" ? "#0a0c0f" : wallColor,
              }}
            >
            {/* Ambient Blurred Background for Contain Mode in Room */}
            {wallMode === "room" && roomBgFit === "contain" && (
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 pointer-events-none transform scale-110"
                style={{ 
                  backgroundImage: `url(${customerRoomImage || DEFAULT_ROOM_TEMPLATES?.[0]?.url || ""})`,
                  filter: `brightness(${roomBrightness * 0.7}%) blur(35px)`
                }}
              />
            )}

            {/* Room Photo Canvas Layer (Draggable & Scalable) */}
            {wallMode === "room" && (
              <div
                onMouseDown={handleWallRoomPointerDown}
                onTouchStart={handleWallRoomPointerDown}
                className={`absolute inset-0 select-none ${
                  isDraggingWallRoom ? "cursor-grabbing" : roomActiveTarget === "room" ? "cursor-grab" : "cursor-default"
                }`}
                style={{
                  backgroundImage: `url(${customerRoomImage || DEFAULT_ROOM_TEMPLATES?.[0]?.url || ""})`,
                  backgroundSize: roomBgFit === "contain" ? "contain" : "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  transform: `translate3d(${roomBgPos.x}px, ${roomBgPos.y}px, 0) scale(${roomBgScale})`,
                  transformOrigin: "center center",
                  filter: `brightness(${roomBrightness}%)`
                }}
              />
            )}

            {/* Wall texture grid overlay (only for solid wall color) */}
            {wallMode !== "room" && (
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />
            )}

            {/* Subtle Wall Room Edge Vignette Shadow */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.3)] z-10" />

            {/* Floating Room Mode Toolbar (Sadeleştirilmiş & Şık) */}
            {wallMode === "room" && (
              <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#C5A059]/40 text-[#C5A059] text-xs font-bold shadow-lg">
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span>Müşteri Odası</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Selector: Tablo vs Oda + Slider */}
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/15 rounded-full px-2 py-1 shadow-lg text-xs">
                    <div className="flex items-center gap-0.5 bg-white/10 rounded-full p-0.5">
                      <button
                        type="button"
                        onClick={() => setRoomActiveTarget("frame")}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                          roomActiveTarget === "frame"
                            ? "bg-[#C5A059] text-black shadow"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Tablo %{Math.round(roomFrameScale * 100)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomActiveTarget("room")}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                          roomActiveTarget === "room"
                            ? "bg-[#C5A059] text-black shadow"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Oda %{Math.round(roomBgScale * 100)}
                      </button>
                    </div>

                    <input 
                      type="range"
                      min={roomActiveTarget === "frame" ? "0.10" : "0.50"}
                      max={roomActiveTarget === "frame" ? "1.00" : "2.50"}
                      step={roomActiveTarget === "frame" ? "0.01" : "0.02"}
                      value={roomActiveTarget === "frame" ? Math.min(1.0, Math.max(0.10, roomFrameScale)) : roomBgScale}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (roomActiveTarget === "frame") setRoomFrameScale(val);
                        else setRoomBgScale(val);
                      }}
                      className="w-16 sm:w-24 h-1.5 accent-[#C5A059] cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => { 
                        setRoomFramePos({ x: 0, y: 0 }); 
                        setRoomFrameScale(1); 
                        setRoomBgPos({ x: 0, y: 0 });
                        setRoomBgScale(1);
                      }}
                      className="px-2 py-0.5 rounded-full hover:bg-white/10 text-neutral-300 text-[11px] font-medium transition-colors cursor-pointer"
                      title="Konumu ve Ölçeği Sıfırla"
                    >
                      Ortala
                    </button>
                  </div>

                  {/* Return to wall color */}
                  <button
                    type="button"
                    onClick={() => setWallMode("color")}
                    className="p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-neutral-400 hover:text-white text-xs shadow-lg transition-colors cursor-pointer"
                    title="Duvar Rengine Dön"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Centered composite scaled frame hanging directly on the wide virtual wall */}
            <div className="relative flex items-center justify-center z-20 w-full h-full my-auto pointer-events-auto">
              <div 
                data-frame-root="true"
                data-no-drag-scroll="true"
                onMouseDown={wallMode === "room" ? handleWallFramePointerDown : undefined}
                onTouchStart={wallMode === "room" ? handleWallFramePointerDown : undefined}
                style={{
                  width: `${totalWidthPx}px`,
                  height: `${totalHeightPx}px`,
                  maxWidth: wallMode === "room" ? undefined : "100%",
                  maxHeight: wallMode === "room" ? undefined : "100%",
                  position: "relative",
                  transform: wallMode === "room" 
                    ? `translate3d(${roomFramePos.x}px, ${roomFramePos.y}px, 0) scale(${roomFrameScale})` 
                    : undefined,
                  transformOrigin: "center center",
                  filter: wallMode === "room" 
                    ? `drop-shadow(0 ${16 * roomShadowIntensity}px ${28 * roomShadowIntensity}px rgba(0,0,0,${0.48 * roomShadowIntensity}))` 
                    : undefined,
                  cursor: wallMode === "room" ? (isDraggingWallFrame ? "grabbing" : "grab") : "default",
                  touchAction: wallMode === "room" ? "none" : "auto",
                  userSelect: "none"
                }}
                className="h-auto flex items-center justify-center select-none"
              >
                {/* Floating drag badge in room mode */}
                {wallMode === "room" && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md border border-[#C5A059]/50 text-[#C5A059] px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow-xl pointer-events-none whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
                    <Move className="w-2.5 h-2.5" />
                    <span>Sürükleyin</span>
                  </div>
                )}
                {renderFrameLayers()}
              </div>
            </div>

          </section>

          {/* Always-Visible Bottom Action Bar directly under Live Preview Screen */}
          <div className={`w-full px-4 py-3 sm:px-6 sm:py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 backdrop-blur-md z-20 transition-colors ${
            isDarkMode 
              ? "bg-[#14171d] border-white/10 text-white shadow-lg" 
              : "bg-white border-slate-200 text-slate-800 shadow-sm"
          }`}>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className={`text-xs font-bold tracking-tight ${isDarkMode ? "text-neutral-200" : "text-slate-800"}`}>
                  Canlı Önizleme &amp; Mekan
                </span>
              </div>
              <div className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                isDarkMode ? "bg-white/5 border-white/10 text-[#C5A059]" : "bg-slate-100 border-slate-200 text-[#8F6A1E]"
              }`}>
                Dış Çerçeve: {totalW.toFixed(2)}×{totalH.toFixed(2)} cm
              </div>

              {/* Aktif Sipariş / Teklif Bilgileri Rozeti */}
              <div 
                id="active-order-summary-badge"
                className={`flex items-center gap-2 text-[11px] font-mono px-2.5 py-0.5 rounded-md border transition-all ${
                  isDarkMode 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-200" 
                    : "bg-amber-50 border-amber-300 text-amber-900"
                }`}
                title={`Sipariş: ${orderNumber} | Tarih: ${activeOrderCreatedAt || new Date().toLocaleDateString("tr-TR")} | Müşteri: ${customerName.trim() || "İsimsiz Müşteri"}`}
              >
                <span className="font-bold tracking-tight text-[#C5A059]">{orderNumber}</span>
                <span className="opacity-40">•</span>
                <span className="opacity-90">{activeOrderCreatedAt || new Date().toLocaleDateString("tr-TR")}</span>
                <span className="opacity-40">•</span>
                <span className="font-semibold truncate max-w-[140px] sm:max-w-[200px]">
                  {customerName.trim() || "İsimsiz Müşteri"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* 1. HD Görsel İndir */}
              <button
                type="button"
                onClick={handleDownloadHdWallColor}
                disabled={isDownloadingHD}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#d4b069] to-[#C5A059] hover:brightness-105 active:scale-[0.98] text-black font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                title="Yüksek çözünürlüklü sunum görseli indir"
              >
                {isDownloadingHD ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Hazırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-black" />
                    <span>HD Görsel İndir</span>
                  </>
                )}
              </button>

              {/* 2. Müşteri Sunumu Aç / Simülatöre Dön */}
              <button
                type="button"
                onClick={() => setIsCustomerPresentationOpen((prev) => !prev)}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                  isCustomerPresentationOpen
                    ? "border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059] hover:bg-[#C5A059]/30"
                    : isDarkMode
                      ? "border-white/20 bg-white/5 hover:bg-white/10 text-white shadow-sm"
                      : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-sm"
                }`}
                title={isCustomerPresentationOpen ? "Simülatöre Dön" : "Tam Ekran Müşteri Sunum Modu"}
              >
                {isCustomerPresentationOpen ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-[#C5A059]" />
                    <span>Simülatöre Dön</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>Müşteri Sunumu Aç</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={unitPricesSettings}
        onSaveSettings={handleSaveSettings}
        profiles={frameProfiles}
        onSaveProfiles={handleSaveProfiles}
        onResetToDefaults={handleResetDefaults}
        isDarkMode={isDarkMode}
        isShopMode={isShopMode}
        onToggleShopMode={(enabled) => setIsShopMode(enabled)}
        companyProfile={companyProfile}
        onSaveCompanyProfile={handleSaveCompanyProfile}
        initialTab={settingsInitialTab}
        subscription={subscriptionData}
        onOpenSubscriptionModal={() => {
          setIsSettingsOpen(false);
          setAccountModalInitialTab("credits");
          setIsAccountModalOpen(true);
        }}
        activeUser={activeUser}
        onLogout={handleLogout}
        tenantId={authGuardTenant?.id || activeUser?.id}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        isDarkMode={isDarkMode}
        companyProfile={companyProfile}
        onSaveCompanyProfile={handleSaveCompanyProfile}
        subscription={subscriptionData}
        onUpdateSubscription={handleUpdateSubscription}
        activeUser={activeUser}
        tenantId={authGuardTenant?.id || activeUser?.id}
        onRefreshTenant={refreshTenant}
        onLogout={handleLogout}
        initialTab={accountModalInitialTab}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        isDarkMode={isDarkMode}
        subscription={subscriptionData}
        onUpdateSubscription={handleUpdateSubscription}
        userCount={userAccounts.length}
      />

      <OrderArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        isDarkMode={isDarkMode}
        orders={archiveOrders}
        profiles={frameProfiles}
        onDeleteOrder={handleDeleteArchiveOrder}
        onLoadOrderToWorkspace={handleLoadOrderToWorkspace}
        companyProfile={companyProfile}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      <CostBreakdownModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        breakdown={displayCostBreakdown}
        settings={displayUnitPricesSettings}
        customOverridePrice={customOverridePrice}
        onSetCustomOverridePrice={setCustomOverridePrice}
        artworkWidthCm={artworkWidth}
        artworkHeightCm={artworkHeight}
        orderNumber={orderNumber}
        customerName={customerName}
        deliveryDate={deliveryDate}
        flags={inclusionFlags}
        onToggleFlag={handleToggleFlag}
        isDarkMode={isDarkMode}
        isShopMode={isShopMode}
        isOrderCreated={isOrderCreated}
        isOrderModified={isOrderModified}
        onPromptOrderModified={() => setIsOrderModifiedWarningOpen(true)}
        quantity={orderQuantity}
        onQuantityChange={setOrderQuantity}
        companyProfile={companyProfile}
        notes={orderNotes}
        revisionNote={revisionNote}
        referencedOrderNumber={referencedOrderNumber}
        isHistoricalSnapshot={Boolean(loadedPriceSnapshot)}
        snapshotDate={loadedPriceSnapshot?.snapshotDate}
      />

      <CuttingListModal
        isOpen={isCutListModalOpen}
        onClose={() => setIsCutListModalOpen(false)}
        cutList={cutList}
        customerName={customerName}
        deliveryDate={deliveryDate}
        artworkWidthCm={artworkWidth}
        artworkHeightCm={artworkHeight}
        isDarkMode={isDarkMode}
        isOrderCreated={isOrderCreated}
        isOrderModified={isOrderModified}
        onPromptOrderModified={() => setIsOrderModifiedWarningOpen(true)}
        quantity={orderQuantity}
        notes={orderNotes}
        revisionNote={revisionNote}
        referencedOrderNumber={referencedOrderNumber}
      />

      <PrintCenterModal
        isOpen={isPrintCenterModalOpen}
        onClose={() => setIsPrintCenterModalOpen(false)}
        orderNumber={orderNumber}
        customerName={customerName}
        customerPhone={customerPhone}
        deliveryDate={deliveryDate}
        deliveryMethod={deliveryMethod}
        artworkWidthCm={artworkWidth}
        artworkHeightCm={artworkHeight}
        finalOuterWidthCm={totalW}
        finalOuterHeightCm={totalH}
        frameProfileName={activeInnerProfile?.name || customFrameFile}
        companyProfile={companyProfile}
        isPro={isProPlan(subscriptionData)}
        isDarkMode={isDarkMode}
        totalPriceWithVat={displayCostBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity)}
        isOrderCreated={isOrderCreated}
        isOrderModified={isOrderModified}
        isCostAffectingModified={isCostAffectingModified}
        isProductionOrDelivered={isProductionOrDelivered}
        referencedOrderNumber={referencedOrderNumber}
        revisionNote={revisionNote}
        orderNotes={orderNotes}
        onPromptOrderModified={() => setIsOrderModifiedWarningOpen(true)}
        quantity={orderQuantity}
        onCreateOrder={handleCreateOrderFromSimulator}
        onUpdateOrder={() => handleCreateOrderFromSimulator({ asNewOrder: false })}
        onCreateNewOrder={() => handleCreateOrderFromSimulator({ asNewOrder: true })}
        onPrintOrderForm={downloadCompositedImage}
        onPrintJobOrder={downloadCompositedImage}
        onPrintCuttingList={handlePrintCuttingList}
        onOpenCuttingListModal={() => {
          setIsPrintCenterModalOpen(false);
          setIsCutListModalOpen(true);
        }}
        onPrintCostBreakdown={handlePrintCostBreakdown}
        onOpenCostBreakdownModal={() => {
          setIsPrintCenterModalOpen(false);
          setIsCostModalOpen(true);
        }}
        onPrintBackLabel={handlePrintBackLabel}
      />

      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageUrl={customPaintingUrl || ""}
        isDarkMode={isDarkMode}
        targetWidthCm={artworkWidth}
        targetHeightCm={artworkHeight}
        onCropSave={async (croppedDataUrl) => {
          // Tarayıcı ekranında anında yansıt
          setCustomPaintingUrl(croppedDataUrl);
          setIsCropModalOpen(false);

          if (isSupabaseConfigured()) {
            try {
              // 1. Kırpılmış görseli tarayıcıda maksimum 1920px ve %80 kaliteye sıkıştır
              const compressed = await compressImage(croppedDataUrl, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.80,
                mimeType: "image/jpeg"
              });

              // 2. Supabase Storage'a yükle (uploads / visualizations bucket)
              const fileName = customPaintingFile && customPaintingFile !== "Henüz görsel seçilmedi" 
                ? customPaintingFile 
                : "kirpilmis_eser";
              
              const { publicUrl, error: uploadErr } = await uploadImageToSupabaseStorage(
                compressed.blob,
                "cropped-artworks",
                fileName
              );

              if (publicUrl) {
                // Kalıcı URL'i ayarla
                setCustomPaintingUrl(publicUrl);

                // 3. Veritabanına ASLA Base64 kaydetme; sadece kısa public URL'i yaz
                const { error: dbErr } = await createVisualizationInSupabase({
                  artwork_url: publicUrl,
                  artwork_name: fileName,
                  artwork_width_cm: artworkWidth,
                  artwork_height_cm: artworkHeight,
                  mat_width_cm: matWidth,
                  inner_frame_profile_id: selectedInnerProfileId || undefined
                });

                if (dbErr) {
                  console.warn("Supabase visualization crop save warning:", dbErr);
                }
              } else if (uploadErr) {
                console.warn("Storage crop upload warning:", uploadErr);
              }
            } catch (err) {
              console.warn("Supabase visualization crop save exception:", err);
            }
          }
        }}
        targetWidthCm={artworkWidth}
        targetHeightCm={artworkHeight}
        isDarkMode={isDarkMode}
      />

      {/* Müşterinin Kendi Duvarında Önizleme & Satış Kapatma Sunum Modalı */}
      <CustomerWallPreviewModal
        isOpen={isCustomerPresentationOpen}
        onClose={() => setIsCustomerPresentationOpen(false)}
        customerRoomImage={customerRoomImage}
        onSelectRoomImage={setCustomerRoomImage}
        wallMode={wallMode}
        setWallMode={setWallMode}
        wallColor={wallColor}
        setWallColor={setWallColor}
        wallColorPalette={wallColorPalette}
        roomFrameScale={roomFrameScale}
        setRoomFrameScale={setRoomFrameScale}
        roomFramePos={roomFramePos}
        setRoomFramePos={setRoomFramePos}
        roomBrightness={roomBrightness}
        setRoomBrightness={setRoomBrightness}
        roomShadowIntensity={roomShadowIntensity}
        setRoomShadowIntensity={setRoomShadowIntensity}
        roomBgFit={roomBgFit}
        setRoomBgFit={setRoomBgFit}
        roomBgScale={roomBgScale}
        setRoomBgScale={setRoomBgScale}
        roomBgPos={roomBgPos}
        setRoomBgPos={setRoomBgPos}
        artworkWidth={artworkWidth}
        artworkHeight={artworkHeight}
        frameWidthCm={artworkWidth + 2 * (matWidth + frameWidth + outerFrameWidth + middleMatWidth)}
        frameHeightCm={artworkHeight + 2 * (matWidth + frameWidth + outerFrameWidth + middleMatWidth)}
        matWidth={matWidth}
        middleMatWidth={middleMatWidth}
        outerFrameWidth={outerFrameWidth}
        frameWidth={frameWidth}
        activeProfileName={activeInnerProfile?.name || "Özel Profil"}
        outerProfileName={activeOuterProfile?.name}
        paspartuName={getPaspartuColorName(innerMatColor)}
        totalPrice={costBreakdown.effectiveFinalPriceWithVat * Math.max(1, orderQuantity)}
        orderNumber={orderNumber}
        customerName={customerName}
        customerPhone={customerPhone}
        companyName={companyProfile.companyName || "Nakka Dekor"}
        companyPhone={companyProfile.phone || ""}
        isDarkMode={isDarkMode}
        renderFrameElement={(scale) => renderFrameLayers(scale)}
        customPaintingUrl={customPaintingUrl}
        customFrameUrl={customFrameUrl}
        customOuterFrameUrl={customOuterFrameUrl}
        innerMatColor={innerMatColor}
        outerMatColor={outerMatColor}
        frameLayoutMode={frameLayoutMode}
        outerFrameLayoutMode={outerFrameLayoutMode}
        lightingStyle={lightingStyle}
      />

      {/* Reset Simulator / New Order or Load Confirmation Modal (Madde 4) */}
      {isResetConfirmOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setIsResetConfirmOpen(false);
            setConfirmResetAction(null);
          }}
        >
          <div 
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 relative flex flex-col gap-5 ${
              isDarkMode ? "bg-[#14171e] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/25">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold">Kaydedilmemiş Değişiklikler</h3>
                <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                  {confirmResetAction?.type === "load" ? (
                    <>
                      Ekranınızda kaydedilmemiş bir sipariş veya değişiklikler bulunmaktadır. Arşivden <strong className="text-amber-500 font-bold">#{confirmResetAction.order.orderNumber}</strong> numaralı siparişi yüklerseniz mevcut ekran sıfırlanacaktır. Devam etmek istiyor musunuz?
                    </>
                  ) : (
                    "Mevcut tasarım veya sipariş henüz kaydedilmedi. Simülatörü sıfırlayıp yeni bir siparişe başlamak istediğinize emin misiniz?"
                  )}
                </p>
              </div>
            </div>

            {/* Mini Sipariş Bilgi Kartı */}
            <div className={`p-3.5 rounded-2xl border text-xs font-mono flex items-center justify-between gap-2 ${
              isDarkMode ? "bg-black/30 border-white/5 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-[#C5A059] dark:text-[#E5C158]">#{orderNumber}</span>
                <span className="text-neutral-500">•</span>
                <span className="truncate font-sans font-medium">{customerName.trim() || "İsimsiz Müşteri"}</span>
              </div>
              <div className="shrink-0 font-medium">
                <span>{orderQuantity} Adet • {artworkWidth}×{artworkHeight} cm</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  setConfirmResetAction(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isDarkMode 
                    ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300" 
                    : "border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  if (confirmResetAction?.type === "load") {
                    executeLoadOrderToWorkspace(confirmResetAction.order, confirmResetAction.options);
                  } else {
                    handleResetSimulator();
                  }
                  setConfirmResetAction(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{confirmResetAction?.type === "load" ? "Siparişi Yükle" : "Sıfırla"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Siparişte Değişiklik Yapıldı - Güncelle / Yeni Kaydet Uyarı Modalı (Kural 1 & 2) */}
      {isOrderModifiedWarningOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsOrderModifiedWarningOpen(false)}
        >
          <div 
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 relative flex flex-col gap-5 ${
              isProductionOrDelivered
                ? (isDarkMode ? "bg-[#14171e] border-red-500/40 text-white" : "bg-white border-red-300 text-slate-900")
                : (isDarkMode ? "bg-[#14171e] border-amber-500/40 text-white" : "bg-white border-amber-300 text-slate-900")
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isProductionOrDelivered
                  ? "bg-red-500/15 text-red-500 border-red-500/25"
                  : "bg-amber-500/15 text-amber-500 border-amber-500/25"
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-bold ${
                  isProductionOrDelivered ? "text-red-500" : "text-amber-500"
                }`}>
                  {isProductionOrDelivered
                    ? "Üretim / Teslimat Koruması"
                    : isCostAffectingModified
                      ? "Maliyet Değişikliği (Onaylı Fiyat Koruması)"
                      : "Siparişte Değişiklik Yapıldı"}
                </h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                  {isProductionOrDelivered
                    ? "Üretimde veya teslim edilmiş bir siparişi güncelleyemezsiniz. Lütfen 'Yeni Kaydet' butonu ile yeni bir sipariş olarak kaydedin."
                    : isCostAffectingModified
                      ? "Maliyeti etkileyen alanlar (En, Boy, Profil, Cam, Adet) değiştirildiği için mevcut onaylı sipariş güncellenemez. Eski onaylı fiyatı korumak için lütfen 'Yeni Kaydet' butonunu kullanın."
                      : "Müşteri veya teslimat bilgileri değişti. Eski onaylı fiyat korunarak siparişi güncelleyebilir veya yeni bir sipariş olarak kaydedebilirsiniz."}
                </p>
              </div>
            </div>

            {/* Mini Sipariş Bilgi Kartı */}
            <div className={`p-3.5 rounded-2xl border text-xs font-mono flex items-center justify-between gap-2 ${
              isDarkMode ? "bg-black/30 border-white/5 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-[#C5A059] dark:text-[#E5C158]">#{orderNumber}</span>
                <span className="text-neutral-500">•</span>
                <span className="truncate font-sans font-medium">{customerName.trim() || "İsimsiz Müşteri"}</span>
              </div>
              <div className="shrink-0 font-medium">
                <span>{orderQuantity} Adet • {artworkWidth}×{artworkHeight} cm</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsOrderModifiedWarningOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer text-center ${
                  isDarkMode 
                    ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300" 
                    : "border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isProductionOrDelivered || isCostAffectingModified}
                onClick={() => {
                  if (isProductionOrDelivered || isCostAffectingModified) return;
                  setIsOrderModifiedWarningOpen(false);
                  handleCreateOrderFromSimulator({ asNewOrder: false });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${
                  isProductionOrDelivered || isCostAffectingModified
                    ? "opacity-35 cursor-not-allowed bg-neutral-700 text-neutral-400 border border-neutral-600"
                    : isDarkMode 
                      ? "bg-[#C5A059] hover:bg-[#b08c48] text-black cursor-pointer" 
                      : "bg-[#B88E3A] hover:bg-[#9E7728] text-white cursor-pointer"
                }`}
                title={
                  isProductionOrDelivered
                    ? "Üretimde veya teslim edilmiş bir siparişi güncelleyemezsiniz."
                    : isCostAffectingModified
                      ? "Maliyeti etkileyen alanlar değiştiğinde güncellenemez."
                      : "Siparişi Güncelle"
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Siparişi Güncelle</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOrderModifiedWarningOpen(false);
                  handleCreateOrderFromSimulator({ asNewOrder: true });
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  isProductionOrDelivered || isCostAffectingModified
                    ? "bg-emerald-500 text-black font-extrabold border-emerald-400 hover:bg-emerald-400 ring-2 ring-emerald-500/40"
                    : isDarkMode 
                      ? "border-emerald-500/50 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40" 
                      : "border-emerald-600 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function AppRoutes() {
  const { isDarkMode, enterDevMode, isDevMode, exitDevMode } = useAuthGuard();
  const navigate = useNavigate();
  const [userAccounts] = useState<UserAccount[]>(() => loadUsersFromStorage());

  const handleContinueAsGuest = () => {
    enterDevMode();
    navigate("/");
  };

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginScreen
              users={userAccounts}
              onLoginSuccess={() => {}}
              onContinueAsGuest={handleContinueAsGuest}
              isDarkMode={isDarkMode}
            />
          }
        />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/pending" element={<PendingApprovalScreen />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SimulatorMain />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Sadece AI Studio Geliştirici Önizlemesinde (DEV modunda) görünen Tasarım Düzenleme Butonu */}
      {import.meta.env.DEV && (
        <aside aria-label="AI Studio Geliştirici Araçları" className="fixed bottom-4 left-4 z-[9999] pointer-events-auto">
          {!isDevMode ? (
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#111317]/95 hover:bg-black text-white text-xs font-bold border border-[#C5A059]/60 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="AI Studio Önizlemesi: Oturum ve Onay bariyerlerini atlayıp simülatörü açar"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C5A059]" />
              </span>
              <Compass className="w-4 h-4 text-[#C5A059]" />
              <span className="text-[#FAE2B3] group-hover:text-white">AI Studio Tasarım Düzenle</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                exitDevMode();
                navigate("/login");
              }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-bold border border-amber-500/35 shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Giriş ve Onay ekranlarını test etmek için tasarım modunu kapat"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Tasarım Modu Aktif (Auth Testi)</span>
            </button>
          )}
        </aside>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuardProvider>
        <AppRoutes />
      </AuthGuardProvider>
    </BrowserRouter>
  );
}

