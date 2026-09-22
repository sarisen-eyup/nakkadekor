/**
 * Multi-tenant B2B SaaS Veritabanı Şeması & TypeScript Tipleri
 * Çerçeve Atölyeleri, Camcılar ve Sanat Galerileri için Çerçeveleme & Görselleştirme Simülatörü
 *
 * Veritabanı: PostgreSQL 15+ / Supabase
 * Çok Kiracılı Güvenlik: Row Level Security (RLS) ile 'tenant_id' bazlı kesin izolasyon
 */

// ============================================================================
// 1. TEMEL ENUM & LİTERAL TİPLERİ
// ============================================================================

export type UserRole = "owner" | "admin" | "sales" | "workshop" | "viewer";
export type UserStatus = "active" | "invited" | "pending_verification" | "suspended";

export type FrameMaterialType = "wood" | "polystyrene" | "aluminum" | "composite";
export type FrameCategory = "inner" | "outer" | "both";
export type FrameLayoutMode = "miter-stretch" | "repeat";

export type MaterialType =
  | "matboard"           // Paspartu kartonu
  | "middle_matboard"    // Ara / 3D derinlik mukavvası
  | "acrylic_matboard"   // Şeffaf akrilik / cam paspartu
  | "glass"              // Standart / Müze camı
  | "acrylic_glass"      // Pleksi / Antirefle akrilik
  | "backing_mdf"        // MDF arkalık plakası
  | "backing_cloth"      // Arka kapama bezi
  | "kraft_tape"         // Islak kraft bitiş bandı
  | "canvas_print"       // Tuval / Kanvas baskı
  | "hardware";          // Askı aparatı, köşe gönye teli, vida

export type PricingUnit = "sqm" | "linear_meter" | "piece";

export type CustomerType = "retail" | "designer" | "gallery" | "corporate";

export type OrderType = "quote" | "order";

export type OrderStatus =
  | "draft"                 // Taslak
  | "quote"                 // Teklif aşamasında (Frontend OrderArchiveItem uyumlu)
  | "quote_sent"           // Teklif müşteriye iletildi
  | "approved"             // Müşteri onayladı / siparişe dönüştü
  | "in_production"        // Atölyede üretimde
  | "production"           // Üretim aşamasında (Frontend OrderArchiveItem uyumlu)
  | "cutting_completed"    // Kesim tamamlandı
  | "assembly_completed"   // Montaj ve birleşim tamamlandı
  | "ready_for_delivery"   // Teslime hazır
  | "delivered"            // Teslim edildi
  | "cancelled";           // İptal edildi

export type DeliveryMethod = "store" | "shipping" | "special_delivery";
export type PaymentStatus = "unpaid" | "deposit_received" | "fully_paid" | "refunded";

export type WorkOrderStatus =
  | "queued"        // Kesim kuyruğunda
  | "cutting"       // 45° gönye / cam kesiliyor
  | "joining"       // Köşe çakma / birleştirme
  | "mounting"      // Eser ve paspartu montajı
  | "qc_passed"     // Kalite kontrol onaylandı
  | "ready"         // Atölye işi bitti
  | "completed";    // Arşivlendi

// ============================================================================
// 2. VERİTABANI TABLO MODELLERİ (DATABASE ROW ENTITIES)
// ============================================================================

/**
 * Kiracı (Firma / Atölye / Camcı / Galeri)
 */
export interface Tenant {
  id: string; // UUID primary key
  name: string; // Kısa Firma Adı (örn: Vizyon Art Studio)
  slug: string; // Benzersiz URL takısı (örn: vizyon-art)
  trade_title: string | null; // Resmi Ticari Ünvan
  tagline: string | null; // Slogan veya alt başlık
  tax_office: string | null; // Vergi Dairesi
  tax_number: string | null; // Vergi No veya TCKN
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  iban: string | null;
  logo_url: string | null;
  primary_color: string; // Hex kodu (örn: #C5A059)
  currency: string; // TRY, USD, EUR
  subscription_tier: "free_trial" | "pay_as_you_go" | "pro_monthly" | "pro_yearly" | "enterprise";
  subscription_status: "trialing" | "active" | "past_due" | "canceled";
  subscription_plan_id: "pay_as_you_go" | "pro_monthly" | "pro_yearly" | "unlimited_enterprise";
  remaining_credits: number;
  total_credits: number;
  renewal_date: string | null;
  auto_renew: boolean;
  max_users: number;
  created_at: string; // ISO 8601 UTC
  updated_at: string;
}

