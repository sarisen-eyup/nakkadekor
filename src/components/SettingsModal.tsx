import React, { useState, useEffect } from "react";
import { 
  X, Settings, Database, Plus, Trash2, Check, RefreshCw, DollarSign, 
  Tag, Image as ImageIcon, Lock, Unlock, KeyRound, ShieldCheck, 
  Eye, EyeOff, Upload, AlertCircle, Users, Shield, Building2, Phone, Mail, MapPin, Globe, CreditCard,
  Camera, Scan, Crop as CropIcon, Sparkles, TrendingUp, RotateCcw, CheckCircle2, Coins, LogOut, User,
  Truck, Percent
} from "lucide-react";
import { 
  UnitPricesSettings, 
  FrameProfileItem,
  CompanyProfile,
  DEFAULT_COMPANY_PROFILE,
  EMPTY_COMPANY_PROFILE,
  SubscriptionData,
  isProPlan,
  UserAccount,
  sanitizeUnitPricesSettings
} from "../types/pricing";
import { ImageCropModal } from "./ImageCropModal";
import { 
  createFrameProfileInSupabase,
  deleteFrameProfileFromSupabase,
  fetchCompanyProfileFromSupabase,
  saveCompanyProfileToSupabase,
  fetchTenantSettingsFromSupabase,
  saveTenantSettingsToSupabase
} from "../services/supabaseService";
import { isSupabaseConfigured } from "../lib/supabase";

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
  initialTab?: "prices" | "profiles" | "privacy";
  subscription?: SubscriptionData;
  onOpenSubscriptionModal?: () => void;
  activeUser?: UserAccount;
  onLogout?: () => void;
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
  onOpenSubscriptionModal,
  activeUser,
  onLogout
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"prices" | "profiles" | "privacy">(initialTab);
  
  // Update active tab when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Local edit states
  const [localSettings, setLocalSettings] = useState<UnitPricesSettings>(() => sanitizeUnitPricesSettings(settings));
  const [localProfiles, setLocalProfiles] = useState<FrameProfileItem[]>(profiles);
  const [localCompany, setLocalCompany] = useState<CompanyProfile>(companyProfile || EMPTY_COMPANY_PROFILE);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal açıldığında firma profilini ve atölye ayarlarını Supabase'den çek
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(sanitizeUnitPricesSettings(settings));
      setLocalProfiles(profiles);
      setSavedSuccess(false);
      setSaveStatusMsg(null);

      (async () => {
        try {
          const { data: remoteSettings } = await fetchTenantSettingsFromSupabase();
          if (remoteSettings) {
            setLocalSettings(sanitizeUnitPricesSettings(remoteSettings));
          }
        } catch (e) {
          console.warn("Tenant settings fetch exception:", e);
        }

        try {
          const { data, error } = await fetchCompanyProfileFromSupabase();
          if (error) {
            console.warn("Company profile fetch error:", error);
            setLocalCompany(companyProfile || EMPTY_COMPANY_PROFILE);
          } else if (data) {
            setLocalCompany(data);
          } else {
            setLocalCompany(EMPTY_COMPANY_PROFILE);
          }
        } catch (err) {
          console.warn("Company profile fetch exception:", err);
          setLocalCompany(companyProfile || EMPTY_COMPANY_PROFILE);
        }
      })();
    }
  }, [isOpen]);

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
  const [bulkPercent, setBulkPercent] = useState<number>(20);
  const [bulkUndoStack, setBulkUndoStack] = useState<FrameProfileItem[][]>([]);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const handleLoadSampleProfiles = () => {
    setLocalProfiles(SAMPLE_FRAME_PROFILES);
    onSaveProfiles(SAMPLE_FRAME_PROFILES);
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          for (const prof of SAMPLE_FRAME_PROFILES) {
            const { error } = await createFrameProfileInSupabase(prof);
            if (error) {
              console.warn("Supabase create sample profile error:", error);
            }
          }
        } catch (err) {
          console.warn("Supabase sample profiles error:", err);
        }
      })();
    }
    setBulkSuccessMsg("5 adet klasik çerçeve profili başarıyla yüklendi!");
    setTimeout(() => setBulkSuccessMsg(null), 3500);
  };

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

  const handleSettingChange = (field: keyof UnitPricesSettings, rawVal: number | string) => {
    const parsed = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal).replace(",", "."));
    const val = isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
    setLocalSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name || !newProfile.code) return;

    const created: FrameProfileItem = {
      id: "prof_" + Date.now(),
      name: newProfile.name,
      code: newProfile.code.toUpperCase(),
      imageUrl: newProfile.imageUrl || "",
      widthCm: newProfile.widthCm || 4.0,
      unitPricePerMeter: newProfile.unitPricePerMeter || 120,
      materialType: (newProfile.materialType as any) || "wood",
      category: (newProfile.category as any) || "both",
      isRepeatingPattern: newProfile.isRepeatingPattern ?? true
    };

    setLocalProfiles((prev) => [created, ...prev]);
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await createFrameProfileInSupabase(created);
          if (error) {
            console.warn("Supabase create profile error:", error);
          }
        } catch (err) {
          console.warn("Supabase create profile exception:", err);
        }
      })();
    }
    setNewProfile({
      name: "",
      code: "",
      imageUrl: "",
      widthCm: 5.0,
      unitPricePerMeter: 150,
      materialType: "wood",
      category: "both",
      isRepeatingPattern: true
    });
  };

  const handleDeleteProfile = (id: string) => {
    setLocalProfiles((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await deleteFrameProfileFromSupabase(id);
          if (error) {
            console.warn("Supabase delete profile error:", error);
          }
        } catch (err) {
          console.warn("Supabase delete profile exception:", err);
        }
      })();
    }
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

  // Toplu Zam Uygula (Tüm Profillere Doğrudan Uygulanır)
  const handleApplyBulkPrice = (customPct?: number) => {
    const pct = customPct !== undefined ? customPct : bulkPercent;

    if (isNaN(pct) || pct <= 0) return;

    // Geri alma için mevcut listeyi kaydet
    setBulkUndoStack((prev) => [localProfiles, ...prev.slice(0, 5)]);

    const updated = localProfiles.map((prof) => {
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

    setBulkSuccessMsg(`✓ ${updated.length} adet çerçeve profiline %${pct} zam uygulandı ve kaydedildi.`);
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

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveStatusMsg(null);

    // 1. Boş bırakılan alanları 0 (sıfır) olarak varsayılana eşitle ve NaN oluşmasını engelle
    const sanitizedSettings = sanitizeUnitPricesSettings(localSettings);
    setLocalSettings(sanitizedSettings);

    // 2. React state ve yerel depolamayı hemen güncelle
    onSaveSettings(sanitizedSettings);
    onSaveProfiles(localProfiles);
    if (onSaveCompanyProfile) {
      onSaveCompanyProfile(localCompany);
    }

    try {
      // 3. Supabase 'tenant_settings' tablosuna 'tenant_id' (auth.uid) ile upsert et
      const { error: settingsError } = await saveTenantSettingsToSupabase(sanitizedSettings);
      if (settingsError) {
        console.warn("Supabase atölye ayarları kaydetme uyarısı:", settingsError);
        setSaveStatusMsg({ 
          text: `Supabase Uyarısı: ${settingsError.message || "Ayarlar veritabanına yazılamadı"}`, 
          isError: true 
        });
      }

      // 4. Firma profilini de kaydet
      await saveCompanyProfileToSupabase(localCompany);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (err: any) {
      console.warn("Supabase kaydetme hatası:", err);
      setSaveStatusMsg({ 
        text: `Bağlantı hatası: ${err?.message || "Kayıt tamamlanamadı"}`, 
        isError: true 
      });
      // Yine de yerel olarak kaydedildiği için kullanıcıyı bloke etmeyelim
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
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
                Birim maliyetler, profil veritabanı ve ekran gizlilik modu
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

        {/* Navigation Tabs (Yüksek Kontrastlı, Görünürlüğü Artırılmış 3 Sütunlu Izgara) */}
        <div 
          className={`grid grid-cols-3 border-b shrink-0 select-none ${
          isDarkMode ? "bg-[#141619] border-neutral-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            onClick={() => setActiveTab("prices")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "prices"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/15 font-bold shadow-2xs" : "border-[#B88E3A] text-[#8C6B23] bg-white font-bold shadow-2xs")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 font-medium" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium")
            }`}
          >
            <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === "prices" ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]") : (isDarkMode ? "text-neutral-400" : "text-slate-500")}`} />
            <span className="truncate">1. Maliyet & Kâr</span>
          </button>

          <button
            onClick={() => setActiveTab("profiles")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "profiles"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/15 font-bold shadow-2xs" : "border-[#B88E3A] text-[#8C6B23] bg-white font-bold shadow-2xs")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 font-medium" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium")
            }`}
          >
            <Database className={`w-4 h-4 shrink-0 ${activeTab === "profiles" ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]") : (isDarkMode ? "text-neutral-400" : "text-slate-500")}`} />
            <span className="truncate">2. Profiller ({localProfiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "privacy"
                ? (isDarkMode ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/15 font-bold shadow-2xs" : "border-[#B88E3A] text-[#8C6B23] bg-white font-bold shadow-2xs")
                : (isDarkMode ? "border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 font-medium" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium")
            }`}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === "privacy" ? (isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]") : (isDarkMode ? "text-neutral-400" : "text-slate-500")}`} />
            <span className="truncate">3. Gizlilik Modu</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[500px] space-y-6">
          {activeTab === "prices" && (
            <div className="flex flex-col gap-5">
              
              {/* Grup 1: Hammadde & Alan/Metre Maliyetleri */}
              <div className={`border rounded-xl p-4.5 space-y-4 transition-all shadow-xs ${
                isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between border-b pb-2.5 dark:border-neutral-800 border-slate-200">
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                  }`}>
                    <Tag className="w-4 h-4" /> 1. Hammadde & Malzeme Birim Fiyatları
                  </h3>
                  <span className={`text-[11px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    (Alan m² / Metre Başına Alış)
                  </span>
                </div>

                {/* Alt Bölüm A: Baskı & Paspartu */}
                <div className="space-y-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? "text-neutral-300" : "text-slate-700"
                  }`}>
                    Baskı & Paspartu Grubu
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Kanvas / Tuval Baskı
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={localSettings.canvasPrintPricePerSqm}
                          onChange={(e) => handleSettingChange("canvasPrintPricePerSqm", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m²</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        İç Paspartu Kartonu
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={localSettings.matBoardPricePerSqm}
                          onChange={(e) => handleSettingChange("matBoardPricePerSqm", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m²</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Ara Paspartu (3D)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={localSettings.middleMatBoardPricePerSqm}
                          onChange={(e) => handleSettingChange("middleMatBoardPricePerSqm", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m²</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Şeffaf / Akrilik Paspartu
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={localSettings.transparentMatBoardPricePerSqm ?? 520}
                          onChange={(e) => handleSettingChange("transparentMatBoardPricePerSqm", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alt Bölüm B: Cam & Arkalık */}
                <div className="space-y-2 pt-2 border-t dark:border-neutral-800/80 border-slate-100">
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? "text-neutral-300" : "text-slate-700"
                  }`}>
                    Cam, Koruma & Arkalık Grubu
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Koruyucu Cam / Pleksi
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={localSettings.glassPricePerSqm}
                          onChange={(e) => handleSettingChange("glassPricePerSqm", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m²</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        3mm MDF Arka Kapama
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={localSettings.backingBoardPricePerSqm}
                          onChange={(e) => handleSettingChange("backingBoardPricePerSqm", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m²</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Arkalık Koruma Bezi
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={localSettings.backingClothPricePerSqm ?? localSettings.backingPaperPricePerSqm ?? 90}
                          onChange={(e) => handleSettingChange("backingClothPricePerSqm", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m²</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Kraft Bitiş Bandı & Sarf
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="2"
                          value={localSettings.kraftTapePricePerMeter ?? 20}
                          onChange={(e) => handleSettingChange("kraftTapePricePerMeter", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-14 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺/m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grup 2 & 3: İşçilik/Kargo ve Kâr/KDV Oranları */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Sol: Sabit Giderler & Kesim Firesi */}
                <div className={`border rounded-xl p-4.5 space-y-3.5 transition-all shadow-xs ${
                  isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-slate-200"
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
                    isDarkMode ? "text-neutral-200 border-neutral-800" : "text-slate-800 border-slate-200"
                  }`}>
                    <Truck className="w-4 h-4 text-[#B88E3A] dark:text-[#C5A059]" /> 2. İşçilik, Lojistik & Fire Oranı
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Atölye Sabit El İşçiliği
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="25"
                          value={localSettings.laborFixedCost}
                          onChange={(e) => handleSettingChange("laborFixedCost", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-10 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Kargo & Teslimat
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={localSettings.defaultShippingCost ?? 150}
                          onChange={(e) => handleSettingChange("defaultShippingCost", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-10 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>₺</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        Kesim Fire / Atık
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={localSettings.wastePercentage}
                          onChange={(e) => handleSettingChange("wastePercentage", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-10 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ: Hedef Kâr Marjı ve KDV */}
                <div className={`border rounded-xl p-4.5 space-y-3.5 transition-all shadow-xs ${
                  isDarkMode 
                    ? "bg-[#1d1f23] border-[#C5A059]/40" 
                    : "bg-amber-50/40 border-amber-200"
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
                    isDarkMode ? "text-[#C5A059] border-[#C5A059]/30" : "text-[#B88E3A] border-amber-200"
                  }`}>
                    <Percent className="w-4 h-4" /> 3. Hedef Kâr Marjı & Vergi
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className={`block font-bold mb-1 truncate ${isDarkMode ? "text-[#C5A059]" : "text-[#9E7728]"}`}>
                        Hedef Kâr Marjı (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={localSettings.targetProfitMarginPercent}
                          onChange={(e) => handleSettingChange("targetProfitMarginPercent", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-10 py-2 font-mono font-bold text-xs focus:outline-none transition-colors ${
                            isDarkMode 
                              ? "bg-[#121415] border-[#C5A059]/60 text-[#C5A059] focus:border-[#C5A059]" 
                              : "bg-white border-[#B88E3A]/60 text-[#9E7728] focus:border-[#B88E3A] shadow-xs"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-amber-100 text-amber-900"
                        }`}>%</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>
                        KDV Oranı (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={localSettings.vatRatePercent}
                          onChange={(e) => handleSettingChange("vatRatePercent", parseFloat(e.target.value))}
                          className={`w-full border rounded-lg pl-3 pr-10 py-2 font-mono text-xs focus:outline-none transition-colors ${
                            isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]"
                          }`}
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded pointer-events-none ${
                          isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                        }`}>%</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === "profiles" && (
            <div className="space-y-6">

              {/* Form: Add New Frame Profile (Derli Toplu & Modern) */}
              <form onSubmit={handleAddProfile} className={`border rounded-xl p-4.5 space-y-4 shadow-xs transition-all ${
                isDarkMode ? "bg-[#181a1d] border-neutral-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between border-b pb-2.5 dark:border-neutral-800 border-slate-200">
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
                  }`}>
                    <Plus className="w-4 h-4" /> Yeni Çerçeve Profili Ekle
                  </h3>
                  <span className={`text-[11px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>
                    Özel çıta ve doku tanımlama
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Profil Adı</label>
                    <input
                      type="text"
                      placeholder="Örn: Altın Oymalı Klasik"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-sans focus:outline-none transition-colors ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Profil Kodu</label>
                    <input
                      type="text"
                      placeholder="Örn: AK-101"
                      value={newProfile.code}
                      onChange={(e) => setNewProfile({ ...newProfile, code: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none transition-colors ${
                        isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Metre Tül Fiyatı</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        placeholder="150"
                        value={newProfile.unitPricePerMeter}
                        onChange={(e) => setNewProfile({ ...newProfile, unitPricePerMeter: parseFloat(e.target.value) })}
                        className={`w-full border rounded-lg pl-3 pr-12 py-2 text-xs font-mono focus:outline-none transition-colors ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                        }`}
                        required
                      />
                      <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                        isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                      }`}>₺/m</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 truncate ${isDarkMode ? "text-neutral-300" : "text-slate-700"}`}>Çıta Genişliği</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.1"
                        step="0.01"
                        placeholder="5.00"
                        value={newProfile.widthCm}
                        onChange={(e) => setNewProfile({ ...newProfile, widthCm: parseFloat(e.target.value) })}
                        className={`w-full border rounded-lg pl-3 pr-10 py-2 text-xs font-mono focus:outline-none transition-colors ${
                          isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                        }`}
                      />
                      <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold px-1 py-0.5 rounded pointer-events-none ${
                        isDarkMode ? "bg-neutral-800 text-neutral-300" : "bg-slate-200/80 text-slate-600"
                      }`}>cm</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newProfile.isRepeatingPattern ?? true}
                      onChange={(e) => setNewProfile({ ...newProfile, isRepeatingPattern: e.target.checked })}
                      className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer"
                    />
                    <span className={`text-xs font-medium ${isDarkMode ? "text-neutral-200" : "text-slate-700"}`}>
                      Tekrarlayan Desen (Pattern Olarak Uç Uca Döşensin)
                    </span>
                  </label>
                </div>

                {/* Profil Görseli, Mobil Kamera & Kırpma (Açık ve Koyu Mod Renk Paletine Tam Uyumlu) */}
                <div className={`w-full border rounded-xl p-3.5 space-y-3 transition-all ${
                  isDarkMode 
                    ? "bg-[#151718] border-neutral-800" 
                    : "bg-slate-50/90 border-slate-200 shadow-xs"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDarkMode ? "text-neutral-200" : "text-slate-800"
                    }`}>
                      <Camera className={`w-4 h-4 ${isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"}`} /> Profil Görseli, Mobil Kamera & Kırpma
                    </label>
                    {newProfile.imageUrl && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1 border ${
                        isDarkMode 
                          ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30" 
                          : "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                      }`}>
                        <Check className="w-3 h-3 text-[#B88E3A] dark:text-[#C5A059]" /> Doku Yüklü
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
                    {/* Visual Preview Box */}
                    <div className={`relative group shrink-0 w-28 h-20 sm:w-32 sm:h-20 rounded-lg border overflow-hidden flex items-center justify-center shadow-inner transition-colors ${
                      isDarkMode ? "border-neutral-700 bg-neutral-950" : "border-slate-300 bg-white"
                    }`}>
                      {newProfile.imageUrl ? (
                        <img
                          src={newProfile.imageUrl}
                          alt="Profil Doku Önizleme"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`flex flex-col items-center justify-center text-[10px] p-2 text-center ${
                          isDarkMode ? "text-neutral-500" : "text-slate-400"
                        }`}>
                          <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                          <span>Görsel Yok</span>
                        </div>
                      )}
                      {newProfile.imageUrl && (
                        <button
                          type="button"
                          onClick={handleOpenCropForNewProfile}
                          className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer p-1 text-center"
                          title="Kırpma ve 90° Döndürme Aracını Aç"
                        >
                          <CropIcon className="w-4 h-4 text-[#C5A059] mb-0.5 animate-pulse" />
                          <span className="text-[10px] font-bold text-[#C5A059]">Kırp & Çevir</span>
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Direct Camera Button */}
                      <label className={`cursor-pointer px-3.5 py-2 text-xs font-mono font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-xs ${
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
                      <label className={`cursor-pointer px-3.5 py-2 text-xs font-mono font-medium rounded-lg border flex items-center gap-1.5 transition-colors shadow-xs ${
                        isDarkMode 
                          ? "bg-[#222628] hover:bg-neutral-700 text-neutral-200 border-neutral-700 hover:border-neutral-500" 
                          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                      }`}>
                        <Upload className="w-3.5 h-3.5 text-[#B88E3A] dark:text-[#C5A059]" /> Galeriden Seç
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
                          className={`px-3.5 py-2 text-xs font-mono font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                            isDarkMode 
                              ? "bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#C5A059] border-[#C5A059]/50" 
                              : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                          }`}
                        >
                          <CropIcon className="w-3.5 h-3.5 text-[#B88E3A] dark:text-[#C5A059]" /> Kırp & 90° Çevir
                        </button>
                      )}
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
                </div>

                {localProfiles.length === 0 ? (
                  <div className={`border border-dashed rounded-xl p-8 text-center space-y-3 ${
                    isDarkMode ? "bg-[#141619] border-neutral-700 text-neutral-400" : "bg-white border-slate-300 text-slate-600"
                  }`}>
                    <Database className="w-10 h-10 mx-auto opacity-30 text-[#C5A059]" />
                    <div>
                      <h4 className="font-bold text-sm text-neutral-200">Kayıtlı Profil Bulunmuyor</h4>
                      <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                        Veritabanınızda henüz çerçeve profili bulunmamaktadır. Yukarıdaki formu kullanarak kendi çıtalarınızı ekleyebilir veya tek tıkla 5 adet hazır klasik çerçeve profilini yükleyebilirsiniz.
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleLoadSampleProfiles}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#b5924b] text-black font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" /> Örnek 5 Klasik Profili Yükle
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {localProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      className={`flex items-start sm:items-center gap-4 border p-4 rounded-2xl transition-all shadow-2xs ${
                        isDarkMode 
                          ? "bg-[#181a1d] border-neutral-800 hover:border-[#C5A059]/40" 
                          : "bg-white border-slate-200 hover:border-amber-300 shadow-xs"
                      }`}
                    >
                      {/* Büyütülmüş Doku Küçük Resmi & Kırpma Overlay */}
                      <div className="relative group shrink-0 w-20 h-20 sm:w-22 sm:h-22 rounded-xl border overflow-hidden bg-black/50 shadow-inner dark:border-neutral-700 border-slate-200">
                        <img
                          src={prof.imageUrl}
                          alt={prof.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenCropForExistingProfile(prof)}
                          className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer p-1"
                          title="Görseli Kırp ve Döndür"
                        >
                          <CropIcon className="w-5 h-5 text-[#C5A059] mb-1 animate-pulse" />
                          <span className="text-[10px] font-bold text-[#C5A059] tracking-wide">Kırp & Çevir</span>
                        </button>
                      </div>

                      {/* Bilgiler, Girişler & Alt Butonlar */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        {/* Üst Satır: Sadece Profil Adı ve Büyütülmüş Tekrarlayan/Sünek Butonu */}
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-bold text-sm sm:text-base truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {prof.name}
                          </h4>

                          {/* Büyütülmüş Desen Tipi Butonu */}
                          <button
                            type="button"
                            onClick={() => handleToggleRepeating(prof.id)}
                            className={`px-3 py-1 text-xs rounded-lg font-mono font-bold transition-all cursor-pointer border shadow-2xs hover:scale-102 active:scale-98 shrink-0 ${
                              prof.isRepeatingPattern ?? true
                                ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/25" : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100")
                                : (isDarkMode ? "bg-sky-500/15 text-sky-400 border-sky-500/35 hover:bg-sky-500/25" : "bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100")
                            }`}
                            title="Tıklayarak desen tekrarını değiştirin"
                          >
                            {prof.isRepeatingPattern ?? true ? "Tekrarlayan" : "Sünek"}
                          </button>
                        </div>

                        {/* Orta Satır: Genişlik ve Fiyat Girişleri */}
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          {/* Genişlik */}
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>Genişlik:</span>
                            <div className="relative">
                              <input
                                type="number"
                                min="0.1"
                                step="0.01"
                                value={prof.widthCm}
                                onChange={(e) => handleProfileWidthChange(prof.id, parseFloat(e.target.value))}
                                className={`w-18 border pl-2 pr-6 py-1 rounded-lg text-xs font-mono font-bold focus:outline-none transition-colors ${
                                  isDarkMode ? "bg-[#121415] border-neutral-700 text-white focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-[#B88E3A] focus:bg-white"
                                }`}
                              />
                              <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-mono pointer-events-none ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>cm</span>
                            </div>
                          </div>

                          {/* Metre Fiyatı */}
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-mono ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>Fiyat:</span>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={prof.unitPricePerMeter}
                                onChange={(e) => handleProfilePriceChange(prof.id, parseFloat(e.target.value))}
                                className={`w-22 border pl-2 pr-7 py-1 rounded-lg text-xs font-mono font-bold focus:outline-none transition-colors ${
                                  isDarkMode ? "bg-[#121415] border-neutral-700 text-[#C5A059] focus:border-[#C5A059]" : "bg-slate-50 border-slate-300 text-[#B88E3A] focus:border-[#B88E3A] focus:bg-white"
                                }`}
                              />
                              <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold pointer-events-none ${isDarkMode ? "text-[#C5A059]/70" : "text-amber-800/70"}`}>₺/m</span>
                            </div>
                          </div>
                        </div>

                        {/* Alt Satır: Girişlerin Altında Yan Yana Sıralanan 3 Buton (Kırp, Fotoğraf, Sil) */}
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          {/* 1. Kırp & Çevir */}
                          <button
                            type="button"
                            onClick={() => handleOpenCropForExistingProfile(prof)}
                            className={`h-7.5 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-mono font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                              isDarkMode 
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-[#C5A059] border border-amber-500/30 hover:border-[#C5A059]/60" 
                                : "bg-amber-50 hover:bg-amber-100 text-[#9E7728] border border-amber-200 hover:border-amber-300"
                            }`}
                            title="Görseli Kırp & 90° Döndür"
                          >
                            <CropIcon className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Kırp</span>
                          </button>

                          {/* 2. Yeni Fotoğraf Yükle / Kamera */}
                          <label 
                            className={`h-7.5 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-mono font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                              isDarkMode 
                                ? "bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:border-sky-400/60" 
                                : "bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 hover:border-sky-300"
                            }`}
                            title="Yeni Fotoğraf Çek / Görsel Değiştir"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Fotoğraf</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleProfileImageFileUpload(e, false, prof.id)}
                              className="hidden"
                            />
                          </label>

                          {/* 3. Sil */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(prof.id)}
                            className={`h-7.5 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-mono font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                              isDarkMode 
                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-400/60" 
                                : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300"
                            }`}
                            title="Profili Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* HIZLI TOPLU ZAM PANELİ (TEK SATIRDA DERLİ TOPLU) */}
              <div 
                id="bulk-price-section"
                className={`p-2.5 sm:p-3 rounded-xl border transition-all shadow-xs ${
                  isDarkMode 
                    ? "bg-[#16181b] border-[#C5A059]/35" 
                    : "bg-amber-50/80 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                  {/* Sol Bölüm: Başlık, Özel % Girişi ve Zam Yap Butonu */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isDarkMode ? "bg-[#C5A059]/15 text-[#C5A059]" : "bg-amber-100 text-amber-800"
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>

                    <span className={`text-xs font-bold whitespace-nowrap ${isDarkMode ? "text-neutral-200" : "text-slate-800"}`}>
                      Toplu Zam:
                    </span>

                    <div className="flex items-center gap-0.5">
                      <span className={`text-[11px] font-mono font-bold ${isDarkMode ? "text-neutral-400" : "text-slate-500"}`}>%</span>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={bulkPercent}
                        onChange={(e) => setBulkPercent(parseFloat(e.target.value) || 0)}
                        className={`w-11 px-1 py-1 text-xs font-mono font-bold text-center rounded-md border focus:outline-none ${
                          isDarkMode 
                            ? "bg-[#101214] border-neutral-700 text-[#C5A059] focus:border-[#C5A059]" 
                            : "bg-white border-slate-300 text-[#B88E3A] focus:border-[#B88E3A]"
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyBulkPrice()}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer hover:opacity-90 active:scale-95 whitespace-nowrap ${
                        isDarkMode 
                          ? "bg-[#C5A059] text-black font-extrabold" 
                          : "bg-[#B88E3A] text-white"
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Uygula</span>
                    </button>
                  </div>

                  <div className={`h-4 w-px mx-0.5 shrink-0 ${isDarkMode ? "bg-neutral-800" : "bg-amber-200"}`} />

                  {/* Orta Bölüm: Hızlı Zam Butonları 10, 20, 30, 40, 50 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {[10, 20, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setBulkPercent(pct);
                          handleApplyBulkPrice(pct);
                        }}
                        className={`px-2 py-1 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                          isDarkMode 
                            ? "bg-[#212429] hover:bg-[#C5A059] text-neutral-200 hover:text-black border-neutral-700 hover:border-[#C5A059]" 
                            : "bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border-slate-300 hover:border-amber-300 shadow-2xs"
                        }`}
                      >
                        +%{pct}
                      </button>
                    ))}
                  </div>

                  {/* Sağ Bölüm: Zammı Geri Al Butonu */}
                  <div className="flex items-center shrink-0">
                    {bulkUndoStack.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleUndoBulkPrice}
                        className={`px-2.5 py-1 rounded-md border text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
                          isDarkMode 
                            ? "bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-amber-500/40" 
                            : "bg-white hover:bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                        title="Son zammı geri al"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                        <span>Geri Al ({bulkUndoStack.length})</span>
                      </button>
                    ) : (
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        isDarkMode ? "text-neutral-500" : "text-slate-400"
                      }`}>
                        Geri alma yok
                      </span>
                    )}
                  </div>
                </div>

                {/* Bildirim Mesajı */}
                {bulkSuccessMsg && (
                  <div className="mt-1.5 text-xs font-medium text-emerald-500 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{bulkSuccessMsg}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: EKRAN GÖRÜNÜM & GİZLİLİK MODU (Sade ve Anlaşılır) */}
          {activeTab === "privacy" && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              
              {/* Ana Seçici: Müşteri Modu vs Atölye Modu */}
              <div className={`p-6 rounded-2xl border transition-all ${
                isDarkMode 
                  ? "bg-[#181a1d] border-neutral-800" 
                  : "bg-white border-[#e8dfcf] shadow-sm"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}>
                      Aktif Ekran Görünümü
                    </h3>
                    <p className={`text-xs mt-0.5 ${
                      isDarkMode ? "text-neutral-400" : "text-slate-500"
                    }`}>
                      Müşteri yanınızdayken maliyetleri gizleyebilir veya atölye hesaplarını açabilirsiniz.
                    </p>
                  </div>
                  
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    isShopMode
                      ? (isDarkMode ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-amber-100 text-amber-800 border-amber-300")
                      : (isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "bg-blue-100 text-blue-800 border-blue-300")
                  }`}>
                    {isShopMode ? "ATÖLYE MODU AÇIK" : "MÜŞTERİ MODU AKTİF"}
                  </span>
                </div>

                {/* İki Seçenek Butonu (Segmented Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {/* Müşteri Modu Butonu */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleShopMode(false);
                      setShowPinPrompt(false);
                      setPinError(null);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      !isShopMode
                        ? (isDarkMode ? "bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/30" : "bg-blue-50/90 border-blue-500 ring-2 ring-blue-200")
                        : (isDarkMode ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100" : "bg-slate-50 border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100")
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${
                          !isShopMode 
                            ? "bg-blue-500 text-white" 
                            : (isDarkMode ? "bg-neutral-800 text-neutral-400" : "bg-slate-200 text-slate-600")
                        }`}>
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            Müşteri Modu
                          </div>
                          <div className="text-[11px] text-blue-500 dark:text-blue-400 font-mono">
                            Maliyetler Gizli
                          </div>
                        </div>
                      </div>
                      {!isShopMode && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Alış fiyatları, fire ve kâr marjı gizlenir. Yalnızca net müşteri satış fiyatı gösterilir.
                    </p>
                  </button>

                  {/* Atölye Modu Butonu */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isShopMode) return;
                      setShowPinPrompt(true);
                      setPinError(null);
                      setPinInput("");
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isShopMode
                        ? (isDarkMode ? "bg-amber-950/30 border-[#C5A059] ring-2 ring-[#C5A059]/30" : "bg-amber-50/90 border-amber-500 ring-2 ring-amber-200")
                        : (isDarkMode ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100" : "bg-slate-50 border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100")
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${
                          isShopMode 
                            ? "bg-[#B88E3A] text-white" 
                            : (isDarkMode ? "bg-neutral-800 text-neutral-400" : "bg-slate-200 text-slate-600")
                        }`}>
                          <Unlock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            Atölye Modu
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                            PIN Korumalı
                          </div>
                        </div>
                      </div>
                      {isShopMode && (
                        <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-[#C5A059]" />
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Hammadde birim maliyetleri, kesim firesi, işçilik ve net kâr dökümü tam olarak açılır.
                    </p>
                  </button>
                </div>

                {/* PIN Giriş Alanı (Atölye moduna geçerken açılır) */}
                {showPinPrompt && !isShopMode && (
                  <div className={`mt-5 p-4 rounded-xl border animate-fade-in ${
                    isDarkMode ? "bg-[#121415] border-[#C5A059]/40" : "bg-amber-50/60 border-amber-300"
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <KeyRound className="w-4 h-4 text-[#C5A059]" />
                      <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        Atölye Modu için PIN Kodunu Girin:
                      </span>
                    </div>

                    <form onSubmit={handleConfirmPin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="PIN Girin"
                        autoFocus
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          if (pinError) setPinError(null);
                        }}
                        className={`px-4 py-2 text-center font-mono font-bold text-sm tracking-widest rounded-lg border focus:outline-none transition-colors ${
                          pinError
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : (isDarkMode ? "bg-black/40 border-neutral-700 text-white focus:border-[#C5A059]" : "bg-white border-slate-300 text-slate-900 focus:border-[#B88E3A]")
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#B88E3A] hover:bg-[#a0792a] text-white font-mono font-bold text-xs rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        Atölye Modunu Aç
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPinPrompt(false);
                          setPinError(null);
                          setPinInput("");
                        }}
                        className={`px-3 py-2 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                          isDarkMode ? "border-neutral-700 text-neutral-400 hover:text-white" : "border-slate-300 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Vazgeç
                      </button>
                    </form>

                    <div className="flex items-center justify-between text-[11px] font-mono mt-2">
                      {pinError ? (
                        <span className="text-red-400 font-bold">{pinError}</span>
                      ) : (
                        <span className={isDarkMode ? "text-neutral-400" : "text-slate-500"}>
                          Varsayılan PIN: <strong className="text-amber-500">1234</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Başarı Mesajı */}
                {pinSuccessMsg && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{pinSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Sade Karşılaştırma / Bilgilendirme Kartı */}
              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-[#181a1d]/60 border-neutral-800 text-neutral-300" : "bg-slate-50/80 border-slate-200 text-slate-700"
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${
                  isDarkMode ? "text-neutral-300" : "text-slate-800"
                }`}>
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>Kısaca Görünüm Kuralları</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Müşterinin Gördükleri:
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Seçilen çerçeve ve cam türü, net eser ölçüleri, kargo seçeneği ve KDV dahil nihai satış tutarı.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Lock className="w-3.5 h-3.5" /> Müşteriden Gizlenenler:
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-neutral-400" : "text-slate-600"}`}>
                      Hammadde alış birim fiyatları (₺/m, ₺/m²), atölye kesim firesi (%), net kâr marjı ve atölye ham maliyeti.
                    </p>
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
            {saveStatusMsg && (
              <span className={`text-[11px] font-mono px-2 py-1 rounded ${
                saveStatusMsg.isError 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                {saveStatusMsg.text}
              </span>
            )}

            <button
              onClick={onClose}
              disabled={isSaving}
              className={`px-4 py-2 text-xs font-mono rounded transition-colors cursor-pointer ${
                isDarkMode ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              İptal
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-2 font-mono font-bold text-xs rounded transition-all shadow-md cursor-pointer ${
                isSaving
                  ? "opacity-75 cursor-wait bg-[#C5A059] text-black"
                  : savedSuccess
                    ? "bg-green-600 text-white"
                    : (isDarkMode ? "bg-[#C5A059] hover:bg-[#b08c48] text-black" : "bg-[#B88E3A] hover:bg-[#9E7728] text-white")
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> KAYDEDİLİYOR...
                </>
              ) : savedSuccess ? (
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
