import React, { useState, useRef, useEffect } from "react";
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
  Move
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { SettingsModal } from "./components/SettingsModal";
import { AccountModal } from "./components/AccountModal";
import { CostBreakdownModal } from "./components/CostBreakdownModal";
import { CuttingListModal } from "./components/CuttingListModal";
import { FrameProfileSelector } from "./components/FrameProfileSelector";
import { ImageCropModal } from "./components/ImageCropModal";
import { ArtworkStep } from "./components/ArtworkStep";
import { FramingStep } from "./components/FramingStep";
import { OrderStep } from "./components/OrderStep";
import { LoginScreen } from "./components/LoginScreen";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { OrderArchiveModal } from "./components/OrderArchiveModal";
import { PrintCenterModal } from "./components/PrintCenterModal";
import { CustomerWallPreviewModal } from "./components/CustomerWallPreviewModal";
import { VisualizerHeaderSpec } from "./components/VisualizerHeaderSpec";
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
  isProPlan
} from "./types/pricing";
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
  addOrderToArchive,
  deleteOrderFromArchive,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession
} from "./utils/pricing";
import { 
  triggerImagePrintWindow, 
  triggerBackLabelPrintWindow, 
  triggerCuttingListPrintWindow, 
  triggerCostBreakdownPrintWindow 
} from "./utils/printHelper";

const NakkaLogo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 transition-transform duration-300 hover:scale-105">
    <defs>
      <linearGradient id="nakkaGold" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stopColor="#FAE2B3" />
        <stop offset="30%" stopColor="#E5C17B" />
        <stop offset="65%" stopColor="#C5A059" />
        <stop offset="100%" stopColor="#805F21" />
      </linearGradient>
      
      {/* Premium mask to cut out the inner hollow portion of the outer monogram with absolute transparency */}
      <mask id="logoMask">
        <rect x="0" y="0" width="100" height="100" fill="white" />
        <path d="M 8 50 L 50 92 L 92 50 L 86 44 L 50 80 L 14 44 Z" fill="black" />
      </mask>
    </defs>
    
    {/* 1. Centered top golden diamond */}
    <path 
      d="M 50 12 L 64 26 L 50 40 L 36 26 Z" 
      fill="url(#nakkaGold)" 
    />
    
    {/* 2. Concentric middle golden chevron with flat parallel cuts */}
    <path 
      d="M 24 20 L 50 46 L 76 20 L 82 26 L 50 58 L 18 26 Z" 
      fill="url(#nakkaGold)" 
    />
    
    {/* 3. Outer golden "G" chevron structure with transparent mask cutouts */}
    <path 
      d="M 18 32 L 0 50 L 50 100 L 100 50 L 82 32 L 50 64 Z" 
      fill="url(#nakkaGold)" 
      mask="url(#logoMask)"
    />
    
    {/* 4. Interlocking inner gold hook/tongue within the cutout track */}
    <path 
      d="M 86 44 L 56 74 L 50 68 L 80 38 Z" 
      fill="url(#nakkaGold)" 
    />
  </svg>
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

