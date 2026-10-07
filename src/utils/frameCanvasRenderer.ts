/**
 * frameCanvasRenderer.ts
 * Nakka Dekor - Yüksek kaliteli çerçeveli görsel kompozit oluşturucu ve önizleme motoru.
 * Sipariş arşiv kartları, önizleme pencereleri ve indirme/yazdırma işlemleri için
 * eserin etrafına uygulanan tüm iç/dış çerçeve, paspartu ve ara paspartu katmanlarını
 * gerçekçi gönye (miter joint) açıları ve 3D derinlik gölgeleriyle tuvale çizer.
 */

export interface RenderFramedOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  artworkUrl?: string | null;
  artworkWidthCm: number;
  artworkHeightCm: number;
  innerFrameTextureUrl?: string | null;
  innerFrameWidthCm: number;
  innerFrameLayoutMode?: string;
  outerFrameTextureUrl?: string | null;
  outerFrameWidthCm: number;
  outerFrameLayoutMode?: string;
  matWidthCm?: number;
  innerMatColor?: string;
  middleMatWidthCm?: number;
  outerMatColor?: string;
  includeInnerFrame?: boolean;
  includeOuterFrame?: boolean;
  includeInnerMat?: boolean;
  includeMiddleMat?: boolean;
  wallBackground?: string; // e.g. "transparent" or hex color
}

// Görsel bellek önbelleği
const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export function loadCompositeImage(url?: string | null): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return Promise.resolve(null);
  }
  const cleanUrl = url.trim();
  if (imageCache.has(cleanUrl)) {
    return imageCache.get(cleanUrl)!;
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => resolve(img);
    img.onerror = () => {
      // CORS hatası durumunda crossOrigin olmadan dene
      if (img.crossOrigin === "anonymous") {
        const retryImg = new Image();
        retryImg.referrerPolicy = "no-referrer";
        retryImg.onload = () => resolve(retryImg);
        retryImg.onerror = () => resolve(null);
        retryImg.src = cleanUrl;
      } else {
        resolve(null);
      }
    };
    img.src = cleanUrl;
  });

  imageCache.set(cleanUrl, promise);
  return promise;
}

/**
 * Gönye (miter) kesimli çerçeve profilini tuvale çizen fonksiyon
 */
function drawMiteredFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  mode: string,
  fx: number,
  fy: number,
  fW: number,
  fH: number,
  thickness: number
) {
  if (thickness <= 0) return;

  const mx = fx + thickness;
  const my = fy + thickness;
  const mW = Math.max(0, fW - 2 * thickness);
  const mH = Math.max(0, fH - 2 * thickness);

  const drawSideBar = (sideLength: number) => {
    if (img && img.complete && img.naturalWidth > 0) {
      if (mode === "miter-stretch") {
        ctx.drawImage(img, -sideLength / 2, -thickness / 2, sideLength, thickness);
      } else {
        const imgW = img.naturalWidth || 100;
        const imgH = img.naturalHeight || 100;
        const tileW = Math.max(1, thickness * (imgW / imgH));
        const startX = -sideLength / 2;
        const endX = sideLength / 2;
        for (let curX = startX; curX < endX; curX += tileW) {
          ctx.drawImage(img, curX, -thickness / 2, tileW, thickness);
        }
      }
    } else {
      // Doku yoksa şık ahşap / metalik degradeli çerçeve
      const grad = ctx.createLinearGradient(0, -thickness / 2, 0, thickness / 2);
      grad.addColorStop(0, "#362b24");
      grad.addColorStop(0.3, "#544338");
      grad.addColorStop(0.7, "#362b24");
      grad.addColorStop(1, "#1c1511");
      ctx.fillStyle = grad;
      ctx.fillRect(-sideLength / 2, -thickness / 2, sideLength, thickness);
    }
  };

  // 1. Üst Kenar (İç bini ucu esere baksın diye dikey çevrilir)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + fW, fy);
  ctx.lineTo(mx + mW, my);
  ctx.lineTo(mx, my);
  ctx.closePath();
  ctx.clip();
  ctx.translate(fx + fW / 2, fy + thickness / 2);
  ctx.scale(1, -1);
  drawSideBar(fW);
  ctx.restore();

  // 2. Alt Kenar (Normal 0 derece)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fx, fy + fH);
  ctx.lineTo(fx + fW, fy + fH);
  ctx.lineTo(mx + mW, my + mH);
  ctx.lineTo(mx, my + mH);
  ctx.closePath();
  ctx.clip();
  ctx.translate(fx + fW / 2, fy + fH - thickness / 2);
  drawSideBar(fW);
  ctx.restore();

  // 3. Sol Kenar (Saat yönünde 90 derece)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(mx, my);
  ctx.lineTo(mx, my + mH);
  ctx.lineTo(fx, fy + fH);
  ctx.closePath();
  ctx.clip();
  ctx.translate(fx + thickness / 2, fy + fH / 2);
  ctx.rotate(Math.PI / 2);
  drawSideBar(fH);
  ctx.restore();

  // 4. Sağ Kenar (Saat yönünde 90 derece + dikey çevirme)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fx + fW, fy);
  ctx.lineTo(mx + mW, my);
  ctx.lineTo(mx + mW, my + mH);
  ctx.lineTo(fx + fW, fy + fH);
  ctx.closePath();
  ctx.clip();
  ctx.translate(fx + fW - thickness / 2, fy + fH / 2);
  ctx.rotate(Math.PI / 2);
  ctx.scale(1, -1);
  drawSideBar(fH);
  ctx.restore();

  // 3D Gönye pah çizgileri ve kenar derinlikleri
  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  ctx.lineWidth = Math.max(1, thickness * 0.05);
  ctx.strokeRect(fx, fy, fW, fH);
  ctx.strokeRect(mx, my, mW, mH);

  // 45 derece köşe gönye çizgileri
  ctx.beginPath();
  ctx.moveTo(fx, fy); ctx.lineTo(mx, my);
  ctx.moveTo(fx + fW, fy); ctx.lineTo(mx + mW, my);
  ctx.moveTo(fx, fy + fH); ctx.lineTo(mx, my + mH);
  ctx.moveTo(fx + fW, fy + fH); ctx.lineTo(mx + mW, my + mH);
  ctx.stroke();
  ctx.restore();
}

