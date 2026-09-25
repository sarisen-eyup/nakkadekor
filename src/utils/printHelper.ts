import QRCode from "qrcode";
import { getPaspartuColorName } from "./pricing";
import { 
  CompanyProfile, 
  CompleteCutList, 
  CostCalculationBreakdown, 
  UnitPricesSettings, 
  MaterialInclusionFlags 
} from "../types/pricing";

// Centralized safe document printing handler (handles popup window & iframe fallback)
export function renderPrintHtml(title: string, fullHtml: string) {
  // First attempt: Popup Window (ensure it's not the same window)
  let printWin: Window | null = null;
  try {
    printWin = window.open("", "_blank");
  } catch (e) {
    console.warn("window.open failed, trying iframe fallback:", e);
  }

  // Safety check: printWin MUST NOT be the current window!
  if (printWin && printWin !== window && !printWin.closed && typeof printWin.document !== "undefined") {
    try {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      try {
        printWin.focus();
      } catch {}
      return;
    } catch (e) {
      console.warn("Writing to popup window failed, trying fallback:", e);
    }
  }

  // Fallback: Use clean, non-disruptive hidden printing iframe so simulator screen stays intact
  const existingIframe = document.getElementById("nakka-print-iframe");
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "nakka-print-iframe";
  // Invisible off-screen iframe to prevent closing/disrupting simulator screen
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-1";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    try {
      doc.open();
      doc.write(fullHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error("Iframe print error:", err);
        } finally {
          // Cleanup after printing is triggered
          setTimeout(() => {
            try {
              iframe.remove();
            } catch {}
          }, 60000);
        }
      }, 500);
    } catch (e) {
      console.error("Failed to write to print iframe:", e);
    }
  }
}

