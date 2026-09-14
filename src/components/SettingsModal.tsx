import React, { useState, useEffect } from "react";
import { 
  X, Settings, Database, Plus, Trash2, Check, RefreshCw, DollarSign, 
  Tag, Image as ImageIcon, Lock, Unlock, KeyRound, ShieldCheck, 
  Eye, EyeOff, Upload, AlertCircle, Users, Shield, Building2, Phone, Mail, MapPin, Globe, CreditCard,
  Camera, Scan, Crop as CropIcon, Sparkles, TrendingUp, RotateCcw, CheckCircle2
} from "lucide-react";
import { 
  UnitPricesSettings, 
  FrameProfileItem,
  CompanyProfile,
  DEFAULT_COMPANY_PROFILE,
  SubscriptionData,
  isProPlan
} from "../types/pricing";
import { ImageCropModal } from "./ImageCropModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UnitPricesSettings;
  onSaveSettings: (newSettings: UnitPricesSettings) => void;
  profiles: FrameProfileItem[];
  onSaveProfiles: (newProfiles: FrameProfileItem[]) => void;
  onResetToDefaults: () => void;
  isDarkMode?: boolean;
  isShopMode: boolean;
  onToggleShopMode: (enabled: boolean) => void;
  companyProfile?: CompanyProfile;
  onSaveCompanyProfile?: (profile: CompanyProfile) => void;
  initialTab?: "prices" | "profiles" | "privacy" | "whitelabel";
  subscription?: SubscriptionData;
  onOpenSubscriptionModal?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  profiles,
  onSaveProfiles,
  onResetToDefaults,
  isDarkMode = true,
  isShopMode = false,
  onToggleShopMode,
  companyProfile,
  onSaveCompanyProfile,
  initialTab = "prices",
  subscription,
  onOpenSubscriptionModal
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"prices" | "profiles" | "privacy" | "whitelabel">(initialTab);
  
  // Update active tab when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Local edit states
  const [localSettings, setLocalSettings] = useState<UnitPricesSettings>(settings);
  const [localProfiles, setLocalProfiles] = useState<FrameProfileItem[]>(profiles);
  const [localCompany, setLocalCompany] = useState<CompanyProfile>(companyProfile || DEFAULT_COMPANY_PROFILE);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (companyProfile) {
      setLocalCompany(companyProfile);
    }
  }, [companyProfile]);


  // Shop mode PIN verification states
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  const handleConfirmPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === "1234") {
      onToggleShopMode(true);
      setShowPinPrompt(false);
      setPinInput("");
      setPinError(null);
      setPinSuccessMsg("Atölye modu başarıyla aktif edildi!");
      setTimeout(() => setPinSuccessMsg(null), 3000);
    } else {
      setPinError("Hatalı PIN Kodu! (Varsayılan PIN: 1234)");
    }
  };

  // New profile form state
  const [newProfile, setNewProfile] = useState<Partial<FrameProfileItem>>({
    name: "",
    code: "",
    imageUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop",
    widthCm: 5.0,
    unitPricePerMeter: 150,
    materialType: "wood",
    category: "both",
    isRepeatingPattern: true
  });

  // Profile Image Cropping Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropSourceImage, setCropSourceImage] = useState<string>("");
  const [cropTargetProfileId, setCropTargetProfileId] = useState<string | null>(null); // null = newProfile, string = existing profile id
  const [cropModalTitle, setCropModalTitle] = useState<string>("Çerçeve Profili Kırpma & 90° Hizalama");
  const [cropDimensionLabel, setCropDimensionLabel] = useState<string>("Profil Dokusu");

  // Bulk Price Update / Toptancı Zammı States (Sadeleştirilmiş)
  const [bulkTargetMaterial, setBulkTargetMaterial] = useState<"wood" | "all" | "polystyrene" | "aluminum">("wood");
  const [bulkPercent, setBulkPercent] = useState<number>(20);
  const [bulkUndoStack, setBulkUndoStack] = useState<FrameProfileItem[][]>([]);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProfileImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean, profileId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (isNew) {
          setCropSourceImage(dataUrl);
          setCropTargetProfileId(null);
          setCropModalTitle(newProfile.name ? `Çerçeve Profili Kırpma: ${newProfile.name}` : "Yeni Profil Görseli Kırpma & 90° Hizalama");
          setCropDimensionLabel(`Profil Genişliği: ${newProfile.widthCm || 4.0} cm`);
          setIsCropModalOpen(true);
        } else if (profileId) {
          const targetProf = localProfiles.find(p => p.id === profileId);
          setCropSourceImage(dataUrl);
          setCropTargetProfileId(profileId);
          setCropModalTitle(targetProf ? `Profil Kırpma & Hizalama: ${targetProf.name} (${targetProf.code})` : "Profil Görseli Kırpma & Hizalama");
          setCropDimensionLabel(`Profil Genişliği: ${targetProf?.widthCm || 4.0} cm`);
          setIsCropModalOpen(true);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOpenCropForNewProfile = () => {
    if (!newProfile.imageUrl) return;
    setCropSourceImage(newProfile.imageUrl);
    setCropTargetProfileId(null);
    setCropModalTitle(newProfile.name ? `Çerçeve Profili Kırpma: ${newProfile.name}` : "Yeni Profil Görseli Kırpma & 90° Hizalama");
    setCropDimensionLabel(`Profil Genişliği: ${newProfile.widthCm || 4.0} cm`);
    setIsCropModalOpen(true);
  };

  const handleOpenCropForExistingProfile = (prof: FrameProfileItem) => {
    if (!prof.imageUrl) return;
    setCropSourceImage(prof.imageUrl);
    setCropTargetProfileId(prof.id);
    setCropModalTitle(`Profil Kırpma & Hizalama: ${prof.name} (${prof.code})`);
    setCropDimensionLabel(`Profil Genişliği: ${prof.widthCm} cm`);
    setIsCropModalOpen(true);
  };

  const handleCropSave = (croppedDataUrl: string) => {
    if (cropTargetProfileId === null) {
      setNewProfile(prev => ({ ...prev, imageUrl: croppedDataUrl }));
    } else {
      setLocalProfiles(prev =>
        prev.map(p => p.id === cropTargetProfileId ? { ...p, imageUrl: croppedDataUrl } : p)
      );
    }
    setIsCropModalOpen(false);
  };

  const handleSettingChange = (field: keyof UnitPricesSettings, val: number) => {
    setLocalSettings((prev) => ({ ...prev, [field]: isNaN(val) ? 0 : val }));
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name || !newProfile.code) return;

    const created: FrameProfileItem = {
      id: "prof_" + Date.now(),
      name: newProfile.name,
      code: newProfile.code.toUpperCase(),
      imageUrl: newProfile.imageUrl || "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop",
      widthCm: newProfile.widthCm || 4.0,
      unitPricePerMeter: newProfile.unitPricePerMeter || 120,
      materialType: (newProfile.materialType as any) || "wood",
      category: (newProfile.category as any) || "both",
      isRepeatingPattern: newProfile.isRepeatingPattern ?? true
    };

    setLocalProfiles((prev) => [created, ...prev]);
    setNewProfile({
      name: "",
      code: "",
      imageUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=300&auto=format&fit=crop",
      widthCm: 5.0,
      unitPricePerMeter: 150,
      materialType: "wood",
      category: "both",
      isRepeatingPattern: true
    });
  };

  const handleDeleteProfile = (id: string) => {
    setLocalProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleProfilePriceChange = (id: string, price: number) => {
    setLocalProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, unitPricePerMeter: isNaN(price) ? 0 : price } : p))
    );
  };

  const handleProfileWidthChange = (id: string, width: number) => {
    setLocalProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, widthCm: isNaN(width) || width <= 0 ? 0.1 : width } : p))
    );
  };

  const handleToggleRepeating = (id: string) => {
    setLocalProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isRepeatingPattern: !p.isRepeatingPattern } : p))
    );
  };

  // Toplu Zam Uygula (Sade & Hızlı)
  const handleApplyBulkPrice = (
    customTarget?: "wood" | "all" | "polystyrene" | "aluminum",
    customPct?: number
  ) => {
    const targetMat = customTarget || bulkTargetMaterial;
    const pct = customPct !== undefined ? customPct : bulkPercent;

    if (isNaN(pct) || pct <= 0) return;

    // Geri alma için mevcut listeyi kaydet
    setBulkUndoStack((prev) => [localProfiles, ...prev.slice(0, 5)]);

    const updated = localProfiles.map((prof) => {
      const isTarget = targetMat === "all" || prof.materialType === targetMat;
      if (!isTarget) return prof;
      // % pct zam yap, en yakın 5 TL'ye yuvarla
      const raw = prof.unitPricePerMeter * (1 + pct / 100);
      const newPrice = Math.max(0, Math.round(raw / 5) * 5);
      return {
        ...prof,
        unitPricePerMeter: newPrice
      };
    });

    setLocalProfiles(updated);
    onSaveProfiles(updated);

    const affectedCount = localProfiles.filter((p) => targetMat === "all" || p.materialType === targetMat).length;
    const matLabel = targetMat === "wood" ? "Ahşap" : targetMat === "all" ? "Tüm" : targetMat === "polystyrene" ? "Polistren" : "Alüminyum";

    setBulkSuccessMsg(`✓ ${affectedCount} adet ${matLabel} profile %${pct} zam uygulandı ve kaydedildi.`);
    setTimeout(() => {
      setBulkSuccessMsg(null);
    }, 4000);
  };

  // Son Zammı Geri Al
  const handleUndoBulkPrice = () => {
    if (bulkUndoStack.length === 0) return;
    const previous = bulkUndoStack[0];
    setLocalProfiles(previous);
    onSaveProfiles(previous);
    setBulkUndoStack((prev) => prev.slice(1));
    setBulkSuccessMsg("✓ Son yapılan zam geri alındı.");
    setTimeout(() => {
      setBulkSuccessMsg(null);
    }, 3500);
  };

  const canUploadLogo = isProPlan(subscription);

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadLogo) {
      if (onOpenSubscriptionModal) {
        onOpenSubscriptionModal();
      }
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLocalCompany(prev => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCompanyLogo = () => {
    setLocalCompany(prev => ({ ...prev, logoUrl: "" }));
  };

  const handleCompanyChange = (field: keyof CompanyProfile, val: any) => {
    setLocalCompany(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveAll = () => {
    onSaveSettings(localSettings);
    onSaveProfiles(localProfiles);
    if (onSaveCompanyProfile) {
      onSaveCompanyProfile(localCompany);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className={`relative w-full max-w-4xl border rounded-lg shadow-2xl overflow-hidden flex flex-col h-[85vh] min-h-[580px] max-h-[820px] ${
        isDarkMode 
          ? "bg-[#14171a] border-[#C5A059]/40 text-white" 
          : "bg-white border-[#cbd5e1] text-slate-900"
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDarkMode ? "bg-[#1c2026] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded border ${
              isDarkMode ? "bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059]" : "bg-[#B88E3A]/10 border-[#B88E3A]/30 text-[#B88E3A]"
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`text-base sm:text-lg font-bold tracking-wide uppercase ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}>
                  ATÖLYE AYARLARI & GİZLİLİK YÖNETİMİ
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md border ${
                  isShopMode
                    ? (isDarkMode ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-amber-100 border-amber-300 text-amber-800")
                    : (isDarkMode ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-blue-100 border-blue-200 text-blue-800")
                }`}>
                  {isShopMode ? "ATÖLYE MODU" : "MÜŞTERİ MODU"}
                </span>
              </div>
              <p className={`text-xs font-medium ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                Birim maliyetler, profil veritabanı, ekran gizlilik modu ve yetkilendirme ayarları
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isDarkMode ? "text-neutral-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div 
          data-drag-scroll="true"
          className={`flex border-b px-6 overflow-x-auto shrink-0 drag-scroll select-none ${
          isDarkMode ? "bg-[#181b20] border-[#C5A059]/20" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            onClick={() => setActiveTab("prices")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === "prices"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#B88E3A] text-[#B88E3A] bg-[#B88E3A]/10")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-white" : "border-transparent text-slate-600 hover:text-slate-900")
            }`}
          >
            <DollarSign className="w-4 h-4" />
            01. BİRİM MALİYET & KÂR AYARLARI
          </button>

          <button
            onClick={() => setActiveTab("profiles")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === "profiles"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#B88E3A] text-[#B88E3A] bg-[#B88E3A]/10")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-white" : "border-transparent text-slate-600 hover:text-slate-900")
            }`}
          >
            <Database className="w-4 h-4" />
            02. ÇERÇEVE PROFİL VERİTABANI ({localProfiles.length})
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === "privacy"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#B88E3A] text-[#B88E3A] bg-[#B88E3A]/10")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-white" : "border-transparent text-slate-600 hover:text-slate-900")
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            03. EKRAN GÖRÜNÜM & GİZLİLİK MODU
          </button>

          <button
            onClick={() => setActiveTab("whitelabel")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === "whitelabel"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10" : "border-[#B88E3A] text-[#B88E3A] bg-[#B88E3A]/10")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-white" : "border-transparent text-slate-600 hover:text-slate-900")
            }`}
          >
            <Building2 className="w-4 h-4" />
            04. KURUMSAL BİLGİLER (WHITE-LABEL)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[500px] space-y-6">
          {activeTab === "prices" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: Hammadde & Baskı Birim Fiyatları */}
              <div className={`border rounded-md p-4 space-y-4 ${
                isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/20" : "bg-slate-50 border-slate-200"
              }`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
                  isDarkMode ? "text-[#C5A059] border-[#C5A059]/20" : "text-[#B88E3A] border-slate-200"
                }`}>
                  <Tag className="w-4 h-4" /> Hammadde & Alan / Metre Fiyatları
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Tuval / Baskı m² Fiyatı (₺/m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={localSettings.canvasPrintPricePerSqm}
                        onChange={(e) => handleSettingChange("canvasPrintPricePerSqm", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m²</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      İç Paspartu Kartonu (₺/m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={localSettings.matBoardPricePerSqm}
                        onChange={(e) => handleSettingChange("matBoardPricePerSqm", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m²</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Ara Paspartu (3D Derinlik Mukavvası) (₺/m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={localSettings.middleMatBoardPricePerSqm}
                        onChange={(e) => handleSettingChange("middleMatBoardPricePerSqm", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m²</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Şeffaf Cam / Akrilik Paspartu (₺/m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={localSettings.transparentMatBoardPricePerSqm ?? 520}
                        onChange={(e) => handleSettingChange("transparentMatBoardPricePerSqm", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m²</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Cam / Koruyucu Akrilik (₺/m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={localSettings.glassPricePerSqm}
                        onChange={(e) => handleSettingChange("glassPricePerSqm", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m²</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      MDF / Arkalık Kartonu (₺/m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={localSettings.backingBoardPricePerSqm}
                        onChange={(e) => handleSettingChange("backingBoardPricePerSqm", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m²</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Arkalık Kapama Bezi (₺/m²)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={localSettings.backingClothPricePerSqm ?? localSettings.backingPaperPricePerSqm ?? 90}
                        onChange={(e) => handleSettingChange("backingClothPricePerSqm", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m²</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Kraft Bitiş / Islak Bandı (₺/m)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="2"
                        value={localSettings.kraftTapePricePerMeter ?? 20}
                        onChange={(e) => handleSettingChange("kraftTapePricePerMeter", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Varsayılan Çerçeve Metre Fiyatları, İşçilik & Kâr */}
              <div className={`border rounded-md p-4 space-y-4 ${
                isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/20" : "bg-slate-50 border-slate-200"
              }`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
                  isDarkMode ? "text-[#C5A059] border-[#C5A059]/20" : "text-[#B88E3A] border-slate-200"
                }`}>
                  <DollarSign className="w-4 h-4" /> Çerçeve, İşçilik, Kâr & KDV
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Varsayılan İç Çerçeve Metre Tül Fiyatı (₺/m)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={localSettings.defaultInnerFramePricePerMeter}
                        onChange={(e) => handleSettingChange("defaultInnerFramePricePerMeter", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/mt</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Varsayılan Dış Çerçeve Metre Tül Fiyatı (₺/m)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={localSettings.defaultOuterFramePricePerMeter}
                        onChange={(e) => handleSettingChange("defaultOuterFramePricePerMeter", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺/mt</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Varsayılan Kargo & Teslimat Ücreti (₺)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={localSettings.defaultShippingCost ?? 150}
                        onChange={(e) => handleSettingChange("defaultShippingCost", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      Sabit Atölye İşçilik Bedeli (₺)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="25"
                        value={localSettings.laborFixedCost}
                        onChange={(e) => handleSettingChange("laborFixedCost", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Kesim File/Atık (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={localSettings.wastePercentage}
                          onChange={(e) => handleSettingChange("wastePercentage", parseFloat(e.target.value))}
                          className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                          }`}
                        />
                        <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>%</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>
                        Hedef Kâr Marjı (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={localSettings.targetProfitMarginPercent}
                          onChange={(e) => handleSettingChange("targetProfitMarginPercent", parseFloat(e.target.value))}
                          className={`w-full border rounded px-3 py-2 font-mono font-bold focus:outline-none ${
                            isDarkMode ? "bg-[#121415] border-[#C5A059]/50 text-[#C5A059] focus:border-[#C5A059]" : "bg-white border-[#B88E3A]/50 text-[#B88E3A] focus:border-[#B88E3A]"
                          }`}
                        />
                        <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`}>%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                      KDV Oranı (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={localSettings.vatRatePercent}
                        onChange={(e) => handleSettingChange("vatRatePercent", parseFloat(e.target.value))}
                        className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                      <span className={`absolute right-3 top-2 font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>%</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === "profiles" && (
            <div className="space-y-6">

              {/* SADE TOPTANCI ZAMMI PANELİ */}
              <div 
                id="bulk-price-section"
                className={`p-3.5 sm:p-4 rounded-xl border transition-all shadow-sm ${
                  isDarkMode 
                    ? "bg-[#16181b] border-[#C5A059]/35" 
                    : "bg-amber-50/70 border-amber-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Sol: Seçim + Yüzde + Buton */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isDarkMode ? "bg-[#C5A059]/15 text-[#C5A059]" : "bg-amber-100 text-amber-800"
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={bulkTargetMaterial}
                        onChange={(e) => setBulkTargetMaterial(e.target.value as any)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                          isDarkMode 
                            ? "bg-[#101214] border-neutral-700 text-neutral-100 focus:border-[#C5A059]" 
                            : "bg-white border-slate-300 text-slate-800 focus:border-[#B88E3A]"
                        }`}
                      >
                        <option value="wood">🪵 Tüm Ahşap Profillere</option>
                        <option value="all">🌐 Tüm Profillere (Koleksiyon)</option>
                        <option value="polystyrene">🏛️ Polistren Profillere</option>
                        <option value="aluminum">✨ Alüminyum Profillere</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-mono font-bold ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>%</span>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={bulkPercent}
                          onChange={(e) => setBulkPercent(parseFloat(e.target.value) || 0)}
                          className={`w-14 px-2 py-1.5 text-xs font-mono font-bold text-center rounded-lg border focus:outline-none ${
                            isDarkMode 
                              ? "bg-[#101214] border-neutral-700 text-[#C5A059] focus:border-[#C5A059]" 
                              : "bg-white border-slate-300 text-[#B88E3A] focus:border-[#B88E3A]"
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyBulkPrice()}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 active:scale-95 ${
                          isDarkMode 
                            ? "bg-[#C5A059] text-black font-extrabold" 
                            : "bg-[#B88E3A] text-white"
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Zam Yap</span>
                      </button>
                    </div>
                  </div>

                  {/* Sağ: Geri Al Butonu (Varsa) */}
                  {bulkUndoStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndoBulkPrice}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center ${
                        isDarkMode 
                          ? "bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-amber-500/40" 
                          : "bg-white hover:bg-slate-100 text-amber-800 border-amber-300 shadow-sm"
                      }`}
                      title="Son zammı geri al"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Son Zammı Geri Al</span>
                    </button>
                  )}
                </div>

                {/* Hızlı Butonlar */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-neutral-700/30 dark:border-neutral-800/60 flex-wrap">
                  <span className={`text-[11px] font-medium mr-1 ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    Hızlı:
                  </span>
                  {[10, 15, 20, 25, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setBulkPercent(pct);
                        handleApplyBulkPrice(undefined, pct);
                      }}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        isDarkMode 
                          ? "bg-[#212429] hover:bg-[#C5A059] text-neutral-200 hover:text-black border-neutral-700 hover:border-[#C5A059]" 
                          : "bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border-slate-200 hover:border-amber-300 shadow-xs"
                      }`}
                    >
                      +%{pct}
                    </button>
                  ))}
                </div>

                {/* Bildirim Mesajı */}
                {bulkSuccessMsg && (
                  <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{bulkSuccessMsg}</span>
                  </div>
                )}
              </div>
              
              {/* Form: Add New Frame Profile */}
              <form onSubmit={handleAddProfile} className={`border rounded-md p-4 space-y-4 ${
                isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
              }`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                }`}>
                  <Plus className="w-4 h-4" /> Yeni Çerçeve Profili Ekle
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className={`block mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Profil Adı</label>
                    <input
                      type="text"
                      placeholder="Örn: Altın Oymalı Klasik"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                      className={`w-full border rounded px-3 py-2 font-sans focus:outline-none ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Profil Kodu</label>
                    <input
                      type="text"
                      placeholder="Örn: AK-101"
                      value={newProfile.code}
                      onChange={(e) => setNewProfile({ ...newProfile, code: e.target.value })}
                      className={`w-full border rounded px-3 py-2 font-mono uppercase focus:outline-none ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Metre Tül Fiyatı (₺/m)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      placeholder="150"
                      value={newProfile.unitPricePerMeter}
                      onChange={(e) => setNewProfile({ ...newProfile, unitPricePerMeter: parseFloat(e.target.value) })}
                      className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Profil Genişliği (cm)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.01"
                      placeholder="5.00"
                      value={newProfile.widthCm}
                      onChange={(e) => setNewProfile({ ...newProfile, widthCm: parseFloat(e.target.value) })}
                      className={`w-full border rounded px-3 py-2 font-mono focus:outline-none ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Malzeme Türü</label>
                    <select
                      value={newProfile.materialType}
                      onChange={(e) => setNewProfile({ ...newProfile, materialType: e.target.value as any })}
                      className={`w-full border rounded px-3 py-2 font-sans focus:outline-none ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                      }`}
                    >
                      <option value="wood">Doğal Ahşap</option>
                      <option value="polystyrene">Polistren Lamine</option>
                      <option value="aluminum">Alüminyum</option>
                      <option value="composite">Kompozit</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProfile.isRepeatingPattern ?? true}
                        onChange={(e) => setNewProfile({ ...newProfile, isRepeatingPattern: e.target.checked })}
                        className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer"
                      />
                      <span className={`text-xs font-medium select-none ${isDarkMode ? "text-neutral-200" : "text-slate-700"}`}>Tekrarlayan Desen (Pattern)</span>
                    </label>
                  </div>

                  <div className="md:col-span-2 border rounded-lg p-3.5 space-y-3 bg-neutral-900/40 border-neutral-700/60 dark:bg-[#151718] dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDarkMode ? "text-neutral-200" : "text-slate-800"}`}>
                        <Camera className="w-4 h-4 text-[#C5A059]" /> Profil Görseli, Mobil Kamera & Kırpma
                      </label>
                      {newProfile.imageUrl && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#C5A059]" /> Doku Yüklü
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
                      {/* Visual Preview Box */}
                      <div className="relative group shrink-0 w-28 h-20 sm:w-32 sm:h-20 rounded border border-neutral-700 dark:border-neutral-700 bg-neutral-950 overflow-hidden flex items-center justify-center shadow-inner">
                        {newProfile.imageUrl ? (
                          <img
                            src={newProfile.imageUrl}
                            alt="Profil Doku Önizleme"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-neutral-500 text-[10px] p-2 text-center">
                            <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                            <span>Görsel Yok</span>
                          </div>
                        )}
                        {newProfile.imageUrl && (
                          <button
                            type="button"
                            onClick={handleOpenCropForNewProfile}
                            className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer p-1 text-center"
                            title="Kırpma ve 90° Döndürme Aracını Aç"
                          >
                            <Scan className="w-4 h-4 text-[#C5A059] mb-0.5 animate-pulse" />
                            <span className="text-[10px] font-bold text-[#C5A059]">Kırp & Çevir</span>
                          </button>
                        )}
                      </div>

                      {/* Action Buttons & Helpers */}
                      <div className="flex-1 min-w-0 space-y-2.5 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Direct Camera Button (with capture="environment" for phones) */}
                          <label className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-bold rounded border flex items-center gap-1.5 transition-all shadow-sm ${
                            isDarkMode 
                              ? "bg-[#C5A059] hover:bg-[#b08c48] text-black border-[#C5A059]" 
                              : "bg-[#B88E3A] hover:bg-[#9E7728] text-white border-[#B88E3A]"
                          }`}>
                            <Camera className="w-3.5 h-3.5" /> Fotoğraf Çek (Kamera)
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment"
                              onChange={(e) => handleProfileImageFileUpload(e, true)} 
                              className="hidden" 
                            />
                          </label>

                          {/* Gallery File Upload */}
                          <label className={`cursor-pointer px-3 py-1.5 text-xs font-mono font-medium rounded border flex items-center gap-1.5 transition-colors ${
                            isDarkMode 
                              ? "bg-[#222628] hover:bg-neutral-700 text-neutral-200 border-neutral-700 hover:border-neutral-500" 
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                          }`}>
                            <Upload className="w-3.5 h-3.5 text-[#C5A059]" /> Galeriden Seç
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleProfileImageFileUpload(e, true)} 
                              className="hidden" 
                            />
                          </label>

                          {/* Crop Existing button */}
                          {newProfile.imageUrl && (
                            <button
                              type="button"
                              onClick={handleOpenCropForNewProfile}
                              className={`px-3 py-1.5 text-xs font-mono font-bold rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                                isDarkMode 
                                  ? "bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#C5A059] border-[#C5A059]/50" 
                                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
                              }`}
                            >
                              <Scan className="w-3.5 h-3.5 text-[#C5A059]" /> Kırp & 90° Çevir
                            </button>
                          )}
                        </div>

                        {/* Optional URL Input */}
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="veya Görsel URL'si yapıştırın: https://..."
                            value={newProfile.imageUrl}
                            onChange={(e) => setNewProfile({ ...newProfile, imageUrl: e.target.value })}
                            className={`w-full border rounded px-3 py-1.5 font-mono text-[11px] focus:outline-none truncate ${
                              isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                            }`}
                          />
                          {newProfile.imageUrl && (
                            <button
                              type="button"
                              onClick={handleOpenCropForNewProfile}
                              className="px-2.5 py-1.5 rounded border border-neutral-700 text-neutral-300 hover:text-white text-[10px] font-mono shrink-0 transition-colors cursor-pointer"
                              title="Bu linkteki görseli kırpma aracında aç"
                            >
                              Kırp
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Guidance Tip */}
                    <div className={`text-[10px] rounded px-2.5 py-1.5 flex items-start gap-1.5 ${
                      isDarkMode ? "bg-[#121415] text-neutral-400 border border-neutral-800" : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                      <span>
                        <strong>Mobil Atölye Kolaylığı:</strong> Telefon kameranızla çerçeve çıtasını fotoğrafladığınızda otomatik olarak kırpma arayüzü açılır. <strong>90° Döndür</strong> ve <strong>Yatay Şerit (Çıta)</strong> butonlarıyla açıyı düzelterek arka planı ayırabilir ve kusursuz köşe gönye dokusu elde edebilirsiniz.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className={`flex items-center gap-1.5 px-4 py-2 font-mono font-bold text-xs rounded transition-colors shadow-sm cursor-pointer ${
                      isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white"
                    }`}
                  >
                    <Plus className="w-4 h-4" /> PROFİLİ VERİTABANINA EKLE
                  </button>
                </div>
              </form>

              {/* List: Existing Profiles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? "text-neutral-300" : "text-slate-700"
                  }`}>
                    Kayıtlı Profil Listesi ({localProfiles.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("bulk-price-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDarkMode
                        ? "bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border-[#C5A059]/30"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3 text-[#C5A059]" />
                    <span>Toplu Zam Bölümüne Git</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {localProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      className={`flex items-center gap-3 border p-3 rounded-md transition-colors ${
                        isDarkMode ? "bg-[#1a1d1f] border-neutral-800 hover:border-[#C5A059]/40" : "bg-slate-50 border-slate-200 hover:border-[#B88E3A]/40"
                      }`}
                    >
                      <div className="relative group shrink-0 w-14 h-14 rounded border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-black/40">
                        <img
                          src={prof.imageUrl}
                          alt={prof.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Hover Quick Actions */}
                        <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCropForExistingProfile(prof)}
                            className="w-full py-0.5 px-1 bg-[#C5A059] hover:bg-[#B28E46] text-black text-[9px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer"
                            title="Kırpma ve Döndürme Aracını Aç"
                          >
                            <Scan className="w-2.5 h-2.5" /> Kırp
                          </button>
                          <label className="w-full py-0.5 px-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[9px] font-medium rounded flex items-center justify-center gap-1 cursor-pointer">
                            <Camera className="w-2.5 h-2.5 text-[#C5A059]" /> Çek
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleProfileImageFileUpload(e, false, prof.id)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>{prof.name}</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${
                            isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30" : "bg-[#B88E3A]/15 text-[#B88E3A] border-[#B88E3A]/30"
                          }`}>
                            {prof.code}
                          </span>
                        </div>

                        <div className={`text-[11px] flex items-center gap-1.5 flex-wrap ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                          <span className="capitalize">{prof.materialType === 'wood' ? 'Ahşap' : prof.materialType === 'polystyrene' ? 'Polistren' : 'Alüminyum'}</span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleRepeating(prof.id)}
                            className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-semibold transition-colors cursor-pointer ${
                              prof.isRepeatingPattern ?? true
                                ? (isDarkMode ? "bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30" : "bg-amber-50 text-amber-800 border border-amber-300")
                                : (isDarkMode ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" : "bg-sky-50 text-sky-800 border border-sky-300")
                            }`}
                            title="Tıklayarak desen modunu değiştirin"
                          >
                            {prof.isRepeatingPattern ?? true ? "Tekrarlayan Pattern" : "Sünek Kaplama"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCropForExistingProfile(prof)}
                            className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDarkMode ? "bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/30" : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                            title="Görseli kırpma ve 90° döndürme arayüzünde aç"
                          >
                            <Scan className="w-2.5 h-2.5" /> Kırp & Çevir
                          </button>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>Genişlik:</span>
                            <input
                              type="number"
                              min="0.1"
                              step="0.01"
                              value={prof.widthCm}
                              onChange={(e) => handleProfileWidthChange(prof.id, parseFloat(e.target.value))}
                              className={`w-16 border px-1.5 py-0.5 rounded text-xs font-mono font-bold focus:outline-none ${
                                isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                              }`}
                            />
                            <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>cm</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>Fiyat:</span>
                            <div className="relative w-24">
                              <input
                                type="number"
                                min="0"
                                value={prof.unitPricePerMeter}
                                onChange={(e) => handleProfilePriceChange(prof.id, parseFloat(e.target.value))}
                                className={`w-full border px-1.5 py-0.5 rounded text-xs font-mono font-bold focus:outline-none ${
                                  isDarkMode ? "bg-[#121415] border-neutral-700 text-[#C5A059] focus:border-[#C5A059]" : "bg-white border-slate-300 text-[#B88E3A] focus:border-[#B88E3A]"
                                }`}
                              />
                              <span className={`absolute right-1.5 top-0.5 text-[10px] font-mono ${isDarkMode ? "text-neutral-500" : "text-slate-400"}`}>₺</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteProfile(prof.id)}
                        className={`p-1.5 rounded transition-colors shrink-0 ${
                          isDarkMode ? "text-neutral-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title="Profili Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: EKRAN GÖRÜNÜM & GİZLİLİK MODU */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              {/* Header Overview Card */}
              <div className={`border rounded-xl p-5 ${
                isDarkMode ? "bg-[#181a1e] border-[#C5A059]/30" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isShopMode
                        ? (isDarkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-800 border border-amber-200")
                        : (isDarkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-800 border border-blue-200")
                    }`}>
                      {isShopMode ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold tracking-wide uppercase ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                          Ekran Görünüm & Gizlilik Yönetimi
                        </h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md border ${
                          isShopMode
                            ? (isDarkMode ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-amber-100 border-amber-300 text-amber-800")
                            : (isDarkMode ? "bg-blue-500/15 border-blue-500/40 text-blue-300" : "bg-blue-100 border-blue-200 text-blue-800")
                        }`}>
                          {isShopMode ? "ATÖLYE MODU ETKİN" : "MÜŞTERİ MODU ETKİN"}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                        Müşteri önünde yapılacak teklif sunumlarında hammadde maliyetlerini gizleyebilir veya imalat aşamasında atölye modunu PIN ile açarak tüm girdi maliyetlerini detaylı görebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Mode Card 1: Müşteri Modu */}
                <div className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  !isShopMode
                    ? (isDarkMode ? "bg-blue-950/20 border-blue-500/50 ring-1 ring-blue-500/30" : "bg-blue-50/70 border-blue-300 ring-1 ring-blue-300")
                    : (isDarkMode ? "bg-[#181a1d] border-neutral-800 opacity-80 hover:opacity-100" : "bg-slate-50 border-slate-200 opacity-85 hover:opacity-100")
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${
                          !isShopMode
                            ? (isDarkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700")
                            : (isDarkMode ? "bg-neutral-800 text-neutral-400" : "bg-slate-200 text-slate-600")
                        }`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            MÜŞTERİ MODU
                          </h4>
                          <span className="text-[10px] text-blue-400 font-mono">Gizlilik Korumalı Sunum</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                        !isShopMode
                          ? (isDarkMode ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "bg-blue-100 text-blue-800 border border-blue-200")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-500" : "bg-slate-200 text-slate-600")
                      }`}>
                        {!isShopMode ? "Şu Anda Aktif" : "Pasif"}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                      Müşteriye fiyat teklifi & hesaplama dökümü gösterilirken hammadde birim alış maliyetleri, kesim firesi yüzdesi, atölye el işçiliği ve net kâr marjı gizlenir. Dökümde yalnızca KDV dahil net satış fiyatı yer alır.
                    </p>

                    <div className={`p-3 rounded-lg text-xs space-y-1.5 font-mono ${
                      isDarkMode ? "bg-black/30 border border-neutral-800" : "bg-white/80 border border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Hammadde Alış Fiyatları:</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> Gizli</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Fire ve Net Kâr Oranı:</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> Gizli</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Nihai Satış Fiyatı:</span>
                        <span className={isDarkMode ? "text-blue-400 font-bold" : "text-blue-600 font-bold"}>Görünür</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-700/30">
                    {!isShopMode ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Check className="w-4 h-4" /> BU MOD ŞU ANDA ETKİN
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleShopMode(false);
                          setShowPinPrompt(false);
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer shadow-sm ${
                          isDarkMode
                            ? "bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300"
                        }`}
                      >
                        <Lock className="w-4 h-4 text-blue-400" />
                        MÜŞTERİ MODUNA GEÇ (KİLİTLE)
                      </button>
                    )}
                  </div>
                </div>

                {/* Mode Card 2: Atölye Modu */}
                <div className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isShopMode
                    ? (isDarkMode ? "bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30" : "bg-amber-50/70 border-amber-300 ring-1 ring-amber-300")
                    : (isDarkMode ? "bg-[#181a1d] border-neutral-800 opacity-80 hover:opacity-100" : "bg-slate-50 border-slate-200 opacity-85 hover:opacity-100")
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${
                          isShopMode
                            ? (isDarkMode ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700")
                            : (isDarkMode ? "bg-neutral-800 text-neutral-400" : "bg-slate-200 text-slate-600")
                        }`}>
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            ATÖLYE & İMALAT MODU
                          </h4>
                          <span className="text-[10px] text-amber-400 font-mono">Tam Maliyet & İmalat Detayları</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                        isShopMode
                          ? (isDarkMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-amber-100 text-amber-800 border border-amber-200")
                          : (isDarkMode ? "bg-neutral-800 text-neutral-500" : "bg-slate-200 text-slate-600")
                      }`}>
                        {isShopMode ? "Şu Anda Aktif" : "PIN Korumalı"}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                      Fiyat teklifi & hesaplama dökümünde hammadde alış birim fiyatları, kesim atık oranları (%10-%25), sabit el işçiliği ve hedeflenen net kâr marjı detayları açık olarak gösterilir.
                    </p>

                    <div className={`p-3 rounded-lg text-xs space-y-1.5 font-mono ${
                      isDarkMode ? "bg-black/30 border border-neutral-800" : "bg-white/80 border border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Hammadde Alış Fiyatları:</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Görünür (₺/m², ₺/m)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Fire ve Net Kâr Oranı:</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Görünür (%)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>Nihai Satış Fiyatı:</span>
                        <span className="text-amber-400 font-bold">Görünür</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-700/30">
                    {isShopMode ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <Check className="w-4 h-4" /> BU MOD ŞU ANDA ETKİN
                      </div>
                    ) : !showPinPrompt ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPinPrompt(true);
                          setPinError(null);
                          setPinInput("");
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer shadow-sm ${
                          isDarkMode
                            ? "bg-[#C5A059] hover:bg-[#b5924d] text-black"
                            : "bg-[#B88E3A] hover:bg-[#a67e2f] text-white"
                        }`}
                      >
                        <Unlock className="w-4 h-4" />
                        ATÖLYE MODUNA GEÇ (PIN)
                      </button>
                    ) : (
                      <form onSubmit={handleConfirmPin} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            maxLength={6}
                            placeholder="PIN Kodu"
                            autoFocus
                            value={pinInput}
                            onChange={(e) => {
                              setPinInput(e.target.value);
                              if (pinError) setPinError(null);
                            }}
                            className={`w-full px-3 py-2 text-center font-mono font-bold text-sm tracking-widest rounded border focus:outline-none ${
                              pinError
                                ? "border-red-500 bg-red-950/20 text-red-300"
                                : (isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]")
                            }`}
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded transition-all cursor-pointer shadow-sm whitespace-nowrap"
                          >
                            Aç
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPinPrompt(false);
                              setPinError(null);
                              setPinInput("");
                            }}
                            className={`px-3 py-2 text-xs font-mono rounded transition-colors cursor-pointer border ${
                              isDarkMode ? "border-neutral-700 text-neutral-400 hover:text-white" : "border-slate-300 text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            İptal
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          {pinError ? (
                            <span className="text-red-400 font-bold">{pinError}</span>
                          ) : (
                            <span className={isDarkMode ? "text-neutral-500" : "text-slate-400"}>
                              Varsayılan PIN: <strong className="text-amber-400">1234</strong>
                            </span>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {pinSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{pinSuccessMsg}</span>
                </div>
              )}

              {/* Visibility Matrix Table */}
              <div className={`border rounded-xl p-5 space-y-3 ${
                isDarkMode ? "bg-[#181a1e] border-neutral-800" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isDarkMode ? "text-neutral-300" : "text-slate-700"
                }`}>
                  <Shield className="w-4 h-4 text-[#C5A059]" /> Modlara Göre Bilgi Görünürlük Matrisi
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`border-b text-[11px] font-mono ${
                        isDarkMode ? "border-neutral-800 text-neutral-400" : "border-slate-200 text-slate-500"
                      }`}>
                        <th className="text-left py-2 px-3 font-semibold">BİLGİ / HESAPLAMA KALEMİ</th>
                        <th className="text-center py-2 px-3 font-semibold text-blue-400">MÜŞTERİ MODU</th>
                        <th className="text-center py-2 px-3 font-semibold text-amber-400">ATÖLYE MODU</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDarkMode ? "divide-neutral-800 text-neutral-300" : "divide-slate-200 text-slate-700"
                    }`}>
                      <tr>
                        <td className="py-2.5 px-3">Eser, Çerçeve & Paspartu Ölçüleri</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">Seçili Malzeme & Hizmet İsimleri</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">Hammadde Birim Alış Fiyatları (₺/m², ₺/m)</td>
                        <td className="py-2.5 px-3 text-center text-rose-400 font-bold">✕ Gizli</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">Kesim Atık / Zayiat Oranları (%10-%25)</td>
                        <td className="py-2.5 px-3 text-center text-rose-400 font-bold">✕ Gizli</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">Sabit El İşçiliği Ham Maliyet Tutarı</td>
                        <td className="py-2.5 px-3 text-center text-rose-400 font-bold">✕ Gizli</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">Kâr Marjı Yüzdesi ve Net Kâr Tutarı</td>
                        <td className="py-2.5 px-3 text-center text-rose-400 font-bold">✕ Gizli</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold">Nihai Satış Fiyatı & KDV Tutarı</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Görünür</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 04. WHITE-LABEL KURUMSAL BİLGİLER */}
          {activeTab === "whitelabel" && (
            <div className="space-y-6">
              <div className={`border rounded-xl p-5 space-y-5 ${
                isDarkMode ? "bg-[#181b20] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-neutral-700/40">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-[#B88E3A]/20 text-[#B88E3A]"}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        FİRMA PROFİLİ &amp; WHITE-LABEL ÖZELLEŞTİRME
                      </h3>
                      <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                        PDF teklif dökümlerinde ve sipariş formlarında basılacak kendi şirket logonuz ve bilgileriniz
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={localCompany.includeInQuotes}
                      onChange={(e) => handleCompanyChange("includeInQuotes", e.target.checked)}
                      className="rounded accent-[#C5A059] w-4 h-4 cursor-pointer"
                    />
                    <span className={isDarkMode ? "text-neutral-300" : "text-slate-700"}>
                      Tekliflerde Göster
                    </span>
                  </label>
                </div>

                {/* Logo & Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Logo Upload Box (4 cols) */}
                  <div className={`md:col-span-4 flex flex-col items-center text-center p-4 border rounded-xl transition-all ${
                    canUploadLogo 
                      ? "bg-black/20 border-dashed border-neutral-700" 
                      : (isDarkMode ? "bg-amber-950/10 border-amber-500/30" : "bg-amber-50/60 border-amber-400/40")
                  }`}>
                    {canUploadLogo ? (
                      <>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                            FİRMA LOGOSU
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            PRO AKTİF
                          </span>
                        </div>

                        <div className="w-36 h-36 rounded-xl border flex items-center justify-center overflow-hidden mb-3 bg-neutral-900/60 border-neutral-700 relative group">
                          {localCompany.logoUrl ? (
                            <img 
                              src={localCompany.logoUrl} 
                              alt="Firma Logosu" 
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-neutral-500">
                              <Building2 className="w-10 h-10 mb-1 opacity-40" />
                              <span className="text-[11px]">Logo Yüklenmedi</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center w-full">
                          <label className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            isDarkMode ? "bg-[#C5A059] text-black hover:bg-[#b08c48]" : "bg-[#B88E3A] text-white hover:bg-[#9E7728]"
                          }`}>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{localCompany.logoUrl ? "Logoyu Değiştir" : "Logo Yükle (PNG/JPG)"}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleCompanyLogoUpload}
                              className="hidden" 
                            />
                          </label>
                          {localCompany.logoUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveCompanyLogo}
                              className="px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                            >
                              Kaldır
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-2">
                          Şeffaf PNG veya kare/yatay logo önerilir (Maks 2MB)
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mb-2 text-amber-400">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            FİRMA LOGOSU
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                            PRO ÖZELLİK
                          </span>
                        </div>

                        <div className="w-36 h-36 rounded-xl border flex flex-col items-center justify-center overflow-hidden mb-3 bg-black/40 border-amber-500/30 p-3 text-center">
                          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 mb-2 border border-amber-500/30">
                            <Lock className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-amber-300">KONTÖRLÜ HESAP</span>
                          <span className="text-[9px] text-neutral-400 mt-1 leading-tight">
                            Logo yükleme özelliği kilitlidir
                          </span>
                        </div>

                        <div className="w-full space-y-2.5">
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/90 text-center leading-relaxed">
                            Kredili / kontörlü üyelikte logo yükleme özelliği bulunmamaktadır. Teklif ve dökümlere logonuzu eklemek için <strong>Pro Abonelik</strong> (aylık/yıllık) gereklidir.
                          </div>

                          {onOpenSubscriptionModal && (
                            <button
                              type="button"
                              onClick={onOpenSubscriptionModal}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#C5A059] text-black hover:bg-[#b08c48] cursor-pointer transition-all shadow-sm shadow-[#C5A059]/20"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Pro Pakete Yükselt</span>
                            </button>
                          )}

                          {localCompany.logoUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveCompanyLogo}
                              className="text-[10px] text-neutral-400 hover:text-rose-400 underline transition-colors cursor-pointer"
                            >
                              Eski Kayıtlı Logoyu Temizle
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Company Fields (8 cols) */}
                  <div className="md:col-span-8 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Firma Adı */}
                      <div>
                        <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Firma / Atölye Adı (PDF Başlığı) *
                        </label>
                        <input
                          type="text"
                          value={localCompany.companyName}
                          onChange={(e) => handleCompanyChange("companyName", e.target.value)}
                          placeholder="Örn: Ahmet Çerçeve & Sanat"
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                          }`}
                        />
                      </div>

                      {/* Ticari Ünvan */}
                      <div>
                        <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Resmi Ticari Ünvan
                        </label>
                        <input
                          type="text"
                          value={localCompany.tradeTitle}
                          onChange={(e) => handleCompanyChange("tradeTitle", e.target.value)}
                          placeholder="Örn: Ahmet Çerçeve Sanat Tic. Ltd. Şti."
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Telefon */}
                      <div>
                        <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Telefon (PDF İletişim Bilgisi) *
                        </label>
                        <input
                          type="text"
                          value={localCompany.phone}
                          onChange={(e) => handleCompanyChange("phone", e.target.value)}
                          placeholder="Örn: 0212 555 01 23 / 0532 ..."
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                          }`}
                        />
                      </div>

                      {/* E-posta */}
                      <div>
                        <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Kurumsal E-posta
                        </label>
                        <input
                          type="email"
                          value={localCompany.email}
                          onChange={(e) => handleCompanyChange("email", e.target.value)}
                          placeholder="info@ahmetcerceve.com"
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Açık Adres */}
                    <div>
                      <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Atölye / Mağaza Adresi (PDF Alt Bilgisi) *
                      </label>
                      <textarea
                        rows={2}
                        value={localCompany.address}
                        onChange={(e) => handleCompanyChange("address", e.target.value)}
                        placeholder="Örn: Sanatkarlar Cad. No:14 Kadıköy / İstanbul"
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none resize-none ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Vergi Dairesi & No */}
                      <div>
                        <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Vergi Dairesi &amp; No
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={localCompany.taxOffice}
                            onChange={(e) => handleCompanyChange("taxOffice", e.target.value)}
                            placeholder="Kadıköy V.D."
                            className={`w-1/2 border rounded-lg px-3 py-2 focus:outline-none ${
                              isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                            }`}
                          />
                          <input
                            type="text"
                            value={localCompany.taxNumber}
                            onChange={(e) => handleCompanyChange("taxNumber", e.target.value)}
                            placeholder="1234567890"
                            className={`w-1/2 border rounded-lg px-3 py-2 focus:outline-none font-mono ${
                              isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                            }`}
                          />
                        </div>
                      </div>

                      {/* IBAN */}
                      <div>
                        <label className={`block font-bold mb-1 ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                          Ödeme / Banka IBAN
                        </label>
                        <input
                          type="text"
                          value={localCompany.iban}
                          onChange={(e) => handleCompanyChange("iban", e.target.value)}
                          placeholder="TR00 0000 0000 0000 0000 0000 00"
                          className={`w-full border rounded-lg px-3 py-2 focus:outline-none font-mono ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CANLI PDF & ANTETLİ KAĞIT ÖNİZLEMESİ */}
                <div className="mt-4 pt-4 border-t border-neutral-700/30">
                  <span className="block text-[11px] font-mono uppercase font-bold tracking-wider mb-2 text-[#C5A059]">
                    CANLI KURUMSAL PDF &amp; SİPARİŞ ANTETİ ÖNİZLEMESİ
                  </span>

                  <div className="p-4 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {localCompany.logoUrl ? (
                        <img 
                          src={localCompany.logoUrl} 
                          alt="Firma Logosu" 
                          className="w-12 h-12 object-contain border border-slate-200 rounded p-1 bg-slate-50"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded border border-slate-300 flex items-center justify-center text-slate-400">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                          {localCompany.companyName || "AHMET ÇERÇEVE & SANAT ATÖLYESİ"}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {localCompany.tradeTitle || "Ahmet Çerçeve Ltd. Şti."}
                        </p>
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                          Tel: {localCompany.phone || "0212 555 01 23"} • {localCompany.email || "info@firma.com"}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto text-[10px] text-slate-500 font-mono">
                      <div>Adres: {localCompany.address ? localCompany.address.slice(0, 45) + "..." : "Atölye Adresi"}</div>
                      <div className="text-emerald-600 font-bold mt-0.5">✓ PDF Çıktısında Bu Başlık Basılacaktır</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between px-6 py-4 border-t shrink-0 ${
          isDarkMode ? "bg-[#1a1d1f] border-[#C5A059]/30" : "bg-slate-50 border-slate-200"
        }`}>
          <button
            onClick={onResetToDefaults}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
              isDarkMode ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Varsayılana Sıfırla
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-mono rounded transition-colors cursor-pointer ${
                isDarkMode ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              İptal
            </button>

            <button
              onClick={handleSaveAll}
              className={`flex items-center gap-2 px-5 py-2 font-mono font-bold text-xs rounded transition-all shadow-md cursor-pointer ${
                savedSuccess
                  ? "bg-green-600 text-white"
                  : (isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white")
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> KAYDEDİLDİ!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> DEĞİŞİKLİKLERİ KAYDET
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Frame Profile Image Straightening & Cropping Modal */}
      {isCropModalOpen && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          onClose={() => setIsCropModalOpen(false)}
          imageUrl={cropSourceImage}
          onCropSave={handleCropSave}
          isDarkMode={isDarkMode}
          title={cropModalTitle}
          subtitle="Telefon kamerasıyla çekilen çerçeve çıtasını 90° döndürebilir ve köşe noktalarını şerit boyunca hizalayabilirsiniz"
          saveButtonText="Kırp ve Profile Aktar"
          hideDimensions={true}
          dimensionLabel={cropDimensionLabel}
          instructionBannerText="Çıtayı yatay şerit halinde seçmek için 'Yatay Şerit (Çıta)' butonuna basabilir veya köşe noktalarını sürükleyebilirsiniz"
          zIndexClass="z-[70]"
        />
      )}
    </div>
  );
}
