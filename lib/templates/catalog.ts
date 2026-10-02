/**
 * Visual specs for invitation cards. In the real build these live in the `templates` table
 * (spec jsonb); the renderer consumes the same shape.
 */
export type Occasion = "wedding" | "engagement" | "birthday" | "dinner" | "party";
export type TemplateStyle = "classic" | "modern" | "najdi" | "floral";
export type TemplateKind = "static" | "animated" | "video";
export type Motif = "star" | "arch" | "floral" | "lines" | "dots";

export interface Palette { bg: string; ink: string; accent: string; frame: string }

export interface CardSpec {
  slug: string;
  occasion: Occasion;
  style: TemplateStyle;
  kind: TemplateKind;
  motif: Motif;
  palette: Palette;
  name: { ar: string; en: string };
}

export const OCCASIONS: Occasion[] = ["wedding", "engagement", "birthday", "dinner", "party"];
export const STYLES: TemplateStyle[] = ["classic", "modern", "najdi", "floral"];

/** Animated and video templates are the premium tier. */
export const tierOf = (kind: TemplateKind) => (kind === "static" ? "standard" : "premium") as "standard" | "premium";

export const TEMPLATES: CardSpec[] = [
  { slug: "royal-navy-gold", occasion: "wedding", style: "classic", kind: "animated", motif: "star",
    palette: { bg: "#14213d", ink: "#fbf7ef", accent: "#d9b061", frame: "#d9b061" },
    name: { ar: "كحلي وذهبي ملكي", en: "Royal Navy & Gold" } },
  { slug: "ivory-najdi", occasion: "wedding", style: "najdi", kind: "static", motif: "lines",
    palette: { bg: "#f6ecd9", ink: "#2a1f17", accent: "#9a4a45", frame: "#b8893b" },
    name: { ar: "نجدي عاجي", en: "Ivory Najdi" } },
  { slug: "emerald-arch", occasion: "wedding", style: "modern", kind: "video", motif: "arch",
    palette: { bg: "#17352b", ink: "#f7f1e3", accent: "#d9b061", frame: "#d9b061" },
    name: { ar: "قوس الزمرد", en: "Emerald Arch" } },
  { slug: "blush-engagement", occasion: "engagement", style: "floral", kind: "static", motif: "floral",
    palette: { bg: "#f3dcd6", ink: "#4a1f1c", accent: "#9a4a45", frame: "#9a4a45" },
    name: { ar: "خطوبة وردية", en: "Blush Engagement" } },
  { slug: "golden-ring", occasion: "engagement", style: "modern", kind: "video", motif: "dots",
    palette: { bg: "#241a14", ink: "#f2e9d8", accent: "#d9b061", frame: "#5b4a3c" },
    name: { ar: "الخاتم الذهبي", en: "Golden Ring" } },
  { slug: "garden-sage", occasion: "birthday", style: "floral", kind: "static", motif: "floral",
    palette: { bg: "#e6ece3", ink: "#25392b", accent: "#4f6b57", frame: "#4f6b57" },
    name: { ar: "حديقة المريمية", en: "Garden Sage" } },
  { slug: "confetti-night", occasion: "birthday", style: "modern", kind: "animated", motif: "dots",
    palette: { bg: "#14213d", ink: "#fbf7ef", accent: "#e8b4a0", frame: "#243659" },
    name: { ar: "ليلة الكونفيتي", en: "Confetti Night" } },
  { slug: "midnight-dinner", occasion: "dinner", style: "modern", kind: "static", motif: "lines",
    palette: { bg: "#241a14", ink: "#f2e9d8", accent: "#d9b061", frame: "#5b4a3c" },
    name: { ar: "عشاء منتصف الليل", en: "Midnight Dinner" } },
  { slug: "sand-table", occasion: "dinner", style: "classic", kind: "static", motif: "arch",
    palette: { bg: "#f2e9d8", ink: "#2a1f17", accent: "#7d5a17", frame: "#b8893b" },
    name: { ar: "مائدة الرمال", en: "Sand Table" } },
  { slug: "rose-celebration", occasion: "party", style: "modern", kind: "video", motif: "dots",
    palette: { bg: "#f3dcd6", ink: "#4a1f1c", accent: "#9a4a45", frame: "#9a4a45" },
    name: { ar: "احتفال وردي", en: "Rose Celebration" } },
  { slug: "gold-sparkle", occasion: "party", style: "classic", kind: "static", motif: "star",
    palette: { bg: "#fbf7ef", ink: "#14213d", accent: "#b8893b", frame: "#b8893b" },
    name: { ar: "لمعة ذهبية", en: "Gold Sparkle" } },
];

export const SAMPLE_CARDS = [TEMPLATES[0], TEMPLATES[1], TEMPLATES[5], TEMPLATES[7], TEMPLATES[8]];

export const getTemplate = (slug: string) => TEMPLATES.find((t) => t.slug === slug);
