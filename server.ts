import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API for Gemini Call with standard prompt structures
app.post("/api/gemini/suggest-prompt", async (req, res) => {
  try {
    const { 
      artworkDescription, 
      artworkSize, 
      frameStyle,
      frameWidth, 
      backgroundType,
      customDetails
    } = req.body;

    const ai = getGeminiClient();
    
    // Check if key is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      const fallbackPromptEn = `A professional interior design mockup. A high-quality art canvas (${artworkSize} cm) showcasing "${artworkDescription || 'art piece'}", enclosed in a luxurious, ${frameWidth} cm thick ${frameStyle} frame. Set against a beautiful, ${backgroundType} wall background with elegant soft lighting, studio shadows, detailed frame textures, and realistic depth of field.`;
      
      const fallbackPromptTr = `Profesyonel bir iç mekan tasarım maketi (mockup). "${artworkDescription || 'sanat eseri'}" tablosu (${artworkSize} cm), lüks ${frameWidth} cm kalınlığında ${frameStyle} çerçeve ile çevrelenmiş. Şık bir ${backgroundType} duvar arka planı önünde, zarif yumuşak aydınlatma, stüdyo gölgeleri, gerçekçi çerçeve dokuları ve derinlik hissiyle sergileniyor.`;

      return res.json({
        success: true,
        aiGenerated: false,
        promptEn: fallbackPromptEn,
        promptTr: fallbackPromptTr,
        designTips: [
          "Sanat eserinizin rengi ile çerçeve tonunun kontrast oluşturmasına özen gösterin.",
          "Etnik ve klasik eserlerde varaklı, oymalı kalın profilli çerçeveler (çapraz köşeli) rüstik bir hava katacaktır.",
          "Modern ve soyut sanatta ince mat siyah, beyaz veya doğal ahşap profiller eserin önüne geçmeden derinlik sağlar.",
          "Mekandaki aydınlatma lambasının açısı, çerçevenin duvarda oluşturacağı gölge derinliğini etkiler."
        ]
      });
    }

    const systemInstruction = `Sen profesyonel bir sanat küratörü, iç mimar ve yapay zeka görsel tasarım promptu uzmanısın (Midjourney, DALL-E 3, Stable Diffusion). 
Kullanıcının seçtiği tablo, ölçü, çerçeve tipi ve duracağı oda arka planına göre hem İngilizce hem Türkçe göz alıcı, ultra detaylı 3D/Fotogerçekçi görsel üretme promptları hazırlamalısın.
Ayrıca, kullanıcıya bu kombinasyonu kusursuz şekilde sergilemesi için çerçeveleme oranları, ışıklandırma ve renk uyumu konusunda 3-4 adet hap tavsiye ver.`;

    const userPrompt = `Aşağıdaki özelliklere sahip tablo ve çerçeve kombinasyonu için Midjourney/DALL-E 3 görsel üretim promptu oluştur:
- Tablo Görseli Tanımı: ${artworkDescription || 'Bir Sanat Eseri / Tablo'}
- Tablo Ölçüsü (Genişlik x Yükseklik): ${artworkSize} cm
- Çerçeve Görseli / Stili: ${frameStyle}
- Çerçeve Genişliği/Profil Kalınlığı: ${frameWidth} cm
- Arkaplan Ortamı: ${backgroundType}
- Ekstra Mimari Detaylar: ${customDetails || 'Boş'}

Lütfen yanıtını şu yapıda JSON olarak dön:
{
  "promptEn": "Görsel üretmek için Midjourney veya Stable Diffusion için ingilizce prompt (başında photorealistic, interior design mockup... gibi profesyonel anahtar kelimeler içersin)",
  "promptTr": "Görsel üretmek için Türkçe prompt",
  "designTips": ["tavsiye 1", "tavsiye 2", "tavsiye 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      aiGenerated: true,
      ...parsedData
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "An error occurred while generating suggestions." 
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Wrap express boot process in an async start function to avoid top-level await in esbuild transpile
async function bootstrap() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server boot failure:", err);
});
