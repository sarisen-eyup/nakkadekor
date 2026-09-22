import React, { useRef, useState, useEffect } from "react";
import { 
  X, 
  Download, 
  Share2, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  RotateCcw, 
  Image as ImageIcon,
  Check,
  Move,
  Sliders,
  Maximize2,
  Scan,
  Home,
  Palette,
  Loader2
} from "lucide-react";
import { RoomTemplate, DEFAULT_ROOM_TEMPLATES } from "../types/roomPreview";
import { exportAndDownloadHD } from "../utils/hdCanvasExporter";

export interface CustomerWallPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerRoomImage: string | null;
  onSelectRoomImage: (url: string) => void;
  wallMode?: "color" | "room";
  setWallMode?: (mode: "color" | "room") => void;
  wallColor?: string;
  setWallColor?: (color: string) => void;
  wallColorPalette?: { name: string; value: string }[];
  roomFrameScale?: number;
  setRoomFrameScale?: (scale: number | ((prev: number) => number)) => void;
  roomFramePos?: { x: number; y: number };
  setRoomFramePos?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  roomBrightness?: number;
  setRoomBrightness?: (b: number) => void;
  roomShadowIntensity?: number;
  setRoomShadowIntensity?: (s: number) => void;
  // Customer Room Background & Scaling Props
  roomBgFit?: "cover" | "contain";
  setRoomBgFit?: (fit: "cover" | "contain") => void;
  roomBgScale?: number;
  setRoomBgScale?: (scale: number | ((prev: number) => number)) => void;
  roomBgPos?: { x: number; y: number };
  setRoomBgPos?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  // Frame specifications
  artworkWidth?: number;
  artworkHeight?: number;
  artworkWidthCm?: number;
  artworkHeightCm?: number;
  frameWidthCm?: number;
  frameHeightCm?: number;
  activeProfileName?: string;
  activeProfileCode?: string;
  innerProfileName?: string;
  outerProfileName?: string;
  paspartuName?: string;
  matWidth?: number;
  middleMatWidth?: number;
  outerFrameWidth?: number;
  frameWidth?: number;
  customerName?: string;
  customerPhone?: string;
  orderNumber?: string;
  totalPrice?: number;
  companyName?: string;
  companyPhone?: string;
  isDarkMode?: boolean;
  // Frame render node
  renderFrameElement: (scaleMultiplier?: number) => React.ReactNode;
  customPaintingUrl?: string | null;
  customFrameUrl?: string | null;
  customOuterFrameUrl?: string | null;
  innerMatColor?: string;
  outerMatColor?: string;
  frameLayoutMode?: string;
  outerFrameLayoutMode?: string;
  lightingStyle?: string;
}

