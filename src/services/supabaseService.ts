import { supabase, isSupabaseConfigured, getTenantId } from "../lib/supabase";
import { FrameProfileItem, OrderArchiveItem, OrderStatus, UnitPricesSettings } from "../types/pricing";

// Test connection to Supabase
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
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
      console.warn("Supabase connection check warning:", error);
      return {
        success: false,
        message: `Supabase bağlantı hatası: ${error.message}`
      };
    }

    return {
      success: true,
      message: "Supabase veritabanına başarıyla bağlanıldı."
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

export async function fetchFrameProfilesFromSupabase(): Promise<{ data: FrameProfileItem[] | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = getTenantId();

  try {
    const { data, error } = await supabase
      .from("frame_profiles")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching frame profiles from Supabase:", error);
      return { data: null, error };
    }

    const profiles: FrameProfileItem[] = (data || []).map((row: any) => ({
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
      inStock: row.in_stock ?? true
    }));

    return { data: profiles, error: null };
  } catch (err) {
    console.error("Exception fetching frame profiles:", err);
    return { data: null, error: err };
  }
}

export async function createFrameProfileInSupabase(
  profile: Omit<FrameProfileItem, "id"> & { id?: string }
): Promise<{ data: FrameProfileItem | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = getTenantId();

  const insertPayload: any = {
    tenant_id: tenantId,
    code: profile.code.toUpperCase(),
    name: profile.name,
    material_type: profile.materialType || "wood",
    width_cm: profile.widthCm,
    unit_price_per_meter: profile.unitPricePerMeter,
    image_url: profile.imageUrl || "",
    texture_url: profile.textureUrl || profile.imageUrl || "",
    is_repeating_pattern: profile.isRepeatingPattern ?? true,
    layout_mode: profile.layoutMode || (profile.isRepeatingPattern ? "repeat" : "miter-stretch"),
    category: profile.category || "both",
    in_stock: profile.inStock ?? true
  };

  // Only pass UUID if it looks like a valid UUID, otherwise let postgres generate one
  const isUuid = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);
  if (isUuid) {
    insertPayload.id = profile.id;
  }

  try {
    const { data, error } = await supabase
      .from("frame_profiles")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("Error creating frame profile in Supabase:", error);
      return { data: null, error };
    }

    const created: FrameProfileItem = {
      id: String(data.id),
      code: data.code,
      name: data.name,
      materialType: data.material_type || "wood",
      widthCm: Number(data.width_cm),
      unitPricePerMeter: Number(data.unit_price_per_meter),
      imageUrl: data.image_url || "",
      textureUrl: data.texture_url || data.image_url || "",
      isRepeatingPattern: data.is_repeating_pattern ?? true,
      layoutMode: data.layout_mode || "miter-stretch",
      category: data.category || "both",
      inStock: data.in_stock ?? true
    };

    return { data: created, error: null };
  } catch (err) {
    console.error("Exception creating frame profile:", err);
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

  const payload: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.code !== undefined) payload.code = updates.code.toUpperCase();
  if (updates.materialType !== undefined) payload.material_type = updates.materialType;
  if (updates.widthCm !== undefined) payload.width_cm = updates.widthCm;
  if (updates.unitPricePerMeter !== undefined) payload.unit_price_per_meter = updates.unitPricePerMeter;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.textureUrl !== undefined) payload.texture_url = updates.textureUrl;
  if (updates.isRepeatingPattern !== undefined) payload.is_repeating_pattern = updates.isRepeatingPattern;
  if (updates.layoutMode !== undefined) payload.layout_mode = updates.layoutMode;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.inStock !== undefined) payload.in_stock = updates.inStock;

  try {
    const { error } = await supabase
      .from("frame_profiles")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating frame profile in Supabase:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Exception updating frame profile:", err);
    return { success: false, error: err };
  }
}

