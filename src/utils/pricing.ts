import { 
  UnitPricesSettings, 
  DEFAULT_UNIT_PRICES, 
  FrameProfileItem, 
  INITIAL_FRAME_PROFILES,
  CostCalculationBreakdown,
  CompleteCutList,
  CutListItem,
  MaterialInclusionFlags,
  DEFAULT_MATERIAL_INCLUSION,
  DEFAULT_PASPARTU_COLORS,
  CompanyProfile,
  DEFAULT_COMPANY_PROFILE,
  EMPTY_COMPANY_PROFILE,
  UserAccount,
  DEFAULT_USERS,
  SubscriptionData,
  DEFAULT_SUBSCRIPTION,
  isProPlan,
  OrderArchiveItem,
  DEFAULT_ARCHIVE_ORDERS,
  sanitizeUnitPricesSettings
} from "../types/pricing";

export function getPaspartuColorName(hex?: string): string {
  if (!hex) return "Krem / Beyaz";
  if (hex === "transparent" || hex === "glass") return "Şeffaf Cam / Akrilik";
  const match = DEFAULT_PASPARTU_COLORS.find(
    (item) => item.value.toLowerCase() === hex.toLowerCase()
  );
  if (match) return match.name;
  return hex.toUpperCase();
}

const SETTINGS_STORAGE_KEY = "nakka_unit_prices_v1";
const PROFILES_STORAGE_KEY = "nakka_frame_profiles_v1";
const COMPANY_STORAGE_KEY = "nakka_company_profile_v1";
const USERS_STORAGE_KEY = "nakka_users_v1";
const SUBSCRIPTION_STORAGE_KEY = "nakka_subscription_v1";
const ARCHIVE_STORAGE_KEY = "nakka_orders_archive_v1";
const AUTH_SESSION_KEY = "nakka_auth_session_v1";

// Otomatik Temizlik: Tarayıcı 5MB localStorage limitini doldurmamak için
// yüksek boyutlu profil dokuları ve sipariş görsel verilerini temizle
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem(PROFILES_STORAGE_KEY);
    localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    localStorage.removeItem("nakka_order_archive_v1");
    localStorage.removeItem("nakka_frame_profiles_v1");
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.includes("frame_profiles") || k.includes("order_archive"))) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Oturumlar arası veri sızıntısını ve cache çakışmasını engellemek için anahtarı tenant_id ile kapsüller
 */
export function getScopedKey(baseKey: string, tenantId?: string): string {
  const tid = tenantId || (typeof window !== "undefined" ? localStorage.getItem("nakka_tenant_id") || "" : "");
  return tid ? `${baseKey}_${tid}` : baseKey;
}

/**
 * Kullanıcı oturumu kapattığında veya hesap değiştirdiğinde tüm tenant cache'ini temizler
 */
export function clearAllUserTenantCache(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove = [
      SETTINGS_STORAGE_KEY,
      PROFILES_STORAGE_KEY,
      COMPANY_STORAGE_KEY,
      USERS_STORAGE_KEY,
      SUBSCRIPTION_STORAGE_KEY,
      ARCHIVE_STORAGE_KEY,
      "nakka_order_archive_v1",
      AUTH_SESSION_KEY,
      "nakka_tenant_id",
      "nakka_auth_user_id"
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Belirli bir tenant id ile etiketlenmiş tüm localStorage anahtarlarını sil
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key && 
        key.startsWith("nakka_") && 
        key !== "nakka_theme_mode" && 
        key !== "nakka_supabase_url" && 
        key !== "nakka_supabase_key"
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn("Error clearing user tenant cache:", e);
  }
}

export function generateOrderNumber(): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `NK-${new Date().getFullYear()}-${randomDigits}`;
}

export function loadSettingsFromStorage(): UnitPricesSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return sanitizeUnitPricesSettings({ ...DEFAULT_UNIT_PRICES, ...JSON.parse(saved) });
    }
  } catch (e) {
    console.error("Error loading pricing settings from localStorage", e);
  }
  return DEFAULT_UNIT_PRICES;
}

export function saveSettingsToStorage(settings: UnitPricesSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Quota hatası durumunda sessizce geç
  }
}

export function loadProfilesFromStorage(_tenantId?: string): FrameProfileItem[] {
  // Kullanıcı girişinde sadece kullanıcının yüklediği çerçeveler Supabase'den çekilir;
  // sahte veya varsayılan demo çerçeveler döndürülmez.
  return [];
}

export function saveProfilesToStorage(_profiles: FrameProfileItem[], _tenantId?: string): void {
  // LocalStorage QuotaExceededError önlendi: Yüksek boyutlu profil doku ve görselleri
  // localStorage'a kaydedilmez; doğrudan Supabase veritabanında yönetilir.
}