export const CustomerWallPreviewModal: React.FC<CustomerWallPreviewModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    customerRoomImage,
    onSelectRoomImage,
    renderFrameElement,
    customPaintingUrl,
    customFrameUrl,
    customOuterFrameUrl,
    innerMatColor = "#f5f3ef",
    outerMatColor = "#ffffff",
    frameLayoutMode = "miter-stretch",
    outerFrameLayoutMode = "repeat",
    lightingStyle = "daylight",
    isDarkMode = false
  } = props;

  // Local fallbacks if state setters are not passed
  const [localScale, setLocalScale] = useState<number>(props.roomFrameScale ?? 1);
  const [localPos, setLocalPos] = useState<{ x: number; y: number }>(props.roomFramePos ?? { x: 0, y: 0 });
  const [localBrightness, setLocalBrightness] = useState<number>(props.roomBrightness ?? 100);
  const [localShadow, setLocalShadow] = useState<number>(props.roomShadowIntensity ?? 1);
  const [localBgFit, setLocalBgFit] = useState<"cover" | "contain">(props.roomBgFit ?? "cover");
  const [localBgScale, setLocalBgScale] = useState<number>(props.roomBgScale ?? 1);
  const [localBgPos, setLocalBgPos] = useState<{ x: number; y: number }>(props.roomBgPos ?? { x: 0, y: 0 });
  const [activeControlTab, setActiveControlTab] = useState<"frame" | "room">("frame");
  const [activePreviewMode, setActivePreviewMode] = useState<"color" | "room">(
    props.wallMode || (props.customerRoomImage ? "room" : "color")
  );
  const [localWallColor, setLocalWallColor] = useState<string>(props.wallColor || "#8A929A");

  // Sync with props when modal opens or props change
  useEffect(() => {
    if (props.wallMode) setActivePreviewMode(props.wallMode);
  }, [props.wallMode]);

  useEffect(() => {
    if (props.wallColor) setLocalWallColor(props.wallColor);
  }, [props.wallColor]);

  useEffect(() => {
    if (props.roomFrameScale !== undefined) setLocalScale(props.roomFrameScale);
  }, [props.roomFrameScale]);

  useEffect(() => {
    if (props.roomFramePos !== undefined) setLocalPos(props.roomFramePos);
  }, [props.roomFramePos]);

  useEffect(() => {
    if (props.roomBrightness !== undefined) setLocalBrightness(props.roomBrightness);
  }, [props.roomBrightness]);

  useEffect(() => {
    if (props.roomShadowIntensity !== undefined) setLocalShadow(props.roomShadowIntensity);
  }, [props.roomShadowIntensity]);

  useEffect(() => {
    if (props.roomBgFit !== undefined) setLocalBgFit(props.roomBgFit);
  }, [props.roomBgFit]);

  useEffect(() => {
    if (props.roomBgScale !== undefined) setLocalBgScale(props.roomBgScale);
  }, [props.roomBgScale]);

  useEffect(() => {
    if (props.roomBgPos !== undefined) setLocalBgPos(props.roomBgPos);
  }, [props.roomBgPos]);

  const scale = props.roomFrameScale ?? localScale;
  const updateScale = (newScale: number | ((prev: number) => number)) => {
    if (props.setRoomFrameScale) {
      props.setRoomFrameScale(newScale);
    } else {
      setLocalScale(newScale);
    }
  };

  const pos = props.roomFramePos ?? localPos;
  const updatePos = (newPos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    if (props.setRoomFramePos) {
      props.setRoomFramePos(newPos);
    } else {
      setLocalPos(newPos);
    }
  };

  const bgFit = props.roomBgFit ?? localBgFit;
  const updateBgFit = (fit: "cover" | "contain") => {
    if (props.setRoomBgFit) {
      props.setRoomBgFit(fit);
    } else {
      setLocalBgFit(fit);
    }
  };

  const bgScale = props.roomBgScale ?? localBgScale;
  const updateBgScale = (newScale: number | ((prev: number) => number)) => {
    if (props.setRoomBgScale) {
      props.setRoomBgScale(newScale);
    } else {
      setLocalBgScale(newScale);
    }
  };

  const bgPos = props.roomBgPos ?? localBgPos;
  const updateBgPos = (newPos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    if (props.setRoomBgPos) {
      props.setRoomBgPos(newPos);
    } else {
      setLocalBgPos(newPos);
    }
  };

  const brightness = props.roomBrightness ?? localBrightness;
  const updateBrightness = (b: number) => {
    if (props.setRoomBrightness) {
      props.setRoomBrightness(b);
    } else {
      setLocalBrightness(b);
    }
  };

  const shadow = props.roomShadowIntensity ?? localShadow;
  const updateShadow = (s: number) => {
    if (props.setRoomShadowIntensity) {
      props.setRoomShadowIntensity(s);
    } else {
      setLocalShadow(s);
    }
  };

  // Dimensions & Details
  const artW = props.artworkWidth ?? props.artworkWidthCm ?? 50;
  const artH = props.artworkHeight ?? props.artworkHeightCm ?? 70;
  const mWidth = props.matWidth ?? 0;
  const midWidth = props.middleMatWidth ?? 0;
  const oWidth = props.outerFrameWidth ?? 0;
  const fWidth = props.frameWidth ?? 3;
  const totalW = props.frameWidthCm ?? (artW + 2 * (mWidth + midWidth + oWidth + fWidth));
  const totalH = props.frameHeightCm ?? (artH + 2 * (mWidth + midWidth + oWidth + fWidth));
  const profileLabel = props.activeProfileName || props.innerProfileName || "Özel Çerçeve Profili";
  const outerProfileName = props.outerProfileName || "Dış Profil";
  const orderNumber = props.orderNumber || "";
  const customer = props.customerName || "Değerli Müşterimiz";
  const atelierName = props.companyName || "Nakka Dekor";

  const wallContainerRef = useRef<HTMLDivElement | null>(null);
  const frameWrapperRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const [isDraggingRoom, setIsDraggingRoom] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const activeRoomUrl = customerRoomImage || (DEFAULT_ROOM_TEMPLATES && DEFAULT_ROOM_TEMPLATES[0] ? DEFAULT_ROOM_TEMPLATES[0].url : "");

  // Pointer drag handling for frame
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent native image dragging

    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: pos.x,
      posY: pos.y
    };
    setIsDraggingFrame(true);

    let rafId: number | null = null;

    const onPointerMove = (moveEv: MouseEvent | TouchEvent) => {
      const curX = "touches" in moveEv ? moveEv.touches[0].clientX : (moveEv as MouseEvent).clientX;
      const curY = "touches" in moveEv ? moveEv.touches[0].clientY : (moveEv as MouseEvent).clientY;
      const dx = curX - dragStartRef.current.x;
      const dy = curY - dragStartRef.current.y;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updatePos({
          x: Math.round(dragStartRef.current.posX + dx),
          y: Math.round(dragStartRef.current.posY + dy)
        });
      });
    };

    const onPointerUp = () => {
      setIsDraggingFrame(false);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };

    window.addEventListener("mousemove", onPointerMove, { passive: false });
    window.addEventListener("mouseup", onPointerUp, { capture: true });
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp, { capture: true });
  };

  // Pointer drag handling for room background
  const roomDragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleRoomPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    roomDragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: bgPos.x,
      posY: bgPos.y
    };
    setIsDraggingRoom(true);

    let rafId: number | null = null;

    const onPointerMove = (moveEv: MouseEvent | TouchEvent) => {
      const curX = "touches" in moveEv ? moveEv.touches[0].clientX : (moveEv as MouseEvent).clientX;
      const curY = "touches" in moveEv ? moveEv.touches[0].clientY : (moveEv as MouseEvent).clientY;
      const dx = curX - roomDragStartRef.current.x;
      const dy = curY - roomDragStartRef.current.y;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateBgPos({
          x: Math.round(roomDragStartRef.current.posX + dx),
          y: Math.round(roomDragStartRef.current.posY + dy)
        });
      });
    };

    const onPointerUp = () => {
      setIsDraggingRoom(false);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };

    window.addEventListener("mousemove", onPointerMove, { passive: false });
    window.addEventListener("mouseup", onPointerUp, { capture: true });
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp, { capture: true });
  };

  // Mouse wheel zoom on wall
  const handleWallWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    if (activeControlTab === "room") {
      updateBgScale((prev) => Math.min(2.5, Math.max(0.5, Number((prev + delta).toFixed(2)))));
    } else {
      updateScale((prev) => Math.min(2.5, Math.max(0.15, Number((prev + delta).toFixed(2)))));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEv) => {
      const result = loadEv.target?.result as string;
      if (result) {
        onSelectRoomImage(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const resetPosition = () => {
    updatePos({ x: 0, y: 0 });
    updateScale(1);
    updateBgPos({ x: 0, y: 0 });
    updateBgScale(1);
    updateBrightness(100);
    updateShadow(1);
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const phone = (props.customerPhone || "").replace(/\D/g, "");
    const name = customer.trim();
    const priceStr = props.totalPrice ? `${Math.round(props.totalPrice).toLocaleString("tr-TR")} ₺` : "";

    let message = `Sayın ${name},\n\n${atelierName} olarak siparişinize özel hazırladığımız tablonun salonunuzdaki 3D yerleşim simülasyonu:\n\n` +
      `📐 Eser Ölçüsü: ${artW} × ${artH} cm\n` +
      `🖼️ Çerçeveli Dış Ölçü: ~${totalW.toFixed(2)} × ${totalH.toFixed(2)} cm\n` +
      `🎨 Çerçeve Profili: ${profileLabel}\n`;

    if (props.outerProfileName) {
      message += `🔲 Dış Çerçeve: ${props.outerProfileName}\n`;
    }
    if (mWidth > 0) {
      message += `📄 Paspartu: ${props.paspartuName || "Özel"} (${mWidth} cm)\n`;
    }
    if (priceStr) {
      message += `💰 Özel Fiyat (KDV Dahil): ${priceStr}\n\n`;
    } else {
      message += `\n`;
    }

    message += `Simülasyon görselinizi kontrol ederek sipariş onayınızı iletebilirsiniz.`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = phone.length >= 10 
      ? `https://wa.me/${phone.startsWith("90") ? phone : "90" + phone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      const link = document.createElement("a");
      link.href = whatsappUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = whatsappUrl;
    }
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // High-Resolution Composite Download (WYSIWYG: 100% matches on-screen preview for both rooms and solid wall colors)
  const handleDownloadHD = async () => {
    setIsExporting(true);
    try {
      const containerEl = wallContainerRef.current;
      const frameEl = frameWrapperRef.current;
      const cRect = containerEl?.getBoundingClientRect();
      const fRect = frameEl?.getBoundingClientRect();

      await exportAndDownloadHD({
        wallMode: activePreviewMode,
        wallColor: localWallColor,
        customerRoomImage: activeRoomUrl,
        roomBrightness: brightness,
        roomShadowIntensity: shadow,
        roomBgFit: bgFit,
        roomBgScale: bgScale,
        roomBgPos: bgPos,
        roomFrameScale: scale,
        roomFramePos: pos,
        artworkWidth: artW,
        artworkHeight: artH,
        matWidth: mWidth,
        middleMatWidth: midWidth,
        frameWidth: fWidth,
        outerFrameWidth: oWidth,
        frameWidthCm: totalW,
        frameHeightCm: totalH,
        customPaintingUrl,
        customFrameUrl,
        customOuterFrameUrl,
        innerMatColor,
        outerMatColor,
        frameLayoutMode,
        outerFrameLayoutMode,
        lightingStyle,
        customerName: customer,
        customerPhone: props.customerPhone,
        orderNumber,
        companyName: atelierName,
        activeProfileName: profileLabel,
        outerProfileName: outerProfileName,
        totalPrice: props.totalPrice,
        containerRect: cRect ? {
          left: cRect.left,
          top: cRect.top,
          width: cRect.width,
          height: cRect.height,
        } : undefined,
        frameRect: fRect && cRect ? {
          left: fRect.left,
          top: fRect.top,
          width: fRect.width,
          height: fRect.height
        } : undefined
      });
    } catch (err) {
      console.error("HD Download error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl text-neutral-100 select-none overflow-hidden"
      data-no-drag-scroll="true"
    >
      {/* Top Floating Control Bar */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-[#111317]/95 backdrop-blur-md z-30 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4 shadow-xl">
        {/* Top line on Mobile / Left Branding & Context on Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shadow-inner shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold tracking-wide text-white">
                  Müşteri Salonu 3D Sunum
                </h2>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 font-bold shrink-0">
                  Satış Kapatma
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 hidden sm:block">
                Çerçeveyi duvarda sürükleyip istediğiniz yüksekliğe getirebilirsiniz.
              </p>
            </div>
          </div>

          {/* Return to Simulator button on Mobile Top Row (Instant Exit) */}
          <button
            type="button"
            onClick={onClose}
            className="flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/60 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#FAE2B3] font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
            title="Müşteri sunumunu kapat ve simülatöre dön"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Simülatöre Dön</span>
          </button>
        </div>

        {/* Action Button Groups */}
        <div className="w-full md:w-auto flex items-center gap-2 shrink-0">
          {/* Mobile: 4-column balanced action strip / Desktop: Grouped tool clusters */}
          <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 w-full md:w-auto">
            {/* 1. Room Photo Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-[10px] sm:text-xs font-semibold text-neutral-200 transition-colors cursor-pointer active:scale-95 shadow-2xs"
              title="Müşterinin çektiği salon fotoğrafını yükleyin"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="truncate">Fotoğraf</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />

            {/* 2. Toggle Advanced Controls (Light & Shadow) */}
            <button
              type="button"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                showAdvancedControls 
                  ? "bg-[#C5A059]/25 border-[#C5A059] text-[#FAE2B3] shadow-[0_0_12px_rgba(197,160,89,0.2)]" 
                  : "border-white/15 bg-white/5 text-neutral-300 hover:text-white"
              }`}
              title="Işık ve Gölgelendirme Ayarlarını Göster/Gizle"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="truncate">Aydınlatma</span>
            </button>

            {/* 3. WhatsApp Direct Share */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-[10px] sm:text-xs shadow-md transition-all cursor-pointer active:scale-95"
              title="Müşteriye doğrudan WhatsApp sunumu gönder"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="truncate">WhatsApp</span>
            </button>

            {/* 4. HD Presentation Download */}
            <button
              type="button"
              onClick={handleDownloadHD}
              disabled={isExporting}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#b5924d] text-black font-bold text-[10px] sm:text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              title="Yüksek çözünürlüklü sunum görselini indirin"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="truncate">{isExporting ? "Hazır..." : "HD İndir"}</span>
            </button>
          </div>

          {/* Desktop Subtle Divider */}
          <div className="hidden md:block h-5 w-px bg-white/15 mx-0.5" />

          {/* Desktop Simülatöre Dön Button */}
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-[#C5A059]/60 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#FAE2B3] hover:text-white font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Müşteri sunumunu kapat ve simülatöre dön"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Simülatöre Dön</span>
          </button>
        </div>
      </header>

      {/* Main Full-Screen Room Wall Visualizer */}
      <div 
        ref={wallContainerRef}
        onWheel={handleWallWheel}
        className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center cursor-default select-none bg-[#0a0c0f]"
      >
        {/* Wall Canvas Layer: Room Photo OR Solid Architectural Wall Color */}
        {activePreviewMode === "color" ? (
          <div
            className="absolute inset-0 select-none transition-colors duration-300"
            style={{ backgroundColor: localWallColor }}
          >
            {/* Architectural Gallery Spotlight Illumination */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.25) 100%)",
              }}
            />
          </div>
        ) : (
          <>
            {/* Soft Ambient Blurred Background for Contain Mode */}
            {bgFit === "contain" && (
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 pointer-events-none transform scale-110"
                style={{ 
                  backgroundImage: `url(${activeRoomUrl})`,
                  filter: `brightness(${brightness * 0.7}%) blur(40px)`
                }}
              />
            )}

            {/* Room Photo Canvas Layer (Draggable & Scalable) */}
            <div
              onMouseDown={handleRoomPointerDown}
              onTouchStart={handleRoomPointerDown}
              className={`absolute inset-0 select-none ${
                isDraggingRoom ? "cursor-grabbing" : activeControlTab === "room" ? "cursor-grab" : "cursor-default"
              }`}
              style={{
                backgroundImage: `url(${activeRoomUrl})`,
                backgroundSize: bgFit === "contain" ? "contain" : "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transform: `translate3d(${bgPos.x}px, ${bgPos.y}px, 0) scale(${bgScale})`,
                transformOrigin: "center center",
                filter: `brightness(${brightness}%)`
              }}
            />
          </>
        )}

        {/* Subtle vignette shadow */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.45)]" />

        {/* Centered Draggable Frame on Wall */}
        <div
          ref={frameWrapperRef}
          data-no-drag-scroll="true"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          className={`relative z-10 select-none ${isDraggingFrame ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${scale})`,
            filter: `drop-shadow(0 ${16 * shadow}px ${28 * shadow}px rgba(0,0,0,${0.48 * shadow}))`,
            transformOrigin: "center center",
            touchAction: "none"
          }}
        >
          {/* Render 3D Frame element */}
          {renderFrameElement(1)}

          {/* Drag Handle Floating Pill */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md border border-[#C5A059]/50 text-[#C5A059] px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow-lg pointer-events-none whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
            <Move className="w-2.5 h-2.5" />
            <span>Sürükleyin</span>
          </div>
        </div>

        {/* Luxury Studio Watermark Presentation Card (Bottom Left) */}
        <div className="absolute bottom-5 left-5 z-20 bg-[#121417]/92 backdrop-blur-md border border-[#C5A059]/40 p-4 rounded-2xl shadow-2xl max-w-sm hidden sm:block">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">{atelierName}</h4>
          </div>
          <div className="text-[11px] text-neutral-300 space-y-1 font-sans">
            <div className="flex justify-between gap-4">
              <span className="text-neutral-400">Müşteri:</span>
              <span className="font-semibold text-white">{customer}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-400">Eser Ölçüsü:</span>
              <span className="font-mono text-[#C5A059]">{artW} × {artH} cm</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-400">Dış Ebat:</span>
              <span className="font-mono text-neutral-200">~{totalW.toFixed(2)} × {totalH.toFixed(2)} cm</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-400">Çerçeve:</span>
              <span className="text-neutral-200 truncate max-w-[170px]">{profileLabel}</span>
            </div>
            {props.totalPrice && (
              <div className="flex justify-between gap-4 pt-1.5 border-t border-white/10 font-bold">
                <span className="text-neutral-300">Özel Teklif Tutarı:</span>
                <span className="text-emerald-400 font-mono text-xs">{Math.round(props.totalPrice).toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Interactive Controls Dock (Bottom Center) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 max-w-[95vw]">
          {/* Advanced Lighting & Shadow Dock (Collapsible) */}
          {showAdvancedControls && (
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-[#121417]/95 border border-white/15 shadow-2xl backdrop-blur-xl text-xs">
              {/* Brightness */}
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[10px] text-neutral-300 font-medium">Oda Işığı:</span>
                <input 
                  type="range" 
                  min="60" 
                  max="140" 
                  value={brightness} 
                  onChange={(e) => updateBrightness(Number(e.target.value))}
                  className="w-20 h-1.5 accent-[#C5A059] cursor-pointer"
                />
                <span className="text-[10px] font-mono text-neutral-400">%{brightness}</span>
              </div>

              <div className="w-[1px] h-4 bg-white/15" />

              {/* Shadow Intensity */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-300 font-medium">Duvar Gölgesi:</span>
                <input 
                  type="range" 
                  min="0.2" 
                  max="2.0" 
                  step="0.1" 
                  value={shadow} 
                  onChange={(e) => updateShadow(Number(e.target.value))}
                  className="w-20 h-1.5 accent-[#C5A059] cursor-pointer"
                />
                <span className="text-[10px] font-mono text-neutral-400">%{Math.round(shadow * 100)}</span>
              </div>
            </div>
          )}

          {/* Primary Multi-Target Scale & Position Dock */}
          <div className="flex flex-col gap-1.5 p-2 rounded-2xl bg-[#121417]/95 border border-white/15 shadow-2xl backdrop-blur-xl">
            {/* Top Control Selector: Tablo vs Oda vs Sığdır/Doldur */}
            <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveControlTab("frame")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    activeControlTab === "frame"
                      ? "bg-[#C5A059] text-black shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>🖼️ Tablo</span>
                  <span className="font-mono text-[10px] opacity-90">%{Math.round(scale * 100)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveControlTab("room")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    activeControlTab === "room"
                      ? "bg-[#C5A059] text-black shadow"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>🏠 Oda</span>
                  <span className="font-mono text-[10px] opacity-90">%{Math.round(bgScale * 100)}</span>
                </button>
              </div>

              {/* Doldur (Cover) / Sığdır (Fit - Dikey) Toggle */}
              <button
                type="button"
                onClick={() => updateBgFit(bgFit === "cover" ? "contain" : "cover")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  bgFit === "contain"
                    ? "bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]"
                    : "border-white/15 text-neutral-300 hover:text-white bg-white/5"
                }`}
                title="Dikey veya yatay telefon fotoğraflarında odayı tam sığdırır"
              >
                {bgFit === "contain" ? <Scan className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span>{bgFit === "contain" ? "Sığdır (Dikey)" : "Doldur (Cover)"}</span>
              </button>
            </div>

            {/* Slider & Actions Row */}
            <div className="flex items-center gap-2">
              {/* Zoom Out Button */}
              <button
                type="button"
                onClick={() => {
                  if (activeControlTab === "frame") {
                    updateScale(Math.max(0.15, Number((scale - 0.05).toFixed(2))));
                  } else {
                    updateBgScale(Math.max(0.50, Number((bgScale - 0.05).toFixed(2))));
                  }
                }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title={activeControlTab === "frame" ? "Tabloyu Küçült" : "Odayı Uzaklaştır"}
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Range Slider */}
              {activeControlTab === "frame" ? (
                <input 
                  type="range"
                  min="0.15"
                  max="2.50"
                  step="0.02"
                  value={scale}
                  onChange={(e) => updateScale(Number(e.target.value))}
                  className="w-24 sm:w-36 h-1.5 accent-[#C5A059] cursor-pointer"
                />
              ) : (
                <input 
                  type="range"
                  min="0.50"
                  max="2.50"
                  step="0.02"
                  value={bgScale}
                  onChange={(e) => updateBgScale(Number(e.target.value))}
                  className="w-24 sm:w-36 h-1.5 accent-[#C5A059] cursor-pointer"
                />
              )}

              {/* Value Display */}
              <span className="text-xs font-mono font-bold text-[#C5A059] min-w-[48px] text-center">
                %{Math.round((activeControlTab === "frame" ? scale : bgScale) * 100)}
              </span>

              {/* Zoom In Button */}
              <button
                type="button"
                onClick={() => {
                  if (activeControlTab === "frame") {
                    updateScale(Math.min(2.50, Number((scale + 0.05).toFixed(2))));
                  } else {
                    updateBgScale(Math.min(2.50, Number((bgScale + 0.05).toFixed(2))));
                  }
                }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title={activeControlTab === "frame" ? "Tabloyu Büyüt" : "Odayı Yakınlaştır"}
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1">
                {(activeControlTab === "frame" ? [0.25, 0.5, 0.75, 1.0, 1.5] : [0.75, 1.0, 1.25, 1.5]).map((pVal) => {
                  const currentVal = activeControlTab === "frame" ? scale : bgScale;
                  return (
                    <button
                      key={pVal}
                      type="button"
                      onClick={() => {
                        if (activeControlTab === "frame") updateScale(pVal);
                        else updateBgScale(pVal);
                      }}
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                        Math.abs(currentVal - pVal) < 0.05 
                          ? "bg-[#C5A059] text-black font-bold" 
                          : "text-neutral-400 hover:text-white bg-white/5"
                      }`}
                    >
                      %{Math.round(pVal * 100)}
                    </button>
                  );
                })}
              </div>

              <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

              {/* Reset / Center */}
              <button
                type="button"
                onClick={resetPosition}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Tablo ve Oda Konumunu / Ölçeğini Ortala ve Sıfırla"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden md:inline">Ortala</span>
              </button>
            </div>
          </div>
        </div>

        {/* Room & Wall Color Presets Carousel (Bottom Right) */}
        <div className="absolute bottom-5 right-5 z-20 hidden lg:flex items-center gap-2 p-1.5 rounded-2xl bg-[#121417]/90 border border-white/15 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-black/50 rounded-xl p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setActivePreviewMode("room");
                if (props.setWallMode) props.setWallMode("room");
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activePreviewMode === "room"
                  ? "bg-[#C5A059] text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Odalar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePreviewMode("color");
                if (props.setWallMode) props.setWallMode("color");
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activePreviewMode === "color"
                  ? "bg-[#C5A059] text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>Duvar Rengi</span>
            </button>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          {activePreviewMode === "room" ? (
            <div className="flex items-center gap-1.5">
              {DEFAULT_ROOM_TEMPLATES.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    setActivePreviewMode("room");
                    onSelectRoomImage(room.url);
                  }}
                  className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer w-9 h-9 ${
                    activeRoomUrl === room.url
                      ? "border-[#C5A059] scale-105 shadow-lg ring-2 ring-[#C5A059]/40"
                      : "border-white/20 opacity-70 hover:opacity-100"
                  }`}
                  title={room.name}
                >
                  <img src={room.url} alt={room.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-1">
              {(props.wallColorPalette || [
                { name: "Bordo", value: "#58111A" },
                { name: "Antrasit", value: "#26292B" },
                { name: "Şampanya", value: "#EAD9C3" },
                { name: "Beyaz", value: "#FFFFFF" }
              ]).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setLocalWallColor(c.value);
                    if (props.setWallColor) props.setWallColor(c.value);
                  }}
                  className={`w-7 h-7 rounded-full border transition-all cursor-pointer ${
                    localWallColor === c.value
                      ? "border-[#C5A059] scale-110 ring-2 ring-[#C5A059]/60 shadow-lg"
                      : "border-white/20 opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>WhatsApp teklifi oluşturuldu ve açıldı!</span>
        </div>
      )}
    </div>
  );
};