/**
 * Kiracı Kullanıcısı (Atölye Yöneticisi, Satış Elemanı, Usta)
 */
export interface TenantUser {
  id: string; // UUID primary key
  auth_user_id: string; // Supabase auth.users(id) referansı
  tenant_id: string; // Foreign Key -> tenants.id
  full_name: string;
  username: string; // Benzersiz kullanıcı rumuzu (örn: sarisen)
  email: string;
  role: UserRole;
  title: string | null; // Görev (örn: "Baş Çerçeve Ustası")
  phone: string | null;
  status: UserStatus;
  is_email_verified: boolean;
  last_login_at: string | null;
  verification_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Atölye Fiyatlandırma, Fire (Wastage) & Birim Fiyat Ayarları
 */
export interface TenantSettings {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id (Unique)
  
  // Fire Oranları (Atık katsayıları %)
  default_waste_percentage: number; // Genel varsayılan fire % (örn: 15.0)
  frame_waste_percentage: number; // Çerçeve 45° gönye kesim firesi % (örn: 15.0)
  mat_waste_percentage: number; // Paspartu karton firesi % (örn: 10.0)
  glass_waste_percentage: number; // Cam kesim firesi % (örn: 12.0)
  backing_waste_percentage: number; // MDF / Arkalık firesi % (örn: 10.0)
  
  // Kâr ve Vergi (%)
  target_profit_margin_percent: number; // Hedef Kâr Marjı % (örn: 40.0)
  vat_rate_percent: number; // KDV Oranı % (örn: 20.0)
  
  // Sabit İşçilik ve Gönderim (₺)
  default_labor_fixed_cost: number; // Sabit işçilik bedeli ₺ (örn: 250.00)
  default_shipping_cost: number; // Kargo ücreti ₺ (örn: 150.00)
  include_in_quotes: boolean; // Teklif çıktısında firma bilgileri ve logo yer alsın mı?

  // Hammadde Birim Fiyatları (Doğrudan Atölye Alış Fiyatları)
  canvas_print_price_per_sqm: number; // ₺/m² (örn: 450.00)
  mat_board_price_per_sqm: number; // ₺/m² (örn: 280.00)
  middle_mat_board_price_per_sqm: number; // ₺/m² (örn: 350.00)
  transparent_mat_board_price_per_sqm: number; // ₺/m² (örn: 520.00)
  glass_price_per_sqm: number; // ₺/m² (örn: 320.00)
  backing_board_price_per_sqm: number; // ₺/m² (örn: 180.00)
  backing_cloth_price_per_sqm: number; // ₺/m² (örn: 90.00)
  kraft_tape_price_per_meter: number; // ₺/m (örn: 20.00)
  default_inner_frame_price_per_meter: number; // ₺/m (örn: 120.00)
  default_outer_frame_price_per_meter: number; // ₺/m (örn: 180.00)

  // Atölye Güvenlik PIN Kodu (Müşteri gizlilik modu için)
  shop_pin_code: string; // Varsayılan: "1234"

  // Varsayılan Malzeme Katılım Bayrakları (JSON)
  default_inclusion_flags: Record<string, boolean>;
  
