import { OrderArchiveItem, FrameProfileItem } from "../types/pricing";

// Helper functions for safe canvas image loading to avoid CORS cache taint issues
const getSafeCanvasUrl = (url: string | null) => {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}canvas_cb=${Date.now()}`;
};

const loadImagePromise = (url: string | null, fallbackUrl?: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!url && !fallbackUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (fallbackUrl && url !== fallbackUrl) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "anonymous";
        fallbackImg.referrerPolicy = "no-referrer";
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => resolve(null);
        fallbackImg.src = getSafeCanvasUrl(fallbackUrl);
      } else {
        resolve(null);
      }
    };
    
    const targetSrc = url || fallbackUrl || "";
    if (targetSrc) {
      img.src = getSafeCanvasUrl(targetSrc);
    } else {
      resolve(null);
    }
  });
};

const createSafeLinearGradient = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): CanvasGradient => {
  const safeX0 = Number.isFinite(x0) ? x0 : 0;
  const safeY0 = Number.isFinite(y0) ? y0 : 0;
  let safeX1 = Number.isFinite(x1) ? x1 : safeX0 + 1;
  let safeY1 = Number.isFinite(y1) ? y1 : safeY0 + 1;
  if (Math.abs(safeX1 - safeX0) < 0.001 && Math.abs(safeY1 - safeY0) < 0.001) {
    safeX1 = safeX0 + 1;
    safeY1 = safeY0 + 1;
  }
  return ctx.createLinearGradient(safeX0, safeY0, safeX1, safeY1);
};

/**
 * Arşivdeki herhangi bir siparişi, simülatöre aktarılmadan direkt arşivden basılsa bile
 * tüm iç/dış çerçeveleri, 45° gönye miter kesimleri, paspartu kartonları ve eseriyle
 * eksiksiz olarak 1200x1200px yüksek çözünürlüklü olarak çizer ve PNG Data URL döndürür.
 */
export async function renderOrderFramePreview(
  order: OrderArchiveItem,
  profiles: FrameProfileItem[] = []
): Promise<string> {
  // Eğer önceden kaydedilmiş yüksek çözünürlüklü ve geçerli tam render çıktısı varsa doğrudan kullan
  if (order.renderedFrameDataUrl && order.renderedFrameDataUrl.startsWith("data:image/png")) {
    return order.renderedFrameDataUrl;
  }

  // Sipariş ölçüleri
  const artworkWidth = Number(order.artworkWidthCm) || 40;
  const artworkHeight = Number(order.artworkHeightCm) || 50;

  const matWidth = Number(order.matWidthCm ?? order.simulatorConfig?.matWidthCm ?? (order.matInfo && order.matInfo !== "Paspartusuz" ? 5 : 0)) || 0;
  const frameWidth = Number(order.frameWidthCm ?? order.simulatorConfig?.frameWidthCm ?? 4) || 0;
  const middleMatWidth = Number(order.middleMatWidthCm ?? order.simulatorConfig?.middleMatWidthCm ?? 0) || 0;
  const outerFrameWidth = Number(order.outerFrameWidthCm ?? order.simulatorConfig?.outerFrameWidthCm ?? 0) || 0;

  const innerMatColor = order.innerMatColor || order.simulatorConfig?.innerMatColor || "#FAF9F5";
  const outerMatColor = order.outerMatColor || order.simulatorConfig?.outerMatColor || "#FAF9F5";

  // Profil eşleştirmeleri
  const innerProfile = profiles.find(
    (p) => p.id === order.innerProfileId || p.code === order.innerFrameTitle || p.name === order.innerFrameTitle
  );
  const outerProfile = profiles.find(
    (p) => p.id === order.outerProfileId || p.code === order.outerFrameTitle || p.name === order.outerFrameTitle
  );

  const customFrameUrl = innerProfile?.imageUrl || innerProfile?.textureUrl || order.simulatorConfig?.customFrameUrl || "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop";
  const customOuterFrameUrl = outerProfile?.imageUrl || outerProfile?.textureUrl || order.simulatorConfig?.customOuterFrameUrl || "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop";
  const customPaintingUrl = order.customPaintingUrl || order.simulatorConfig?.customPaintingUrl || "";

  const frameLayoutMode = innerProfile?.layoutMode || "repeat";
  const outerFrameLayoutMode = outerProfile?.layoutMode || "repeat";

  // Görselleri paralel yükle
  const [frameImg, outerFrameImg, artImg] = await Promise.all([
    frameWidth > 0 ? loadImagePromise(customFrameUrl, "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop") : Promise.resolve(null),
    outerFrameWidth > 0 ? loadImagePromise(customOuterFrameUrl, "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop") : Promise.resolve(null),
    customPaintingUrl ? loadImagePromise(customPaintingUrl) : Promise.resolve(null)
  ]);

  // 1200x1200px Offscreen Canvas oluştur
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return order.customPaintingUrl || "";
  }

  // Zarif nötr kurumsal atölye arka planı (açık bej/gri stüdyo tonu)
  ctx.fillStyle = "#F5F3EF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Çerçeve oranlama matematiği
  const canvasTotalW = artworkWidth + 2 * (outerFrameWidth + middleMatWidth + frameWidth + matWidth);
  const canvasTotalH = artworkHeight + 2 * (outerFrameWidth + middleMatWidth + frameWidth + matWidth);
  const canvasTotalAspect = canvasTotalW / (canvasTotalH || 1);

  let drawW = 0;
  let drawH = 0;
  const maxCanvasDim = 1200 * 0.80; // %80 doluluk, %20 estetik atölye paspartu boşluğu
  if (canvasTotalAspect > 1) {
    drawW = maxCanvasDim;
    drawH = maxCanvasDim / canvasTotalAspect;
  } else {
    drawH = maxCanvasDim;
    drawW = drawH * canvasTotalAspect;
  }

  const canvasPxPerCm = drawW / (canvasTotalW || 1);
  const x = (1200 - drawW) / 2;
  const y = (1200 - drawH) / 2;

  const cOuterFrameW = outerFrameWidth * canvasPxPerCm;
  const cMiddleMatW = middleMatWidth * canvasPxPerCm;
  const cFrameW = frameWidth * canvasPxPerCm;
  const cMatW = matWidth * canvasPxPerCm;
  const cArtW = artworkWidth * canvasPxPerCm;
  const cArtH = artworkHeight * canvasPxPerCm;

  // 45 Derece Gönye Köşe Kesimli Çerçeve Çizici
  const drawFrameOnCanvas = (
    img: HTMLImageElement | null,
    mode: string,
    fx: number,
    fy: number,
    fW: number,
    fH: number,
    fWidthPx: number
  ) => {
    const mx = fx + fWidthPx;
    const my = fy + fWidthPx;
    const mW = fW - 2 * fWidthPx;
    const mH = fH - 2 * fWidthPx;

    if (img && fWidthPx > 0) {
      if (mode === "border-slice") {
        ctx.fillStyle = ctx.createPattern(img, "repeat") || "#a18262";
        ctx.fillRect(fx, fy, fW, fH);
        ctx.clearRect(mx, my, mW, mH);
      } else {
        const imgW = img.naturalWidth || img.width || 100;
        const imgH = img.naturalHeight || img.height || 100;
        const tileW = Math.max(1, fWidthPx * (imgW / (imgH || 1)));

        const drawSideBar = (sideLength: number) => {
          if (mode === "miter-stretch") {
            ctx.drawImage(img, -sideLength / 2, -fWidthPx / 2, sideLength, fWidthPx);
          } else {
            const startX = -sideLength / 2;
            const endX = sideLength / 2;
            for (let curX = startX; curX < endX; curX += tileW) {
              ctx.drawImage(img, curX, -fWidthPx / 2, tileW, fWidthPx);
            }
          }
        };

        // 1. Üst Kenar (Miter)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + fW, fy);
        ctx.lineTo(mx + mW, my);
        ctx.lineTo(mx, my);
        ctx.closePath();
        ctx.clip();
        ctx.translate(fx + fW / 2, fy + fWidthPx / 2);
        ctx.scale(1, -1);
        drawSideBar(fW);
        ctx.restore();

        // 2. Alt Kenar (Miter)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fx, fy + fH);
        ctx.lineTo(fx + fW, fy + fH);
        ctx.lineTo(mx + mW, my + mH);
        ctx.lineTo(mx, my + mH);
        ctx.closePath();
        ctx.clip();
        ctx.translate(fx + fW / 2, fy + fH - fWidthPx / 2);
        drawSideBar(fW);
        ctx.restore();

        // 3. Sol Kenar (Miter 90°)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(mx, my);
        ctx.lineTo(mx, my + mH);
        ctx.lineTo(fx, fy + fH);
        ctx.closePath();
        ctx.clip();
        ctx.translate(fx + fWidthPx / 2, fy + fH / 2);
        ctx.rotate(Math.PI / 2);
        drawSideBar(fH);
        ctx.restore();

        // 4. Sağ Kenar (Miter 90° + Flip)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fx + fW, fy);
        ctx.lineTo(mx + mW, my);
        ctx.lineTo(mx + mW, my + mH);
        ctx.lineTo(fx + fW, fy + fH);
        ctx.closePath();
        ctx.clip();
        ctx.translate(fx + fW - fWidthPx / 2, fy + fH / 2);
        ctx.rotate(Math.PI / 2);
        ctx.scale(1, -1);
        drawSideBar(fH);
        ctx.restore();
      }
    } else if (fWidthPx > 0) {
      ctx.fillStyle = "#333333";
      ctx.fillRect(fx, fy, fW, fH);
      ctx.clearRect(mx, my, mW, mH);
    }

    if (fWidthPx > 0) {
      // 3D Köşe Hatları
      ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
      ctx.lineWidth = 3;
      ctx.strokeRect(fx, fy, fW, fH);
      ctx.strokeRect(mx, my, mW, mH);

      // Gönye birleşim köşegenleri
      ctx.beginPath();
      ctx.moveTo(fx, fy); ctx.lineTo(mx, my);
      ctx.moveTo(fx + fW, fy); ctx.lineTo(mx + mW, my);
      ctx.moveTo(fx, fy + fH); ctx.lineTo(mx, my + mH);
      ctx.moveTo(fx + fW, fy + fH); ctx.lineTo(mx + mW, my + mH);
      ctx.stroke();
    }
  };

  // En dış sınır için zarif gölge
  const shadowTargetWidth = outerFrameWidth > 0 ? outerFrameWidth : frameWidth;
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = Math.round(shadowTargetWidth * 5);
  ctx.shadowOffsetX = Math.round(shadowTargetWidth * 2.5);
  ctx.shadowOffsetY = Math.round(shadowTargetWidth * 3.5);

  // 1. Dış Çerçeve
  if (outerFrameWidth > 0) {
    drawFrameOnCanvas(outerFrameImg, outerFrameLayoutMode, x, y, drawW, drawH, cOuterFrameW);
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // 2. Ara Paspartu
  if (middleMatWidth > 0) {
    const midMatX = x + cOuterFrameW;
    const midMatY = y + cOuterFrameW;
    const midMatW = drawW - 2 * cOuterFrameW;
    const midMatH = drawH - 2 * cOuterFrameW;

    ctx.fillStyle = outerMatColor;
    ctx.fillRect(midMatX, midMatY, midMatW, midMatH);

    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(midMatX, midMatY, midMatW, midMatH);
  }

  // 3. İç Çerçeve
  const innerX = x + cOuterFrameW + cMiddleMatW;
  const innerY = y + cOuterFrameW + cMiddleMatW;
  const innerW = drawW - 2 * (cOuterFrameW + cMiddleMatW);
  const innerH = drawH - 2 * (cOuterFrameW + cMiddleMatW);

  if (outerFrameWidth === 0 && middleMatWidth === 0) {
    drawFrameOnCanvas(frameImg, frameLayoutMode, innerX, innerY, innerW, innerH, cFrameW);
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else {
    drawFrameOnCanvas(frameImg, frameLayoutMode, innerX, innerY, innerW, innerH, cFrameW);
  }

  // 4. İç Paspartu (Karton)
  const mx = innerX + cFrameW;
  const my = innerY + cFrameW;
  const mW = innerW - 2 * cFrameW;
  const mH = innerH - 2 * cFrameW;

  if (matWidth > 0 || (order.matInfo && order.matInfo !== "Paspartusuz")) {
    ctx.fillStyle = innerMatColor;
    ctx.fillRect(mx, my, mW, mH);
  }

  // Eser sınır çizgisi ve gölgesi
  const ax = mx + cMatW;
  const ay = my + cMatW;
  const aW = cArtW;
  const aH = cArtH;

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(ax - 2, ay - 2, aW + 4, aH + 4);

  // 5. Sanat Eseri / Tablo
  if (artImg) {
    ctx.drawImage(artImg, ax, ay, aW, aH);
  } else {
    // Eser görseli yoksa zarif fildişi tuval dokusu
    ctx.fillStyle = "#EFECE6";
    ctx.fillRect(ax, ay, aW, aH);
    ctx.fillStyle = "#8C827A";
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NAKKA DEKOR ATÖLYE", ax + aW / 2, ay + aH / 2 - 14);
    ctx.font = "500 15px system-ui, sans-serif";
    ctx.fillStyle = "#A89F95";
    ctx.fillText(`${artworkWidth} × ${artworkHeight} cm`, ax + aW / 2, ay + aH / 2 + 16);
  }

  // 6. Cam Parlaması (Doğal Atölye Cam Yansıması)
  const glossGrad = createSafeLinearGradient(ctx, ax, ay, ax + aW, ay + aH);
  glossGrad.addColorStop(0, "rgba(255,255,255,0.08)");
  glossGrad.addColorStop(0.5, "rgba(255,255,255,0.01)");
  glossGrad.addColorStop(1, "rgba(0,0,0,0.07)");
  ctx.fillStyle = glossGrad;
  ctx.fillRect(ax, ay, aW, aH);

  return canvas.toDataURL("image/png");
}
