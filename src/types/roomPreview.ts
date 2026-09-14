export interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  url: string;
}

export const DEFAULT_ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "modern-sofa",
    name: "Modern Salon",
    description: "Krem Koltuk & Aydınlık Geniş Duvar",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "scandi-grey",
    name: "Minimalist Salon",
    description: "Gri Koltuk & Nötr İskandinav Duvar",
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "classic-console",
    name: "Konsol Üstü",
    description: "Ahşap Konsol & Şık Antre Duvarı",
    url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "boho-living",
    name: "Sıcak Yaşam Alanı",
    description: "Zümrüt Yeşili Koltuk & Bohem Mekan",
    url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop"
  }
];
