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
  includeLaborCost: false,
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

export const INITIAL_FRAME_PROFILES: FrameProfileItem[] = [
  {
    id: "prof_1",
    name: "Altın Varak Klasik Oymalı",
    code: "AV-501",
    imageUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop",
    widthCm: 5.0,
    unitPricePerMeter: 180,
    materialType: "wood",
    category: "both",
    isRepeatingPattern: true
  },
  {
    id: "prof_2",
    name: "Siyah Mat Modern Profil",
    code: "SM-302",
    imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300&auto=format&fit=crop",
    widthCm: 3.5,
    unitPricePerMeter: 110,
    materialType: "polystyrene",
    category: "both",
    isRepeatingPattern: true
  },
  {
    id: "prof_3",
    name: "Ceviz Ağacı Rustik Çerçeve",
    code: "CR-405",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=300&auto=format&fit=crop",
    widthCm: 4.5,
    unitPricePerMeter: 220,
    materialType: "wood",
    category: "both",
    isRepeatingPattern: true
  },
  {
    id: "prof_4",
    name: "Beyaz Lamine Minimalist",
    code: "BL-201",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=300&auto=format&fit=crop",
    widthCm: 3.0,
    unitPricePerMeter: 95,
    materialType: "polystyrene",
    category: "inner",
    isRepeatingPattern: true
  },
  {
    id: "prof_5",
    name: "Gümüş Varak Barok Lüks",
    code: "GV-602",
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300&auto=format&fit=crop",
    widthCm: 6.0,
    unitPricePerMeter: 260,
    materialType: "wood",
    category: "outer",
    isRepeatingPattern: true
  }
];

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
  companyName: string; // Kısa Firma / Atölye İsmi (örn: Vizyon Art Studio)
  tradeTitle: string; // Resmi Ticari Ünvan (örn: Vizyon Sanat Çerçeve Tasarım Ltd. Şti.)
  tagline?: string; // Slogan veya alt başlık
  logoUrl: string | null; // Base64 data URL veya resim linki
  primaryColor?: string; // Kurumsal tema rengi
  taxOffice: string; // Vergi Dairesi (örn: Beşiktaş V.D.)
  taxNumber: string; // Vergi No veya TCKN
  phone: string; // Telefon (örn: 0212 555 01 23)
  email: string; // E-posta (örn: info@vizyonart.com)
  website: string; // Web Sitesi (örn: www.vizyonart.com)
  address: string; // Açık Adres
  city: string; // Şehir (örn: İstanbul)
  iban: string; // Banka / IBAN
  includeInQuotes: boolean; // Teklif ve PDF çıktılarında logo/ünvan gösterilsin mi
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: "Vizyon Art Studio",
  tradeTitle: "Vizyon Sanat & Özel Çerçeve Atölyesi Ltd. Şti.",
  logoUrl: "",
  taxOffice: "Beyoğlu V.D.",
  taxNumber: "8920451234",
  phone: "0212 245 88 90",
  email: "info@vizyonartstudio.com",
  website: "www.vizyonartstudio.com",
  address: "Tomtom Mah. İstiklal Cad. Sanatçılar Pasajı No:16/B Beyoğlu",
  city: "İstanbul",
  iban: "TR45 0006 2000 1234 5678 9012 34",
  includeInQuotes: true,
};

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

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr_1",
    fullName: "Sarı Şen (Yönetici)",
    username: "sarisen",
    email: "sarisen@gmail.com",
    role: "admin",
    isEmailVerified: true,
    status: "active",
    phone: "0532 123 45 67",
    createdAt: "2026-01-10",
    lastLoginAt: "Şimdi (Aktif Oturum)"
  },
  {
    id: "usr_2",
    fullName: "Ahmet Yılmaz",
    username: "ahmet.satis",
    email: "ahmet@vizyonartstudio.com",
    role: "sales",
    isEmailVerified: true,
    status: "active",
    phone: "0533 987 65 43",
    createdAt: "2026-02-15",
    lastLoginAt: "Dün 17:45"
  },
  {
    id: "usr_3",
    fullName: "Mehmet Usta",
    username: "mehmet.atolye",
    email: "mehmet.usta@vizyonartstudio.com",
    role: "workshop",
    isEmailVerified: false,
    status: "pending_verification",
    phone: "0542 321 00 11",
    createdAt: "2026-03-01",
    verificationSentAt: "1 saat önce"
  }
];

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
}

export const DEFAULT_ARCHIVE_ORDERS: OrderArchiveItem[] = [
  {
    id: "ord_101",
    orderNumber: "NK-2026-84192",
    createdAt: "12.09.2026 11:20",
    customerName: "Ahmet Çerçeve & Galeri",
    customerPhone: "0532 555 12 34",
    deliveryDate: "15.09.2026",
    artworkWidthCm: 50,
    artworkHeightCm: 70,
    innerFrameTitle: "Altın Varak Klasik Oymalı (5.0 cm)",
    outerFrameTitle: "Yok",
    matInfo: "5.0 cm Krem / Beyaz Paspartu",
    totalAmount: 2450,
    currency: "₺",
    status: "approved",
    deliveryMethod: "store",
    authorUser: "Sarı Şen (Yönetici)"
  },
  {
    id: "ord_102",
    orderNumber: "NK-2026-73620",
    createdAt: "11.09.2026 16:45",
    customerName: "Mimar Selin Korkmaz",
    customerPhone: "0544 333 44 55",
    deliveryDate: "18.09.2026",
    artworkWidthCm: 80,
    artworkHeightCm: 120,
    innerFrameTitle: "Siyah Mat Modern Profil (3.5 cm)",
    outerFrameTitle: "Gümüş Varak Barok Lüks (6.0 cm)",
    matInfo: "6.0 cm Mat Siyah + Şeffaf Cam Paspartu",
    totalAmount: 6850,
    currency: "₺",
    status: "production",
    deliveryMethod: "shipping",
    authorUser: "Ahmet Yılmaz"
  },
  {
    id: "ord_103",
    orderNumber: "NK-2026-62180",
    createdAt: "10.09.2026 09:15",
    customerName: "Artisan Lounge Cafe & Bar",
    customerPhone: "0212 290 80 70",
    deliveryDate: "12.09.2026",
    artworkWidthCm: 40,
    artworkHeightCm: 60,
    innerFrameTitle: "Ceviz Ağacı Rustik Çerçeve (4.5 cm)",
    outerFrameTitle: "Yok",
    matInfo: "4.0 cm Şampanya / Vizon Paspartu",
    totalAmount: 1820,
    currency: "₺",
    status: "delivered",
    deliveryMethod: "store",
    authorUser: "Sarı Şen (Yönetici)"
  },
  {
    id: "ord_104",
    orderNumber: "NK-2026-51904",
    createdAt: "09.09.2026 14:05",
    customerName: "Av. Murat Eren",
    customerPhone: "0533 111 22 33",
    deliveryDate: "14.09.2026",
    artworkWidthCm: 60,
    artworkHeightCm: 90,
    innerFrameTitle: "Beyaz Lamine Minimalist (3.0 cm)",
    outerFrameTitle: "Yok",
    matInfo: "5.0 cm Krem / Beyaz Paspartu",
    totalAmount: 3100,
    currency: "₺",
    status: "quote",
    deliveryMethod: "shipping",
    authorUser: "Ahmet Yılmaz"
  }
];


