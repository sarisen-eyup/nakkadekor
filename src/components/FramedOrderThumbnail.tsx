import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Image as ImageIcon } from "lucide-react";
import { OrderArchiveItem, FrameProfileItem } from "../types/pricing";
import { renderFramedCompositeToCanvas, renderFramedCompositeToDataUrl } from "../utils/frameCanvasRenderer";

interface FramedOrderThumbnailProps {
  order: OrderArchiveItem;
  profiles: FrameProfileItem[];
  isDarkMode: boolean;
  onOpenLightbox: (imageUrl: string, title: string) => void;
  className?: string;
}

export const FramedOrderThumbnail: React.FC<FramedOrderThumbnailProps> = ({
  order,
  profiles,
  isDarkMode,
  onOpenLightbox,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  // Çerçeve adını temizleme
  const cleanFrameName = (rawTitle?: string) => {
    if (!rawTitle) return "";
    let name = rawTitle.trim();
    if (name.includes(" - ")) {
      name = name.split(" - ").slice(1).join(" - ").trim();
    }
    name = name.replace(/\s*\(\s*\d+(\.\d+)?\s*cm\s*\)/gi, "").trim();
    return name;
  };

  // Sipariş bayraklarını çözümle
  const flags = order.inclusionFlags || order.simulatorConfig?.flags || order.simulatorConfig?.inclusionFlags;
  const hasInnerFrame = flags ? flags.includeInnerFrame !== false : Boolean(order.frameWidthCm && order.frameWidthCm > 0);
  const hasOuterFrame = flags
    ? Boolean(flags.includeOuterFrame && order.outerFrameTitle && order.outerFrameTitle !== "Yok" && order.outerFrameTitle !== "Seçilmedi")
    : Boolean(order.outerFrameWidthCm && order.outerFrameWidthCm > 0 && order.outerFrameTitle && order.outerFrameTitle !== "Yok");
  const hasMat = flags
    ? Boolean(flags.includeInnerMat && order.matInfo && !order.matInfo.toLowerCase().includes("paspartusuz"))
    : Boolean(order.matWidthCm && order.matWidthCm > 0 && order.matInfo && !order.matInfo.toLowerCase().includes("paspartusuz"));
  const hasMiddleMat = flags
    ? Boolean(flags.includeMiddleMat && order.middleMatWidthCm && order.middleMatWidthCm > 0)
    : Boolean(order.middleMatWidthCm && order.middleMatWidthCm > 0);

  // İç ve dış profil dokularını bul
  const innerProfile = profiles.find(p => 
    (order.simulatorConfig?.innerProfileId && p.id === order.simulatorConfig.innerProfileId) ||
    (order.innerProfileId && p.id === order.innerProfileId) ||
    cleanFrameName(p.name).toLowerCase() === cleanFrameName(order.innerFrameTitle).toLowerCase() ||
    p.name.toLowerCase() === (order.innerFrameTitle || "").toLowerCase()
  );

  const outerProfile = profiles.find(p => 
    (order.simulatorConfig?.outerProfileId && p.id === order.simulatorConfig.outerProfileId) ||
    (order.outerProfileId && p.id === order.outerProfileId) ||
    cleanFrameName(p.name).toLowerCase() === cleanFrameName(order.outerFrameTitle).toLowerCase() ||
    p.name.toLowerCase() === (order.outerFrameTitle || "").toLowerCase()
  );

  const artworkUrl = order.customPaintingUrl || order.simulatorConfig?.customPaintingUrl || null;
  const innerTexture = innerProfile?.imageUrl || innerProfile?.textureUrl || null;
  const outerTexture = outerProfile?.imageUrl || outerProfile?.textureUrl || null;

  // Önceden üretilmiş ve salt eserden farklı bir renderedFrameDataUrl varsa onu kullanabiliriz
  const existingRenderedUrl = order.renderedFrameDataUrl && order.renderedFrameDataUrl !== artworkUrl
    ? order.renderedFrameDataUrl
    : null;

  useEffect(() => {
    let isCancelled = false;

    // Eğer siparişte zaten hazır çerçeveli görsel varsa doğrudan onu kullan
    if (existingRenderedUrl) {
      setDataUrl(existingRenderedUrl);
      setIsRendered(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    renderFramedCompositeToCanvas(canvas, {
      canvasWidth: 320,
      canvasHeight: 320,
      artworkUrl,
      artworkWidthCm: Number(order.artworkWidthCm) || 30,
      artworkHeightCm: Number(order.artworkHeightCm) || 40,
      innerFrameTextureUrl: innerTexture,
      innerFrameWidthCm: hasInnerFrame ? (Number(order.frameWidthCm) || 0) : 0,
      innerFrameLayoutMode: innerProfile?.layoutMode || "miter-stretch",
      outerFrameTextureUrl: outerTexture,
      outerFrameWidthCm: hasOuterFrame ? (Number(order.outerFrameWidthCm) || 0) : 0,
      outerFrameLayoutMode: outerProfile?.layoutMode || "miter-stretch",
      matWidthCm: hasMat ? (Number(order.matWidthCm) || 0) : 0,
      innerMatColor: order.innerMatColor || order.simulatorConfig?.innerMatColor || "#ffffff",
      middleMatWidthCm: hasMiddleMat ? (Number(order.middleMatWidthCm) || 0) : 0,
      outerMatColor: order.outerMatColor || order.simulatorConfig?.outerMatColor || "#ffffff",
      includeInnerFrame: hasInnerFrame,
      includeOuterFrame: hasOuterFrame,
      includeInnerMat: hasMat,
      includeMiddleMat: hasMiddleMat
    }).then(() => {
      if (isCancelled) return;
      setIsRendered(true);
      try {
        const url = canvas.toDataURL("image/jpeg", 0.88);
        setDataUrl(url);
      } catch {
        // CORS kaynaklı dataURL hatası olursa canvas'ın kendisi görünmeye devam eder
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    order.id,
    order.orderNumber,
    artworkUrl,
    innerTexture,
    outerTexture,
    order.artworkWidthCm,
    order.artworkHeightCm,
    order.frameWidthCm,
    order.outerFrameWidthCm,
    order.matWidthCm,
    order.middleMatWidthCm,
    existingRenderedUrl
  ]);

  const handleThumbnailClick = () => {
    const finalUrl = dataUrl || existingRenderedUrl || artworkUrl;
    if (finalUrl) {
      onOpenLightbox(finalUrl, `${order.orderNumber} • ${order.customerName || "Sipariş Detayı"}`);
    }
  };

  const hasAnyVisual = Boolean(artworkUrl || existingRenderedUrl || hasInnerFrame || hasOuterFrame);

  return (
    <div
      onClick={handleThumbnailClick}
      className={`w-24 h-24 sm:w-28 sm:h-28 md:w-full md:max-w-[125px] md:aspect-square shrink-0 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden transition-all group ${
        hasAnyVisual ? "cursor-pointer hover:border-[#C5A059] hover:shadow-md" : ""
      } ${
        isDarkMode ? "bg-[#11141a] border-white/10" : "bg-slate-100 border-slate-200"
      } ${className}`}
      title="Çerçeveli tasarımı tam boyutta incelemek için tıklayın"
    >
      {existingRenderedUrl ? (
        <img
          src={existingRenderedUrl}
          alt={`Çerçeveli Sipariş - ${order.orderNumber}`}
          className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105 select-none"
        />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className={`w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105 select-none ${
              isRendered ? "opacity-100" : "opacity-0"
            }`}
          />
          {!isRendered && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center select-none bg-stone-100/50 dark:bg-stone-900/50">
              <ImageIcon className="w-5 h-5 text-[#C5A059]/70 animate-pulse mb-1" />
              <span className={`text-[10px] font-mono font-bold leading-tight ${
                isDarkMode ? "text-neutral-400" : "text-slate-600"
              }`}>
                {order.artworkWidthCm}×{order.artworkHeightCm}
              </span>
            </div>
          )}
        </>
      )}

      {/* Büyüteç ikon katmanı */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
      </div>
    </div>
  );
};
