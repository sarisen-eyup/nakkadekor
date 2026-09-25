import React, { useRef } from "react";
import { X, Printer, Scissors, Layers, CheckCircle2, FileText, Download, Lock } from "lucide-react";
import { CompleteCutList } from "../types/pricing";
import { triggerCuttingListPrintWindow } from "../utils/printHelper";

interface CuttingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  cutList: CompleteCutList;
  customerName: string;
  deliveryDate: string;
  artworkWidthCm: number;
  artworkHeightCm: number;
  isDarkMode?: boolean;
  isOrderCreated?: boolean;
}

export function CuttingListModal({
  isOpen,
  onClose,
  cutList,
  customerName,
  deliveryDate,
  artworkWidthCm,
  artworkHeightCm,
  isDarkMode = true,
  isOrderCreated = false
}: CuttingListModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!isOrderCreated) {
      alert("⚠️ Üretim emri ve kesim listesini yazdırmak için lütfen önce 'Siparişi Oluştur' butonuna basarak siparişi kaydediniz.");
      return;
    }
    triggerCuttingListPrintWindow({
      cutList,
      customerName,
      deliveryDate,
      artworkWidthCm,
      artworkHeightCm
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
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold tracking-wide uppercase ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                ATÖLYE KESİM LİSTESİ
              </h2>
              <p className={`text-xs font-medium ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                45° Gönye Kesim ve Paspartu Ölçüleri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={!isOrderCreated}
              onClick={handlePrint}
              title={!isOrderCreated ? "Yazdırmak için önce sipariş oluşturulmalıdır." : "Kesim listesini yazdır"}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded transition-all shadow-md ${
                !isOrderCreated
                  ? "opacity-50 cursor-not-allowed bg-neutral-800 text-neutral-400"
                  : isDarkMode
                    ? "bg-[#C5A059] hover:bg-[#b08c48] text-black cursor-pointer active:scale-95"
                    : "bg-[#B88E3A] hover:bg-[#9E7728] text-white cursor-pointer active:scale-95"
              }`}
            >
              {!isOrderCreated ? <Lock className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
              <span>{!isOrderCreated ? "KİLİTLİ" : "YAZDIR / PDF AL"}</span>
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

        {/* Printable Area */}
        <div ref={printRef} className="p-6 overflow-y-auto space-y-6 flex-1 print:p-0 print:text-black print:bg-white">
          
          {/* Print Only Title */}
          <div className="hidden print:block border-b-2 border-black pb-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold font-sans uppercase tracking-wide">NAKKA DEKOR - ATÖLYE KESİM FİŞİ</h1>
                <p className="text-xs text-gray-600 font-sans mt-0.5">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
              </div>
              <div className="text-right text-xs font-sans">
                <p>Müşteri: <strong className="font-bold">{customerName || "Belirtilmedi"}</strong></p>
                <p>Teslim: <span className="font-mono">{deliveryDate || "Normal"}</span></p>
              </div>
            </div>
          </div>

          {/* Top Info Banner */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-md print:bg-gray-100 print:border-gray-300 ${
            isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/20" : "bg-slate-50 border-slate-200"
          }`}>
            <div>
              <span className={`text-[10px] font-sans font-bold uppercase tracking-wider print:text-gray-600 block ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                ESER / TABLO ÖLÇÜSÜ
              </span>
              <span className={`text-sm font-mono font-bold print:text-black ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                {artworkWidthCm} x {artworkHeightCm} cm
              </span>
            </div>

            <div>
              <span className={`text-[10px] font-sans font-bold uppercase tracking-wider print:text-gray-600 block ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Dış Bitmiş Ölçü
              </span>
              <span className={`text-sm font-mono font-bold print:text-black ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                {cutList.totalOuterDimensions}
              </span>
            </div>

            <div>
              <span className={`text-[10px] font-sans font-bold uppercase tracking-wider print:text-gray-600 block ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Müşteri Adı
              </span>
              <span className={`text-sm font-sans font-bold print:text-black truncate block ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                {customerName || "—"}
              </span>
            </div>

            <div>
              <span className={`text-[10px] font-sans font-bold uppercase tracking-wider print:text-gray-600 block ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Teslim Tarihi
              </span>
              <span className={`text-sm font-mono font-bold print:text-black truncate block ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                {deliveryDate || "—"}
              </span>
            </div>
          </div>

          {/* Cut List Table */}
          <div className="space-y-3">
            <h3 className={`text-xs font-sans font-bold print:text-black uppercase tracking-wider flex items-center gap-2 ${
              isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
            }`}>
              <FileText className="w-4 h-4" /> Kesim Ölçüleri Tablosu
            </h3>

            <div 
              data-drag-scroll="true"
              className={`border rounded-md overflow-x-auto drag-scroll text-xs print:border-gray-300 print:bg-white ${
              isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-slate-200"
            }`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider print:bg-gray-100 print:border-gray-300 print:text-black ${
                    isDarkMode ? "bg-[#141618] border-neutral-800 text-[#C5A059]" : "bg-slate-100 border-slate-200 text-[#B88E3A]"
                  }`}>
                    <th className="py-3 px-4 font-semibold">KATMAN / PARÇA</th>
                    <th className="py-3 px-4 font-semibold">KESİM ŞEKLİ</th>
                    <th className="py-3 px-4 font-semibold text-center">EN BOYU (2x)</th>
                    <th className="py-3 px-4 font-semibold text-center">BOY BOYU (2x)</th>
                    <th className="py-3 px-4 font-semibold text-right">METRAJ</th>
                  </tr>
                </thead>
                <tbody className={`divide-y print:divide-gray-200 ${
                  isDarkMode ? "divide-neutral-800/70 text-neutral-200" : "divide-slate-200 text-slate-800"
                } print:text-black`}>
                  {cutList.items.map((item, idx) => (
                    <tr key={idx} className={isDarkMode ? "hover:bg-neutral-800/30 print:hover:bg-transparent" : "hover:bg-slate-50 print:hover:bg-transparent"}>
                      <td className="py-3 px-4">
                        <div className={`font-medium print:text-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{item.layerName}</div>
                        <div className={`text-[11px] print:text-gray-600 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>{item.materialInfo}</div>
                        {item.profileCode && (
                          <div className={`text-[10px] font-mono font-semibold print:text-gray-800 mt-0.5 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                            Profil Kodu: {item.profileCode}
                          </div>
                        )}
                        {item.notes && (
                          <div className={`text-[10px] print:text-gray-500 italic mt-0.5 ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>{item.notes}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border print:bg-gray-100 print:text-black print:border-gray-300 ${
                          isDarkMode ? "bg-neutral-800 text-neutral-200 border-neutral-700" : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {item.cutAngle}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-bold text-xs print:text-black ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}>
                          {item.pieceWidthCm.toFixed(2)} cm
                        </span>
                        <span className={`block text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                          ({item.quantityWidthPieces > 1 ? `${item.quantityWidthPieces} Adet` : '1 Plaka'})
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-bold text-xs print:text-black ${
                          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                        }`}>
                          {item.pieceHeightCm.toFixed(2)} cm
                        </span>
                        <span className={`block text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                          ({item.quantityHeightPieces > 1 ? `${item.quantityHeightPieces} Adet` : '1 Plaka'})
                        </span>
                      </td>

                      <td className={`py-3 px-4 text-right font-mono font-bold text-xs print:text-black ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}>
                        {item.totalMeterNeeded.toFixed(2)} {item.unit || "m²"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assembly Guidelines */}
          <div className={`border print:border-gray-300 print:bg-gray-50 p-4 rounded-md space-y-3 ${
            isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
          }`}>
            <h3 className={`text-xs font-sans font-bold print:text-black uppercase tracking-wider flex items-center gap-2 ${
              isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
            }`}>
              <CheckCircle2 className="w-4 h-4" /> Atölye Montaj & Çatma Adımları
            </h3>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans print:text-black ${
              isDarkMode ? "text-neutral-300" : "text-slate-800"
            }`}>
              {cutList.assemblyInstructions.map((step, idx) => (
                <div key={idx} className={`flex items-start gap-2 p-2.5 rounded border print:bg-white print:border-gray-200 ${
                  isDarkMode ? "bg-[#121415] border-neutral-800" : "bg-white border-slate-200"
                }`}>
                  <span className={`font-mono font-bold shrink-0 print:text-black ${
                    isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                  }`}>{idx + 1}.</span>
                  <span className="leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Signatures Block for Printout */}
          <div className={`pt-4 border-t print:border-gray-400 grid grid-cols-2 gap-6 text-xs font-sans print:text-black ${
            isDarkMode ? "border-neutral-800 text-neutral-400" : "border-slate-200 text-slate-600"
          }`}>
            <div>
              <p className="font-bold">KESİM YAPAN USTA:</p>
              <p className={`mt-6 border-b border-dashed w-48 print:border-gray-400 ${
                isDarkMode ? "border-neutral-700" : "border-slate-300"
              }`}></p>
              <p className={`text-[10px] mt-1 ${isDarkMode ? "text-neutral-500" : "text-slate-500"}`}>Adı Soyadı / İmza</p>
            </div>

            <div className="text-right">
              <p className="font-bold">KALİTE KONTROL & TESLİMAT:</p>
              <p className={`mt-6 border-b border-dashed w-48 ml-auto print:border-gray-400 ${
                isDarkMode ? "border-neutral-700" : "border-slate-300"
              }`}></p>
              <p className={`text-[10px] mt-1 ${isDarkMode ? "text-neutral-500" : "text-slate-500"}`}>Onay / Tarih</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t print:hidden ${
          isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`text-xs font-sans ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
            Toplam Parça Sayısı: <span className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{cutList.items.length} Kalem</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-sans font-medium rounded transition-colors cursor-pointer ${
                isDarkMode ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              Kapat
            </button>

            <button
              onClick={handlePrint}
              className={`flex items-center gap-2 px-5 py-2 font-sans font-bold text-xs rounded shadow-lg transition-colors cursor-pointer ${
                isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
              }`}
            >
              <Printer className="w-4 h-4" /> FİŞİ YAZDIR
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