  created_at: string;
  updated_at: string;
}

/**
 * Çerçeve Çıta Profili
 */
export interface FrameProfile {
  id: string; // UUID
  tenant_id: string; // Foreign Key -> tenants.id
  code: string; // Stok / Profil Kodu (örn: "AV-501")
  name: string; // Profil Adı (örn: "Altın Varak Klasik Oymalı")
  width_cm: number; // Çıta Görünür Genişliği cm (örn: 5.0)
  depth_cm: number; // Çıta Dış Derinliği cm (örn: 3.5)
  rabbet_depth_cm: number; // Lamba / Yuva derinliği cm (örn: 1.2)
  rabbet_depth?: number | null; // Bini Payı mm (numeric) - Supabase frame_profiles.rabbet_depth
  unit_cost_per_meter: number; // Alış Maliyeti (₺ / metre)
  unit_price_per_meter: number; // Satış Birim Fiyatı (₺ / metre)
  material_type: FrameMaterialType;
  category: FrameCategory;
  image_url: string | null; // Katalog küçük görseli
  texture_url: string | null; // 3D / Köşe birleşim dokusu
  is_repeating_pattern: boolean; // Tekrarlayan desen mi
  layout_mode: FrameLayoutMode; // miter-stretch (gönye esnetme) veya repeat
  custom_waste_percentage: number | null; // Bu çıtaya özel fire oranı (null ise tenant_settings kullanılır)
  stock_meters: number; // Mevcut metre stoğu
  is_active: boolean; // Satışta / Katalogda aktif mi
  created_at: string;
  updated_at: string;
}

/**
 * Paspartu, Cam, Arkalık ve Yardımcı Malzemeler
 */
export interface Material {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id
  code: string; // Malzeme Kodu (örn: "PAS-KREM-101", "CAM-ANTI-2MM")
  name: string; // Malzeme Adı (örn: "Asitsiz Krem Paspartu Kartonu 1.5mm")
  material_type: MaterialType;
  pricing_unit: PricingUnit; // 'sqm', 'linear_meter', 'piece'
  unit_cost: number; // Alış Maliyeti
  unit_price: number; // Satış Fiyatı
  waste_percentage: number; // Bu malzemeye özel fire %
  color_hex: string | null; // Paspartu kartonu hex kodu
  thickness_mm: number | null; // Kalınlık mm (örn: 1.5, 2.0, 3.0)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Müşteri (B2C Perakende veya B2B Galeri/İç Mimar)
 */
export interface Customer {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id
  name: string; // Müşteri veya İrtibat Kişisi Adı
  company_name: string | null; // Kurumsal ise Şirket Adı
  phone: string | null;
  email: string | null;
  tax_office: string | null;
  tax_number: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  customer_type: CustomerType;
  created_at: string;
  updated_at: string;
}

/**
 * Oda Şablonu (Showroom / Yaşam Alanı Arka Planları)
 */
export interface RoomTemplateRow {
  id: string; // UUID
  tenant_id: string | null; // NULL ise global sistem şablonu, UUID ise atölyeye özel
  slug: string; // Örn: 'modern-sofa'
  name: string; // Örn: 'Modern Salon & Gri Koltuk'
  description: string | null;
  image_url: string;
  wall_area_ratio: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Simülatör Görselleştirmesi (Müşteriye Sunulan Tasarım)
 */
export interface Visualization {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id
  created_by_user_id: string | null; // Foreign Key -> users.id
  artwork_url: string; // Müşterinin yüklediği orijinal resim URL'si
  artwork_name: string | null;
  artwork_width_cm: number;
  artwork_height_cm: number;
  inner_frame_profile_id: string | null; // Foreign Key -> frame_profiles.id
  outer_frame_profile_id: string | null; // Foreign Key -> frame_profiles.id
  frame_width_cm: number; // İç çerçeve genişliği
  outer_frame_width_cm: number; // Dış kasa çerçeve genişliği
  frame_layout_mode: FrameLayoutMode; // miter-stretch veya repeat
  outer_frame_layout_mode: FrameLayoutMode;
  custom_frame_url: string | null; // Atölyenin yüklediği özel profil dokusu
  custom_outer_frame_url: string | null;
  inner_mat_material_id: string | null; // Foreign Key -> materials.id
  middle_mat_material_id: string | null; // Foreign Key -> materials.id
  mat_width_cm: number;
  middle_mat_width_cm: number;
  inner_mat_color: string;
  outer_mat_color: string;
  wall_mode: "color" | "room";
  wall_color: string;
  room_template_id: string | null;
  room_bg_url: string | null;
  room_scale: number;
  room_frame_pos_x: number;
  room_frame_pos_y: number;
  room_brightness: number; // % (100 = normal)
  room_shadow_intensity: number; // 0-2 (1 = normal)
  room_bg_fit: "cover" | "contain";
  room_bg_scale: number;
  room_bg_pos_x: number;
  room_bg_pos_y: number;
  lighting_style: string;
  rendered_preview_url: string | null; // Simülatörden üretilen mockup görseli
  created_at: string;
  updated_at: string;
}

/**
 * Teklif & Sipariş Ana Tablosu
 */
export interface QuoteOrder {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id
  order_number: string; // Örn: "NK-2026-84192" (tenant içinde benzersiz)
  customer_id: string | null; // Foreign Key -> customers.id
  customer_name: string | null; // Hızlı arama ve müşteri kaydı olmadan da sipariş alabilme
  customer_phone: string | null;
  created_by_user_id: string | null; // Foreign Key -> users.id
  author_user_name: string | null; // Siparişi oluşturan personel
  type: OrderType; // 'quote' (teklif) veya 'order' (kesinleşmiş sipariş)
  status: OrderStatus;
  currency: string; // TRY, USD, EUR
  
