import React, { useRef } from "react";
import { Upload, Scan, ArrowLeftRight, Palette, Sliders, ChevronRight, Home, Camera, Sparkles, ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Loader2 } from "lucide-react";
import { DEFAULT_ROOM_TEMPLATES } from "../types/roomPreview";

interface ArtworkStepProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  customPaintingFile: string;
  customPaintingUrl: string;
  handlePaintingUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsCropModalOpen: (open: boolean) => void;
  widthInput: string;
  setWidthInput: (val: string) => void;
  heightInput: string;
  setHeightInput: (val: string) => void;
  wallColor: string;
  setWallColor: (val: string) => void;
  wallColorPalette: { name: string; value: string }[];
  isDarkMode: boolean;
  onNextStep?: () => void;
  // Customer Room Preview Props
  wallMode?: "color" | "room";
  setWallMode?: (mode: "color" | "room") => void;
  customerRoomImage?: string | null;
  onSelectRoomImage?: (url: string) => void;
  roomFrameScale?: number;
  setRoomFrameScale?: (scale: number) => void;
  onResetRoomPosition?: () => void;
  onOpenCustomerPresentation?: () => void;
  onDownloadHdWallColor?: () => void;
  isDownloadingHD?: boolean;
  roomBgFit?: "cover" | "contain";
  setRoomBgFit?: (fit: "cover" | "contain") => void;
  roomBgScale?: number;
  setRoomBgScale?: (scale: number) => void;
  onResetRoomBg?: () => void;
}

const PRESET_DIMENSIONS = [
  { width: 30, height: 40, label: "30 × 40" },
  { width: 40, height: 50, label: "40 × 50" },
  { width: 50, height: 70, label: "50 × 70" },
  { width: 70, height: 100, label: "70 × 100" }
];