/**
 * Verilen Canvas öğesine tüm çerçeveli tablo kompozisyonunu çizer.
 */
export async function renderFramedCompositeToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderFramedOptions
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    canvasWidth = 300,
    canvasHeight = 300,
    artworkUrl,
    artworkWidthCm,
    artworkHeightCm,
    innerFrameTextureUrl,
    innerFrameWidthCm,
    innerFrameLayoutMode = "miter-stretch",
    outerFrameTextureUrl,
    outerFrameWidthCm,
    outerFrameLayoutMode = "miter-stretch",
    matWidthCm = 0,
    innerMatColor = "#fcfbfa",
    middleMatWidthCm = 0,
    outerMatColor = "#fcfbfa",
    includeInnerFrame = true,
    includeOuterFrame = false,
    includeInnerMat = false,
    includeMiddleMat = false,
    wallBackground = "transparent"
  } = options;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Görselleri paralel olarak yükle
  const [artImg, innerFrameImg, outerFrameImg] = await Promise.all([
    loadCompositeImage(artworkUrl),
    loadCompositeImage(innerFrameTextureUrl),
    loadCompositeImage(outerFrameTextureUrl)
  ]);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (wallBackground && wallBackground !== "transparent") {
    ctx.fillStyle = wallBackground;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Ölçü hesaplamaları (cm bazlı)
  const effArtW = Math.max(1, Number(artworkWidthCm) || 30);
  const effArtH = Math.max(1, Number(artworkHeightCm) || 40);
  const effInnerFrameW = includeInnerFrame ? Math.max(0, Number(innerFrameWidthCm) || 0) : 0;
  const effOuterFrameW = includeOuterFrame ? Math.max(0, Number(outerFrameWidthCm) || 0) : 0;
  const effMatW = includeInnerMat ? Math.max(0, Number(matWidthCm) || 0) : 0;
  const effMiddleMatW = includeMiddleMat ? Math.max(0, Number(middleMatWidthCm) || 0) : 0;

  const totalWidthCm = effArtW + 2 * (effOuterFrameW + effMiddleMatW + effInnerFrameW + effMatW);
  const totalHeightCm = effArtH + 2 * (effOuterFrameW + effMiddleMatW + effInnerFrameW + effMatW);
  const totalAspect = totalWidthCm / totalHeightCm;

  // Tuval içine %86 dolulukla oranlı yerleşim
  const maxDim = Math.min(canvasWidth, canvasHeight) * 0.86;
  let drawW = maxDim;
  let drawH = maxDim;

  if (totalAspect >= 1) {
    drawW = maxDim;
    drawH = maxDim / totalAspect;
  } else {
    drawH = maxDim;
    drawW = maxDim * totalAspect;
  }

  const pxPerCm = drawW / totalWidthCm;
  const x = (canvasWidth - drawW) / 2;
  const y = (canvasHeight - drawH) / 2;

  const cOuterFrameW = effOuterFrameW * pxPerCm;
  const cMiddleMatW = effMiddleMatW * pxPerCm;
  const cInnerFrameW = effInnerFrameW * pxPerCm;
  const cMatW = effMatW * pxPerCm;
  const cArtW = effArtW * pxPerCm;
  const cArtH = effArtH * pxPerCm;

  // En dış gölge efekti (Tablo arkasındaki 3D duvar gölgesi)
  const shadowTargetW = effOuterFrameW > 0 ? cOuterFrameW : (effInnerFrameW > 0 ? cInnerFrameW : 8);
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = Math.max(4, Math.round(shadowTargetW * 0.8));
  ctx.shadowOffsetX = Math.max(1, Math.round(shadowTargetW * 0.35));
  ctx.shadowOffsetY = Math.max(2, Math.round(shadowTargetW * 0.55));

  // 1. Dış Çerçeve
  if (effOuterFrameW > 0) {
    drawMiteredFrame(ctx, outerFrameImg, outerFrameLayoutMode, x, y, drawW, drawH, cOuterFrameW);
    ctx.restore();
  } else {
    ctx.restore();
  }

  // 2. Ara Paspartu (3D karton katman)
  if (effMiddleMatW > 0) {
    const midX = x + cOuterFrameW;
    const midY = y + cOuterFrameW;
    const midW = Math.max(0, drawW - 2 * cOuterFrameW);
    const midH = Math.max(0, drawH - 2 * cOuterFrameW);

    if (outerMatColor === "transparent" || outerMatColor === "glass") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    } else {
      ctx.fillStyle = outerMatColor;
    }
    ctx.fillRect(midX, midY, midW, midH);

    // Karton kenar pahı
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(midX, midY, midW, midH);
  }

  // 3. İç Çerçeve
  const innerX = x + cOuterFrameW + cMiddleMatW;
  const innerY = y + cOuterFrameW + cMiddleMatW;
  const innerW = Math.max(0, drawW - 2 * (cOuterFrameW + cMiddleMatW));
  const innerH = Math.max(0, drawH - 2 * (cOuterFrameW + cMiddleMatW));

  if (effInnerFrameW > 0) {
    // Dış katmanlar yoksa iç çerçevenin kendi duvar gölgesi olsun
    if (effOuterFrameW === 0 && effMiddleMatW === 0) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = Math.max(4, Math.round(cInnerFrameW * 0.8));
      ctx.shadowOffsetX = Math.max(1, Math.round(cInnerFrameW * 0.35));
      ctx.shadowOffsetY = Math.max(2, Math.round(cInnerFrameW * 0.55));
      drawMiteredFrame(ctx, innerFrameImg, innerFrameLayoutMode, innerX, innerY, innerW, innerH, cInnerFrameW);
      ctx.restore();
    } else {
      drawMiteredFrame(ctx, innerFrameImg, innerFrameLayoutMode, innerX, innerY, innerW, innerH, cInnerFrameW);
    }
  }

  // 4. İç Paspartu (Mat)
  const matX = innerX + cInnerFrameW;
  const matY = innerY + cInnerFrameW;
  const matW = Math.max(0, innerW - 2 * cInnerFrameW);
  const matH = Math.max(0, innerH - 2 * cInnerFrameW);

  if (effMatW > 0) {
    if (innerMatColor === "transparent" || innerMatColor === "glass") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    } else {
      ctx.fillStyle = innerMatColor;
    }
    ctx.fillRect(matX, matY, matW, matH);

    // Paspartu iç kesim pahı (bevel)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(matX, matY, matW, matH);
  }

  // 5. Sanat Eseri / Tablo Alanı
  const artX = matX + cMatW;
  const artY = matY + cMatW;
  const artDrawW = cArtW;
  const artDrawH = cArtH;

  // Eser altı derinlik gölgesi
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(artX, artY, artDrawW, artDrawH);

  if (artImg && artImg.complete && artImg.naturalWidth > 0) {
    try {
      ctx.drawImage(artImg, artX, artY, artDrawW, artDrawH);
    } catch {
      drawFallbackCanvas(ctx, artX, artY, artDrawW, artDrawH, effArtW, effArtH);
    }
  } else {
    drawFallbackCanvas(ctx, artX, artY, artDrawW, artDrawH, effArtW, effArtH);
  }

  // Eser etrafı ince iç çerçeve çizgisi
  ctx.strokeStyle = "rgba(0, 0, 0, 0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(artX, artY, artDrawW, artDrawH);

  // Doğal ışık ve cam parıltısı efekti
  ctx.save();
  const gloss = ctx.createLinearGradient(artX, artY, artX + artDrawW, artY + artDrawH);
  gloss.addColorStop(0, "rgba(255, 255, 255, 0.09)");
  gloss.addColorStop(0.5, "rgba(255, 255, 255, 0.01)");
  gloss.addColorStop(1, "rgba(0, 0, 0, 0.07)");
  ctx.fillStyle = gloss;
  ctx.fillRect(artX, artY, artDrawW, artDrawH);
  ctx.restore();
}

function drawFallbackCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  artWCm: number,
  artHCm: number
) {
  ctx.fillStyle = "#EDE8DF";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#8D8374";
  ctx.font = `italic bold ${Math.max(9, Math.round(w * 0.07))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${artWCm} × ${artHCm} cm`, x + w / 2, y + h / 2);
}

/**
 * Verilen seçeneklerle bellek içi canvas oluşturup sıkıştırılmış DataURL (JPEG/PNG) döndürür.
 */
export async function renderFramedCompositeToDataUrl(
  options: RenderFramedOptions,
  quality: number = 0.85
): Promise<string> {
  if (typeof document === "undefined") return "";

  const offscreen = document.createElement("canvas");
  await renderFramedCompositeToCanvas(offscreen, options);

  try {
    return offscreen.toDataURL("image/jpeg", quality);
  } catch (e) {
    console.warn("Could not export canvas to dataUrl (CORS):", e);
    return options.artworkUrl || "";
  }
}
