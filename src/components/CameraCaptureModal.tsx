import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Camera, 
  RefreshCw, 
  X, 
  Check, 
  AlertCircle, 
  Upload, 
  Maximize2,
  Sparkles,
  SwitchCamera
} from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  isDarkMode: boolean;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  isDarkMode
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Kameraları listele ve birden fazla kamera var mı kontrol et
  useEffect(() => {
    if (!isOpen) return;
    navigator.mediaDevices?.enumerateDevices?.().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    }).catch(() => {
      setHasMultipleCameras(false);
    });
  }, [isOpen]);

  // Kamera Akışını Başlat
  const startCamera = useCallback(async (mode: "environment" | "user") => {
    setIsInitializing(true);
    setErrorMessage(null);

    // Mevcut akışı durdur
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tarayıcınız doğrudan kamera akışını desteklemiyor.");
      }

      // Mobil ve masaüstü için ideal yüksek çözünürlük parametreleri
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errFallback) {
        // Belirtilen facingMode başarısız olursa genel kamera kısıtıyla dene
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.warn("Kamera başlatılamadı:", err);
      let msg = "Kameraya erişilemedi. Lütfen kamera izinlerini kontrol ediniz.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Kamera erişim izni reddedildi. Lütfen tarayıcı ayarlarından kamera izni veriniz.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Cihazınızda kullanılabilir bir kamera bulunamadı.";
      }
      setErrorMessage(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [stream]);

  // Modal açıldığında kamerayı başlat
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCapturedBlob(null);
      startCamera(facingMode);
    } else {
      // Modal kapandığında akışı derhal durdur (pil & donanım koruması)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCapturedImage(null);
      setCapturedBlob(null);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Video elementine stream bağlama
  useEffect(() => {
    if (videoRef.current && stream && !capturedImage) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedImage]);

  // Kamera Yönünü Değiştir (Ön / Arka)
  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Fotoğrafı Çek (Canvas'a aktar)
  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Eğer ön kamera ise aynalamayı düzeltmek için yatay çevirme uygulanabilir
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedImage(previewUrl);
      }
    }, "image/jpeg", 0.92);
  };

  // Yeniden Çek
  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
    if (!stream) {
      startCamera(facingMode);
    }
  };

  // Onayla ve Eser Olarak Yükle
  const handleConfirm = () => {
    if (!capturedBlob) return;
    const timestamp = new Date().getTime();
    const fileName = `sanat_eseri_kamera_${timestamp}.jpg`;
    const file = new File([capturedBlob], fileName, { type: "image/jpeg" });

    // Akışı kapat
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    onCapture(file);
    onClose();
  };

  // Fallback: Doğrudan cihaz kamerasından dosya seçme
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      onCapture(file);
      onClose();
    }
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDarkMode ? "bg-[#121418] border-neutral-700/80 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Üst Başlık & Kontroller */}
        <div className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
          isDarkMode ? "border-neutral-800 bg-neutral-900/80" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#C5A059] flex items-center gap-2">
                <span>Eser Fotoğrafı Çek</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Canlı Kamera
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Telefon, tablet veya bilgisayar kameranızla eseri çerçeveye hizalayın
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Ön / Arka Kamera Çevirme Butonu (Eğer çekim yapılmadıysa ve hata yoksa) */}
            {!capturedImage && !errorMessage && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-700" 
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
                title="Kamerayı Değiştir (Ön/Arka)"
              >
                <SwitchCamera className="w-4 h-4" />
                <span className="hidden sm:inline">{facingMode === "environment" ? "Ön Kamera" : "Arka Kamera"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDarkMode ? "text-neutral-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video / Fotoğraf Alanı */}
        <div className="relative bg-black aspect-[4/3] sm:aspect-[16/10] w-full flex items-center justify-center overflow-hidden">
          {/* Gizli Canvas (Kare yakalamak için) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Gizli Fallback Kamera Inputu */}
          <input
            type="file"
            ref={fallbackInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFallbackFile}
            className="hidden"
          />

          {/* 1. Çekilmiş Fotoğraf Önizlemesi */}
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img 
                src={capturedImage} 
                alt="Çekilen Sanat Eseri" 
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-white/20 text-xs font-bold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fotoğraf Hazır</span>
              </div>
            </div>
          ) : errorMessage ? (
            /* 2. Hata veya İzin Reddedildi Durumu */
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-neutral-300">
                {errorMessage}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C5A059] hover:bg-[#b08c48] text-black transition-all cursor-pointer"
                >
                  Tekrar Dene
                </button>
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cihaz Kamerasını Aç</span>
                </button>
              </div>
            </div>
          ) : (
            /* 3. Canlı Video Akışı */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Kılavuz Çerçeve Overlay (Eseri hizalamak için) */}
              <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-[#C5A059]/60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="text-[11px] font-bold text-[#C5A059] bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-[#C5A059]/40 shadow-sm">
                  Sanat Eserini Bu Alana Hizalayın
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-neutral-300 font-medium">Kamera Başlatılıyor...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
          isDarkMode ? "border-neutral-800 bg-[#14171c]" : "border-slate-100 bg-slate-50"
        }`}>
          {capturedImage ? (
            /* Fotoğraf Çekildikten Sonraki Butonlar */
            <div className="flex items-center justify-between w-full gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDarkMode ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Yeniden Çek</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#C5A059] hover:bg-[#b08c48] text-black shadow-md font-sans active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Eser Olarak Kullan</span>
              </button>
            </div>
          ) : (
            /* Canlı Çekim Sırasındaki Butonlar */
            <div className="flex items-center justify-between w-full">
              {/* Sol: Cihaz Dosya / Kamera Fallback Butonu */}
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className={`text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Cihazınızın yerel kamera veya galeri seçicisini açar"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Cihaz Kamerasından Dosya Seç</span>
              </button>

              {/* Orta: Büyük Şık Deklanşör Butonu */}
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={isInitializing || !!errorMessage}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90 ${
                  isInitializing || !!errorMessage 
                    ? "opacity-40 cursor-not-allowed border-neutral-600 bg-neutral-800 text-neutral-500" 
                    : "border-white bg-[#C5A059] hover:bg-[#d8b46d] text-black hover:shadow-[#C5A059]/40"
                }`}
                aria-label="Fotoğrafı Çek"
              >
                <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>

              {/* Sağ: İptal / Kapat Butonu */}
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDarkMode ? "bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