export const ArtworkStep: React.FC<ArtworkStepProps> = ({
  fileInputRef,
  customPaintingFile,
  customPaintingUrl,
  handlePaintingUpload,
  setIsCropModalOpen,
  widthInput,
  setWidthInput,
  heightInput,
  setHeightInput,
  wallColor,
  setWallColor,
  wallColorPalette,
  isDarkMode,
  onNextStep,
  wallMode = "color",
  setWallMode,
  customerRoomImage,
  onSelectRoomImage,
  roomFrameScale = 1,
  setRoomFrameScale,
  onResetRoomPosition,
  onOpenCustomerPresentation,
  onDownloadHdWallColor,
  isDownloadingHD = false,
  roomBgFit = "cover",
  setRoomBgFit,
  roomBgScale = 1,
  setRoomBgScale,
  onResetRoomBg
}) => {
  const roomFileInputRef = useRef<HTMLInputElement | null>(null);

  const swapDimensions = () => {
    const temp = widthInput;
    setWidthInput(heightInput);
    setHeightInput(temp);
  };

  const isPresetWall = wallColorPalette.some((item) => item.value === wallColor);

  const handleRoomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEv) => {
      const result = loadEv.target?.result as string;
      if (result) {
        if (onSelectRoomImage) onSelectRoomImage(result);
        if (setWallMode) setWallMode("room");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* 01. Sanat Eseri Görsel Yükleme Kartı */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
              isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white"
            }`}>
              1
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              Sanat Eseri Görseli
            </h3>
          </div>
          <span className={`text-[10px] font-medium ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
            JPG, PNG, WEBP
          </span>
        </div>

        <div className="flex gap-3 items-center">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all text-center p-2 shrink-0 ${
              isDarkMode
                ? "bg-[#101216] border-[#C5A059]/40 hover:border-[#C5A059] hover:bg-[#1a1e26]"
                : "bg-white border-[#B88E3A]/40 hover:border-[#B88E3A] hover:bg-slate-50"
            }`}
          >
            <Upload className={`w-5 h-5 mb-1 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <span className={`text-[9px] font-bold leading-tight ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
              Görsel Seç
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePaintingUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="flex-grow space-y-2 min-w-0">
            <div>
              <p className={`text-[9px] uppercase tracking-wider font-bold mb-1 ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Yüklü Eser Dosyası
              </p>
              <p className={`text-xs font-medium truncate px-2.5 py-1.5 rounded-lg border ${
                isDarkMode ? "bg-[#101216] border-white/10 text-[#C5A059]" : "bg-white border-slate-200 text-[#B88E3A]"
              }`}>
                {customPaintingFile}
              </p>
            </div>

            {customPaintingUrl && (
              <button
                type="button"
                onClick={() => setIsCropModalOpen(true)}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                  isDarkMode
                    ? "bg-[#C5A059]/15 border-[#C5A059] text-amber-300 hover:bg-[#C5A059]/25"
                    : "bg-[#B88E3A]/10 border-[#B88E3A] text-amber-900 hover:bg-[#B88E3A]/20"
                }`}
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Kırp & Döndür</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 02. Tablo Ölçüleri (cm) Kartı */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
              isDarkMode ? "bg-[#C5A059] text-black" : "bg-[#B88E3A] text-white"
            }`}>
              2
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              Eser Ölçüleri (cm)
            </h3>
          </div>

          <button
            type="button"
            onClick={swapDimensions}
            className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isDarkMode
                ? "border-white/10 bg-[#101216] text-neutral-300 hover:text-white hover:border-[#C5A059]"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-[#B88E3A]"
            }`}
            title="En ve Boy Ölçülerini Değiştir"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span className="hidden sm:inline">Çevir</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
              isDarkMode ? "text-neutral-400" : "text-slate-600"
            }`}>
              Genişlik (En)
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="500"
                value={widthInput}
                onChange={(e) => setWidthInput(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(widthInput);
                  if (isNaN(val) || val < 5) setWidthInput("10");
                  else if (val > 500) setWidthInput("500");
                }}
                className={`w-full px-3 py-2 pr-8 text-sm font-mono font-bold rounded-xl border focus:outline-none transition-colors ${
                  isDarkMode
                    ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059]"
                    : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                }`}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
              isDarkMode ? "text-neutral-400" : "text-slate-600"
            }`}>
              Yükseklik (Boy)
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="500"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(heightInput);
                  if (isNaN(val) || val < 5) setHeightInput("10");
                  else if (val > 500) setHeightInput("500");
                }}
                className={`w-full px-3 py-2 pr-8 text-sm font-mono font-bold rounded-xl border focus:outline-none transition-colors ${
                  isDarkMode
                    ? "bg-[#101216] border-white/10 text-white focus:border-[#C5A059]"
                    : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                }`}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>
        </div>

        {/* Hızlı Ölçü Presetleri */}
        <div>
          <span className={`text-[9px] uppercase tracking-wider font-bold block mb-1.5 ${
            isDarkMode ? "text-neutral-400" : "text-slate-500"
          }`}>
            Standart Ebat Seçimi
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_DIMENSIONS.map((item) => {
              const isActive = widthInput === String(item.width) && heightInput === String(item.height);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setWidthInput(String(item.width));
                    setHeightInput(String(item.height));
                  }}
                  className={`py-1.5 px-1 rounded-lg border text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                    isActive
                      ? (isDarkMode ? "bg-[#C5A059] text-black border-[#C5A059]" : "bg-[#B88E3A] text-white border-[#B88E3A]")
                      : (isDarkMode ? "bg-[#101216] border-white/10 text-neutral-300 hover:border-neutral-500" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300")
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 03. Duvar & Mekan Önizleme */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDarkMode ? "bg-[#171a20] border-white/10" : "bg-slate-50/80 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Home className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-neutral-100" : "text-slate-800"
            }`}>
              Duvar & Mekan Önizleme
            </h3>
          </div>

          {/* Mode Switcher Tabs */}
          <div className={`p-0.5 rounded-lg border flex items-center gap-0.5 ${
            isDarkMode ? "bg-black/40 border-white/10" : "bg-slate-200/80 border-slate-300"
          }`}>
            <button
              type="button"
              onClick={() => setWallMode && setWallMode("color")}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                wallMode === "color"
                  ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-800 shadow-sm")
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🎨 Renk
            </button>
            <button
              type="button"
              onClick={() => {
                if (setWallMode) setWallMode("room");
                if (!customerRoomImage && onSelectRoomImage && DEFAULT_ROOM_TEMPLATES[0]) {
                  onSelectRoomImage(DEFAULT_ROOM_TEMPLATES[0].url);
                }
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                wallMode === "room"
                  ? (isDarkMode ? "bg-[#C5A059] text-black shadow-sm" : "bg-white text-slate-800 shadow-sm")
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🏠 Müşteri Odası
            </button>
          </div>
        </div>

        {wallMode === "color" ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-neutral-400 font-medium">Sanal Duvar Boyası:</span>
              <span className={`text-[10px] font-mono uppercase font-bold ${
                isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
              }`}>
                {wallColor}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {wallColorPalette.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setWallColor(item.value)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    wallColor === item.value
                      ? (isDarkMode ? "border-[#C5A059] bg-[#C5A059]/20 shadow-md scale-105" : "border-[#B88E3A] bg-[#B88E3A]/20 shadow-md scale-105")
                      : (isDarkMode ? "border-white/10 bg-[#101216] hover:border-neutral-600" : "border-slate-200 bg-white hover:border-slate-300")
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-black/20 shadow-inner mb-1 shrink-0"
                    style={{ backgroundColor: item.value }}
                  />
                  <span className={`text-[8px] font-bold truncate w-full text-center ${
                    isDarkMode ? "text-neutral-200" : "text-slate-700"
                  }`}>
                    {item.name}
                  </span>
                </button>
              ))}

              {/* Özel Duvar Boyası */}
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all relative cursor-pointer ${
                  !isPresetWall
                    ? (isDarkMode ? "border-[#C5A059] bg-[#C5A059]/20 shadow-md scale-105" : "border-[#B88E3A] bg-[#B88E3A]/20 shadow-md scale-105")
                    : (isDarkMode ? "border-white/10 bg-[#101216] hover:border-neutral-600" : "border-slate-200 bg-white hover:border-slate-300")
                }`}
                title="Özel Duvar Rengi Seç"
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/20 shadow-inner mb-1 shrink-0"
                  style={{ backgroundColor: !isPresetWall ? wallColor : "#5A6065" }}
                />
                <span className={`text-[8px] font-bold truncate w-full text-center ${
                  isDarkMode ? "text-neutral-200" : "text-slate-700"
                }`}>
                  Özel
                </span>
                <input
                  type="color"
                  value={!isPresetWall ? wallColor : "#5A6065"}
                  onChange={(e) => setWallColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Müşterinin Kendi Salonu / Duvarı Modu */
          <div className="space-y-3 animate-fadeIn">
            {/* Fotoğraf Yükleme Butonu */}
            <div
              onClick={() => roomFileInputRef.current?.click()}
              className={`p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "border-[#C5A059]/40 bg-[#C5A059]/5 hover:bg-[#C5A059]/10 text-neutral-200" 
                  : "border-[#B88E3A]/40 bg-[#B88E3A]/5 hover:bg-[#B88E3A]/10 text-slate-800"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <div className="text-xs font-bold">Müşteri Odası Fotoğrafı</div>
                <div className={`text-[10px] ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                  Fotoğraf seçin veya buraya bırakın
                </div>
              </div>
              <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
              <input 
                type="file" 
                ref={roomFileInputRef} 
                onChange={handleRoomFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Hazır Örnek Salon Şablonları */}
            <div>
              <div className={`text-[10px] font-semibold mb-1.5 uppercase tracking-wider ${
                isDarkMode ? "text-neutral-400" : "text-slate-500"
              }`}>
                Örnek Odalar:
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {DEFAULT_ROOM_TEMPLATES.map((room) => {
                  const isSelected = customerRoomImage === room.url || (!customerRoomImage && room.id === "modern-sofa");
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => onSelectRoomImage && onSelectRoomImage(room.url)}
                      className={`relative rounded-xl overflow-hidden border p-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected 
                          ? "border-[#C5A059] bg-[#C5A059]/15 shadow-md scale-102 ring-1 ring-[#C5A059]" 
                          : (isDarkMode ? "border-white/10 bg-[#101216] hover:border-white/20" : "border-slate-200 bg-white hover:border-slate-300")
                      }`}
                      title={room.description}
                    >
                      <img 
                        src={room.url} 
                        alt={room.name} 
                        className="w-full h-10 object-cover rounded-lg" 
                      />
                      <span className="text-[9px] font-bold text-center truncate w-full">
                        {room.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Çerçeve & Oda Ölçekleme Kontrolleri (Sadeleştirilmiş & Akıcı) */}
            <div className={`p-3.5 rounded-2xl border space-y-3 ${
              isDarkMode ? "bg-[#101216] border-white/10" : "bg-white border-slate-200 shadow-sm"
            }`}>
              {/* 1. Tablo Ölçeği */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isDarkMode ? "text-neutral-300" : "text-slate-700"
                  }`}>
                    Tablo Ölçeği
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#C5A059]">
                      %{Math.round((roomFrameScale || 1) * 100)}
                    </span>
                    {onResetRoomPosition && (
                      <button
                        type="button"
                        onClick={onResetRoomPosition}
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          isDarkMode
                            ? "border-white/10 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                            : "border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                        }`}
                        title="Tabloyu Merkeze Ortala"
                      >
                        Ortala
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="range"
                    min="0.15"
                    max="2.50"
                    step="0.02"
                    value={roomFrameScale || 1}
                    onChange={(e) => setRoomFrameScale && setRoomFrameScale(Number(e.target.value))}
                    className="flex-1 h-1.5 accent-[#C5A059] cursor-pointer"
                  />
                </div>
              </div>

              {/* 2. Oda Görünümü */}
              <div className={`pt-2.5 border-t space-y-2 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isDarkMode ? "text-neutral-300" : "text-slate-700"
                  }`}>
                    Oda Görünümü
                  </span>
                  {onResetRoomBg && (
                    <button
                      type="button"
                      onClick={onResetRoomBg}
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        isDarkMode
                          ? "border-white/10 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                          : "border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                      }`}
                      title="Oda Görünümünü Sıfırla"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>

                {/* Doldur / Sığdır Segmented Toggle */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRoomBgFit && setRoomBgFit("cover")}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      roomBgFit === "cover"
                        ? "bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059] shadow-2xs"
                        : (isDarkMode ? "border-white/10 text-neutral-400 hover:text-neutral-200 bg-white/5" : "border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-50")
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Doldur (Yatay)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomBgFit && setRoomBgFit("contain")}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      roomBgFit === "contain"
                        ? "bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059] shadow-2xs"
                        : (isDarkMode ? "border-white/10 text-neutral-400 hover:text-neutral-200 bg-white/5" : "border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-50")
                    }`}
                  >
                    <Scan className="w-3 h-3" />
                    <span>Sığdır (Dikey)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Devam Et Butonu */}
      {onNextStep && (
        <button
          type="button"
          onClick={onNextStep}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
            isDarkMode
              ? "bg-[#C5A059] text-black hover:bg-[#b5924d]"
              : "bg-[#B88E3A] text-white hover:bg-[#a67e2f]"
          }`}
        >
          <span>Çerçeve Seçimine Geç</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