export function loadCompanyProfileFromStorage(tenantId?: string): CompanyProfile {
  try {
    const key = getScopedKey(COMPANY_STORAGE_KEY, tenantId);
    let saved = localStorage.getItem(key);
    if (!saved && !tenantId) {
      saved = localStorage.getItem(COMPANY_STORAGE_KEY);
    }
    if (saved) {
      const parsed = JSON.parse(saved);
      // Eski mock "Vizyon Art Studio" verisi varsa otomatik temizle
      if (parsed?.companyName === "Vizyon Art Studio" || parsed?.email?.includes("vizyonart")) {
        localStorage.removeItem(key);
        localStorage.removeItem(COMPANY_STORAGE_KEY);
        return EMPTY_COMPANY_PROFILE;
      }
      return { ...EMPTY_COMPANY_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error("Error loading company profile from localStorage", e);
  }
  return EMPTY_COMPANY_PROFILE;
}

export function saveCompanyProfileToStorage(profile: CompanyProfile, tenantId?: string): void {
  try {
    // Logo görseli (büyük base64) localStorage'a yazılmaz, QuotaExceededError kesin olarak önlenir.
    const safeProfile = { 
      ...profile, 
      logoUrl: profile.logoUrl && profile.logoUrl.startsWith("http") ? profile.logoUrl : null 
    };
    const key = getScopedKey(COMPANY_STORAGE_KEY, tenantId);
    localStorage.setItem(key, JSON.stringify(safeProfile));
  } catch (e) {
    // Quota hatası durumunda sessizce geç
  }
}

export function loadUsersFromStorage(): UserAccount[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed: UserAccount[] = JSON.parse(saved);
      const hasMockOnly = parsed.length > 0 && parsed.every(u => u.id && /^usr_[1-3]$/.test(u.id));
      if (hasMockOnly) {
        localStorage.removeItem(USERS_STORAGE_KEY);
        return [];
      }
      return parsed;
    }
  } catch (e) {
    console.error("Error loading users from localStorage", e);
  }
  return [];
}

export function saveUsersToStorage(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Error saving users to localStorage", e);
  }
}

// Subscription & Credit Storage
export function loadSubscriptionFromStorage(): SubscriptionData {
  try {
    const saved = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Hardcoded 35 ve 50 kalıntılarını temizle
      if (parsed.remainingCredits === 35 && parsed.totalCredits === 50) {
        parsed.remainingCredits = 0;
        parsed.totalCredits = 0;
      }
      const isSub = isProPlan(parsed);
      return { 
        ...DEFAULT_SUBSCRIPTION, 
        ...parsed,
        isMonthlySubscription: isSub,
        maxUsers: isSub ? 6 : 3
      };
    }
  } catch (e) {
    console.error("Error loading subscription from localStorage", e);
  }
  return DEFAULT_SUBSCRIPTION;
}

export function saveSubscriptionToStorage(sub: SubscriptionData): void {
  try {
    const isSub = isProPlan(sub);
    const normalized: SubscriptionData = {
      ...sub,
      isMonthlySubscription: isSub,
      maxUsers: isSub ? 6 : 3
    };
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.error("Error saving subscription to localStorage", e);
  }
}

export function deductSubscriptionCredit(): SubscriptionData {
  const current = loadSubscriptionFromStorage();
  const nextCredits = Math.max(0, current.remainingCredits - 1);
  const updated: SubscriptionData = {
    ...current,
    remainingCredits: nextCredits,
    status: nextCredits === 0 ? "exhausted" : nextCredits < 15 ? "expiring_soon" : "active"
  };
  saveSubscriptionToStorage(updated);
  return updated;
}

// Archive Orders Storage
export function loadArchiveOrdersFromStorage(_tenantId?: string): OrderArchiveItem[] {
  // LocalStorage / Cache mantığı tamamen iptal edildi.
  // Sipariş arşivleri doğrudan Supabase veritabanından çekilir.
  return [];
}

export const loadOrdersArchiveFromStorage = loadArchiveOrdersFromStorage;

export function saveArchiveOrdersToStorage(_orders: OrderArchiveItem[], _tenantId?: string): void {
  // LocalStorage QuotaExceededError önlendi: Büyük sipariş listeleri ve görseller
  // localStorage'a kaydedilmez; doğrudan Supabase veritabanında saklanır.
}

export function addOrderToArchive(newOrder: OrderArchiveItem, currentOrders: OrderArchiveItem[] = []): OrderArchiveItem[] {
  const existing = currentOrders.length > 0 ? currentOrders : loadArchiveOrdersFromStorage();
  // If order with same orderNumber or id exists, replace it, otherwise unshift to top
  const filtered = existing.filter(o => o.orderNumber !== newOrder.orderNumber && o.id !== newOrder.id);
  const updated = [newOrder, ...filtered];
  saveArchiveOrdersToStorage(updated);
  return updated;
}

