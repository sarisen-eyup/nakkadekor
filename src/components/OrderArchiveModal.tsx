import React, { useState } from "react";
import { 
  X, 
  Archive, 
  Search, 
  Trash2, 
  FileText, 
  Filter,
  Calendar,
  User,
  ArrowUpDown,
  RotateCcw
} from "lucide-react";
import { OrderArchiveItem, OrderStatus, CompanyProfile, FrameProfileItem } from "../types/pricing";

interface OrderArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  orders: OrderArchiveItem[];
  profiles?: FrameProfileItem[];
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
  profiles = [],
  onDeleteOrder,
  onLoadOrderToWorkspace,
  companyProfile,
  onUpdateStatus
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className={`w-full max-w-5xl rounded-none sm:rounded-3xl border-0 sm:border shadow-2xl flex flex-col overflow-hidden h-[100dvh] sm:h-[88vh] max-h-[100dvh] sm:max-h-[850px] transition-all ${
        isDarkMode ? "bg-[#14171d] border-[#C5A059]/30 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        
        {/* Header (Mobil & Masaüstü Düzenli) */}
        <div className={`px-3.5 py-3 sm:px-6 sm:py-4 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shrink-0 ${
              isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30" : "bg-[#B88E3A]/20 text-[#B88E3A]"
            }`}>
              <Archive className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base md:text-lg font-black tracking-wider uppercase flex items-center gap-2 truncate">
                SİPARİŞ ARŞİVİ
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold uppercase bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 shrink-0">
                  {orders.length}
                </span>
              </h2>
              <p className={`text-[10px] sm:text-xs truncate ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                Kayıtlı siparişler ve üretim dökümleri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center ${
              isDarkMode ? "hover:bg-neutral-800 text-neutral-400 hover:text-white active:bg-neutral-700" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900 active:bg-slate-300"
            }`}
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Filter Bar */}
        <div className={`px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 ${
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
              className={`w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-xl border text-base sm:text-xs focus:outline-none transition-colors ${
                isDarkMode 
                  ? "bg-[#14171d] border-white/15 text-white placeholder-neutral-500 focus:border-[#C5A059]" 
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#B88E3A]"
              }`}
            />
          </div>

          {/* Status Filter buttons (Yatay Kaydırılabilir Dokunmatik Şerit) */}
          <div 
            data-drag-scroll="true"
            className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto drag-scroll touch-pan-x overscroll-x-contain py-1 select-none no-scrollbar"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 hidden lg:inline">Durum:</span>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                  statusFilter === f.id
                    ? (isDarkMode ? "bg-[#C5A059] text-black font-bold shadow-xs" : "bg-[#B88E3A] text-white font-bold shadow-xs")
                    : (isDarkMode ? "bg-white/5 text-neutral-400 hover:text-white border border-white/5" : "bg-white text-slate-600 border border-slate-200")
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toast / Copied notice */}
        {copiedNotice && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-4 sm:px-6 py-2 text-xs font-mono flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{copiedNotice}</span>
          </div>
        )}

        {/* List Body (Mobilde Kartlar, Masaüstünde Tablo) */}
        <div 
          data-allow-native-scroll="true"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-0 allow-native-scroll"
        >
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 sm:p-12 text-center text-neutral-500">
              <Archive className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-wider">Kayıtlı Sipariş Yok</p>
              <p className="text-xs text-neutral-400 mt-1">Aramayı değiştirebilir veya ana ekrandan yeni sipariş oluşturabilirsiniz.</p>
            </div>
          ) : (
            <>
              {/* MOBİL GÖRÜNÜM: Dokunmatik Ekranlara Özel Kartlar (md:hidden) */}
              <div className="block md:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={`m-${order.id}`}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDarkMode
                        ? "bg-[#101217] border-white/10 hover:border-[#C5A059]/40"
                        : "bg-white border-slate-200 hover:border-[#B88E3A]/40 shadow-xs"
                    }`}
                  >
                    {/* Üst Satır: Sipariş No & Durum */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 dark:border-white/10 border-slate-100">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#C5A059]">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{order.orderNumber}</span>
                      </div>
                      <div>
                        {onUpdateStatus ? (
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={`text-[10px] font-bold uppercase font-mono px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                              order.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : order.status === "production"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : order.status === "delivered"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            }`}
                          >
                            <option value="quote" className="bg-neutral-900 text-blue-400">TEKLİF</option>
                            <option value="approved" className="bg-neutral-900 text-emerald-400">ONAYLANDI</option>
                            <option value="production" className="bg-neutral-900 text-amber-400">ÜRETİMDE</option>
                            <option value="delivered" className="bg-neutral-900 text-purple-400">TESLİM EDİLDİ</option>
                          </select>
                        ) : (
                          getStatusBadge(order.status)
                        )}
                      </div>
                    </div>

                    {/* Orta Kısım: Müşteri, Ölçü & Fiyat */}
                    <div className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-bold text-sm truncate">
                          {order.customerName}
                        </div>
                        <div className="font-mono font-black text-sm text-[#C5A059] shrink-0">
                          {order.currency}{order.totalAmount.toLocaleString("tr-TR")}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>{order.customerPhone || "Tel: -"}</span>
                        <span className="font-mono">{order.deliveryMethod === "shipping" ? "🚚 Kargo Dahil" : "🏪 Atölye Teslim"}</span>
                      </div>

                      <div className="bg-white/5 dark:bg-white/5 p-2 rounded-xl flex items-center justify-between text-[11px]">
                        <div className="truncate pr-2">
                          <span className="font-mono font-semibold text-[#C5A059]">{order.artworkWidthCm}×{order.artworkHeightCm} cm</span>
                          <span className="text-neutral-400 mx-1">•</span>
                          <span className="text-neutral-300">{order.innerFrameTitle || "Çerçeve Belirtilmedi"}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 shrink-0 font-mono">
                          {order.createdAt?.split(" ")[0] || ""}
                        </div>
                      </div>
                    </div>

                    {/* Alt İşlem Butonları (Mobilde: Simülatöre Ekle & Sil) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 dark:border-white/10 border-slate-100">
                      {/* SİMÜLATÖRE EKLE */}
                      <button
                        type="button"
                        onClick={() => {
                          onLoadOrderToWorkspace(order);
                          onClose();
                        }}
                        title="Bu Siparişi Simülatöre Ekle & Düzenle"
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer border ${
                          isDarkMode 
                            ? "bg-[#C5A059] text-black border-[#d4ae61] hover:bg-[#b8944c]" 
                            : "bg-[#B88E3A] text-white border-[#a88031] hover:bg-[#a17a2b]"
                        }`}
                      >
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Simülatöre Ekle</span>
                      </button>

                      {/* SİL */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`${order.orderNumber} numaralı siparişi silmek istediğinize emin misiniz?`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        title="Siparişi Sil"
                        className="flex items-center justify-center py-2.5 px-3.5 rounded-xl border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* MASAÜSTÜ GÖRÜNÜM: Detaylı Tablo (hidden md:block) */}
              <div 
                data-allow-native-scroll="true"
                className="hidden md:block overflow-x-auto allow-native-scroll"
              >
                <table className="w-full min-w-[700px] text-left border-collapse">
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
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : order.status === "production"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                : order.status === "delivered"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/40"
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
                        <div className="flex items-center justify-end gap-2">
                          {/* SİMÜLATÖRE EKLE */}
                          <button
                            type="button"
                            onClick={() => {
                              onLoadOrderToWorkspace(order);
                              onClose();
                            }}
                            title="Bu Siparişi Simülatöre Ekle & Düzenle"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer border ${
                              isDarkMode 
                                ? "bg-[#C5A059] text-black border-[#d4ae61] hover:bg-[#b8944c]" 
                                : "bg-[#B88E3A] text-white border-[#a88031] hover:bg-[#a17a2b]"
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                            <span>Simülatöre Ekle</span>
                          </button>

                          {/* SİL */}
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
            </>
          )}
        </div>

        {/* Footer (Mobil ve Masaüstü Uyumlu) */}
        <div className={`p-3.5 sm:p-5 border-t flex items-center justify-between shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="text-[11px] sm:text-xs text-neutral-400 font-mono">
            Toplam <strong className={isDarkMode ? "text-white" : "text-slate-900"}>{orders.length}</strong> siparişten <strong className="text-[#C5A059]">{filteredOrders.length}</strong> tanesi listeleniyor
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 sm:px-6 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b8944c] text-black font-bold uppercase text-xs tracking-wider cursor-pointer active:scale-95 shadow-sm min-h-[38px]"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
