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
  UserAccount,
  DEFAULT_USERS,
  SubscriptionData,
  DEFAULT_SUBSCRIPTION,
  isProPlan,
  OrderArchiveItem,
  DEFAULT_ARCHIVE_ORDERS
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

export function generateOrderNumber(): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `NK-${new Date().getFullYear()}-${randomDigits}`;
}

export function loadSettingsFromStorage(): UnitPricesSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_UNIT_PRICES, ...JSON.parse(saved) };
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
    console.error("Error saving pricing settings to localStorage", e);
  }
}

export function loadProfilesFromStorage(): FrameProfileItem[] {
  try {
    const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading frame profiles from localStorage", e);
  }
  return INITIAL_FRAME_PROFILES;
}

export function saveProfilesToStorage(profiles: FrameProfileItem[]): void {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Error saving frame profiles to localStorage", e);
  }
}

export function loadCompanyProfileFromStorage(): CompanyProfile {
  try {
    const saved = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error loading company profile from localStorage", e);
  }
  return DEFAULT_COMPANY_PROFILE;
}

export function saveCompanyProfileToStorage(profile: CompanyProfile): void {
  try {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Error saving company profile to localStorage", e);
  }
}

export function loadUsersFromStorage(): UserAccount[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading users from localStorage", e);
  }
  return DEFAULT_USERS;
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
export function loadArchiveOrdersFromStorage(): OrderArchiveItem[] {
  try {
    const saved = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading order archive from localStorage", e);
  }
  return DEFAULT_ARCHIVE_ORDERS;
}

export const loadOrdersArchiveFromStorage = loadArchiveOrdersFromStorage;

export function saveArchiveOrdersToStorage(orders: OrderArchiveItem[]): void {
  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Error saving order archive to localStorage", e);
  }
}

export function addOrderToArchive(newOrder: OrderArchiveItem): OrderArchiveItem[] {
  const existing = loadArchiveOrdersFromStorage();
  // If order with same orderNumber exists, replace it, otherwise unshift to top
  const filtered = existing.filter(o => o.orderNumber !== newOrder.orderNumber);
  const updated = [newOrder, ...filtered];
  saveArchiveOrdersToStorage(updated);
  return updated;
}