export function deleteOrderFromArchive(orderId: string, currentOrders: OrderArchiveItem[] = []): OrderArchiveItem[] {
  const existing = currentOrders.length > 0 ? currentOrders : loadArchiveOrdersFromStorage();
  const updated = existing.filter(o => o.id !== orderId);
  saveArchiveOrdersToStorage(updated);
  return updated;
}

// Auth Session Storage
export interface AuthSession {
  isLoggedIn: boolean;
  userId: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  rememberMe: boolean;
  loginTime: string;
}

export function loadAuthSession(): AuthSession | null {
  try {
    const saved = localStorage.getItem(AUTH_SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading auth session", e);
  }
  return null;
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Error saving auth session", e);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (e) {
    console.error("Error clearing auth session", e);
  }
}


interface CalculateCostParams {
  artworkWidthCm: number;
  artworkHeightCm: number;
  matWidthCm: number;
  frameWidthCm: number;
  middleMatWidthCm: number;
  outerFrameWidthCm: number;
  innerMatColor?: string;
  outerMatColor?: string;
  selectedInnerProfileMeterPrice?: number;
  selectedOuterProfileMeterPrice?: number;
  customOverridePrice?: number | null;
  flags?: MaterialInclusionFlags;
  deliveryMethod?: "store" | "shipping";
  customShippingCost?: number;
  settings: UnitPricesSettings;
}

export const REBATE_PER_SIDE_CM = 0.6; // 6 mm (0.6 cm) çerçeve bini payı per edge

