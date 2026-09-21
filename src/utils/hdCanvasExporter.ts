export interface HDCanvasExportOptions {
  wallMode: "color" | "room";
  wallColor?: string;
  customerRoomImage?: string | null;
  roomBrightness?: number;
  roomShadowIntensity?: number;
  roomBgFit?: "cover" | "contain";
  roomBgScale?: number;
  roomBgPos?: { x: number; y: number };
  roomFrameScale?: number;
  roomFramePos?: { x: number; y: number };

  // Frame Dimensions in cm
  artworkWidth?: number;
  artworkHeight?: number;
  matWidth?: number;
  middleMatWidth?: number;
  frameWidth?: number;
  outerFrameWidth?: number;
  frameWidthCm?: number;
  frameHeightCm?: number;

  // Textures and styles
  customPaintingUrl?: string | null;
  customFrameUrl?: string | null;
  customOuterFrameUrl?: string | null;
  innerMatColor?: string;
  outerMatColor?: string;
  frameLayoutMode?: string;
  outerFrameLayoutMode?: string;
  lightingStyle?: string;

  // Metadata for presentation watermark card
  customerName?: string;
  customerPhone?: string;
  orderNumber?: string;
  companyName?: string;
  activeProfileName?: string;
  outerProfileName?: string;
  totalPrice?: number;

  // Optional bounding boxes for 1:1 screen WYSIWYG match
  containerRect?: { left?: number; top?: number; width: number; height: number };
  frameRect?: { left: number; top: number; width: number; height: number };
}

// Utility to sanitize numbers and guard against NaN or Infinity
function safeNum(val: unknown, fallback: number = 0): number {
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

// Crash-proof linear gradient builder that always receives valid, finite coordinates
function createSafeLinearGradient(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): CanvasGradient {
  const sx1 = safeNum(x1, 0);
  const sy1 = safeNum(y1, 0);
  let sx2 = safeNum(x2, sx1 + 100);
  let sy2 = safeNum(y2, sy1 + 100);
  if (Math.abs(sx2 - sx1) < 0.001 && Math.abs(sy2 - sy1) < 0.001) {
    sx2 = sx1 + 1;
    sy2 = sy1 + 1;
  }
  return ctx.createLinearGradient(sx1, sy1, sx2, sy2);
}

// Crash-proof radial gradient builder that always receives valid, finite coordinates
function createSafeRadialGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
): CanvasGradient {
  const sx0 = safeNum(x0, 0);
  const sy0 = safeNum(y0, 0);
  const sr0 = Math.max(0, safeNum(r0, 0));
  const sx1 = safeNum(x1, sx0);
  const sy1 = safeNum(y1, sy0);
  let sr1 = Math.max(0.1, safeNum(r1, sr0 + 100));
  if (Math.abs(sx0 - sx1) < 0.001 && Math.abs(sy0 - sy1) < 0.001 && Math.abs(sr0 - sr1) < 0.001) {
    sr1 = sr0 + 1;
  }
  return ctx.createRadialGradient(sx0, sy0, sr0, sx1, sy1, sr1);
}

