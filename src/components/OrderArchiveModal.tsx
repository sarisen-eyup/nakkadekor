import React, { useState } from "react";
import { 
  X, 
  Archive, 
  Search, 
  Trash2, 
  FileText, 
  RotateCcw,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  Truck,
  Building2,
  Sliders,
  ChevronDown,
  Layers,
  Image,
  Maximize2
} from "lucide-react";
import { OrderArchiveItem, OrderStatus, CompanyProfile, FrameProfileItem } from "../types/pricing";
import { resolveOrderQuantity } from "../utils/pricing";

interface OrderArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  orders: OrderArchiveItem[];
  profiles?: FrameProfileItem[];
  onDeleteOrder: (orderId: string) => void;
  onLoadOrderToWorkspace: (order: OrderArchiveItem) => void;
  companyProfile: CompanyProfile;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export const OrderArchiveModal: React.FC<OrderArchiveModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  orders,
  profiles = [],
  onDeleteOrder,
  onLoadOrderToWorkspace,
  onUpdateStatus
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  const formatDeliveryDate = (d?: string) => {
    if (!d || d.trim() === "") return "Belirtilmedi";
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y, m, day] = d.split("T")[0].split("-");
      return `${day}.${m}.${y}`;
    }
    return d;
  };

  const resolveOrderFlags = (order: OrderArchiveItem) => {
    const flags = order.inclusionFlags || order.simulatorConfig?.flags || order.simulatorConfig?.inclusionFlags;
    if (flags) {
      return {
        includeArtworkPrint: Boolean(flags.includeArtworkPrint),
        includeInnerMat: Boolean(flags.includeInnerMat),
        includeInnerFrame: flags.includeInnerFrame !== false,
        includeMiddleMat: Boolean(flags.includeMiddleMat),
        includeOuterFrame: Boolean(flags.includeOuterFrame),
        includeGlass: flags.includeGlass !== false,
        includeBackingBoard: flags.includeBackingBoard !== false,
        includeBackingCloth: Boolean(flags.includeBackingCloth),
        includeKraftTape: flags.includeKraftTape !== false,
      };
    }
    const hasMat = Boolean((order.matWidthCm && order.matWidthCm > 0) || (order.matInfo && !order.matInfo.toLowerCase().includes("paspartusuz")));
    const hasOuter = Boolean((order.outerFrameWidthCm && order.outerFrameWidthCm > 0) || (order.outerFrameTitle && order.outerFrameTitle !== "Yok"));
    const hasMiddleMat = Boolean(order.middleMatWidthCm && order.middleMatWidthCm > 0);
    return {
      includeArtworkPrint: false,
      includeInnerMat: hasMat,
      includeInnerFrame: true,
      includeMiddleMat: hasMiddleMat,
      includeOuterFrame: hasOuter,
      includeGlass: true,
      includeBackingBoard: true,
      includeBackingCloth: false,
      includeKraftTape: true,
    };
  };

  const cleanFrameName = (rawTitle?: string) => {
    if (!rawTitle) return "";
    let name = rawTitle.trim();
    if (name.includes(" - ")) {
      name = name.split(" - ").slice(1).join(" - ").trim();
    }
    name = name.replace(/\s*\(\s*\d+(\.\d+)?\s*cm\s*\)/gi, "").trim();
    return name;
  };

  if (!isOpen) return null;

  const filteredOrders = orders.filter((order) => {
    const flags = resolveOrderFlags(order);
    const flagsTerms = [
      flags.includeArtworkPrint ? "baskı tuval kanvas print" : "müşteri eseri",
      flags.includeGlass ? "cam pleksi" : "camsız",
      flags.includeBackingBoard ? "mdf arkalık" : "",
      flags.includeBackingCloth ? "kapama bezi" : "",
      flags.includeKraftTape ? "kraft bant" : "",
      order.matInfo || "",
      order.outerFrameTitle || ""
    ].join(" ").toLowerCase();

    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.innerFrameTitle && order.innerFrameTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      flagsTerms.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "approved":
        return isDarkMode
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
          : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100";
      case "production":
        return isDarkMode
          ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
          : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100";
      case "delivered":
        return isDarkMode
          ? "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25"
          : "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100";
      case "quote":
      default:
        return isDarkMode
          ? "bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25"
          : "bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100";
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "approved": return "ONAYLANDI";
      case "production": return "ÜRETİMDE";
      case "delivered": return "TESLİM EDİLDİ";
      case "quote":
      default: return "TEKLİF";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className={`w-full max-w-5xl rounded-none sm:rounded-3xl border-0 sm:border shadow-2xl flex flex-col overflow-hidden h-[100dvh] sm:h-[88vh] max-h-[100dvh] sm:max-h-[850px] transition-all ${
        isDarkMode ? "bg-[#12151b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        
        {/* Header */}
        <div className={`px-4 py-3.5 sm:px-6 sm:py-4 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#0d1015] border-white/10" : "bg-slate-50/90 border-slate-200"
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${
              isDarkMode 
                ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30" 
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}>
              <Archive className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-black tracking-wider uppercase truncate">
                  SİPARİŞ ARŞİVİ
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                  isDarkMode 
                    ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40" 
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}>
                  {orders.length}
                </span>
              </div>
              <p className={`text-[11px] truncate ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Kayıtlı siparişler, müşteri detayları ve üretim dökümleri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
              isDarkMode 
                ? "hover:bg-white/10 text-neutral-400 hover:text-white" 
                : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
            }`}
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Filter Bar */}
        <div className={`px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? "bg-[#090b0e] border-white/10" : "bg-slate-100/70 border-slate-200"
        }`}>
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
              isDarkMode ? "text-neutral-500" : "text-slate-400"
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Müşteri adı, tel veya sipariş no..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                isDarkMode 
                  ? "bg-[#141820] border-white/15 text-white placeholder-neutral-500 focus:border-[#C5A059]" 
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
              }`}
            />
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "all", label: "Tümü" },
              { id: "quote", label: "Teklif" },
              { id: "approved", label: "Onaylandı" },
              { id: "production", label: "Üretimde" },
              { id: "delivered", label: "Teslim" }
            ].map((f) => {
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? (isDarkMode 
                          ? "bg-[#C5A059] text-black font-bold shadow-sm" 
                          : "bg-[#B88E3A] text-white font-bold shadow-sm")
                      : (isDarkMode 
                          ? "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5" 
                          : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200")
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <Archive className="w-12 h-12 mb-3 opacity-25" />
              <p className="text-sm font-bold uppercase tracking-wider">Kayıtlı Sipariş Bulunamadı</p>
              <p className="text-xs opacity-75 mt-1">Arama kriterlerinizi değiştirebilir veya ana ekrandan yeni sipariş oluşturabilirsiniz.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const flags = resolveOrderFlags(order);
              const hasOuter = Boolean(flags.includeOuterFrame && order.outerFrameTitle && order.outerFrameTitle !== "Yok" && order.outerFrameTitle !== "Seçilmedi");
              const hasMat = Boolean(flags.includeInnerMat && order.matInfo && !order.matInfo.toLowerCase().includes("paspartusuz"));
              const hasMiddleMat = Boolean(flags.includeMiddleMat && order.middleMatWidthCm && order.middleMatWidthCm > 0);

              const thumbnailImage = 
                order.renderedFrameDataUrl || 
                order.customPaintingUrl || 
                order.simulatorConfig?.customPaintingUrl || 
                order.simulatorConfig?.renderedFrameDataUrl;

              const innerProfile = profiles.find(p => 
                p.id === order.simulatorConfig?.innerProfileId || 
                cleanFrameName(p.name).toLowerCase() === cleanFrameName(order.innerFrameTitle).toLowerCase()
              );
              const profileTexture = innerProfile?.imageUrl || innerProfile?.textureUrl;
              const itemQuantity = resolveOrderQuantity(order);

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border transition-all p-4 sm:p-5 flex flex-col gap-3.5 ${
                    isDarkMode
                      ? "bg-[#161a22] border-white/10 hover:border-[#C5A059]/40 shadow-sm"
                      : "bg-white border-slate-200 hover:border-[#B88E3A]/50 hover:shadow-md"
                  }`}
                >
                  {/* Ana Bilgi Satırı: 4 Bölümlü Dengeli Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 items-center">
                    {/* 1. Sol Kolon (Yatayda Daraltılmış: 3 Kolon) */}
                    <div className="md:col-span-3 min-w-0 space-y-2">
                      {/* Sipariş No / Adet */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-extrabold text-xs shadow-xs ${
                          isDarkMode 
                            ? "bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30" 
                            : "bg-amber-50 text-amber-900 border border-amber-300"
                        }`}>
                          <FileText className="w-3 h-3 shrink-0" />
                          <span>#{order.orderNumber}</span>
                        </div>
                        <span className="text-neutral-400 font-bold text-xs">/</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-black text-xs border ${
                          isDarkMode 
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                            : "bg-amber-100 text-amber-900 border-amber-300"
                        }`}>
                          <Layers className="w-3 h-3 text-[#C5A059] shrink-0" />
                          <span>{itemQuantity} ADET</span>
                        </div>
                      </div>

                      {/* Müşteri: [Müşteri İsmi] - Tek Satır */}
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}>
                          Müşteri:
                        </span>
                        <span className={`font-bold text-xs sm:text-sm truncate ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`} title={order.customerName}>
                          {order.customerName || "—"}
                        </span>
                      </div>

                      {/* Kayıt Tarihi / Teslim Tarihi (İletişim bilgisi kaldırıldı) */}
                      <div className="flex flex-col gap-0.5 pt-1.5 border-t border-dashed border-neutral-700/20 dark:border-white/5 text-[11px] font-mono">
                        <div className="flex items-center justify-between gap-1 text-neutral-400">
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Kayıt:</span>
                          <span className="truncate text-neutral-400 dark:text-neutral-400 font-medium" title={order.createdAt}>{order.createdAt}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>Teslim:</span>
                          <span className={`font-bold truncate flex items-center gap-1 ${
                            order.deliveryDate 
                              ? (isDarkMode ? "text-amber-400" : "text-amber-800")
                              : (isDarkMode ? "text-neutral-500" : "text-slate-400")
                          }`} title={formatDeliveryDate(order.deliveryDate)}>
                            <Calendar className="w-3 h-3 shrink-0 text-[#C5A059]" />
                            <span>{formatDeliveryDate(order.deliveryDate)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Thumbnail Kolonu (Yatayda Genişletilmiş: 2 Kolon) */}
                    <div className="md:col-span-2 min-w-0 flex items-center justify-center">
                      <div 
                        onClick={() => thumbnailImage && setLightboxImage({ url: thumbnailImage, title: `${order.orderNumber} • ${order.customerName}` })}
                        className={`w-24 h-24 sm:w-28 sm:h-28 md:w-full md:max-w-[125px] md:aspect-square shrink-0 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden transition-all group ${
                          thumbnailImage ? "cursor-pointer hover:border-[#C5A059] hover:shadow-md" : ""
                        } ${
                          isDarkMode ? "bg-[#11141a] border-white/10" : "bg-slate-100 border-slate-200"
                        }`}
                        title={thumbnailImage ? "Tasarımı tam boyutta incelemek için tıklayın" : "Tasarım Önizleme"}
                      >
                        {thumbnailImage ? (
                          <>
                            <img 
                              src={thumbnailImage} 
                              alt={`Tasarım - ${order.orderNumber}`}
                              className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center select-none">
                            {profileTexture ? (
                              <div className="w-10 h-10 rounded-xl border border-[#C5A059]/40 relative overflow-hidden mb-1 flex items-center justify-center bg-stone-100 dark:bg-stone-900 shadow-xs">
                                <img src={profileTexture} alt="Profil" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                <Image className="w-4 h-4 text-[#C5A059] relative z-10 drop-shadow-xs" />
                              </div>
                            ) : (
                              <Image className="w-6 h-6 text-[#C5A059]/70 mb-1" />
                            )}
                            <span className={`text-[10px] font-mono font-bold leading-tight ${
                              isDarkMode ? "text-neutral-400" : "text-slate-600"
                            }`}>
                              {order.artworkWidthCm}×{order.artworkHeightCm}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Detay Kolonu (Yatayda Genişletilmiş: 4 Kolon) */}
                    <div className="md:col-span-4 min-w-0">
                      <div className={`p-3 rounded-xl border space-y-1.5 ${
                        isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200/80"
                      }`}>
                        {/* 1- Tablo Ölçü */}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                          }`}>
                            1- Tablo Ölçü:
                          </span>
                          <span className={`font-mono font-extrabold text-xs tracking-tight text-right ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}>
                            {order.artworkWidthCm} × {order.artworkHeightCm} cm
                          </span>
                        </div>

                        {/* 2- 1. Çerçeve */}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                          }`}>
                            2- 1. Çerçeve:
                          </span>
                          {(() => {
                            const name = cleanFrameName(order.innerFrameTitle) || "Standart Çerçeve";
                            const width = order.frameWidthCm ? ` (${order.frameWidthCm} cm)` : "";
                            return (
                              <span 
                                className={`text-xs font-bold truncate text-right ${isDarkMode ? "text-neutral-100" : "text-slate-900"}`}
                                title={`${name}${width}`}
                              >
                                {name}{width}
                              </span>
                            );
                          })()}
                        </div>

                        {/* 3- İç Paspartu */}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                          }`}>
                            3- İç Paspartu:
                          </span>
                          {hasMat ? (
                            <span className={`text-xs font-semibold truncate text-right ${isDarkMode ? "text-neutral-200" : "text-slate-800"}`}>
                              {order.matInfo}
                            </span>
                          ) : (
                            <span className={`text-xs font-medium text-right ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>
                              Paspartusuz
                            </span>
                          )}
                        </div>

                        {/* 4- Dış Paspartu */}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                          }`}>
                            4- Dış Paspartu:
                          </span>
                          {hasMiddleMat ? (
                            <span className={`text-xs font-semibold truncate text-right ${isDarkMode ? "text-neutral-200" : "text-slate-800"}`}>
                              {order.middleMatWidthCm} cm {order.outerMatColor && !order.outerMatColor.startsWith("#") ? `(${order.outerMatColor}) ` : ""}(3D)
                            </span>
                          ) : (
                            <span className={`text-xs font-medium text-right ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>
                              Yok
                            </span>
                          )}
                        </div>

                        {/* 5- Dış Çerçeve */}
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                          }`}>
                            5- Dış Çerçeve:
                          </span>
                          {hasOuter ? (
                            (() => {
                              const name = cleanFrameName(order.outerFrameTitle) || "Dış Çerçeve";
                              const width = order.outerFrameWidthCm ? ` (${order.outerFrameWidthCm} cm)` : "";
                              return (
                                <span 
                                  className={`text-xs font-bold truncate text-right ${isDarkMode ? "text-neutral-100" : "text-slate-900"}`}
                                  title={`${name}${width}`}
                                >
                                  {name}{width}
                                </span>
                              );
                            })()
                          ) : (
                            <span className={`text-xs font-medium text-right ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>
                              Çerçeve Yok
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. Sağ Kolon: Fiyat ve Butonlar (Yatayda Küçültülmüş: 3 Kolon) */}
                    <div className="md:col-span-3 flex flex-col items-stretch md:items-end justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-neutral-700/20 dark:border-white/10 w-full">
                      {/* Genel Toplam Fiyat (Virgülden sonraki haneler gösterilmez) */}
                      <div className="text-right w-full">
                        <span className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${
                          isDarkMode ? "text-neutral-400" : "text-slate-500"
                        }`}>
                          Genel Toplam
                        </span>
                        <div className={`font-mono font-black text-lg sm:text-xl leading-none tracking-tight ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#9E7728]"
                        }`}>
                          {order.currency}{Math.round(order.totalAmount).toLocaleString("tr-TR")}
                        </div>
                      </div>

                      {/* Simülatöre Aktar Butonu (Yatayda biraz küçüldü) */}
                      <button
                        type="button"
                        onClick={() => {
                          onLoadOrderToWorkspace({
                            ...order,
                            quantity: itemQuantity,
                            simulatorConfig: {
                              ...(order.simulatorConfig || {}),
                              quantity: itemQuantity,
                              orderQuantity: itemQuantity
                            }
                          });
                        }}
                        title="Bu Siparişi Simülatöre Aktar & Düzenle"
                        className={`w-full md:w-auto md:max-w-[155px] self-end flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 border ${
                          isDarkMode
                            ? "bg-[#C5A059] hover:bg-[#b59048] text-black border-[#C5A059]"
                            : "bg-[#B88E3A] hover:bg-[#a17a2b] text-white border-[#B88E3A]"
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                        <span>Simülatöre Aktar</span>
                      </button>

                      {/* Alt Satır: Açılır Menü (Küçültülmüş) ve Sil Butonu (Olduğu gibi) Yan Yana */}
                      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
                        {/* Açılır Menü (Durum Seçici - Biraz küçültüldü) */}
                        <div className="w-full md:w-auto md:min-w-[100px] md:max-w-[115px]">
                          {onUpdateStatus ? (
                            <div className="relative w-full">
                              <select
                                value={order.status}
                                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                                className={`w-full text-[10px] font-bold uppercase font-mono pl-2 pr-5 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition-colors appearance-none ${getStatusStyle(order.status)}`}
                                title="Sipariş Durumunu Değiştir"
                              >
                                <option value="quote" className={isDarkMode ? "bg-neutral-900 text-sky-400" : "bg-white text-sky-700"}>TEKLİF</option>
                                <option value="approved" className={isDarkMode ? "bg-neutral-900 text-emerald-400" : "bg-white text-emerald-700"}>ONAYLANDI</option>
                                <option value="production" className={isDarkMode ? "bg-neutral-900 text-amber-400" : "bg-white text-amber-700"}>ÜRETİMDE</option>
                                <option value="delivered" className={isDarkMode ? "bg-neutral-900 text-purple-400" : "bg-white text-purple-700"}>TESLİM EDİLDİ</option>
                              </select>
                              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>
                          ) : (
                            <span className={`inline-block w-full text-center text-[10px] font-bold uppercase font-mono px-2 py-1.5 rounded-xl border ${getStatusStyle(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          )}
                        </div>

                        {/* Sil Butonu (Olduğu gibi) */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`${order.orderNumber} numaralı siparişi arşivden silmek istediğinize emin misiniz?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          title="Siparişi Sil"
                          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer active:scale-95 shrink-0 ${
                            isDarkMode
                              ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/20 bg-rose-500/10"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50 bg-rose-50/50"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Alt Bilgi Rozetleri: Teslimat Durumu İkonu ve Sipariş Özellikleri */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-dashed border-neutral-700/20 dark:border-white/5">
                    {/* Teslimat Durumu İkonu & Bilgisi (İstek doğrultusunda alt bölüme alındı) */}
                    {order.deliveryMethod === "shipping" ? (
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border flex items-center gap-1.5 ${
                        isDarkMode
                          ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                          : "bg-sky-50 text-sky-700 border-sky-200"
                      }`}>
                        <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>Kargo Teslimat</span>
                        {order.deliveryDate && <span className="opacity-80 font-normal">({order.deliveryDate})</span>}
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border flex items-center gap-1.5 ${
                        isDarkMode
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Atölye / Mağaza Teslim</span>
                        {order.deliveryDate && <span className="opacity-80 font-normal">({order.deliveryDate})</span>}
                      </span>
                    )}

                    {/* Eser Türü */}
                    {flags.includeArtworkPrint ? (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                        isDarkMode
                          ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        🎨 Tuval Baskı
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        isDarkMode
                          ? "bg-white/5 text-neutral-400 border-white/10"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        Müşteri Eseri
                      </span>
                    )}

                    {/* Cam */}
                    {flags.includeGlass ? (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                        isDarkMode
                          ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                          : "bg-sky-50 text-sky-700 border-sky-200"
                      }`}>
                        🪟 Cam Dahil
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        isDarkMode
                          ? "bg-white/5 text-neutral-400 border-white/10"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        Camsız
                      </span>
                    )}

                    {/* MDF Arkalık */}
                    {flags.includeBackingBoard && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        isDarkMode
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        MDF Arkalık
                      </span>
                    )}

                    {/* Kapama Bezi */}
                    {flags.includeBackingCloth && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        isDarkMode
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        Kapama Bezi
                      </span>
                    )}

                    {/* Kraft Bant */}
                    {flags.includeKraftTape && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        isDarkMode
                          ? "bg-stone-500/15 text-stone-300 border-stone-500/30"
                          : "bg-stone-100 text-stone-700 border-stone-200"
                      }`}>
                        Kraft Bant
                      </span>
                    )}

                    {/* Özel İskonto / Fiyat */}
                    {order.customOverridePrice != null && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                        isDarkMode
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        Özel Fiyat
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 sm:px-6 sm:py-3.5 border-t flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#0d1015] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`text-xs font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
            Toplam <strong className={isDarkMode ? "text-white" : "text-slate-900"}>{orders.length}</strong> siparişten <strong className={isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}>{filteredOrders.length}</strong> tanesi gösteriliyor
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl font-bold uppercase text-xs tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm ${
              isDarkMode 
                ? "bg-white/10 hover:bg-white/20 text-white" 
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
          >
            Kapat
          </button>
        </div>
      </div>

      {/* Tasarım Lightbox / Büyütme Modalı */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-2xl w-full rounded-2xl border p-4 shadow-2xl overflow-hidden cursor-default ${
              isDarkMode ? "bg-[#181c24] border-white/15" : "bg-white border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-700/20 dark:border-white/10 mb-3">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#C5A059]">
                {lightboxImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg hover:bg-neutral-500/20 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full max-h-[70vh] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden p-3">
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.title}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg select-none" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
