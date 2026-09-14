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
  isShopMode = false
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className={`relative w-full max-w-4xl border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isDarkMode 
          ? "bg-[#14171a] border-[#C5A059]/40 text-white" 
          : "bg-white border-[#cbd5e1] text-slate-900"
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b print:hidden ${
          isDarkMode ? "bg-[#1c2026] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded border ${
              isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059]" : "bg-[#B88E3A]/10 border-[#B88E3A]/30 text-[#B88E3A]"
            }`}>
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold tracking-wide uppercase ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}>
                  FİYAT TEKLİFİ & HESAPLAMA DÖKÜMÜ
                </h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                  isDarkMode 
                    ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/40" 
                    : "bg-[#B88E3A]/20 text-[#B88E3A] border-[#B88E3A]/40"
                }`}>
                  {orderNumber}
                </span>
              </div>
              <p className={`text-xs font-medium ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                Eser {artworkWidthCm}x{artworkHeightCm} cm • Müşteri Teklif Formu & Atölye Hammadde Analizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs rounded transition-all shadow-md cursor-pointer ${
                isDarkMode
                  ? "bg-[#C5A059] hover:bg-[#b08c48] text-black"
                  : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
              }`}
            >
              <Printer className="w-4 h-4" /> YAZDIR / PDF AL
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isDarkMode ? "text-neutral-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content & Printable Area */}
        <div ref={printRef} className="p-6 overflow-y-auto space-y-6 flex-1 print:p-0 print:bg-white print:text-black">
          
          {/* Printable Corporate Header */}
          <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-mono uppercase tracking-wider">NAKKA DECOR & ART STUDIO</h1>
                <p className="text-xs font-mono text-gray-600">KURUMSAL SİPARİŞ MALIYET VE TEKLİF DÖKÜMÜ</p>
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

          {/* Section 0: Material Toggles (Seçme Butonları) */}
          <div className={`print:hidden border rounded-md p-4 space-y-3 ${
            isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                <CheckSquare className="w-4 h-4" /> Fiyata Dahil Edilecek Ürünleri / Hizmetleri Seçin
              </h3>
              <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                (İşaretlenmeyen ürünler maliyete eklenmez)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <label 
                onClick={() => onToggleFlag('includeArtworkPrint')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeArtworkPrint 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeArtworkPrint ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">Canvas Baskı</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeInnerMat')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeInnerMat 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeInnerMat ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">İç Paspartu</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeInnerFrame')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeInnerFrame 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeInnerFrame ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">Ana Çerçeve Profil</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeMiddleMat')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeMiddleMat 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeMiddleMat ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">Ara Paspartu (3D)</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeOuterFrame')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeOuterFrame 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeOuterFrame ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">Dış Kasa Çerçeve</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeGlass')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeGlass 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeGlass ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">Koruyucu Cam</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeBackingBoard')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeBackingBoard 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeBackingBoard ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">MDF Arkalık</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeBackingPaper')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  (flags.includeBackingPaper || flags.includeBackingCloth || flags.includeKraftTape)
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {(flags.includeBackingPaper || flags.includeBackingCloth || flags.includeKraftTape) ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">Kapama Bezi / Kraft</span>
              </label>

              <label 
                onClick={() => onToggleFlag('includeLaborCost')}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                  flags.includeLaborCost 
                    ? (isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059] text-white font-medium" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-semibold")
                    : (isDarkMode ? "bg-[#121415] border-neutral-800 text-neutral-500 hover:text-neutral-300" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
                }`}
              >
                {flags.includeLaborCost ? <CheckSquare className={`w-4 h-4 shrink-0 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="truncate">Sabit İşçilik</span>
              </label>
            </div>
          </div>

          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            
            {isShopMode ? (
              <>
                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-md space-y-1 ${
                  isDarkMode ? "bg-[#1a1d1f] border-neutral-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    01. Toplam Malzeme & Atık
                  </span>
                  <div className={`text-xl font-mono font-bold print:text-black ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}>
                    ₺{breakdown.totalMaterialCost.toFixed(2)}
                  </div>
                  <span className={`text-[10px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-500" : "text-slate-500"
                  }`}>
                    Seçili Kalemler + %{settings.wastePercentage} Atık Payı
                  </span>
                </div>

                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-md space-y-1 ${
                  isDarkMode ? "bg-[#1a1d1f] border-neutral-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    02. Toplam Atölye Maliyeti
                  </span>
                  <div className={`text-xl font-mono font-bold print:text-black ${
                    isDarkMode ? "text-neutral-200" : "text-slate-800"
                  }`}>
                    ₺{breakdown.totalDirectCost.toFixed(2)}
                  </div>
                  <span className={`text-[10px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-500" : "text-slate-500"
                  }`}>
                    Malzeme + {flags.includeLaborCost ? `₺${settings.laborFixedCost} Sabit İşçilik` : 'İşçiliksiz'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-md space-y-1 ${
                  isDarkMode ? "bg-[#1a1d1f] border-neutral-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    01. Teslimat Yöntemi
                  </span>
                  <div className={`text-base font-mono font-bold print:text-black ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}>
                    {breakdown.deliveryMethod === 'shipping' ? '🚚 Adrese Teslim Kargo' : '🏪 Mağazada Teslim'}
                  </div>
                  <span className={`text-[10px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-500" : "text-slate-500"
                  }`}>
                    {breakdown.deliveryMethod === 'shipping' ? `+₺${breakdown.shippingCost} Kargo Bedeli` : 'Ücretsiz'}
                  </span>
                </div>

                <div className={`print:bg-gray-100 border print:border-gray-300 p-4 rounded-md space-y-1 ${
                  isDarkMode ? "bg-[#1a1d1f] border-neutral-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider print:text-gray-600 block ${
                    isDarkMode ? "text-neutral-400" : "text-slate-500"
                  }`}>
                    02. Atölye Maliyet Analizi
                  </span>
                  <div className={`text-sm font-mono font-bold flex items-center gap-1.5 ${
                    isDarkMode ? "text-amber-400" : "text-amber-700"
                  }`}>
                    <Lock className="w-4 h-4" /> KİLİTLİ (GİZLİ)
                  </div>
                  <span className={`text-[10px] print:text-gray-500 font-mono block ${
                    isDarkMode ? "text-neutral-500" : "text-slate-500"
                  }`}>
                    Müşteri Görünümü
                  </span>
                </div>
              </>
            )}

            <div className={`print:bg-gray-200 border print:border-black p-4 rounded-md space-y-1 ${
              isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/40 bg-[#C5A059]/5" : "bg-[#B88E3A]/10 border-[#B88E3A]/40"
            }`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider print:text-black font-bold block ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                03. Nihai Satış Fiyatı (KDV Dahil)
              </span>
              <div className={`text-2xl font-mono font-bold print:text-black ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                ₺{breakdown.effectiveFinalPriceWithVat.toLocaleString("tr-TR")}
              </div>
              <span className={`text-[10px] print:text-gray-700 font-mono block ${
                isDarkMode ? "text-[#C5A059]/80" : "text-[#B88E3A]"
              }`}>
                {isShopMode ? `%{settings.targetProfitMarginPercent} Kâr + %{settings.vatRatePercent} KDV` : "KDV Dahil Net Sipariş Tutarı"}
              </span>
            </div>

          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-200" : "text-slate-800"
              } print:text-black`}>
                {isShopMode ? "Kalem Kalem Hammadde & İşçilik Dağılımı" : "Seçili Malzeme & Hizmet Detay Fiyatları"}
              </h3>
              <span className={`text-[11px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"} print:text-gray-600`}>
                Tüm tutarlar ₺ (TL) cinsindendir
              </span>
            </div>

            <div 
              data-drag-scroll="true"
              className={`border rounded-md overflow-x-auto drag-scroll text-xs print:bg-white print:border-gray-300 ${
              isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-slate-200"
            }`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider print:bg-gray-100 print:border-gray-300 print:text-black ${
                    isDarkMode ? "bg-[#141618] border-neutral-800 text-[#C5A059]" : "bg-slate-100 border-slate-200 text-[#B88E3A]"
                  }`}>
                    <th className="py-3 px-4 font-semibold">MALZEME / KALEM</th>
                    <th className="py-3 px-4 font-semibold">DURUM</th>
                    <th className="py-3 px-4 font-semibold">MİKTAR / BİRİM</th>
                    <th className="py-3 px-4 font-semibold text-right">{isShopMode ? "HAM BİRİM FİYAT" : "BİRİM FİYAT"}</th>
                    <th className="py-3 px-4 font-semibold text-right">{isShopMode ? "HAM TUTAR" : "TUTAR"}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y print:divide-gray-200 ${
                  isDarkMode ? "divide-neutral-800/70 text-neutral-200" : "divide-slate-200 text-slate-800"
                } print:text-black`}>
                  
                  {/* Baskı / Tuval */}
                  <tr className={!flags.includeArtworkPrint ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                    <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      Sanat Baskı / Canvas Tuval
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
                      İç Çerçeve Profili
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
                        Ara Paspartu {breakdown.isMiddleMatTransparent ? "(Şeffaf Cam / Akrilik)" : "(3D Mukavva)"}
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
                        Dış Çerçeve Kasa Profili
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
                      Koruyucu Dereceli Cam / Akrilik
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
                      Arka MDF Levha Koruması
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
                          Arkalık Kapama Bezi
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

                  {/* Kraft Bitiş Bandı */}
                  {(() => {
                    const isKraftActive = Boolean(flags.includeKraftTape || flags.includeBackingPaper);
                    return (
                      <tr className={!isKraftActive ? `opacity-45 ${isDarkMode ? "bg-black/20" : "bg-slate-50"}` : ""}>
                        <td className={`py-2.5 px-4 font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                          Kraft Bitiş / Islak Bandı
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isKraftActive 
                              ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-300")
                              : (isDarkMode ? "bg-neutral-800 text-neutral-400 border border-neutral-700" : "bg-slate-100 text-slate-500 border border-slate-200")
                          }`}>
                            {isKraftActive ? "Dahil" : "Hariç"}
                          </span>
                        </td>
                        <td className={`py-2.5 px-4 font-mono text-[11px] ${isDarkMode ? "text-neutral-300" : "text-slate-600"} print:text-black`}>
                          {breakdown.kraftTapeMeter.toFixed(2)} mt
                        </td>
                        <td className={`py-2.5 px-4 font-mono text-right text-[11px] ${isDarkMode ? "text-neutral-400" : "text-slate-600"} print:text-black`}>
                          {isShopMode ? `₺${settings.kraftTapePricePerMeter ?? 20}/m` : "-"}
                        </td>
                        <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs print:text-black ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                          ₺{(isShopMode ? breakdown.kraftTapeCost : breakdown.kraftTapeSellingPrice).toFixed(2)}
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
                        Atık / Kesim File Payı (%{settings.wastePercentage})
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
                      Atölye Sabit El İşçiliği & Çatma Bedeli
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
                      {breakdown.deliveryMethod === 'shipping' ? '🚚 Kargo ile Adrese Teslim Gönderim Bedeli' : '🏪 Mağazada Teslim (Kargo Hariç)'}
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
          <div className={`print:hidden border p-4 rounded-md space-y-3 ${
            isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                <Tag className="w-4 h-4" /> Müşteriye Özel İskonto / Manuel Fiyat Belirleme
              </label>

              {customOverridePrice && (
                <button
                  onClick={handleClearOverride}
                  className="text-[11px] font-mono text-red-500 hover:underline cursor-pointer"
                >
                  Hesaplanan Fiyata Dön
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder={`Örn: ${Math.ceil(breakdown.calculatedPriceWithVat)}`}
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-sm font-mono font-bold focus:outline-none ${
                    isDarkMode ? "bg-[#121415] border-[#C5A059]/40 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                  }`}
                />
                <span className={`absolute right-3 top-2.5 text-xs font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺ (KDV Dahil)</span>
              </div>

              <button
                onClick={handleApplyOverride}
                className={`px-4 py-2 font-mono font-bold text-xs rounded transition-colors shrink-0 shadow-sm cursor-pointer ${
                  isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
                }`}
              >
                FİYATI UYGULA
              </button>
            </div>

            {customOverridePrice ? (
              <div className={`p-2.5 border rounded text-xs font-mono flex items-center gap-2 ${
                isDarkMode ? "bg-green-900/20 border-green-500/30 text-green-300" : "bg-emerald-50 border-emerald-300 text-emerald-800"
              }`}>
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>
                  Özel Müşteri Fiyatı Aktif: <strong className={isDarkMode ? "text-white text-sm" : "text-slate-900 text-sm"}>₺{customOverridePrice.toLocaleString("tr-TR")}</strong>. İş emrine ve sipariş formuna bu fiyat basılacaktır.
                </span>
              </div>
            ) : (
              <p className={`text-[11px] font-sans ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
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
              <p className="font-bold">NAKKA ART STUDIO YETKİLİSİ:</p>
              <p className="mt-8 border-b border-dashed border-gray-400 w-48 ml-auto"></p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t print:hidden ${
          isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`text-xs font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
            Geçerli Fiyat: <span className={`font-bold text-sm ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>₺{breakdown.effectiveFinalPriceWithVat.toLocaleString("tr-TR")}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono rounded transition-colors cursor-pointer ${
                isDarkMode ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              <Printer className="w-3.5 h-3.5" /> YAZDIR / PDF AL
            </button>

            <button
              onClick={onClose}
              className={`flex items-center gap-2 px-6 py-2.5 font-mono font-bold text-xs rounded shadow-lg transition-colors cursor-pointer ${
                isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
              }`}
            >
              SİPARİŞE İŞLE VE KAPAT <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

