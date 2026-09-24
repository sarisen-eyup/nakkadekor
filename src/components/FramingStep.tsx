import React from "react";
import { Layers, ChevronRight, ChevronLeft, Sliders, Check, TrendingUp, Plus, X, Sparkles, Pipette } from "lucide-react";
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
const MIDDLE_MAT_PRESETS = [1, 2, 3, 5];

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
  // Helper for rendering refined paspartu color palette
  const renderColorPicker = (
    currentColor: string,
    onChange: (c: string) => void,
    label: string
  ) => {
    const isPreset = DEFAULT_PASPARTU_COLORS.some(
      (item) => item.value.toLowerCase() === currentColor.toLowerCase()
    );

    return (
      <div className="space-y-2 pt-3 border-t border-dashed border-white/10 dark:border-white/10 border-slate-200">
        <div className="flex items-center justify-between">
          <label className={`text-[10px] uppercase font-bold tracking-wider ${
            isDarkMode ? "text-neutral-400" : "text-slate-500"
          }`}>
            {label}
          </label>
          <span className={`text-[10px] font-medium ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
            {DEFAULT_PASPARTU_COLORS.find(c => c.value.toLowerCase() === currentColor.toLowerCase())?.name || "Özel Renk"}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DEFAULT_PASPARTU_COLORS.map((item) => {
            const isSelected = currentColor.toLowerCase() === item.value.toLowerCase();
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? (isDarkMode 
                        ? "border-[#C5A059] bg-[#C5A059]/15 shadow-sm ring-1 ring-[#C5A059]" 
                        : "border-[#B88E3A] bg-[#B88E3A]/15 shadow-sm ring-1 ring-[#B88E3A]")
                    : (isDarkMode 
                        ? "border-white/10 bg-[#101216] hover:border-neutral-600 text-neutral-300" 
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700")
                }`}
                title={item.name}
              >
                {item.value === "transparent" ? (
                  <span className="w-5 h-5 rounded-full border border-sky-400/80 bg-gradient-to-tr from-sky-300/40 via-white/80 to-sky-100/30 shrink-0 shadow-sm relative overflow-hidden mb-1">
                    <span className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.8)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.8)_75%,transparent_75%)] bg-[length:4px_4px] opacity-40" />
                  </span>
                ) : (
                  <span
                    className="w-5 h-5 rounded-full border border-black/20 shrink-0 shadow-inner mb-1"
                    style={{ backgroundColor: item.value }}
                  />
                )}
                <span className="text-[10px] font-medium truncate w-full text-center leading-none">
                  {item.name.split("/")[0].trim()}
                </span>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C5A059]" />
                )}
              </button>
            );
          })}

          {/* Özel Renk Seçici Butonu */}
          <label
            className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
              !isPreset
                ? (isDarkMode 
                    ? "border-[#C5A059] bg-[#C5A059]/15 shadow-sm ring-1 ring-[#C5A059]" 
                    : "border-[#B88E3A] bg-[#B88E3A]/15 shadow-sm ring-1 ring-[#B88E3A]")
                : (isDarkMode 
                    ? "border-white/10 bg-[#101216] hover:border-neutral-600 text-neutral-300" 
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700")
            }`}
            title="Özel Paspartu Rengi Seç"
          >
            <div className="w-5 h-5 rounded-full border border-black/20 shrink-0 shadow-inner mb-1 flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: !isPreset ? currentColor : "#888888" }}
            >
              <Pipette className="w-2.5 h-2.5 text-white drop-shadow" />
            </div>
            <span className="text-[10px] font-bold truncate w-full text-center leading-none">
              Özel
            </span>
            <input
              type="color"
              value={!isPreset ? currentColor : "#FAF9F5"}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {!isPreset && (
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C5A059]" />
            )}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 03. 1. Çerçeve Profili Kartı */}
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
              1. Çerçeve Profili
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
                title="Çerçeve profillerini yönet"
              >
                <TrendingUp className="w-3 h-3 text-[#C5A059]" />
                <span>Çerçeve Yönetimi</span>
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
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shadow-sm ${
              isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white"
            }`}>
              4
            </span>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-100" : "text-slate-800"
              }`}>
                İç Paspartu
              </h3>
            </div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
            matWidth > 0 
              ? (isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/30 text-[#C5A059]" : "bg-amber-50 border-amber-300 text-amber-900")
              : (isDarkMode ? "bg-white/5 border-white/10 text-neutral-400" : "bg-slate-100 border-slate-200 text-slate-500")
          }`}>
            {matWidth > 0 ? `${matWidth} cm` : "Paspartusuz"}
          </span>
        </div>

        <div className="space-y-3.5">
          {/* Presets & Custom Input Unified Row */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>İç Paspartu Genişliği</span>
              <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Özel Ölçü</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-5 gap-1.5 flex-1">
                {MAT_PRESETS.map((preset) => {
                  const isActive = Number(matWidthInput) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMatWidthInput(String(preset))}
                      className={`py-2 px-1 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                        isActive
                          ? (isDarkMode ? "bg-[#C5A059] text-black border-[#C5A059] shadow-sm font-black" : "bg-[#B88E3A] text-white border-[#B88E3A] shadow-sm font-black")
                          : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-300 hover:border-neutral-500 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300")
                      }`}
                    >
                      {preset === 0 ? "Yok" : `${preset} cm`}
                    </button>
                  );
                })}
              </div>

              {/* Custom Number Input */}
              <div className="relative w-24 shrink-0">
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
                  className={`w-full px-2.5 py-2 pr-7 text-xs font-mono font-bold rounded-xl border text-center focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                      : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:ring-1 focus:ring-[#B88E3A]"
                  }`}
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Paspartu Renk Seçimi or Paspartusuz Bilgisi */}
          {matWidth > 0 ? (
            renderColorPicker(innerMatColor, setInnerMatColor, "Paspartu Karton Rengi")
          ) : (
            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
              isDarkMode ? "bg-[#101216]/60 border-white/5 text-neutral-400" : "bg-slate-100/70 border-slate-200 text-slate-600"
            }`}>
              <span className="text-[11px]">Paspartu kapalı</span>
              <button
                type="button"
                onClick={() => setMatWidthInput("5")}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isDarkMode
                    ? "bg-[#C5A059]/15 border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/25"
                    : "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>5 cm Paspartu Ekle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 05. 3D Derinlik & Paspartu (Opsiyonel) */}
      <div className={`rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      } ${middleMatWidth > 0 ? "p-4" : "p-3.5"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shadow-sm ${
              middleMatWidth > 0
                ? (isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white")
                : (isDarkMode ? "bg-white/10 text-neutral-400" : "bg-slate-200 text-slate-600")
            }`}>
              5
            </span>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? "text-neutral-100" : "text-slate-800"
              }`}>
                3D Derinlik & Paspartu
              </h3>
              <p className={`text-[10px] ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                {middleMatWidth > 0 ? "Eser ile ana paspartu arasına derinlik katmanı" : "Opsiyonel derinlik katmanı"}
              </p>
            </div>
          </div>

          {middleMatWidth > 0 ? (
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isDarkMode ? "bg-[#C5A059]/15 border-[#C5A059]/30 text-[#C5A059]" : "bg-amber-50 border-amber-300 text-amber-900"
              }`}>
                {middleMatWidth} cm
              </span>
              <button
                type="button"
                onClick={() => setMiddleMatWidthInput("0")}
                className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                  isDarkMode 
                    ? "border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400" 
                    : "border-slate-300 hover:bg-slate-200 text-slate-500 hover:text-rose-600"
                }`}
                title="3D Ara Paspartuyu Kaldır"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMiddleMatWidthInput("2")}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDarkMode
                  ? "bg-[#101216] border-white/10 hover:border-[#C5A059] text-neutral-300 hover:text-[#C5A059]"
                  : "bg-white border-slate-200 hover:border-[#B88E3A] text-slate-700 hover:text-[#B88E3A]"
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>+ Derinlik Katmanı Ekle</span>
            </button>
          )}
        </div>

        {/* Expanded 3D controls only when active */}
        {middleMatWidth > 0 && (
          <div className="space-y-3.5 mt-3 pt-3 border-t border-dashed border-white/10 dark:border-white/10 border-slate-200">
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Ara Paspartu Genişliği</span>
                <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Özel Ölçü</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="grid grid-cols-4 gap-1.5 flex-1">
                  {MIDDLE_MAT_PRESETS.map((preset) => {
                    const isActive = Number(middleMatWidthInput) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMiddleMatWidthInput(String(preset))}
                        className={`py-2 px-1 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                          isActive
                            ? (isDarkMode ? "bg-[#C5A059] text-black border-[#C5A059] shadow-sm font-black" : "bg-[#B88E3A] text-white border-[#B88E3A] shadow-sm font-black")
                            : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-300 hover:border-neutral-500" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300")
                        }`}
                      >
                        {preset} cm
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-24 shrink-0">
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
                    className={`w-full px-2.5 py-2 pr-7 text-xs font-mono font-bold rounded-xl border text-center focus:outline-none transition-all ${
                      isDarkMode
                        ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                        : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:ring-1 focus:ring-[#B88E3A]"
                    }`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>
            </div>

            {renderColorPicker(outerMatColor, setOuterMatColor, "3D Derinlik / Paspartu Rengi")}
          </div>
        )}
      </div>

      {/* 06. Dış Çerçeve (Opsiyonel) */}
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
              DIŞ ÇERÇEVE
            </h3>
          </div>
          <span className={`text-[10px] font-mono font-bold ${
            activeOuterProfile 
              ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]") 
              : (isDarkMode ? "text-neutral-500" : "text-slate-400")
          }`}>
            {activeOuterProfile ? `${activeOuterProfile.widthCm} cm Genişlik` : "Çerçeve yok"}
          </span>
        </div>

        <div className="space-y-3">
          <FrameProfileSelector
            label="Çerçeve Koleksiyonu"
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
