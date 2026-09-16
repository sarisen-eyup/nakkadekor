import React from "react";
import { 
  Shield, 
  Truck, 
  Store, 
  User, 
  Phone, 
  Calendar, 
  Download, 
  Calculator, 
  ChevronLeft, 
  CheckCircle2, 
  FileText,
  Printer
} from "lucide-react";
import { MaterialInclusionFlags, CostCalculationBreakdown } from "../types/pricing";

interface OrderStepProps {
  inclusionFlags: MaterialInclusionFlags;
  handleToggleFlag: (flagKey: keyof MaterialInclusionFlags) => void;
  costBreakdown: CostCalculationBreakdown;
  deliveryMethod: "store" | "shipping";
  setDeliveryMethod: (m: "store" | "shipping") => void;
  defaultShippingCost: number;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerNameError: boolean;
  setCustomerNameError: (err: boolean) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerPhoneError: boolean;
  setCustomerPhoneError: (err: boolean) => void;
  deliveryDate: string;
  setDeliveryDate: (val: string) => void;
  deliveryDateError: boolean;
  setDeliveryDateError: (err: boolean) => void;
  formatTrPhone: (val: string) => string;
  isDarkMode: boolean;
  orderNumber: string;
  artworkWidth: number;
  artworkHeight: number;
  finalOuterWidthCm: number;
  finalOuterHeightCm: number;
  activeInnerProfileName?: string;
  matWidth: number;
  innerMatColorName: string;
  downloadCompositedImage: () => void;
  onOpenCostModal: () => void;
  onOpenPrintCenter?: () => void;
  onPrevStep?: () => void;
}

