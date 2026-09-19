import React, { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  ExternalLink,
  Lock,
  Building2,
  Scale,
  Download
} from "lucide-react";

export type LegalDocType = "user_agreement" | "corporate_invoice" | "kvkk";

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
  isDarkMode?: boolean;
}

export function LegalTermsModal({
  isOpen,
  onClose,
  initialDoc = "user_agreement",
  isDarkMode = true
}: LegalTermsModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    if (isOpen && initialDoc) {
      setActiveTab(initialDoc);
    }
  }, [isOpen, initialDoc]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDarkMode 
            ? "bg-[#14171d] border-white/15 text-white shadow-black/80" 
            : "bg-white border-slate-200 text-slate-900 shadow-slate-400/40"
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center shrink-0 border border-[#C5A059]/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-[#C5A059]">
                  Nakka Decor Hukuk &amp; Mevzuat
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isDarkMode ? "bg-white/10 text-neutral-300" : "bg-slate-200 text-slate-700"
                }`}>
                  v2026-B2B
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase mt-0.5">
                {activeTab === "user_agreement" && "Kullanıcı Sözleşmesi & Hizmet Şartları"}
                {activeTab === "corporate_invoice" && "Kurumsal Fatura & Ticari Şartlar"}
                {activeTab === "kvkk" && "KVKK Aydınlatma Metni & Gizlilik Politikası"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              title="Sayfayı Yazdır"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDarkMode 
                  ? "bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10" 
                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer ${
                isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-200"
              }`}
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`px-4 sm:px-6 pt-2 border-b flex items-center gap-2 overflow-x-auto no-scrollbar ${
          isDarkMode ? "bg-[#0d0f13] border-white/10" : "bg-slate-100/70 border-slate-200"
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab("user_agreement")}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "user_agreement"
                ? isDarkMode 
                  ? "border-[#C5A059] text-[#FAE2B3]" 
                  : "border-[#B88E3A] text-[#8F6A1E]"
                : isDarkMode 
                  ? "border-transparent text-neutral-400 hover:text-neutral-200" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kullanıcı Sözleşmesi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("corporate_invoice")}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "corporate_invoice"
                ? isDarkMode 
                  ? "border-[#C5A059] text-[#FAE2B3]" 
                  : "border-[#B88E3A] text-[#8F6A1E]"
                : isDarkMode 
                  ? "border-transparent text-neutral-400 hover:text-neutral-200" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Kurumsal Fatura Şartları</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kvkk")}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "kvkk"
                ? isDarkMode 
                  ? "border-[#C5A059] text-[#FAE2B3]" 
                  : "border-[#B88E3A] text-[#8F6A1E]"
                : isDarkMode 
                  ? "border-transparent text-neutral-400 hover:text-neutral-200" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KVKK Aydınlatma Metni</span>
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: KULLANICI SÖZLEŞMESİ */}
          {activeTab === "user_agreement" && (
            <div className="space-y-5 animate-fade-in">
              <div className={`p-4 rounded-2xl border ${
                isDarkMode ? "bg-white/[0.02] border-white/10 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <p className="font-semibold text-xs leading-normal">
                  İşbu Kullanıcı ve Lisans Sözleşmesi (&ldquo;Sözleşme&rdquo;); <strong>Nakka Decor Sanat ve Çerçeve Teknolojileri</strong> (&ldquo;Nakka Decor&rdquo; veya &ldquo;Hizmet Sağlayıcı&rdquo;) ile sistemi kullanan, üyelik oluşturan veya simülatör üzerinden işlem gerçekleştiren B2B Çerçeve Atölyesi, tüzel veya gerçek kişi kullanıcı (&ldquo;Kullanıcı&rdquo; / &ldquo;Abone&rdquo;) arasında elektronik ortamda akdedilmiştir.
                </p>
              </div>

              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 1 &mdash; Sözleşmenin Amacı ve Konusu
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    İşbu sözleşmenin konusu; Nakka Decor tarafından sağlanan bulut tabanlı Sanatsal Çerçeve Simülatörü, gönye kesim optimizasyonu, dinamik paspartu hesaplayıcısı, fire payı formülasyonu, kurumsal PDF teklif ve üretim emri oluşturma yazılımının B2B atölye kullanım şartlarının, tarafların hak ve yükümlülüklerinin belirlenmesidir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 2 &mdash; Kullanım ve Lisanslama Şartları
                  </h3>
                  <ul className={`list-disc pl-5 space-y-1 ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    <li>Kullanıcıya, yazılımı kendi atölye operasyonlarında, teklif hazırlama ve müşteri sunumlarında kullanmak üzere münhasır olmayan, devredilemez bir B2B kullanım lisansı verilmektedir.</li>
                    <li>Sistem üzerinde üretilen teknik çizimler, kesim listeleri ve PDF teklif şablonları ticari amaçla müşterilere sunulabilir; ancak yazılımın kaynak kodları, görsel render algoritmaları veya altyapı bileşenleri kopyalanamaz, tersine mühendislikle çözülemez veya üçüncü şahıslara kiralanamaz.</li>
                    <li>Atölye, sisteme tanımladığı şifrelerin ve yetkili personel erişimlerinin gizliliğinden ve güvenliğinden bizzat sorumludur.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 3 &mdash; Maliyet Hesaplama ve Üretim Sorumluluğu
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Simülatör tarafından hesaplanan profil metreleri, paspartu alanları, cam ölçüleri, fire yüzdeleri ve işçilik maliyetleri; atölyenin sisteme girdiği birim fiyatlar ve katsayılar doğrultusunda matematiksel olarak türetilmektedir. Atölye, fiziksel kesim ve montaj öncesinde ölçülerin doğruluğunu kontrol etmekle yükümlüdür. Fiziksel atölye üretimindeki operatör hatalarından kaynaklı fire ve uyuşmazlıklardan Nakka Decor sorumlu tutulamaz.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 4 &mdash; Fikri ve Sınai Mülkiyet Hakları
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Nakka Decor markası, logosu, simülasyon arayüzü, 3D/2D çerçeve render modelleri, kod tabanı ve veri tabanı mimarisi 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 sayılı Sınai Mülkiyet Kanunu kapsamında koruma altındadır. İhlal halinde yasal ve cezai takip hakkı saklıdır.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 5 &mdash; Yetkili Mahkeme ve Yürürlük
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    İşbu Sözleşme&apos;den doğabilecek her türlü uyuşmazlığın çözümünde Türk Hukuku uygulanacak olup, İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. Kullanıcı, sisteme giriş yaparak veya onay kutusunu işaretleyerek işbu sözleşmenin tüm maddelerini gayrikabili rücu kabul etmiş sayılır.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: KURUMSAL FATURA ŞARTLARI */}
          {activeTab === "corporate_invoice" && (
            <div className="space-y-5 animate-fade-in">
              <div className={`p-4 rounded-2xl border ${
                isDarkMode ? "bg-white/[0.02] border-white/10 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <p className="font-semibold text-xs leading-normal">
                  Nakka Decor B2B yazılım lisansları, kredi paketleri ve atölye abonelikleri kapsamında düzenlenen mali fatura ve ticari işlemler, 213 sayılı Vergi Usul Kanunu (VUK) ve 6102 sayılı Türk Ticaret Kanunu (TTK) hükümlerine tabidir.
                </p>
              </div>

              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 1 &mdash; e-Fatura / e-Arşiv Fatura Düzenleme Esasları
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Atölye tarafından sistem profilinde beyan edilen resmi ticari ünvan, vergi dairesi ve vergi numarası / TCKN esas alınarak, satın alınan hizmet bedeli karşılığında yasal süresi içerisinde Gelir İdaresi Başkanlığı (GİB) standartlarına uygun <strong>e-Fatura</strong> veya <strong>e-Arşiv Fatura</strong> tanzim edilir. Düzenlenen fatura atölyenin kayıtlı e-posta adresine ve GİB portalına iletilir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 2 &mdash; Vergi Bilgilerinin Doğruluğu ve Mükellefiyet
                  </h3>
                  <ul className={`list-disc pl-5 space-y-1 ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    <li>Atölye, sisteme girdiği vergi kimlik numarası (VKN) veya şahıs işletmesi ise T.C. Kimlik Numarasının (TCKN) doğruluğunu ve faal vergi mükellefi olduğunu taahhüt eder.</li>
                    <li>Hatalı veya eksik vergi bilgisi bildiriminden doğabilecek vergi cezası, KDV uyuşmazlığı veya gecikmelerden atölye münhasıran sorumludur.</li>
                    <li>Ticari ünvan veya vergi bilgilerinde değişiklik olması halinde, atölye &ldquo;Hesap &amp; Atölye Profili&rdquo; ekranından bu bilgileri ivedilikle güncellemekle yükümlüdür.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 3 &mdash; KDV Oranı ve Fiyatlandırma
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Yazılım lisans bedelleri, kredi paketleri ve sunulan ek dijital hizmetler; aksi açıkça belirtilmedikçe yürürlükteki KDV oranına (%20) tabidir. Fatura üzerinde KDV matrahı ve hesaplanan vergi tutarları kanuna uygun biçimde ayrı satırlar halinde gösterilir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 4 &mdash; Dijital Ürünlerde Cayma Hakkı İstisnası
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesinin (ğ) bendi uyarınca; <em>&ldquo;Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz.&rdquo;</em> Lisans anahtarı veya kullanım hakkı aktif edilen, hesap kredisi tanımlanan veya kullanılan dijital hizmetlerin iptali ve iadesi mümkün değildir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 5 &mdash; Cari Hesap ve Dönemsel Mutabakat
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Kurumsal faturalar üzerinden yapılan işlemler, atölyenin cari hesabına yansıtılır. Yıl sonu ve geçici vergi dönemlerinde karşılıklı e-posta mutabakatı esastır.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: KVKK AYDINLATMA METNİ */}
          {activeTab === "kvkk" && (
            <div className="space-y-5 animate-fade-in">
              <div className={`p-4 rounded-2xl border ${
                isDarkMode ? "bg-white/[0.02] border-white/10 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <p className="font-semibold text-xs leading-normal">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, Veri Sorumlusu sıfatıyla <strong>Nakka Decor</strong> olarak; atölye yetkilileri, çalışanları ve sisteme veri giren kullanıcılarımızın kişisel verilerini aşağıda açıklanan çerçevede işlemekteyiz.
                </p>
              </div>

              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    1. Veri Sorumlusu Sıfatı
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Kişisel verileriniz, 6698 sayılı KVKK kapsamında veri sorumlusu sıfatıyla Nakka Decor Sanat ve Çerçeve Teknolojileri tarafından işlenmektedir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    2. İşlenen Kişisel ve Kurumsal Veri Kategorileri
                  </h3>
                  <ul className={`list-disc pl-5 space-y-1 ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    <li><strong>Kimlik Bilgileri:</strong> Yetkili Adı Soyadı, TCKN (şahıs işletmeleri için).</li>
                    <li><strong>İletişim Bilgileri:</strong> Kurumsal E-posta adresi, telefon numarası, atölye/fatura açık adresi, şehir.</li>
                    <li><strong>Müşteri ve İşlem Verisi:</strong> Oluşturulan çerçeve teklifleri, sipariş numaraları, kesim ölçüleri ve maliyet girdileri.</li>
                    <li><strong>İşlem Güvenliği ve Sistem Verisi:</strong> IP adresi, oturum açma tarih/saat logları, kullanıcı adı ve şifrelenmiş parola özetleri.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Verileriniz; KVKK Madde 5/2-c (Sözleşmenin kurulması ve ifası için zorunlu olması), Madde 5/2-ç (Hukuki yükümlülüklerin yerine getirilmesi, faturalandırma ve vergi mevzuatı) ve Madde 5/2-f (Meşru menfaatler ve bilgi güvenliğinin sağlanması) hukuki sebeplerine dayalı olarak; atölye hesabı oluşturulması, simülatör hizmetinin kesintisiz sunulması, kurumsal teklif ve kesim raporlarının saklanması amacıyla işlenir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    4. Verilerin Aktarıldığı Taraflar ve Güvenlik Önlemleri
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Kişisel verileriniz hiçbir surette reklam veya üçüncü taraf ticari pazarlama amacıyla paylaşılmaz veya satılmaz. Yalnızca yasal zorunluluklar halinde yetkili adli/mali merciler, Gelir İdaresi Başkanlığı ve güvenli bulut barındırma hizmet sağlayıcılarımız ile (şifreli SSL ve güvenli veritabanı protokolleriyle) paylaşılmaktadır.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    5. KVKK Madde 11 Uyarınca Haklarınız
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Kanun uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, amaca uygun kullanılıp kullanılmadığını öğrenme, eksik/yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz. Taleplerinizi <strong className="text-[#C5A059]">kvkk@nakkadecor.com</strong> adresine veya sistem iletişim kanallarımıza iletebilirsiniz.
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>256-Bit SSL Şifreli Güvenli B2B Altyapısı</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer shadow-md ${
              isDarkMode
                ? "bg-gradient-to-r from-[#FAE2B3] via-[#E5C17B] to-[#C5A059] text-black hover:opacity-95 shadow-[#C5A059]/20 font-black"
                : "bg-gradient-to-r from-[#B88E3A] to-[#8F6A1E] text-white hover:opacity-95 shadow-amber-900/20 font-black"
            }`}
          >
            Anladım / Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reusable legal terms checkbox component with interactive links */
interface LegalTermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpenDoc: (doc: LegalDocType) => void;
  isDarkMode?: boolean;
  className?: string;
}

export function LegalTermsCheckbox({
  checked,
  onChange,
  onOpenDoc,
  isDarkMode = true,
  className = ""
}: LegalTermsCheckboxProps) {
  return (
    <div className={`flex items-start gap-2.5 select-none ${className}`}>
      <input
        type="checkbox"
        id="legalTermsCheckbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded accent-[#C5A059] cursor-pointer shrink-0"
      />
      <label 
        htmlFor="legalTermsCheckbox" 
        className={`text-[11px] sm:text-xs leading-relaxed cursor-pointer ${
          isDarkMode ? "text-neutral-300" : "text-slate-600"
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenDoc("user_agreement");
          }}
          className={`font-semibold underline underline-offset-2 hover:opacity-80 transition-colors cursor-pointer ${
            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
          }`}
        >
          Kullanıcı sözleşmesi
        </button>
        {", "}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenDoc("corporate_invoice");
          }}
          className={`font-semibold underline underline-offset-2 hover:opacity-80 transition-colors cursor-pointer ${
            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
          }`}
        >
          kurumsal fatura
        </button>
        {" ve "}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenDoc("kvkk");
          }}
          className={`font-semibold underline underline-offset-2 hover:opacity-80 transition-colors cursor-pointer ${
            isDarkMode ? "text-[#C5A059]" : "text-[#B88E3A]"
          }`}
        >
          KVKK şartlarını
        </button>
        {" okudum, onaylıyorum."}
      </label>
    </div>
  );
}
