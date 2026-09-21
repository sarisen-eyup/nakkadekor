import React from "react";
import { 
  X, 
  Printer, 
  FileText, 
  Scissors, 
  Calculator, 
  Tag, 
  ExternalLink,
  Lock,
  AlertCircle,
  CheckCircle2
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
  isOrderCreated?: boolean;
  onCreateOrder?: () => void;
  onPrintOrderForm?: () => void;
  onPrintJobOrder?: () => void;
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
  isOrderCreated = false,
  onCreateOrder,
  onPrintOrderForm,
  onPrintJobOrder,
  onPrintCuttingList,
  onOpenCuttingListModal,
  onPrintCostBreakdown,
  onOpenCostBreakdownModal,
  onPrintBackLabel
}: PrintCenterModalProps) {
  if (!isOpen) return null;

  const handleAction = (callback?: () => void) => {
    if (!isOrderCreated || !callback) return;
    try {
      callback();
    } catch (err) {
      console.error("Print action error:", err);
    }
  };

  const printOrderFormFn = onPrintOrderForm || onPrintJobOrder;

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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wide">BELGE YAZDIR</h2>
                {!isOrderCreated ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Lock className="w-3 h-3" /> SİPARİŞ OLUŞTURULMADI
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> YAZDIRMAYA HAZIR
                  </span>
                )}
              </div>
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

        {/* Status Notification / Order Mandatory Warning Banner */}
        <div className="px-6 pt-4 shrink-0">
          {!isOrderCreated ? (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
              isDarkMode 
                ? "bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-sm" 
                : "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
            }`}>
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 text-amber-400">
                    <AlertCircle className="w-4 h-4" /> Sipariş Kaydı Gerekli
                  </h4>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    Belge ve etiket çıktısı alabilmek için önce siparişi kaydedin.
                  </p>
                </div>
              </div>
              {onCreateOrder && (
                <button
                  type="button"
                  onClick={onCreateOrder}
                  className={`shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                    isDarkMode 
                      ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" 
                      : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Siparişi Oluştur</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
              isDarkMode 
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300" 
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sipariş kayıtlı (#{orderNumber}). Belgeleri yazdırabilirsiniz.</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black shrink-0">
                ONAYLANDI
              </span>
            </div>
          )}
        </div>

        {/* 4 Clean Document Cards Grid */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1. SİPARİŞ FORMU */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              !isOrderCreated
                ? (isDarkMode ? "bg-[#181b22]/60 border-white/5 opacity-75" : "bg-slate-100/70 border-slate-200 opacity-75")
                : (isDarkMode ? "bg-[#181b22] border-white/10 hover:border-blue-500/40" : "bg-slate-50/70 border-slate-200 hover:border-blue-400")
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !isOrderCreated 
                      ? (isDarkMode ? "bg-white/5 text-neutral-500" : "bg-slate-200 text-slate-400")
                      : "bg-blue-500/10 text-blue-500"
                  }`}>
                    {!isOrderCreated ? <Lock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <span>Sipariş Formu</span>
                      {!isOrderCreated && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-400 font-bold">Kilitli</span>
                      )}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Görsel simülasyon ve müşteri onay dökümü
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!isOrderCreated}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(printOrderFormFn);
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 ${
                  !isOrderCreated
                    ? "bg-neutral-700/50 text-neutral-400 cursor-not-allowed opacity-50"
                    : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-98"
                }`}
                title={!isOrderCreated ? "Yazdırmak için önce siparişi oluşturun." : "Sipariş formunu yazdır"}
              >
                {!isOrderCreated ? <Lock className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                <span>{!isOrderCreated ? "Sipariş Kaydı Gerekli" : "Sipariş Formunu Yazdır"}</span>
              </button>
            </div>

            {/* 2. ATÖLYE KESİM LİSTESİ */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              !isOrderCreated
                ? (isDarkMode ? "bg-[#181b22]/60 border-white/5 opacity-75" : "bg-slate-100/70 border-slate-200 opacity-75")
                : (isDarkMode ? "bg-[#181b22] border-white/10 hover:border-amber-500/40" : "bg-slate-50/70 border-slate-200 hover:border-amber-400")
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !isOrderCreated 
                      ? (isDarkMode ? "bg-white/5 text-neutral-500" : "bg-slate-200 text-slate-400")
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {!isOrderCreated ? <Lock className="w-5 h-5" /> : <Scissors className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <span>Atölye Kesim Listesi</span>
                      {!isOrderCreated && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-400 font-bold">Kilitli</span>
                      )}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      45° gönye kesim ve paspartu ölçüleri
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isOrderCreated}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onPrintCuttingList);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 ${
                    !isOrderCreated
                      ? "bg-neutral-700/50 text-neutral-400 cursor-not-allowed opacity-50"
                      : "bg-amber-600 hover:bg-amber-500 text-white cursor-pointer active:scale-98"
                  }`}
                  title={!isOrderCreated ? "Yazdırmak için önce siparişi oluşturun." : "Kesim listesini yazdır"}
                >
                  {!isOrderCreated ? <Lock className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                  <span>{!isOrderCreated ? "Sipariş Kaydı Gerekli" : "Kesim Listesini Yazdır"}</span>
                </button>
                <button
                  type="button"
                  disabled={!isOrderCreated}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onOpenCuttingListModal);
                  }}
                  title={!isOrderCreated ? "Önce siparişi oluşturmalısınız." : "Kesim Tablosunu Ekranda İncele"}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center ${
                    !isOrderCreated
                      ? "bg-white/5 border-white/5 text-neutral-500 cursor-not-allowed opacity-40"
                      : isDarkMode 
                        ? "bg-white/5 border-white/10 hover:bg-white/10 text-neutral-200 cursor-pointer" 
                        : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3. MALİYET VE FİYAT TABLOSU */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              !isOrderCreated
                ? (isDarkMode ? "bg-[#181b22]/60 border-white/5 opacity-75" : "bg-slate-100/70 border-slate-200 opacity-75")
                : (isDarkMode ? "bg-[#181b22] border-white/10 hover:border-emerald-500/40" : "bg-slate-50/70 border-slate-200 hover:border-emerald-400")
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !isOrderCreated 
                      ? (isDarkMode ? "bg-white/5 text-neutral-500" : "bg-slate-200 text-slate-400")
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}>
                    {!isOrderCreated ? <Lock className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <span>Maliyet ve Fiyat Tablosu</span>
                      {!isOrderCreated && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-400 font-bold">Kilitli</span>
                      )}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Hammadde sarfiyatı, fire ve kâr analizi
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isOrderCreated}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onPrintCostBreakdown);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 ${
                    !isOrderCreated
                      ? "bg-neutral-700/50 text-neutral-400 cursor-not-allowed opacity-50"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98"
                  }`}
                  title={!isOrderCreated ? "Yazdırmak için önce siparişi oluşturun." : "Maliyet tablosunu yazdır"}
                >
                  {!isOrderCreated ? <Lock className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                  <span>{!isOrderCreated ? "Sipariş Kaydı Gerekli" : "Maliyet Tablosunu Yazdır"}</span>
                </button>
                <button
                  type="button"
                  disabled={!isOrderCreated}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(onOpenCostBreakdownModal);
                  }}
                  title={!isOrderCreated ? "Önce siparişi oluşturmalısınız." : "Fiyat ve Kalemleri Düzenle"}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center ${
                    !isOrderCreated
                      ? "bg-white/5 border-white/5 text-neutral-500 cursor-not-allowed opacity-40"
                      : isDarkMode 
                        ? "bg-white/5 border-white/10 hover:bg-white/10 text-neutral-200 cursor-pointer" 
                        : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4. ÇERÇEVE ARKA ETİKETİ (4x4 CM) */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              !isOrderCreated
                ? (isDarkMode ? "bg-[#181b22]/60 border-white/5 opacity-75" : "bg-slate-100/70 border-slate-200 opacity-75")
                : (isDarkMode ? "bg-[#181b22] border-white/10 hover:border-[#C5A059]" : "bg-slate-50/70 border-slate-200 hover:border-[#B88E3A]")
            }`}>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !isOrderCreated 
                    ? (isDarkMode ? "bg-white/5 text-neutral-500" : "bg-slate-200 text-slate-400")
                    : (isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/15 text-[#B88E3A]")
                  }`}>
                    {!isOrderCreated ? <Lock className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <span>Çerçeve Arka Etiketi (4×4 cm)</span>
                      {!isOrderCreated && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-400 font-bold">Kilitli</span>
                      )}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                      Karekodlu yapışkanlı ürün etiketi
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!isOrderCreated}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onPrintBackLabel);
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 ${
                  !isOrderCreated
                    ? "bg-neutral-700/50 text-neutral-400 cursor-not-allowed opacity-50"
                    : isDarkMode
                      ? "bg-[#C5A059] hover:bg-[#d8b062] text-black cursor-pointer active:scale-98"
                      : "bg-[#B88E3A] hover:bg-[#a67e2f] text-white cursor-pointer active:scale-98"
                }`}
                title={!isOrderCreated ? "Yazdırmak için önce siparişi oluşturun." : "Arka etiketi yazdır"}
              >
                {!isOrderCreated ? <Lock className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                <span>{!isOrderCreated ? "Sipariş Kaydı Gerekli" : "Arka Etiketi Yazdır"}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t shrink-0 flex items-center justify-between ${
          isDarkMode ? "border-white/10 bg-[#101216]" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="text-xs">
            {!isOrderCreated ? (
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Belgeleri yazdırmak için önce siparişi oluşturun.
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tüm yazdırma belgeleri hazır.
              </span>
            )}
          </div>
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