export function calculateCostsAndPricing(params: CalculateCostParams): CostCalculationBreakdown {
  const {
    artworkWidthCm,
    artworkHeightCm,
    matWidthCm,
    frameWidthCm,
    middleMatWidthCm,
    outerFrameWidthCm,
    innerMatColor,
    outerMatColor,
    selectedInnerProfileMeterPrice,
    selectedOuterProfileMeterPrice,
    customOverridePrice,
    flags = DEFAULT_MATERIAL_INCLUSION,
    settings
  } = params;

  const safeNum = (v: any, fallback = 0): number => {
    if (v === null || v === undefined || v === "") return fallback;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isNaN(n) || !isFinite(n) ? fallback : Math.max(0, n);
  };

  // Ayarları sanitize et: Boş veya tanımsız değerler 0 olur, asla NaN üretmez
  const safeSettings = sanitizeUnitPricesSettings(settings);

  const safeArtworkWidth = safeNum(artworkWidthCm, 0);
  const safeArtworkHeight = safeNum(artworkHeightCm, 0);
  const safeMatWidth = safeNum(matWidthCm, 0);
  const safeFrameWidth = safeNum(frameWidthCm, 0);
  const safeMiddleMatWidth = safeNum(middleMatWidthCm, 0);
  const safeOuterFrameWidth = safeNum(outerFrameWidthCm, 0);

  // Check transparent/glass mat selections
  const isInnerMatTransparent = innerMatColor === "transparent" || innerMatColor === "glass";
  const innerMatUnitPrice = isInnerMatTransparent
    ? (safeSettings.transparentMatBoardPricePerSqm || 520)
    : safeSettings.matBoardPricePerSqm;

  const isMiddleMatTransparent = outerMatColor === "transparent" || outerMatColor === "glass";
  const middleMatUnitPrice = isMiddleMatTransparent
    ? (safeSettings.transparentMatBoardPricePerSqm || 520)
    : safeSettings.middleMatBoardPricePerSqm;

  // 1. Dimensions calculations (with 6 mm = 0.6 cm frame rebate)
  // Artwork area in m²
  const artworkSqm = (safeArtworkWidth * safeArtworkHeight) / 10000;

  // Inner Mat outer dimensions (In-rebate resting size)
  const innerMatOuterW = safeArtworkWidth + 2 * safeMatWidth;
  const innerMatOuterH = safeArtworkHeight + 2 * safeMatWidth;
  // Full sheet size required to cut inner paspartu (window cutout area is consumed)
  const innerMatSqm = safeMatWidth > 0 
    ? (innerMatOuterW * innerMatOuterH) / 10000
    : 0;

  // Inner Frame outer miter dimensions & linear meter
  // Note: Frame rebate is 0.6 cm on each side, so miter outer width = innerMatOuterW - 2*0.6 + 2*frameWidthCm
  const innerFrameMiterW = safeFrameWidth > 0 ? innerMatOuterW - 2 * REBATE_PER_SIDE_CM + 2 * safeFrameWidth : innerMatOuterW;
  const innerFrameMiterH = safeFrameWidth > 0 ? innerMatOuterH - 2 * REBATE_PER_SIDE_CM + 2 * safeFrameWidth : innerMatOuterH;
  const innerFrameMeter = safeFrameWidth > 0 ? (2 * (innerFrameMiterW + innerFrameMiterH)) / 100 : 0;

  // Middle Mat outer dimensions
  const middleMatOuterW = innerFrameMiterW + 2 * safeMiddleMatWidth;
  const middleMatOuterH = innerFrameMiterH + 2 * safeMiddleMatWidth;
  // Full sheet size required to cut middle paspartu
  const middleMatSqm = safeMiddleMatWidth > 0 
    ? (middleMatOuterW * middleMatOuterH) / 10000
    : 0;

  // Outer Frame outer miter dimensions & linear meter (with 0.6 cm rebate)
  const innerRebateW = middleMatOuterW;
  const innerRebateH = middleMatOuterH;
  const outerFrameMiterW = safeOuterFrameWidth > 0 ? innerRebateW - 2 * REBATE_PER_SIDE_CM + 2 * safeOuterFrameWidth : innerRebateW;
  const outerFrameMiterH = safeOuterFrameWidth > 0 ? innerRebateH - 2 * REBATE_PER_SIDE_CM + 2 * safeOuterFrameWidth : innerRebateH;
  const outerFrameMeter = safeOuterFrameWidth > 0 
    ? (2 * (outerFrameMiterW + outerFrameMiterH)) / 100
    : 0;

  // Glass, Backing board, Backing cloth & Kraft Tape dimensions
  // Fits inside the outermost frame rebate (outer frame if present, else inner frame)
  const outmostRebateW = safeOuterFrameWidth > 0 ? middleMatOuterW : innerMatOuterW;
  const outmostRebateH = safeOuterFrameWidth > 0 ? middleMatOuterH : innerMatOuterH;
  const glassBackingSqm = (outmostRebateW * outmostRebateH) / 10000;
  const backingClothSqm = glassBackingSqm;
  const kraftTapeMeter = Number(((2 * (outmostRebateW + outmostRebateH)) / 100).toFixed(2));

  // 2. Unit Prices
  const innerProfilePrice = safeNum(selectedInnerProfileMeterPrice ?? safeSettings.defaultInnerFramePricePerMeter, 0);
  const outerProfilePrice = safeNum(selectedOuterProfileMeterPrice ?? safeSettings.defaultOuterFramePricePerMeter, 0);
  const backingClothUnitPrice = safeNum(safeSettings.backingClothPricePerSqm ?? safeSettings.backingPaperPricePerSqm, 0);
  const kraftTapeUnitPrice = safeNum(safeSettings.kraftTapePricePerMeter, 0);

  // 3. Raw Costs Calculation (₺) respecting Inclusion Flags
  const artworkCost = flags.includeArtworkPrint ? artworkSqm * safeSettings.canvasPrintPricePerSqm : 0;
  const innerMatCost = (flags.includeInnerMat && safeMatWidth > 0) ? innerMatSqm * innerMatUnitPrice : 0;
  const middleMatCost = (flags.includeMiddleMat && safeMiddleMatWidth > 0) ? middleMatSqm * middleMatUnitPrice : 0;
  const innerFrameCost = flags.includeInnerFrame ? innerFrameMeter * innerProfilePrice : 0;
  const outerFrameCost = (flags.includeOuterFrame && safeOuterFrameWidth > 0) ? outerFrameMeter * outerProfilePrice : 0;
  
  const glassCost = flags.includeGlass ? glassBackingSqm * safeSettings.glassPricePerSqm : 0;
  const backingBoardCost = flags.includeBackingBoard ? glassBackingSqm * safeSettings.backingBoardPricePerSqm : 0;
  
  const isBackingClothActive = Boolean(flags.includeBackingCloth || flags.includeBackingPaper);
  const isKraftTapeActive = Boolean(flags.includeKraftTape || flags.includeBackingPaper);

  const backingClothCost = isBackingClothActive ? backingClothSqm * backingClothUnitPrice : 0;
  const kraftTapeCost = isKraftTapeActive ? kraftTapeMeter * kraftTapeUnitPrice : 0;
  const backingPaperCost = backingClothCost + kraftTapeCost; // Legacy total

  const rawMaterialsSubtotal = artworkCost + innerMatCost + middleMatCost + innerFrameCost + outerFrameCost + glassCost + backingBoardCost + backingClothCost + kraftTapeCost;
  
  // Waste cost (% of raw materials)
  const wasteCost = rawMaterialsSubtotal * (safeSettings.wastePercentage / 100);
  const totalMaterialCost = rawMaterialsSubtotal + wasteCost;

  // Direct Cost = Materials + Fixed Labor
  const laborCost = flags.includeLaborCost ? safeSettings.laborFixedCost : 0;
  const totalDirectCost = totalMaterialCost + laborCost;

  // Profit Margin
  const profitAmount = totalDirectCost * (safeSettings.targetProfitMarginPercent / 100);
  const calculatedPriceBeforeVat = totalDirectCost + profitAmount;

  // VAT (KDV)
  const vatAmount = calculatedPriceBeforeVat * (safeSettings.vatRatePercent / 100);
  const calculatedPriceWithVat = calculatedPriceBeforeVat + vatAmount;

  const deliveryMethod = params.deliveryMethod || "store";
  const shippingCost = deliveryMethod === "shipping" 
    ? safeNum(params.customShippingCost ?? safeSettings.defaultShippingCost, 0)
    : 0;

  const overridePriceWithVat = customOverridePrice !== undefined && customOverridePrice !== null && customOverridePrice > 0 
    ? customOverridePrice 
    : null;

  const framingPriceWithVat = overridePriceWithVat ?? Math.ceil(calculatedPriceWithVat);
  const effectiveFinalPriceWithVat = framingPriceWithVat + shippingCost;

  // 4. Calculate Customer Retail Selling Prices (incorporating Waste + Profit Margin + VAT)
  const matRetailMultiplier = (1 + safeSettings.wastePercentage / 100) * (1 + safeSettings.targetProfitMarginPercent / 100) * (1 + safeSettings.vatRatePercent / 100);
  const laborRetailMultiplier = (1 + safeSettings.targetProfitMarginPercent / 100) * (1 + safeSettings.vatRatePercent / 100);

  // Potential raw costs (calculated regardless of flag state so UI can show the selling price when option is enabled)
  const potArtworkCost = artworkSqm * safeSettings.canvasPrintPricePerSqm;
  const potInnerMatCost = safeMatWidth > 0 ? innerMatSqm * innerMatUnitPrice : 0;
  const potMiddleMatCost = safeMiddleMatWidth > 0 ? middleMatSqm * middleMatUnitPrice : 0;
  const potInnerFrameCost = innerFrameMeter * innerProfilePrice;
  const potOuterFrameCost = safeOuterFrameWidth > 0 ? outerFrameMeter * outerProfilePrice : 0;
  const potGlassCost = glassBackingSqm * safeSettings.glassPricePerSqm;
  const potBackingBoardCost = glassBackingSqm * safeSettings.backingBoardPricePerSqm;
  const potBackingClothCost = backingClothSqm * backingClothUnitPrice;
  const potKraftTapeCost = kraftTapeMeter * kraftTapeUnitPrice;
  const potLaborCost = safeSettings.laborFixedCost;

  const artworkSellingPrice = potArtworkCost * matRetailMultiplier;
  const innerMatSellingPrice = potInnerMatCost * matRetailMultiplier;
  const middleMatSellingPrice = potMiddleMatCost * matRetailMultiplier;
  const innerFrameSellingPrice = potInnerFrameCost * matRetailMultiplier;
  const outerFrameSellingPrice = potOuterFrameCost * matRetailMultiplier;
  const glassSellingPrice = potGlassCost * matRetailMultiplier;
  const backingBoardSellingPrice = potBackingBoardCost * matRetailMultiplier;
  const backingClothSellingPrice = potBackingClothCost * matRetailMultiplier;
  const kraftTapeSellingPrice = potKraftTapeCost * matRetailMultiplier;
  const laborSellingPrice = potLaborCost * laborRetailMultiplier;

  return {
    artworkSqm,
    innerMatSqm,
    middleMatSqm,
    innerFrameMeter,
    outerFrameMeter,
    glassBackingSqm,
    backingClothSqm,
    kraftTapeMeter,
    backingPaperSqm: backingClothSqm,
    
    artworkCost,
    innerMatCost,
    middleMatCost,
    innerFrameCost,
    outerFrameCost,
    glassCost,
    backingBoardCost,
    backingClothCost,
    kraftTapeCost,
    backingPaperCost,
    laborCost,
    wasteCost,

    artworkSellingPrice,
    innerMatSellingPrice,
    middleMatSellingPrice,
    innerFrameSellingPrice,
    outerFrameSellingPrice,
    glassSellingPrice,
    backingBoardSellingPrice,
    backingClothSellingPrice,
    kraftTapeSellingPrice,
    laborSellingPrice,
    
    totalMaterialCost,
    totalDirectCost,
    profitAmount,
    calculatedPriceBeforeVat,
    vatAmount,
    calculatedPriceWithVat,
    
    overridePriceWithVat,
    effectiveFinalPriceWithVat,

    deliveryMethod,
    shippingCost,

    flags,

    isInnerMatTransparent,
    isMiddleMatTransparent,
    innerMatUnitPrice,
    middleMatUnitPrice
  };
}

