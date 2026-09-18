import { supabase, isSupabaseConfigured, getTenantId, setAuthenticatedTenantId } from "../lib/supabase";
export { isSupabaseConfigured };
import { 
  FrameProfileItem, 
  DEFAULT_FRAME_PROFILES,
  OrderArchiveItem, 
  OrderStatus, 
  UnitPricesSettings,
  CompanyProfile,
  EMPTY_COMPANY_PROFILE,
  sanitizeUnitPricesSettings,
  isUUID
} from "../types/pricing";
import { compressImage } from "../utils/imageCompressor";

/**
 * PostgREST veya PostgreSQL'in henüz tablo oluşturulmamış / şema önbelleğinde bulunamadı hatalarını tespit eder.
 */
export function isSchemaMissingError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("relation") && msg.includes("does not exist") ||
    msg.includes("does not exist")
  );
}

/**
 * Giriş yapmış kullanıcının Supabase Auth UID bilgisini (auth.uid) tespit eder,
 * yoksa localStorage veya yapılandırılmış varsayılan tenantId'ye geri döner.
 */
export async function getAuthUserIdOrTenantId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      setAuthenticatedTenantId(session.user.id);
      return session.user.id;
    }
  } catch (err) {
    console.warn("Auth session alınamadı, getTenantId kullanılacak:", err);
  }
  return getTenantId();
}

/**
 * Görseli Supabase Storage ('uploads', 'visualizations', 'artworks', 'profiles', 'logos' bucket) üzerine yükler ve public URL döner.
 * Asla Base64 metnini veritabanına kaydetmez; yüklemeden önce sıkıştırarak sadece kısa public URL'i döner.
 */
export async function uploadImageToSupabaseStorage(
  fileOrBlobOrDataUrl: Blob | File | string,
  folder: string = "artworks",
  fileName?: string
): Promise<{ publicUrl: string | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { publicUrl: null, error: new Error("Supabase henüz yapılandırılmamış") };
  }

  try {
    // 1. Tarayıcı tarafında maksimum 1920px genişliğe ve %80 kaliteye sıkıştır
    const compressed = await compressImage(fileOrBlobOrDataUrl, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.80,
      mimeType: "image/jpeg"
    });

    const tenantId = await getAuthUserIdOrTenantId();
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanFileName = fileName 
      ? fileName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) + `_${timestamp}.jpg`
      : `${timestamp}_${randomSuffix}.jpg`;
    
    const filePath = `${tenantId}/${folder}/${cleanFileName}`;

    // Öncelikle klasör adıyla eşleşen bucket'ı dene, ardından genel kovalara bak
    const candidateBuckets = Array.from(new Set([folder, "uploads", "visualizations", "artworks", "profiles", "logos"]));
    let lastError: any = null;

    for (const bucket of candidateBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, compressed.blob, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
            upsert: true
          });

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            console.log(`[Storage] Başarıyla yüklendi: ${bucket}/${filePath} -> ${urlData.publicUrl}`);
            return { publicUrl: urlData.publicUrl, error: null };
          }
        }
        lastError = error;
      } catch (uploadErr) {
        lastError = uploadErr;
      }
    }

    console.warn("Supabase Storage yükleme uyarısı:", lastError);
    return { publicUrl: null, error: lastError };
  } catch (err) {
    console.warn("Supabase Storage yükleme istisnası:", err);
    return { publicUrl: null, error: err };
  }
}