export function deleteOrderFromArchive(orderId: string): OrderArchiveItem[] {
  const existing = loadArchiveOrdersFromStorage();
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

  // Check transparent/glass mat selections
  const isInnerMatTransparent = innerMatColor === "transparent" || innerMatColor === "glass";
  const innerMatUnitPrice = isInnerMatTransparent
    ? (settings.transparentMatBoardPricePerSqm ?? 520)
    : settings.matBoardPricePerSqm;

  const isMiddleMatTransparent = outerMatColor === "transparent" || outerMatColor === "glass";
  const middleMatUnitPrice = isMiddleMatTransparent
    ? (settings.transparentMatBoardPricePerSqm ?? 520)
    : settings.middleMatBoardPricePerSqm;

  // 1. Dimensions calculations (with 6 mm = 0.6 cm frame rebate)
  // Artwork area in m²
  const artworkSqm = (artworkWidthCm * artworkHeightCm) / 10000;

  // Inner Mat outer dimensions (In-rebate resting size)
  const innerMatOuterW = artworkWidthCm + 2 * matWidthCm;
  const innerMatOuterH = artworkHeightCm + 2 * matWidthCm;
  // Full sheet size required to cut inner paspartu (window cutout area is consumed)
  const innerMatSqm = matWidthCm > 0 
    ? (innerMatOuterW * innerMatOuterH) / 10000
    : 0;

  // Inner Frame outer miter dimensions & linear meter
  // Note: Frame rebate is 0.6 cm on each side, so miter outer width = innerMatOuterW - 2*0.6 + 2*frameWidthCm
  const innerFrameMiterW = frameWidthCm > 0 ? innerMatOuterW - 2 * REBATE_PER_SIDE_CM + 2 * frameWidthCm : innerMatOuterW;
  const innerFrameMiterH = frameWidthCm > 0 ? innerMatOuterH - 2 * REBATE_PER_SIDE_CM + 2 * frameWidthCm : innerMatOuterH;
  const innerFrameMeter = frameWidthCm > 0 ? (2 * (innerFrameMiterW + innerFrameMiterH)) / 100 : 0;

  // Middle Mat outer dimensions
  const middleMatOuterW = innerFrameMiterW + 2 * middleMatWidthCm;
  const middleMatOuterH = innerFrameMiterH + 2 * middleMatWidthCm;
  // Full sheet size required to cut middle paspartu
  const middleMatSqm = middleMatWidthCm > 0 
    ? (middleMatOuterW * middleMatOuterH) / 10000
    : 0;

  // Outer Frame outer miter dimensions & linear meter (with 0.6 cm rebate)
  const innerRebateW = middleMatOuterW;
  const innerRebateH = middleMatOuterH;
  const outerFrameMiterW = outerFrameWidthCm > 0 ? innerRebateW - 2 * REBATE_PER_SIDE_CM + 2 * outerFrameWidthCm : innerRebateW;
  const outerFrameMiterH = outerFrameWidthCm > 0 ? innerRebateH - 2 * REBATE_PER_SIDE_CM + 2 * outerFrameWidthCm : innerRebateH;
  const outerFrameMeter = outerFrameWidthCm > 0 
    ? (2 * (outerFrameMiterW + outerFrameMiterH)) / 100
    : 0;

  // Glass, Backing board, Backing cloth & Kraft Tape dimensions
  // Fits inside the outermost frame rebate (outer frame if present, else inner frame)
  const outmostRebateW = outerFrameWidthCm > 0 ? middleMatOuterW : innerMatOuterW;
  const outmostRebateH = outerFrameWidthCm > 0 ? middleMatOuterH : innerMatOuterH;
  const glassBackingSqm = (outmostRebateW * outmostRebateH) / 10000;
  const backingClothSqm = glassBackingSqm;
  const kraftTapeMeter = Number(((2 * (outmostRebateW + outmostRebateH)) / 100).toFixed(2));

  // 2. Unit Prices
  const innerProfilePrice = selectedInnerProfileMeterPrice ?? settings.defaultInnerFramePricePerMeter;
  const outerProfilePrice = selectedOuterProfileMeterPrice ?? settings.defaultOuterFramePricePerMeter;
  const backingClothUnitPrice = settings.backingClothPricePerSqm ?? settings.backingPaperPricePerSqm ?? 90;
  const kraftTapeUnitPrice = settings.kraftTapePricePerMeter ?? 20;

  // 3. Raw Costs Calculation (₺) respecting Inclusion Flags
  const artworkCost = flags.includeArtworkPrint ? artworkSqm * settings.canvasPrintPricePerSqm : 0;
  const innerMatCost = (flags.includeInnerMat && matWidthCm > 0) ? innerMatSqm * innerMatUnitPrice : 0;
  const middleMatCost = (flags.includeMiddleMat && middleMatWidthCm > 0) ? middleMatSqm * middleMatUnitPrice : 0;
  const innerFrameCost = flags.includeInnerFrame ? innerFrameMeter * innerProfilePrice : 0;
  const outerFrameCost = (flags.includeOuterFrame && outerFrameWidthCm > 0) ? outerFrameMeter * outerProfilePrice : 0;
  
  const glassCost = flags.includeGlass ? glassBackingSqm * settings.glassPricePerSqm : 0;
  const backingBoardCost = flags.includeBackingBoard ? glassBackingSqm * settings.backingBoardPricePerSqm : 0;
  
  const isBackingClothActive = Boolean(flags.includeBackingCloth || flags.includeBackingPaper);
  const isKraftTapeActive = Boolean(flags.includeKraftTape || flags.includeBackingPaper);

  const backingClothCost = isBackingClothActive ? backingClothSqm * backingClothUnitPrice : 0;
  const kraftTapeCost = isKraftTapeActive ? kraftTapeMeter * kraftTapeUnitPrice : 0;
  const backingPaperCost = backingClothCost + kraftTapeCost; // Legacy total

  const rawMaterialsSubtotal = artworkCost + innerMatCost + middleMatCost + innerFrameCost + outerFrameCost + glassCost + backingBoardCost + backingClothCost + kraftTapeCost;
  
  // Waste cost (% of raw materials)
  const wasteCost = rawMaterialsSubtotal * (settings.wastePercentage / 100);
  const totalMaterialCost = rawMaterialsSubtotal + wasteCost;

  // Direct Cost = Materials + Fixed Labor
  const laborCost = flags.includeLaborCost ? settings.laborFixedCost : 0;
  const totalDirectCost = totalMaterialCost + laborCost;

  // Profit Margin
  const profitAmount = totalDirectCost * (settings.targetProfitMarginPercent / 100);
  const calculatedPriceBeforeVat = totalDirectCost + profitAmount;

  // VAT (KDV)
  const vatAmount = calculatedPriceBeforeVat * (settings.vatRatePercent / 100);
  const calculatedPriceWithVat = calculatedPriceBeforeVat + vatAmount;

  const deliveryMethod = params.deliveryMethod || "store";
  const shippingCost = deliveryMethod === "shipping" 
    ? (params.customShippingCost ?? settings.defaultShippingCost ?? 150)
    : 0;

  const overridePriceWithVat = customOverridePrice !== undefined && customOverridePrice !== null && customOverridePrice > 0 
    ? customOverridePrice 
    : null;

  const framingPriceWithVat = overridePriceWithVat ?? Math.ceil(calculatedPriceWithVat);
  const effectiveFinalPriceWithVat = framingPriceWithVat + shippingCost;

  // 4. Calculate Customer Retail Selling Prices (incorporating Waste + Profit Margin + VAT)
  const matRetailMultiplier = (1 + settings.wastePercentage / 100) * (1 + settings.targetProfitMarginPercent / 100) * (1 + settings.vatRatePercent / 100);
  const laborRetailMultiplier = (1 + settings.targetProfitMarginPercent / 100) * (1 + settings.vatRatePercent / 100);

  // Potential raw costs (calculated regardless of flag state so UI can show the selling price when option is enabled)
  const potArtworkCost = artworkSqm * settings.canvasPrintPricePerSqm;
  const potInnerMatCost = matWidthCm > 0 ? innerMatSqm * innerMatUnitPrice : 0;
  const potMiddleMatCost = middleMatWidthCm > 0 ? middleMatSqm * middleMatUnitPrice : 0;
  const potInnerFrameCost = innerFrameMeter * innerProfilePrice;
  const potOuterFrameCost = outerFrameWidthCm > 0 ? outerFrameMeter * outerProfilePrice : 0;
  const potGlassCost = glassBackingSqm * settings.glassPricePerSqm;
  const potBackingBoardCost = glassBackingSqm * settings.backingBoardPricePerSqm;
  const potBackingClothCost = backingClothSqm * backingClothUnitPrice;
  const potKraftTapeCost = kraftTapeMeter * kraftTapeUnitPrice;
  const potLaborCost = settings.laborFixedCost;

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

