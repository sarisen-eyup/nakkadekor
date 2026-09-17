export interface FrameProfileItem {
  id: string;
  name: string;
  code: string;
  imageUrl: string;
  textureUrl?: string; // Alternatif profil doku linki
  widthCm: number;
  unitPricePerMeter: number; // ₺ per linear meter
  materialType: "wood" | "polystyrene" | "aluminum" | "composite";
  category: "inner" | "outer" | "both";
  isRepeatingPattern?: boolean; // Tekrarlayan Desen kaplaması mı (true = Repeat Pattern, false = Miter-Stretch)
  layoutMode?: "miter-stretch" | "repeat"; // Köşe birleşim modu
}

export interface UnitPricesSettings {
  // Printing / Canvas
  canvasPrintPricePerSqm: number; // ₺ / m²
  
  // Mats / Cardboard & Acrylic / Glass
  matBoardPricePerSqm: number; // ₺ / m² (İç Paspartu Kartonu)
  middleMatBoardPricePerSqm: number; // ₺ / m² (Ara Paspartu / 3D Mukavva)
  transparentMatBoardPricePerSqm: number; // ₺ / m² (Şeffaf Cam / Akrilik Paspartu)
  
  // Default Frame Meter Prices
  defaultInnerFramePricePerMeter: number; // ₺ / m (İç Çerçeve Metre Fiyatı)
  defaultOuterFramePricePerMeter: number; // ₺ / m (Dış Çerçeve Metre Fiyatı)
  
  // Glass, Backing & Tape / Cloth
  glassPricePerSqm: number; // ₺ / m² (Cam / Koruyucu Akrilik)
  backingBoardPricePerSqm: number; // ₺ / m² (MDF / Arkalık Kartonu)
  backingClothPricePerSqm: number; // ₺ / m² (Arkalık Kapama Bezi)
  kraftTapePricePerMeter: number; // ₺ / m (Kraft Bitiş / Islak Bandı)
  backingPaperPricePerSqm?: number; // Legacy fallback
  
  // Fixed Labor & Waste
  laborFixedCost: number; // ₺ (Sabit Atölye İşçilik Bedeli)
  wastePercentage: number; // % (Kesim File / Atık Yüzdesi, varsayılan %15)
  
  // Profit & Taxes
  targetProfitMarginPercent: number; // % (Kâr Marjı, varsayılan %40)
  vatRatePercent: number; // % (KDV Oranı, varsayılan %20)

  // Delivery & Shipping
  defaultShippingCost: number; // ₺ (Varsayılan Kargo Gönderim Ücreti)
}

export interface MaterialInclusionFlags {
  includeArtworkPrint: boolean;
  includeInnerMat: boolean;
  includeInnerFrame: boolean;
  includeMiddleMat: boolean;
  includeOuterFrame: boolean;
  includeGlass: boolean;
  includeBackingBoard: boolean;
  includeBackingCloth: boolean;
  includeKraftTape: boolean;
  includeBackingPaper?: boolean; // Legacy
  includeLaborCost: boolean;
}

export const DEFAULT_MATERIAL_INCLUSION: MaterialInclusionFlags = {
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
  includeLaborCost: true,
};

export const DEFAULT_UNIT_PRICES: UnitPricesSettings = {
  canvasPrintPricePerSqm: 450, // ₺450/m²
  matBoardPricePerSqm: 280, // ₺280/m²
  middleMatBoardPricePerSqm: 350, // ₺350/m²
  transparentMatBoardPricePerSqm: 520, // ₺520/m² (Şeffaf Cam / Akrilik Paspartu)
  defaultInnerFramePricePerMeter: 120, // ₺120/m
  defaultOuterFramePricePerMeter: 180, // ₺180/m
  glassPricePerSqm: 320, // ₺320/m²
  backingBoardPricePerSqm: 180, // ₺180/m²
  backingClothPricePerSqm: 90, // ₺90/m² (Arkalık Kapama Bezi)
  kraftTapePricePerMeter: 20, // ₺20/m (Kraft Bitiş Bandı)
  backingPaperPricePerSqm: 90, // Legacy
  laborFixedCost: 250, // ₺250 sabit işçilik
  wastePercentage: 15, // %15 atık payı
  targetProfitMarginPercent: 40, // %40 kâr marjı
  vatRatePercent: 20, // %20 KDV
  defaultShippingCost: 150, // ₺150 Varsayılan kargo ücreti
};

