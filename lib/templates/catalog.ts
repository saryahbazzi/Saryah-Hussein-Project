/**
 * Visual specs for invitation cards. In milestone 3 these move to the
 * `templates` table (spec jsonb); the renderer consumes the same shape.
 */
export type Occasion = "wedding" | "engagement" | "birthday" | "dinner" | "party";
export type TemplateStyle = "classic" | "modern" | "najdi" | "floral";

export interface CardSpec {
  slug: string;
  occasion: Occasion;
  style: TemplateStyle;
  kind: "static" | "animated" | "video";
  palette: { bg: string; ink: string; accent: string; frame: string };
}

export const OCCASIONS: Occasion[] = ["wedding", "engagement", "birthday", "dinner", "party"];

export const SAMPLE_CARDS: CardSpec[] = [
  { slug: "royal-navy-gold", occasion: "wedding", style: "classic", kind: "animated",
    palette: { bg: "#14213d", ink: "#fbf7ef", accent: "#d9b061", frame: "#d9b061" } },
  { slug: "ivory-najdi", occasion: "engagement", style: "najdi", kind: "static",
    palette: { bg: "#f6ecd9", ink: "#2a1f17", accent: "#9a4a45", frame: "#b8893b" } },
  { slug: "garden-sage", occasion: "birthday", style: "floral", kind: "static",
    palette: { bg: "#e6ece3", ink: "#25392b", accent: "#4f6b57", frame: "#4f6b57" } },
  { slug: "midnight-dinner", occasion: "dinner", style: "modern", kind: "static",
    palette: { bg: "#241a14", ink: "#f2e9d8", accent: "#d9b061", frame: "#5b4a3c" } },
  { slug: "rose-celebration", occasion: "party", style: "modern", kind: "video",
    palette: { bg: "#f3dcd6", ink: "#4a1f1c", accent: "#9a4a45", frame: "#9a4a45" } },
];