export const OrderStep: React.FC<OrderStepProps> = ({
  inclusionFlags,
  handleToggleFlag,
  costBreakdown,
  deliveryMethod,
  setDeliveryMethod,
  defaultShippingCost,
  customerName,
  setCustomerName,
  customerNameError,
  setCustomerNameError,
  customerPhone,
  setCustomerPhone,
  customerPhoneError,
  setCustomerPhoneError,
  deliveryDate,
  setDeliveryDate,
  deliveryDateError,
  setDeliveryDateError,
  formatTrPhone,
  isDarkMode,
  orderNumber,
  artworkWidth,
  artworkHeight,
  finalOuterWidthCm,
  finalOuterHeightCm,
  activeInnerProfileName,
  matWidth,
  innerMatColorName,
  downloadCompositedImage,
  onOpenCostModal,
  onOpenPrintCenter,
  onPrevStep
}) => {
  const materialItems = [
    {
      key: "includeArtworkPrint" as const,
      label: "Kanvas / Tuval Baskı",
      desc: inclusionFlags.includeArtworkPrint ? "Atölyemizde basılacak" : "Müşteri getirdi (0 ₺)",
      price: costBreakdown.artworkSellingPrice,
      active: inclusionFlags.includeArtworkPrint
    },
    {
      key: "includeGlass" as const,
      label: "Koruyucu Cam / Pleksi",
      desc: inclusionFlags.includeGlass ? "Dereceli cam dahil" : "Camsız (0 ₺)",
      price: costBreakdown.glassSellingPrice,
      active: inclusionFlags.includeGlass
    },
    {
      key: "includeBackingBoard" as const,
      label: "3mm MDF Arka Kapama",
      desc: inclusionFlags.includeBackingBoard ? "MDF arkalık dahil" : "Arkalıksız",
      price: costBreakdown.backingBoardSellingPrice,
      active: inclusionFlags.includeBackingBoard
    },
    {
      key: "includeBackingCloth" as const,
      label: "Arkalık Koruma Bezi",
      desc: inclusionFlags.includeBackingCloth ? "Bezi kaplama dahil" : "Hariç",
      price: costBreakdown.backingClothSellingPrice,
      active: Boolean(inclusionFlags.includeBackingCloth)
    }
  ];

  return (
    <div className="space-y-4">
      {/* 01. Malzeme & Dahiliyet Seçimleri Kartı */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              Malzeme & Dahiliyetler
            </h3>
          </div>
          <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
            Maliyete Etki Eder
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {materialItems.map((item) => (
            <div
              key={item.key}
              onClick={() => handleToggleFlag(item.key)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                item.active
                  ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059] text-white" : "bg-[#B88E3A]/10 border-[#B88E3A] text-slate-900 font-semibold")
                  : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-400 hover:text-neutral-200" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={() => {}}
                  className="accent-[#C5A059] w-3.5 h-3.5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold block leading-tight">{item.label}</span>
                  <span className={`text-[9px] block ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    {item.desc}
                  </span>
                </div>
              </div>
              <span className={`font-mono text-xs font-bold ml-1 shrink-0 ${
                item.active 
                  ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]") 
                  : (isDarkMode ? "text-neutral-500" : "text-slate-400")
              }`}>
                {item.active ? `₺${item.price.toFixed(0)}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 02. Teslimat Yöntemi Kartı */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Truck className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            isDarkMode ? "text-neutral-100" : "text-slate-800"
          }`}>
            Teslimat Yöntemi
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDeliveryMethod("store")}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              deliveryMethod === "store"
                ? (isDarkMode ? "bg-[#C5A059]/20 border-[#C5A059] text-white shadow-sm" : "bg-[#B88E3A]/15 border-[#B88E3A] text-slate-900 font-bold shadow-sm")
                : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mağaza Teslim</span>
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
              Ücretsiz (0 ₺)
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryMethod("shipping")}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              deliveryMethod === "shipping"
                ? (isDarkMode ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm" : "bg-amber-100 border-amber-500 text-amber-900 font-bold shadow-sm")
                : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900")
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              <span>Kargo Gönderimi</span>
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isDarkMode ? "text-amber-400" : "text-amber-700 font-bold"}`}>
              +₺{defaultShippingCost} Kargo
            </div>
          </button>
        </div>
      </div>

      {/* 03. Müşteri & İletişim Bilgileri Kartı */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <User className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            isDarkMode ? "text-neutral-100" : "text-slate-800"
          }`}>
            Müşteri & İletişim Bilgileri
          </h3>
        </div>

        <div className="space-y-3">
          {/* Müşteri Adı Soyadı */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="customer-name-input" className={`text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-300" : "text-slate-700"
              }`}>
                Müşteri Adı Soyadı <span className="text-red-500 font-bold">*</span>
              </label>
              {customerNameError && (
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider animate-pulse">
                  Zorunlu Alan
                </span>
              )}
            </div>
            <input
              id="customer-name-input"
              type="text"
              required
              placeholder="Örn: Ahmet Yılmaz"
              value={customerName}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ\s]/g, "");
                setCustomerName(val);
                if (val.trim()) setCustomerNameError(false);
              }}
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors ${
                customerNameError
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-slate-900 dark:text-white"
                  : (isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]")
              }`}
            />
          </div>

          {/* İletişim / Telefon */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="customer-phone-input" className={`text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-300" : "text-slate-700"
              }`}>
                İletişim / Telefon <span className="text-red-500 font-bold">*</span>
              </label>
              {customerPhoneError && (
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider animate-pulse">
                  Zorunlu Alan
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className={`border border-r-0 font-bold text-xs px-2.5 py-2 rounded-l-xl select-none flex items-center gap-1 shrink-0 ${
                isDarkMode ? "bg-[#20242c] border-white/10 text-[#C5A059]" : "bg-slate-100 border-slate-300 text-[#B88E3A]"
              }`}>
                <span>🇹🇷</span> +90
              </span>
              <input
                id="customer-phone-input"
                type="tel"
                inputMode="numeric"
                required
                placeholder="555 333 22 11"
                maxLength={14}
                value={customerPhone}
                onChange={(e) => {
                  const formatted = formatTrPhone(e.target.value);
                  setCustomerPhone(formatted);
                  if (formatted.trim()) setCustomerPhoneError(false);
                }}
                className={`w-full border border-l-0 px-3 py-2 text-xs font-mono tracking-wider focus:outline-none rounded-r-xl transition-colors ${
                  customerPhoneError
                    ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-slate-900 dark:text-white"
                    : (isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]")
                }`}
              />
            </div>
          </div>

          {/* Tahmini Teslim Tarihi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="delivery-date-input" className={`text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-300" : "text-slate-700"
              }`}>
                Tahmini Teslim Tarihi <span className="text-red-500 font-bold">*</span>
              </label>
              {deliveryDateError && (
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider animate-pulse">
                  Zorunlu Alan
                </span>
              )}
            </div>
            <input
              id="delivery-date-input"
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                if (e.target.value.trim()) setDeliveryDateError(false);
              }}
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors cursor-pointer ${
                deliveryDateError
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-slate-900 dark:text-white"
                  : (isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] [color-scheme:dark]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] [color-scheme:light]")
              }`}
            />
          </div>
        </div>
      </div>

      {/* 04. SEGMENTED TICKET ORDER CARD (Matching Screen 2 & 3 in Reference Image) */}
      <div className={`rounded-3xl border overflow-hidden shadow-lg transition-all ${
        isDarkMode ? "bg-[#181c24] border-white/15" : "bg-white border-slate-200"
      }`}>
        {/* Top Ticket Header */}
        <div className={`p-4 border-b border-dashed ${
          isDarkMode ? "border-white/15" : "border-slate-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
              isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
            }`}>
              SİPARİŞ ÖZETİ & BİLETİ
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isDarkMode ? "bg-[#101216] border-white/10 text-neutral-300" : "bg-slate-100 border-slate-200 text-slate-600"
            }`}>
              #{orderNumber}
            </span>
          </div>

          {/* Quick Specs List */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Müşteri:</span>
              <span className="font-bold">{customerName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Eser Ebadı:</span>
              <span className="font-mono font-bold">{artworkWidth} × {artworkHeight} cm</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Dış Çerçeve Ebadı:</span>
              <span className="font-mono font-bold">{finalOuterWidthCm.toFixed(1)} × {finalOuterHeightCm.toFixed(1)} cm</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Profil:</span>
              <span className="font-medium truncate max-w-[160px]">{activeInnerProfileName || "Standart Profil"}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Paspartu:</span>
              <span className="font-medium">{matWidth > 0 ? `${matWidth} cm (${innerMatColorName})` : "Paspartusuz"}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Teslimat:</span>
              <span className="font-medium">{deliveryMethod === "store" ? "Mağaza Teslim" : "Kargo"}</span>
            </div>
          </div>
        </div>

        {/* Bottom Contrasting Action Bar */}
        <div className={`p-4 flex items-center justify-between gap-3 ${
          isDarkMode ? "bg-[#111317]" : "bg-slate-900 text-white"
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
              Genel Toplam (KDV Dahil)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-extrabold text-[#C5A059]">
                ₺{costBreakdown.effectiveFinalPriceWithVat.toLocaleString("tr-TR")}
              </span>
              <button
                type="button"
                onClick={onOpenCostModal}
                className="text-[10px] underline cursor-pointer text-neutral-400 hover:text-white"
              >
                Döküm
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPrintCenter || downloadCompositedImage}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              isDarkMode
                ? "bg-[#C5A059] text-black hover:bg-[#b5924d]"
                : "bg-[#B88E3A] text-white hover:bg-[#a67e2f]"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır & Belgeler</span>
          </button>
        </div>
      </div>

      {/* Geri Butonu */}
      {onPrevStep && (
        <button
          type="button"
          onClick={onPrevStep}
          className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all border cursor-pointer ${
            isDarkMode
              ? "border-white/10 bg-[#101216] text-neutral-300 hover:text-white"
              : "border-slate-300 bg-white text-slate-700 hover:text-slate-900"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Geri</span>
        </button>
      )}
    </div>
  );
};