  // Özet Bilgiler (Hızlı Arşiv Görünümü İçin)
  artwork_width_cm: number | null;
  artwork_height_cm: number | null;
  inner_frame_title: string | null;
  outer_frame_title: string | null;
  mat_info: string | null;

  // Maliyet Analiz Rakamları
  raw_material_cost: number; // Net hammadde maliyeti (firesiz)
  waste_cost: number; // Hesaplanan fire bedeli
  labor_cost: number; // Atölye işçilik bedeli
  total_cost: number; // Atölye Net Maliyeti (Hammadde + Fire + İşçilik)
  profit_amount: number; // Elde edilen kâr tutarı
  
  // Satış ve Vergi Rakamları
  subtotal: number; // KDV Hariç Satış Tutarı
  vat_rate_percent: number; // KDV Oranı %
  vat_amount: number; // KDV Tutarı
  discount_amount: number; // Varsa iskonto
  shipping_cost: number; // Kargo / Nakliye ücreti
  grand_total: number; // Müşterinin Ödeyeceği Genel Toplam (KDV Dahil)
  
  // Operasyon & Lojistik
  delivery_method: DeliveryMethod;
  delivery_date: string | null; // YYYY-MM-DD
  delivery_date_str: string | null; // "15.09.2026" veya esnek metin
  payment_status: PaymentStatus;
  deposit_amount: number; // Alınan kapora tutarı
  notes: string | null; // Sipariş/Atölye notları
  valid_until: string | null; // Teklif geçerlilik tarihi (YYYY-MM-DD)

  // Anlık Kesim & Maliyet Snapshot Verileri (JSON)
  cut_list: Record<string, unknown> | null;
  cost_breakdown: Record<string, unknown> | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Sipariş Kalemleri (Çerçevelenen Eserler / Tablolar)
 */
export interface OrderItem {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id
  order_id: string; // Foreign Key -> quotes_orders.id (CASCADE)
  item_index: number;
  title: string; // Eser Tanımı (örn: "Yağlıboya Peyzaj Tablosu")
  quantity: number; // Adet
  
  // Boyutlar (cm)
  artwork_width_cm: number;
  artwork_height_cm: number;
  final_outer_width_cm: number;
  final_outer_height_cm: number;
  
  // Seçilen Malzeme Referansları
  inner_frame_profile_id: string | null; // Foreign Key -> frame_profiles.id
  outer_frame_profile_id: string | null; // Foreign Key -> frame_profiles.id
  inner_mat_material_id: string | null; // Foreign Key -> materials.id
  mat_width_cm: number;
  middle_mat_material_id: string | null; // Foreign Key -> materials.id
  middle_mat_width_cm: number;
  glass_material_id: string | null; // Foreign Key -> materials.id
  backing_material_id: string | null; // Foreign Key -> materials.id
  visualization_id: string | null; // Foreign Key -> visualizations.id
  
  // Detaylı Hesaplama Dökümü (JSON Snapshot)
  cost_breakdown: ItemCostBreakdownSnapshot;
  
  unit_price: number; // Kalem Birim Satış Fiyatı (KDV hariç)
  line_total: number; // quantity * unit_price
  
  created_at: string;
  updated_at: string;
}

/**
 * Atölye İş Emri ve 45° Gönye Kesim Listesi (Work Order / Cutting List)
 */
export interface WorkOrder {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id
  order_id: string; // Foreign Key -> quotes_orders.id (CASCADE)
  order_item_id: string; // Foreign Key -> order_items.id (CASCADE)
  work_order_code: string; // Örn: "WO-2026-84192-1"
  assigned_to_user_id: string | null; // Foreign Key -> users.id (Atölye ustası)
  status: WorkOrderStatus;
  
  // Atölye Kesim Verisi (45° gönye, cam, paspartu, arkalık ölçüleri)
  cutting_data: WorkOrderCuttingData;
  
