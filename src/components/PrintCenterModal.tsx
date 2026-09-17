import React from "react";
import { 
  X, 
  Printer, 
  FileText, 
  Scissors, 
  Calculator, 
  Tag, 
  ExternalLink
} from "lucide-react";
import { CompanyProfile } from "../types/pricing";

interface PrintCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  deliveryMethod: "store" | "shipping";
  artworkWidthCm: number;
  artworkHeightCm: number;
  finalOuterWidthCm: number;
  finalOuterHeightCm: number;
  frameProfileName?: string;
  companyProfile?: CompanyProfile;
  isPro?: boolean;
  isDarkMode?: boolean;
  totalPriceWithVat: number;
  onPrintJobOrder: () => void;
  onPrintCuttingList: () => void;
  onOpenCuttingListModal: () => void;
  onPrintCostBreakdown: () => void;
  onOpenCostBreakdownModal: () => void;
  onPrintBackLabel: () => void;
}

export function PrintCenterModal({
  isOpen,
  onClose,
  orderNumber,
  customerName,
  customerPhone,
  deliveryDate,
  deliveryMethod,
  artworkWidthCm,
  artworkHeightCm,
  finalOuterWidthCm,
  finalOuterHeightCm,
  frameProfileName,
  companyProfile,
  isPro = false,
  isDarkMode = true,
  totalPriceWithVat,
  onPrintJobOrder,
  onPrintCuttingList,
  onOpenCuttingListModal,
  onPrintCostBreakdown,
  onOpenCostBreakdownModal,
  onPrintBackLabel
}: PrintCenterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isDarkMode 
            ? "bg-[#14171d] border-white/10 text-neutral-100" 
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDarkMode ? "border-white/10 bg-[#101216]" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/15 text-[#B88E3A]"
            }`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide">BELGE YAZDIR</h2>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                #{orderNumber} • {customerName || "İsimsiz Müşteri"} • {artworkWidthCm}×{artworkHeightCm} cm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              isDarkMode ? "bg-black/40 border-white/10 text-emerald-400" : "bg-white border-slate-200 text-emerald-600 shadow-sm"
            }`}>
              <span>₺{totalPriceWithVat.toLocaleString("tr-TR")}</span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDarkMode 
                  ? "hover:bg-white/10 text-neutral-400 hover:text-white" 
                  : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Clean Document Cards Grid */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1. SİPARİŞ FORMU & TEKLİF */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isDarkMode 
                ? "bg-[#181b22] border-white/10 hover:border-blue-500/40" 
                : "bg-slate-50/70 border-slate-200 hover:border-blue-400"
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">1. Sipariş Formu & Teklif</h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Görsel simülasyon, ölçüler ve müşteri onay dökümü
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onPrintJobOrder}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>Sipariş Formunu Yazdır</span>
              </button>
            </div>

            {/* 2. ÜRETİM EMRİ & KESİM LİSTESİ */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isDarkMode 
                ? "bg-[#181b22] border-white/10 hover:border-amber-500/40" 
                : "bg-slate-50/70 border-slate-200 hover:border-amber-400"
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">2. Üretim Emri & Kesim Listesi</h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Atölye ve marangoz için milimetrik kesim boyları
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrintCuttingList}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>Üretim Emrini Yazdır</span>
                </button>
                <button
                  onClick={onOpenCuttingListModal}
                  title="Kesim Tablosunu Ekranda İncele"
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                    isDarkMode 
                      ? "bg-white/5 border-white/10 hover:bg-white/10 text-neutral-200" 
                      : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3. MALİYET TABLOSU & ANALİZ */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isDarkMode 
                ? "bg-[#181b22] border-white/10 hover:border-emerald-500/40" 
                : "bg-slate-50/70 border-slate-200 hover:border-emerald-400"
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">3. Maliyet Tablosu & Analiz</h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Malzeme sarfiyatı, birim maliyetler ve kâr dökümü
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrintCostBreakdown}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>Maliyet Tablosunu Yazdır</span>
                </button>
                <button
                  onClick={onOpenCostBreakdownModal}
                  title="Fiyat ve Kalemleri Düzenle"
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                    isDarkMode 
                      ? "bg-white/5 border-white/10 hover:bg-white/10 text-neutral-200" 
                      : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4. TABLO ARKA ETİKETİ (4x4 CM) */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isDarkMode 
                ? "bg-[#181b22] border-white/10 hover:border-[#C5A059]" 
                : "bg-slate-50/70 border-slate-200 hover:border-[#B88E3A]"
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/15 text-[#B88E3A]"
                  }`}>
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">4. Tablo Arka Etiketi (4×4 cm)</h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Çerçeve arkasına yapıştırılacak karekodlu ürün etiketi
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onPrintBackLabel}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                  isDarkMode
                    ? "bg-[#C5A059] hover:bg-[#d8b062] text-black"
                    : "bg-[#B88E3A] hover:bg-[#a67e2f] text-white"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Arka Etiketi Yazdır</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t shrink-0 flex items-center justify-end ${
          isDarkMode ? "border-white/10 bg-[#101216]" : "border-slate-200 bg-slate-50"
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              isDarkMode
                ? "bg-white/10 hover:bg-white/15 text-neutral-200"
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
