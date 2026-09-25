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
    let docTitle = "Kullanıcı ve Lisans Sözleşmesi";
    let bodyContent = "";

    if (activeTab === "user_agreement") {
      docTitle = "Kullanıcı ve Lisans Sözleşmesi";
      bodyContent = `
        <div class="intro-box">
          <p><strong>İşbu Kullanıcı ve Lisans Sözleşmesi (“Sözleşme”);</strong> SARIŞEN REKLAM - AYŞEN SARIŞEN (“Hizmet Sağlayıcı”) ile sistemi kullanan, üyelik oluşturan veya simülatör üzerinden işlem gerçekleştiren B2B Çerçeve Atölyesi, tüzel veya gerçek kişi kullanıcı (“Kullanıcı” / “Abone”) arasında elektronik ortamda akdedilmiştir. Nakka Dekor B2B Sanat &amp; Çerçeve Atölye Portalı, bir SARIŞEN REKLAM ürünüdür.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 1 — Sözleşmenin Amacı ve Konusu</div>
          <p class="section-body">İşbu sözleşmenin konusu; Hizmet Sağlayıcı tarafından sunulan bulut tabanlı Nakka Dekor Sanatsal Çerçeve Simülatörü, gönye kesim optimizasyonu, dinamik paspartu hesaplayıcısı, fire payı formülasyonu, kurumsal PDF teklif ve üretim emri oluşturma yazılımının B2B atölye kullanım şartlarının, tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 2 — Kullanım ve Lisanslama Şartları</div>
          <p class="section-body">Kullanıcıya, yazılımı kendi atölye operasyonlarında, teklif hazırlama ve müşteri sunumlarında kullanmak üzere münhasır olmayan, devredilemez bir B2B kullanım lisansı verilmektedir.<br><br>Sistem üzerinde üretilen teknik çizimler, kesim listeleri ve PDF teklif şablonları ticari amaçla müşterilere sunulabilir; ancak yazılımın kaynak kodları, görsel render algoritmaları veya altyapı bileşenleri kopyalanamaz, tersine mühendislikle çözülemez veya üçüncü şahıslara kiralanamaz. Atölye, sisteme tanımladığı şifrelerin ve yetkili personel erişimlerinin gizliliğinden ve güvenliğinden bizzat sorumludur.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 3 — Maliyet Hesaplama ve Üretim Sorumluluğu</div>
          <p class="section-body">Simülatör tarafından hesaplanan profil metreleri, paspartu alanları, cam ölçüleri, fire yüzdeleri ve işçilik maliyetleri; atölyenin sisteme girdiği birim fiyatlar ve katsayılar doğrultusunda matematiksel olarak türetilmektedir. Atölye, fiziksel kesim ve montaj öncesinde ölçülerin doğruluğunu kontrol etmekle yükümlüdür. Fiziksel atölye üretimindeki operatör hatalarından kaynaklı fire ve uyuşmazlıklardan SARIŞEN REKLAM sorumlu tutulamaz.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 4 — Fikri ve Sınai Mülkiyet Hakları</div>
          <p class="section-body">Nakka Dekor markası, logosu, simülasyon arayüzü, 3D/2D çerçeve render modelleri, kod tabanı ve veri tabanı mimarisi SARIŞEN REKLAM mülkiyetinde olup, 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 sayılı Sınai Mülkiyet Kanunu kapsamında koruma altındadır. İhlal halinde yasal ve cezai takip hakkı saklıdır.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 5 — Yetkili Mahkeme ve Yürürlük</div>
          <p class="section-body">İşbu Sözleşme'den doğabilecek her türlü uyuşmazlığın çözümünde Türk Hukuku uygulanacak olup, Konya Mahkemeleri ve İcra Daireleri yetkilidir. Kullanıcı, sisteme giriş yaparak veya onay kutusunu işaretleyerek işbu sözleşmenin tüm maddelerini gayrikabili rücu kabul etmiş sayılır.</p>
        </div>
      `;
    } else if (activeTab === "corporate_invoice") {
      docTitle = "Kurumsal Fatura Şartları";
      bodyContent = `
        <div class="intro-box">
          <div class="intro-highlight">Nakka Dekor B2B Sanat &amp; Çerçeve Atölye Portalı, bir SARIŞEN REKLAM ürünüdür.</div>
          <p>SARIŞEN REKLAM - AYŞEN SARIŞEN bünyesinde sunulan Nakka Dekor B2B yazılım lisansları, kredi paketleri ve atölye abonelikleri kapsamında düzenlenen mali fatura ve ticari işlemler, 213 sayılı Vergi Usul Kanunu (VUK) ve 6102 sayılı Türk Ticaret Kanunu (TTK) hükümlerine tabidir.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 1 — e-Fatura / e-Arşiv Fatura Düzenleme Esasları</div>
          <p class="section-body">Atölye tarafından sistem profilinde beyan edilen resmi ticari ünvan, vergi dairesi ve vergi numarası / TCKN esas alınarak, satın alınan hizmet bedeli karşılığında yasal süresi içerisinde Gelir İdaresi Başkanlığı (GİB) standartlarına uygun <strong>e-Fatura</strong> veya <strong>e-Arşiv Fatura</strong> tanzim edilir. Düzenlenen fatura atölyenin kayıtlı e-posta adresine ve GİB portalına iletilir.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 2 — Vergi Bilgilerinin Doğruluğu ve Mükellefiyet</div>
          <p class="section-body">Atölye, sisteme girdiği vergi kimlik numarası (VKN) veya şahıs işletmesi ise T.C. Kimlik Numarasının (TCKN) doğruluğunu ve faal vergi mükellefi olduğunu taahhüt eder. Hatalı veya eksik vergi bilgisi bildiriminden doğabilecek vergi cezası, KDV uyuşmazlığı veya gecikmelerden atölye münhasıran sorumludur. Ticari ünvan veya vergi bilgilerinde değişiklik olması halinde, atölye “Hesap &amp; Atölye Profili” ekranından bu bilgileri ivedilikle güncellemekle yükümlüdür.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 3 — KDV Oranı ve Fiyatlandırma</div>
          <p class="section-body">Yazılım lisans bedelleri, kredi paketleri ve sunulan ek dijital hizmetler; aksi açıkça belirtilmedikçe yürürlükteki KDV oranına (%20) tabidir. Fatura üzerinde KDV matrahı ve hesaplanan vergi tutarları kanuna uygun biçimde ayrı satırlar halinde gösterilir.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 4 — Dijital Ürünlerde Cayma Hakkı İstisnası</div>
          <p class="section-body">Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesinin (ğ) bendi uyarınca; <em>“Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz.”</em> Lisans anahtarı veya kullanım hakkı aktif edilen, hesap kredisi tanımlanan veya kullanılan dijital hizmetlerin iptali ve iadesi mümkün değildir.</p>
        </div>

        <div class="section">
          <div class="section-title">Madde 5 — Cari Hesap ve Dönemsel Mutabakat</div>
          <p class="section-body">Kurumsal faturalar üzerinden yapılan işlemler, atölyenin cari hesabına yansıtılır. Yıl sonu ve geçici vergi dönemlerinde karşılıklı e-posta mutabakatı esastır.</p>
        </div>
      `;
    } else {
      docTitle = "KVKK Aydınlatma Metni & Gizlilik";
      bodyContent = `
        <div class="intro-box">
          <div class="intro-highlight">Nakka Dekor B2B Sanat &amp; Çerçeve Atölye Portalı, bir SARIŞEN REKLAM ürünüdür.</div>
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, Veri Sorumlusu sıfatıyla <strong>SARIŞEN REKLAM - AYŞEN SARIŞEN</strong> olarak; atölye yetkilileri, çalışanları ve sisteme veri giren kullanıcılarımızın kişisel verilerini aşağıda açıklanan çerçevede işlemekteyiz.</p>
        </div>

        <div class="section">
          <div class="section-title">1. Veri Sorumlusu Sıfatı</div>
          <p class="section-body">Kişisel verileriniz, 6698 sayılı KVKK kapsamında veri sorumlusu sıfatıyla SARIŞEN REKLAM - AYŞEN SARIŞEN tarafından işlenmektedir.</p>
        </div>

        <div class="section">
          <div class="section-title">2. İşlenen Kişisel ve Kurumsal Veri Kategorileri</div>
          <div class="section-body" style="line-height: 1.55;">
            <div><strong>Kimlik Bilgileri:</strong> Yetkili Adı Soyadı, TCKN (şahıs işletmeleri için).</div>
            <div><strong>İletişim Bilgileri:</strong> Kurumsal E-posta adresi, telefon numarası, atölye/fatura açık adresi, şehir.</div>
            <div><strong>Müşteri ve İşlem Verisi:</strong> Oluşturulan çerçeve teklifleri, sipariş numaraları, kesim ölçüleri ve maliyet girdileri.</div>
            <div><strong>İşlem Güvenliği ve Sistem Verisi:</strong> IP adresi, oturum açma tarih/saat logları, kullanıcı adı ve şifrelenmiş parola özetleri.</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri</div>
          <p class="section-body">Verileriniz; KVKK Madde 5/2-c (Sözleşmenin kurulması ve ifası için zorunlu olması), Madde 5/2-ç (Hukuki yükümlülüklerin yerine getirilmesi, faturalandırma ve vergi mevzuatı) ve Madde 5/2-f (Meşru menfaatler ve bilgi güvenliğinin sağlanması) hukuki sebeplerine dayalı olarak; atölye hesabı oluşturulması, simülatör hizmetinin kesintisiz sunulması, kurumsal teklif ve kesim raporlarının saklanması amacıyla işlenir.</p>
        </div>

        <div class="section">
          <div class="section-title">4. Verilerin Aktarıldığı Taraflar ve Güvenlik Önlemleri</div>
          <p class="section-body">Kişisel verileriniz hiçbir surette reklam veya üçüncü taraf ticari pazarlama amacıyla paylaşılmaz veya satılmaz. Yalnızca yasal zorunluluklar halinde yetkili adli/mali merciler, Gelir İdaresi Başkanlığı ve güvenli bulut barındırma hizmet sağlayıcılarımız ile (şifreli SSL ve güvenli veritabanı protokolleriyle) paylaşılmaktadır.</p>
        </div>

        <div class="section">
          <div class="section-title">5. KVKK Madde 11 Uyarınca Haklarınız</div>
          <p class="section-body">Kanun uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, amaca uygun kullanılıp kullanılmadığını öğrenme, eksik/yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz. Taleplerinizi <strong>info@sarisen.com.tr</strong> adresine veya sistem iletişim kanallarımıza iletebilirsiniz.</p>
        </div>
      `;
    }

    const printWindowHtml = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>${docTitle} - NAKKA DEKOR</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #ffffff !important;
            color: #111827 !important;
            font-size: 8.8pt;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            padding: 0;
          }
          .antet {
            border-bottom: 2px solid #C5A059;
            padding-bottom: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .brand-title {
            font-size: 13pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #0f172a;
          }
          .brand-subtitle {
            font-size: 8pt;
            font-weight: 700;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 1px;
          }
          .meta-box {
            text-align: right;
            font-size: 7.5pt;
            color: #475569;
            font-family: monospace;
          }
          .doc-header-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 5px 10px;
            text-align: center;
            margin-bottom: 10px;
          }
          .doc-title {
            font-size: 11pt;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .intro-box {
            background: #f8fafc;
            border-left: 3.5px solid #C5A059;
            padding: 7px 11px;
            margin-bottom: 9px;
            font-size: 8.5pt;
            color: #1e293b;
            line-height: 1.4;
          }
          .intro-highlight {
            font-weight: 800;
            color: #92400e;
            margin-bottom: 2px;
          }
          .section {
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .section-title {
            font-size: 9pt;
            font-weight: 800;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
          }
          .section-body {
            color: #1e293b;
            font-size: 8.5pt;
            text-align: justify;
            line-height: 1.4;
          }
          .footer {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            color: #64748b;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="antet">
          <div>
            <div class="brand-title">NAKKA DEKOR</div>
            <div class="brand-subtitle">B2B Sanat &amp; Çerçeve Atölye Portalı &bull; Bir SARIŞEN REKLAM Ürünüdür</div>
          </div>
          <div class="meta-box">
            <div><strong>Hukuk &amp; Mevzuat Servisi</strong></div>
            <div>Tarih: ${new Date().toLocaleDateString("tr-TR")}</div>
            <div>Ref: NK-B2B-2026</div>
          </div>
        </div>

        <div class="doc-header-card">
          <div class="doc-title">${docTitle}</div>
        </div>

        ${bodyContent}

        <div class="footer">
          <div><strong>SARIŞEN REKLAM - AYŞEN SARIŞEN</strong> &bull; Nakka Dekor B2B Platformu</div>
          <div>Elektronik ortamda tanzim edilmiş resmi metindir. Sayfa 1 / 1</div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printWindowHtml);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print error:", e);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 250);
    } else {
      window.print();
    }
  };

  return (
    <div className="legal-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className={`legal-modal-container w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDarkMode 
            ? "bg-[#14171d] border-white/15 text-white shadow-black/80" 
            : "bg-white border-slate-200 text-slate-900 shadow-slate-400/40"
        }`}
      >
        {/* Header - Kurumsal Yükseklik ve Hizalama */}
        <div className={`legal-no-print px-5 py-4 sm:px-6 sm:py-4.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? "bg-[#101217] border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDarkMode 
                ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30" 
                : "bg-amber-100/80 text-amber-800 border-amber-300"
            }`}>
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-[#C5A059]">
                  Nakka Dekor Hukuk &amp; Mevzuat
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isDarkMode ? "bg-white/10 text-neutral-300" : "bg-slate-200 text-slate-700"
                }`}>
                  v2026-B2B
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase mt-0.5 truncate">
                {activeTab === "user_agreement" && "Kullanıcı ve Lisans Sözleşmesi"}
                {activeTab === "corporate_invoice" && "Kurumsal Fatura Şartları"}
                {activeTab === "kvkk" && "KVKK ve Gizlilik Politikası"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              title="Yazdır (A4 Beyaz Sayfa Baskısı)"
              className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                isDarkMode 
                  ? "bg-white/5 hover:bg-white/10 text-neutral-200 border-white/10 hover:border-white/20" 
                  : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs"
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border-white/10 hover:border-white/20" 
                  : "bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-300"
              }`}
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - Eşit Dağıtılmış Kurumsal Segmentler */}
        <div className={`legal-no-print grid grid-cols-3 border-b shrink-0 ${
          isDarkMode ? "bg-[#0d0f13] border-white/10" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab("user_agreement")}
            className={`w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-3.5 sm:py-4 px-2 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer select-none text-center ${
              activeTab === "user_agreement"
                ? isDarkMode 
                  ? "border-[#C5A059] text-[#FAE2B3] bg-[#C5A059]/10 font-black shadow-2xs" 
                  : "border-[#B88E3A] text-[#8F6A1E] bg-[#B88E3A]/10 font-black shadow-2xs"
                : isDarkMode 
                  ? "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02] font-semibold" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-semibold"
            }`}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#C5A059]" />
            <span className="truncate">Kullanıcı ve Lisans Sözleşmesi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("corporate_invoice")}
            className={`w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-3.5 sm:py-4 px-2 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer select-none text-center ${
              activeTab === "corporate_invoice"
                ? isDarkMode 
                  ? "border-[#C5A059] text-[#FAE2B3] bg-[#C5A059]/10 font-black shadow-2xs" 
                  : "border-[#B88E3A] text-[#8F6A1E] bg-[#B88E3A]/10 font-black shadow-2xs"
                : isDarkMode 
                  ? "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02] font-semibold" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-semibold"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#C5A059]" />
            <span className="truncate">Kurumsal Fatura Şartları</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kvkk")}
            className={`w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-3.5 sm:py-4 px-2 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer select-none text-center ${
              activeTab === "kvkk"
                ? isDarkMode 
                  ? "border-[#C5A059] text-[#FAE2B3] bg-[#C5A059]/10 font-black shadow-2xs" 
                  : "border-[#B88E3A] text-[#8F6A1E] bg-[#B88E3A]/10 font-black shadow-2xs"
                : isDarkMode 
                  ? "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02] font-semibold" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-semibold"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#C5A059]" />
            <span className="truncate">KVKK ve Gizlilik</span>
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: KULLANICI VE LİSANS SÖZLEŞMESİ */}
          {activeTab === "user_agreement" && (
            <div className="space-y-5 animate-fade-in">
              <div className={`p-4 rounded-2xl border ${
                isDarkMode ? "bg-white/[0.02] border-white/10 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <p className="font-semibold text-xs leading-normal">
                  İşbu Kullanıcı ve Lisans Sözleşmesi (&ldquo;Sözleşme&rdquo;); <strong>SARIŞEN REKLAM - AYŞEN SARIŞEN</strong> (&ldquo;Hizmet Sağlayıcı&rdquo;) ile sistemi kullanan, üyelik oluşturan veya simülatör üzerinden işlem gerçekleştiren B2B Çerçeve Atölyesi, tüzel veya gerçek kişi kullanıcı (&ldquo;Kullanıcı&rdquo; / &ldquo;Abone&rdquo;) arasında elektronik ortamda akdedilmiştir. Nakka Dekor B2B Sanat &amp; Çerçeve Atölye Portalı, bir SARIŞEN REKLAM ürünüdür.
                </p>
              </div>

              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 1 &mdash; Sözleşmenin Amacı ve Konusu
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    İşbu sözleşmenin konusu; Hizmet Sağlayıcı tarafından sunulan bulut tabanlı Nakka Dekor Sanatsal Çerçeve Simülatörü, gönye kesim optimizasyonu, dinamik paspartu hesaplayıcısı, fire payı formülasyonu, kurumsal PDF teklif ve üretim emri oluşturma yazılımının B2B atölye kullanım şartlarının, tarafların hak ve yükümlülüklerinin belirlenmesidir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 2 &mdash; Kullanım ve Lisanslama Şartları
                  </h3>
                  <div className={`space-y-2 ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    <p>
                      Kullanıcıya, yazılımı kendi atölye operasyonlarında, teklif hazırlama ve müşteri sunumlarında kullanmak üzere münhasır olmayan, devredilemez bir B2B kullanım lisansı verilmektedir.
                    </p>
                    <p>
                      Sistem üzerinde üretilen teknik çizimler, kesim listeleri ve PDF teklif şablonları ticari amaçla müşterilere sunulabilir; ancak yazılımın kaynak kodları, görsel render algoritmaları veya altyapı bileşenleri kopyalanamaz, tersine mühendislikle çözülemez veya üçüncü şahıslara kiralanamaz. Atölye, sisteme tanımladığı şifrelerin ve yetkili personel erişimlerinin gizliliğinden ve güvenliğinden bizzat sorumludur.
                    </p>
                  </div>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 3 &mdash; Maliyet Hesaplama ve Üretim Sorumluluğu
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Simülatör tarafından hesaplanan profil metreleri, paspartu alanları, cam ölçüleri, fire yüzdeleri ve işçilik maliyetleri; atölyenin sisteme girdiği birim fiyatlar ve katsayılar doğrultusunda matematiksel olarak türetilmektedir. Atölye, fiziksel kesim ve montaj öncesinde ölçülerin doğruluğunu kontrol etmekle yükümlüdür. Fiziksel atölye üretimindeki operatör hatalarından kaynaklı fire ve uyuşmazlıklardan SARIŞEN REKLAM sorumlu tutulamaz.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 4 &mdash; Fikri ve Sınai Mülkiyet Hakları
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    Nakka Dekor markası, logosu, simülasyon arayüzü, 3D/2D çerçeve render modelleri, kod tabanı ve veri tabanı mimarisi SARIŞEN REKLAM mülkiyetinde olup, 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 sayılı Sınai Mülkiyet Kanunu kapsamında koruma altındadır. İhlal halinde yasal ve cezai takip hakkı saklıdır.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 5 &mdash; Yetkili Mahkeme ve Yürürlük
                  </h3>
                  <p className={isDarkMode ? "text-neutral-300" : "text-slate-600"}>
                    İşbu Sözleşme&apos;den doğabilecek her türlü uyuşmazlığın çözümünde Türk Hukuku uygulanacak olup, Konya Mahkemeleri ve İcra Daireleri yetkilidir. Kullanıcı, sisteme giriş yaparak veya onay kutusunu işaretleyerek işbu sözleşmenin tüm maddelerini gayrikabili rücu kabul etmiş sayılır.
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
                <div className="space-y-1.5">
                  <div className="font-bold text-xs sm:text-sm tracking-wide text-[#C5A059]">
                    Nakka Dekor B2B Sanat &amp; Çerçeve Atölye Portalı, bir SARIŞEN REKLAM ürünüdür.
                  </div>
                  <p className="font-medium text-xs leading-relaxed">
                    SARIŞEN REKLAM - AYŞEN SARIŞEN bünyesinde sunulan Nakka Dekor B2B yazılım lisansları, kredi paketleri ve atölye abonelikleri kapsamında düzenlenen mali fatura ve ticari işlemler, 213 sayılı Vergi Usul Kanunu (VUK) ve 6102 sayılı Türk Ticaret Kanunu (TTK) hükümlerine tabidir.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 1 &mdash; e-Fatura / e-Arşiv Fatura Düzenleme Esasları
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Atölye tarafından sistem profilinde beyan edilen resmi ticari ünvan, vergi dairesi ve vergi numarası / TCKN esas alınarak, satın alınan hizmet bedeli karşılığında yasal süresi içerisinde Gelir İdaresi Başkanlığı (GİB) standartlarına uygun <strong>e-Fatura</strong> veya <strong>e-Arşiv Fatura</strong> tanzim edilir. Düzenlenen fatura atölyenin kayıtlı e-posta adresine ve GİB portalına iletilir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 2 &mdash; Vergi Bilgilerinin Doğruluğu ve Mükellefiyet
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Atölye, sisteme girdiği vergi kimlik numarası (VKN) veya şahıs işletmesi ise T.C. Kimlik Numarasının (TCKN) doğruluğunu ve faal vergi mükellefi olduğunu taahhüt eder. Hatalı veya eksik vergi bilgisi bildiriminden doğabilecek vergi cezası, KDV uyuşmazlığı veya gecikmelerden atölye münhasıran sorumludur. Ticari ünvan veya vergi bilgilerinde değişiklik olması halinde, atölye &ldquo;Hesap &amp; Atölye Profili&rdquo; ekranından bu bilgileri ivedilikle güncellemekle yükümlüdür.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 3 &mdash; KDV Oranı ve Fiyatlandırma
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Yazılım lisans bedelleri, kredi paketleri ve sunulan ek dijital hizmetler; aksi açıkça belirtilmedikçe yürürlükteki KDV oranına (%20) tabidir. Fatura üzerinde KDV matrahı ve hesaplanan vergi tutarları kanuna uygun biçimde ayrı satırlar halinde gösterilir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 4 &mdash; Dijital Ürünlerde Cayma Hakkı İstisnası
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesinin (ğ) bendi uyarınca; <em>&ldquo;Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz.&rdquo;</em> Lisans anahtarı veya kullanım hakkı aktif edilen, hesap kredisi tanımlanan veya kullanılan dijital hizmetlerin iptali ve iadesi mümkün değildir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    Madde 5 &mdash; Cari Hesap ve Dönemsel Mutabakat
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
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
                <div className="space-y-1.5">
                  <div className="font-bold text-xs sm:text-sm tracking-wide text-[#C5A059]">
                    Nakka Dekor B2B Sanat &amp; Çerçeve Atölye Portalı, bir SARIŞEN REKLAM ürünüdür.
                  </div>
                  <p className="font-medium text-xs leading-relaxed">
                    6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, Veri Sorumlusu sıfatıyla <strong>SARIŞEN REKLAM - AYŞEN SARIŞEN</strong> olarak; atölye yetkilileri, çalışanları ve sisteme veri giren kullanıcılarımızın kişisel verilerini aşağıda açıklanan çerçevede işlemekteyiz.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    1. Veri Sorumlusu Sıfatı
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Kişisel verileriniz, 6698 sayılı KVKK kapsamında veri sorumlusu sıfatıyla SARIŞEN REKLAM - AYŞEN SARIŞEN tarafından işlenmektedir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    2. İşlenen Kişisel ve Kurumsal Veri Kategorileri
                  </h3>
                  <div className={`space-y-2 leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    <p>
                      <strong>Kimlik Bilgileri:</strong> Yetkili Adı Soyadı, TCKN (şahıs işletmeleri için).
                    </p>
                    <p>
                      <strong>İletişim Bilgileri:</strong> Kurumsal E-posta adresi, telefon numarası, atölye/fatura açık adresi, şehir.
                    </p>
                    <p>
                      <strong>Müşteri ve İşlem Verisi:</strong> Oluşturulan çerçeve teklifleri, sipariş numaraları, kesim ölçüleri ve maliyet girdileri.
                    </p>
                    <p>
                      <strong>İşlem Güvenliği ve Sistem Verisi:</strong> IP adresi, oturum açma tarih/saat logları, kullanıcı adı ve şifrelenmiş parola özetleri.
                    </p>
                  </div>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Verileriniz; KVKK Madde 5/2-c (Sözleşmenin kurulması ve ifası için zorunlu olması), Madde 5/2-ç (Hukuki yükümlülüklerin yerine getirilmesi, faturalandırma ve vergi mevzuatı) ve Madde 5/2-f (Meşru menfaatler ve bilgi güvenliğinin sağlanması) hukuki sebeplerine dayalı olarak; atölye hesabı oluşturulması, simülatör hizmetinin kesintisiz sunulması, kurumsal teklif ve kesim raporlarının saklanması amacıyla işlenir.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    4. Verilerin Aktarıldığı Taraflar ve Güvenlik Önlemleri
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Kişisel verileriniz hiçbir surette reklam veya üçüncü taraf ticari pazarlama amacıyla paylaşılmaz veya satılmaz. Yalnızca yasal zorunluluklar halinde yetkili adli/mali merciler, Gelir İdaresi Başkanlığı ve güvenli bulut barındırma hizmet sağlayıcılarımız ile (şifreli SSL ve güvenli veritabanı protokolleriyle) paylaşılmaktadır.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C5A059]">
                    5. KVKK Madde 11 Uyarınca Haklarınız
                  </h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-slate-600"}`}>
                    Kanun uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, amaca uygun kullanılıp kullanılmadığını öğrenme, eksik/yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz. Taleplerinizi <a href="mailto:info@sarisen.com.tr" className="font-semibold text-[#C5A059] hover:underline">info@sarisen.com.tr</a> adresine veya sistem iletişim kanallarımıza iletebilirsiniz.
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`legal-no-print p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
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
          Kullanıcı ve lisans sözleşmesi
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
          kurumsal fatura şartları
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
          KVKK ve gizlilik şartlarını
        </button>
        {" okudum, onaylıyorum."}
      </label>
    </div>
  );
}
