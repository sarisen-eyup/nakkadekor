import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Layers, Lock, Plus, Camera, TrendingUp } from "lucide-react";
import { FrameProfileItem } from "../types/pricing";

interface FrameProfileSelectorProps {
  label: string;
  selectedProfileId: string;
  profiles: FrameProfileItem[];
  onSelectProfile: (profId: string) => void;
  allowNoneOption?: boolean;
  isDarkMode?: boolean;
  onManageProfiles?: () => void;
}

export function FrameProfileSelector({
  label,
  selectedProfileId,
  profiles,
  onSelectProfile,
  allowNoneOption = false,
  isDarkMode = true,
  onManageProfiles
}: FrameProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const accentColor = isDarkMode ? "#C5A059" : "#B88E3A";

  return (
    <div className="relative" ref={containerRef}>
      <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 flex items-center justify-between font-sans ${
        isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
      }`}>
        <span>{label}</span>
        {selectedProfile && (
          <span className={`text-[10px] font-mono flex items-center gap-1 font-normal ${
            isDarkMode ? "text-neutral-400" : "text-slate-600"
          }`}>
            <Lock className="w-2.5 h-2.5" /> Profil Kalınlığı: {selectedProfile.widthCm.toFixed(2)} cm
          </span>
        )}
      </label>

      {/* Selected Profile Button Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-xl p-3 flex items-center justify-between gap-3 text-left transition-all cursor-pointer border font-sans ${
          isDarkMode
            ? "bg-[#181a20] border-[#2d333e] hover:border-[#C5A059] text-white shadow-sm"
            : "bg-white border-slate-200 hover:border-[#B88E3A] text-slate-900 shadow-sm"
        }`}
      >
        {selectedProfile ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={selectedProfile.imageUrl}
              alt={selectedProfile.name}
              className={`w-12 h-12 rounded-lg object-cover border shrink-0 shadow-sm ${
                isDarkMode ? "border-[#C5A059]/40" : "border-[#B88E3A]/40"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {selectedProfile.name}
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 ${
                  isDarkMode 
                    ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30" 
                    : "bg-[#B88E3A]/15 text-[#9E7728] border-[#B88E3A]/30"
                }`}>
                  {selectedProfile.code}
                </span>
              </div>
              <div className={`text-[11px] font-mono mt-0.5 flex items-center gap-2 ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                <span>{selectedProfile.widthCm.toFixed(2)} cm Genişlik</span>
                <span>•</span>
                <span className={`font-bold ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                  ₺{selectedProfile.unitPricePerMeter}/mt
                </span>
              </div>
            </div>
          </div>
        ) : allowNoneOption ? (
          <div className="flex items-center gap-3 py-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs border font-bold ${
              isDarkMode ? "bg-neutral-800 border-neutral-700 text-neutral-400" : "bg-slate-100 border-slate-200 text-slate-600"
            }`}>
              YOK
            </div>
            <div>
              <span className={`text-xs sm:text-sm font-bold block ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                Yok (Dış Çerçevesiz)
              </span>
              <span className={`text-[11px] ${isDarkMode ? "text-neutral-500" : "text-slate-500"}`}>
                Dış kasa çerçevesi kullanılmıyor
              </span>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-2 py-1 text-xs sm:text-sm font-medium ${
            isDarkMode ? "text-neutral-400" : "text-slate-500"
          }`}>
            <Layers className="w-4 h-4 text-[#C5A059]" />
            <span>-- Çerçeve Profili Seçin --</span>
          </div>
        )}

        <ChevronDown className={`w-4 h-4 transition-transform ${
          isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
        } ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded Profile Selection List Popup */}
      {isOpen && (
        <div className={`absolute z-40 left-0 right-0 mt-2 border rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto animate-fade-in divide-y font-sans ${
          isDarkMode 
            ? "bg-[#181b20] border-[#C5A059]/60 divide-neutral-800" 
            : "bg-white border-[#B88E3A]/60 divide-slate-100"
        }`}>
          
          {allowNoneOption && (
            <div
              onClick={() => {
                onSelectProfile("");
                setIsOpen(false);
              }}
              className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                !selectedProfileId 
                  ? (isDarkMode ? "bg-[#C5A059]/15 text-[#C5A059]" : "bg-[#B88E3A]/15 text-[#B88E3A]") 
                  : (isDarkMode ? "text-neutral-300 hover:bg-white/5" : "text-slate-700 hover:bg-slate-100")
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded border flex items-center justify-center font-mono text-xs ${
                  isDarkMode ? "bg-neutral-800 border-neutral-700 text-neutral-400" : "bg-slate-200 border-slate-300 text-slate-600"
                }`}>
                  YOK
                </div>
                <div>
                  <span className="text-xs font-bold block">Yok / Çerçevesiz</span>
                  <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    0 cm genişlik • 0 ₺
                  </span>
                </div>
              </div>
              {!selectedProfileId && <Check className="w-4 h-4 text-[#C5A059]" />}
            </div>
          )}

          {profiles.map((prof) => {
            const isSelected = prof.id === selectedProfileId;
            return (
              <div
                key={prof.id}
                onClick={() => {
                  onSelectProfile(prof.id);
                  setIsOpen(false);
                }}
                className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected 
                    ? (isDarkMode ? "bg-[#C5A059]/20 border-l-4 border-[#C5A059]" : "bg-[#B88E3A]/15 border-l-4 border-[#B88E3A]") 
                    : (isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-100")
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prof.imageUrl}
                    alt={prof.name}
                    className={`w-12 h-12 rounded-md object-cover border shrink-0 shadow-sm ${
                      isDarkMode ? "border-neutral-700" : "border-slate-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {prof.name}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold shrink-0 ${
                        isDarkMode 
                          ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30" 
                          : "bg-[#B88E3A]/15 text-[#9E7728] border-[#B88E3A]/30"
                      }`}>
                        {prof.code}
                      </span>
                    </div>

                    <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-2 flex-wrap ${
                      isDarkMode ? "text-neutral-400" : "text-slate-600"
                    }`}>
                      <span>Genişlik: <strong className={isDarkMode ? "text-white" : "text-slate-900"}>{prof.widthCm.toFixed(2)} cm</strong></span>
                      <span>•</span>
                      <span className={`font-bold ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>₺{prof.unitPricePerMeter}/mt</span>
                    </div>
                  </div>
                </div>

                {isSelected && <Check className={`w-4 h-4 shrink-0 ml-2 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />}
              </div>
            );
          })}

          {onManageProfiles && (
            <div className={`p-2 border-t sticky bottom-0 z-10 backdrop-blur-sm flex flex-col sm:flex-row gap-2 ${
              isDarkMode ? "bg-[#141719]/95 border-neutral-800" : "bg-white/95 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onManageProfiles();
                }}
                className={`flex-1 py-1.5 px-2.5 text-[11px] font-mono font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border-[#C5A059]/35" 
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                }`}
                title="Toptancı zammı uygula ve fiyatları güncelle"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>⚡ Toplu Zam Yap</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onManageProfiles();
                }}
                className={`flex-1 py-1.5 px-2.5 text-[11px] font-mono font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700" 
                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Yeni Profil / Fotoğraf</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