// Test connection to Supabase
export async function testSupabaseConnection(): Promise<{ 
  success: boolean; 
  message: string;
  isSchemaMissing?: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Supabase bağlantı bilgileri (.env) bulunamadı. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlanmalıdır."
    };
  }

  try {
    const { data, error } = await supabase
      .from("frame_profiles")
      .select("id")
      .limit(1);

    if (error) {
      if (isSchemaMissingError(error)) {
        return {
          success: true,
          isSchemaMissing: true,
          message: "Supabase projenize başarıyla bağlanıldı! Ancak 'frame_profiles' tablosu henüz oluşturulmamış. Lütfen 'src/db/schema.sql' dosyasını Supabase SQL Editor'de çalıştırın."
        };
      }
      console.warn("Supabase connection check warning:", error);
      return {
        success: false,
        message: `Supabase bağlantı hatası: ${error.message}`
      };
    }

    return {
      success: true,
      message: "Supabase veritabanına ve tablolara başarıyla bağlanıldı."
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Bağlantı hatası: ${err?.message || "Bilinmeyen hata"}`
    };
  }
}

// ==========================================
// FRAME PROFILES CRUD (Çerçeve Profilleri)
// ==========================================

/**
 * Veritabanında tenant (atölye) kaydının varlığını garantiler (Foreign key kısıtları için).
 */
export async function ensureTenantRecord(tenantId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !isUUID(tenantId)) return false;
  try {
    const { error } = await supabase.from("tenants").upsert({
      id: tenantId,
      name: "Atölye",
      slug: `tenant-${tenantId.slice(0, 8)}`,
      status: "active"
    }, { onConflict: "id" });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Bir çerçeve profilinin veritabanında (frame_profiles) var olduğundan emin olur.
 * Yabancı anahtar (Foreign Key) veya 409 Conflict hatalarını önlemek için:
 * Profil mevcut değilse otomatik olarak o tenant için ekler ve geçerli UUID'sini döner.
 */
export async function ensureFrameProfileExistsInDb(
  profileId: string | null | undefined,
  targetTenantId?: string
): Promise<string | null> {
  if (!profileId || !isSupabaseConfigured()) return null;

  const tenantId = targetTenantId || await getAuthUserIdOrTenantId();

  // 1. Veritabanında bu ID ile profil var mı kontrol et
  if (isUUID(profileId)) {
    try {
      const { data } = await supabase
        .from("frame_profiles")
        .select("id")
        .eq("id", profileId)
        .maybeSingle();

      if (data?.id) return data.id;
    } catch {
      // devam et
    }
  }

  // 2. Tabloda yoksa, DEFAULT_FRAME_PROFILES içinden eşleşeni bul ve tenant için upsert et
  const match = DEFAULT_FRAME_PROFILES.find(p => p.id === profileId || p.code === profileId);
  if (match) {
    try {
      await ensureTenantRecord(tenantId);
      const { data, error } = await supabase
        .from("frame_profiles")
        .upsert({
          tenant_id: tenantId,
          code: match.code,
          name: match.name,
          material_type: match.materialType || "wood",
          width_cm: Number(match.widthCm || 4),
          unit_price_per_meter: Number(match.unitPricePerMeter || 120),
          unit_cost_per_meter: 60,
          image_url: match.imageUrl || "",
          texture_url: match.textureUrl || match.imageUrl || "",
          is_repeating_pattern: match.isRepeatingPattern ?? true,
          layout_mode: match.layoutMode || "repeat",
          category: match.category || "both",
          is_active: true,
          in_stock: true
        }, { onConflict: "tenant_id,code" })
        .select("id")
        .single();

      if (!error && data?.id) {
        return data.id;
      }
    } catch (err) {
      console.warn("[ensureFrameProfileExistsInDb] Profil upsert uyarısı:", err);
    }
  }

  return null;
}

/**
 * frame_profiles tablosu boş olduğunda varsayılan çerçeve profillerini veritabanına otomatik ekler/upsert eder.
 * 409 Conflict hatasını önlemek için tenant_id + code çatışma kontrolü kullanır.
 */
export async function seedDefaultFrameProfiles(tenantId: string): Promise<FrameProfileItem[]> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_FRAME_PROFILES;
  }

  try {
    await ensureTenantRecord(tenantId);

    const rows = DEFAULT_FRAME_PROFILES.map((prof) => ({
      tenant_id: tenantId,
      code: prof.code,
      name: prof.name,
      material_type: prof.materialType || "wood",
      width_cm: Number(prof.widthCm || 4),
      unit_price_per_meter: Number(prof.unitPricePerMeter || 120),
      unit_cost_per_meter: 60,
      image_url: prof.imageUrl || "",
      texture_url: prof.textureUrl || prof.imageUrl || "",
      is_repeating_pattern: prof.isRepeatingPattern ?? true,
      layout_mode: prof.layoutMode || "repeat",
      category: prof.category || "both",
      is_active: prof.inStock ?? true,
      in_stock: prof.inStock ?? true
    }));

    // Toplu upsert: onConflict "tenant_id,code" (409 Conflict ve Primary Key çakışmasını kesinlikle önler)
    const { data, error } = await supabase
      .from("frame_profiles")
      .upsert(rows, { onConflict: "tenant_id,code" })
      .select();

    if (!error && data && data.length > 0) {
      console.log(`[Supabase] ${data.length} adet varsayılan çerçeve profili veritabanına otomatik eklendi.`);
      return data.map((row: any) => ({
        id: String(row.id),
        code: row.code,
        name: row.name,
        materialType: (row.material_type as any) || "wood",
        widthCm: Number(row.width_cm || 4),
        unitPricePerMeter: Number(row.unit_price_per_meter || 120),
        imageUrl: row.image_url || "",
        textureUrl: row.texture_url || row.image_url || "",
        isRepeatingPattern: row.is_repeating_pattern ?? true,
        layoutMode: (row.layout_mode as any) || "repeat",
        category: (row.category as any) || "both",
        inStock: row.in_stock ?? true
      }));
    }

    if (error) {
      console.warn("[Supabase] Toplu çerçeve ekleme uyarısı, tekil deneniyor:", error.message);
      for (const row of rows) {
        await supabase.from("frame_profiles").upsert(row, { onConflict: "tenant_id,code" });
      }
    }
  } catch (err) {
    console.warn("[Supabase] seedDefaultFrameProfiles istisnası:", err);
  }

  return DEFAULT_FRAME_PROFILES;
}

export async function fetchFrameProfilesFromSupabase(): Promise<{ 
  data: FrameProfileItem[] | null; 
  error: any;
  isSchemaMissing?: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { data: DEFAULT_FRAME_PROFILES, error: null };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const { data, error } = await supabase
      .from("frame_profiles")
      .select("*")
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order("created_at", { ascending: false });

    if (error) {
      if (isSchemaMissingError(error)) {
        console.warn(
          "[Supabase] 'frame_profiles' tablosu şema önbelleğinde bulunamadı (PGRST205). Varsayılan profiller yükleniyor. 'src/db/schema_update.sql' dosyasını Supabase SQL Editor'de çalıştırabilirsiniz."
        );
        return { data: DEFAULT_FRAME_PROFILES, error: null, isSchemaMissing: true };
      }
      console.warn("Could not fetch frame profiles from Supabase (using default profiles):", error.message || error);
      return { data: DEFAULT_FRAME_PROFILES, error };
    }

    if (!data || data.length === 0) {
      // Veritabanı boşsa varsayılan profilleri Supabase'e otomatik ekle (seed/upsert)
      console.log("[Supabase] frame_profiles tablosu boş tespit edildi. Varsayılan profiller veritabanına otomatik ekleniyor...");
      const seeded = await seedDefaultFrameProfiles(tenantId);
      return { data: seeded, error: null };
    }

    const profiles: FrameProfileItem[] = data.map((row: any) => ({
      id: String(row.id),
      code: row.code,
      name: row.name,
      materialType: (row.material_type as any) || "wood",
      widthCm: Number(row.width_cm || 4),
      unitPricePerMeter: Number(row.unit_price_per_meter || 120),
      imageUrl: row.image_url || "",
      textureUrl: row.texture_url || row.image_url || "",
      isRepeatingPattern: row.is_repeating_pattern ?? true,
      layoutMode: (row.layout_mode as any) || (row.is_repeating_pattern ? "repeat" : "miter-stretch"),
      category: (row.category as any) || "both",
      inStock: row.is_active ?? row.in_stock ?? true
    }));

    return { data: profiles, error: null };
  } catch (err: any) {
    console.warn("Exception fetching frame profiles (using fallback catalog):", err?.message || err);
    return { data: DEFAULT_FRAME_PROFILES, error: err };
  }
}

export async function createFrameProfileInSupabase(
  profile: Omit<FrameProfileItem, "id"> & { id?: string }
): Promise<{ data: FrameProfileItem | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();
  await ensureTenantRecord(tenantId);

  const insertPayload: any = {
    tenant_id: tenantId,
    code: (profile.code || "P-" + Date.now().toString().slice(-4)).toUpperCase(),
    name: profile.name || "Yeni Profil",
    material_type: profile.materialType || "wood",
    width_cm: Number(profile.widthCm || 4),
    unit_price_per_meter: Number(profile.unitPricePerMeter || 120),
    unit_cost_per_meter: (profile as any).unitCostPerMeter || 0,
    image_url: profile.imageUrl || "",
    texture_url: profile.textureUrl || profile.imageUrl || "",
    is_repeating_pattern: profile.isRepeatingPattern ?? true,
    layout_mode: profile.layoutMode || (profile.isRepeatingPattern ? "repeat" : "miter-stretch"),
    category: profile.category || "both",
    is_active: profile.inStock ?? true
  };

  // Sadece valid UUID ise id gönder, yoksa PostgreSQL otomatik gen_random_uuid() üretsin
  const isUuid = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);
  if (isUuid) {
    insertPayload.id = profile.id;
  }

  // Base64 görsel koruması: Storage'a yükle ve sadece public URL sakla
  if (insertPayload.image_url && (insertPayload.image_url.startsWith("data:") || insertPayload.image_url.startsWith("blob:"))) {
    const uploadRes = await uploadImageToSupabaseStorage(insertPayload.image_url, "profiles", insertPayload.code);
    if (uploadRes.publicUrl) {
      insertPayload.image_url = uploadRes.publicUrl;
      insertPayload.texture_url = uploadRes.publicUrl;
    }
  }

  try {
    let res = await supabase
      .from("frame_profiles")
      .insert([insertPayload])
      .select()
      .single();

    // If PostgreSQL schema cache complains of missing column (PGRST204)
    if (res.error && res.error.code === "PGRST204") {
      console.warn("Retrying frame_profile creation with minimal core columns:", res.error.message);
      const minimalPayload: any = {
        tenant_id: tenantId,
        code: insertPayload.code,
        name: insertPayload.name,
        material_type: insertPayload.material_type,
        width_cm: insertPayload.width_cm,
        unit_price_per_meter: insertPayload.unit_price_per_meter,
        image_url: insertPayload.image_url,
        texture_url: insertPayload.texture_url,
        is_active: true
      };
      if (isUuid) minimalPayload.id = profile.id;
      res = await supabase.from("frame_profiles").insert([minimalPayload]).select().single();
    }

    if (res.error) {
      if (isSchemaMissingError(res.error)) {
        console.warn("[Supabase] 'frame_profiles' tablosu henüz mevcut değil. Lütfen schema_update.sql çalıştırın.");
      } else {
        console.warn("Supabase create frame profile warning:", res.error.message || res.error);
      }
      return { data: null, error: res.error };
    }

    const data = res.data;
    const created: FrameProfileItem = {
      id: String(data.id),
      code: data.code,
      name: data.name,
      materialType: data.material_type || "wood",
      widthCm: Number(data.width_cm || 4),
      unitPricePerMeter: Number(data.unit_price_per_meter || 120),
      imageUrl: data.image_url || "",
      textureUrl: data.texture_url || data.image_url || "",
      isRepeatingPattern: data.is_repeating_pattern ?? true,
      layoutMode: data.layout_mode || "miter-stretch",
      category: data.category || "both",
      inStock: data.is_active ?? data.in_stock ?? true
    };

    return { data: created, error: null };
  } catch (err) {
    console.warn("Exception creating frame profile:", err);
    return { data: null, error: err };
  }
}

export async function updateFrameProfileInSupabase(
  id: string,
  updates: Partial<FrameProfileItem>
): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  const payload: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.code !== undefined) payload.code = updates.code.toUpperCase();
  if (updates.materialType !== undefined) payload.material_type = updates.materialType;
  if (updates.widthCm !== undefined) payload.width_cm = updates.widthCm;
  if (updates.unitPricePerMeter !== undefined) payload.unit_price_per_meter = updates.unitPricePerMeter;
  if (updates.imageUrl !== undefined) {
    if (updates.imageUrl && (updates.imageUrl.startsWith("data:") || updates.imageUrl.startsWith("blob:"))) {
      const uploadRes = await uploadImageToSupabaseStorage(updates.imageUrl, "profiles", id);
      if (uploadRes.publicUrl) {
        payload.image_url = uploadRes.publicUrl;
        payload.texture_url = uploadRes.publicUrl;
      }
    } else {
      payload.image_url = updates.imageUrl;
    }
  }
  if (updates.textureUrl !== undefined && !payload.texture_url) {
    payload.texture_url = updates.textureUrl;
  }
  if (updates.isRepeatingPattern !== undefined) payload.is_repeating_pattern = updates.isRepeatingPattern;
  if (updates.layoutMode !== undefined) payload.layout_mode = updates.layoutMode;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.inStock !== undefined) {
    payload.is_active = updates.inStock;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from("frame_profiles").update(payload).eq("tenant_id", tenantId);
    if (isUuid) {
      query = query.eq("id", id);
    } else {
      const code = updates.code || id.replace("default-", "").replace("prof_", "").toUpperCase();
      query = query.eq("code", code);
    }

    const { error } = await query;

    if (error) {
      console.warn("Supabase update frame profile warning:", error.message || error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn("Exception updating frame profile:", err);
    return { success: false, error: err };
  }
}

export async function deleteFrameProfileFromSupabase(id: string): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from("frame_profiles").delete().eq("tenant_id", tenantId);
    if (isUuid) {
      query = query.eq("id", id);
    } else {
      const code = id.replace("default-", "").replace("prof_", "").toUpperCase();
      query = query.eq("code", code);
    }

    const { error } = await query;

    if (error) {
      console.warn("Supabase delete frame profile warning:", error.message || error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn("Exception deleting frame profile:", err);
    return { success: false, error: err };
  }
}

export async function bulkUpdateFramePricesInSupabase(
  updates: { id: string; price: number }[]
): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  try {
    const promises = updates.map(u => 
      supabase
        .from("frame_profiles")
        .update({ unit_price_per_meter: u.price, updated_at: new Date().toISOString() })
        .eq("id", u.id)
    );

    await Promise.all(promises);
    return { success: true, error: null };
  } catch (err) {
    console.warn("Exception bulk updating frame prices:", err);
    return { success: false, error: err };
  }
}

// ==========================================
// ORDERS & QUOTES CRUD (Siparişler ve Teklifler)
// ==========================================

export async function fetchOrdersFromSupabase(): Promise<{ data: OrderArchiveItem[] | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const { data, error } = await supabase
      .from("quotes_orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch orders from Supabase:", error.message || error);
      return { data: null, error };
    }

    const orders: OrderArchiveItem[] = (data || []).map((row: any) => {
      let createdDateStr = "";
      try {
        const d = new Date(row.created_at);
        createdDateStr = d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      } catch {
        createdDateStr = row.created_at || "";
      }

      let simulatorConfig: Record<string, any> | undefined = undefined;
      if (row.notes) {
        try {
          const parsed = JSON.parse(row.notes);
          if (typeof parsed === "object" && parsed !== null) {
            simulatorConfig = parsed;
          }
        } catch {
          // Normal text note
        }
      }

      return {
        id: String(row.id),
        orderNumber: row.order_number,
        createdAt: createdDateStr,
        customerName: row.customer_name,
        customerPhone: row.customer_phone || "",
        deliveryDate: row.delivery_date ? new Date(row.delivery_date).toLocaleDateString("tr-TR") : (row.delivery_date_str || undefined),
        artworkWidthCm: row.artwork_width_cm ? Number(row.artwork_width_cm) : undefined,
        artworkHeightCm: row.artwork_height_cm ? Number(row.artwork_height_cm) : undefined,
        innerFrameTitle: row.inner_frame_title || "",
        outerFrameTitle: row.outer_frame_title || "Yok",
        matInfo: row.mat_info || "Paspartusuz",
        totalAmount: Number(row.grand_total ?? row.total_amount ?? 0),
        currency: row.currency || "₺",
        status: (row.status as OrderStatus) || "quote",
        deliveryMethod: row.delivery_method === "store" ? "pickup" : (row.delivery_method || "pickup"),
        authorUser: row.author_user_name || row.author_user || "Yetkili Personel",
        simulatorConfig,
        innerProfileId: simulatorConfig?.innerProfileId,
        outerProfileId: simulatorConfig?.outerProfileId,
        matWidthCm: simulatorConfig?.matWidthCm,
        frameWidthCm: simulatorConfig?.frameWidthCm,
        middleMatWidthCm: simulatorConfig?.middleMatWidthCm,
        outerFrameWidthCm: simulatorConfig?.outerFrameWidthCm,
        innerMatColor: simulatorConfig?.innerMatColor,
        outerMatColor: simulatorConfig?.outerMatColor,
        customPaintingUrl: simulatorConfig?.customPaintingUrl,
        customPaintingFile: simulatorConfig?.customPaintingFile,
        inclusionFlags: simulatorConfig?.flags,
        customOverridePrice: simulatorConfig?.customOverridePrice
      };
    });

    return { data: orders, error: null };
  } catch (err) {
    console.warn("Exception fetching orders:", err);
    return { data: null, error: err };
  }
}

/**
 * Her türlü tarih metnini (DD-MM-YYYY, DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD vb.)
 * PostgreSQL DATE sütununun zorunlu kıldığı standart ISO (YYYY-MM-DD) formatına çevirir.
 * Bu sayede "date/time field value out of range: '26-09-2026' (Code: 22008)" hatasını kalıcı olarak engeller.
 */
export function formatToPostgresDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Zaten standart ISO formatındaysa (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Ayraçlara göre parçala (-, ., /, boşluk)
  const parts = trimmed.split(/[-./\s]+/);
  if (parts.length >= 3) {
    // Durum A: Yıl başta (YYYY-MM-DD veya YYYY/MM/DD)
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    // Durum B: Yıl sonda (DD-MM-YYYY veya DD.MM.YYYY)
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    // Durum C: 2 haneli yıl (DD-MM-YY)
    if (parts[2].length === 2) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = `20${parts[2]}`;
      return `${year}-${month}-${day}`;
    }
  }

  // 3. Fallback: JS Date nesnesi
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

export async function createOrderInSupabase(
  order: OrderArchiveItem
): Promise<{ data: OrderArchiveItem | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();
  await ensureTenantRecord(tenantId);

  // Standart ISO YYYY-MM-DD dönüşümü (PostgreSQL DATE sütunu için zorunlu 22008 hatası önlemi)
  const formattedDeliveryDate = formatToPostgresDate(order.deliveryDate);

  const deliveryMethodCode = order.deliveryMethod === "pickup" ? "store" : (order.deliveryMethod || "store");
  const validDeliveryMethod = ["store", "shipping", "special_delivery"].includes(deliveryMethodCode) ? deliveryMethodCode : "store";

  // 1. BASE64 KORUMASI: Snapshot içindeki görsel base64 veya blob ise Storage'a yükle veya arındır
  let safePaintingUrl = order.customPaintingUrl || "";
  if (safePaintingUrl && (safePaintingUrl.startsWith("data:") || safePaintingUrl.startsWith("blob:"))) {
    try {
      const uploadRes = await uploadImageToSupabaseStorage(
        safePaintingUrl,
        "artworks",
        `order_${order.orderNumber}_painting`
      );
      if (uploadRes.publicUrl) {
        safePaintingUrl = uploadRes.publicUrl;
      } else {
        safePaintingUrl = "";
      }
    } catch {
      safePaintingUrl = "";
    }
  }

  // 2. KURAL 4: Kullanılan çerçeve profillerinin DB'de varlığını garantile (Foreign key / 409 conflict önlemi)
  if (order.innerProfileId) {
    await ensureFrameProfileExistsInDb(order.innerProfileId, tenantId);
  }
  if (order.outerProfileId) {
    await ensureFrameProfileExistsInDb(order.outerProfileId, tenantId);
  }

  const simulatorSnapshot = {
    ...(order.simulatorConfig || {}),
    innerProfileId: order.innerProfileId,
    outerProfileId: order.outerProfileId,
    matWidthCm: order.matWidthCm,
    frameWidthCm: order.frameWidthCm,
    middleMatWidthCm: order.middleMatWidthCm,
    outerFrameWidthCm: order.outerFrameWidthCm,
    innerMatColor: order.innerMatColor,
    outerMatColor: order.outerMatColor,
    customPaintingUrl: safePaintingUrl,
    flags: order.inclusionFlags,
    customOverridePrice: order.customOverridePrice
  };

  // Standard schema payload
  const primaryPayload: any = {
    tenant_id: tenantId,
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone || null,
    delivery_date: formattedDeliveryDate,
    delivery_date_str: order.deliveryDate || null,
    artwork_width_cm: order.artworkWidthCm || null,
    artwork_height_cm: order.artworkHeightCm || null,
    inner_frame_title: order.innerFrameTitle || null,
    outer_frame_title: order.outerFrameTitle || null,
    mat_info: order.matInfo || null,
    grand_total: order.totalAmount || 0,
    subtotal: order.totalAmount || 0,
    currency: order.currency || "₺",
    status: order.status || "quote",
    delivery_method: validDeliveryMethod,
    author_user_name: order.authorUser || "Yetkili Personel",
    notes: JSON.stringify(simulatorSnapshot)
  };

  try {
    let { data, error } = await supabase
      .from("quotes_orders")
      .insert([primaryPayload])
      .select()
      .single();

    // Fallback if schema is missing optional columns (such as delivery_date_str PGRST204 or 42703)
    if (error && (error.code === "PGRST204" || error.code === "42703")) {
      console.warn("Retrying order insert without delivery_date_str or legacy columns:", error.message);
      const safePayload = { ...primaryPayload };
      delete safePayload.delivery_date_str;

      const retryRes = await supabase
        .from("quotes_orders")
        .insert([safePayload])
        .select()
        .single();

      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      } else {
        const fallbackPayload: any = {
          tenant_id: tenantId,
          order_number: order.orderNumber,
          customer_name: order.customerName,
          customer_phone: order.customerPhone || null,
          delivery_date: formattedDeliveryDate,
          artwork_width_cm: order.artworkWidthCm || null,
          artwork_height_cm: order.artworkHeightCm || null,
          inner_frame_title: order.innerFrameTitle || null,
          outer_frame_title: order.outerFrameTitle || null,
          mat_info: order.matInfo || null,
          total_amount: order.totalAmount || 0,
          currency: order.currency || "₺",
          status: order.status || "quote",
          delivery_method: order.deliveryMethod || "pickup",
          author_user: order.authorUser || "Yetkili Personel"
        };

        const fallbackRes = await supabase
          .from("quotes_orders")
          .insert([fallbackPayload])
          .select()
          .single();
        
        data = fallbackRes.data;
        error = fallbackRes.error;
      }
    }

    if (error) {
      console.warn("Could not save order to Supabase:", error.message || error);
      return { data: null, error };
    }

    const savedOrder: OrderArchiveItem = {
      ...order,
      id: String(data.id)
    };

    return { data: savedOrder, error: null };
  } catch (err) {
    console.warn("Exception creating order in Supabase:", err);
    return { data: null, error: err };
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = supabase.from("quotes_orders").update({ status, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    
    if (isUuid) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("order_number", orderId);
    }

    const { error } = await query;
    if (error) {
      console.warn("Could not update order status in Supabase:", error.message || error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn("Exception updating order status:", err);
    return { success: false, error: err };
  }
}

export async function deleteOrderFromSupabase(orderId: string): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = supabase.from("quotes_orders").delete().eq("tenant_id", tenantId);
    
    if (isUuid) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("order_number", orderId);
    }

    const { error } = await query;
    if (error) {
      console.warn("Could not delete order from Supabase:", error.message || error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn("Exception deleting order from Supabase:", err);
    return { success: false, error: err };
  }
}

// ==========================================
// TENANT SETTINGS (Fiyat ve Birim Ayarları)
// ==========================================

export async function fetchTenantSettingsFromSupabase(): Promise<{ data: UnitPricesSettings | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const { data, error } = await supabase
      .from("tenant_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch tenant settings from Supabase (using local settings):", error.message || error);
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: null };
    }

    // 1. If stored as a JSON object in 'settings' column
    if ((data as any).settings && typeof (data as any).settings === "object") {
      return { data: sanitizeUnitPricesSettings((data as any).settings), error: null };
    }

    // 2. Map structured relational columns from schema, sanitized so NaN is impossible
    const mapped = sanitizeUnitPricesSettings({
      canvasPrintPricePerSqm: data.canvas_print_price_per_sqm ?? 0,
      matBoardPricePerSqm: data.mat_board_price_per_sqm ?? 0,
      middleMatBoardPricePerSqm: data.middle_mat_board_price_per_sqm ?? 0,
      transparentMatBoardPricePerSqm: data.transparent_mat_board_price_per_sqm ?? 0,
      defaultInnerFramePricePerMeter: data.default_inner_frame_price_per_meter ?? 0,
      defaultOuterFramePricePerMeter: data.default_outer_frame_price_per_meter ?? 0,
      glassPricePerSqm: data.glass_price_per_sqm ?? 0,
      backingBoardPricePerSqm: data.backing_board_price_per_sqm ?? 0,
      backingClothPricePerSqm: data.backing_cloth_price_per_sqm ?? 0,
      kraftTapePricePerMeter: data.kraft_tape_price_per_meter ?? 0,
      laborFixedCost: data.default_labor_fixed_cost ?? 0,
      wastePercentage: data.default_waste_percentage ?? 0,
      targetProfitMarginPercent: data.target_profit_margin_percent ?? 0,
      vatRatePercent: data.vat_rate_percent ?? 0,
      defaultShippingCost: data.default_shipping_cost ?? 0
    });

    return { data: mapped, error: null };
  } catch (err) {
    console.warn("Exception fetching tenant settings:", err);
    return { data: null, error: err };
  }
}

export async function saveTenantSettingsToSupabase(
  settings: UnitPricesSettings
): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  // 1. Doğrudan aktif giriş yapmış kullanıcının UID'sini (auth.uid) al
  const tenantId = await getAuthUserIdOrTenantId();

  // 2. Boş bırakılan veya NaN olan tüm alanları 0 (sıfır) olarak varsayılan değere eşitle
  const sanitized = sanitizeUnitPricesSettings(settings);

  // 3. Foreign key kısıtını sağlamak adına tenants tablosunda kayıt varlığını garantile
  try {
    await supabase.from("tenants").upsert({
      id: tenantId,
      name: "Atölye",
      slug: `tenant-${tenantId.slice(0, 8)}`,
      status: "active"
    }, { onConflict: "id" });
  } catch (e) {
    // Tenants tablosu kısıtı varsa veya zaten mevcutsa sessizce devam et
  }

  // 4. Tablodaki tüm ilişkisel sütunları ve yedek JSON'u içeren payload
  const relationalPayload: Record<string, any> = {
    tenant_id: tenantId,
    canvas_print_price_per_sqm: sanitized.canvasPrintPricePerSqm,
    mat_board_price_per_sqm: sanitized.matBoardPricePerSqm,
    middle_mat_board_price_per_sqm: sanitized.middleMatBoardPricePerSqm,
    transparent_mat_board_price_per_sqm: sanitized.transparentMatBoardPricePerSqm,
    default_inner_frame_price_per_meter: sanitized.defaultInnerFramePricePerMeter,
    default_outer_frame_price_per_meter: sanitized.defaultOuterFramePricePerMeter,
    glass_price_per_sqm: sanitized.glassPricePerSqm,
    backing_board_price_per_sqm: sanitized.backingBoardPricePerSqm,
    backing_cloth_price_per_sqm: sanitized.backingClothPricePerSqm,
    kraft_tape_price_per_meter: sanitized.kraftTapePricePerMeter,
    default_labor_fixed_cost: sanitized.laborFixedCost,
    default_waste_percentage: sanitized.wastePercentage,
    target_profit_margin_percent: sanitized.targetProfitMarginPercent,
    vat_rate_percent: sanitized.vatRatePercent,
    default_shipping_cost: sanitized.defaultShippingCost,
    settings: sanitized,
    updated_at: new Date().toISOString()
  };

  try {
    // 5. Upsert işlemi: Varsa güncelle, yoksa ekle (onConflict: tenant_id)
    const { error: relError } = await supabase
      .from("tenant_settings")
      .upsert(relationalPayload, { onConflict: "tenant_id" });

    if (!relError) {
      return { success: true, error: null };
    }

    // 6. Geriye Uyumluluk / Eksik Sütun Durumu (Örn: Henüz SQL ALTER TABLE çalıştırılmadıysa)
    if (relError.code === "42703" || (relError.message && relError.message.includes("column"))) {
      console.warn("İlişkisel sütunlar eksik olabilir, sadece JSON 'settings' ve 'tenant_id' ile upsert deneniyor:", relError.message);
      const { error: jsonError } = await supabase
        .from("tenant_settings")
        .upsert({
          tenant_id: tenantId,
          settings: sanitized,
          updated_at: new Date().toISOString()
        }, { onConflict: "tenant_id" });

      if (!jsonError) {
        return { success: true, error: null };
      }
      return { success: false, error: jsonError };
    }

    console.warn("Could not save tenant settings to Supabase:", relError.message || relError);
    return { success: false, error: relError };
  } catch (err) {
    console.warn("Exception saving tenant settings:", err);
    return { success: false, error: err };
  }
}

// ==========================================
// VISUALIZATIONS CRUD (Sanat Eseri & Görseller)
// ==========================================

export interface SavedVisualizationItem {
  id: string;
  tenantId: string;
  artworkUrl: string;
  artworkName: string;
  artworkWidthCm: number;
  artworkHeightCm: number;
  innerFrameProfileId?: string | null;
  renderedPreviewUrl?: string | null;
  createdAt?: string;
}

export async function fetchVisualizationsFromSupabase(): Promise<{ data: SavedVisualizationItem[] | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const { data, error } = await supabase
      .from("visualizations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch visualizations from Supabase:", error.message || error);
      return { data: null, error };
    }

    const items: SavedVisualizationItem[] = (data || []).map((row: any) => ({
      id: String(row.id),
      tenantId: row.tenant_id,
      artworkUrl: row.artwork_url,
      artworkName: row.artwork_name || "İsimsiz Eser",
      artworkWidthCm: Number(row.artwork_width_cm || 50),
      artworkHeightCm: Number(row.artwork_height_cm || 70),
      innerFrameProfileId: row.inner_frame_profile_id || null,
      renderedPreviewUrl: row.rendered_preview_url || null,
      createdAt: row.created_at
    }));

    return { data: items, error: null };
  } catch (err) {
    console.warn("Exception fetching visualizations:", err);
    return { data: null, error: err };
  }
}

export async function createVisualizationInSupabase(
  visual: {
    artworkUrl?: string;
    artworkName?: string;
    artworkWidthCm?: number;
    artworkHeightCm?: number;
    innerFrameProfileId?: string | null;
    renderedPreviewUrl?: string | null;
    image_url?: string;
    imageUrl?: string;
    artwork_url?: string;
    title?: string;
    artwork_name?: string;
    artwork_width_cm?: number;
    artwork_height_cm?: number;
    inner_frame_profile_id?: string | null;
    rendered_preview_url?: string | null;
  }
): Promise<{ data: SavedVisualizationItem | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();
  await ensureTenantRecord(tenantId);

  let rawArtworkUrl = visual.artworkUrl || visual.artwork_url || visual.imageUrl || visual.image_url || "";
  const artworkName = visual.artworkName || visual.artwork_name || visual.title || "Yeni Eser";
  const artworkWidth = Number(visual.artworkWidthCm || visual.artwork_width_cm || 50);
  const artworkHeight = Number(visual.artworkHeightCm || visual.artwork_height_cm || 70);
  const innerFrameId = visual.innerFrameProfileId || visual.inner_frame_profile_id || null;
  let rawPreviewUrl = visual.renderedPreviewUrl || visual.rendered_preview_url || null;

  if (!rawArtworkUrl) {
    return { data: null, error: new Error("Artwork URL is required") };
  }

  // 1. BASE64 ENGELLEME & STORAGE ENTEGRASYONU:
  // Veritabanındaki hiçbir tabloda kesinlikle Base64 formatında görsel tutulmayacak.
  let finalArtworkUrl = rawArtworkUrl;
  if (rawArtworkUrl.startsWith("data:") || rawArtworkUrl.startsWith("blob:")) {
    console.log("[createVisualizationInSupabase] Base64/Blob tespit edildi. Supabase Storage'a yükleniyor...");
    const storageRes = await uploadImageToSupabaseStorage(rawArtworkUrl, "artworks", artworkName);
    if (storageRes.publicUrl) {
      finalArtworkUrl = storageRes.publicUrl;
      console.log("[createVisualizationInSupabase] Storage Public URL elde edildi:", finalArtworkUrl);
    } else {
      console.warn("[createVisualizationInSupabase] Storage yüklenemedi:", storageRes.error);
      return {
        data: null,
        error: new Error("Görsel Storage'a yüklenemedi. Veritabanına Base64 kaydı engellendi.")
      };
    }
  }

  // Rendered preview için de base64 koruması
  let finalPreviewUrl = rawPreviewUrl;
  if (rawPreviewUrl && (rawPreviewUrl.startsWith("data:") || rawPreviewUrl.startsWith("blob:"))) {
    const previewStorageRes = await uploadImageToSupabaseStorage(rawPreviewUrl, "visualizations", "preview_" + artworkName);
    if (previewStorageRes.publicUrl) {
      finalPreviewUrl = previewStorageRes.publicUrl;
    } else {
      finalPreviewUrl = null; // Veritabanına Base64 girmesin
    }
  }

  // 2. KURAL 4 & 5: Foreign Key Güvencesi - Çerçeve profilinin varlığını garantile
  let verifiedInnerFrameId: string | null = null;
  if (innerFrameId) {
    verifiedInnerFrameId = await ensureFrameProfileExistsInDb(innerFrameId, tenantId);
  }

  const payload: any = {
    tenant_id: tenantId,
    artwork_url: finalArtworkUrl,
    artwork_name: artworkName,
    artwork_width_cm: artworkWidth,
    artwork_height_cm: artworkHeight,
    inner_frame_profile_id: verifiedInnerFrameId,
    rendered_preview_url: finalPreviewUrl,
    updated_at: new Date().toISOString()
  };

  try {
    let { data, error } = await supabase
      .from("visualizations")
      .insert([payload])
      .select()
      .single();

    // Foreign Key hatası (23503 veya frame_profiles FK violation / 409 Conflict) yakalanırsa:
    if (error && (
      error.code === "23503" || 
      error.code === "409" || 
      String(error.message || "").toLowerCase().includes("foreign key") ||
      String(error.message || "").toLowerCase().includes("frame_profiles") ||
      String(error.message || "").toLowerCase().includes("violates")
    )) {
      console.warn("[createVisualizationInSupabase] Foreign Key ihlali yakalandı. inner_frame_profile_id: null olarak yeniden deneniyor...", error.message);
      payload.inner_frame_profile_id = null;
      const retryRes = await supabase
        .from("visualizations")
        .insert([payload])
        .select()
        .single();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      if (isSchemaMissingError(error)) {
        console.warn("[Supabase] 'visualizations' tablosu henüz mevcut değil. Lütfen schema_update.sql çalıştırın.");
      } else {
        console.warn("Supabase create visualization warning:", error.message || error);
      }
      return { data: null, error };
    }

    const created: SavedVisualizationItem = {
      id: String(data.id),
      tenantId: data.tenant_id,
      artworkUrl: data.artwork_url,
      artworkName: data.artwork_name,
      artworkWidthCm: Number(data.artwork_width_cm),
      artworkHeightCm: Number(data.artwork_height_cm),
      innerFrameProfileId: data.inner_frame_profile_id || null,
      renderedPreviewUrl: data.rendered_preview_url || null,
      createdAt: data.created_at
    };

    return { data: created, error: null };
  } catch (err) {
    console.warn("Exception creating visualization:", err);
    return { data: null, error: err };
  }
}

export async function deleteVisualizationFromSupabase(
  id: string
): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  const tenantId = await getAuthUserIdOrTenantId();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from("visualizations")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.warn("Supabase delete visualization warning:", error.message || error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn("Exception deleting visualization:", err);
    return { success: false, error: err };
  }
}

// ==========================================
// COMPANY PROFILE & WHITE-LABEL (Firma Profili)
// ==========================================

/**
 * Supabase'den aktif kullanıcının (auth.uid veya tenant_id) firma profili ve white-label ayarlarını çeker.
 * Yeni bir kullanıcıysa veya veritabanında henüz kayıt yoksa null döner (böylece form sahte verisiz, tamamen BOMBOŞ açılır).
 */
export async function fetchCompanyProfileFromSupabase(
  targetTenantId?: string
): Promise<{ data: CompanyProfile | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  let tenantId = targetTenantId;
  if (!tenantId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        tenantId = user.id;
      }
    } catch {
      // ignore
    }
  }
  if (!tenantId) {
    tenantId = getTenantId();
  }

  if (!tenantId) {
    return { data: null, error: new Error("No tenant ID available") };
  }

  try {
    // 1. Tenants tablosunu kontrol et
    const { data: tenantRow, error: tenantErr } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantErr) {
      console.warn("Supabase tenants fetch warning:", tenantErr.message);
    }

    // 2. Tenant_settings tablosunu kontrol et (settings JSON ve include_in_quotes)
    const { data: settingsRow, error: settingsErr } = await supabase
      .from("tenant_settings")
      .select("include_in_quotes, settings")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (settingsErr) {
      console.warn("Supabase tenant_settings fetch warning:", settingsErr.message);
    }

    const savedInSettings = 
      (settingsRow?.settings as any)?.companyProfile || 
      (settingsRow?.settings as any)?.company_profile;

    // Hiçbir kayıt yoksa
    if (!tenantRow && !savedInSettings) {
      return { data: null, error: null };
    }

    // Kullanıcı veya atölye tarafından kaydedilmiş veriyi derle
    const profile: CompanyProfile = {
      companyName: savedInSettings?.companyName ?? (tenantRow?.name && !tenantRow.name.startsWith("tenant-") ? tenantRow.name : "") ?? "",
      tradeTitle: savedInSettings?.tradeTitle ?? tenantRow?.trade_title ?? "",
      tagline: savedInSettings?.tagline ?? tenantRow?.tagline ?? "",
      logoUrl: savedInSettings?.logoUrl ?? tenantRow?.logo_url ?? "",
      primaryColor: savedInSettings?.primaryColor ?? tenantRow?.primary_color ?? "#C5A059",
      taxOffice: savedInSettings?.taxOffice ?? tenantRow?.tax_office ?? "",
      taxNumber: savedInSettings?.taxNumber ?? tenantRow?.tax_number ?? "",
      phone: savedInSettings?.phone ?? tenantRow?.phone ?? "",
      email: savedInSettings?.email ?? tenantRow?.email ?? "",
      website: savedInSettings?.website ?? tenantRow?.website ?? "",
      address: savedInSettings?.address ?? tenantRow?.address ?? "",
      city: savedInSettings?.city ?? tenantRow?.city ?? "",
      iban: savedInSettings?.iban ?? tenantRow?.iban ?? "",
      includeInQuotes: settingsRow?.include_in_quotes ?? savedInSettings?.includeInQuotes ?? true
    };

    const hasAnyContent = Boolean(
      profile.companyName || 
      profile.tradeTitle || 
      profile.phone || 
      profile.email || 
      profile.address || 
      profile.taxNumber || 
      profile.logoUrl
    );

    if (!hasAnyContent && !tenantRow && !savedInSettings) {
      return { data: null, error: null };
    }

    return { data: profile, error: null };
  } catch (err) {
    console.warn("Exception fetching company profile from Supabase:", err);
    return { data: null, error: err };
  }
}

/**
 * Kullanıcı firma bilgilerini doldurup kaydettiğinde, Supabase'e o kullanıcının tenant_id'si ile Upsert eder.
 * (Kayıt yoksa ekler, varsa günceller, işlem bitiminde hemen veritabanından taze veriyi doğrular)
 */
export async function saveCompanyProfileToSupabase(
  profile: CompanyProfile,
  targetTenantId?: string
): Promise<{ success: boolean; data?: CompanyProfile | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  let tenantId = targetTenantId;
  if (!tenantId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        tenantId = user.id;
      }
    } catch {
      // ignore
    }
  }
  if (!tenantId) {
    tenantId = getTenantId();
  }

  if (!tenantId) {
    return { success: false, error: new Error("No tenant ID available") };
  }

  try {
    // 0. Foreign key kısıtları için tenant kaydını garantiye al
    await ensureTenantRecord(tenantId);

    let cleanLogoUrl = profile.logoUrl || "";
    if (cleanLogoUrl.startsWith("data:") || cleanLogoUrl.startsWith("blob:")) {
      try {
        const logoUpload = await uploadImageToSupabaseStorage(cleanLogoUrl, "logos", "company_logo");
        if (logoUpload.publicUrl) {
          cleanLogoUrl = logoUpload.publicUrl;
          profile.logoUrl = cleanLogoUrl;
        } else {
          cleanLogoUrl = "";
          profile.logoUrl = "";
        }
      } catch (storageErr) {
        console.warn("Logo depolama yükleme uyarısı:", storageErr);
        cleanLogoUrl = "";
        profile.logoUrl = "";
      }
    }

    // 1. Tenants tablosuna Upsert (kayıt yoksa ekle, varsa güncelle)
    const tenantPayload: any = {
      id: tenantId,
      name: profile.companyName?.trim() || "Atölye",
      slug: `tenant-${tenantId.slice(0, 8)}`,
      trade_title: profile.tradeTitle || "",
      tagline: profile.tagline || "",
      tax_office: profile.taxOffice || "",
      tax_number: profile.taxNumber || "",
      phone: profile.phone || "",
      email: profile.email || "",
      website: profile.website || "",
      address: profile.address || "",
      city: profile.city || "",
      iban: profile.iban || "",
      logo_url: cleanLogoUrl,
      primary_color: profile.primaryColor || "#C5A059",
      updated_at: new Date().toISOString()
    };

    const { error: tenantError } = await supabase
      .from("tenants")
      .upsert(tenantPayload, { onConflict: "id" });

    if (tenantError) {
      console.warn("Warning upserting into tenants table:", tenantError);
    }

    // 2. Tenant_settings tablosuna Upsert (include_in_quotes ve settings JSON'ında companyProfile)
    const { data: existingSettingsRow } = await supabase
      .from("tenant_settings")
      .select("settings")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const existingSettings = 
      (existingSettingsRow?.settings && typeof existingSettingsRow.settings === "object")
        ? existingSettingsRow.settings
        : {};

    const settingsPayload: any = {
      tenant_id: tenantId,
      include_in_quotes: profile.includeInQuotes ?? true,
      settings: {
        ...existingSettings,
        companyProfile: profile
      },
      updated_at: new Date().toISOString()
    };

    const { error: settingsError } = await supabase
      .from("tenant_settings")
      .upsert(settingsPayload, { onConflict: "tenant_id" });

    if (settingsError) {
      console.warn("Warning upserting into tenant_settings table:", settingsError);
    }

    if (tenantError && settingsError) {
      return { 
        success: false, 
        error: tenantError || settingsError 
      };
    }

    // 3. Veritabanından hemen doğrulanmış taze firma verisini oku
    const { data: freshProfile } = await fetchCompanyProfileFromSupabase(tenantId);

    return { 
      success: true, 
      data: freshProfile || profile,
      error: null 
    };
  } catch (err) {
    console.warn("Exception saving company profile to Supabase:", err);
    return { success: false, error: err };
  }
}
