import React, { useState } from "react";
import { 
  X, 
  Archive, 
  Search, 
  Printer, 
  Download, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Package, 
  FileText, 
  Filter,
  Calendar,
  User,
  ArrowUpDown,
  RotateCcw,
  Scissors,
  Calculator,
  Tag
} from "lucide-react";
import QRCode from "qrcode";
import { OrderArchiveItem, OrderStatus, CompanyProfile, DEFAULT_UNIT_PRICES } from "../types/pricing";
import { 
  triggerImagePrintWindow, 
  triggerCuttingListPrintWindow, 
  triggerBackLabelPrintWindow, 
  triggerCostBreakdownPrintWindow 
} from "../utils/printHelper";
import { generateCutList, calculateCostsAndPricing } from "../utils/pricing";

interface OrderArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  orders: OrderArchiveItem[];
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
  companyProfile,
  onUpdateStatus
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<OrderArchiveItem | null>(null);

  if (!isOpen) return null;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.innerFrameTitle && order.innerFrameTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "quote":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
            TEKLİF
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ONAYLANDI
          </span>
        );
      case "production":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
            ÜRETİMDE
          </span>
        );
      case "delivered":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-purple-500/15 text-purple-400 border border-purple-500/30">
            TESLİM EDİLDİ
          </span>
        );
      default:
        return null;
    }
  };

  // 1. Sipariş Formu Yazdır
  const handlePrintOrderForm = async (order: OrderArchiveItem) => {
    let qrDataUrl = "";
    try {
      const qrPayload = `https://nakkadekor.com/order/${order.orderNumber}?customer=${encodeURIComponent(order.customerName)}`;
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 140,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (e) {
      console.warn("QR code error:", e);
    }

    const docTitle = `${order.orderNumber}_${order.customerName.replace(/\s+/g, "_")}`;

    // Siparişin gerçek ölçüleri ve profilleri
    const matW = order.matWidthCm ?? order.simulatorConfig?.matWidthCm ?? (order.matInfo && order.matInfo !== "Paspartusuz" ? 5 : 0);
    const frameW = order.frameWidthCm ?? order.simulatorConfig?.frameWidthCm ?? 4;
    const middleMatW = order.middleMatWidthCm ?? order.simulatorConfig?.middleMatWidthCm ?? 0;
    const outerFrameW = order.outerFrameWidthCm ?? order.simulatorConfig?.outerFrameWidthCm ?? 0;
    const totalW = order.artworkWidthCm + 2 * (frameW + matW + middleMatW + outerFrameW);
    const totalH = order.artworkHeightCm + 2 * (frameW + matW + middleMatW + outerFrameW);

    // Siparişin gerçek tasarım görseli (varsa kaydedilmiş tam çerçeveli render çıktısı, yoksa yüklenen görsel, yoksa kurumsal zarif sanat alanı taslağı)
    const artworkImage = order.renderedFrameDataUrl ||
      order.customPaintingUrl || 
      order.simulatorConfig?.customPaintingUrl || 
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <rect width="100%" height="100%" fill="#f8fafc"/>
          <rect x="40" y="40" width="720" height="520" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6,6" rx="8"/>
          <text x="400" y="270" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#1e293b">NAKKA DEKOR ATÖLYE</text>
          <text x="400" y="310" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#64748b">Eser Ölçüsü: ${order.artworkWidthCm} × ${order.artworkHeightCm} cm</text>
          <text x="400" y="340" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">Profil: ${order.innerFrameTitle || 'Standart Profil'} • Bitmiş Ebat: ${totalW.toFixed(1)} × ${totalH.toFixed(1)} cm</text>
        </svg>
      `);

    // Siparişin tüm bileşen bayraklarını (flags) eksiksiz ve güvenli şekilde çöz
    const rawFlags = order.inclusionFlags || order.simulatorConfig?.inclusionFlags || (order.simulatorConfig as any)?.flags || {};
    const effectiveFlags = {
      includeArtworkPrint: rawFlags.includeArtworkPrint ?? Boolean(order.customPaintingFile && order.customPaintingFile !== "Özel Sanat Eseri Baskısı Yok" && order.artworkWidthCm > 0),
      includeInnerMat: rawFlags.includeInnerMat ?? Boolean(matW > 0 || (order.matInfo && order.matInfo !== "Paspartusuz")),
      includeInnerFrame: rawFlags.includeInnerFrame ?? Boolean(frameW > 0 && order.innerFrameTitle !== "Yok" && order.innerFrameTitle !== "Çerçeve Seçilmedi"),
      includeMiddleMat: rawFlags.includeMiddleMat ?? Boolean(middleMatW > 0),
      includeOuterFrame: rawFlags.includeOuterFrame ?? Boolean(outerFrameW > 0 && order.outerFrameTitle && order.outerFrameTitle !== "Yok" && order.outerFrameTitle !== "Çerçeve Seçilmedi"),
      includeGlass: rawFlags.includeGlass ?? true,
      includeBackingBoard: rawFlags.includeBackingBoard ?? true,
      includeBackingCloth: rawFlags.includeBackingCloth ?? true,
      includeKraftTape: rawFlags.includeKraftTape ?? true,
      includeLaborCost: rawFlags.includeLaborCost ?? true,
    };

    triggerImagePrintWindow(
      docTitle,
      artworkImage,
      `${docTitle}.png`,
      {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone || "Belirtilmedi",
        deliveryDate: order.deliveryDate || "Normal Teslim",
        artworkWidth: order.artworkWidthCm,
        artworkHeight: order.artworkHeightCm,
        matWidth: matW,
        middleMatWidth: middleMatW,
        frameWidth: frameW,
        outerFrameWidth: outerFrameW,
        totalW: Math.round(totalW * 10) / 10,
        totalH: Math.round(totalH * 10) / 10,
        customPaintingFile: order.customPaintingFile || order.simulatorConfig?.customPaintingFile || "Kayıtlı Eser Görseli",
        customFrameFile: order.innerFrameTitle || "Standart Profil",
        customOuterFrameFile: order.outerFrameTitle || "Yok",
        innerMatColor: order.innerMatColor || order.simulatorConfig?.innerMatColor || "#FAF9F5",
        outerMatColor: order.outerMatColor || order.simulatorConfig?.outerMatColor || "#FAF9F5",
        effectivePrice: order.totalAmount,
        deliveryMethod: order.deliveryMethod,
        shippingCost: order.deliveryMethod === "shipping" ? 150 : 0,
        qrDataUrl,
        flags: effectiveFlags,
        companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined,
        authorUser: order.authorUser
      }
    );

    setCopiedNotice(`${order.orderNumber} Sipariş Formu yazdırma penceresi açıldı.`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  // 2. Üretim Emri & Kesim Listesi Yazdır
  const handlePrintCuttingList = (order: OrderArchiveItem) => {
    const matW = order.matWidthCm ?? order.simulatorConfig?.matWidthCm ?? (order.matInfo && order.matInfo !== "Paspartusuz" ? 5 : 0);
    const frameW = order.frameWidthCm ?? order.simulatorConfig?.frameWidthCm ?? 4;
    const middleMatW = order.middleMatWidthCm ?? order.simulatorConfig?.middleMatWidthCm ?? 0;
    const outerFrameW = order.outerFrameWidthCm ?? order.simulatorConfig?.outerFrameWidthCm ?? 0;

    const rawFlags = order.inclusionFlags || order.simulatorConfig?.inclusionFlags || (order.simulatorConfig as any)?.flags || {};
    const flags = {
      includeArtworkPrint: rawFlags.includeArtworkPrint ?? Boolean(order.customPaintingFile && order.customPaintingFile !== "Özel Sanat Eseri Baskısı Yok" && order.artworkWidthCm > 0),
      includeInnerMat: rawFlags.includeInnerMat ?? Boolean(matW > 0 || (order.matInfo && order.matInfo !== "Paspartusuz")),
      includeInnerFrame: rawFlags.includeInnerFrame ?? Boolean(frameW > 0 && order.innerFrameTitle !== "Yok" && order.innerFrameTitle !== "Çerçeve Seçilmedi"),
      includeMiddleMat: rawFlags.includeMiddleMat ?? Boolean(middleMatW > 0),
      includeOuterFrame: rawFlags.includeOuterFrame ?? Boolean(outerFrameW > 0 && order.outerFrameTitle && order.outerFrameTitle !== "Yok" && order.outerFrameTitle !== "Çerçeve Seçilmedi"),
      includeGlass: rawFlags.includeGlass ?? true,
      includeBackingBoard: rawFlags.includeBackingBoard ?? true,
      includeBackingCloth: rawFlags.includeBackingCloth ?? true,
      includeKraftTape: rawFlags.includeKraftTape ?? true,
      includeLaborCost: rawFlags.includeLaborCost ?? true,
    };

    const cutList = generateCutList({
      artworkWidthCm: order.artworkWidthCm,
      artworkHeightCm: order.artworkHeightCm,
      matWidthCm: matW,
      frameWidthCm: frameW,
      middleMatWidthCm: middleMatW,
      outerFrameWidthCm: outerFrameW,
      innerFrameCode: order.innerFrameTitle,
      outerFrameCode: order.outerFrameTitle,
      innerMatColor: order.innerMatColor || order.simulatorConfig?.innerMatColor || "#FAF9F5",
      outerMatColor: order.outerMatColor || order.simulatorConfig?.outerMatColor || "#FAF9F5",
      flags,
      orderNumber: order.orderNumber
    });

    triggerCuttingListPrintWindow({
      cutList,
      customerName: order.customerName,
      deliveryDate: order.deliveryDate || "Normal Teslim",
      artworkWidthCm: order.artworkWidthCm,
      artworkHeightCm: order.artworkHeightCm,
      companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined
    });

    setCopiedNotice(`${order.orderNumber} Üretim Emri & Kesim Listesi açıldı.`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  // 3. 4x4 cm Tablo Arka Etiketi Yazdır
  const handlePrintBackLabel = async (order: OrderArchiveItem) => {
    const matW = order.matWidthCm ?? order.simulatorConfig?.matWidthCm ?? (order.matInfo && order.matInfo !== "Paspartusuz" ? 5 : 0);
    const frameW = order.frameWidthCm ?? order.simulatorConfig?.frameWidthCm ?? 4;
    const middleMatW = order.middleMatWidthCm ?? order.simulatorConfig?.middleMatWidthCm ?? 0;
    const outerFrameW = order.outerFrameWidthCm ?? order.simulatorConfig?.outerFrameWidthCm ?? 0;
    const totalW = order.artworkWidthCm + 2 * (frameW + matW + middleMatW + outerFrameW);
    const totalH = order.artworkHeightCm + 2 * (frameW + matW + middleMatW + outerFrameW);

    let qrDataUrl = "";
    try {
      const qrText = `SİPARİŞ NO: ${order.orderNumber}
MÜŞTERİ: ${order.customerName}
ESER: ${order.artworkWidthCm}x${order.artworkHeightCm} cm
DIŞ EBAT: ${totalW.toFixed(1)}x${totalH.toFixed(1)} cm
TARİH: ${order.createdAt}
ATÖLYE: ${companyProfile?.companyName || 'Nakka Dekor'}`;

      qrDataUrl = await QRCode.toDataURL(qrText, {
        width: 180,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (e) {
      console.warn("QR creation error:", e);
    }

    triggerBackLabelPrintWindow({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      artworkWidthCm: order.artworkWidthCm,
      artworkHeightCm: order.artworkHeightCm,
      finalOuterWidthCm: Math.round(totalW * 10) / 10,
      finalOuterHeightCm: Math.round(totalH * 10) / 10,
      frameProfileName: order.innerFrameTitle,
      createdAt: order.createdAt,
      companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined,
      qrDataUrl
    });

    setCopiedNotice(`${order.orderNumber} 4x4 cm Tablo Arka Etiketi açıldı.`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  // 4. Maliyet Tablosu Yazdır
  const handlePrintCostBreakdown = (order: OrderArchiveItem) => {
    const matW = order.matWidthCm ?? order.simulatorConfig?.matWidthCm ?? (order.matInfo && order.matInfo !== "Paspartusuz" ? 5 : 0);
    const frameW = order.frameWidthCm ?? order.simulatorConfig?.frameWidthCm ?? 4;
    const middleMatW = order.middleMatWidthCm ?? order.simulatorConfig?.middleMatWidthCm ?? 0;
    const outerFrameW = order.outerFrameWidthCm ?? order.simulatorConfig?.outerFrameWidthCm ?? 0;

    const rawFlags = order.inclusionFlags || order.simulatorConfig?.inclusionFlags || (order.simulatorConfig as any)?.flags || {};
    const flags = {
      includeArtworkPrint: rawFlags.includeArtworkPrint ?? Boolean(order.customPaintingFile && order.customPaintingFile !== "Özel Sanat Eseri Baskısı Yok" && order.artworkWidthCm > 0),
      includeInnerMat: rawFlags.includeInnerMat ?? Boolean(matW > 0 || (order.matInfo && order.matInfo !== "Paspartusuz")),
      includeInnerFrame: rawFlags.includeInnerFrame ?? Boolean(frameW > 0 && order.innerFrameTitle !== "Yok" && order.innerFrameTitle !== "Çerçeve Seçilmedi"),
      includeMiddleMat: rawFlags.includeMiddleMat ?? Boolean(middleMatW > 0),
      includeOuterFrame: rawFlags.includeOuterFrame ?? Boolean(outerFrameW > 0 && order.outerFrameTitle && order.outerFrameTitle !== "Yok" && order.outerFrameTitle !== "Çerçeve Seçilmedi"),
      includeGlass: rawFlags.includeGlass ?? true,
      includeBackingBoard: rawFlags.includeBackingBoard ?? true,
      includeBackingCloth: rawFlags.includeBackingCloth ?? true,
      includeKraftTape: rawFlags.includeKraftTape ?? true,
      includeLaborCost: rawFlags.includeLaborCost ?? true,
    };

    const breakdown = calculateCostsAndPricing({
      artworkWidthCm: order.artworkWidthCm,
      artworkHeightCm: order.artworkHeightCm,
      matWidthCm: matW,
      frameWidthCm: frameW,
      middleMatWidthCm: middleMatW,
      outerFrameWidthCm: outerFrameW,
      deliveryMethod: order.deliveryMethod,
      customShippingCost: order.deliveryMethod === "shipping" ? 150 : 0,
      customOverridePrice: order.totalAmount,
      flags,
      settings: DEFAULT_UNIT_PRICES
    });

    triggerCostBreakdownPrintWindow({
      breakdown,
      settings: DEFAULT_UNIT_PRICES,
      artworkWidthCm: order.artworkWidthCm,
      artworkHeightCm: order.artworkHeightCm,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deliveryDate: order.deliveryDate || "Normal Teslim",
      flags,
      companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined
    });

    setCopiedNotice(`${order.orderNumber} Maliyet Analiz Tablosu açıldı.`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className={`w-full max-w-5xl rounded-none sm:rounded-3xl border-0 sm:border shadow-2xl flex flex-col overflow-hidden h-[100dvh] sm:h-[88vh] max-h-[100dvh] sm:max-h-[850px] transition-all ${
        isDarkMode ? "bg-[#14171d] border-[#C5A059]/30 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        
        {/* Header (Mobil & Masaüstü Düzenli) */}
        <div className={`px-3.5 py-3 sm:px-6 sm:py-4 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shrink-0 ${
              isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30" : "bg-[#B88E3A]/20 text-[#B88E3A]"
            }`}>
              <Archive className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base md:text-lg font-black tracking-wider uppercase flex items-center gap-2 truncate">
                SİPARİŞ ARŞİVİ
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold uppercase bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 shrink-0">
                  {orders.length}
                </span>
              </h2>
              <p className={`text-[10px] sm:text-xs truncate ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Kayıtlı siparişler ve üretim dökümleri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center ${
              isDarkMode ? "hover:bg-neutral-800 text-neutral-400 hover:text-white active:bg-neutral-700" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900 active:bg-slate-300"
            }`}
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Filter Bar */}
        <div className={`px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 ${
          isDarkMode ? "bg-[#0d0f13] border-white/10" : "bg-slate-100/70 border-slate-200"
        }`}>
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? "text-neutral-500" : "text-slate-400"
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Müşteri adı veya sipariş no..."
              className={`w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-xl border text-base sm:text-xs focus:outline-none transition-colors ${
                isDarkMode 
                  ? "bg-[#14171d] border-white/15 text-white placeholder-neutral-500 focus:border-[#C5A059]" 
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
              }`}
            />
          </div>

          {/* Status Filter buttons (Yatay Kaydırılabilir Dokunmatik Şerit) */}
          <div 
            data-drag-scroll="true"
            className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto drag-scroll touch-pan-x overscroll-x-contain py-1 select-none no-scrollbar"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 hidden lg:inline">Durum:</span>
            {[
              { id: "all", label: "Tümü" },
              { id: "quote", label: "Teklif" },
              { id: "approved", label: "Onaylandı" },
              { id: "production", label: "Üretimde" },
              { id: "delivered", label: "Teslim" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                  statusFilter === f.id
                    ? (isDarkMode ? "bg-[#C5A059] text-black font-bold shadow-xs" : "bg-[#B88E3A] text-white font-bold shadow-xs")
                    : (isDarkMode ? "bg-white/5 text-neutral-400 hover:text-white border border-white/5" : "bg-white text-slate-600 border border-slate-200")
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toast / Copied notice */}
        {copiedNotice && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-4 sm:px-6 py-2 text-xs font-mono flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{copiedNotice}</span>
          </div>
        )}

        {/* List Body (Mobilde Kartlar, Masaüstünde Tablo) */}
        <div 
          data-allow-native-scroll="true"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-0 allow-native-scroll"
        >
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 sm:p-12 text-center text-neutral-500">
              <Archive className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-wider">Kayıtlı Sipariş Yok</p>
              <p className="text-xs text-neutral-400 mt-1">Aramayı değiştirebilir veya ana ekrandan yeni sipariş oluşturabilirsiniz.</p>
            </div>
          ) : (
            <>
              {/* MOBİL GÖRÜNÜM: Dokunmatik Ekranlara Özel Kartlar (md:hidden) */}
              <div className="block md:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={`m-${order.id}`}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDarkMode
                        ? "bg-[#101217] border-white/10 hover:border-[#C5A059]/40"
                        : "bg-white border-slate-200 hover:border-[#B88E3A]/40 shadow-xs"
                    }`}
                  >
                    {/* Üst Satır: Sipariş No & Durum */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 dark:border-white/10 border-slate-100">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#C5A059]">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{order.orderNumber}</span>
                      </div>
                      <div>
                        {onUpdateStatus ? (
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={`text-[10px] font-bold uppercase font-mono px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                              order.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : order.status === "production"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : order.status === "delivered"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            }`}
                          >
                            <option value="quote" className="bg-neutral-900 text-blue-400">TEKLİF</option>
                            <option value="approved" className="bg-neutral-900 text-emerald-400">ONAYLANDI</option>
                            <option value="production" className="bg-neutral-900 text-amber-400">ÜRETİMDE</option>
                            <option value="delivered" className="bg-neutral-900 text-purple-400">TESLİM EDİLDİ</option>
                          </select>
                        ) : (
                          getStatusBadge(order.status)
                        )}
                      </div>
                    </div>

                    {/* Orta Kısım: Müşteri, Ölçü & Fiyat */}
                    <div className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-bold text-sm truncate">
                          {order.customerName}
                        </div>
                        <div className="font-mono font-black text-sm text-[#C5A059] shrink-0">
                          {order.currency}{order.totalAmount.toLocaleString("tr-TR")}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>{order.customerPhone || "Tel: -"}</span>
                        <span className="font-mono">{order.deliveryMethod === "shipping" ? "🚚 Kargo Dahil" : "🏪 Atölye Teslim"}</span>
                      </div>

                      <div className="bg-white/5 dark:bg-white/5 p-2 rounded-xl flex items-center justify-between text-[11px]">
                        <div className="truncate pr-2">
                          <span className="font-mono font-semibold text-[#C5A059]">{order.artworkWidthCm}×{order.artworkHeightCm} cm</span>
                          <span className="text-neutral-400 mx-1">•</span>
                          <span className="text-neutral-300">{order.innerFrameTitle || "Çerçeve Belirtilmedi"}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 shrink-0 font-mono">
                          {order.createdAt?.split(" ")[0] || ""}
                        </div>
                      </div>
                    </div>

                    {/* Alt İşlem Butonları (Mobilde Parmak Dostu 4'lü Bar) */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10 dark:border-white/10 border-slate-100">
                      {/* 1. YAZDIR */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForPrint(order)}
                        className={`col-span-2 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer border ${
                          isDarkMode 
                            ? "bg-[#C5A059] text-black border-[#d4ae61] hover:bg-[#b8944c]" 
                            : "bg-[#B88E3A] text-white border-[#a88031] hover:bg-[#a17a2b]"
                        }`}
                        title="Yazdır"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>YAZDIR</span>
                      </button>

                      {/* 2. SİMÜLATÖRE AKTAR */}
                      <button
                        type="button"
                        onClick={() => {
                          onLoadOrderToWorkspace(order);
                          onClose();
                        }}
                        title="Simülatöre Aktar"
                        className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                          isDarkMode 
                            ? "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25" 
                            : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Yükle</span>
                      </button>

                      {/* 3. SİL */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`${order.orderNumber} numaralı siparişi silmek istediğinize emin misiniz?`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        title="Sil"
                        className="flex items-center justify-center py-2 px-2 rounded-xl border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* MASAÜSTÜ GÖRÜNÜM: Detaylı Tablo (hidden md:block) */}
              <div 
                data-allow-native-scroll="true"
                className="hidden md:block overflow-x-auto allow-native-scroll"
              >
                <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-mono tracking-wider ${
                    isDarkMode ? "bg-[#101217] border-white/10 text-neutral-400" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>
                    <th className="py-3 px-4">Tarih &amp; No</th>
                    <th className="py-3 px-4">Müşteri Bilgisi</th>
                    <th className="py-3 px-4">Eser Ölçüsü &amp; Profil</th>
                    <th className="py-3 px-4 text-right">Toplam Tutar</th>
                    <th className="py-3 px-4 text-center">Durum</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700/30 text-xs">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`transition-colors ${
                        isDarkMode ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Tarih & Siparis No */}
                      <td className="py-3.5 px-4 align-top font-mono">
                        <div className="font-bold text-[#C5A059] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{order.orderNumber}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {order.createdAt}
                        </div>
                        {order.authorUser && (
                          <div className="text-[10px] text-neutral-500">
                            Yetkili: {order.authorUser.split(" ")[0]}
                          </div>
                        )}
                      </td>

                      {/* Musteri */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          {order.customerPhone || "Telefon Belirtilmedi"}
                        </div>
                        {order.deliveryDate && (
                          <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                            Teslim: {order.deliveryDate}
                          </div>
                        )}
                      </td>

                      {/* Olcu & Profil */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold font-mono">
                          {order.artworkWidthCm} × {order.artworkHeightCm} cm
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                          {order.innerFrameTitle}
                        </div>
                        {order.matInfo && (
                          <div className="text-[10px] text-neutral-500">
                            {order.matInfo}
                          </div>
                        )}
                      </td>

                      {/* Tutar */}
                      <td className="py-3.5 px-4 align-top text-right font-mono">
                        <div className="text-sm font-black text-[#C5A059]">
                          {order.currency}{order.totalAmount.toLocaleString("tr-TR")}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {order.deliveryMethod === "shipping" ? "Kargo Dahil" : "Atölye Teslim"}
                        </div>
                      </td>

                      {/* Durum */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {onUpdateStatus ? (
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={`text-[10px] font-bold uppercase font-mono px-2 py-1 rounded border cursor-pointer focus:outline-none transition-colors ${
                              order.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : order.status === "production"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : order.status === "delivered"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            }`}
                            title="Sipariş durumunu değiştirmek için seçiniz"
                          >
                            <option value="quote" className="bg-neutral-900 text-blue-400">TEKLİF</option>
                            <option value="approved" className="bg-neutral-900 text-emerald-400">ONAYLANDI</option>
                            <option value="production" className="bg-neutral-900 text-amber-400">ÜRETİMDE</option>
                            <option value="delivered" className="bg-neutral-900 text-purple-400">TESLİM EDİLDİ</option>
                          </select>
                        ) : (
                          getStatusBadge(order.status)
                        )}
                      </td>

                      {/* Islemler */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* YAZDIR BUTONU (Öne Çıkan) */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForPrint(order)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer border ${
                              isDarkMode 
                                ? "bg-[#C5A059] text-black border-[#d4ae61] hover:bg-[#b8944c]" 
                                : "bg-[#B88E3A] text-white border-[#a88031] hover:bg-[#a17a2b]"
                            }`}
                            title="Bu Siparişin Belgelerini Yazdır (Sipariş Formu, Üretim Emri, 4x4 Etiket, Maliyet)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>YAZDIR</span>
                          </button>

                          {/* Quick 4x4 cm Label Button */}
                          <button
                            type="button"
                            onClick={() => handlePrintBackLabel(order)}
                            title="Hızlı 4x4 cm Tablo Arka Etiketi Yazdır"
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isDarkMode 
                                ? "bg-white/5 border-white/10 hover:border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10" 
                                : "bg-slate-100 border-slate-200 hover:border-[#B88E3A] text-[#B88E3A] hover:bg-amber-50"
                            }`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Simulatore Yukle */}
                          <button
                            type="button"
                            onClick={() => {
                              onLoadOrderToWorkspace(order);
                              onClose();
                            }}
                            title="Bu Siparişi Simülatöre Aktar & Düzenle"
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold tracking-tight transition-all active:scale-95 cursor-pointer ${
                              isDarkMode 
                                ? "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25 hover:border-blue-400" 
                                : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                            <span>Simülatöre Aktar</span>
                          </button>

                          {/* Sil */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`${order.orderNumber} numaralı siparişi arşivden silmek istediğinize emin misiniz?`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            title="Arşivden Sil"
                            className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {/* Footer (Mobil ve Masaüstü Uyumlu) */}
        <div className={`p-3.5 sm:p-5 border-t flex items-center justify-between shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="text-[11px] sm:text-xs text-neutral-400 font-mono">
            Toplam <strong className={isDarkMode ? "text-white" : "text-slate-900"}>{orders.length}</strong> siparişten <strong className="text-[#C5A059]">{filteredOrders.length}</strong> tanesi listeleniyor
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 sm:px-6 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b8944c] text-black font-bold uppercase text-xs tracking-wider cursor-pointer active:scale-95 shadow-sm min-h-[38px]"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* ARŞİV SİPARİŞ YAZDIRMA POPUP'I (4 BELGE SEÇENEĞİ) */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDarkMode ? "bg-[#14171d] border-[#C5A059]/40 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            {/* Sub-Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/20 text-[#B88E3A]"
                }`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                    <span>YAZDIRMA SEÇENEKLERİ</span>
                    <span className="text-[#C5A059] font-mono">#{selectedOrderForPrint.orderNumber}</span>
                  </h3>
                  <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    Müşteri: {selectedOrderForPrint.customerName} • Ebat: {selectedOrderForPrint.artworkWidthCm}×{selectedOrderForPrint.artworkHeightCm} cm
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderForPrint(null)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode ? "hover:bg-white/10 text-neutral-400 hover:text-white" : "hover:bg-slate-200 text-slate-600"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Document Options List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              
              {/* 1. Siparis Formu */}
              <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 ${
                isDarkMode ? "bg-[#181b22] border-white/10 hover:border-blue-500/50" : "bg-slate-50 border-slate-200 hover:border-blue-500/50"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">1. Sipariş Formu (A4 PDF)</h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Müşteri onay formu, firma logosu, teslim tarihi, milimetrik ölçü listesi, QR kodu ve imza alanı.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintOrderForm(selectedOrderForPrint);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>

              {/* 2. Uretim Emri & Kesim Listesi */}
              <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 ${
                isDarkMode ? "bg-[#181b22] border-white/10 hover:border-amber-500/50" : "bg-slate-50 border-slate-200 hover:border-amber-500/50"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">2. Üretim Emri & Kesim Listesi (A4)</h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Atölye ve marangoz için milimetrik 45° gönye kesim ölçüleri, bini payları, arkalık, cam ve montaj sırası.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintCuttingList(selectedOrderForPrint);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>

              {/* 3. Tablo Arka Etiketi (4x4 cm Barkod) */}
              <div className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 ${
                isDarkMode ? "bg-[#181b22] border-[#C5A059]/40 hover:border-[#C5A059]" : "bg-amber-50/50 border-[#B88E3A]/40 hover:border-[#B88E3A]"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#C5A059]/20 text-[#C5A059] shrink-0 mt-0.5">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">3. Tablo Arka Etiketi (4x4 cm)</h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#C5A059] text-black">YENİ</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Çerçeve arkasına yapıştırmak için kurumsal etiket: Logo, müşteri adı, sipariş no ve Code39 barkod.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintBackLabel(selectedOrderForPrint);
                  }}
                  className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                    isDarkMode ? "bg-[#C5A059] hover:bg-[#b8944c] text-black" : "bg-[#B88E3A] hover:bg-[#a17a2b] text-white"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>

              {/* 4. Maliyet Tablosu */}
              <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 ${
                isDarkMode ? "bg-[#181b22] border-white/10 hover:border-emerald-500/50" : "bg-slate-50 border-slate-200 hover:border-emerald-500/50"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">4. Maliyet Tablosu & Analiz</h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Hammadde, sarf malzemeler, işçilik, kâr marjı ve KDV finansal hesap dökümü.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintCostBreakdown(selectedOrderForPrint);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>

            </div>

            {/* Sub-Modal Footer */}
            <div className={`p-4 border-t flex justify-end shrink-0 ${
              isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setSelectedOrderForPrint(null)}
                className={`px-4 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  isDarkMode ? "border-white/10 hover:bg-white/10 text-neutral-300" : "border-slate-300 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