  assembly_notes: string | null;
  qr_code_data: string | null; // Etiket barkodu / QR URL'si
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Güvenlik ve Denetim Günlüğü (Audit Log)
 */
export interface AuditLog {
  id: string;
  tenant_id: string; // Foreign Key -> tenants.id
  user_id: string | null; // Foreign Key -> users.id
  action: string; // Örn: "order.created", "quote.approved", "frame.price_updated"
  entity_type: string; // "order", "customer", "frame_profile", "settings"
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ============================================================================
// 3. ATÖLYE HESAPLAMA, FİRE & KESİM TİPLERİ (COMPUTATION & CUTTING SPECS)
// ============================================================================

/**
 * Bir Sipariş Kalemi İçin Saklanan Anlık Maliyet ve Fire Dökümü
 */
export interface ItemCostBreakdownSnapshot {
  // Metraj & Alanlar
  artworkAreaSqm: number;
  finalOuterAreaSqm: number;
  innerFrameMeters: number;
  outerFrameMeters: number;
  glassAreaSqm: number;
  matAreaSqm: number;
  backingAreaSqm: number;

  // Fire (Wastage) Katsayıları & Maliyetleri
  frameWastePercent: number;
  matWastePercent: number;
  glassWastePercent: number;
  backingWastePercent: number;
  
  rawFrameCost: number;
  wasteFrameCost: number;
  rawMatCost: number;
  wasteMatCost: number;
  rawGlassCost: number;
  wasteGlassCost: number;
  rawBackingCost: number;
  wasteBackingCost: number;
  
  totalRawCost: number;
  totalWasteCost: number;
  laborCost: number;
  totalItemCost: number; // Maliyet = Hammadde + Fire + İşçilik
  profitMarginPercent: number;
  profitAmount: number;
  finalItemPrice: number; // Satış fiyatı
}

/**
 * 45° Gönye Çerçeve Kesim Çıta Parçası
 */
export interface MitredCutPiece {
  position: "top" | "bottom" | "left" | "right";
  orientation: "horizontal" | "vertical";
  innerLengthCm: number; // Eserin / paspartunun oturduğu iç lamba ölçüsü
  outerLengthCm: number; // Dıştan dışa 45° gönye kesim uzunluğu
  angleDegrees: 45;
}

/**
 * Atölye İş Emri İçin Kesim Talimatları Paketi
 */
export interface WorkOrderCuttingData {
  orderNumber: string;
  customerName: string;
  
  // İç Çerçeve Kesimi
  innerFrame?: {
    profileCode: string;
    profileName: string;
    profileWidthCm: number;
    totalRequiredLengthCm: number; // 4 parça + testere payı
    pieces: MitredCutPiece[];
  };

  // Varsa Dış Kasa Çerçeve Kesimi
  outerFrame?: {
    profileCode: string;
    profileName: string;
    profileWidthCm: number;
    totalRequiredLengthCm: number;
    pieces: MitredCutPiece[];
  };

  // Cam / Pleksi Kesim Ölçüsü
  glassCut?: {
    materialName: string;
    widthCm: number;
    heightCm: number;
    areaSqm: number;
  };

  // Paspartu Kartonu Pencere & Dış Kesimi
  matCut?: {
    materialName: string;
    outerWidthCm: number;
    outerHeightCm: number;
    windowWidthCm: number;
    windowHeightCm: number;
    matBorderCm: number;
    bevelAngle: "45_degree_reverse";
  };

  // MDF / Mukavva Arkalık Kesimi
  backingCut?: {
    materialName: string;
    widthCm: number;
    heightCm: number;
  };

  assemblyChecklist: string[];
}

// ============================================================================
// 4. SUPABASE DATABASE GENERIC TYPE MAPPING (SUPABASE-JS İLE %100 UYUMLU)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Tenant>;
      };
      users: {
        Row: TenantUser;
        Insert: Omit<TenantUser, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TenantUser>;
      };
      tenant_settings: {
        Row: TenantSettings;
        Insert: Omit<TenantSettings, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TenantSettings>;
      };
      frame_profiles: {
        Row: FrameProfile;
        Insert: Omit<FrameProfile, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<FrameProfile>;
      };
      materials: {
        Row: Material;
        Insert: Omit<Material, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Material>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Customer>;
      };
      room_templates: {
        Row: RoomTemplateRow;
        Insert: Omit<RoomTemplateRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<RoomTemplateRow>;
      };
      visualizations: {
        Row: Visualization;
        Insert: Omit<Visualization, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Visualization>;
      };
      quotes_orders: {
        Row: QuoteOrder;
        Insert: Omit<QuoteOrder, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<QuoteOrder>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<OrderItem>;
      };
      work_orders: {
        Row: WorkOrder;
        Insert: Omit<WorkOrder, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WorkOrder>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AuditLog>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_tenant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      current_user_has_role: {
        Args: { required_roles: string[] };
        Returns: boolean;
      };
    };
  };
}
