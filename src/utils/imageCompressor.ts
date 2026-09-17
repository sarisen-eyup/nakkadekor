/**
 * HTML5 Canvas Tabanlı İstemci Tarafı Görsel Sıkıştırma ve Optimizasyon Modülü
 * 
 * Amaç:
 * 1. Tarayıcıda yüklenen veya kırpılan yüksek çözünürlüklü fotoğrafları maksimum 1920px genişliğe küçültmek.
 * 2. %75-%80 JPEG kalitesinde sıkıştırarak megabaytlarca boyutu 150-400 KB seviyesine indirmek.
 * 3. Asla Base64 formatında veritabanına göndermemek; doğrudan binary Blob olarak Supabase Storage'a aktarmak.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.75 - 0.80 arası önerilir
  mimeType?: "image/jpeg" | "image/webp";
}

export interface CompressResult {
  blob: Blob;
  file: File;
  width: number;
  height: number;
  originalSizeKb: number;
  compressedSizeKb: number;
  previewUrl: string;
}

/**
 * Bir File, Blob veya Base64 Data URL'i alır, maksimum 1920px boyut ve %80 kalitede sıkıştırarak Blob ve File nesnesi döner.
 */
export async function compressImage(
  source: File | Blob | string,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.80,
    mimeType = "image/jpeg"
  } = options;

  let originalSizeKb = 0;
  let fileName = "compressed_image.jpg";

  if (source instanceof File) {
    originalSizeKb = Math.round(source.size / 1024);
    fileName = source.name.replace(/\.[^/.]+$/, "") + ".jpg";
  } else if (source instanceof Blob) {
    originalSizeKb = Math.round(source.size / 1024);
  } else if (typeof source === "string" && source.startsWith("data:")) {
    originalSizeKb = Math.round((source.length * (3 / 4)) / 1024);
  }

  // 1. Görseli bir HTMLImageElement olarak yükle
  const img = await loadImageElement(source);

  // 2. En-Boy oranını koruyarak yeni ölçüleri hesapla (maks 1920x1920)
  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const widthRatio = maxWidth / targetWidth;
    const heightRatio = maxHeight / targetHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // 3. HTML5 Canvas üzerinde çiz ve sıkıştır
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("Canvas 2D context oluşturulamadı");
  }

  // Arka planı beyaz yap (JPEG formatında şeffaf pikseller siyah çıkmasın)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Yüksek kaliteli pürüzsüzleştirme
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Çizim yap
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 4. Canvas'tan optimize Blob üret
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob dönüşümü başarısız oldu"));
      },
      mimeType,
      quality
    );
  });

  const compressedSizeKb = Math.round(blob.size / 1024);
  const compressedFile = new File([blob], fileName, { type: mimeType });
  const previewUrl = URL.createObjectURL(blob);

  // Geliştirici konsolunda tasarrufu göster
  if (originalSizeKb > 0) {
    const savingPercent = Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100));
    console.log(
      `[ImageCompressor] ${originalSizeKb} KB -> ${compressedSizeKb} KB (%${savingPercent} tasarruf, ${targetWidth}x${targetHeight}px, Q:${quality})`
    );
  }

  return {
    blob,
    file: compressedFile,
    width: targetWidth,
    height: targetHeight,
    originalSizeKb,
    compressedSizeKb,
    previewUrl
  };
}

/**
 * Yardımcı: Kaynaktan HTMLImageElement nesnesi üretir
 */
function loadImageElement(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    let urlToRevoke: string | null = null;

    img.onload = () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      resolve(img);
    };

    img.onerror = (err) => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      reject(new Error("Görsel yüklenirken hata oluştu: " + String(err)));
    };

    if (typeof source === "string") {
      img.src = source;
    } else {
      urlToRevoke = URL.createObjectURL(source);
      img.src = urlToRevoke;
    }
  });
}
