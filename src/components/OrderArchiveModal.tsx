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
  ChevronDown
} from "lucide-react";
import { OrderArchiveItem, OrderStatus, CompanyProfile, FrameProfileItem } from "../types/pricing";

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
  onDeleteOrder,
  onLoadOrderToWorkspace,
  onUpdateStatus
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border transition-all p-3.5 sm:p-4.5 flex flex-col gap-3 ${
                    isDarkMode
                      ? "bg-[#161a22] border-white/10 hover:border-[#C5A059]/40 shadow-sm"
                      : "bg-white border-slate-200 hover:border-[#B88E3A]/50 hover:shadow-md"
                  }`}
                >
                  {/* Ana Bilgi Satırı: Sipariş No & Müşteri | Malzeme Listesi | Fiyat & Aksiyonlar */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Sipariş No, Tarih & Müşteri Bilgisi (3 Kolon) */}
                    <div className="md:col-span-3 min-w-0">
                      {/* Sipariş No */}
                      <div className="flex items-center gap-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-mono font-bold text-xs ${
                          isDarkMode 
                            ? "bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30" 
                            : "bg-amber-50 text-amber-900 border border-amber-300"
                        }`}>
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>{order.orderNumber}</span>
                        </div>
                      </div>

                      {/* Sipariş Tarihi */}
                      <div className={`text-[11px] font-mono mt-0.5 ${
                        isDarkMode ? "text-neutral-400" : "text-slate-500"
                      }`}>
                        {order.createdAt}
                      </div>

                      {/* Müşteri Adı */}
                      <div className={`font-bold text-sm sm:text-base truncate flex items-center gap-1.5 mt-2 ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}>
                        <User className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-neutral-400" : "text-slate-400"}`} />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      
                      {/* Müşteri Telefonu */}
                      <div className={`text-xs font-mono mt-0.5 flex items-center gap-1.5 ${
                        isDarkMode ? "text-neutral-400" : "text-slate-600"
                      }`}>
                        <Phone className="w-3 h-3 shrink-0 opacity-60" />
                        <span>{order.customerPhone || "Tel Belirtilmedi"}</span>
                      </div>

                      {/* Teslimat Tarihi */}
                      {order.deliveryDate && (
                        <div className={`text-[11px] font-mono mt-1 flex items-center gap-1.5 font-medium ${
                          isDarkMode ? "text-amber-400" : "text-amber-800"
                        }`}>
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>Teslimat: <strong>{order.deliveryDate}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Malzeme Listesi (6 Kolon - Geniş & Detaylı) */}
                    <div className="md:col-span-6 min-w-0 space-y-1">
                      {/* 1- Tablo Ölçü */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}>
                          1- Tablo Ölçü:
                        </span>
                        <span className={`font-mono font-bold text-[11px] tracking-wide ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}>
                          {order.artworkWidthCm} × {order.artworkHeightCm} cm
                        </span>
                      </div>

                      {/* 2- 1. Çerçeve */}
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}>
                          2- 1. Çerçeve:
                        </span>
                        {(() => {
                          const name = cleanFrameName(order.innerFrameTitle) || "Standart Çerçeve";
                          const width = order.frameWidthCm ? ` (${order.frameWidthCm} cm)` : "";
                          return (
                            <span 
                              className={`text-[11px] font-medium truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}
                              title={`${name}${width}`}
                            >
                              {name}{width}
                            </span>
                          );
                        })()}
                      </div>

                      {/* 3- İç Paspartu */}
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}>
                          3- İç Paspartu:
                        </span>
                        {hasMat ? (
                          <span className={`text-[11px] font-medium truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {order.matInfo}
                          </span>
                        ) : (
                          <span className={`text-[11px] font-medium ${isDarkMode ? "text-white/70" : "text-slate-600"}`}>
                            Paspartusuz
                          </span>
                        )}
                      </div>

                      {/* 4- Dış Paspartu */}
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}>
                          4- Dış Paspartu:
                        </span>
                        {hasMiddleMat ? (
                          <span className={`text-[11px] font-medium truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {order.middleMatWidthCm} cm {order.outerMatColor && !order.outerMatColor.startsWith("#") ? `(${order.outerMatColor}) ` : ""}(3D Derinlik)
                          </span>
                        ) : (
                          <span className={`text-[11px] font-medium ${isDarkMode ? "text-white/70" : "text-slate-600"}`}>
                            Yok
                          </span>
                        )}
                      </div>

                      {/* 5- Dış Çerçeve */}
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
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
                                className={`text-[11px] font-medium truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}
                                title={`${name}${width}`}
                              >
                                {name}{width}
                              </span>
                            );
                          })()
                        ) : (
                          <span className={`text-[11px] font-medium ${isDarkMode ? "text-white/70" : "text-slate-600"}`}>
                            Çerçeve Yok
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sağ Kolon: 1 Fiyat, 2 Açılır Menü, 3 Simülatöre Aktar, 4 Sil */}
                    <div className="md:col-span-3 flex flex-col md:items-end justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-neutral-700/20 dark:border-white/10">
                      {/* 1. Fiyat */}
                      <div className="text-right w-full md:w-auto">
                        <div className={`font-mono font-black text-lg sm:text-xl leading-none ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#9E7728]"
                        }`}>
                          {order.currency}{order.totalAmount.toLocaleString("tr-TR")}
                        </div>
                        <div className={`text-[10px] font-medium flex items-center justify-end gap-1 mt-1 ${
                          isDarkMode ? "text-neutral-400" : "text-slate-500"
                        }`}>
                          {order.deliveryMethod === "shipping" ? (
                            <>
                              <Truck className="w-3 h-3 text-sky-400" />
                              <span>Kargo</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3 h-3 text-amber-500" />
                              <span>Atölye Teslim</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 2. Açılır Menü (Durum) */}
                      <div className="w-full md:w-auto">
                        {onUpdateStatus ? (
                          <div className="relative w-full md:w-auto">
                            <select
                              value={order.status}
                              onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                              className={`w-full md:w-auto text-[11px] font-bold uppercase font-mono pl-3 pr-7 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition-colors appearance-none ${getStatusStyle(order.status)}`}
                              title="Sipariş Durumunu Değiştir"
                            >
                              <option value="quote" className={isDarkMode ? "bg-neutral-900 text-sky-400" : "bg-white text-sky-700"}>TEKLİF</option>
                              <option value="approved" className={isDarkMode ? "bg-neutral-900 text-emerald-400" : "bg-white text-emerald-700"}>ONAYLANDI</option>
                              <option value="production" className={isDarkMode ? "bg-neutral-900 text-amber-400" : "bg-white text-amber-700"}>ÜRETİMDE</option>
                              <option value="delivered" className={isDarkMode ? "bg-neutral-900 text-purple-400" : "bg-white text-purple-700"}>TESLİM EDİLDİ</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                        ) : (
                          <span className={`inline-block text-[11px] font-bold uppercase font-mono px-3 py-1.5 rounded-xl border ${getStatusStyle(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        )}
                      </div>

                      {/* 3. Simülatöre Aktar & 4. Sil */}
                      <div className="flex items-center gap-1.5 w-full md:w-auto">
                        {/* 3. Simülatöre Aktar */}
                        <button
                          type="button"
                          onClick={() => {
                            onLoadOrderToWorkspace(order);
                            onClose();
                          }}
                          title="Bu Siparişi Simülatöre Aktar & Düzenle"
                          className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 border ${
                            isDarkMode
                              ? "bg-[#C5A059] hover:bg-[#b59048] text-black border-[#C5A059]"
                              : "bg-[#B88E3A] hover:bg-[#a17a2b] text-white border-[#B88E3A]"
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span>Simülatöre Aktar</span>
                        </button>

                        {/* 4. Sil */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`${order.orderNumber} numaralı siparişi arşivden silmek istediğinize emin misiniz?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          title="Siparişi Sil"
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 active:scale-95 ${
                            isDarkMode
                              ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/20 bg-rose-500/10"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50 bg-rose-50/50"
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Alt Bilgi Rozetleri: Sipariş Özellikleri (Minimal & Şık) */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-dashed border-neutral-700/20 dark:border-white/5">
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
    </div>
  );
};