export async function deleteFrameProfileFromSupabase(id: string): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  try {
    const { error } = await supabase
      .from("frame_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting frame profile from Supabase:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Exception deleting frame profile:", err);
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
    console.error("Exception bulk updating frame prices:", err);
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

  const tenantId = getTenantId();

  try {
    const { data, error } = await supabase
      .from("quotes_orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders from Supabase:", error);
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

      return {
        id: String(row.id),
        orderNumber: row.order_number,
        createdAt: createdDateStr,
        customerName: row.customer_name,
        customerPhone: row.customer_phone || "",
        deliveryDate: row.delivery_date ? new Date(row.delivery_date).toLocaleDateString("tr-TR") : undefined,
        artworkWidthCm: row.artwork_width_cm ? Number(row.artwork_width_cm) : undefined,
        artworkHeightCm: row.artwork_height_cm ? Number(row.artwork_height_cm) : undefined,
        innerFrameTitle: row.inner_frame_title || "",
        outerFrameTitle: row.outer_frame_title || "Yok",
        matInfo: row.mat_info || "Paspartusuz",
        totalAmount: Number(row.total_amount || 0),
        currency: row.currency || "₺",
        status: (row.status as OrderStatus) || "quote",
        deliveryMethod: row.delivery_method || "pickup",
        authorUser: row.author_user || "Yetkili Personel"
      };
    });

    return { data: orders, error: null };
  } catch (err) {
    console.error("Exception fetching orders:", err);
    return { data: null, error: err };
  }
}

export async function createOrderInSupabase(
  order: OrderArchiveItem
): Promise<{ data: OrderArchiveItem | null; error: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const tenantId = getTenantId();

  // Parse delivery date if provided
  let formattedDeliveryDate: string | null = null;
  if (order.deliveryDate) {
    try {
      const parts = order.deliveryDate.split(/[./-]/);
      if (parts.length === 3) {
        // Assume DD.MM.YYYY
        formattedDeliveryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    } catch {
      formattedDeliveryDate = null;
    }
  }

  const payload: any = {
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
    total_amount: order.totalAmount,
    currency: order.currency || "₺",
    status: order.status || "quote",
    delivery_method: order.deliveryMethod || "pickup",
    author_user: order.authorUser || "Yetkili Personel",
    metadata: {}
  };

  try {
    const { data, error } = await supabase
      .from("quotes_orders")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error saving order to Supabase:", error);
      return { data: null, error };
    }

    const savedOrder: OrderArchiveItem = {
      ...order,
      id: String(data.id)
    };

    return { data: savedOrder, error: null };
  } catch (err) {
    console.error("Exception creating order in Supabase:", err);
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

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = supabase.from("quotes_orders").update({ status, updated_at: new Date().toISOString() });
    
    if (isUuid) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("order_number", orderId);
    }

    const { error } = await query;
    if (error) {
      console.error("Error updating order status:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Exception updating order status:", err);
    return { success: false, error: err };
  }
}

export async function deleteOrderFromSupabase(orderId: string): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = supabase.from("quotes_orders").delete();
    
    if (isUuid) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("order_number", orderId);
    }

    const { error } = await query;
    if (error) {
      console.error("Error deleting order from Supabase:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Exception deleting order from Supabase:", err);
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

  const tenantId = getTenantId();

  try {
    const { data, error } = await supabase
      .from("tenant_settings")
      .select("settings")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching tenant settings from Supabase:", error);
      return { data: null, error };
    }

    if (!data || !data.settings) {
      return { data: null, error: null };
    }

    return { data: data.settings as UnitPricesSettings, error: null };
  } catch (err) {
    console.error("Exception fetching tenant settings:", err);
    return { data: null, error: err };
  }
}

export async function saveTenantSettingsToSupabase(
  settings: UnitPricesSettings
): Promise<{ success: boolean; error: any }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: new Error("Supabase is not configured") };
  }

  const tenantId = getTenantId();

  try {
    const { error } = await supabase
      .from("tenant_settings")
      .upsert({
        tenant_id: tenantId,
        settings: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: "tenant_id" });

    if (error) {
      console.error("Error saving tenant settings to Supabase:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Exception saving tenant settings:", err);
    return { success: false, error: err };
  }
}