/**
 * Boş bırakılan veya geçersiz form alanlarını 0 (sıfır) varsayılan değerine eşitleyerek
 * hesaplamalarda NaN (Not a Number) oluşmasını ve veritabanı hatalarını önler.
 */
export function sanitizeUnitPricesSettings(raw: any): UnitPricesSettings {
  const toZero = (val: any, fallback = 0): number => {
    if (val === null || val === undefined || val === "") return fallback;
    const n = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    return isNaN(n) || !isFinite(n) ? fallback : Math.max(0, n);
  };

  return {
    canvasPrintPricePerSqm: toZero(raw?.canvasPrintPricePerSqm, 0),
    matBoardPricePerSqm: toZero(raw?.matBoardPricePerSqm, 0),
    middleMatBoardPricePerSqm: toZero(raw?.middleMatBoardPricePerSqm, 0),
    transparentMatBoardPricePerSqm: toZero(raw?.transparentMatBoardPricePerSqm, 0),
    defaultInnerFramePricePerMeter: toZero(raw?.defaultInnerFramePricePerMeter, 0),
    defaultOuterFramePricePerMeter: toZero(raw?.defaultOuterFramePricePerMeter, 0),
    glassPricePerSqm: toZero(raw?.glassPricePerSqm, 0),
    backingBoardPricePerSqm: toZero(raw?.backingBoardPricePerSqm, 0),
    backingClothPricePerSqm: toZero(raw?.backingClothPricePerSqm ?? raw?.backingPaperPricePerSqm, 0),
    kraftTapePricePerMeter: toZero(raw?.kraftTapePricePerMeter, 0),
    backingPaperPricePerSqm: toZero(raw?.backingPaperPricePerSqm ?? raw?.backingClothPricePerSqm, 0),
    laborFixedCost: toZero(raw?.laborFixedCost, 0),
    wastePercentage: toZero(raw?.wastePercentage, 0),
    targetProfitMarginPercent: toZero(raw?.targetProfitMarginPercent, 0),
    vatRatePercent: toZero(raw?.vatRatePercent, 0),
    defaultShippingCost: toZero(raw?.defaultShippingCost, 0),
  };
}

