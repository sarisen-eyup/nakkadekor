import React from "react";
import { Layers, ChevronRight, ChevronLeft, Sliders, Check, TrendingUp } from "lucide-react";
import { FrameProfileItem, DEFAULT_PASPARTU_COLORS } from "../types/pricing";
import { FrameProfileSelector } from "./FrameProfileSelector";

interface FramingStepProps {
  selectedInnerProfileId: string;
  selectedOuterProfileId: string;
  frameProfiles: FrameProfileItem[];
  handleSelectInnerProfile: (profId: string) => void;
  handleSelectOuterProfile: (profId: string) => void;
  activeInnerProfile: FrameProfileItem | null;
  activeOuterProfile: FrameProfileItem | null;
  frameWidthInput: string;
  matWidthInput: string;
  setMatWidthInput: (val: string) => void;
  matWidth: number;
  innerMatColor: string;
  setInnerMatColor: (color: string) => void;
  middleMatWidthInput: string;
  setMiddleMatWidthInput: (val: string) => void;
  middleMatWidth: number;
  outerMatColor: string;
  setOuterMatColor: (color: string) => void;
  isDarkMode: boolean;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onManageProfiles?: () => void;
}

const MAT_PRESETS = [0, 3, 5, 7, 10];

export const FramingStep: React.FC<FramingStepProps> = ({
  selectedInnerProfileId,
  selectedOuterProfileId,
  frameProfiles,
  handleSelectInnerProfile,
  handleSelectOuterProfile,
  activeInnerProfile,
  activeOuterProfile,
  frameWidthInput,
  matWidthInput,
  setMatWidthInput,
  matWidth,
  innerMatColor,
  setInnerMatColor,
  middleMatWidthInput,
  setMiddleMatWidthInput,
  middleMatWidth,
  outerMatColor,
  setOuterMatColor,
  isDarkMode,
  onNextStep,
  onPrevStep,
  onManageProfiles
}) => {
  // Helper for rendering the paspartu color palette
  const renderColorPicker = (
    currentColor: string,
    onChange: (c: string) => void,
    label: string
  ) => {
    const isPreset = DEFAULT_PASPARTU_COLORS.some(
      (item) => item.value.toLowerCase() === currentColor.toLowerCase()
    );

    return (
      <div className="space-y-2 pt-2">
        <label className={`text-[10px] uppercase font-bold tracking-wider block ${
          isDarkMode ? "text-neutral-400" : "text-slate-500"
        }`}>
          {label}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {DEFAULT_PASPARTU_COLORS.map((item) => {
            const isSelected = currentColor.toLowerCase() === item.value.toLowerCase();
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                  isSelected
                    ? (isDarkMode ? "border-[#C5A059] bg-[#C5A059]/20 font-bold shadow-sm" : "border-[#B88E3A] bg-[#B88E3A]/20 font-bold shadow-sm")
                    : (isDarkMode ? "border-white/10 bg-[#101216] hover:border-neutral-500 text-neutral-300" : "border-slate-200 bg-white hover:border-slate-300 text-slate-700")
                }`}
                title={item.name}
              >
                {item.value === "transparent" ? (
                  <span className="w-3.5 h-3.5 rounded-full border border-sky-400/80 bg-gradient-to-tr from-sky-300/40 via-white/80 to-sky-100/30 shrink-0 shadow-sm relative overflow-hidden">
                    <span className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.8)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.8)_75%,transparent_75%)] bg-[length:4px_4px] opacity-40" />
                  </span>
                ) : (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: item.value }}
                  />
                )}
                <span className="text-[9px] font-medium truncate leading-none">
                  {item.name.split("/")[0].trim()}
                </span>
              </button>
            );
          })}

          {/* Özel Renk */}
          <div
            className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all relative cursor-pointer ${
              !isPreset
                ? (isDarkMode ? "border-[#C5A059] bg-[#C5A059]/20 font-bold shadow-sm" : "border-[#B88E3A] bg-[#B88E3A]/20 font-bold shadow-sm")
                : (isDarkMode ? "border-white/10 bg-[#101216] hover:border-neutral-500 text-neutral-300" : "border-slate-200 bg-white hover:border-slate-300 text-slate-700")
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-inner"
              style={{ backgroundColor: !isPreset ? currentColor : "#888888" }}
            />
            <span className="text-[9px] font-bold truncate leading-none">
              Özel
            </span>
            <input
              type="color"
              value={!isPreset ? currentColor : "#FAF9F5"}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 03. Ana Çerçeve Profili Kartı */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
              isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white"
            }`}>
              3
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              Ana Çerçeve Profili
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onManageProfiles && (
              <button
                type="button"
                onClick={onManageProfiles}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                  isDarkMode
                    ? "bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border-[#C5A059]/30"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                }`}
                title="Toptancı zammı uygula ve profilleri yönet"
              >
                <TrendingUp className="w-3 h-3 text-[#C5A059]" />
                <span>Toplu Zam & Yönet</span>
              </button>
            )}
            {activeInnerProfile && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                isDarkMode ? "bg-[#101216] border-white/10 text-[#C5A059]" : "bg-white border-slate-200 text-[#B88E3A]"
              }`}>
                {activeInnerProfile.widthCm} cm
              </span>
            )}
          </div>
        </div>

        <FrameProfileSelector
          label="Çerçeve Koleksiyonu"
          selectedProfileId={selectedInnerProfileId}
          profiles={frameProfiles}
          onSelectProfile={handleSelectInnerProfile}
          isDarkMode={isDarkMode}
          onManageProfiles={onManageProfiles}
        />
      </div>

      {/* 04. İç Paspartu Kartı */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
              isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white"
            }`}>
              4
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              İç Paspartu (Genişlik & Renk)
            </h3>
          </div>
          <span className={`text-[10px] font-mono font-bold ${
            matWidth > 0 
              ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]")
              : (isDarkMode ? "text-neutral-500" : "text-slate-400")
          }`}>
            {matWidth > 0 ? `${matWidth} cm` : "Paspartusuz"}
          </span>
        </div>

        <div className="space-y-3">
          {/* Input & Presets */}
          <div className="flex gap-2 items-center">
            <div className="relative w-28 shrink-0">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={matWidthInput}
                onChange={(e) => setMatWidthInput(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(matWidthInput);
                  if (isNaN(val) || val < 0) setMatWidthInput("0");
                  else if (val > 100) setMatWidthInput("100");
                }}
                className={`w-full px-3 py-2 pr-7 text-xs font-mono font-bold rounded-xl border focus:outline-none transition-colors ${
                  isDarkMode
                    ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059]"
                    : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                }`}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 pointer-events-none">
                cm
              </span>
            </div>

            <div className="flex flex-wrap gap-1 flex-grow">
              {MAT_PRESETS.map((preset) => {
                const isActive = Number(matWidthInput) === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMatWidthInput(String(preset))}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? (isDarkMode ? "bg-[#C5A059] text-black border-[#C5A059]" : "bg-[#B88E3A] text-white border-[#B88E3A]")
                        : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-300 hover:border-neutral-500" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300")
                    }`}
                  >
                    {preset === 0 ? "Yok" : `${preset} cm`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paspartu Renk Seçimi */}
          {renderColorPicker(innerMatColor, setInnerMatColor, "Paspartu Karton Rengi")}
        </div>
      </div>

      {/* 05. 3D Ara Paspartu & Mukavva (Opsiyonel) */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
              isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white"
            }`}>
              5
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              3D Ara Mukavva & Paspartu (Opsiyonel)
            </h3>
          </div>
          <span className={`text-[10px] font-mono font-bold ${
            middleMatWidth > 0 ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]") : (isDarkMode ? "text-neutral-500" : "text-slate-400")
          }`}>
            {middleMatWidth > 0 ? `${middleMatWidth} cm` : "Deaktif (0 cm)"}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`text-[10px] uppercase font-bold tracking-wider ${
                isDarkMode ? "text-neutral-400" : "text-slate-600"
              }`}>
                3D Ara Paspartu Genişliği (cm)
              </label>
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="relative w-28 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={middleMatWidthInput}
                  onChange={(e) => setMiddleMatWidthInput(e.target.value)}
                  onBlur={() => {
                    const val = parseFloat(middleMatWidthInput);
                    if (isNaN(val) || val < 0) setMiddleMatWidthInput("0");
                    else if (val > 50) setMiddleMatWidthInput("50");
                  }}
                  className={`w-full px-3 py-2 pr-7 text-xs font-mono font-bold rounded-xl border focus:outline-none transition-colors ${
                    isDarkMode
                      ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059]"
                      : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                  }`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 pointer-events-none">
                  cm
                </span>
              </div>

              <div className="flex flex-wrap gap-1 flex-grow">
                {[0, 1, 2, 3, 5].map((preset) => {
                  const isActive = Number(middleMatWidthInput) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMiddleMatWidthInput(String(preset))}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                        isActive
                          ? (isDarkMode ? "bg-[#C5A059] text-black border-[#C5A059]" : "bg-[#B88E3A] text-white border-[#B88E3A]")
                          : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-300 hover:border-neutral-500" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300")
                      }`}
                    >
                      {preset === 0 ? "Yok" : `${preset} cm`}
                    </button>
                  );
                })}
              </div>
            </div>

            {middleMatWidth > 0 && renderColorPicker(outerMatColor, setOuterMatColor, "Ara Mukavva Rengi")}
          </div>
        </div>
      </div>

      {/* 06. Dış Kasa Çerçeve Profili (Opsiyonel) */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
              isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white"
            }`}>
              6
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              Dış Kasa Çerçeve Profili (Opsiyonel)
            </h3>
          </div>
          <span className={`text-[10px] font-mono font-bold ${
            activeOuterProfile 
              ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]") 
              : (isDarkMode ? "text-neutral-500" : "text-slate-400")
          }`}>
            {activeOuterProfile ? `${activeOuterProfile.widthCm} cm Genişlik` : "Dış Kasa Yok"}
          </span>
        </div>

        <div className="space-y-3">
          <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
            İsteğe bağlı olarak tablonun dışına derinlikli kasa çerçeve ekleyebilirsiniz.
          </p>
          <FrameProfileSelector
            label="Dış Kasa Çerçeve Koleksiyonu"
            selectedProfileId={selectedOuterProfileId}
            profiles={frameProfiles}
            onSelectProfile={handleSelectOuterProfile}
            allowNoneOption={true}
            isDarkMode={isDarkMode}
            onManageProfiles={onManageProfiles}
          />
        </div>
      </div>

      {/* Navigasyon Butonları */}
      <div className="flex gap-2 pt-1">
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

        {onNextStep && (
          <button
            type="button"
            onClick={onNextStep}
            className={`flex-grow py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              isDarkMode
                ? "bg-[#C5A059] text-black hover:bg-[#b5924d]"
                : "bg-[#B88E3A] text-white hover:bg-[#a67e2f]"
            }`}
          >
            <span>Siparişe Geç</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
