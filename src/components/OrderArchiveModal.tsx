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
      const qrPayload = `https://nakka.decor/order/${order.orderNumber}?customer=${encodeURIComponent(order.customerName)}`;
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 140,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch (e) {
      console.warn("QR code error:", e);
    }

    const docTitle = `${order.orderNumber}_${order.customerName.replace(/\s+/g, "_")}`;
    triggerImagePrintWindow(
      docTitle,
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop",
      `${docTitle}.png`,
      {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone || "Belirtilmedi",
        deliveryDate: order.deliveryDate || "Normal Teslim",
        artworkWidth: order.artworkWidthCm,
        artworkHeight: order.artworkHeightCm,
        matWidth: 5,
        middleMatWidth: 0,
        frameWidth: 4,
        outerFrameWidth: 0,
        totalW: order.artworkWidthCm + 18,
        totalH: order.artworkHeightCm + 18,
        customPaintingFile: "Arşivlenmiş Eser",
        customFrameFile: order.innerFrameTitle,
        customOuterFrameFile: order.outerFrameTitle,
        effectivePrice: order.totalAmount,
        deliveryMethod: order.deliveryMethod,
        shippingCost: order.deliveryMethod === "shipping" ? 150 : 0,
        qrDataUrl,
        companyProfile: companyProfile.includeInQuotes ? companyProfile : undefined,
        authorUser: order.authorUser
      }
    );

    setCopiedNotice(`${order.orderNumber} Sipariş Formu yazdırma penceresi açıldı.`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  // 2. Üretim Emri & Kesim Listesi Yazdır
  const handlePrintCuttingList = (order: OrderArchiveItem) => {
    const cutList = generateCutList({
      artworkWidthCm: order.artworkWidthCm,
      artworkHeightCm: order.artworkHeightCm,
      matWidthCm: 5,
      frameWidthCm: 4,
      middleMatWidthCm: 0,
      outerFrameWidthCm: 0,
      innerFrameCode: order.innerFrameTitle,
      outerFrameCode: order.outerFrameTitle,
      innerMatColor: "#FAF9F5",
      outerMatColor: "#FAF9F5",
      flags: {
        includeArtworkPrint: false,
        includeInnerMat: order.matInfo !== "Paspartusuz",
        includeInnerFrame: true,
        includeMiddleMat: false,
        includeOuterFrame: Boolean(order.outerFrameTitle && order.outerFrameTitle !== "Yok"),
        includeGlass: true,
        includeBackingBoard: true,
        includeBackingCloth: true,
        includeKraftTape: true,
        includeLaborCost: true
      },
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
    let qrDataUrl = "";
    try {
      const qrText = `SİPARİŞ NO: ${order.orderNumber}
MÜŞTERİ: ${order.customerName}
ESER: ${order.artworkWidthCm}x${order.artworkHeightCm} cm
DIŞ EBAT: ${(order.artworkWidthCm + 18).toFixed(1)}x${(order.artworkHeightCm + 18).toFixed(1)} cm
TARİH: ${order.createdAt}
ATÖLYE: ${companyProfile?.companyName || 'Nakka Decor'}`;

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
      finalOuterWidthCm: order.artworkWidthCm + 18,
      finalOuterHeightCm: order.artworkHeightCm + 18,
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
    const flags = {
      includeArtworkPrint: false,
      includeInnerMat: order.matInfo !== "Paspartusuz",
      includeInnerFrame: true,
      includeMiddleMat: false,
      includeOuterFrame: Boolean(order.outerFrameTitle && order.outerFrameTitle !== "Yok"),
      includeGlass: true,
      includeBackingBoard: true,
      includeBackingCloth: true,
      includeKraftTape: true,
      includeLaborCost: true
    };

    const breakdown = calculateCostsAndPricing({
      artworkWidthCm: order.artworkWidthCm,
      artworkHeightCm: order.artworkHeightCm,
      matWidthCm: 5,
      frameWidthCm: 4,
      middleMatWidthCm: 0,
      outerFrameWidthCm: 0,
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

    setCopiedNotice(`${order.orderNumber} Maliyet Tablosu açıldı.`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className={`w-full max-w-5xl rounded-3xl border shadow-2xl flex flex-col overflow-hidden max-h-[92vh] transition-all ${
        isDarkMode ? "bg-[#14171d] border-[#C5A059]/30 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        
        {/* Header */}
        <div className={`p-5 md:p-6 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30" : "bg-[#B88E3A]/20 text-[#B88E3A]"
            }`}>
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-wider uppercase flex items-center gap-2">
                GEÇMİŞ SİPARİŞLER &amp; ARŞİV
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40">
                  {orders.length} KAYIT
                </span>
              </h2>
              <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Oluşturulan tüm çerçeve siparişleri, müşteri teklifleri ve PDF döküm arşivi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Filter Bar */}
        <div className={`px-6 py-3.5 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
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
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                isDarkMode 
                  ? "bg-[#14171d] border-white/15 text-white placeholder-neutral-500 focus:border-[#C5A059]" 
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
              }`}
            />
          </div>

          {/* Status Filter buttons */}
          <div 
            data-drag-scroll="true"
            className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto drag-scroll select-none"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 hidden md:inline">Durum:</span>
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
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === f.id
                    ? (isDarkMode ? "bg-[#C5A059] text-black font-bold" : "bg-[#B88E3A] text-white font-bold")
                    : (isDarkMode ? "bg-white/5 text-neutral-400 hover:text-white" : "bg-white text-slate-600 border border-slate-200")
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toast / Copied notice */}
        {copiedNotice && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-6 py-2 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {/* Table Body - Stabilized height */}
        <div className="flex-1 overflow-y-auto min-h-[480px]">
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-neutral-500">
              <Archive className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-wider">Kayıtlı Sipariş Bulunamadı</p>
              <p className="text-xs text-neutral-400 mt-1">Arama kriterlerinizi değiştirebilir veya ana ekrandan yeni sipariş oluşturabilirsiniz.</p>
            </div>
          ) : (
            <div 
              data-drag-scroll="true"
              className="overflow-x-auto drag-scroll"
            >
              <table className="w-full text-left border-collapse">
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
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isDarkMode 
                                ? "bg-[#181b22] border-white/10 text-neutral-300 hover:text-white hover:border-white/30" 
                                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 md:p-5 border-t flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="text-xs text-neutral-400 font-mono">
            Toplam {orders.length} siparişten {filteredOrders.length} tanesi listeleniyor
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#C5A059] text-black font-bold uppercase text-xs tracking-wider cursor-pointer hover:bg-[#b8944c]"
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
            <div className="p-5 overflow-y-auto space-y-3">
              
              {/* 1. Siparis Formu */}
              <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                isDarkMode ? "bg-[#181b22] border-white/10 hover:border-blue-500/50" : "bg-slate-50 border-slate-200 hover:border-blue-500/50"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">1. Sipariş Formu (A4 PDF)</h4>
                    <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Müşteri onay formu, firma logosu, teslim tarihi, milimetrik ölçü listesi, QR kodu ve imza alanı.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintOrderForm(selectedOrderForPrint);
                    setSelectedOrderForPrint(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>

              {/* 2. Uretim Emri & Kesim Listesi */}
              <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                isDarkMode ? "bg-[#181b22] border-white/10 hover:border-amber-500/50" : "bg-slate-50 border-slate-200 hover:border-amber-500/50"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">2. Üretim Emri & Kesim Listesi (A4)</h4>
                    <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Atölye ve marangoz için milimetrik 45° gönye kesim ölçüleri, bini payları, arkalık, cam ve montaj sırası.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintCuttingList(selectedOrderForPrint);
                    setSelectedOrderForPrint(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>

              {/* 3. Tablo Arka Etiketi (4x4 cm Barkod) */}
              <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                isDarkMode ? "bg-[#181b22] border-[#C5A059]/40 hover:border-[#C5A059]" : "bg-amber-50/50 border-[#B88E3A]/40 hover:border-[#B88E3A]"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#C5A059]/20 text-[#C5A059] shrink-0 mt-0.5">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">3. Tablo Arka Etiketi (4x4 cm)</h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#C5A059] text-black">YENİ</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Çerçeve arkasına yapıştırmak için kurumsal etiket: Logo, müşteri adı, sipariş no ve Code39 barkod.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintBackLabel(selectedOrderForPrint);
                    setSelectedOrderForPrint(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isDarkMode ? "bg-[#C5A059] hover:bg-[#b8944c] text-black" : "bg-[#B88E3A] hover:bg-[#a17a2b] text-white"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>

              {/* 4. Maliyet Tablosu */}
              <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                isDarkMode ? "bg-[#181b22] border-white/10 hover:border-emerald-500/50" : "bg-slate-50 border-slate-200 hover:border-emerald-500/50"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">4. Maliyet Tablosu & Analiz</h4>
                    <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Hammadde, sarf malzemeler, işçilik, kâr marjı ve KDV finansal hesap dökümü.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintCostBreakdown(selectedOrderForPrint);
                    setSelectedOrderForPrint(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
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
