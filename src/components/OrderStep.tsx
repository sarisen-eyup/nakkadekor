import React, { useEffect } from "react";
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
  Printer,
  AlertCircle,
  Plus,
  Tag,
  RotateCcw,
  Check
} from "lucide-react";
import { MaterialInclusionFlags, CostCalculationBreakdown, OrderStatus } from "../types/pricing";

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
  deliveryDateErrorMessage?: string | null;
  setDeliveryDateErrorMessage?: (msg: string | null) => void;
  loadedOrderOriginalDeliveryDate?: string | null;
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
  onCreateOrder?: (options?: { asNewOrder?: boolean }) => void;
  onCreateNewOrder?: () => void;
  onPrevStep?: () => void;
  isExistingOrder?: boolean;
  isOrderModified?: boolean;
  isCostAffectingModified?: boolean;
  isProductionOrDelivered?: boolean;
  loadedOrderStatus?: OrderStatus | null;
  orderNotes?: string;
  onOrderNotesChange?: (notes: string) => void;
  revisionNote?: string;
  referencedOrderNumber?: string;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  customOverridePrice?: number | null;
  onSetCustomOverridePrice?: (price: number | null) => void;
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
  deliveryDateErrorMessage,
  setDeliveryDateErrorMessage,
  loadedOrderOriginalDeliveryDate,
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
  onCreateOrder,
  onCreateNewOrder,
  onPrevStep,
  isExistingOrder = false,
  isOrderModified = false,
  isCostAffectingModified = false,
  isProductionOrDelivered = false,
  loadedOrderStatus = null,
  orderNotes = "",
  onOrderNotesChange,
  revisionNote = "",
  referencedOrderNumber = "",
  quantity = 1,
  onQuantityChange,
  customOverridePrice = null,
  onSetCustomOverridePrice
}) => {
  const getTodayIso = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const toInputDateValue = (d?: string | null): string => {
    if (!d) return "";
    const trimmed = d.trim();
    if (trimmed.includes('.')) {
      const parts = trimmed.split('.');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 3 && parts[0].length <= 2) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return trimmed;
  };

  const normalizeDate = (d?: string | null) => {
    if (!d) return "";
    const trimmed = d.trim();
    if (trimmed.includes('.')) {
      const parts = trimmed.split('.');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 3 && parts[0].length <= 2) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return trimmed;
  };

  const todayIso = getTodayIso();

  const qty = Math.max(1, quantity || 1);
  const naturalUnitPrice = Math.ceil(costBreakdown.calculatedPriceWithVat) + (costBreakdown.shippingCost || 0);
  const calculatedGenelToplam = naturalUnitPrice * qty;
  const currentGenelToplam = Math.round(costBreakdown.effectiveFinalPriceWithVat * qty);
  const totalDiscount = Math.max(0, calculatedGenelToplam - currentGenelToplam);

  // Müşteriye Özel İskonto / Manuel Fiyat State & Senkronizasyon (Genel Toplam üzerinden)
  const [overrideInput, setOverrideInput] = React.useState<string>(
    customOverridePrice != null ? String(currentGenelToplam) : ""
  );

  useEffect(() => {
    if (customOverridePrice == null) {
      setOverrideInput("");
    } else {
      setOverrideInput(String(currentGenelToplam));
    }
  }, [customOverridePrice, currentGenelToplam]);

  const handleApplyOverride = () => {
    if (!onSetCustomOverridePrice) return;
    const val = parseFloat(overrideInput);
    if (!isNaN(val) && val > 0) {
      // Girilen tutar Genel Toplam'dır; adet başına birim fiyata dönüştürülüp atanır.
      // Kargo varsa kargo bedeli düşülerek çerçeve birim fiyatı belirlenir.
      const shippingPerPiece = costBreakdown.shippingCost || 0;
      const unitTarget = val / qty;
      const unitFraming = Math.max(0, unitTarget - shippingPerPiece);
      onSetCustomOverridePrice(Number(unitFraming.toFixed(4)));
    } else {
      onSetCustomOverridePrice(null);
      setOverrideInput("");
    }
  };

  const handleClearOverride = () => {
    if (!onSetCustomOverridePrice) return;
    onSetCustomOverridePrice(null);
    setOverrideInput("");
  };

  const handleQuickPercentDiscount = (percent: number) => {
    if (!onSetCustomOverridePrice) return;
    const targetTotal = Math.max(1, Math.round(calculatedGenelToplam * (1 - percent / 100)));
    const isCurrentlySelected = customOverridePrice != null && Math.abs(currentGenelToplam - targetTotal) <= 1;

    // Toggle: Zaten seçili olan yüzdeye tekrar basıldığında iskontoyu tek tıkla kaldır
    if (isCurrentlySelected) {
      handleClearOverride();
      return;
    }

    // Tek tıkla anında Genel Toplam'a iskonto uygula
    const shippingPerPiece = costBreakdown.shippingCost || 0;
    const unitTarget = targetTotal / qty;
    const unitFraming = Math.max(0, unitTarget - shippingPerPiece);
    setOverrideInput(String(targetTotal));
    onSetCustomOverridePrice(Number(unitFraming.toFixed(4)));
  };

  const handleCreateOrderClick = (asNewOrder: boolean = false) => {
    let hasError = false;

    if (!customerName || !customerName.trim()) {
      setCustomerNameError(true);
      hasError = true;
    }
    if (!customerPhone || !customerPhone.trim()) {
      setCustomerPhoneError(true);
      hasError = true;
    }

    let dateIssue = false;
    let dateIssueMsg = "";

    if (!deliveryDate || !deliveryDate.trim()) {
      dateIssue = true;
      dateIssueMsg = "Lütfen teslim tarihini belirleyiniz.";
    }

    if (dateIssue) {
      setDeliveryDateError(true);
      if (setDeliveryDateErrorMessage) {
        setDeliveryDateErrorMessage(dateIssueMsg);
      }
      hasError = true;
    }

    if (hasError) {
      if (!customerName || !customerName.trim()) {
        document.getElementById("customer-name-input")?.focus();
      } else if (!customerPhone || !customerPhone.trim()) {
        document.getElementById("customer-phone-input")?.focus();
      } else if (dateIssue) {
        document.getElementById("delivery-date-input")?.focus();
      }
      return;
    }

    if (asNewOrder) {
      if (onCreateNewOrder) {
        onCreateNewOrder();
      } else if (onCreateOrder) {
        onCreateOrder({ asNewOrder: true });
      }
    } else {
      if (onCreateOrder) {
        onCreateOrder({ asNewOrder: false });
      } else if (onOpenPrintCenter) {
        onOpenPrintCenter();
      }
    }
  };
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
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> Zorunlu Alan
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
              className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${
                customerNameError
                  ? "border-2 border-red-500 bg-red-500/10 text-red-600 dark:text-red-200 ring-2 ring-red-500/20 focus:outline-none"
                  : (isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] focus:outline-none" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:outline-none")
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
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> Zorunlu Alan
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
                className={`w-full border border-l-0 px-3 py-2 text-xs font-mono tracking-wider transition-all rounded-r-xl ${
                  customerPhoneError
                    ? "border-2 border-red-500 bg-red-500/10 text-red-600 dark:text-red-200 ring-2 ring-red-500/20 focus:outline-none"
                    : (isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] focus:outline-none" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:outline-none")
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
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> {deliveryDateErrorMessage || "Lütfen teslim tarihini belirleyiniz"}
                </span>
              )}
            </div>
            <input
              id="delivery-date-input"
              type="date"
              required
              value={toInputDateValue(deliveryDate)}
              onChange={(e) => {
                const val = e.target.value;
                setDeliveryDate(val);
                if (val && val.trim()) {
                  setDeliveryDateError(false);
                  if (setDeliveryDateErrorMessage) setDeliveryDateErrorMessage(null);
                }
              }}
              className={`w-full px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer ${
                deliveryDateError
                  ? "border-2 border-red-500 bg-red-500/10 text-red-600 dark:text-red-200 ring-2 ring-red-500/20 focus:outline-none"
                  : (isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] focus:outline-none [color-scheme:dark]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:outline-none [color-scheme:light]")
              }`}
            />
            {deliveryDateError && (
              <p className="mt-1 text-[11px] font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{deliveryDateErrorMessage || "Lütfen teslim tarihini belirleyiniz."}</span>
              </p>
            )}
          </div>

          {/* Sipariş Adedi (quantity) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="order-quantity-input" className={`text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-300" : "text-slate-700"
              }`}>
                Sipariş Adedi <span className="text-red-500 font-bold">*</span>
              </label>
              <span className={`text-[10px] font-mono font-bold ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                {quantity || 1} Adet
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQuantityChange && onQuantityChange(Math.max(1, (quantity || 1) - 1))}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer active:scale-95 ${
                  isDarkMode 
                    ? "bg-[#101216] border-white/10 text-white hover:border-[#C5A059]" 
                    : "bg-white border-slate-300 text-slate-800 hover:border-[#B88E3A]"
                }`}
                title="Adedi Azalt"
              >
                -
              </button>
              <div className="relative flex-1">
                <input
                  id="order-quantity-input"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={quantity || 1}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    if (onQuantityChange) {
                      onQuantityChange(isNaN(parsed) || parsed < 1 ? 1 : parsed);
                    }
                  }}
                  className={`w-full px-3 py-2 text-center text-xs font-mono font-bold rounded-xl border transition-all ${
                    isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] focus:outline-none" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:outline-none"
                  }`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold pointer-events-none ${
                  isDarkMode ? "text-neutral-400" : "text-slate-500"
                }`}>
                  Adet
                </span>
              </div>
              <button
                type="button"
                onClick={() => onQuantityChange && onQuantityChange((quantity || 1) + 1)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer active:scale-95 ${
                  isDarkMode 
                    ? "bg-[#101216] border-white/10 text-white hover:border-[#C5A059]" 
                    : "bg-white border-slate-300 text-slate-800 hover:border-[#B88E3A]"
                }`}
                title="Adedi Artır"
              >
                +
              </button>
            </div>
          </div>

          {/* Sipariş / Atölye Notu ve Revizyon Referans Bilgisi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="order-notes-input" className={`text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-300" : "text-slate-700"
              }`}>
                Sipariş / Atölye Notu
              </label>
              {referencedOrderNumber && (
                <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Ref: #{referencedOrderNumber}
                </span>
              )}
            </div>
            <textarea
              id="order-notes-input"
              rows={2}
              value={orderNotes || ""}
              onChange={(e) => onOrderNotesChange && onOrderNotesChange(e.target.value)}
              placeholder="Sipariş, montaj veya atölye için not..."
              className={`w-full px-3 py-2 text-xs rounded-xl border transition-all resize-none ${
                isDarkMode ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] focus:outline-none" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:outline-none"
              }`}
            />
            {referencedOrderNumber && (
              <p className="mt-1 text-[10px] text-amber-500/90 font-medium flex items-center gap-1">
                <span>Revize edilen referans sipariş no: <strong>#{referencedOrderNumber}</strong></span>
              </p>
            )}
          </div>

          {/* Zorunlu Alanlar Hata Bildirim Çubuğu */}
          {(customerNameError || customerPhoneError || deliveryDateError) && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-bold flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {deliveryDateError && deliveryDateErrorMessage
                  ? deliveryDateErrorMessage
                  : "Siparişi oluşturabilmek için lütfen kırmızı ile belirtilen zorunlu alanları doldurunuz."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 04. SEGMENTED TICKET ORDER CARD (Sipariş Özeti & Genel Toplam) */}
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
              SİPARİŞ ÖZETİ
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isDarkMode ? "bg-[#101216] border-white/10 text-neutral-300" : "bg-slate-100 border-slate-200 text-slate-600"
            }`}>
              #{orderNumber}
            </span>
          </div>

          {/* Quick Specs List */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-baseline gap-2">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Müşteri:</span>
              <span className="font-bold truncate max-w-[220px]" title={customerName}>{customerName || "—"}</span>
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
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Sipariş Adedi:</span>
              <span className="font-mono font-bold text-[#C5A059]">{quantity || 1} Adet</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Teslimat:</span>
              <span className="font-medium">{deliveryMethod === "store" ? "Mağaza Teslim" : "Kargo"}</span>
            </div>
          </div>
        </div>

        {/* Bottom Contrasting Action Bar */}
        <div className={`p-4 sm:p-5 flex flex-col gap-3.5 ${
          isDarkMode ? "bg-[#101216]" : "bg-slate-900 text-white"
        }`}>
          {/* Top Row: Price Summary & Breakdown Action */}
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                Genel Toplam (KDV Dahil)
              </span>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#C5A059] tracking-tight">
                  ₺{(costBreakdown.effectiveFinalPriceWithVat * qty).toLocaleString("tr-TR")}
                </span>
                {customOverridePrice != null && totalDiscount > 0 && (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm line-through opacity-60 font-mono text-neutral-400">
                      ₺{calculatedGenelToplam.toLocaleString("tr-TR")}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      -%{Math.round((totalDiscount / calculatedGenelToplam) * 100)} İndirim (-₺{Math.round(totalDiscount).toLocaleString("tr-TR")})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity multiplier pill & Breakdown modal button */}
            <div className="flex items-center gap-2 flex-wrap">
              {qty > 1 && (
                <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                  isDarkMode 
                    ? "bg-white/5 border-white/10 text-neutral-300" 
                    : "bg-slate-800 border-slate-700 text-slate-200"
                }`}>
                  {qty} Adet × ₺{Number(costBreakdown.effectiveFinalPriceWithVat.toFixed(2)).toLocaleString("tr-TR")}
                </span>
              )}
              <button
                type="button"
                onClick={onOpenCostModal}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                  isDarkMode
                    ? "bg-white/5 hover:bg-white/10 text-[#C5A059] border-[#C5A059]/30 hover:border-[#C5A059]/60"
                    : "bg-slate-800 hover:bg-slate-700 text-[#E5C158] border-slate-700"
                }`}
                title="Ayrıntılı Maliyet ve Fiyat Dökümü Tablosunu Aç"
              >
                <Calculator className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Maliyet Dökümü</span>
              </button>
            </div>
          </div>

          {/* Warning / Status Notification Banner (Full Width, never cramped or truncated) */}
          {isExistingOrder && (
            <>
              {isProductionOrDelivered ? (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-semibold flex items-start gap-2 shadow-sm leading-snug">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>Üretimde veya teslim edilmiş bir siparişi güncelleyemezsiniz.</span>
                </div>
              ) : isCostAffectingModified ? (
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-semibold flex items-start gap-2 shadow-sm leading-snug">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>Maliyeti etkileyen alanlar (En, Boy, Profil, Cam, Adet) değiştirildiğinde mevcut sipariş güncellenemez. Lütfen 'Yeni Sipariş Oluştur' butonunu kullanın.</span>
                </div>
              ) : isOrderModified ? (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Müşteri veya teslimat bilgileri değişti (Onaylı fiyat korunarak güncellenir).</span>
                </div>
              ) : null}
            </>
          )}

          {/* Action Buttons Row */}
          {isExistingOrder ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 w-full">
              <button
                type="button"
                id="btn-update-simulator-order"
                disabled={isProductionOrDelivered || isCostAffectingModified}
                onClick={() => handleCreateOrderClick(false)}
                className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 text-center ${
                  isProductionOrDelivered || isCostAffectingModified
                    ? "opacity-40 cursor-not-allowed bg-neutral-800 text-neutral-400 border border-neutral-700"
                    : isOrderModified
                      ? "ring-2 ring-amber-500/80 ring-offset-1 cursor-pointer " + (isDarkMode ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-amber-600 text-white hover:bg-amber-500")
                      : isDarkMode
                        ? "bg-[#C5A059] text-black hover:bg-[#b5924d] cursor-pointer"
                        : "bg-[#B88E3A] text-white hover:bg-[#a67e2f] cursor-pointer"
                }`}
                title={
                  isProductionOrDelivered
                    ? "Üretimde veya teslim edilmiş bir siparişi güncelleyemezsiniz."
                    : isCostAffectingModified
                      ? "Maliyeti etkileyen alanlar değiştiğinde sipariş güncellenemez. Lütfen yeni sipariş oluşturun."
                      : "Mevcut siparişi simülatördeki değişikliklerle güncelle"
                }
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Siparişi Güncelle</span>
              </button>

              <button
                type="button"
                id="btn-create-new-order-from-archive"
                onClick={() => handleCreateOrderClick(true)}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border active:scale-95 cursor-pointer text-center ${
                  isCostAffectingModified || isProductionOrDelivered
                    ? "border-emerald-500 bg-emerald-500 text-black font-extrabold shadow-md hover:bg-emerald-400 ring-2 ring-emerald-500/40"
                    : isDarkMode
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-500/70"
                      : "border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                }`}
                title="Formdaki verileri koruyarak yeni bir sipariş numarası ve güncel fiyatlarla yeni sipariş oluştur"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Yeni Sipariş Oluştur</span>
              </button>
            </div>
          ) : (
            <div className="pt-1 w-full">
              <button
                type="button"
                id="btn-create-simulator-order"
                onClick={() => handleCreateOrderClick(false)}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                  isDarkMode
                    ? "bg-[#C5A059] text-black hover:bg-[#b5924d]"
                    : "bg-[#B88E3A] text-white hover:bg-[#a67e2f]"
                }`}
                title="Simülatördeki ölçü ve malzemelerle siparişi oluştur"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Siparişi Oluştur</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 05. MÜŞTERİYE ÖZEL İSKONTO / ANLAŞMALI FİYAT BÖLÜMÜ (Sipariş Özeti ve Genel Toplamın Altında) */}
      <div className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
        isDarkMode ? "bg-[#181c24] border-white/10" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/10 text-[#B88E3A]"
            }`}>
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-100" : "text-slate-800"
              }`}>
                Özel İskonto / Anlaşmalı Fiyat
              </h4>
              <p className={`text-[10px] ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Müşteriye özel indirim veya anlaşmalı toplam tutar belirleyin
              </p>
            </div>
          </div>

          {customOverridePrice != null && (
            <button
              type="button"
              onClick={handleClearOverride}
              className="text-[11px] font-mono font-bold text-red-500 hover:text-red-400 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1 cursor-pointer transition-colors"
              title="İskontoyu kaldırıp standart fiyata dön"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>

        {/* Hızlı İskonto Butonları (%5, %10, %15, %20, %25) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-400" : "text-slate-500"
            }`}>
              Hızlı İskonto Seçenekleri:
            </span>
            <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>
              Tek tıkla uygula / kaldır
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[5, 10, 15, 20, 25].map((pct) => {
              const targetTotal = Math.max(1, Math.round(calculatedGenelToplam * (1 - pct / 100)));
              const isSelected = customOverridePrice != null && Math.abs(currentGenelToplam - targetTotal) <= 1;

              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercentDiscount(pct)}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-extrabold border transition-all cursor-pointer text-center active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? (isDarkMode 
                          ? "bg-[#C5A059] text-black border-[#C5A059] shadow-md ring-2 ring-[#C5A059]/40" 
                          : "bg-[#B88E3A] text-white border-[#B88E3A] shadow-md ring-2 ring-[#B88E3A]/30")
                      : (isDarkMode
                          ? "bg-[#101216] border-white/10 text-neutral-300 hover:border-[#C5A059]/50 hover:text-white hover:bg-white/5"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-[#B88E3A]/50 hover:bg-slate-100")
                  }`}
                  title={`%${pct} İskonto Uygula (${qty > 1 ? `${qty} Adet Toplam: ₺${targetTotal.toLocaleString("tr-TR")}` : `₺${targetTotal.toLocaleString("tr-TR")}`})`}
                >
                  <span className="flex items-center gap-0.5">
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    %{pct}
                  </span>
                  <span className={`text-[9px] font-normal leading-none opacity-80 ${isSelected ? (isDarkMode ? "text-black" : "text-white") : (isDarkMode ? "text-neutral-400" : "text-slate-500")}`}>
                    ₺{targetTotal.toLocaleString("tr-TR")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manuel Tutar Girişi ve Uygula Butonu */}
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
            isDarkMode ? "text-neutral-400" : "text-slate-500"
          }`}>
            Veya Özel Genel Toplam Tutarı Girin:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold pointer-events-none ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                ₺
              </span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder={String(calculatedGenelToplam)}
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyOverride();
                  }
                }}
                className={`w-full border rounded-xl pl-7 pr-32 py-2.5 text-xs font-mono font-bold focus:outline-none transition-all ${
                  isDarkMode 
                    ? "bg-[#101216] border-white/15 text-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]" 
                    : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:ring-1 focus:ring-[#B88E3A] shadow-xs"
                }`}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono pointer-events-none ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                {qty > 1 ? `(${qty} Adet Toplamı)` : "(KDV Dahil)"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleApplyOverride}
              className={`px-4 py-2.5 font-mono font-bold text-xs rounded-xl transition-all shrink-0 shadow-sm cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                isDarkMode 
                  ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" 
                  : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Uygula</span>
            </button>
          </div>
        </div>

        {/* Aktif Özel Fiyat Bilgi Çubuğu */}
        {customOverridePrice != null && (
          <div className={`p-3 border rounded-xl text-xs font-mono flex items-center justify-between gap-2.5 animate-fadeIn ${
            isDarkMode ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-800"
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              <div className="truncate">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Özel Fiyat Aktif:</span>
                  <strong className="font-extrabold text-sm">₺{currentGenelToplam.toLocaleString("tr-TR")}</strong>
                  {totalDiscount > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${
                      isDarkMode ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-200 text-emerald-900"
                    }`}>
                      -₺{Math.round(totalDiscount).toLocaleString("tr-TR")} indirim (%{Math.round((totalDiscount / calculatedGenelToplam) * 100)})
                    </span>
                  )}
                </div>
                {qty > 1 && (
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Adet Başına Birim: ₺{Number(costBreakdown.effectiveFinalPriceWithVat.toFixed(2)).toLocaleString("tr-TR")}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearOverride}
              className="text-[11px] underline font-bold text-red-400 hover:text-red-300 shrink-0 cursor-pointer p-1"
            >
              Kaldır
            </button>
          </div>
        )}
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
