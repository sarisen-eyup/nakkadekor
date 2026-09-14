import React from "react";
import { Maximize2, Calculator, Layers, Store, Truck, Shield } from "lucide-react";
import { CostCalculationBreakdown } from "../types/pricing";

interface VisualizerHeaderSpecProps {
  artworkWidth: number;
  artworkHeight: number;
  finalOuterWidthCm: number;
  finalOuterHeightCm: number;
  costBreakdown: CostCalculationBreakdown;
  activeInnerProfileName?: string;
  matWidth: number;
  innerMatColorName: string;
  deliveryMethod: "store" | "shipping";
  isDarkMode: boolean;
  onOpenCostModal: () => void;
}

export const VisualizerHeaderSpec: React.FC<VisualizerHeaderSpecProps> = ({
  artworkWidth,
  artworkHeight,
  finalOuterWidthCm,
  finalOuterHeightCm,
  costBreakdown,
  activeInnerProfileName,
  matWidth,
  innerMatColorName,
  deliveryMethod,
  isDarkMode,
  onOpenCostModal
}) => {
  return (
    <div className="w-full max-w-xl px-3 py-1.5 z-30 mb-auto pointer-events-auto">
      <div className={`px-3 py-2 rounded-xl border backdrop-blur-md shadow-lg transition-all ${
        isDarkMode
          ? "bg-[#14171d]/90 border-white/10 text-white"
          : "bg-white/95 border-slate-200/90 text-slate-900"
      }`}>
        {/* Top Primary Dimension & Price Route */}
        <div className="flex items-center justify-between gap-2">
          {/* Eser Boyutu */}
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wider font-semibold ${
              isDarkMode ? "text-neutral-400" : "text-slate-500"
            }`}>
              Eser
            </span>
            <div className={`px-2 py-0.5 rounded-md border text-xs font-mono font-bold tracking-tight ${
              isDarkMode ? "bg-[#101216] border-white/10 text-[#C5A059]" : "bg-slate-100 border-slate-200 text-[#B88E3A]"
            }`}>
              {artworkWidth} × {artworkHeight} cm
            </div>
          </div>

          {/* Dış Bitmiş Ölçü */}
          <div className="flex flex-col items-center">
            <span className={`text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1 ${
              isDarkMode ? "text-neutral-400" : "text-slate-500"
            }`}>
              <Maximize2 className="w-2.5 h-2.5" /> Dış Ölçü
            </span>
            <span className={`text-xs font-mono font-extrabold ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}>
              {finalOuterWidthCm.toFixed(1)} × {finalOuterHeightCm.toFixed(1)} cm
            </span>
          </div>

          {/* Toplam Tutar */}
          <div className="flex flex-col items-end">
            <span className={`text-[9px] uppercase tracking-wider font-semibold ${
              isDarkMode ? "text-neutral-400" : "text-slate-500"
            }`}>
              Tutar
            </span>
            <button
              type="button"
              onClick={onOpenCostModal}
              className={`px-2.5 py-0.5 rounded-lg border text-xs font-mono font-black tracking-tight flex items-center gap-1 cursor-pointer transition-all hover:scale-102 ${
                isDarkMode
                  ? "bg-[#C5A059] border-[#C5A059] text-black shadow-sm"
                  : "bg-[#B88E3A] border-[#B88E3A] text-white shadow-sm"
              }`}
              title="Maliyet ve Fiyat Dökümü"
            >
              <Calculator className="w-3 h-3" />
              <span>₺{costBreakdown.effectiveFinalPriceWithVat.toLocaleString("tr-TR")}</span>
            </button>
          </div>
        </div>

        {/* Sub-bar: Detail Tags */}
        <div className={`mt-1.5 pt-1.5 border-t flex flex-wrap items-center justify-between gap-1 text-[10px] ${
          isDarkMode ? "border-white/10 text-neutral-400" : "border-slate-200 text-slate-600"
        }`}>
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#C5A059]" />
            <span className="font-medium truncate max-w-[130px]">
              {activeInnerProfileName || "Standart Profil"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            <span>
              {matWidth > 0 ? `${matWidth} cm Paspartu` : "Paspartusuz"}
            </span>
          </div>

          <div className="flex items-center gap-1 font-semibold">
            {deliveryMethod === "store" ? (
              <span className="text-emerald-500 flex items-center gap-0.5">
                <Store className="w-3 h-3" /> Mağaza
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-0.5">
                <Truck className="w-3 h-3" /> Kargo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