export function triggerPrintWindow(title: string, bodyHtml: string) {
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 30px;
            color: #111;
            background: #fff;
            line-height: 1.5;
          }
          .no-print-bar {
            background: #121415;
            color: #fff;
            padding: 12px 20px;
            margin: -30px -30px 25px -30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: monospace;
            border-bottom: 2px solid #C5A059;
          }
          .print-btn {
            background: #C5A059;
            color: #000;
            font-weight: bold;
            padding: 8px 18px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-family: monospace;
          }
          .print-btn:hover {
            background: #b08c48;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
            font-family: monospace;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            color: #000;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
          }
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .info-box {
            background: #f9f9f9;
            border: 1px solid #ddd;
            padding: 10px 14px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
          }
          .signature-box {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            font-size: 11px;
            font-family: monospace;
          }
          .sig-line {
            border-bottom: 1px dashed #666;
            width: 220px;
            height: 35px;
            margin-top: 10px;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          @media print {
            .no-print-bar, .no-print-close-btn { display: none !important; }
            body { 
              padding: 0 !important; 
              margin: 0 !important; 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <div style="display:flex; align-items:center; gap: 8px;">
            <span style="color:#C5A059; font-weight:bold;">NAKKA DEKOR</span>
            <span>• ${title}</span>
          </div>
          <button class="print-btn" onclick="window.print()">🖨️ YAZDIR / PDF OLARAK KAYDET</button>
        </div>
        ${bodyHtml}
      </body>
    </html>
  `;

  renderPrintHtml(title, fullHtml);
}

export interface PrintDocumentDetails {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  deliveryDate: string;
  artworkWidth: number;
  artworkHeight: number;
  matWidth: number;
  middleMatWidth: number;
  innerMatColor?: string;
  outerMatColor?: string;
  frameWidth: number;
  outerFrameWidth: number;
  innerRabbetDepthMm?: number;
  outerRabbetDepthMm?: number;
  totalW: number;
  totalH: number;
  customPaintingFile: string;
  customFrameFile: string;
  customOuterFrameFile: string;
  effectivePrice: number;
  deliveryMethod?: "store" | "shipping";
  shippingCost?: number;
  qrDataUrl?: string;
  flags?: {
    includeArtworkPrint?: boolean;
    includeInnerMat?: boolean;
    includeInnerFrame?: boolean;
    includeMiddleMat?: boolean;
    includeOuterFrame?: boolean;
    includeGlass?: boolean;
    includeBackingBoard?: boolean;
    includeBackingPaper?: boolean;
    includeBackingCloth?: boolean;
    includeKraftTape?: boolean;
    includeLaborCost?: boolean;
  };
  companyProfile?: CompanyProfile;
  authorUser?: string;
}

export function triggerImagePrintWindow(
  title: string,
  dataUrl: string,
  fileName: string,
  details: PrintDocumentDetails
) {
  const flags = details.flags;
  const hasExplicitFlags = Boolean(flags && Object.keys(flags).length > 0);

  const isArtActive = hasExplicitFlags && flags?.includeArtworkPrint !== undefined
    ? Boolean(flags.includeArtworkPrint) && details.artworkWidth > 0 && details.artworkHeight > 0
    : (details.artworkWidth > 0 && details.artworkHeight > 0 && Boolean(details.customPaintingFile && details.customPaintingFile !== 'Yok' && details.customPaintingFile !== 'Özel Sanat Eseri Baskısı Yok'));

  const isMatActive = hasExplicitFlags && flags?.includeInnerMat !== undefined
    ? Boolean(flags.includeInnerMat) && details.matWidth > 0
    : (details.matWidth > 0);

  const isFrameActive = hasExplicitFlags && flags?.includeInnerFrame !== undefined
    ? Boolean(flags.includeInnerFrame) && details.frameWidth > 0
    : (details.frameWidth > 0 && Boolean(details.customFrameFile && details.customFrameFile !== 'Yok' && details.customFrameFile !== 'Çerçevesiz Profil'));

  const isMiddleMatActive = hasExplicitFlags && flags?.includeMiddleMat !== undefined
    ? Boolean(flags.includeMiddleMat) && details.middleMatWidth > 0
    : (details.middleMatWidth > 0);

  const isOuterFrameActive = hasExplicitFlags && flags?.includeOuterFrame !== undefined
    ? Boolean(flags.includeOuterFrame) && details.outerFrameWidth > 0
    : (details.outerFrameWidth > 0 && Boolean(details.customOuterFrameFile && details.customOuterFrameFile !== 'Yok' && details.customOuterFrameFile !== 'Dış Kasa Çerçevesiz'));

  const isGlassActive = hasExplicitFlags && flags?.includeGlass !== undefined
    ? Boolean(flags.includeGlass)
    : (isFrameActive || details.frameWidth > 0);

  const isBackingClothActive = hasExplicitFlags && flags?.includeBackingCloth !== undefined
    ? Boolean(flags.includeBackingCloth)
    : (isFrameActive || details.frameWidth > 0);

  const isKraftTapeActive = hasExplicitFlags && flags?.includeKraftTape !== undefined
    ? Boolean(flags.includeKraftTape)
    : (isFrameActive || details.frameWidth > 0);

  const isBackingBoardActive = hasExplicitFlags && flags?.includeBackingBoard !== undefined
    ? Boolean(flags.includeBackingBoard)
    : (isFrameActive || details.frameWidth > 0);

  const firmName = details.companyProfile?.tradeTitle?.trim() 
    || details.companyProfile?.companyName?.trim() 
    || 'NAKKA DEKOR';

  let userName = details.authorUser?.trim();
  if (!userName && details.companyProfile?.companyName && details.companyProfile.companyName !== firmName) {
    userName = details.companyProfile.companyName.trim();
  }
  if (!userName) {
    userName = 'Yetkili Satış Danışmanı';
  }

  const rawEmail = details.companyProfile?.email?.trim() || 'info@sarisen.com.tr';
  const emailLine = rawEmail.toLowerCase().startsWith('e-posta:') ? rawEmail : `E-posta: ${rawEmail}`;

  const rawPhone = details.companyProfile?.phone?.trim() || '5424710686';
  const phoneLine = rawPhone.toLowerCase().startsWith('tel:') ? rawPhone : `Tel: ${rawPhone}`;

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            color: #121415;
            background: #f4f4f5;
            line-height: 1.4;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .no-print-bar {
            width: 100%;
            max-width: 210mm;
            background: #121415;
            color: #fff;
            padding: 10px 18px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: monospace;
            border-bottom: 2px solid #C5A059;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .action-btn {
            background: #C5A059;
            color: #000;
            font-weight: bold;
            padding: 7px 14px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-family: monospace;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background 0.2s;
          }
          .action-btn:hover {
            background: #b08c48;
          }
          .action-btn-secondary {
            background: #27272a;
            color: #fff;
            border: 1px solid #C5A059;
          }
          .action-btn-secondary:hover {
            background: #3f3f46;
          }
          .a4-page {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            background: #ffffff;
            padding: 7mm 9mm 6mm 9mm;
            border-radius: 4px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            box-sizing: border-box;
          }
          .doc-header {
            flex-shrink: 0;
            border-bottom: 1.5px solid #C5A059;
            padding-bottom: 5px;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header-company-info {
            display: flex;
            flex-direction: column;
            gap: 1.5px;
            justify-content: center;
          }
          .header-company-line {
            font-size: 9px;
            font-weight: 600;
            color: #1e293b;
            line-height: 1.25;
          }
          .doc-badge {
            font-family: monospace;
            font-size: 10px;
            text-align: right;
            line-height: 1.2;
            flex-shrink: 0;
          }
          .doc-badge-no {
            font-weight: bold;
            color: #121415;
            font-size: 11.5px;
          }
          .doc-badge-date {
            color: #666;
            font-size: 9px;
          }
          
          /* Responsive Büyüyen Görsel Alanı (Kalan Boşluğu Doldurur, Alt Tabloları Sona İter) */
          .img-preview-container {
            flex: 1 1 auto;
            min-height: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 4px 0 6px 0;
            overflow: hidden;
          }
          .img-preview-container img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            border: 1px solid #e4e4e7;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }

          .doc-bottom-section {
            flex-shrink: 0;
            margin-top: auto;
            display: flex;
            flex-direction: column;
          }

          .specs-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 9.5px;
          }
          .specs-table th {
            background-color: #121415;
            color: #C5A059;
            padding: 3px 6px;
            text-align: left;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border: 1px solid #121415;
          }
          .specs-table td {
            border: 1px solid #e4e4e7;
            padding: 2.5px 5px;
            font-size: 9px;
            line-height: 1.15;
          }
          
          /* Active vs Inactive component styles */
          .row-active {
            background-color: #ffffff;
            color: #121415;
          }
          .row-inactive {
            background-color: #f4f4f5;
            color: #9ca3af;
          }
          .badge-active {
            background: #fef3c7;
            color: #b45309;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 8px;
            display: inline-block;
          }
          .badge-inactive {
            background: #e4e4e7;
            color: #71717a;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 8px;
            display: inline-block;
          }
          .highlight-cell {
            font-weight: bold;
            color: #121415;
            background-color: #fffbeb !important;
            border: 1px solid #C5A059 !important;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 5px;
          }

          .info-card {
            border: 1px solid #e4e4e7;
            background: #fafafa;
            padding: 5px 8px;
            border-radius: 3px;
            font-size: 9px;
          }
          .info-card-title {
            font-size: 8.5px;
            font-weight: 700;
            color: #121415;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-bottom: 1px solid #e4e4e7;
            padding-bottom: 2px;
            margin-bottom: 4px;
          }

          /* Kompakt ve Net QR Karekod Alanı */
          .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
          }
          .qr-img {
            width: 85px;
            height: 85px;
            border: 1px solid #121415;
            border-radius: 3px;
            padding: 2px;
            background: #ffffff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }

          .checkbox-item {
            display: flex;
            align-items: flex-start;
            gap: 5px;
            font-size: 8.5px;
            color: #121415;
            margin-bottom: 3px;
            line-height: 1.15;
          }
          
          /* Kalem ile işaretlemek için boş onay kutucukları */
          .empty-checkbox {
            width: 11px;
            height: 11px;
            border: 1px solid #121415;
            border-radius: 2px;
            display: inline-block;
            flex-shrink: 0;
            margin-top: 1px;
            background: #ffffff;
          }

          .signature-area {
            border-top: 1px dashed #aaa;
            margin-top: 10px;
            padding-top: 4px;
            text-align: center;
            font-size: 8.5px;
            color: #555;
          }
          .signature-line {
            width: 130px;
            border-bottom: 1px solid #121415;
            margin: 14px auto 3px auto;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm 7mm;
            }
            html, body {
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print-bar { display: none !important; }
            .a4-page {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              height: 287mm !important;
              max-height: 287mm !important;
              min-height: 287mm !important;
              padding: 0 !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .img-preview-container {
              flex: 1 1 auto !important;
              min-height: 0 !important;
              max-height: none !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              margin: 3px 0 !important;
              overflow: hidden !important;
            }
            .img-preview-container img {
              max-width: 100% !important;
              max-height: 100% !important;
              width: auto !important;
              height: auto !important;
              object-fit: contain !important;
              box-shadow: none !important;
            }
            .doc-bottom-section {
              flex-shrink: 0 !important;
              margin-top: auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <div style="display:flex; align-items:center; gap: 10px;">
            <span style="color:#C5A059; font-weight:bold; font-size: 14px;">NAKKA DEKOR</span>
            <span style="color:#a1a1aa;">•</span>
            <span style="font-weight:500;">Sipariş Formu</span>
          </div>
          <div style="display:flex; gap: 10px;">
            <button class="action-btn" onclick="window.print()">
              🖨️ A4 YAZDIR / PDF KAYDET
            </button>
          </div>
        </div>

        <div class="a4-page">
          <!-- Header -->
          <div class="doc-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${details.companyProfile?.logoUrl ? `
                <img 
                  src="${details.companyProfile.logoUrl}" 
                  alt="Logo" 
                  style="max-height: 48px; max-width: 110px; object-fit: contain; border-radius: 3px;" 
                />
              ` : ''}
              <div class="header-company-info">
                <div class="header-company-line">${firmName}</div>
                <div class="header-company-line">${userName}</div>
                <div class="header-company-line">${emailLine}</div>
                <div class="header-company-line">${phoneLine}</div>
              </div>
            </div>
            <div class="doc-badge">
              <div class="doc-badge-no">SİPARİŞ NO: ${details.orderNumber}</div>
              <div class="doc-badge-date">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
            </div>
          </div>

          <!-- Büyütülmüş Çerçeve Tasarım Görseli (Responsive, kalan tüm boşluğu dolduran) -->
          <div class="img-preview-container">
            <img src="${dataUrl}" alt="${title}" />
          </div>

          <!-- Sayfa Sonuna Yaslanan Alt Bölüm (Tablo, Müşteri & İmza Kartları) -->
          <div class="doc-bottom-section">
            <!-- Teknik Detaylar Tablosu (Aktif = Renkli, Pasif = Gri) -->
            <table class="specs-table">
              <thead>
                <tr>
                  <th>Bileşen / Malzeme</th>
                  <th>Ölçü / Özellik</th>
                  <th>Sistem &amp; Detay</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                <!-- 01. Sanat Eseri -->
                <tr class="${isArtActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>01. Sanat Eseri (Artwork)</strong></td>
                  <td><strong>${details.artworkWidth} x ${details.artworkHeight} cm</strong></td>
                  <td>${details.customPaintingFile || 'Özel Sanat Eseri Baskısı'}</td>
                  <td><span class="${isArtActive ? 'badge-active' : 'badge-inactive'}">${isArtActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 02. İç Paspartu -->
                <tr class="${isMatActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>02. İç Paspartu (Matte)</strong></td>
                  <td>${isMatActive ? `${details.matWidth} cm` : '0 cm'}</td>
                  <td>${isMatActive ? `Paspartu Kartonu (Renk: ${getPaspartuColorName(details.innerMatColor)})` : 'Paspartusuz (Doğrudan Çerçeve)'}</td>
                  <td><span class="${isMatActive ? 'badge-active' : 'badge-inactive'}">${isMatActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 03. Ana Çerçeve -->
                <tr class="${isFrameActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>03. Ana Çerçeve (Inner Frame)</strong></td>
                  <td>${isFrameActive ? `${details.frameWidth} cm${details.innerRabbetDepthMm ? ` (Bini: ${details.innerRabbetDepthMm} mm)` : ''}` : '0 cm'}</td>
                  <td>${isFrameActive ? (details.customFrameFile || 'Standart Profil') : 'Çerçevesiz Profil'}</td>
                  <td><span class="${isFrameActive ? 'badge-active' : 'badge-inactive'}">${isFrameActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 04. 3D Ara Paspartu -->
                <tr class="${isMiddleMatActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>04. 3D Ara Paspartu</strong></td>
                  <td>${isMiddleMatActive ? `${details.middleMatWidth} cm` : '0 cm'}</td>
                  <td>${isMiddleMatActive ? `3D Derinlik Mukavvası (Renk: ${getPaspartuColorName(details.outerMatColor)})` : 'Ara Paspartusuz'}</td>
                  <td><span class="${isMiddleMatActive ? 'badge-active' : 'badge-inactive'}">${isMiddleMatActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 05. Dış Çerçeve -->
                <tr class="${isOuterFrameActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>05. Dış Çerçeve (Outer Frame)</strong></td>
                  <td>${isOuterFrameActive ? `${details.outerFrameWidth} cm${details.outerRabbetDepthMm ? ` (Bini: ${details.outerRabbetDepthMm} mm)` : ''}` : '0 cm'}</td>
                  <td>${isOuterFrameActive ? details.customOuterFrameFile : 'Dış Kasa Çerçevesiz'}</td>
                  <td><span class="${isOuterFrameActive ? 'badge-active' : 'badge-inactive'}">${isOuterFrameActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 06. Koruma Camı -->
                <tr class="${isGlassActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>06. Koruma Camı (Glass)</strong></td>
                  <td>${isGlassActive ? '2 mm Antireflete Cam' : 'Camsız'}</td>
                  <td>${isGlassActive ? 'Müze Tipi Koruyucu Şeffaf Cam' : 'Cam Uygulanmıyor'}</td>
                  <td><span class="${isGlassActive ? 'badge-active' : 'badge-inactive'}">${isGlassActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 07. Arkalık Koruma Bezi -->
                <tr class="${isBackingClothActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>07. Arkalık Koruma Bezi</strong></td>
                  <td>${isBackingClothActive ? 'Toz &amp; Nem İzolasyon Bezi' : 'Yok'}</td>
                  <td>${isBackingClothActive ? 'Asitsiz Koruyucu Bitiş Kapama Bezi' : 'Kapama Bezi Kullanılmıyor'}</td>
                  <td><span class="${isBackingClothActive ? 'badge-active' : 'badge-inactive'}">${isBackingClothActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 08. 3mm MDF Arka Kapama -->
                <tr class="${isBackingBoardActive ? 'row-active' : 'row-inactive'}">
                  <td><strong>08. 3mm MDF Arka Kapama</strong></td>
                  <td>${isBackingBoardActive ? '3 mm Pres MDF Arkalık' : 'Yok'}</td>
                  <td>${isBackingBoardActive ? 'Sertleştirilmiş Arka Koruma Plakası' : 'MDF Arkalık Kullanılmıyor'}</td>
                  <td><span class="${isBackingBoardActive ? 'badge-active' : 'badge-inactive'}">${isBackingBoardActive ? 'VAR' : 'YOK'}</span></td>
                </tr>

                <!-- 09. Dıştan Dışa Toplam Ölçü -->
                <tr class="row-active">
                  <td><strong>09. Dıştan Dışa Toplam Ölçü</strong></td>
                  <td colspan="2"><strong>${details.totalW.toFixed(2)} x ${details.totalH.toFixed(2)} cm</strong></td>
                  <td><span class="badge-active">TAM KESİM</span></td>
                </tr>

                <!-- 10. Toplam Sipariş Tutarı -->
                <tr class="row-active">
                  <td><strong>10. Toplam Sipariş Tutarı</strong></td>
                  <td colspan="2"><strong>₺${details.effectivePrice.toLocaleString('tr-TR')}</strong> (KDV Dahil)</td>
                  <td><span class="badge-active">ONAYLI FİYAT</span></td>
                </tr>

                <!-- 11. Teslimat Seçeneği -->
                <tr class="${details.deliveryMethod === 'shipping' ? 'row-active' : 'row-inactive'}">
                  <td><strong>11. Teslimat Seçeneği</strong></td>
                  <td><strong>${details.deliveryMethod === 'shipping' ? `Kargo Gönderimi (₺${details.shippingCost || 0})` : 'Mağazada Teslim (₺0)'}</strong></td>
                  <td>${details.deliveryMethod === 'shipping' ? 'Özel Korumalı Ambalaj ile Kargo Adrese Sevk' : 'Müşteri Tarafından Mağazadan Teslim Alınacak'}</td>
                  <td><span class="${details.deliveryMethod === 'shipping' ? 'badge-active' : 'badge-inactive'}">${details.deliveryMethod === 'shipping' ? 'KARGO' : 'MAĞAZA'}</span></td>
                </tr>
              </tbody>
            </table>

            <!-- Müşteri Bilgileri & Karekod -->
            <div class="grid-2">
              <div class="info-card">
                <div class="info-card-title">Müşteri &amp; Teslimat Bilgileri</div>
                <div style="margin-bottom: 3px;">
                  <span style="color:#666;">Müşteri Adı:</span>
                  <strong style="color:#121415; margin-left: 4px;">
                    ${details.customerName.trim() ? details.customerName.toUpperCase() : '..........................................................'}
                  </strong>
                </div>
                <div style="margin-bottom: 3px;">
                  <span style="color:#666;">İletişim / Tel:</span>
                  <strong style="color:#121415; margin-left: 4px;">
                    ${details.customerPhone && details.customerPhone.trim() ? details.customerPhone : '..........................................................'}
                  </strong>
                </div>
                <div style="margin-bottom: 3px;">
                  <span style="color:#666;">Teslimat Yöntemi:</span>
                  <strong style="color:#121415; margin-left: 4px;">
                    ${details.deliveryMethod === 'shipping' ? `🚚 Kargo ile Gönderim (Kargo: ₺${details.shippingCost || 0})` : '🏪 Mağazada Teslim'}
                  </strong>
                </div>
                <div>
                  <span style="color:#666;">Tahmini Teslim Tarihi:</span>
                  <strong style="color:#121415; margin-left: 4px;">
                    ${
                      details.deliveryDate && details.deliveryDate.trim() 
                        ? (details.deliveryDate.includes('-') 
                            ? details.deliveryDate.split('-').reverse().join('.') 
                            : details.deliveryDate)
                        : '.... / .... / 2026'
                    }
                  </strong>
                </div>
              </div>

              <!-- Üretim Durumu & Karekod -->
              <div class="info-card" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <div>
                  <div class="info-card-title">Üretim Durumu</div>
                  <div style="color: #16a34a; font-weight: 800; font-size: 11px; letter-spacing: 0.3px; margin-top: 4px;">✓ SİPARİŞ ONAYLANMIŞTIR.</div>
                </div>
                ${
                  details.qrDataUrl
                    ? `<div class="qr-section">
                        <img class="qr-img" src="${details.qrDataUrl}" alt="Karekod" />
                        <span style="font-size: 7.5px; font-family: monospace; font-weight: bold; color: #121415;">
                          KAREKODU OKUTUN
                        </span>
                       </div>`
                    : ''
                }
              </div>
            </div>

            <!-- Onay Kutucukları (Kalem ile işaretlemek için BOŞ kutucuklar) & Islak İmza -->
            <div class="grid-2" style="margin-top: 4px;">
              <div class="info-card">
                <div class="info-card-title">Sipariş Onay Kutucukları (Kalem İle İşaretleyin)</div>
                <div class="checkbox-item">
                  <span class="empty-checkbox"></span>
                  <span>Seçilen çerçeve profili, paspartu genişliği ve renkler onaylandı.</span>
                </div>
                <div class="checkbox-item">
                  <span class="empty-checkbox"></span>
                  <span>Görsel ölçüleri ile toplam dış ölçülerin doğruluğu onaylandı.</span>
                </div>
                <div class="checkbox-item">
                  <span class="empty-checkbox"></span>
                  <span>Üretim, özel işçilik ve teslimat şartları kabul edildi.</span>
                </div>
              </div>

              <div class="info-card" style="text-align: center;">
                <div class="info-card-title">Müşteri Islak İmza / Onay</div>
                <div class="signature-line"></div>
                <div style="font-size: 9px; color: #666;">İmza &amp; Kaşe</div>
              </div>
            </div>

            ${details.companyProfile?.iban ? `
              <div style="margin-top: 3px; padding: 3px 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; font-size: 8px; font-family: monospace; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
                <span><strong>Banka / IBAN:</strong> ${details.companyProfile.iban}</span>
                ${details.companyProfile.taxOffice ? `<span><strong>V.D.:</strong> ${details.companyProfile.taxOffice} (${details.companyProfile.taxNumber || '-'})</span>` : ''}
              </div>
            ` : ''}

            <!-- Alt Bilgi / Footer -->
            <div style="border-top: 1px solid #e4e4e7; padding-top: 3px; margin-top: 4px; display: flex; justify-content: flex-end; font-size: 8px; color: #888; font-family: monospace;">
              <span>${details.companyProfile?.website || 'nakkadekor.com'}</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  renderPrintHtml(`Siparis_Formu_${details.orderNumber}`, fullHtml);
}

// ==========================================
// 1D Barcode (Code 39) Pure Vector Generator
// ==========================================
export function generateBarcodeSvg(text: string, height: number = 30): string {
  const code39Map: Record<string, string> = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
    '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010'
  };

  const clean = `*${(text || 'ORD').toUpperCase().replace(/[^0-9A-Z\-\. \$\/\+\%]/g, '')}*`;
  const narrowW = 1.2;
  const wideW = 3.0;
  const gapW = 1.2;

  let x = 0;
  const rects: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const pattern = code39Map[char] || code39Map['-'];
    for (let j = 0; j < pattern.length; j++) {
      const isBar = j % 2 === 0;
      const w = pattern[j] === '1' ? wideW : narrowW;
      if (isBar) {
        rects.push(`<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${height}" fill="#000" />`);
      }
      x += w;
    }
    x += gapW;
  }

  return `<svg viewBox="0 0 ${x.toFixed(1)} ${height}" width="100%" height="${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${rects.join('')}</svg>`;
}

