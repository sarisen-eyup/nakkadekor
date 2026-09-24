import React, { useState } from "react";
import { 
  Building2, 
  Copy, 
  Check, 
  Clock, 
  X, 
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  User,
  CreditCard
} from "lucide-react";

export interface PaymentBankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  packageName?: string;
  packagePriceText?: string;
  pendingCreditsAmount?: number;
  companyName?: string;
  onReceiptSent?: () => void;
}

export const PaymentBankTransferModal: React.FC<PaymentBankTransferModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  packageName = "Atölye Kredi Paketi",
  packagePriceText = "1.500 ₺",
  pendingCreditsAmount = 50,
  companyName = "Atölyemiz",
  onReceiptSent
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const RECIPIENT_NAME = "AYŞEN SARIŞEN";
  const BANK_NAME = "T.C. ZİRAAT BANKASI";
  const IBAN_NUMBER = "TR06 0001 0020 8346 4637 3750 05";
  const CLEAN_IBAN = IBAN_NUMBER.replace(/\s+/g, "");

  const WHATSAPP_PHONE = "905424710686";
  const effectiveCompanyName = companyName?.trim() || "Atölyemiz";
  const WHATSAPP_MESSAGE = `Merhaba, ${packageName} paketi için ödemeyi gerçekleştirdim. Firma/Atölye adım: ${effectiveCompanyName}.`;
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  const handleCopyIban = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(CLEAN_IBAN);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = CLEAN_IBAN;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn("IBAN kopyalama hatası:", err);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const isUnlimited = pendingCreditsAmount >= 999999;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all transform scale-100 ${
          isDarkMode 
            ? "bg-[#14161b] border-neutral-700/80 text-white" 
            : "bg-white border-slate-200 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-modal-title"
      >
        {/* Üst Banner & Kapat Butonu */}
        <div className={`px-6 pt-6 pb-4 border-b flex items-start justify-between gap-4 ${
          isDarkMode ? "border-neutral-800 bg-neutral-900/60" : "border-slate-100 bg-slate-50/80"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {isUnlimited ? "Yıllık Sınırsız" : `+${pendingCreditsAmount} Kredi`}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  Havale / EFT
                </span>
              </div>
              <h3 id="bank-modal-title" className="text-lg font-black tracking-tight mt-1 text-[#C5A059]">
                Ödeme Bekleniyor
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode 
                ? "text-neutral-400 hover:text-white hover:bg-white/10" 
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="Pencereyi Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Açıklama Metni */}
          <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
            isDarkMode ? "text-neutral-300" : "text-slate-700"
          }`}>
            Kredinizin hesabınıza tanımlanması için lütfen aşağıdaki hesaba ödemenizi gerçekleştirin.
          </p>

          {/* Talep Edilen Paket & Tutar Özeti */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDarkMode ? "bg-black/40 border-neutral-800 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-800"
          }`}>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 block font-bold">
                Seçilen Paket
              </span>
              <span className="text-sm font-black text-[#C5A059]">
                {packageName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 block font-bold">
                Ödenecek Tutar
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                {packagePriceText}
              </span>
            </div>
          </div>

          {/* Banka Bilgileri Kutusu */}
          <div className={`p-5 rounded-2xl border space-y-3.5 ${
            isDarkMode 
              ? "bg-[#181b20] border-amber-500/30 shadow-inner" 
              : "bg-amber-50/50 border-amber-300/80 shadow-sm"
          }`}>
            <div className="border-b pb-3 border-amber-500/20">
              <span className="font-bold flex items-center gap-2 text-[#C5A059] uppercase tracking-wider text-xs">
                <Building2 className="w-4 h-4" /> Banka Hesap Bilgileri
              </span>
            </div>

            {/* Hesap Adı */}
            <div className="pt-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-400" /> Hesap Adı
              </span>
              <div className={`text-sm font-black tracking-wide font-mono mt-0.5 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                {RECIPIENT_NAME}
              </div>
            </div>

            {/* Banka */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" /> Banka
              </span>
              <div className={`text-xs font-bold font-mono mt-0.5 ${
                isDarkMode ? "text-neutral-200" : "text-slate-800"
              }`}>
                {BANK_NAME}
              </div>
            </div>

            {/* IBAN Numarası & Kopyala Butonu (Tek Satır, Asla Bölünmez) */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-neutral-400" /> IBAN
              </span>
              <div className="mt-1.5 flex items-center gap-2 w-full">
                <div className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border font-mono text-[12px] sm:text-[13px] font-bold select-all whitespace-nowrap overflow-x-auto scrollbar-none ${
                  isDarkMode 
                    ? "bg-black/60 border-neutral-700 text-amber-300" 
                    : "bg-white border-slate-300 text-slate-900"
                }`}>
                  {IBAN_NUMBER}
                </div>

                <button
                  type="button"
                  onClick={handleCopyIban}
                  className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95 ${
                    copied 
                      ? "bg-emerald-600 text-white" 
                      : isDarkMode 
                        ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700" 
                        : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                  }`}
                  title="IBAN Numarasını Panoya Kopyala"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Kopyalandı Bildirimi */}
            {copied && (
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 pt-1 animate-fade-in">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>IBAN panoya kopyalandı.</span>
              </div>
            )}
          </div>

          {/* Bilgilendirme Notu */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-[11px] leading-relaxed ${
            isDarkMode ? "bg-black/20 border-white/5 text-neutral-400" : "bg-slate-100/70 border-slate-200 text-slate-600"
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              Ödemenizi yaptıktan sonra dekontu aşağıdaki yeşil butona tıklayarak WhatsApp üzerinden iletebilirsiniz. Ekibimiz en kısa sürede kredinizi aktif edecektir.
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="pt-2 space-y-2.5">
            {/* Yeşil ve Belirgin WhatsApp Butonu */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (onReceiptSent) onReceiptSent();
              }}
              className="w-full py-3.5 px-5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg bg-[#25D366] hover:bg-[#20ba5a] text-white tracking-wide active:scale-[0.98]"
            >
              <MessageSquare className="w-5 h-5 fill-current" />
              <span>Dekontu WhatsApp'tan Gönder</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            {/* Kapat Butonu */}
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Kapat
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