// Standard UUID generator & validator
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUUID(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export const DEFAULT_FRAME_PROFILES: FrameProfileItem[] = [
  {
    id: "a0000000-0000-4000-8000-000000000501",
    code: "AV-501",
    name: "Altın Varak Klasik Oymalı",
    widthCm: 5.0,
    unitPricePerMeter: 150.0,
    materialType: "wood",
    category: "both",
    layoutMode: "repeat",
    isRepeatingPattern: true,
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
    textureUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "a0000000-0000-4000-8000-000000000302",
    code: "SM-302",
    name: "Siyah Mat Minimalist Galeri",
    widthCm: 3.0,
    unitPricePerMeter: 95.0,
    materialType: "polystyrene",
    category: "both",
    layoutMode: "repeat",
    isRepeatingPattern: true,
    imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80",
    textureUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "a0000000-0000-4000-8000-000000000405",
    code: "CR-405",
    name: "Doğal Masif Meşe",
    widthCm: 4.0,
    unitPricePerMeter: 180.0,
    materialType: "wood",
    category: "both",
    layoutMode: "repeat",
    isRepeatingPattern: true,
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80",
    textureUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "a0000000-0000-4000-8000-000000000201",
    code: "BL-201",
    name: "Fırçalanmış İnce Alüminyum",
    widthCm: 2.0,
    unitPricePerMeter: 120.0,
    materialType: "aluminum",
    category: "inner",
    layoutMode: "repeat",
    isRepeatingPattern: true,
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    textureUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "a0000000-0000-4000-8000-000000000602",
    code: "GV-602",
    name: "Gümüş Varak Barok Kasa",
    widthCm: 6.0,
    unitPricePerMeter: 220.0,
    materialType: "composite",
    category: "outer",
    layoutMode: "repeat",
    isRepeatingPattern: true,
    imageUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500&auto=format&fit=crop&q=80",
    textureUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500&auto=format&fit=crop&q=80"
  }
];

export const INITIAL_FRAME_PROFILES: FrameProfileItem[] = DEFAULT_FRAME_PROFILES;

export const SAMPLE_FRAME_PROFILES: FrameProfileItem[] = DEFAULT_FRAME_PROFILES;

export interface CostCalculationBreakdown {
  // Quantities & Dimensions
  artworkSqm: number;
  innerMatSqm: number;
  middleMatSqm: number;
  innerFrameMeter: number;
  outerFrameMeter: number;
  glassBackingSqm: number;
  backingClothSqm: number;
  kraftTapeMeter: number;
  backingPaperSqm?: number; // Legacy
  
  // Itemized Raw Costs (₺)
  artworkCost: number;
  innerMatCost: number;
  middleMatCost: number;
  innerFrameCost: number;
  outerFrameCost: number;
  glassCost: number;
  backingBoardCost: number;
  backingClothCost: number;
  kraftTapeCost: number;
  backingPaperCost?: number; // Legacy
  laborCost: number;
  wasteCost: number;

  // Itemized Customer Retail Selling Prices (₺ - Raw Cost + Waste + Profit + VAT)
  artworkSellingPrice: number;
  innerMatSellingPrice: number;
  middleMatSellingPrice: number;
  innerFrameSellingPrice: number;
  outerFrameSellingPrice: number;
  glassSellingPrice: number;
  backingBoardSellingPrice: number;
  backingClothSellingPrice: number;
  kraftTapeSellingPrice: number;
  laborSellingPrice: number;
  
  // Subtotals
  totalMaterialCost: number;
  totalDirectCost: number; // Raw cost + Labor
  profitAmount: number;
  calculatedPriceBeforeVat: number;
  vatAmount: number;
  calculatedPriceWithVat: number;
  
  // Custom Overrides / Discounts
  overridePriceWithVat: number | null;
  effectiveFinalPriceWithVat: number;

  // Delivery & Shipping
  deliveryMethod: "store" | "shipping";
  shippingCost: number;

  // Active Inclusion Flags
  flags: MaterialInclusionFlags;

  // Transparent Acrylic / Glass Mat Info
  isInnerMatTransparent?: boolean;
  isMiddleMatTransparent?: boolean;
  innerMatUnitPrice?: number;
  middleMatUnitPrice?: number;
}

export interface CutListItem {
  layerName: string; // e.g. "İç Çerçeve", "Dış Çerçeve", "İç Paspartu Penceresi"
  profileCode?: string;
  materialInfo: string;
  cutAngle: string; // e.g. "45° Gönye", "90° Düz Pencere"
  pieceWidthCm: number;
  pieceHeightCm: number;
  quantityWidthPieces: number; // 2 adet
  quantityHeightPieces: number; // 2 adet
  totalMeterNeeded: number; // Metraj
  unit?: "mt" | "m²"; // Birim: Çerçeve/Profil için "mt", Levha/Karton/Cam için "m²"
  notes: string;
  included: boolean;
}

export interface CompleteCutList {
  orderNumber: string;
  artworkDimensions: string;
  totalOuterDimensions: string;
  items: CutListItem[];
  assemblyInstructions: string[];
}

export interface PaspartuColorOption {
  name: string;
  value: string;
}

export const DEFAULT_PASPARTU_COLORS: PaspartuColorOption[] = [
  { name: "Krem / Beyaz", value: "#FAF9F5" },
  { name: "Şeffaf Cam / Akrilik", value: "transparent" },
  { name: "Mat Siyah", value: "#1A1A1A" },
  { name: "Şampanya / Vizon", value: "#E8DFCA" },
  { name: "Antrasit Gri", value: "#383838" },
  { name: "Bordo", value: "#58111A" },
  { name: "Lacivert", value: "#1B2A4A" },
  { name: "Haki Yeşil", value: "#2A3B28" },
  { name: "Altın Varak", value: "#C5A059" }
];

export interface CompanyProfile {
  companyName: string; // Kısa Firma / Atölye İsmi
  tradeTitle: string; // Resmi Ticari Ünvan
  tagline?: string; // Slogan veya alt başlık
  logoUrl: string | null; // Base64 data URL veya resim linki
  primaryColor?: string; // Kurumsal tema rengi
  taxOffice: string; // Vergi Dairesi
  taxNumber: string; // Vergi No veya TCKN
  phone: string; // Telefon
  email: string; // E-posta
  website: string; // Web Sitesi
  address: string; // Açık Adres
  city: string; // Şehir
  iban: string; // Banka / IBAN
  includeInQuotes: boolean; // Teklif ve PDF çıktılarında logo/ünvan gösterilsin mi
}

export const EMPTY_COMPANY_PROFILE: CompanyProfile = {
  companyName: "",
  tradeTitle: "",
  tagline: "",
  logoUrl: "",
  primaryColor: "#C5A059",
  taxOffice: "",
  taxNumber: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  iban: "",
  includeInQuotes: true,
};

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = EMPTY_COMPANY_PROFILE;

export type UserRole = "admin" | "sales" | "workshop";

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  title?: string;
  isEmailVerified: boolean;
  status: "active" | "pending_verification" | "suspended";
  phone?: string;
  createdAt: string;
  lastLoginAt?: string;
  verificationSentAt?: string;
}