// ==========================================
// 60x30 MM TERMAL TABLO ARKA ETİKETİ (QR & SİPARİŞ KARTI)
// ==========================================
export interface BackLabelDetails {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  deliveryDate?: string;
  createdAt?: string;
  artworkWidthCm?: number;
  artworkWidth?: number;
  artworkHeightCm?: number;
  artworkHeight?: number;
  finalOuterWidthCm?: number;
  totalW?: number;
  finalOuterHeightCm?: number;
  totalH?: number;
  frameProfileName?: string;
  innerFrameTitle?: string;
  outerFrameTitle?: string;
  matInfo?: string;
  effectivePrice?: number;
  companyProfile?: CompanyProfile;
  qrDataUrl?: string;
  isPro?: boolean;
  authorUser?: string;
}

export async function triggerBackLabelPrintWindow(details: BackLabelDetails) {
  const companyName = details.companyProfile?.companyName || "NAKKA DEKOR";
  const hasProLogo = Boolean(details.isPro && details.companyProfile?.logoUrl);
  const currentDate = new Date().toLocaleDateString("tr-TR");
  const displayDate = details.deliveryDate || details.createdAt || currentDate;

  const safeArtW = details.artworkWidthCm ?? details.artworkWidth ?? 0;
  const safeArtH = details.artworkHeightCm ?? details.artworkHeight ?? 0;
  const safeOuterW = details.finalOuterWidthCm ?? details.totalW ?? safeArtW;
  const safeOuterH = details.finalOuterHeightCm ?? details.totalH ?? safeArtH;
  const frameName = details.frameProfileName || details.innerFrameTitle || "Standart Profil";

  // QR Kod üretimi (Verilmediyse anında yüksek çözünürlüklü üretilir)
  let qrImgSrc = details.qrDataUrl || "";
  if (!qrImgSrc) {
    try {
      const qrText = `SİPARİŞ NO: ${details.orderNumber}
MÜŞTERİ: ${details.customerName || 'Belirtilmedi'}
ESER: ${safeArtW}x${safeArtH} cm
DIŞ EBAT: ${safeOuterW.toFixed(2)}x${safeOuterH.toFixed(2)} cm
PROFİL: ${frameName}
TARİH: ${displayDate}
FİRMA: ${companyName}`;

      qrImgSrc = await QRCode.toDataURL(qrText, {
        margin: 0,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        },
        width: 280
      });
    } catch (err) {
      console.error("QR üretimi hatası:", err);
    }
  }

  // 60x30 mm Tekli Termal Etiket HTML Tasarımı (Sol: Logo + Karekod, Sağ: Sipariş No + Bilgi Kartı)
  const singleLabelHtml = `
    <div class="sticker-60x30">
      <div class="sticker-inner">
        <!-- SOL KOLON: Üstte Logo + Altta Karekod -->
        <div class="sticker-left-col">
          <div class="sticker-logo-box">
            ${hasProLogo ? `
              <img src="${details.companyProfile?.logoUrl}" alt="Logo" class="sticker-logo" />
            ` : `
              <div class="sticker-logo-text">
                <span class="logo-icon">❖</span>
                <span class="logo-title">${companyName}</span>
              </div>
            `}
          </div>
          <div class="sticker-qr-box">
            ${qrImgSrc ? `
              <img src="${qrImgSrc}" alt="QR Kod" class="sticker-qr" />
            ` : `
              <div class="qr-placeholder">QR</div>
            `}
          </div>
        </div>

        <!-- SAĞ KOLON: Üstte Sipariş No Çubuğu + Altta Müşteri, Ölçüler, Eser, Tarih -->
        <div class="sticker-right-col">
          <!-- Siyah Zeminli Sipariş No Rozeti (Bilgi Kartı Genişliğinde) -->
          <div class="sticker-ord-badge">
            <span class="ord-label">SİPARİŞ NO:</span>
            <span class="ord-val">${details.orderNumber}</span>
          </div>

          <!-- Bilgi Kartı (Müşteri, Ölçüler, Eser, Tarih) -->
          <div class="info-col">
            <div class="info-row">
              <span class="info-lbl">Müşteri:</span>
              <span class="info-val strong truncate">${details.customerName || "Belirtilmedi"}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Ölçüler:</span>
              <span class="info-val font-mono">Dış: ${safeOuterW.toFixed(2)}×${safeOuterH.toFixed(2)} cm</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Eser:</span>
              <span class="info-val font-mono truncate">${safeArtW}×${safeArtH} cm ${frameName ? `(${frameName})` : ''}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Tarih:</span>
              <span class="info-val font-mono">${displayDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // A4 Sayfada Çoklu Basım İçin (3 Sütun x 8 Satır = 24 Etiket)
  let multiGridHtml = "";
  for (let i = 0; i < 24; i++) {
    multiGridHtml += singleLabelHtml;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Termal Etiket 60x30mm - ${details.orderNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #18191c;
            color: #111;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          /* Üst Kontrol Çubuğu (Yazdırmada Gizlenir) */
          .no-print-bar {
            width: 100%;
            max-width: 620px;
            background: #111315;
            color: #fff;
            padding: 12px 18px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #C5A059;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          }
          .bar-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .bar-brand {
            color: #C5A059;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.5px;
          }
          .bar-sub {
            color: #9ca3af;
            font-size: 11px;
          }
          .print-btn {
            background: #C5A059;
            color: #000;
            font-weight: 800;
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            transition: all 0.15s ease;
          }
          .print-btn:hover {
            background: #d4af66;
            transform: translateY(-1px);
          }
          .print-mode-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          }
          .mode-btn {
            background: #252830;
            color: #d1d5db;
            border: 1px solid #373b45;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 600;
          }
          .mode-btn.active {
            background: #C5A059;
            color: #000;
            font-weight: 800;
            border-color: #C5A059;
          }

          /* Önizleme Alanı */
          .preview-stage {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .preview-label-tag {
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
          }

          /* ==========================================
             60x30 mm Kesin Termal Etiket Standartları
             ========================================== */
          .sticker-60x30 {
            width: 60mm;
            height: 30mm;
            min-width: 60mm;
            max-width: 60mm;
            min-height: 30mm;
            max-height: 30mm;
            background: #ffffff;
            color: #000000;
            padding: 1.4mm 1.6mm;
            border: 1px dashed #777;
            border-radius: 1.5mm;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            position: relative;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .sticker-inner {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: row;
            gap: 1.8mm;
            align-items: stretch;
            overflow: hidden;
          }

          /* SOL KOLON: Logo (Üstte) + Karekod (Altta) */
          .sticker-left-col {
            width: 21mm;
            min-width: 21mm;
            max-width: 21mm;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            overflow: hidden;
            flex-shrink: 0;
          }

          .sticker-logo-box {
            width: 100%;
            height: 6.2mm;
            min-height: 6.2mm;
            max-height: 6.2mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .sticker-logo {
            max-height: 6.2mm;
            max-width: 21mm;
            width: auto;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
          .sticker-logo-text {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.2mm;
            text-align: center;
            line-height: 1.1;
          }
          .logo-icon {
            font-size: 7.5pt;
            color: #C5A059;
          }
          .logo-title {
            font-size: 6.2pt;
            font-weight: 900;
            color: #18181b;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          .sticker-qr-box {
            width: 20.5mm;
            height: 20.5mm;
            min-width: 20.5mm;
            min-height: 20.5mm;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            overflow: hidden;
          }
          .sticker-qr {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            image-rendering: pixelated;
          }
          .qr-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7pt;
            font-weight: bold;
            border: 1px solid #000;
          }

          /* SAĞ KOLON: Sipariş No Çubuğu (Üstte) + Bilgi Kartı (Altta) */
          .sticker-right-col {
            flex: 1;
            height: 100%;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          /* Siyah Zeminli Sipariş No Rozeti (Sağ Bilgi Kartı Genişliğinde) */
          .sticker-ord-badge {
            width: 100%;
            height: 6.2mm;
            min-height: 6.2mm;
            max-height: 6.2mm;
            background: #000000;
            color: #ffffff;
            padding: 0 1.6mm;
            border-radius: 1mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            margin-bottom: 0.8mm;
          }
          .ord-label {
            font-size: 5.8pt;
            font-weight: 700;
            color: #d4d4d8;
            letter-spacing: 0.3px;
          }
          .ord-val {
            font-size: 7.5pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #ffffff;
            font-family: monospace, -apple-system, sans-serif;
          }

          /* Bilgi Kartı Kolonu */
          .info-col {
            width: 100%;
            flex: 1;
            min-width: 0;
            background: #f4f4f5;
            border: 0.5px solid #d4d4d8;
            border-radius: 1.2mm;
            padding: 0.6mm 1.4mm;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            overflow: hidden;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 1mm;
            white-space: nowrap;
            overflow: hidden;
            line-height: 1.25;
          }
          .info-lbl {
            color: #52525b;
            font-size: 5.4pt;
            font-weight: 500;
            flex-shrink: 0;
          }
          .info-val {
            color: #09090b;
            font-size: 5.6pt;
            font-weight: 600;
            text-overflow: ellipsis;
            overflow: hidden;
            text-align: right;
          }
          .info-val.strong {
            font-weight: 800;
            font-size: 6pt;
            color: #000000;
          }
          .font-mono {
            font-family: monospace, -apple-system, sans-serif;
          }

          /* A4 Çoklu Izgara Görünümü (3 Sütun x 8 Satır = 24 Etiket) */
          .multi-grid-container {
            display: none;
            grid-template-columns: repeat(3, 60mm);
            gap: 3mm 4mm;
            background: #fff;
            padding: 10mm;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border-radius: 4px;
            justify-content: center;
          }
          body.show-multi .multi-grid-container {
            display: grid;
          }
          body.show-multi .single-preview {
            display: none;
          }

          /* Yazıcı & Termal Etiket Çıktısı (Tam 60x30 mm) */
          @page {
            size: 60mm 30mm;
            margin: 0;
          }

          @media print {
            body {
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print-bar, .print-mode-tabs, .preview-label-tag {
              display: none !important;
            }
            .preview-stage {
              padding: 0 !important;
              margin: 0 !important;
            }
            .sticker-60x30 {
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            body.show-multi .multi-grid-container {
              display: grid !important;
              padding: 8mm 6mm !important;
              box-shadow: none !important;
              gap: 2.5mm 3.5mm !important;
            }
            body.show-multi @page {
              size: A4 portrait;
              margin: 8mm;
            }
          }
        </style>
        <script>
          function toggleMode(mode) {
            if (mode === 'multi') {
              document.body.classList.add('show-multi');
              document.getElementById('btn-single').classList.remove('active');
              document.getElementById('btn-multi').classList.add('active');
            } else {
              document.body.classList.remove('show-multi');
              document.getElementById('btn-single').classList.add('active');
              document.getElementById('btn-multi').classList.remove('active');
            }
          }
        </script>
      </head>
      <body>
        <div class="no-print-bar">
          <div class="bar-left">
            <span class="bar-brand">NAKKA DEKOR</span>
            <span class="bar-sub">• 60x30 mm Tablo Arka Termal Etiketi</span>
          </div>
          <button class="print-btn" onclick="window.print()">
            🖨️ ETİKETİ YAZDIR (PDF / TERMAL)
          </button>
        </div>

        <div class="print-mode-tabs">
          <button id="btn-single" class="mode-btn active" onclick="toggleMode('single')">
            60x30 mm Tekli Termal Etiket
          </button>
          <button id="btn-multi" class="mode-btn" onclick="toggleMode('multi')">
            A4 Sayfada Çoklu Basım (24'lü Izgara)
          </button>
        </div>

        <div class="preview-stage">
          <div class="preview-label-tag">
            30mm × 60mm rulo termal etiket veya standart kağıt için hazır format.
          </div>

          <!-- Tekli Görünüm -->
          <div class="single-preview">
            ${singleLabelHtml}
          </div>

          <!-- A4 Çoklu Görünüm -->
          <div class="multi-grid-container">
            ${multiGridHtml}
          </div>
        </div>
      </body>
    </html>
  `;

  renderPrintHtml(`Etiket_60x30_${details.orderNumber}`, fullHtml);
}

