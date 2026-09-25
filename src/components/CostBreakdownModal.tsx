import React, { useState, useRef } from "react";
import { X, DollarSign, Calculator, Percent, Check, Tag, Info, ArrowRight, Printer, CheckSquare, Square, Lock, Unlock, ShieldCheck } from "lucide-react";
import { CostCalculationBreakdown, UnitPricesSettings, MaterialInclusionFlags } from "../types/pricing";
import { triggerCostBreakdownPrintWindow } from "../utils/printHelper";

interface CostBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: CostCalculationBreakdown;
  settings: UnitPricesSettings;
  customOverridePrice: number | null;
  onSetCustomOverridePrice: (price: number | null) => void;
  artworkWidthCm: number;
  artworkHeightCm: number;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  flags: MaterialInclusionFlags;
  onToggleFlag: (flagKey: keyof MaterialInclusionFlags) => void;
  isDarkMode?: boolean;
  isShopMode?: boolean;
  isOrderCreated?: boolean;
}

export function CostBreakdownModal({
  isOpen,
  onClose,
  breakdown,
  settings,
  customOverridePrice,
  onSetCustomOverridePrice,
  artworkWidthCm,
  artworkHeightCm,
  orderNumber,
  customerName,
  deliveryDate,
  flags,
  onToggleFlag,
  isDarkMode = true,
  isShopMode = false,
  isOrderCreated = false
}: CostBreakdownModalProps) {
  const [overrideInput, setOverrideInput] = useState<string>(
    customOverridePrice ? customOverridePrice.toString() : ""
  );
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleApplyOverride = () => {
    const val = parseFloat(overrideInput);
    if (!isNaN(val) && val > 0) {
      onSetCustomOverridePrice(val);
    } else {
      onSetCustomOverridePrice(null);
      setOverrideInput("");
    }
  };

  const handleClearOverride = () => {
    onSetCustomOverridePrice(null);
    setOverrideInput("");
  };

  const handlePrint = () => {
    if (!isOrderCreated) {
      alert("⚠️ Maliyet tablosunu yazdırmak için lütfen önce 'Siparişi Oluştur' butonuna basarak siparişi kaydediniz.");
      return;
    }
    triggerCostBreakdownPrintWindow({
      breakdown,
      settings,
      artworkWidthCm,
      artworkHeightCm,
      orderNumber,
      customerName,
      deliveryDate,
      flags
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className={`relative w-full max-w-4xl border-0 sm:border rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] ${
        isDarkMode 
          ? "bg-[#14171a] border-[#C5A059]/40 text-white" 
          : "bg-white border-[#cbd5e1] text-slate-900"
      }`}>
        
        {/* Header (Mobil & Masaüstü Yeniden Düzenlenmiş) */}
        <div className={`px-3.5 sm:px-6 py-2.5 sm:py-4 border-b shrink-0 print:hidden ${
          isDarkMode ? "bg-[#1c2026] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
        }`}>
          {/* Üst Satır: İkon, Başlık ve Aksiyonlar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059]" : "bg-[#B88E3A]/10 border-[#B88E3A]/30 text-[#B88E3A]"
              }`}>
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className={`text-xs sm:text-base font-black tracking-wide uppercase truncate ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}>
                  FİYAT VE MALİYET DÖKÜMÜ
                </h2>
                <p className={`text-[10px] sm:text-xs font-medium truncate ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                  Müşteri Teklifi ve Atölye Analizi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer active:scale-95 ${
                  isDarkMode
                    ? "bg-[#C5A059] hover:bg-[#b08c48] text-black"
                    : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
                }`}
                title="Yazdır veya PDF Olarak Kaydet"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                <span className="text-[11px] sm:text-xs">YAZDIR</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  isDarkMode ? "text-neutral-400 hover:text-white hover:bg-white/10 active:bg-white/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200 active:bg-slate-300"
                }`}
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* İkinci Satır: Sipariş No & Ebat Rozetleri (Mobilde Ferah) */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 dark:border-white/5 border-slate-200/60 flex-wrap">
            <span className={`text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-md border font-bold shrink-0 ${
              isDarkMode 
                ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/40" 
                : "bg-[#B88E3A]/20 text-[#B88E3A] border-[#B88E3A]/40"
            }`}>
              #{orderNumber}
            </span>
            <span className={`text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-md border shrink-0 ${
              isDarkMode ? "bg-white/5 border-white/10 text-neutral-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              {artworkWidthCm}×{artworkHeightCm} cm Eser
            </span>
            {customerName && (
              <span className={`text-[10px] sm:text-xs truncate max-w-[200px] ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                • {customerName}
              </span>
            )}
          </div>
        </div>

        {/* Content & Printable Area */}
        <div ref={printRef} className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 overscroll-contain print:p-0 print:bg-white print:text-black touch-pan-y">
          
          {/* Printable Corporate Header */}
          <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-mono uppercase tracking-wider">NAKKA DEKOR</h1>
                <p className="text-xs font-mono text-gray-600">KURUMSAL SİPARİŞ MALİYET VE TEKLİF DÖKÜMÜ</p>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="font-bold text-sm text-black">SİPARİŞ NO: {orderNumber}</p>
                <p>Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-300 text-xs font-mono">
              <p><strong>Müşteri:</strong> {customerName || "Belirtilmedi"}</p>
              <p><strong>Teslim Tarihi:</strong> {deliveryDate || "Normal"}</p>
              <p><strong>Eser Ölçüsü:</strong> {artworkWidthCm} x {artworkHeightCm} cm</p>
            </div>
          </div>

          {/* Section 0: Material Toggles (Derli Toplu & Modern Kompakt Görünüm) */}
          <div className={`print:hidden border rounded-xl p-3.5 transition-all shadow-xs ${
            isDarkMode 
              ? "bg-[#181a1d] border-neutral-800" 
              : "bg-[#fdfbf8] border-[#e8dfcf]"
          }`}>
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b dark:border-neutral-800 border-[#e8dfcf]">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${isDarkMode ? "bg-[#C5A059]/15 text-[#C5A059]" : "bg-[#B88E3A]/15 text-[#B88E3A]"}`}>
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  isDarkMode ? "text-neutral-200" : "text-[#7A5A19]"
                }`}>
                  Hesaba Dahil Edilen Malzeme & Hizmetler
                </h3>
              </div>
              <span className={`text-[11px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Tıklayarak fiyata ekleyip çıkarabilirsiniz
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              <button 
                type="button"
                onClick={() => onToggleFlag('includeArtworkPrint')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeArtworkPrint 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeArtworkPrint ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">Kanvas / Tuval Baskı</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeInnerMat')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeInnerMat 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeInnerMat ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">İç Paspartu Kartonu</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeInnerFrame')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeInnerFrame 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeInnerFrame ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">Ana Çerçeve Profili</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeMiddleMat')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeMiddleMat 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeMiddleMat ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">3D Ara Paspartu</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeOuterFrame')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeOuterFrame 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeOuterFrame ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">Dış Kasa Çerçeve Profili</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeGlass')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeGlass 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeGlass ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">Koruyucu Cam / Pleksi</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeBackingBoard')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeBackingBoard 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeBackingBoard ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">3mm MDF Arka Kapama</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeBackingCloth')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  (flags.includeBackingCloth || flags.includeBackingPaper)
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {(flags.includeBackingCloth || flags.includeBackingPaper) ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">Arkalık Koruma Bezi</span>
              </button>

              <button 
                type="button"
                onClick={() => onToggleFlag('includeLaborCost')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  flags.includeLaborCost 
                    ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-white font-medium shadow-2xs" : "bg-white border-[#B88E3A] text-[#7A5A19] font-bold shadow-xs")
                    : (isDarkMode ? "bg-[#121415]/60 border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white/60 border-slate-200 text-slate-400 hover:text-slate-700")
                }`}
              >
                {flags.includeLaborCost ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                <span className="truncate">Atölye Sabit El İşçiliği</span>
              </button>
            </div>
          </div>

          {/* Top Stat Cards (Dengeli, Şık ve Yüksek Kontrastlı) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 print:grid-cols-3 print:gap-2">
            
            {isShopMode ? (
              <>
                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-xl space-y-1 transition-all ${
                  isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-[#e8dfcf] shadow-2xs"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block font-bold ${
                    isDarkMode ? "text-neutral-400" : "text-[#7A5A19]"
                  }`}>
                    01. Toplam Malzeme & Atık
                  </span>
                  <div className={`text-xl font-mono font-bold print:text-black ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}>
                    ₺{breakdown.totalMaterialCost.toFixed(2)}
                  </div>
                  <span className={`text-[11px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    Seçili Malzemeler + %{settings.wastePercentage} Atık Payı
                  </span>
                </div>

                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-xl space-y-1 transition-all ${
                  isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-[#e8dfcf] shadow-2xs"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block font-bold ${
                    isDarkMode ? "text-neutral-400" : "text-[#7A5A19]"
                  }`}>
                    02. Toplam Atölye Maliyeti
                  </span>
                  <div className={`text-xl font-mono font-bold print:text-black ${
                    isDarkMode ? "text-neutral-200" : "text-slate-800"
                  }`}>
                    ₺{breakdown.totalDirectCost.toFixed(2)}
                  </div>
                  <span className={`text-[11px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    Malzeme + {flags.includeLaborCost ? `₺${settings.laborFixedCost} Sabit İşçilik` : 'İşçiliksiz'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-xl space-y-1 transition-all ${
                  isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-[#e8dfcf] shadow-2xs"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block font-bold ${
                    isDarkMode ? "text-neutral-400" : "text-[#7A5A19]"
                  }`}>
                    01. Teslimat Yöntemi
                  </span>
                  <div className={`text-base font-mono font-bold print:text-black ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}>
                    {breakdown.deliveryMethod === 'shipping' ? '🚚 Adrese Teslim Kargo' : '🏪 Mağazada Teslim'}
                  </div>
                  <span className={`text-[11px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    {breakdown.deliveryMethod === 'shipping' ? `+₺${breakdown.shippingCost} Kargo Bedeli` : 'Ücretsiz'}
                  </span>
                </div>

                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-xl space-y-1 transition-all ${
                  isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-[#e8dfcf] shadow-2xs"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block font-bold ${
                    isDarkMode ? "text-neutral-400" : "text-[#7A5A19]"
                  }`}>
                    02. Atölye Maliyet Analizi
                  </span>
                  <div className={`text-sm font-mono font-bold flex items-center gap-1.5 ${
                    isDarkMode ? "text-[#C5A059]" : "text-[#8C6B23]"
                  }`}>
                    <Lock className="w-4 h-4" /> KİLİTLİ (GİZLİ)
                  </div>
                  <span className={`text-[11px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    Müşteri Görünümü (Maliyetler Korunuyor)
                  </span>
                </div>
              </>
            )}

            <div className={`print:bg-gray-200 border print:border-black p-4 rounded-xl space-y-1 transition-all ${
              isDarkMode 
                ? "bg-[#1a1d1f] border-[#C5A059]/40 bg-[#C5A059]/10" 
                : "bg-amber-50/80 border-amber-300/80 shadow-xs"
            }`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider print:text-black font-bold block ${
                isDarkMode ? "text-[#C5A059]" : "text-[#7A5A19]"
              }`}>
                03. Nihai Satış Fiyatı (KDV Dahil)
              </span>
              <div className={`text-2xl font-mono font-bold print:text-black ${
                isDarkMode ? "text-[#C5A059]" : "text-[#8C6B23]"
              }`}>
                ₺{breakdown.effectiveFinalPriceWithVat.toLocaleString("tr-TR")}
              </div>
              <span className={`text-[11px] print:text-gray-700 font-mono block ${
                isDarkMode ? "text-[#C5A059]/80" : "text-[#7A5A19]"
              }`}>
                {isShopMode ? `%{settings.targetProfitMarginPercent} Kâr + %{settings.vatRatePercent} KDV` : "KDV Dahil Net Sipariş Tutarı"}
              </span>
            </div>

          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-200" : "text-slate-800"
              } print:text-black`}>
                {isShopMode ? "Malzeme & Hizmet Dağılımı (Hammadde & İşçilik)" : "Seçili Malzeme & Hizmet Detay Fiyatları"}
              </h3>
              <div className="flex items-center gap-2">
                <span className="sm:hidden text-[10px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 rounded border border-[#C5A059]/30">
                  ↔ Yatay Kaydırın
                </span>
                <span className={`text-[11px] font-mono hidden sm:inline ${isDarkMode ? "text-neutral-400" : "text-slate-500"} print:text-gray-600`}>
                  Tüm tutarlar ₺ (TL) cinsindendir
                </span>
              </div>
            </div>

            <div 
              data-drag-scroll="true"
              className={`border rounded-xl overflow-x-auto drag-scroll text-xs print:bg-white print:border-gray-300 transition-all touch-pan-x overscroll-x-contain ${
              isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-[#e8dfcf] shadow-2xs"
            }`}>
              <table className="w-full min-w-[540px] text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider print:bg-gray-100 print:border-gray-300 print:text-black ${
                    isDarkMode ? "bg-[#141618] border-neutral-800 text-[#C5A059]" : "bg-[#fbf8f2] border-[#e8dfcf] text-[#8C6B23]"
                  }`}>
                    <th className="py-3 px-4 font-semibold">MALZEME / HİZMET</th>
                    <th className="py-3 px-4 font-semibold">DURUM</th>
                    <th className="py-3 px-4 font-semibold">MİKTAR / BİRİM</th>
                    <th className="py-3 px-4 font-semibold text-right">{isShopMode ? "HAM BİRİM FİYAT" : "BİRİM FİYAT"}</th>
                    <th className="py-3 px-4 font-semibold text-right">{isShopMode ? "HAM TUTAR" : "TUTAR"}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y print:divide-gray-200 ${
                  isDarkMode ? "divide-neutral-800/70 text-neutral-200" : "divide-slate-100 text-slate-800"
                } print:text-black`}>
                  
                  {/* Baskı / Tuval */}
                  <tr className={!flags.includeArtworkPrint ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                    <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      Kanvas / Tuval Baskı
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        flags.includeArtworkPrint 
                          ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                      }`}>
                        {flags.includeArtworkPrint ? "Dahil" : "Hariç"}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                      {breakdown.artworkSqm.toFixed(3)} m²
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                      {isShopMode ? `₺${settings.canvasPrintPricePerSqm}/m²` : "-"}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                      ₺{(isShopMode ? breakdown.artworkCost : breakdown.artworkSellingPrice).toFixed(2)}
                    </td>
                  </tr>

                  {/* İç Paspartu */}
                  {breakdown.innerMatSqm > 0 && (
                    <tr className={!flags.includeInnerMat ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                      <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        İç Paspartu {breakdown.isInnerMatTransparent ? "(Şeffaf Cam / Akrilik)" : "Kartonu"}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          flags.includeInnerMat 
                            ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                            : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                        }`}>
                          {flags.includeInnerMat ? "Dahil" : "Hariç"}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                        {breakdown.innerMatSqm.toFixed(3)} m²
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                        {isShopMode ? `₺${breakdown.innerMatUnitPrice ?? (breakdown.isInnerMatTransparent ? (settings.transparentMatBoardPricePerSqm ?? 520) : settings.matBoardPricePerSqm)}/m²` : "-"}
                      </td>
                      <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                        ₺{(isShopMode ? breakdown.innerMatCost : breakdown.innerMatSellingPrice).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* İç Çerçeve Profil */}
                  <tr className={!flags.includeInnerFrame ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                    <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      Ana Çerçeve Profili
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        flags.includeInnerFrame 
                          ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                      }`}>
                        {flags.includeInnerFrame ? "Dahil" : "Hariç"}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                      {breakdown.innerFrameMeter.toFixed(2)} mt
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                      {isShopMode ? "Metre Tül" : "-"}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                      ₺{(isShopMode ? breakdown.innerFrameCost : breakdown.innerFrameSellingPrice).toFixed(2)}
                    </td>
                  </tr>

                  {/* Ara Paspartu 3D */}
                  {breakdown.middleMatSqm > 0 && (
                    <tr className={!flags.includeMiddleMat ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                      <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        Ara Paspartu {breakdown.isMiddleMatTransparent ? "(Şeffaf Cam / Akrilik)" : "(3D)"}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          flags.includeMiddleMat 
                            ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                            : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                        }`}>
                          {flags.includeMiddleMat ? "Dahil" : "Hariç"}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                        {breakdown.middleMatSqm.toFixed(3)} m²
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                        {isShopMode ? `₺${breakdown.middleMatUnitPrice ?? (breakdown.isMiddleMatTransparent ? (settings.transparentMatBoardPricePerSqm ?? 520) : settings.middleMatBoardPricePerSqm)}/m²` : "-"}
                      </td>
                      <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                        ₺{(isShopMode ? breakdown.middleMatCost : breakdown.middleMatSellingPrice).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Dış Çerçeve Profil */}
                  {breakdown.outerFrameMeter > 0 && (
                    <tr className={!flags.includeOuterFrame ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                      <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        Dış Kasa Çerçeve Profili
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          flags.includeOuterFrame 
                            ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                            : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                        }`}>
                          {flags.includeOuterFrame ? "Dahil" : "Hariç"}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                        {breakdown.outerFrameMeter.toFixed(2)} mt
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                        {isShopMode ? "Metre Tül" : "-"}
                      </td>
                      <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                        ₺{(isShopMode ? breakdown.outerFrameCost : breakdown.outerFrameSellingPrice).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Cam */}
                  <tr className={!flags.includeGlass ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                    <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      Koruyucu Cam / Pleksi
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        flags.includeGlass 
                          ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                      }`}>
                        {flags.includeGlass ? "Dahil" : "Hariç"}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                      {breakdown.glassBackingSqm.toFixed(3)} m²
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                      {isShopMode ? `₺${settings.glassPricePerSqm}/m²` : "-"}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                      ₺{(isShopMode ? breakdown.glassCost : breakdown.glassSellingPrice).toFixed(2)}
                    </td>
                  </tr>

                  {/* MDF Arkalık */}
                  <tr className={!flags.includeBackingBoard ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                    <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      3mm MDF Arka Kapama
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        flags.includeBackingBoard 
                          ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                      }`}>
                        {flags.includeBackingBoard ? "Dahil" : "Hariç"}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                      {breakdown.glassBackingSqm.toFixed(3)} m²
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                      {isShopMode ? `₺${settings.backingBoardPricePerSqm}/m²` : "-"}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                      ₺{(isShopMode ? breakdown.backingBoardCost : breakdown.backingBoardSellingPrice).toFixed(2)}
                    </td>
                  </tr>

                  {/* Kapama Bezi */}
                  {(() => {
                    const isClothActive = Boolean(flags.includeBackingCloth || flags.includeBackingPaper);
                    return (
                      <tr className={!isClothActive ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                        <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                          Arkalık Koruma Bezi
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isClothActive 
                              ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                              : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                          }`}>
                            {isClothActive ? "Dahil" : "Hariç"}
                          </span>
                        </td>
                        <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                          {breakdown.backingClothSqm.toFixed(3)} m²
                        </td>
                        <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                          {isShopMode ? `₺${settings.backingClothPricePerSqm ?? settings.backingPaperPricePerSqm ?? 90}/m²` : "-"}
                        </td>
                        <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                          ₺{(isShopMode ? breakdown.backingClothCost : breakdown.backingClothSellingPrice).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Atık Payı - Visible only in Atölye Mode */}
                  {isShopMode && (
                    <tr className={`print:bg-gray-100 print:text-black ${
                      isDarkMode ? "bg-[#141618] text-amber-300" : "bg-amber-50/70 text-amber-900"
                    }`}>
                      <td className="py-2.5 px-4 font-medium">
                        Kesim Fire / Atık (%{settings.wastePercentage})
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isDarkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}>
                          Otomatik
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-500"} print:text-black`}>-</td>
                      <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-500"} print:text-black`}>-</td>
                      <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                        ₺{breakdown.wasteCost.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Sabit İşçilik */}
                  <tr className={!flags.includeLaborCost ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                    <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      Atölye Sabit El İşçiliği
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        flags.includeLaborCost 
                          ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                      }`}>
                        {flags.includeLaborCost ? "Dahil" : "Hariç"}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                      1 Adet
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                      {isShopMode ? `₺${settings.laborFixedCost}` : "-"}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                      ₺{(isShopMode ? breakdown.laborCost : breakdown.laborSellingPrice).toFixed(2)}
                    </td>
                  </tr>

                  {/* Kargo & Teslimat */}
                  <tr className={isDarkMode ? "bg-[#141618]/60" : "bg-slate-50"}>
                    <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {breakdown.deliveryMethod === 'shipping' ? '🚚 Adrese Teslim Kargo' : '🏪 Mağazada Teslim'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        breakdown.deliveryMethod === 'shipping'
                          ? (isDarkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-50 text-blue-700 border border-blue-300")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-300 border border-neutral-700" : "bg-slate-200 text-slate-700 border border-slate-300")
                      }`}>
                        {breakdown.deliveryMethod === 'shipping' ? 'KARGO' : 'MAĞAZA'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                      1 Sevkiyat
                    </td>
                    <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                      ₺{breakdown.shippingCost}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                      ₺{breakdown.shippingCost.toFixed(2)}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* Special Custom Override / Discount Section */}
          <div className={`print:hidden border p-4 rounded-xl space-y-3 transition-all shadow-xs ${
            isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-[#fdfbf8] border-[#e8dfcf]"
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isDarkMode ? "text-neutral-200" : "text-[#7A5A19]"
              }`}>
                <Tag className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> Müşteriye Özel İskonto / Manuel Fiyat Belirleme
              </label>

              {customOverridePrice && (
                <button
                  type="button"
                  onClick={handleClearOverride}
                  className="text-[11px] font-mono font-bold text-red-500 hover:underline cursor-pointer"
                >
                  Hesaplanan Fiyata Dön
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder={`Örn: ${Math.ceil(breakdown.calculatedPriceWithVat)}`}
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 sm:py-2 text-base sm:text-sm font-mono font-bold focus:outline-none transition-colors ${
                    isDarkMode ? "bg-[#121415] border-[#C5A059]/40 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] shadow-2xs"
                  }`}
                />
                <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>₺ (KDV Dahil)</span>
              </div>

              <button
                type="button"
                onClick={handleApplyOverride}
                className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 font-mono font-bold text-xs rounded-xl transition-all shrink-0 shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                  isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>FİYATI UYGULA</span>
              </button>
            </div>

            {customOverridePrice ? (
              <div className={`p-2.5 border rounded-lg text-xs font-mono flex items-center gap-2 ${
                isDarkMode ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-800"
              }`}>
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>
                  Özel Müşteri Fiyatı Aktif: <strong className={isDarkMode ? "text-white text-sm" : "text-slate-900 text-sm"}>₺{customOverridePrice.toLocaleString("tr-TR")}</strong>. İş emrine ve sipariş formuna bu fiyat basılacaktır.
                </span>
              </div>
            ) : (
              <p className={`text-[11px] font-sans ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                💡 İsterseniz yukarıdaki alana pazarlık sonucu anlaştığınız net fiyatı yazabilirsiniz. Boş bırakırsanız otomatik hesaplanan tutar kullanılır.
              </p>
            )}
          </div>

          {/* Printable Signature Block */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-6 border-t border-gray-400 font-mono text-xs">
            <div>
              <p className="font-bold">MÜŞTERİ ONAYI / İMZA:</p>
              <p className="mt-8 border-b border-dashed border-gray-400 w-48"></p>
            </div>
            <div className="text-right">
              <p className="font-bold">NAKKA DEKOR YETKİLİSİ:</p>
              <p className="mt-8 border-b border-dashed border-gray-400 w-48 ml-auto"></p>
            </div>
          </div>

        </div>

        {/* Footer (Mobil & Masaüstü Yeniden Düzenlenmiş) */}
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-3.5 sm:px-6 py-3 sm:py-4 border-t shrink-0 print:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-[#fdfbf8] border-[#e8dfcf]"
        }`}>
          <div className={`text-xs font-mono flex items-center justify-between sm:justify-start gap-2.5 ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
            <span className="text-[11px] sm:text-xs">Toplam Tutar:</span>
            <span className={`font-black text-lg sm:text-xl font-mono ${isDarkMode ? "text-[#C5A059]" : "text-[#7A5A19]"}`}>
              ₺{breakdown.effectiveFinalPriceWithVat.toLocaleString("tr-TR")}
            </span>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={!isOrderCreated}
              onClick={handlePrint}
              title={!isOrderCreated ? "Yazdırmak için önce sipariş oluşturulmalıdır." : "Maliyet tablosunu yazdır"}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 text-xs font-mono rounded-xl border transition-colors ${
                !isOrderCreated
                  ? "opacity-50 cursor-not-allowed bg-neutral-800 text-neutral-400 border-neutral-700"
                  : isDarkMode 
                    ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 cursor-pointer active:scale-95" 
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs cursor-pointer active:scale-95"
              }`}
            >
              {!isOrderCreated ? <Lock className="w-3.5 h-3.5" /> : <Printer className="w-3.5 h-3.5" />}
              <span className="truncate">{!isOrderCreated ? "KİLİTLİ (ÖNCE SİPARİŞİ OLUŞTURUN)" : "YAZDIR / PDF"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-2.5 font-mono font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 ${
                isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
              }`}
            >
              <span>SİPARİŞE İŞLE</span> <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

