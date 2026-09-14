import React from "react";
import { 
  X, 
  Printer, 
  FileText, 
  Scissors, 
  Calculator, 
  Tag, 
  QrCode, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Info
} from "lucide-react";
import { CompanyProfile } from "../types/pricing";
import { generateBarcodeSvg } from "../utils/printHelper";

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

  const sampleBarcodeSvg = generateBarcodeSvg(orderNumber, 20);

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
                <h2 className="text-base font-bold uppercase tracking-wide">YAZDIRMA & BELGE MERKEZİ</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
                  4 BELGE HAZIR
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Atölye, müşteri ve marangoz için gerekli tüm resmi belgeleri tek noktadan yazdırın
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
              isDarkMode ? "bg-black/40 border-white/5 text-neutral-300" : "bg-white border-slate-200 text-slate-700"
            }`}>
              <span className="text-[#C5A059] font-bold">#{orderNumber}</span>
              <span>•</span>
              <span className="font-bold text-emerald-500">₺{totalPriceWithVat.toLocaleString("tr-TR")}</span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode 
                  ? "hover:bg-white/10 text-neutral-400 hover:text-white" 
                  : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className={`px-6 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
          isDarkMode ? "bg-[#181b22] border-white/5 text-neutral-300" : "bg-slate-100/70 border-slate-200 text-slate-600"
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <span><strong>Müşteri:</strong> {customerName || "İsimsiz Müşteri"}</span>
            <span>•</span>
            <span><strong>Eser:</strong> {artworkWidthCm} × {artworkHeightCm} cm</span>
            <span>•</span>
            <span><strong>Bitmiş Dış Ölçü:</strong> {finalOuterWidthCm.toFixed(1)} × {finalOuterHeightCm.toFixed(1)} cm</span>
            {frameProfileName && (
              <>
                <span>•</span>
                <span><strong>Profil:</strong> {frameProfileName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#C5A059]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Milimetrik Atölye Hesaplaması</span>
          </div>
        </div>

        {/* 4 Document Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1. SİPARİŞ FORMU & MÜŞTERİ TEKLİFİ */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isDarkMode 
                ? "bg-[#181b22] border-white/10 hover:border-[#C5A059]/40" 
                : "bg-slate-50 border-slate-200 hover:border-[#B88E3A]/40"
            }`}>
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">1. Sipariş Formu & Müşteri Teklifi</h3>
                      <span className="text-[10px] font-semibold text-blue-500 uppercase">A4 Standart Format</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    PDF & Yazdır
                  </span>
                </div>

                <p className={`text-xs mb-3.5 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                  Tablonun çerçeveli yüksek çözünürlüklü görsel simülasyonu, müşteri bilgileri, milimetrik ölçü tablosu, malzeme listesi, QR kodu ve müşteri ıslak imza onay alanı.
                </p>

                <div className={`p-2.5 rounded-xl text-[11px] font-mono space-y-1 mb-4 ${
                  isDarkMode ? "bg-black/30 text-neutral-300 border border-white/5" : "bg-white text-slate-700 border border-slate-200"
                }`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Müşteri Onay Bölümü:</span>
                    <span className="text-emerald-500 font-bold">Hazır</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">QR Takip Kodu:</span>
                    <span className="text-blue-400">Dahil</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onPrintJobOrder}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>Sipariş Formunu Yazdır (A4 PDF)</span>
              </button>
            </div>

            {/* 2. ÜRETİM EMRİ & KESİM LİSTESİ */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isDarkMode 
                ? "bg-[#181b22] border-white/10 hover:border-[#C5A059]/40" 
                : "bg-slate-50 border-slate-200 hover:border-[#B88E3A]/40"
            }`}>
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">2. Üretim Emri & Kesim Listesi</h3>
                      <span className="text-[10px] font-semibold text-amber-500 uppercase">Atölye Usta Belgesi</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    A4 İş Emri
                  </span>
                </div>

                <p className={`text-xs mb-3.5 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                  Marangoz ve çerçeve ustası için milimetrik profil kesim boyları, 45° gönye kesim açıları, cam/pleksi, paspartu kartonu, arkalık panel ölçüleri ve montaj sıralaması.
                </p>

                <div className={`p-2.5 rounded-xl text-[11px] font-mono space-y-1 mb-4 ${
                  isDarkMode ? "bg-black/30 text-neutral-300 border border-white/5" : "bg-white text-slate-700 border border-slate-200"
                }`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Profil Kesim Açısı:</span>
                    <span className="font-bold">45° Gönye</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Atölye Montaj Sıralaması:</span>
                    <span className="text-amber-400">1'den 7'ye Adım Adım</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrintCuttingList}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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
                ? "bg-[#181b22] border-white/10 hover:border-[#C5A059]/40" 
                : "bg-slate-50 border-slate-200 hover:border-[#B88E3A]/40"
            }`}>
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">3. Maliyet Tablosu & Analiz</h3>
                      <span className="text-[10px] font-semibold text-emerald-500 uppercase">Finans & Muhasebe</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    A4 Döküm
                  </span>
                </div>

                <p className={`text-xs mb-3.5 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                  Tüm malzeme kalemleri (tuval baskı, profiller, paspartu, cam, arkalık, izolasyon bandı), metre tül ve m² sarfiyatları, birim maliyetler, kâr marjı ve net kâr dökümü.
                </p>

                <div className={`p-2.5 rounded-xl text-[11px] font-mono space-y-1 mb-4 ${
                  isDarkMode ? "bg-black/30 text-neutral-300 border border-white/5" : "bg-white text-slate-700 border border-slate-200"
                }`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Maliyet Dökümü:</span>
                    <span className="font-bold text-emerald-400">Kalem Kalem Ayrılmış</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">KDV & Kâr Marjı:</span>
                    <span className="text-emerald-500 font-bold">Hesaplanmış</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrintCostBreakdown}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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

            {/* 4. TABLO ARKA ETİKETİ (4x4 CM BARKOD & QR) */}
            <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
              isDarkMode 
                ? "bg-[#181b22] border-[#C5A059]/40 hover:border-[#C5A059]" 
                : "bg-amber-50/50 border-[#B88E3A]/40 hover:border-[#B88E3A]"
            }`}>
              {/* Highlight Tag */}
              <div className="absolute -top-1 -right-1">
                <span className="bg-[#C5A059] text-black text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-sm tracking-wider">
                  YENİ • 4×4 CM
                </span>
              </div>

              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">4. Tablo Arka Etiketi (Barkod/QR)</h3>
                      <span className="text-[10px] font-semibold text-[#C5A059] uppercase">4x4 cm Çerçeve Arkası Etiketi</span>
                    </div>
                  </div>
                </div>

                <p className={`text-xs mb-3 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                  Usta çerçeveyi çaktıktan sonra tablonun arkasına yapıştırır. Çerçeveci logosu, sipariş numarası, müşteri adı, ebat ve barkod/QR kod yer alır. Atölye için üst düzey kurumsallık sağlar.
                </p>

                {/* Mini Preview of 4x4 Label */}
                <div className={`p-2.5 rounded-xl border mb-3 flex items-center justify-between gap-3 ${
                  isDarkMode ? "bg-white text-black border-neutral-300" : "bg-white text-black border-slate-300 shadow-sm"
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider truncate">
                      {companyProfile?.companyName || "NAKKA DECOR"}
                    </div>
                    <div className="text-[8px] font-mono text-neutral-600 truncate">
                      #{orderNumber} • {customerName || "İsimsiz"}
                    </div>
                    <div className="text-[8px] font-mono font-bold text-neutral-800">
                      Dış: {finalOuterWidthCm.toFixed(1)}×{finalOuterHeightCm.toFixed(1)} cm
                    </div>
                    <div className="mt-1 w-full max-w-[110px]">
                      {sampleBarcodeSvg && (
                        <div dangerouslySetInnerHTML={{ __html: sampleBarcodeSvg }} />
                      )}
                    </div>
                  </div>

                  <div className="w-12 h-12 bg-neutral-100 border border-neutral-300 rounded-lg flex flex-col items-center justify-center shrink-0 p-1">
                    <QrCode className="w-7 h-7 text-neutral-900" />
                    <span className="text-[7px] font-mono font-bold text-neutral-600 mt-0.5">40x40 mm</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onPrintBackLabel}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                  isDarkMode
                    ? "bg-[#C5A059] hover:bg-[#d8b062] text-black"
                    : "bg-[#B88E3A] hover:bg-[#a67e2f] text-white"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>4×4 cm Arka Etiketi Yazdır</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t shrink-0 flex items-center justify-between text-xs ${
          isDarkMode ? "border-white/10 bg-[#101216] text-neutral-400" : "border-slate-200 bg-slate-50 text-slate-500"
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C5A059]" />
            <span>Etiketler termal rulo yazıcılara (Zebra/Xprinter) ve standart A4 etiket kağıtlarına tam uyumludur.</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
              isDarkMode
                ? "border-white/10 hover:bg-white/10 text-neutral-300"
                : "border-slate-300 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