// ==========================================
// ÜRETİM EMRİ & KESİM LİSTESİ A4 YAZDIRMA
// ==========================================
export interface CuttingListPrintDetails {
  cutList: CompleteCutList;
  customerName: string;
  deliveryDate: string;
  artworkWidthCm: number;
  artworkHeightCm: number;
  companyProfile?: CompanyProfile;
}

export function triggerCuttingListPrintWindow(details: CuttingListPrintDetails) {
  const { cutList, customerName, deliveryDate, artworkWidthCm, artworkHeightCm, companyProfile } = details;

  const itemsRows = cutList.items
    .map(
      (item) => `
      <tr style="${!item.included ? 'opacity:0.35; font-style:italic; background:#fbfbfb;' : ''}">
        <td style="border:1px solid #ccc; padding:3px 6px; vertical-align:middle;">
          <div style="font-weight:bold; color:#111; font-size:10.5px; line-height:1.2;">${item.layerName}</div>
          <div style="font-size:8.5px; color:#555; line-height:1.15;">
            ${item.materialInfo}
            ${item.profileCode ? ` • <strong style="color:#000;">Profil: ${item.profileCode}</strong>` : ''}
          </div>
          ${item.notes ? `<div style="font-size:8px; color:#777; line-height:1.1; margin-top:1px;">${item.notes}</div>` : ''}
        </td>
        <td style="border:1px solid #ccc; padding:3px 6px; text-align:center; font-weight:bold; font-size:9.5px; vertical-align:middle;">
          ${item.cutAngle}
        </td>
        <td style="border:1px solid #ccc; padding:3px 6px; text-align:center; font-weight:bold; font-size:11px; font-family:monospace; vertical-align:middle;">
          ${item.pieceWidthCm.toFixed(2)} cm <span style="font-size:8px; font-weight:normal; color:#444;">(${item.quantityWidthPieces > 1 ? `${item.quantityWidthPieces} Adet` : '1 Plaka'})</span>
        </td>
        <td style="border:1px solid #ccc; padding:3px 6px; text-align:center; font-weight:bold; font-size:11px; font-family:monospace; vertical-align:middle;">
          ${item.pieceHeightCm.toFixed(2)} cm <span style="font-size:8px; font-weight:normal; color:#444;">(${item.quantityHeightPieces > 1 ? `${item.quantityHeightPieces} Adet` : '1 Plaka'})</span>
        </td>
        <td style="border:1px solid #ccc; padding:3px 6px; text-align:right; font-weight:bold; font-family:monospace; font-size:10px; vertical-align:middle;">
          ${item.totalMeterNeeded.toFixed(2)} ${item.unit || 'm²'}
        </td>
      </tr>
    `
    )
    .join("");

  const assemblyRows = cutList.assemblyInstructions
    .map(
      (step) => `
      <div style="background:#fafafa; border:1px solid #e0e0e0; padding:3.5px 7px; border-radius:3px; font-size:9px; line-height:1.2;">
        <strong>${step}</strong>
      </div>
    `
    )
    .join("");

  const contentHtml = `
    <div style="max-width:100%; page-break-inside:avoid; font-family:system-ui, -apple-system, sans-serif;">
      <!-- 1. Üst Başlık Çubuğu -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #111; padding-bottom:5px; margin-bottom:6px;">
        <div>
          <div style="font-size:15px; font-weight:bold; text-transform:uppercase; letter-spacing:0.3px; line-height:1.15;">
            ${companyProfile?.companyName || 'NAKKA DEKOR'} - ATÖLYE İŞ EMRİ & KESİM FİŞİ
          </div>
          <div style="font-size:9px; color:#555; margin-top:1px;">MARANGOZ / ÇERÇEVE USTA ÖLÇÜ BİLDİRİM FORMU</div>
        </div>
        <div style="text-align:right; font-family:monospace; line-height:1.2;">
          <div style="font-weight:bold; font-size:12px; color:#000;">SİPARİŞ NO: ${cutList.orderNumber}</div>
          <div style="font-size:9px; color:#666;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
        </div>
      </div>

      <!-- 2. Özet Bilgi Kartı (4 Kolon) -->
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; background:#f7f7f7; border:1px solid #ddd; padding:5px 8px; border-radius:3px; font-family:monospace; margin-bottom:6px;">
        <div>
          <div style="font-size:8px; color:#666; text-transform:uppercase; line-height:1;">SANAT GÖRSELİ</div>
          <div style="font-weight:bold; font-size:11px; margin-top:2px;">${artworkWidthCm} × ${artworkHeightCm} cm</div>
        </div>
        <div>
          <div style="font-size:8px; color:#666; text-transform:uppercase; line-height:1;">BİTMİŞ DIŞ ÖLÇÜ</div>
          <div style="font-weight:bold; font-size:11px; color:#b45309; margin-top:2px;">${cutList.totalOuterDimensions}</div>
        </div>
        <div>
          <div style="font-size:8px; color:#666; text-transform:uppercase; line-height:1;">MÜŞTERİ ADI</div>
          <div style="font-weight:bold; font-size:11px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:2px;">${customerName || "—"}</div>
        </div>
        <div>
          <div style="font-size:8px; color:#666; text-transform:uppercase; line-height:1;">TESLİM TARİHİ</div>
          <div style="font-weight:bold; font-size:11px; margin-top:2px;">${deliveryDate || "—"}</div>
        </div>
      </div>

      <!-- 3. Katman Katman Kesim Ölçüleri Tablosu -->
      <h3 style="font-size:10px; font-family:monospace; margin-bottom:3px; text-transform:uppercase; border-left:3px solid #C5A059; padding-left:6px; line-height:1.2;">
        Katman Katman Kesim Ölçüleri Tablosu
      </h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom:6px; font-family:monospace; font-size:9.5px;">
        <thead>
          <tr style="background:#e8e8e8;">
            <th style="border:1px solid #ccc; padding:3px 5px; text-align:left; font-size:8.5px;">KATMAN / PARÇA</th>
            <th style="border:1px solid #ccc; padding:3px 5px; text-align:center; font-size:8.5px;">KESİM AÇISI</th>
            <th style="border:1px solid #ccc; padding:3px 5px; text-align:center; font-size:8.5px;">EN BOYU (2x)</th>
            <th style="border:1px solid #ccc; padding:3px 5px; text-align:center; font-size:8.5px;">BOY BOYU (2x)</th>
            <th style="border:1px solid #ccc; padding:3px 5px; text-align:right; font-size:8.5px;">SARFİYAT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- 4. Atölye Montaj Sıralaması -->
      <h3 style="font-size:10px; font-family:monospace; margin-bottom:3px; text-transform:uppercase; border-left:3px solid #C5A059; padding-left:6px; line-height:1.2;">
        Atölye Montaj Sıralaması
      </h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:3.5px; margin-bottom:8px; font-family:sans-serif;">
        ${assemblyRows}
      </div>

      <!-- 5. İmza & Onay Satırı -->
      <div style="border-top:1px dashed #777; padding-top:5px; display:flex; justify-content:space-between; font-size:9px; font-family:monospace; line-height:1.2;">
        <div>
          <span>Kesim Yapan Usta: ________________________</span>
        </div>
        <div>
          <span>Montaj & Kontrol: ________________________</span>
        </div>
        <div>
          <span>Tarih: ${new Date().toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
    </div>
  `;

  triggerPrintWindow(`Uretim_Emri_${cutList.orderNumber}`, contentHtml);
}