export const DEFAULT_USERS: UserAccount[] = [];

export interface SubscriptionData {
  planId: "pay_as_you_go" | "pro_monthly" | "pro_yearly" | "unlimited_enterprise";
  planName: string;
  remainingCredits: number;
  totalCredits: number;
  renewalDate: string;
  status: "active" | "expiring_soon" | "exhausted";
  autoRenew: boolean;
  maxUsers: number; // 3 for pay_as_you_go (kredili), 6 for pro_monthly & pro_yearly (aylık/yıllık abonelik)
  isMonthlySubscription: boolean;
}

export function isProPlan(sub?: SubscriptionData | null): boolean {
  if (!sub) return false;
  return sub.planId === "pro_monthly" || sub.planId === "pro_yearly" || sub.planId === "unlimited_enterprise" || Boolean(sub.isMonthlySubscription);
}

export const DEFAULT_SUBSCRIPTION: SubscriptionData = {
  planId: "pay_as_you_go",
  planName: "Kullandıkça Öde (Kredili Hesap)",
  remainingCredits: 35,
  totalCredits: 50,
  renewalDate: "Dönemsiz (Kredi Bakiyesi)",
  status: "active",
  autoRenew: false,
  maxUsers: 3,
  isMonthlySubscription: false
};

export type OrderStatus = "quote" | "approved" | "production" | "delivered";

export interface OrderArchiveItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryDate?: string;
  artworkWidthCm: number;
  artworkHeightCm: number;
  innerFrameTitle: string;
  outerFrameTitle: string;
  matInfo: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  deliveryMethod: "store" | "shipping";
  authorUser?: string;

  // Genişletilmiş Simülatör Konfigürasyonu (Düzenleme ve Simülatöre Aktarma için)
  innerProfileId?: string;
  outerProfileId?: string;
  matWidthCm?: number;
  frameWidthCm?: number;
  middleMatWidthCm?: number;
  outerFrameWidthCm?: number;
  innerMatColor?: string;
  outerMatColor?: string;
  customPaintingUrl?: string | null;
  customPaintingFile?: string;
  inclusionFlags?: MaterialInclusionFlags;
  customOverridePrice?: number | null;
  simulatorConfig?: Record<string, any>;
}

export const DEFAULT_ARCHIVE_ORDERS: OrderArchiveItem[] = [];