export function generateCutList(params: {
  orderNumber?: string;
  artworkWidthCm: number;
  artworkHeightCm: number;
  matWidthCm: number;
  frameWidthCm: number;
  middleMatWidthCm: number;
  outerFrameWidthCm: number;
  innerFrameCode?: string;
  outerFrameCode?: string;
  innerMatColor?: string;
  outerMatColor?: string;
  flags?: MaterialInclusionFlags;
}): CompleteCutList {
  const {
    orderNumber = "NK-ORDER",
    artworkWidthCm,
    artworkHeightCm,
    matWidthCm,
    frameWidthCm,
    middleMatWidthCm,
    outerFrameWidthCm,
    innerFrameCode,
    outerFrameCode,
    innerMatColor,
    outerMatColor,
    flags = DEFAULT_MATERIAL_INCLUSION
  } = params;

  const items: CutListItem[] = [];

  // 1. Sanat Eseri (Baskı & Tuval)
  items.push({
    layerName: "01. Sanat Eseri (Baskı / Canvas)",
    materialInfo: "380gr Premium Tuval / Fine Art Kağıt",
    cutAngle: "90° Düz Giyotin Kesim",
    pieceWidthCm: artworkWidthCm,
    pieceHeightCm: artworkHeightCm,
    quantityWidthPieces: 1,
    quantityHeightPieces: 1,
    totalMeterNeeded: (artworkWidthCm * artworkHeightCm) / 10000,
    unit: "m²",
    notes: "Eser net görsel alanı.",
    included: flags.includeArtworkPrint
  });

  // 2. İç Paspartu (Eğer varsa)
  if (matWidthCm > 0) {
    const windowW = artworkWidthCm;
    const windowH = artworkHeightCm;
    const outerW = artworkWidthCm + 2 * matWidthCm;
    const outerH = artworkHeightCm + 2 * matWidthCm;
    const colorName = getPaspartuColorName(innerMatColor);
    const isTransparent = innerMatColor === "transparent" || innerMatColor === "glass";

    items.push({
      layerName: isTransparent ? "02. İç Paspartu (Şeffaf Akrilik / Cam)" : "02. İç Paspartu Kartonu",
      materialInfo: isTransparent 
        ? `1.5mm / 2mm Lazer Kesim Şeffaf Akrilik Paspartu (${colorName})`
        : `Müze Kalite Asitsiz Paspartu Kartonu (${colorName})`,
      cutAngle: isTransparent ? "Özel Lazer / CNC Kesim & 90° Dış Kenar" : "45° Eğik Pencere & 90° Dış Kenar",
      pieceWidthCm: outerW,
      pieceHeightCm: outerH,
      quantityWidthPieces: 1,
      quantityHeightPieces: 1,
      totalMeterNeeded: (outerW * outerH) / 10000,
      unit: "m²",
      notes: `Pencere Açıklığı: ${windowW.toFixed(1)} x ${windowH.toFixed(1)} cm. Paspartu Payı: 4 Kenar ${matWidthCm.toFixed(1)} cm. ${isTransparent ? 'Malzeme: Şeffaf Akrilik / Cam Levha.' : `Renk: ${colorName}.`}`,
      included: flags.includeInnerMat
    });
  }

  // 3. İç Çerçeve (Ana Profil)
  const innerMatOuterW = artworkWidthCm + 2 * matWidthCm;
  const innerMatOuterH = artworkHeightCm + 2 * matWidthCm;
  // Bini payı: Her kenarda 0.6 cm (6 mm) binme var
  const innerFrameMiterW = frameWidthCm > 0 ? innerMatOuterW - 2 * REBATE_PER_SIDE_CM + 2 * frameWidthCm : innerMatOuterW;
  const innerFrameMiterH = frameWidthCm > 0 ? innerMatOuterH - 2 * REBATE_PER_SIDE_CM + 2 * frameWidthCm : innerMatOuterH;
  const innerTotalMeter = frameWidthCm > 0 ? (2 * (innerFrameMiterW + innerFrameMiterH)) / 100 : 0;

  items.push({
    layerName: "03. İç Çerçeve Profil Kesimi",
    profileCode: innerFrameCode || "Ana Profil",
    materialInfo: `Genişlik: ${frameWidthCm.toFixed(1)} cm Profil (6 mm Bini Paylı)`,
    cutAngle: "45° Çift Taraflı Gönye Kesim",
    pieceWidthCm: Number(innerFrameMiterW.toFixed(1)),
    pieceHeightCm: Number(innerFrameMiterH.toFixed(1)),
    quantityWidthPieces: 2,
    quantityHeightPieces: 2,
    totalMeterNeeded: Number((innerTotalMeter * 1.15).toFixed(2)),
    unit: "mt",
    notes: `Bini İç Oturma Ölçüsü: ${innerMatOuterW.toFixed(1)} x ${innerMatOuterH.toFixed(1)} cm (Kenar Bini: 6 mm). Dış Gönye Ölçüsü: 2x ${innerFrameMiterW.toFixed(1)} cm, 2x ${innerFrameMiterH.toFixed(1)} cm.`,
    included: flags.includeInnerFrame
  });

  // 4. Ara Paspartu (3D Mukavva - Eğer varsa)
  if (middleMatWidthCm > 0) {
    const midOuterW = innerFrameMiterW + 2 * middleMatWidthCm;
    const midOuterH = innerFrameMiterH + 2 * middleMatWidthCm;
    const colorName = getPaspartuColorName(outerMatColor);
    const isTransparent = outerMatColor === "transparent" || outerMatColor === "glass";

    items.push({
      layerName: isTransparent ? "04. Ara Paspartu (Şeffaf Akrilik / Cam)" : "04. Ara Paspartu (3D Derinlik Mukavvası)",
      materialInfo: isTransparent
        ? `1.5mm / 2mm Şeffaf Akrilik Levha (${colorName})`
        : `Kalın Derinlik Mukavvası / Bevel Mat Board (${colorName})`,
      cutAngle: isTransparent ? "Özel Lazer / CNC Kesim" : "90° Düz / Bevel Pahlı Kesim",
      pieceWidthCm: midOuterW,
      pieceHeightCm: midOuterH,
      quantityWidthPieces: 1,
      quantityHeightPieces: 1,
      totalMeterNeeded: (midOuterW * midOuterH) / 10000,
      unit: "m²",
      notes: `İç Boşluk Ölçüsü: ${innerFrameMiterW.toFixed(1)} x ${innerFrameMiterH.toFixed(1)} cm. Dış Ölçü: ${midOuterW.toFixed(1)} x ${midOuterH.toFixed(1)} cm. ${isTransparent ? 'Malzeme: Şeffaf Akrilik / Cam Levha.' : `Renk: ${colorName}.`}`,
      included: flags.includeMiddleMat
    });
  }

  // 5. Dış Çerçeve (Profil - Eğer varsa)
  if (outerFrameWidthCm > 0) {
    const innerRebateW = innerFrameMiterW + 2 * middleMatWidthCm;
    const innerRebateH = innerFrameMiterH + 2 * middleMatWidthCm;
    const outerFrameMiterW = innerRebateW - 2 * REBATE_PER_SIDE_CM + 2 * outerFrameWidthCm;
    const outerFrameMiterH = innerRebateH - 2 * REBATE_PER_SIDE_CM + 2 * outerFrameWidthCm;
    const outerTotalMeter = (2 * (outerFrameMiterW + outerFrameMiterH)) / 100;

    items.push({
      layerName: "05. Dış Çerçeve Profil Kesimi",
      profileCode: outerFrameCode || "Dış Profil",
      materialInfo: `Genişlik: ${outerFrameWidthCm.toFixed(1)} cm Dış Profil (6 mm Bini Paylı)`,
      cutAngle: "45° Çift Taraflı Gönye Kesim",
      pieceWidthCm: Number(outerFrameMiterW.toFixed(1)),
      pieceHeightCm: Number(outerFrameMiterH.toFixed(1)),
      quantityWidthPieces: 2,
      quantityHeightPieces: 2,
      totalMeterNeeded: Number((outerTotalMeter * 1.15).toFixed(2)),
      unit: "mt",
      notes: `Bini İç Oturma Ölçüsü: ${innerRebateW.toFixed(1)} x ${innerRebateH.toFixed(1)} cm (Kenar Bini: 6 mm). Dış Gönye Ölçüsü: 2x ${outerFrameMiterW.toFixed(1)} cm, 2x ${outerFrameMiterH.toFixed(1)} cm.`,
      included: flags.includeOuterFrame
    });
  }

  // 6. Cam / Koruyucu Akrilik (Sits inside outermost frame rebate)
  const glassW = outerFrameWidthCm > 0 ? (innerFrameMiterW + 2 * middleMatWidthCm) : innerMatOuterW;
  const glassH = outerFrameWidthCm > 0 ? (innerFrameMiterH + 2 * middleMatWidthCm) : innerMatOuterH;
  items.push({
    layerName: "06. Koruyucu Cam / Akrilik Kesimi",
    materialInfo: "2mm Dereceli Müze Camı / Akrilik",
    cutAngle: "90° Elmas Cam Kesimi",
    pieceWidthCm: glassW,
    pieceHeightCm: glassH,
    quantityWidthPieces: 1,
    quantityHeightPieces: 1,
    totalMeterNeeded: (glassW * glassH) / 10000,
    unit: "m²",
    notes: `Cam net levha ölçüsü: ${glassW.toFixed(1)} x ${glassH.toFixed(1)} cm.`,
    included: flags.includeGlass
  });

  // 7. MDF / Arkalık Kartonu
  items.push({
    layerName: "07. Arka Koruma (MDF / Arkalık)",
    materialInfo: "3mm Ham MDF / Koruyucu Levha",
    cutAngle: "90° Düz Kesim",
    pieceWidthCm: glassW,
    pieceHeightCm: glassH,
    quantityWidthPieces: 1,
    quantityHeightPieces: 1,
    totalMeterNeeded: (glassW * glassH) / 10000,
    unit: "m²",
    notes: `MDF levha ölçüsü: ${glassW.toFixed(1)} x ${glassH.toFixed(1)} cm.`,
    included: flags.includeBackingBoard
  });

  // 8. Arkalık Kapama Bezi (Toz & Nem Kapama)
  items.push({
    layerName: "08. Arkalık Kapama Bezi",
    materialInfo: "Toz & Nem Geçirmez Arkalık Kapama Bezi",
    cutAngle: "90° Düz Plaka Kesimi",
    pieceWidthCm: glassW,
    pieceHeightCm: glassH,
    quantityWidthPieces: 1,
    quantityHeightPieces: 1,
    totalMeterNeeded: (glassW * glassH) / 10000,
    unit: "m²",
    notes: `Kapama bezi levha ölçüsü: ${glassW.toFixed(1)} x ${glassH.toFixed(1)} cm. MDF arkalık üzerine yapıştırılır.`,
    included: Boolean(flags.includeBackingCloth || flags.includeBackingPaper)
  });

  // 9. Kraft Bitiş Bandı (Çevre Bandı)
  items.push({
    layerName: "09. Kraft Bitiş / Islak Bandı",
    materialInfo: "Asitsiz Koruyucu Bitiş / Islak Kraft Bant",
    cutAngle: "4 Kenar Çevre Bandı",
    pieceWidthCm: glassW,
    pieceHeightCm: glassH,
    quantityWidthPieces: 2,
    quantityHeightPieces: 2,
    totalMeterNeeded: Number(((2 * (glassW + glassH)) / 100).toFixed(2)),
    unit: "mt",
    notes: "Çerçeve arkasına 4 kenar boyunca toz izolasyonu ve estetik bitiş için yapıştırılır.",
    included: Boolean(flags.includeKraftTape || flags.includeBackingPaper)
  });

  // Calculate final absolute outer dimensions
  const finalOuterW = innerFrameMiterW + 2 * middleMatWidthCm + 2 * outerFrameWidthCm;
  const finalOuterH = innerFrameMiterH + 2 * middleMatWidthCm + 2 * outerFrameWidthCm;

  return {
    orderNumber,
    artworkDimensions: `${artworkWidthCm.toFixed(1)} x ${artworkHeightCm.toFixed(1)} cm`,
    totalOuterDimensions: `${finalOuterW.toFixed(1)} x ${finalOuterH.toFixed(1)} cm`,
    items,
    assemblyInstructions: [
      "1. Önce tuval/baskı görselini hazırlayın ve asitsiz koruyucu ile sabitleyin.",
      matWidthCm > 0 ? "2. İç paspartu kartonunu pencereli kesip görselin üzerine yerleştirin." : "2. Paspartusuz doğrudan çerçeve montajına geçin.",
      "3. İç çerçeve profillerini 45° gönye zımba/çivisiz V-nail birleşimi ile çatıp birleştirin.",
      middleMatWidthCm > 0 ? "4. Çerçevenin etrafına 3D ara paspartu mukavvasını hassas yapıştırın." : "4. Ara paspartu adımı atlandı.",
      outerFrameWidthCm > 0 ? "5. Dış kasayı 45° gönyeden çatarak iç çerçeve ve ara paspartu kombinasyonuna giydirin." : "5. Dış çerçeve kullanılmadı.",
      flags.includeGlass ? "6. Cam/Akrilik temizlenip yerleştirilir." : "6. Camsız uygulama.",
      flags.includeBackingBoard ? "7. Arka MDF levhası çakılır." : "7. MDF takılmadı.",
      flags.includeBackingPaper ? "8. Toz geçirmez kapama bezi/kraft bandı arka kenarlara çekilir." : "8. Kapama bezi uygulanmadı."
    ]
  };
}