// ==========================================
// MALİYET & FİNANSAL TABLO A4 YAZDIRMA
// ==========================================
export interface CostBreakdownPrintDetails {
  breakdown: CostCalculationBreakdown;
  settings: UnitPricesSettings;
  artworkWidthCm: number;
  artworkHeightCm: number;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  flags: MaterialInclusionFlags;
  companyProfile?: CompanyProfile;
}

export function triggerCostBreakdownPrintWindow(details: CostBreakdownPrintDetails) {
  const { breakdown, settings, artworkWidthCm, artworkHeightCm, orderNumber, customerName, deliveryDate, flags, companyProfile } = details;

  const contentHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px;">
      <div>
        <div style="font-size:20px; font-weight:bold; text-transform:uppercase;">
          ${companyProfile?.companyName || 'NAKKA DEKOR'}
        </div>
        <div style="font-size:12px; color:#555;">SİPARİŞ MALİYET ANALİZİ & FİNANSAL DÖKÜM BELGESİ</div>
      </div>
      <div style="text-align:right; font-family:monospace;">
        <div style="font-weight:bold; font-size:15px;">SİPARİŞ NO: #${orderNumber}</div>
        <div style="font-size:11px; color:#666;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; background:#f9f9f9; padding:12px; border:1px solid #ddd; border-radius:4px; font-size:12px; margin-bottom:20px; font-family:monospace;">
      <div><strong>Müşteri Adı:</strong> ${customerName || "Belirtilmedi"}</div>
      <div><strong>Teslim Tarihi:</strong> ${deliveryDate || "Normal"}</div>
      <div><strong>Eser Ölçüsü:</strong> ${artworkWidthCm} × ${artworkHeightCm} cm</div>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; font-family:monospace;">
      <thead>
        <tr style="background-color:#f2f2f2;">
          <th style="border:1px solid #ccc; padding:8px; text-align:left;">MALZEME / HİZMET</th>
          <th style="border:1px solid #ccc; padding:8px; text-align:left;">DURUM</th>
          <th style="border:1px solid #ccc; padding:8px; text-align:left;">MİKTAR</th>
          <th style="border:1px solid #ccc; padding:8px; text-align:right;">BİRİM FİYAT</th>
          <th style="border:1px solid #ccc; padding:8px; text-align:right;">TUTAR (₺)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">Kanvas / Tuval Baskı</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeArtworkPrint ? "Dahil" : "Müşteriden (Hariç)"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.artworkSqm ?? 0).toFixed(3)} m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₺${settings.canvasPrintPricePerSqm}/m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.artworkCost ?? 0).toFixed(2)}</td>
        </tr>
        ${(breakdown.innerMatSqm ?? 0) > 0 ? `
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">İç Paspartu Kartonu</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeInnerMat ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.innerMatSqm ?? 0).toFixed(3)} m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₺${breakdown.innerMatUnitPrice ?? settings.matBoardPricePerSqm}/m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.innerMatCost ?? 0).toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">Ana Çerçeve Profili</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeInnerFrame ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.innerFrameMeter ?? 0).toFixed(2)} mt</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">Metre Tül</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.innerFrameCost ?? 0).toFixed(2)}</td>
        </tr>
        ${(breakdown.middleMatSqm ?? 0) > 0 ? `
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">3D Ara Paspartu</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeMiddleMat ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.middleMatSqm ?? 0).toFixed(3)} m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₺${breakdown.middleMatUnitPrice ?? settings.middleMatBoardPricePerSqm}/m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.middleMatCost ?? 0).toFixed(2)}</td>
        </tr>` : ''}
        ${(breakdown.outerFrameMeter ?? 0) > 0 ? `
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">Dış Kasa Çerçeve Profili</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeOuterFrame ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.outerFrameMeter ?? 0).toFixed(2)} mt</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">Metre Tül</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.outerFrameCost ?? 0).toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">Koruyucu Cam / Pleksi</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeGlass ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.glassBackingSqm ?? 0).toFixed(3)} m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₺${settings.glassPricePerSqm}/m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.glassCost ?? 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">3mm MDF Arka Kapama</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeBackingBoard ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.glassBackingSqm ?? 0).toFixed(3)} m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₺${settings.backingBoardPricePerSqm}/m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.backingBoardCost ?? 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">Arkalık Koruma Bezi</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeBackingCloth || flags.includeBackingPaper ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">${(breakdown.backingClothSqm ?? 0).toFixed(3)} m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₺${settings.backingClothPricePerSqm ?? 90}/m²</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.backingClothCost ?? 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">Atölye Sabit El İşçiliği</td>
          <td style="border:1px solid #ccc; padding:8px;">${flags.includeLaborCost ? "Dahil" : "Hariç"}</td>
          <td style="border:1px solid #ccc; padding:8px;">1 Adet</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">₺${settings.laborFixedCost}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">₺${(breakdown.laborCost ?? 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc; padding:8px; color:#b45309;">Atölye Kesim / Atık File Payı (%${settings.wastePercentage})</td>
          <td style="border:1px solid #ccc; padding:8px;">Dahil</td>
          <td style="border:1px solid #ccc; padding:8px;">Oransal</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">%${settings.wastePercentage}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold; color:#b45309;">₺${(breakdown.wasteCost ?? 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:20px; display:flex; justify-content:flex-end;">
      <div style="width:340px; background:#f9f9f9; border:1px solid #ccc; padding:15px; border-radius:4px; font-family:monospace; font-size:12px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span>Toplam Net Maliyet:</span>
          <span>₺${(breakdown.totalDirectCost ?? 0).toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#15803d;">
          <span>Uygulanan Kâr Marjı:</span>
          <span>%${settings.targetProfitMarginPercent}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span>Ara Toplam (KDV Hariç):</span>
          <span>₺${(breakdown.calculatedPriceBeforeVat ?? 0).toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:#555;">
          <span>KDV Tutarı (%${settings.vatRatePercent}):</span>
          <span>₺${(breakdown.vatAmount ?? 0).toFixed(2)}</span>
        </div>
        ${breakdown.shippingCost > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:#2563eb;">
          <span>Kargo & Sevk Ücreti:</span>
          <span>₺${breakdown.shippingCost.toFixed(2)}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; border-top:2px solid #000; padding-top:8px;">
          <span>GENEL SATIŞ TUTARI:</span>
          <span style="color:#b45309;">₺${(breakdown.effectiveFinalPriceWithVat ?? 0).toLocaleString('tr-TR')}</span>
        </div>
      </div>
    </div>
  `;

  triggerPrintWindow(`Maliyet_Tablosu_${orderNumber}`, contentHtml);
}



