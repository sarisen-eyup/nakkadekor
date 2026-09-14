import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, 
  RotateCcw, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Check, 
  Maximize2, 
  Scan, 
  Crop as CropIcon,
  HelpCircle,
  Sparkles
} from "lucide-react";

interface Point {
  x: number; // 0..1 normalized relative to image width
  y: number; // 0..1 normalized relative to image height
}

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropSave: (croppedDataUrl: string) => void;
  targetWidthCm?: number;
  targetHeightCm?: number;
  isDarkMode?: boolean;
  title?: string;
  subtitle?: string;
  saveButtonText?: string;
  hideDimensions?: boolean;
  dimensionLabel?: string;
  instructionBannerText?: string;
  zIndexClass?: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropSave,
  targetWidthCm = 50,
  targetHeightCm = 70,
  isDarkMode = true,
  title,
  subtitle,
  saveButtonText,
  hideDimensions = false,
  dimensionLabel,
  instructionBannerText,
  zIndexClass = "z-50"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Source image state & transformations
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // 4 Corner points in normalized coordinates (0..1)
  // 0: Top-Left, 1: Top-Right, 2: Bottom-Right, 3: Bottom-Left
  const [corners, setCorners] = useState<Point[]>([
    { x: 0.02, y: 0.02 },
    { x: 0.98, y: 0.02 },
    { x: 0.98, y: 0.98 },
    { x: 0.02, y: 0.98 },
  ]);

  // Active dragging state
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  // Display transform & scaling
  const [imageScale, setImageScale] = useState<number>(1);
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image when imageUrl changes or modal opens
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImg(img);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      resetCorners();
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Reset corners to full bounding box with a small margin
  const resetCorners = () => {
    setCorners([
      { x: 0.02, y: 0.02 },
      { x: 0.98, y: 0.02 },
      { x: 0.98, y: 0.98 },
      { x: 0.02, y: 0.98 },
    ]);
  };

  // Preset to quickly isolate a horizontal frame profile moulding strip
  const setCornersToHorizontalStrip = () => {
    setCorners([
      { x: 0.03, y: 0.30 },
      { x: 0.97, y: 0.30 },
      { x: 0.97, y: 0.70 },
      { x: 0.03, y: 0.70 },
    ]);
  };

  // Helper to get transformed base image on a canvas (applying rotation & flip)
  const getTransformedCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!sourceImg) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const is90or270 = rotation % 180 !== 0;
    const w = is90or270 ? sourceImg.height : sourceImg.width;
    const h = is90or270 ? sourceImg.width : sourceImg.height;

    canvas.width = w;
    canvas.height = h;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(
      sourceImg,
      -sourceImg.width / 2,
      -sourceImg.height / 2
    );
    ctx.restore();

    return canvas;
  }, [sourceImg, rotation, flipH, flipV]);

  // Draw preview canvas with corner handles, guidelines, and dark mask
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !sourceImg) return;

    const baseCanvas = getTransformedCanvas();
    if (!baseCanvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Available container size
    const containerW = container.clientWidth - 40;
    const containerH = container.clientHeight - 40;

    if (containerW <= 0 || containerH <= 0) return;

    const imgW = baseCanvas.width;
    const imgH = baseCanvas.height;

    // Fit image inside container
    const scale = Math.min(containerW / imgW, containerH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (container.clientWidth - drawW) / 2;
    const offsetY = (container.clientHeight - drawH) / 2;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    setImageScale(scale);
    setImageOffset({ x: offsetX, y: offsetY });

    // 1. Clear background
    ctx.fillStyle = "#121415";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw base image
    ctx.drawImage(baseCanvas, offsetX, offsetY, drawW, drawH);

    // Convert normalized corners (0..1) to canvas display coordinates
    const displayPoints = corners.map((p) => ({
      x: offsetX + p.x * drawW,
      y: offsetY + p.y * drawH,
    }));

    // 3. Dark overlay outside selected quad
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    // Cutout quad (counter-clockwise)
    ctx.moveTo(displayPoints[0].x, displayPoints[0].y);
    ctx.lineTo(displayPoints[3].x, displayPoints[3].y);
    ctx.lineTo(displayPoints[2].x, displayPoints[2].y);
    ctx.lineTo(displayPoints[1].x, displayPoints[1].y);
    ctx.closePath();
    ctx.fill();

    // 4. Draw Quad Border & Grid lines (3x3 grid)
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#C5A059";
    ctx.beginPath();
    ctx.moveTo(displayPoints[0].x, displayPoints[0].y);
    ctx.lineTo(displayPoints[1].x, displayPoints[1].y);
    ctx.lineTo(displayPoints[2].x, displayPoints[2].y);
    ctx.lineTo(displayPoints[3].x, displayPoints[3].y);
    ctx.closePath();
    ctx.stroke();

    // Internal 3x3 grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(197, 160, 89, 0.35)";
    ctx.setLineDash([4, 4]);

    for (let i = 1; i <= 2; i++) {
      const t = i / 3;

      // Top to Bottom grid lines
      const topX = displayPoints[0].x + t * (displayPoints[1].x - displayPoints[0].x);
      const topY = displayPoints[0].y + t * (displayPoints[1].y - displayPoints[0].y);
      const botX = displayPoints[3].x + t * (displayPoints[2].x - displayPoints[3].x);
      const botY = displayPoints[3].y + t * (displayPoints[2].y - displayPoints[3].y);

      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(botX, botY);
      ctx.stroke();

      // Left to Right grid lines
      const leftX = displayPoints[0].x + t * (displayPoints[3].x - displayPoints[0].x);
      const leftY = displayPoints[0].y + t * (displayPoints[3].y - displayPoints[0].y);
      const rightX = displayPoints[1].x + t * (displayPoints[2].x - displayPoints[1].x);
      const rightY = displayPoints[1].y + t * (displayPoints[2].y - displayPoints[1].y);

      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line dash

    // 5. Draw Corner Handles & Loupe (Magnifier for exact 90° corner precision)
    const handleLabels = ["Sol Üst", "Sağ Üst", "Sağ Alt", "Sol Alt"];

    displayPoints.forEach((pt, idx) => {
      const isActive = activeCorner === idx;
      const isHover = hoveredCorner === idx;

      // Outer ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isActive ? 16 : isHover ? 14 : 11, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? "#E5C158" : "#C5A059";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#121415";
      ctx.fill();

      // Label text
      ctx.font = "bold 9px sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      const offsetYText = idx < 2 ? -18 : 22;
      ctx.fillText(handleLabels[idx], pt.x, pt.y + offsetYText);
    });

    // 6. Draw Magnifying Glass Loupe for Active Dragging Point
    if (activeCorner !== null && dragPos) {
      const activePt = displayPoints[activeCorner];

      const loupeRadius = 45;
      // Position loupe offset to avoid hiding under user's finger or cursor
      const loupeX = activePt.x + (activePt.x > canvas.width / 2 ? -80 : 80);
      const loupeY = activePt.y + (activePt.y > canvas.height / 2 ? -80 : 80);

      ctx.save();
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw background
      ctx.fillStyle = "#121415";
      ctx.fillRect(loupeX - loupeRadius, loupeY - loupeRadius, loupeRadius * 2, loupeRadius * 2);

      // Draw magnified portion of image (2.5x zoom)
      const zoom = 2.5;
      ctx.drawImage(
        baseCanvas,
        (activePt.x - offsetX) / scale - (loupeRadius / (scale * zoom)),
        (activePt.y - offsetY) / scale - (loupeRadius / (scale * zoom)),
        (loupeRadius * 2) / (scale * zoom),
        (loupeRadius * 2) / (scale * zoom),
        loupeX - loupeRadius,
        loupeY - loupeRadius,
        loupeRadius * 2,
        loupeRadius * 2
      );

      // Loupe crosshair
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#C5A059";
      ctx.beginPath();
      ctx.moveTo(loupeX - 12, loupeY);
      ctx.lineTo(loupeX + 12, loupeY);
      ctx.moveTo(loupeX, loupeY - 12);
      ctx.lineTo(loupeX, loupeY + 12);
      ctx.stroke();

      ctx.restore();

      // Loupe Border
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#C5A059";
      ctx.stroke();
    }
  }, [sourceImg, corners, activeCorner, hoveredCorner, dragPos, getTransformedCanvas]);

  // Re-render preview on change
  useEffect(() => {
    if (isOpen) {
      renderPreview();
    }
  }, [isOpen, renderPreview]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => renderPreview();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderPreview]);

  // Convert client pointer event (mouse/touch) to image relative (0..1) point
  const getCanvasPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      return null;
    }

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const drawW = (canvas.width - imageOffset.x * 2);
    const drawH = (canvas.height - imageOffset.y * 2);

    const normX = Math.max(0, Math.min(1, (canvasX - imageOffset.x) / drawW));
    const normY = Math.max(0, Math.min(1, (canvasY - imageOffset.y) / drawH));

    return { canvasX, canvasY, normX, normY };
  };

  // Pointer event listeners
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPointerPos(e);
    if (!pos) return;

    // Check hit test against existing corner handles (hit radius 25px)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawW = canvas.width - imageOffset.x * 2;
    const drawH = canvas.height - imageOffset.y * 2;

    let closestIdx = -1;
    let minDistance = 28; // pixels hit radius

    corners.forEach((p, idx) => {
      const ptX = imageOffset.x + p.x * drawW;
      const ptY = imageOffset.y + p.y * drawH;
      const dist = Math.hypot(pos.canvasX - ptX, pos.canvasY - ptY);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== -1) {
      setActiveCorner(closestIdx);
      setDragPos({ x: pos.canvasX, y: pos.canvasY });
    }
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    const pos = getCanvasPointerPos(e);
    if (!pos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawW = canvas.width - imageOffset.x * 2;
    const drawH = canvas.height - imageOffset.y * 2;

    if (activeCorner !== null) {
      setDragPos({ x: pos.canvasX, y: pos.canvasY });
      setCorners((prev) => {
        const next = [...prev];
        next[activeCorner] = { x: pos.normX, y: pos.normY };
        return next;
      });
    } else {
      // Hover detection
      let closestIdx: number | null = null;
      let minDistance = 25;

      corners.forEach((p, idx) => {
        const ptX = imageOffset.x + p.x * drawW;
        const ptY = imageOffset.y + p.y * drawH;
        const dist = Math.hypot(pos.canvasX - ptX, pos.canvasY - ptY);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });
      setHoveredCorner(closestIdx);
    }
  }, [activeCorner, corners, imageOffset]);

  const handlePointerUp = useCallback(() => {
    setActiveCorner(null);
    setDragPos(null);
  }, []);

  useEffect(() => {
    if (activeCorner !== null) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("touchend", handlePointerUp);
      return () => {
        window.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("mouseup", handlePointerUp);
        window.removeEventListener("touchmove", handlePointerMove);
        window.removeEventListener("touchend", handlePointerUp);
      };
    }
  }, [activeCorner, handlePointerMove, handlePointerUp]);

  // Rotate & Flip Helpers
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
    resetCorners();
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
    resetCorners();
  };

  const handleToggleFlipH = () => {
    setFlipH((prev) => !prev);
  };

  const handleToggleFlipV = () => {
    setFlipV((prev) => !prev);
  };

  // Perform High-Precision Inverse Homography Perspective Transformation with Bilinear Sampling
  const handleApplyCrop = () => {
    const baseCanvas = getTransformedCanvas();
    if (!baseCanvas) return;

    const baseCtx = baseCanvas.getContext("2d");
    if (!baseCtx) return;

    const imgW = baseCanvas.width;
    const imgH = baseCanvas.height;

    // Convert normalized corner coordinates to base image pixel coordinates
    const pTL = { x: corners[0].x * imgW, y: corners[0].y * imgH };
    const pTR = { x: corners[1].x * imgW, y: corners[1].y * imgH };
    const pBR = { x: corners[2].x * imgW, y: corners[2].y * imgH };
    const pBL = { x: corners[3].x * imgW, y: corners[3].y * imgH };

    // Calculate crop dimensions based on average edge lengths
    const topW = Math.hypot(pTR.x - pTL.x, pTR.y - pTL.y);
    const botW = Math.hypot(pBR.x - pBL.x, pBR.y - pBL.y);
    const leftH = Math.hypot(pBL.x - pTL.x, pBL.y - pTL.y);
    const rightH = Math.hypot(pBR.x - pTR.x, pBR.y - pTR.y);

    let outW = Math.max(100, Math.round((topW + botW) / 2));
    let outH = Math.max(100, Math.round((leftH + rightH) / 2));

    // Cap output resolution to 2400px maximum to maintain super fast performance and low memory
    const maxDimension = 2400;
    if (outW > maxDimension || outH > maxDimension) {
      const ratio = Math.min(maxDimension / outW, maxDimension / outH);
      outW = Math.round(outW * ratio);
      outH = Math.round(outH * ratio);
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) return;

    // Fetch source pixel data
    const srcImageData = baseCtx.getImageData(0, 0, imgW, imgH);
    const srcData = srcImageData.data;

    // Prepare destination pixel data buffer
    const outImageData = outCtx.createImageData(outW, outH);
    const outData = outImageData.data;

    // Solve 4-point Perspective Homography (mapping destination [0..1] unit square to source quad)
    const x0 = pTL.x, y0 = pTL.y;
    const x1 = pTR.x, y1 = pTR.y;
    const x2 = pBR.x, y2 = pBR.y;
    const x3 = pBL.x, y3 = pBL.y;

    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dx3 = x0 - x1 + x2 - x3;

    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const dy3 = y0 - y1 + y2 - y3;

    const det = dx1 * dy2 - dx2 * dy1;

    let g = 0;
    let h = 0;

    if (Math.abs(det) > 1e-6) {
      g = (dx3 * dy2 - dy3 * dx2) / det;
      h = (dx1 * dy3 - dy1 * dx3) / det;
    }

    const a = x1 - x0 + g * x1;
    const b = x3 - x0 + h * x3;
    const c = x0;

    const d = y1 - y0 + g * y1;
    const e = y3 - y0 + h * y3;
    const f = y0;

    const denomScaleW = outW > 1 ? outW - 1 : 1;
    const denomScaleH = outH > 1 ? outH - 1 : 1;

    // Perform Inverse Homography Mapping with Bilinear Sub-Pixel Interpolation
    for (let y = 0; y < outH; y++) {
      const vPrime = y / denomScaleH;
      for (let x = 0; x < outW; x++) {
        const uPrime = x / denomScaleW;

        const denom = g * uPrime + h * vPrime + 1;
        const u = (a * uPrime + b * vPrime + c) / denom;
        const v = (d * uPrime + e * vPrime + f) / denom;

        // Clamp coordinates to image boundaries
        const uClamped = Math.max(0, Math.min(imgW - 1, u));
        const vClamped = Math.max(0, Math.min(imgH - 1, v));

        const px0 = Math.floor(uClamped);
        const py0 = Math.floor(vClamped);
        const px1 = Math.min(imgW - 1, px0 + 1);
        const py1 = Math.min(imgH - 1, py0 + 1);

        const fracX = uClamped - px0;
        const fracY = vClamped - py0;

        const i00 = (py0 * imgW + px0) * 4;
        const i10 = (py0 * imgW + px1) * 4;
        const i01 = (py1 * imgW + px0) * 4;
        const i11 = (py1 * imgW + px1) * 4;

        const w00 = (1 - fracX) * (1 - fracY);
        const w10 = fracX * (1 - fracY);
        const w01 = (1 - fracX) * fracY;
        const w11 = fracX * fracY;

        const dstIdx = (y * outW + x) * 4;

        outData[dstIdx]     = Math.round(srcData[i00] * w00 + srcData[i10] * w10 + srcData[i01] * w01 + srcData[i11] * w11);
        outData[dstIdx + 1] = Math.round(srcData[i00 + 1] * w00 + srcData[i10 + 1] * w10 + srcData[i01 + 1] * w01 + srcData[i11 + 1] * w11);
        outData[dstIdx + 2] = Math.round(srcData[i00 + 2] * w00 + srcData[i10 + 2] * w10 + srcData[i01 + 2] * w01 + srcData[i11 + 2] * w11);
        outData[dstIdx + 3] = Math.round(srcData[i00 + 3] * w00 + srcData[i10 + 3] * w10 + srcData[i01 + 3] * w01 + srcData[i11 + 3] * w11);
      }
    }

    outCtx.putImageData(outImageData, 0, 0);

    const croppedDataUrl = outCanvas.toDataURL("image/png", 0.95);
    onCropSave(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass || "z-50"} flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn`}>
      <div className="bg-[#1a1d1f] border border-[#C5A059]/40 rounded-lg shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#C5A059]/20 bg-[#121415] text-white">
          <div className="flex items-center gap-2.5">
            <Scan className="w-5 h-5 text-[#C5A059]" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                {title || "Görsel Kırpma & 90° Köşe Düzeltme (Tara)"}
              </h3>
              <p className="text-[10px] text-neutral-400">
                {subtitle || "Köşelerdeki altın noktaları sürükleyerek tablonun tam açılarını belirleyin"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#181b1c] border-b border-[#C5A059]/15 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#222628] hover:bg-[#C5A059]/20 hover:border-[#C5A059] border border-neutral-700 text-neutral-200 rounded transition-all cursor-pointer text-[11px]"
              title="90 Derece Sola Döndür"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>90° Sola</span>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#222628] hover:bg-[#C5A059]/20 hover:border-[#C5A059] border border-neutral-700 text-neutral-200 rounded transition-all cursor-pointer text-[11px]"
              title="90 Derece Sağa Döndür"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>90° Sağa</span>
            </button>

            <div className="w-px h-5 bg-neutral-800 my-auto" />

            <button
              type="button"
              onClick={handleToggleFlipH}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded transition-all cursor-pointer text-[11px] ${
                flipH
                  ? "bg-[#C5A059]/30 border-[#C5A059] text-white"
                  : "bg-[#222628] border-neutral-700 text-neutral-200 hover:bg-[#C5A059]/20"
              }`}
              title="Yatay Yansıt"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Yatay Çevir</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFlipV}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded transition-all cursor-pointer text-[11px] ${
                flipV
                  ? "bg-[#C5A059]/30 border-[#C5A059] text-white"
                  : "bg-[#222628] border-neutral-700 text-neutral-200 hover:bg-[#C5A059]/20"
              }`}
              title="Dikey Yansıt"
            >
              <FlipVertical className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Dikey Çevir</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={setCornersToHorizontalStrip}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222628] hover:bg-[#C5A059]/20 border border-neutral-700 hover:border-[#C5A059]/40 text-neutral-200 hover:text-[#C5A059] font-medium rounded transition-all cursor-pointer text-[11px]"
              title="Çerçeve Çıtası için Yatay Şerit Seç"
            >
              <CropIcon className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Yatay Şerit (Çıta)</span>
            </button>

            <button
              type="button"
              onClick={resetCorners}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222628] hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#C5A059] font-semibold rounded transition-all cursor-pointer text-[11px]"
              title="Köşeleri Tam Sınırlara Sıfırla"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Tüm Görsel</span>
            </button>
          </div>
        </div>

        {/* Canvas Visual Workspace */}
        <div 
          ref={containerRef} 
          data-no-drag-scroll="true"
          className="flex-grow relative bg-[#121415] overflow-hidden flex items-center justify-center select-none touch-none"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          <canvas ref={canvasRef} className="block cursor-crosshair max-w-full max-h-full" />

          {/* Floating Instructions Banner */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1a1d1f]/90 border border-[#C5A059]/40 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-none text-[11px] text-neutral-200 max-w-[90%] text-center">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0 animate-pulse" />
            <span>{instructionBannerText || "Köşe noktalarını tutarak yamuk çekilen fotoğrafları dikleştirebilirsiniz"}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#121415] border-t border-[#C5A059]/20 text-xs">
          {!hideDimensions ? (
            <div className="text-neutral-400 text-[11px] font-mono hidden sm:block">
              {dimensionLabel ? dimensionLabel : (
                <>Hedef Ölçü: <span className="text-[#C5A059] font-bold">{targetWidthCm} x {targetHeightCm} cm</span></>
              )}
            </div>
          ) : (
            <div className="text-neutral-400 text-[11px] font-mono hidden sm:block">
              {dimensionLabel || "Çerçeve Profil Dokusu Kırpma"}
            </div>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#222628] hover:bg-neutral-700 text-neutral-300 font-bold transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              İptal
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              className="flex items-center gap-2 px-5 py-2 rounded bg-[#C5A059] hover:bg-[#B28E46] text-black font-extrabold transition-all cursor-pointer shadow-lg active:scale-95 text-xs uppercase tracking-widest"
            >
              <CropIcon className="w-4 h-4" />
              <span>{saveButtonText || "Kırp ve Tabloya Aktar"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