export default function App() {
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

  // State management for custom visual configurator
  const [customPaintingUrl, setCustomPaintingUrl] = useState<string | null>(
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop" // Default beautiful classic painting
  );
  const [customPaintingFile, setCustomPaintingFile] = useState<string>("varsayilan_tablo.jpg");
  
  // Custom states for keyboard inputs (stored as string to prevent mid-typing lockups)
  const [widthInput, setWidthInput] = useState<string>("50");
  const [heightInput, setHeightInput] = useState<string>("70");
  
  // Custom frame profile uploader
  const [customFrameUrl, setCustomFrameUrl] = useState<string | null>(
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop" // Elegant wooden gold texture frame profile
  );
  const [customFrameFile, setCustomFrameFile] = useState<string>("varsayilan_cerceve_profili.jpg");
  const [frameWidthInput, setFrameWidthInput] = useState<string>("5.0");
  const [matWidthInput, setMatWidthInput] = useState<string>("0"); // Default 0.0 cm (Paspartusuz)

  // Custom outer frame profile uploader
  const [customOuterFrameUrl, setCustomOuterFrameUrl] = useState<string | null>(null);
  const [customOuterFrameFile, setCustomOuterFrameFile] = useState<string>("Yok");
  const [outerFrameWidthInput, setOuterFrameWidthInput] = useState<string>("0.0"); // Default 0.0 cm (disabled/hidden)
  const [outerFrameLayoutMode, setOuterFrameLayoutMode] = useState<string>("repeat"); // "miter-stretch" or "repeat"
  const [middleMatWidthInput, setMiddleMatWidthInput] = useState<string>("0.0"); // Default 0.0 cm (3D Paspartusuz)
  const [innerMatColor, setInnerMatColor] = useState<string>("#FAF9F5"); // İç paspartu rengi (Varsayılan Krem)
  const [outerMatColor, setOuterMatColor] = useState<string>("#FAF9F5"); // Dış/Ara paspartu rengi (Varsayılan Krem)
  const [deliveryMethod, setDeliveryMethod] = useState<"store" | "shipping">("store");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [customerNameError, setCustomerNameError] = useState<boolean>(false);
  const [customerPhoneError, setCustomerPhoneError] = useState<boolean>(false);
  const [deliveryDateError, setDeliveryDateError] = useState<boolean>(false);

  // Pricing, Database & Modal States
  const [unitPricesSettings, setUnitPricesSettings] = useState<UnitPricesSettings>(() => loadSettingsFromStorage());
  const [frameProfiles, setFrameProfiles] = useState<FrameProfileItem[]>(() => loadProfilesFromStorage());
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => loadCompanyProfileFromStorage());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => loadUsersFromStorage());
  const [activeUser, setActiveUser] = useState<UserAccount>(() => {
    const list = loadUsersFromStorage();
    return list[0];
  });
  const [customOverridePrice, setCustomOverridePrice] = useState<number | null>(null);

  const [orderNumber] = useState<string>(() => generateOrderNumber());
  const [activeSidebarTab, setActiveSidebarTab] = useState<"artwork" | "framing" | "materials" | "all">("artwork");
  const [inclusionFlags, setInclusionFlags] = useState<MaterialInclusionFlags>({
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
    includeLaborCost: false
  });

  const handleToggleFlag = (flagKey: keyof MaterialInclusionFlags) => {
    setInclusionFlags(prev => {
      if (flagKey === 'includeBackingPaper') {
        const nextState = !(prev.includeBackingPaper || prev.includeBackingCloth || prev.includeKraftTape);
        return {
          ...prev,
          includeBackingPaper: nextState,
          includeBackingCloth: nextState,
          includeKraftTape: nextState,
        };
      }
      if (flagKey === 'includeBackingCloth' || flagKey === 'includeKraftTape') {
        const nextVal = !prev[flagKey];
        const otherKey = flagKey === 'includeBackingCloth' ? 'includeKraftTape' : 'includeBackingCloth';
        return {
          ...prev,
          [flagKey]: nextVal,
          includeBackingPaper: nextVal || prev[otherKey],
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
  const [settingsInitialTab, setSettingsInitialTab] = useState<"prices" | "profiles" | "privacy" | "whitelabel">("prices");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false);
  const [isCutListModalOpen, setIsCutListModalOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isPrintCenterModalOpen, setIsPrintCenterModalOpen] = useState<boolean>(false);

  // B2B Subscription, Order Archive, and Session state
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>(() => loadSubscriptionFromStorage());
  const [archiveOrders, setArchiveOrders] = useState<OrderArchiveItem[]>(() => loadOrdersArchiveFromStorage());
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

  const handleLogout = () => {
    clearAuthSession();
    setAuthSession(null);
  };

  const handleContinueAsGuest = () => {
    const defaultUser: UserAccount = userAccounts[0] || {
      id: "demo_guest",
      email: "demo@nakka.com",
      username: "misafir",
      fullName: "Misafir Atölye",
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
      rememberMe: false,
      loginTime: new Date().toISOString()
    };
    saveAuthSession(session);
    setAuthSession(session);
  };

  const handleDeleteArchiveOrder = (orderId: string) => {
    const updated = deleteOrderFromArchive(orderId);
    setArchiveOrders(updated);
  };

  const handleLoadOrderToWorkspace = (order: OrderArchiveItem) => {
    if (order.artworkWidthCm) setWidthInput(String(order.artworkWidthCm));
    if (order.artworkHeightCm) setHeightInput(String(order.artworkHeightCm));
    if (order.customerName) setCustomerName(order.customerName);
    if (order.customerPhone) setCustomerPhone(order.customerPhone);
    if (order.deliveryDate) setDeliveryDate(order.deliveryDate);
    if (order.deliveryMethod) setDeliveryMethod(order.deliveryMethod);
    setIsArchiveModalOpen(false);
  };

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
    innerFrameCode: activeInnerProfile ? `${activeInnerProfile.code} (${activeInnerProfile.name})` : customFrameFile,
    outerFrameCode: activeOuterProfile ? `${activeOuterProfile.code} (${activeOuterProfile.name})` : customOuterFrameFile,
    innerMatColor: innerMatColor,
    outerMatColor: outerMatColor,
    orderNumber: orderNumber,
    flags: effectiveInclusionFlags
  });

  // Settings & Profile save handlers
  const handleSaveSettings = (newSettings: UnitPricesSettings) => {
    setUnitPricesSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const handleSaveProfiles = (newProfiles: FrameProfileItem[]) => {
    setFrameProfiles(newProfiles);
    saveProfilesToStorage(newProfiles);
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

  // Select initial inner frame profile if none selected
  useEffect(() => {
    if (!selectedInnerProfileId && frameProfiles.length > 0) {
      handleSelectInnerProfile(frameProfiles[0].id);
    }
  }, [frameProfiles]);

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

  // Dynamic preview measurement refs
  const [stageWidth, setStageWidth] = useState<number>(600);
  const [stageHeight, setStageHeight] = useState<number>(600);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setStageWidth(entry.contentRect.width);
        }
        if (entry.contentRect.height > 0) {
          setStageHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameFileInputRef = useRef<HTMLInputElement | null>(null);
  const outerFrameFileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local image uploads
  const handlePaintingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomPaintingUrl(reader.result as string);
        setCustomPaintingFile(file.name);
        setIsCropModalOpen(true); // Open corner scanner & crop modal automatically on image selection
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomFrameUrl(reader.result as string);
        setCustomFrameFile(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOuterFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomOuterFrameUrl(reader.result as string);
        setCustomOuterFrameFile(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Milimetrik piksel dönüştürücü oranlama sistemi (Eser boyutu ile çerçeve boyutu arası orantısızlığı tamamen çözer)
  // Toplam fiziksel cm ölçüleri
  const totalW = artworkWidth + 2 * (outerFrameWidth + middleMatWidth + frameWidth + matWidth);
  const totalH = artworkHeight + 2 * (outerFrameWidth + middleMatWidth + frameWidth + matWidth);
  const finalOuterWidthCm = totalW;
  const finalOuterHeightCm = totalH;
  const totalAspect = totalW / totalH;

  // Sanal duvar sahnesinin 4 etrafından en az 30px içerde kalacak şekilde hassas ölçeklendirme
  const minPaddingPx = 30;
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
        companyName: companyProfile.companyName || "Nakkaş Çerçeve Atölyesi",
        activeProfileName: activeInnerProfile?.name || activeInnerProfile?.code || "Klasik Profil",
        outerProfileName: activeOuterProfile?.name || activeOuterProfile?.code || "",
        totalPrice: costBreakdown.effectiveFinalPriceWithVat,
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
    const qrText = `NAKKA DECOR | IS EMRI
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
Toplam Olcu: ${totalW.toFixed(1)}x${totalH.toFixed(1)} cm
Fiyat: TL ${costBreakdown.effectiveFinalPriceWithVat.toLocaleString('tr-TR')}
Durum: Onaylandi / Uretime Hazir`;

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
        totalW,
        totalH,
        customPaintingFile,
        customFrameFile,
        customOuterFrameFile,
        effectivePrice: costBreakdown.effectiveFinalPriceWithVat,
        deliveryMethod,
        shippingCost: costBreakdown.shippingCost,
        qrDataUrl,
        flags: effectiveInclusionFlags,
        companyProfile: companyProfile.includeInQuotes ? {
          ...companyProfile,
          logoUrl: isProPlan(subscriptionData) ? companyProfile.logoUrl : ""
        } : undefined,
        authorUser: activeUser?.fullName
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
      totalAmount: costBreakdown.effectiveFinalPriceWithVat,
      currency: "₺",
      status: "quote",
      deliveryMethod: deliveryMethod,
      authorUser: activeUser?.fullName || "Yetkili Personel"
    };
    const updatedArchive = addOrderToArchive(newArchiveItem);
    setArchiveOrders(updatedArchive);

    // Deduct 1 credit from subscription
    const updatedSub = deductSubscriptionCredit();
    setSubscriptionData(updatedSub);
  };

  const handlePrintBackLabel = async () => {
    let qrDataUrl = "";
    try {
      const qrText = `SİPARİŞ NO: ${orderNumber}
MÜŞTERİ: ${customerName || 'Belirtilmedi'}
ESER: ${artworkWidth}x${artworkHeight} cm
DIŞ EBAT: ${totalW.toFixed(1)}x${totalH.toFixed(1)} cm
TARİH: ${new Date().toLocaleDateString('tr-TR')}
ATÖLYE: ${companyProfile?.companyName || 'Nakka Decor'}`;

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
      isPro: isProPlan(subscriptionData)
    });
  };

  const handlePrintCuttingList = () => {
    triggerCuttingListPrintWindow({
      cutList,
      customerName,
      deliveryDate,
      artworkWidthCm: artworkWidth,
      artworkHeightCm: artworkHeight,
      companyProfile: {
        ...companyProfile,
        logoUrl: isProPlan(subscriptionData) ? companyProfile.logoUrl : ""
      }
    });
  };

  const handlePrintCostBreakdown = () => {
    triggerCostBreakdownPrintWindow({
      breakdown: costBreakdown,
      settings: unitPricesSettings,
      artworkWidthCm: artworkWidth,
      artworkHeightCm: artworkHeight,
      orderNumber,
      customerName,
      deliveryDate,
      flags: effectiveInclusionFlags,
      companyProfile: {
        ...companyProfile,
        logoUrl: isProPlan(subscriptionData) ? companyProfile.logoUrl : ""
      }
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
      <LoginScreen
        users={userAccounts}
        onLoginSuccess={handleLoginSuccess}
        onRegisterCompany={handleRegisterCompany}
        onContinueAsGuest={handleContinueAsGuest}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className={`w-full min-h-screen lg:h-screen font-sans flex flex-col lg:overflow-hidden transition-colors duration-200 ${
      isDarkMode ? "bg-[#0e1013] text-white" : "bg-[#f4f5f7] text-slate-900"
    }`}>
      
      {/* 1. Header with AI Studio styling & Gold Highlights */}
      <header className={`h-auto md:h-18 py-3 md:py-0 border-b flex flex-col md:flex-row items-center justify-between px-4 md:px-8 flex-shrink-0 z-20 shadow-sm gap-3 transition-colors duration-200 rounded-b-2xl md:rounded-b-3xl ${
        isDarkMode ? "bg-[#14171e] border-white/10" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          <NakkaLogo size={36} />
          <div>
            <h1 className={`text-base md:text-lg font-black tracking-widest uppercase ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}>
              NAKKA <span className={isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}>DECOR</span>
            </h1>
            <p className={`text-[9px] md:text-[10px] uppercase tracking-[0.18em] font-bold -mt-0.5 hidden sm:block ${
              isDarkMode ? "text-[#C5A059]/80" : "text-[#B88E3A]"
            }`}>
              Tablo & Çerçeve Simülatörü
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Active Company & Logged in Member pill (Opens Account & Company Settings) */}
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] font-mono tracking-wider transition-all cursor-pointer shadow-sm ${
              isDarkMode 
                ? "bg-[#101216] border-white/10 text-neutral-300 hover:border-[#C5A059]/60 hover:text-white" 
                : "bg-white border-slate-200 text-slate-700 hover:border-[#B88E3A]/60 hover:text-slate-900"
            }`}
            title="Hesap & Firma Ayarları (Logo, Bilgiler ve Üye Yönetimi)"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-[#C5A059] truncate max-w-[90px] sm:max-w-[120px]">
              {companyProfile.companyName || "Nakka Decor"}
            </span>
            <span className="text-neutral-500 hidden sm:inline">|</span>
            <span className="truncate max-w-[80px] text-neutral-400 hidden sm:inline">
              @{activeUser?.username || "admin"}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase hidden md:inline-block ${
              isDarkMode ? "bg-white/10 text-neutral-300" : "bg-slate-100 text-slate-700"
            }`}>
              HESAP
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isDarkMode
                ? "bg-[#101216] border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-400/30"
                : "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200"
            }`}
            title="Oturumu Kapat (Giriş Ekranına Dön)"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Light / Dark Mode Switcher Button */}
          <button
            onClick={() => setThemeMode(isDarkMode ? "light" : "dark")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
              isDarkMode
                ? "bg-[#101216] border-white/10 text-[#C5A059] hover:bg-[#1a1e26]"
                : "bg-slate-100 border-slate-200 text-[#B88E3A] hover:bg-slate-200"
            }`}
            title={isDarkMode ? "Açık Moda Geç" : "Koyu Moda Geç"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#C5A059]" /> : <Moon className="w-3.5 h-3.5 text-[#B88E3A]" />}
            <span className="hidden sm:inline">{isDarkMode ? "AÇIK" : "KOYU"}</span>
          </button>

          {/* Subscription / Credit Badge */}
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all uppercase text-[10px] font-bold tracking-wider shadow-sm cursor-pointer ${
              subscriptionData.remainingCredits < 15 
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse" 
                : isDarkMode 
                  ? "bg-[#101216] border-[#C5A059]/40 hover:border-[#C5A059] text-[#C5A059]" 
                  : "bg-white border-[#B88E3A]/40 hover:border-[#B88E3A] text-[#B88E3A]"
            }`}
            title="Kredi & Abonelik Yönetimi (Kalan Kredi)"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{subscriptionData.remainingCredits} <span className="hidden sm:inline">KREDİ</span></span>
          </button>

          {/* Order Archive Button */}
          <button
            onClick={() => setIsArchiveModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all uppercase text-[10px] font-bold tracking-wider shadow-sm cursor-pointer ${
              isDarkMode
                ? "bg-[#101216] border-white/10 text-neutral-300 hover:text-white"
                : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
            }`}
            title="Geçmiş Sipariş ve Teklif Arşivi"
          >
            <Archive className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <span className="hidden sm:inline">ARŞİV</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
              isDarkMode ? "bg-white/10 text-[#C5A059]" : "bg-slate-100 text-[#B88E3A]"
            }`}>
              {archiveOrders.length}
            </span>
          </button>

          {/* Live Price Calculator Button */}
          <button 
            onClick={() => setIsCostModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all uppercase text-[10px] font-bold tracking-wider shadow-sm cursor-pointer ${
              isDarkMode
                ? "bg-[#101216] border-white/10 hover:border-[#C5A059]/50 text-white"
                : "bg-white border-slate-200 hover:border-[#B88E3A]/50 text-slate-900"
            }`}
            title="Maliyet Dökümü & Kalem Kalem Fiyat Analizi"
          >
            <Calculator className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <span className="hidden md:inline text-neutral-400">TUTAR:</span>
            <strong className={`text-xs font-mono ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
              ₺{costBreakdown.effectiveFinalPriceWithVat.toLocaleString("tr-TR")}
            </strong>
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all uppercase text-[10px] font-bold tracking-wider shadow-sm cursor-pointer ${
              isDarkMode
                ? "bg-[#101216] border-white/10 text-neutral-300 hover:text-white"
                : "bg-white border-slate-200 text-slate-700 hover:text-slate-900"
            }`}
            title="Birim Fiyat Ayarları & Çerçeve Veritabanı"
          >
            <Settings className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <span className="hidden sm:inline">AYARLAR</span>
          </button>

          {/* Consolidated Unified Print Center Button (4 Belgeli Yazdırma Merkezi) */}
          <button 
            onClick={() => setIsPrintCenterModalOpen(true)}
            className={`flex items-center gap-2 font-extrabold px-3.5 py-1.5 transition-all duration-200 uppercase text-[10px] sm:text-[11px] tracking-wider shadow-md active:scale-95 cursor-pointer rounded-xl border ${
              isDarkMode
                ? "bg-[#C5A059] text-black border-[#d6b169] hover:bg-[#b5924d]"
                : "bg-[#B88E3A] text-white border-[#a67e2f] hover:bg-[#a67e2f]"
            }`}
            title="Yazdırma & Belge Merkezi: Sipariş Formu, Üretim Emri, Maliyet Tablosu, 4x4 Arka Etiket"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>YAZDIR & BELGELER</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black ${
              isDarkMode ? "bg-black/25 text-black" : "bg-black/20 text-white"
            }`}>
              4
            </span>
          </button>
        </div>
      </header>

      {/* Hidden processing canvas used as a background worker */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Visualizer Workspace Layout */}
      <main className="flex-grow flex flex-col lg:flex-row lg:overflow-hidden">
          
          {/* Left Control Panel / Inputs sidebar */}
          <aside className={`w-full lg:w-[450px] xl:w-[480px] rounded-3xl p-4 sm:p-5 flex flex-col gap-4 flex-shrink-0 z-10 shadow-sm overflow-y-auto order-last lg:order-none transition-colors duration-200 border ${
            isDarkMode ? "bg-[#14171d] border-white/10 text-neutral-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            {/* Step Navigation Pill Bar */}
            <div 
              data-drag-scroll="true"
              className={`p-1 rounded-2xl border flex items-center justify-between gap-1 shadow-inner shrink-0 overflow-x-auto drag-scroll ${
              isDarkMode ? "bg-[#0e1013] border-white/10" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setActiveSidebarTab("artwork")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSidebarTab === "artwork"
                    ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-900 shadow-sm border border-slate-200/80")
                    : (isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>1. Eser & Ölçü</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab("framing")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSidebarTab === "framing"
                    ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-900 shadow-sm border border-slate-200/80")
                    : (isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Çerçeve</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab("materials")}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSidebarTab === "materials"
                    ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-900 shadow-sm border border-slate-200/80")
                    : (isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>3. Sipariş</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarTab(activeSidebarTab === "all" ? "artwork" : "all")}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
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
                costBreakdown={costBreakdown}
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
                onPrevStep={activeSidebarTab === "materials" ? () => setActiveSidebarTab("framing") : undefined}
              />
            )}
          </aside>

          {/* Central High-Resolution Wide Virtual Wall Canvas Visualizer */}
          <section 
            ref={stageRef} 
            data-no-drag-scroll="true"
            onWheel={(e) => {
              if (wallMode === "room") {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.05 : -0.05;
                if (roomActiveTarget === "frame") {
                  setRoomFrameScale((prev) => Math.min(2.5, Math.max(0.15, Number((prev + delta).toFixed(2)))));
                } else {
                  setRoomBgScale((prev) => Math.min(2.5, Math.max(0.50, Number((prev + delta).toFixed(2)))));
                }
              }
            }}
            className="w-full h-[520px] sm:h-[650px] lg:h-auto lg:flex-grow relative flex items-center justify-center p-4 sm:p-6 overflow-hidden z-0 order-first lg:order-none transition-all duration-500 shadow-inner rounded-none border border-black/10 select-none"
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

            {/* Top Spec Bar (When in Wall Color Mode) */}
            {wallMode !== "room" && (
              <div className="absolute top-4 left-4 right-4 z-30 flex justify-center pointer-events-none">
                <VisualizerHeaderSpec
                  artworkWidth={artworkWidth}
                  artworkHeight={artworkHeight}
                  finalOuterWidthCm={finalOuterWidthCm}
                  finalOuterHeightCm={finalOuterHeightCm}
                  costBreakdown={costBreakdown}
                  activeInnerProfileName={activeInnerProfile?.name}
                  matWidth={matWidth}
                  innerMatColorName={getPaspartuColorName(innerMatColor)}
                  deliveryMethod={deliveryMethod}
                  isDarkMode={isDarkMode}
                  onOpenCostModal={() => setIsCostModalOpen(true)}
                />
              </div>
            )}

            {/* Floating Room Mode Toolbar */}
            {wallMode === "room" && (
              <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between pointer-events-auto gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-[#C5A059]/40 text-[#C5A059] text-xs font-semibold shadow-xl">
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Müşteri Odası Simülasyonu</span>
                  <span className="text-[10px] text-neutral-400 border-l border-white/20 pl-2 hidden xl:inline">
                    Tabloyu veya odayı seçip ölçeklendirebilir ve sürükleyebilirsiniz
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* Selector: Tablo vs Oda */}
                  <div className="flex items-center gap-0.5 bg-black/85 backdrop-blur-md border border-white/15 rounded-full p-0.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setRoomActiveTarget("frame")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                        roomActiveTarget === "frame"
                          ? "bg-[#C5A059] text-black shadow"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <span>🖼️ Tablo</span>
                      <span className="font-mono text-[10px]">%{Math.round(roomFrameScale * 100)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoomActiveTarget("room")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                        roomActiveTarget === "room"
                          ? "bg-[#C5A059] text-black shadow"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <span>🏠 Oda</span>
                      <span className="font-mono text-[10px]">%{Math.round(roomBgScale * 100)}</span>
                    </button>
                  </div>

                  {/* Sığdır / Doldur Toggle */}
                  <button
                    type="button"
                    onClick={() => setRoomBgFit((prev) => (prev === "cover" ? "contain" : "cover"))}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-all cursor-pointer flex items-center gap-1 shadow-lg ${
                      roomBgFit === "contain"
                        ? "bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]"
                        : "bg-black/85 border-white/15 text-neutral-300 hover:text-white"
                    }`}
                    title="Dikey veya yatay telefon fotoğraflarında odayı tam sığdırır"
                  >
                    <span>{roomBgFit === "contain" ? "Sığdır (Dikey)" : "Doldur"}</span>
                  </button>

                  {/* Scale zoom controls with slider */}
                  <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-white/15 rounded-full px-2.5 py-1 shadow-lg text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (roomActiveTarget === "frame") {
                          setRoomFrameScale((prev) => Math.max(0.15, Number((prev - 0.05).toFixed(2))));
                        } else {
                          setRoomBgScale((prev) => Math.max(0.50, Number((prev - 0.05).toFixed(2))));
                        }
                      }}
                      className="text-neutral-300 hover:text-white px-1 cursor-pointer font-bold"
                      title="Küçült"
                    >
                      -
                    </button>
                    <input 
                      type="range"
                      min={roomActiveTarget === "frame" ? "0.15" : "0.50"}
                      max="2.50"
                      step="0.02"
                      value={roomActiveTarget === "frame" ? roomFrameScale : roomBgScale}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (roomActiveTarget === "frame") setRoomFrameScale(val);
                        else setRoomBgScale(val);
                      }}
                      className="w-14 sm:w-20 h-1.5 accent-[#C5A059] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (roomActiveTarget === "frame") {
                          setRoomFrameScale((prev) => Math.min(2.50, Number((prev + 0.05).toFixed(2))));
                        } else {
                          setRoomBgScale((prev) => Math.min(2.50, Number((prev + 0.05).toFixed(2))));
                        }
                      }}
                      className="text-neutral-300 hover:text-white px-1 cursor-pointer font-bold"
                      title="Büyüt"
                    >
                      +
                    </button>
                    <span className="font-mono font-bold text-[#C5A059] px-1 text-[11px] min-w-[36px] text-center">
                      %{Math.round((roomActiveTarget === "frame" ? roomFrameScale : roomBgScale) * 100)}
                    </span>
                  </div>

                  {/* Reset button */}
                  <button
                    type="button"
                    onClick={() => { 
                      setRoomFramePos({ x: 0, y: 0 }); 
                      setRoomFrameScale(1); 
                      setRoomBgPos({ x: 0, y: 0 });
                      setRoomBgScale(1);
                    }}
                    className="px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/15 text-neutral-300 hover:text-white text-xs font-medium shadow-lg transition-colors cursor-pointer"
                    title="Konumu ve Ölçeği Sıfırla"
                  >
                    Ortala
                  </button>

                  {/* Customer Presentation Button */}
                  <button
                    type="button"
                    onClick={() => setIsCustomerPresentationOpen(true)}
                    className="px-3 py-1 rounded-full bg-[#C5A059] hover:bg-[#b5924d] text-black text-xs font-bold shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Müşteri Satış Kapatma Sunum Modu"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Sunum Modu</span>
                  </button>

                  {/* Return to wall color */}
                  <button
                    type="button"
                    onClick={() => setWallMode("color")}
                    className="p-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 text-neutral-400 hover:text-white text-xs shadow-lg transition-colors cursor-pointer"
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
          setIsSubscriptionModalOpen(true);
        }}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        isDarkMode={isDarkMode}
        companyProfile={companyProfile}
        onSaveCompanyProfile={handleSaveCompanyProfile}
        users={userAccounts}
        onSaveUsers={handleSaveUsers}
        activeUser={activeUser}
        onSetActiveUser={setActiveUser}
        subscription={subscriptionData}
        onOpenSubscriptionModal={() => {
          setIsAccountModalOpen(false);
          setIsSubscriptionModalOpen(true);
        }}
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
        onDeleteOrder={handleDeleteArchiveOrder}
        onLoadOrderToWorkspace={handleLoadOrderToWorkspace}
        companyProfile={companyProfile}
      />

      <CostBreakdownModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        breakdown={costBreakdown}
        settings={unitPricesSettings}
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
        totalPriceWithVat={costBreakdown.effectiveFinalPriceWithVat}
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
        onCropSave={(croppedDataUrl) => {
          setCustomPaintingUrl(croppedDataUrl);
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
        totalPrice={costBreakdown.effectiveFinalPriceWithVat}
        orderNumber={orderNumber}
        customerName={customerName}
        customerPhone={customerPhone}
        companyName={companyProfile.companyName || "Nakkaş Çerçeve Atölyesi"}
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

    </div>
  );
}