// Helper to safely load canvas images cross-origin
const getSafeCanvasUrl = (url: string | null) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}canvas_cb=${Date.now()}`;
};

const loadImagePromise = (url: string | null, fallbackUrl?: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const targetSrc = url || fallbackUrl || "";
    if (!targetSrc) {
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
    img.src = getSafeCanvasUrl(targetSrc);
  });
};

// Helper for rendering realistic 45-degree mitered frame borders on canvas
const drawMiteredFrame = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  mode: string,
  fx: number,
  fy: number,
  fW: number,
  fH: number,
  fWidthPx: number,
  fallbackColorName?: string
) => {
  const safeFx = safeNum(fx, 0);
  const safeFy = safeNum(fy, 0);
  const safeFW = Math.max(0, safeNum(fW, 0));
  const safeFH = Math.max(0, safeNum(fH, 0));
  const safeFWidthPx = Math.max(0, safeNum(fWidthPx, 0));

  if (safeFWidthPx <= 0 || safeFW <= 0 || safeFH <= 0) return;
  const mx = safeFx + safeFWidthPx;
  const my = safeFy + safeFWidthPx;
  const mW = Math.max(0, safeFW - 2 * safeFWidthPx);
  const mH = Math.max(0, safeFH - 2 * safeFWidthPx);

  if (img && img.width > 0 && safeFWidthPx > 0) {
    const imgW = img.naturalWidth || img.width || 100;
    const imgH = img.naturalHeight || img.height || 100;
    const tileW = Math.max(1, safeFWidthPx * (imgW / imgH));

    const drawSideBar = (sideLength: number) => {
      if (mode === "miter-stretch") {
        ctx.drawImage(img, -sideLength / 2, -safeFWidthPx / 2, sideLength, safeFWidthPx);
      } else {
        const startX = -sideLength / 2;
        const endX = sideLength / 2;
        for (let curX = startX; curX < endX; curX += tileW) {
          ctx.drawImage(img, curX, -safeFWidthPx / 2, tileW, safeFWidthPx);
        }
      }
    };

    // 1. Top Side (clipped at 45° miter, flipped vertically so inner lip faces inward)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(safeFx, safeFy);
    ctx.lineTo(safeFx + safeFW, safeFy);
    ctx.lineTo(mx + mW, my);
    ctx.lineTo(mx, my);
    ctx.closePath();
    ctx.clip();
    ctx.translate(safeFx + safeFW / 2, safeFy + safeFWidthPx / 2);
    ctx.scale(1, -1);
    drawSideBar(safeFW);
    ctx.restore();

    // 2. Bottom Side (clipped at 45° miter)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(safeFx, safeFy + safeFH);
    ctx.lineTo(safeFx + safeFW, safeFy + safeFH);
    ctx.lineTo(mx + mW, my + mH);
    ctx.lineTo(mx, my + mH);
    ctx.closePath();
    ctx.clip();
    ctx.translate(safeFx + safeFW / 2, safeFy + safeFH - safeFWidthPx / 2);
    drawSideBar(safeFW);
    ctx.restore();

    // 3. Left Side (clipped at 45° miter, rotated 90°)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(safeFx, safeFy);
    ctx.lineTo(mx, my);
    ctx.lineTo(mx, my + mH);
    ctx.lineTo(safeFx, safeFy + safeFH);
    ctx.closePath();
    ctx.clip();
    ctx.translate(safeFx + safeFWidthPx / 2, safeFy + safeFH / 2);
    ctx.rotate(Math.PI / 2);
    drawSideBar(safeFH);
    ctx.restore();

    // 4. Right Side (clipped at 45° miter, rotated 90° + flipped)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(safeFx + safeFW, safeFy);
    ctx.lineTo(mx + mW, my);
    ctx.lineTo(mx + mW, my + mH);
    ctx.lineTo(safeFx + safeFW, safeFy + safeFH);
    ctx.closePath();
    ctx.clip();
    ctx.translate(safeFx + safeFW - safeFWidthPx / 2, safeFy + safeFH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.scale(1, -1);
    drawSideBar(safeFH);
    ctx.restore();
  } else {
    // Elegant fallback if texture image didn't load
    const isGold = (fallbackColorName || "").toLowerCase().includes("altın") || (fallbackColorName || "").toLowerCase().includes("gold");
    const isWhite = (fallbackColorName || "").toLowerCase().includes("beyaz") || (fallbackColorName || "").toLowerCase().includes("white");
    const isSilver = (fallbackColorName || "").toLowerCase().includes("gümüş") || (fallbackColorName || "").toLowerCase().includes("silver");

    ctx.save();
    if (isGold) {
      const grad = createSafeLinearGradient(ctx, safeFx, safeFy, safeFx + safeFW, safeFy + safeFH);
      grad.addColorStop(0, "#C5A059");
      grad.addColorStop(0.25, "#E5C882");
      grad.addColorStop(0.5, "#9A7328");
      grad.addColorStop(0.75, "#D8B467");
      grad.addColorStop(1, "#835E17");
      ctx.fillStyle = grad;
    } else if (isSilver) {
      const grad = createSafeLinearGradient(ctx, safeFx, safeFy, safeFx + safeFW, safeFy + safeFH);
      grad.addColorStop(0, "#C0C0C0");
      grad.addColorStop(0.5, "#FFFFFF");
      grad.addColorStop(1, "#808080");
      ctx.fillStyle = grad;
    } else if (isWhite) {
      ctx.fillStyle = "#F8F8F8";
    } else {
      const grad = createSafeLinearGradient(ctx, safeFx, safeFy, safeFx + safeFW, safeFy + safeFH);
      grad.addColorStop(0, "#2D241E");
      grad.addColorStop(0.5, "#4A3B32");
      grad.addColorStop(1, "#1A1512");
      ctx.fillStyle = grad;
    }
    ctx.fillRect(safeFx, safeFy, safeFW, safeFH);
    ctx.clearRect(mx, my, mW, mH);
    ctx.restore();
  }

  // 3D bevel lighting border overlays
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
  ctx.lineWidth = Math.max(1, safeFWidthPx * 0.04);
  ctx.beginPath();
  ctx.moveTo(safeFx, safeFy); ctx.lineTo(mx, my);
  ctx.moveTo(safeFx + safeFW, safeFy); ctx.lineTo(mx + mW, my);
  ctx.moveTo(safeFx, safeFy + safeFH); ctx.lineTo(mx, my + mH);
  ctx.moveTo(safeFx + safeFW, safeFy + safeFH); ctx.lineTo(mx + mW, my + mH);
  ctx.stroke();

  // Subtle dark outer lip line
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = Math.max(1, safeFWidthPx * 0.03);
  ctx.strokeRect(safeFx, safeFy, safeFW, safeFH);

  // Subtle dark inner lip line (where frame touches mat)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  ctx.strokeRect(mx, my, mW, mH);
  ctx.restore();
};

export async function exportAndDownloadHD(opts: HDCanvasExportOptions): Promise<void> {
  const {
    wallMode,
    wallColor = "#8A929A",
    customerRoomImage,
    roomBrightness = 100,
    roomShadowIntensity = 1,
    roomBgFit = "cover",
    roomBgScale = 1,
    roomBgPos = { x: 0, y: 0 },
    roomFrameScale = 1,
    roomFramePos = { x: 0, y: 0 },

    artworkWidth = 50,
    artworkHeight = 70,
    matWidth = 5,
    middleMatWidth = 0,
    frameWidth = 4,
    outerFrameWidth = 0,

    customPaintingUrl,
    customFrameUrl,
    customOuterFrameUrl,
    innerMatColor = "#F5F3EF",
    outerMatColor = "#FFFFFF",
    frameLayoutMode = "repeat",
    outerFrameLayoutMode = "repeat",

    customerName = "Değerli Müşterimiz",
    orderNumber = "",
    companyName = "Nakka Dekor",
    activeProfileName = "Özel Profil",
    outerProfileName = "Dış Profil",
    totalPrice = 0,

    containerRect,
    frameRect,
  } = opts;

  // Sanitize all dimensions to guaranteed finite numbers
  const safeArtW = Math.max(1, safeNum(artworkWidth, 50));
  const safeArtH = Math.max(1, safeNum(artworkHeight, 70));
  const safeMatW = Math.max(0, safeNum(matWidth, 0));
  const safeMidW = Math.max(0, safeNum(middleMatWidth, 0));
  const safeFrameW = Math.max(0, safeNum(frameWidth, 0));
  const safeOuterW = Math.max(0, safeNum(outerFrameWidth, 0));

  const totalW = Math.max(10, safeNum(opts.frameWidthCm, safeArtW + 2 * (safeMatW + safeMidW + safeOuterW + safeFrameW)));
  const totalH = Math.max(10, safeNum(opts.frameHeightCm, safeArtH + 2 * (safeMatW + safeMidW + safeOuterW + safeFrameW)));

  // Determine target canvas dimensions (2560px ultra high definition)
  const screenW = Math.max(300, safeNum(containerRect?.width, 1280));
  const screenH = Math.max(200, safeNum(containerRect?.height, 720));

  const canvas = document.createElement("canvas");
  const targetW = Math.max(2560, Math.round(screenW * 2));
  const targetH = Math.round(targetW * (screenH / screenW));
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2D context");

  const scaleMultiplier = Math.max(0.1, canvas.width / screenW);

  // Preload images in parallel
  const activeRoomUrl = wallMode === "room" ? (customerRoomImage || "") : "";
  const [roomImg, frameImg, outerFrameImg, artImg] = await Promise.all([
    loadImagePromise(activeRoomUrl),
    loadImagePromise(customFrameUrl || null),
    loadImagePromise(customOuterFrameUrl || null),
    loadImagePromise(customPaintingUrl || null),
  ]);

  // 1. Draw Background (Room photo or Architectural Wall Color)
  if (wallMode === "room" && roomImg && roomImg.width > 0) {
    ctx.fillStyle = "#0a0c0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgW = roomImg.naturalWidth || roomImg.width || 1920;
    const imgH = roomImg.naturalHeight || roomImg.height || 1080;

    const safeRoomBrightness = Math.max(10, safeNum(roomBrightness, 100));
    const safeBgScale = Math.max(0.1, safeNum(roomBgScale, 1));
    const safeBgPosX = safeNum(roomBgPos?.x, 0);
    const safeBgPosY = safeNum(roomBgPos?.y, 0);

    if (roomBgFit === "contain") {
      ctx.save();
      ctx.filter = `brightness(${safeRoomBrightness * 0.7}%) blur(${Math.round(35 * (scaleMultiplier / 1.5))}px)`;
      const coverRatio = Math.max(canvas.width / imgW, canvas.height / imgH) * 1.15;
      const bW = imgW * coverRatio;
      const bH = imgH * coverRatio;
      ctx.drawImage(roomImg, (canvas.width - bW) / 2, (canvas.height - bH) / 2, bW, bH);
      ctx.restore();
    }

    const fitRatio = roomBgFit === "contain"
      ? Math.min(canvas.width / imgW, canvas.height / imgH)
      : Math.max(canvas.width / imgW, canvas.height / imgH);

    const drawW = imgW * fitRatio * safeBgScale;
    const drawH = imgH * fitRatio * safeBgScale;
    const drawX = (canvas.width - drawW) / 2 + safeBgPosX * scaleMultiplier;
    const drawY = (canvas.height - drawH) / 2 + safeBgPosY * scaleMultiplier;

    ctx.save();
    ctx.filter = `brightness(${safeRoomBrightness}%)`;
    ctx.drawImage(roomImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Subtle room vignette
    const vigGrad = createSafeRadialGradient(
      ctx,
      canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.38,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.72
    );
    vigGrad.addColorStop(0, "rgba(0,0,0,0)");
    vigGrad.addColorStop(1, "rgba(0,0,0,0.40)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Elegant Solid Architectural Wall Color rendering
    ctx.fillStyle = wallColor || "#8A929A";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Architectural gallery spotlight illumination gradient
    const wallLight = createSafeRadialGradient(
      ctx,
      canvas.width * 0.5, canvas.height * 0.35, 120 * scaleMultiplier,
      canvas.width * 0.5, canvas.height * 0.45, Math.max(canvas.width, canvas.height) * 0.75
    );
    wallLight.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    wallLight.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
    wallLight.addColorStop(1, "rgba(0, 0, 0, 0.22)");
    ctx.fillStyle = wallLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle gallery edge vignette
    const edgeVig = createSafeRadialGradient(
      ctx,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.75
    );
    edgeVig.addColorStop(0, "rgba(0,0,0,0)");
    edgeVig.addColorStop(1, "rgba(0,0,0,0.20)");
    ctx.fillStyle = edgeVig;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Exact Frame Positioning (Matching screen 1:1 if bounds provided, or balanced gallery placement)
  let canvasFrameX = 0;
  let canvasFrameY = 0;
  let canvasFrameW = 0;
  let canvasFrameH = 0;

  const hasValidScreenBounds =
    frameRect &&
    containerRect &&
    Number.isFinite(frameRect.left) &&
    Number.isFinite(frameRect.top) &&
    Number.isFinite(frameRect.width) &&
    frameRect.width > 10 &&
    Number.isFinite(frameRect.height) &&
    frameRect.height > 10 &&
    Number.isFinite(containerRect.width) &&
    containerRect.width > 50 &&
    Number.isFinite(containerRect.height) &&
    containerRect.height > 50;

  if (hasValidScreenBounds) {
    const cLeft = safeNum(containerRect.left, 0);
    const cTop = safeNum(containerRect.top, 0);
    const relLeft = (frameRect.left - cLeft) / containerRect.width;
    const relTop = (frameRect.top - cTop) / containerRect.height;
    const relW = frameRect.width / containerRect.width;
    const relH = frameRect.height / containerRect.height;

    canvasFrameX = relLeft * canvas.width;
    canvasFrameY = relTop * canvas.height;
    canvasFrameW = relW * canvas.width;
    canvasFrameH = relH * canvas.height;
  }

  // If positioning wasn't provided or produced invalid numbers, fall back to centered gallery placement
  if (!Number.isFinite(canvasFrameX) || !Number.isFinite(canvasFrameY) || !Number.isFinite(canvasFrameW) || canvasFrameW <= 10 || !Number.isFinite(canvasFrameH) || canvasFrameH <= 10) {
    const frameAspect = totalW / totalH;
    const safeScale = Math.max(0.2, safeNum(roomFrameScale, 1));
    const maxH = canvas.height * 0.62 * safeScale;
    const maxW = canvas.width * 0.50 * safeScale;

    let baseW = maxW;
    let baseH = baseW / frameAspect;

    if (baseH > maxH) {
      baseH = maxH;
      baseW = baseH * frameAspect;
    }

    const posX = safeNum(roomFramePos?.x, 0);
    const posY = safeNum(roomFramePos?.y, 0);
    canvasFrameX = (canvas.width - baseW) / 2 + posX * scaleMultiplier;
    canvasFrameY = (canvas.height - baseH) / 2 + posY * scaleMultiplier;
    canvasFrameW = baseW;
    canvasFrameH = baseH;
  }

  // 3. Realistic Drop Shadow
  const safeShadowIntensity = Math.max(0, safeNum(roomShadowIntensity, 1));
  ctx.save();
  ctx.shadowColor = `rgba(0, 0, 0, ${0.46 * safeShadowIntensity})`;
  ctx.shadowBlur = Math.round(30 * safeShadowIntensity * scaleMultiplier);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(18 * safeShadowIntensity * scaleMultiplier);
  ctx.fillStyle = "rgba(15, 15, 15, 0.95)";
  ctx.fillRect(canvasFrameX, canvasFrameY, canvasFrameW, canvasFrameH);
  ctx.restore();

  // 4. Frame Layer Scaling
  const pxPerCm = canvasFrameW / totalW;
  const cOuterW = safeOuterW * pxPerCm;
  const cMiddleMatW = safeMidW * pxPerCm;
  const cFrameW = safeFrameW * pxPerCm;
  const cMatW = safeMatW * pxPerCm;

  // Layer 1: Outer Frame
  if (safeOuterW > 0) {
    drawMiteredFrame(
      ctx,
      outerFrameImg,
      outerFrameLayoutMode || "repeat",
      canvasFrameX,
      canvasFrameY,
      canvasFrameW,
      canvasFrameH,
      cOuterW,
      outerProfileName
    );
  }

  // Layer 2: Middle Mat (Ara Paspartu)
  if (safeMidW > 0) {
    const midX = canvasFrameX + cOuterW;
    const midY = canvasFrameY + cOuterW;
    const midW = Math.max(0, canvasFrameW - 2 * cOuterW);
    const midH = Math.max(0, canvasFrameH - 2 * cOuterW);
    ctx.fillStyle = (outerMatColor === "transparent" || outerMatColor === "glass")
      ? "rgba(255, 255, 255, 0.12)"
      : (outerMatColor || "#ffffff");
    ctx.fillRect(midX, midY, midW, midH);
  }

  // Layer 3: Inner Profile Frame
  const inX = canvasFrameX + cOuterW + cMiddleMatW;
  const inY = canvasFrameY + cOuterW + cMiddleMatW;
  const inW = Math.max(0, canvasFrameW - 2 * (cOuterW + cMiddleMatW));
  const inH = Math.max(0, canvasFrameH - 2 * (cOuterW + cMiddleMatW));

  drawMiteredFrame(
    ctx,
    frameImg,
    frameLayoutMode || "miter-stretch",
    inX,
    inY,
    inW,
    inH,
    cFrameW,
    activeProfileName
  );

  // Layer 4: Paspartu (Inner Mat)
  const matX = inX + cFrameW;
  const matY = inY + cFrameW;
  const matW = Math.max(0, inW - 2 * cFrameW);
  const matH = Math.max(0, inH - 2 * cFrameW);

  if (safeMatW > 0) {
    ctx.fillStyle = (innerMatColor === "transparent" || innerMatColor === "glass")
      ? "rgba(255, 255, 255, 0.12)"
      : (innerMatColor || "#f5f3ef");
    ctx.fillRect(matX, matY, matW, matH);

    // Subtle bevel line on inner mat edge
    ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = Math.max(1, 1.5 * scaleMultiplier);
    ctx.strokeRect(matX, matY, matW, matH);
  }

  // Layer 5: Artwork Painting
  const artX = matX + cMatW;
  const artY = matY + cMatW;
  const artWpx = Math.max(0, matW - 2 * cMatW);
  const artHpx = Math.max(0, matH - 2 * cMatW);

  if (artImg && artImg.width > 0 && artWpx > 0 && artHpx > 0) {
    ctx.drawImage(artImg, artX, artY, artWpx, artHpx);

    // Fine inner shadow along art edge
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = Math.max(1, 1.2 * scaleMultiplier);
    ctx.strokeRect(artX, artY, artWpx, artHpx);
  } else {
    ctx.fillStyle = "#e8e1d5";
    ctx.fillRect(artX, artY, artWpx, artHpx);
    ctx.fillStyle = "#888888";
    ctx.font = `italic ${Math.round(18 * scaleMultiplier)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Sanat Eseri", artX + artWpx / 2, artY + artHpx / 2);
  }

  // Layer 6: Glass Reflection Sheen
  ctx.save();
  ctx.beginPath();
  ctx.rect(canvasFrameX, canvasFrameY, canvasFrameW, canvasFrameH);
  ctx.clip();
  const glassGrad = createSafeLinearGradient(
    ctx,
    canvasFrameX, canvasFrameY,
    canvasFrameX + canvasFrameW, canvasFrameY + canvasFrameH
  );
  glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.10)");
  glassGrad.addColorStop(0.38, "rgba(255, 255, 255, 0.02)");
  glassGrad.addColorStop(0.48, "rgba(255, 255, 255, 0.07)");
  glassGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glassGrad;
  ctx.fillRect(canvasFrameX, canvasFrameY, canvasFrameW, canvasFrameH);
  ctx.restore();

  // 5. Studio Presentation Watermark Card (Bottom-Left)
  const badgeScale = Math.max(1, scaleMultiplier / 1.4);
  const badgeW = Math.round(480 * badgeScale);
  const badgeH = Math.round(135 * badgeScale);
  const badgeX = Math.round(35 * badgeScale);
  const badgeY = canvas.height - badgeH - Math.round(35 * badgeScale);

  ctx.save();
  ctx.fillStyle = "rgba(18, 20, 24, 0.94)";
  ctx.strokeStyle = "rgba(197, 160, 89, 0.65)";
  ctx.lineWidth = Math.max(1.5, 2 * badgeScale);
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14 * badgeScale);
  ctx.fill();
  ctx.stroke();

  // Gold dot
  ctx.fillStyle = "#C5A059";
  ctx.beginPath();
  ctx.arc(badgeX + 22 * badgeScale, badgeY + 28 * badgeScale, 4.5 * badgeScale, 0, Math.PI * 2);
  ctx.fill();

  // Atelier Name
  ctx.font = `bold ${Math.round(17 * badgeScale)}px 'Playfair Display', Georgia, serif`;
  ctx.fillStyle = "#C5A059";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(companyName.toUpperCase(), badgeX + 36 * badgeScale, badgeY + 34 * badgeScale);

  // Customer & Specs
  ctx.font = `${Math.round(12 * badgeScale)}px sans-serif`;
  ctx.fillStyle = "#E5E7EB";
  const orderTag = orderNumber ? `  |  Sipariş No: ${orderNumber}` : "";
  ctx.fillText(`Müşteri: ${customerName}${orderTag}`, badgeX + 22 * badgeScale, badgeY + 62 * badgeScale);
  ctx.fillText(`Eser: ${safeArtW} × ${safeArtH} cm  |  Toplam Dış Ebat: ~${totalW.toFixed(1)} × ${totalH.toFixed(1)} cm`, badgeX + 22 * badgeScale, badgeY + 84 * badgeScale);
  const priceText = totalPrice ? `|  Tutar: ${Math.round(totalPrice).toLocaleString("tr-TR")} ₺` : "";
  ctx.fillText(`Profil: ${activeProfileName}  ${priceText}`, badgeX + 22 * badgeScale, badgeY + 106 * badgeScale);
  ctx.restore();

  // 6. Dynamic clean file name: [Tarih]_[Sipariş_No]_[Müşteri]_Teklif_Formu.jpg
  const todayFormatted = new Date().toISOString().split("T")[0];
  const cleanCustomer = customerName && customerName !== "Değerli Müşterimiz"
    ? customerName.trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, "_")
    : "Musteri";
  const cleanOrderNo = orderNumber
    ? orderNumber.trim().replace(/[^a-zA-Z0-9_-]/g, "_")
    : "";

  const nameParts = [todayFormatted];
  if (cleanOrderNo) nameParts.push(cleanOrderNo);
  nameParts.push(cleanCustomer);
  nameParts.push("Teklif_Formu");
  const downloadFileName = `${nameParts.join("_")}.jpg`;

  // 7. Trigger crisp download reliably
  const link = document.createElement("a");
  link.download = downloadFileName;
  link.href = canvas.toDataURL("image/jpeg", 0.96);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    } catch {
      // ignore
    }
  }, 300);
}

