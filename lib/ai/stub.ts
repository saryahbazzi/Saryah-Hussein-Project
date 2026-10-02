import { getTemplate, type Palette } from "@/lib/templates/catalog";
import { ensureContrast, isDark } from "./contrast";
import type { AdaptRequest, AdaptResult } from "./schema";

/** Deterministic, keyword-driven stand-in for the AI call (also the fallback when the API is off or fails). */

interface Base { bg: string; ink: string; light: string; dark: string }
const BASES = {
  navy: { bg: "#14213d", ink: "#fbf7ef", light: "#14213d", dark: "#14213d" },
  emerald: { bg: "#17352b", ink: "#f7f1e3", light: "#17352b", dark: "#17352b" },
  rose: { bg: "#f3dcd6", ink: "#4a1f1c", light: "#f3dcd6", dark: "#f3dcd6" },
  sand: { bg: "#f2e9d8", ink: "#2a1f17", light: "#f2e9d8", dark: "#f2e9d8" },
  black: { bg: "#121212", ink: "#f5f1e8", light: "#121212", dark: "#121212" },
  ivory: { bg: "#fbf7ef", ink: "#14213d", light: "#fbf7ef", dark: "#fbf7ef" },
} satisfies Record<string, Base>;
type ColorName = keyof typeof BASES | "gold";

/** Accent used when a colour word names the accent rather than the background. */
const ACCENTS: Record<ColorName, { onDark: string; onLight: string }> = {
  gold: { onDark: "#d9b061", onLight: "#7d5a17" },
  navy: { onDark: "#9fb3d9", onLight: "#14213d" },
  emerald: { onDark: "#8fbf9f", onLight: "#2f5a45" },
  rose: { onDark: "#e8b4a0", onLight: "#9a4a45" },
  sand: { onDark: "#e7d9bd", onLight: "#7d5a17" },
  black: { onDark: "#f5f1e8", onLight: "#121212" },
  ivory: { onDark: "#fbf7ef", onLight: "#14213d" },
};

const KEYWORDS: [ColorName, string[]][] = [
  ["navy", ["navy", "midnight blue", "dark blue", "كحلي", "نيلي"]],
  ["gold", ["gold", "golden", "ذهبي", "ذهب", "دهبي"]],
  ["emerald", ["emerald", "green", "sage", "زمردي", "زمرد", "اخضر", "خضراء", "اخضر"]],
  ["rose", ["rose", "blush", "pink", "وردي", "زهري", "بلاش"]],
  ["sand", ["sand", "beige", "cream", "رملي", "بيج", "كريمي"]],
  ["black", ["black", "charcoal", "اسود", "فحمي"]],
  ["ivory", ["ivory", "white", "ابيض", "عاجي"]],
];

const norm = (s: string) =>
  s.toLowerCase().replace(/[ً-ٰٟـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");

function findColors(theme: string): ColorName[] {
  const t = norm(theme);
  const hits: { name: ColorName; at: number }[] = [];
  for (const [name, words] of KEYWORDS) {
    const at = Math.min(...words.map((w) => { const i = t.indexOf(norm(w)); return i < 0 ? Infinity : i; }));
    if (Number.isFinite(at)) hits.push({ name, at });
  }
  return hits.sort((a, b) => a.at - b.at).map((h) => h.name);
}

const has = (theme: string, words: string[]) => { const t = norm(theme); return words.some((w) => t.includes(norm(w))); };

const COPY = {
  ar: {
    headline: { wedding: "ندعوكم لمشاركتنا فرحة العمر", engagement: "يسعدنا دعوتكم لحفل خطوبتنا", birthday: "تعالوا نحتفل معًا", dinner: "ندعوكم إلى مائدتنا", party: "ليلة لا تُنسى بانتظاركم" },
    message: { wedding: "بقلوب يملؤها الفرح، نتشرف بحضوركم ومشاركتنا هذه الليلة الجميلة.", engagement: "بحضوركم تكتمل فرحتنا، ننتظركم بكل محبة.", birthday: "حضوركم هو أجمل هدية، لا تتأخروا علينا.", dinner: "أمسية دافئة وعشاء يليق بكم، يسعدنا أن تكونوا معنا.", party: "موسيقى وضحكات وأجواء تجمعنا، ننتظركم." },
    rationale: (colors: string, style: string) => `اخترنا ${colors}${style ? ` مع ${style}` : ""} مع تباين واضح لسهولة قراءة النص.`,
    najdi: "طابع نجدي", floral: "لمسة زهرية", plain: "ألوان متناسقة مع قالبك",
  },
  en: {
    headline: { wedding: "Join us for the celebration of a lifetime", engagement: "You are invited to our engagement", birthday: "Come celebrate with us", dinner: "An evening at our table", party: "A night to remember awaits" },
    message: { wedding: "With hearts full of joy, we would be honored by your presence.", engagement: "Your presence completes our joy. We look forward to seeing you.", birthday: "Your company is the best gift. Don't be late!", dinner: "A warm evening and a dinner worthy of you. Join us.", party: "Music, laughter and good company. See you there." },
    rationale: (colors: string, style: string) => `We chose ${colors}${style ? ` with ${style}` : ""}, keeping strong contrast so the text stays easy to read.`,
    najdi: "a Najdi feel", floral: "a floral touch", plain: "colours that match your template",
  },
} as const;

const COLOR_LABEL: Record<"ar" | "en", Record<ColorName, string>> = {
  ar: { navy: "الكحلي", gold: "الذهبي", emerald: "الزمردي", rose: "الوردي", sand: "الرملي", black: "الأسود", ivory: "العاجي" },
  en: { navy: "navy", gold: "gold", emerald: "emerald", rose: "rose", sand: "sand", black: "black", ivory: "ivory" },
};

export function adaptStub(req: AdaptRequest): AdaptResult {
  const { theme, locale, template } = req;
  const spec = getTemplate(template.slug);
  const occasion = spec?.occasion ?? "wedding";
  const najdi = has(theme, ["najdi", "نجدي"]);
  const floral = has(theme, ["floral", "flower", "زهور", "ورود", "ورد"]);
  const colors = findColors(theme);

  const bgName = colors.find((c) => c !== "gold");
  let palette: Palette = template.palette;
  const used: ColorName[] = [];

  if (bgName) {
    const b = BASES[bgName];
    const accentName = colors.includes("gold") ? "gold" : colors.find((c) => c !== bgName) ?? undefined;
    const dark = isDark(b.bg);
    const accent = accentName ? ACCENTS[accentName][dark ? "onDark" : "onLight"] : ACCENTS[dark ? "gold" : bgName === "rose" ? "rose" : "gold"][dark ? "onDark" : "onLight"];
    palette = { bg: b.bg, ink: b.ink, accent, frame: accent };
    used.push(bgName);
    if (accentName) used.push(accentName);
  } else if (colors.includes("gold")) {
    const a = ACCENTS.gold.onLight;
    palette = { bg: BASES.ivory.bg, ink: BASES.ivory.ink, accent: a, frame: "#b8893b" };
    used.push("gold");
  } else if (najdi) {
    palette = { bg: "#f6ecd9", ink: "#2a1f17", accent: "#9a4a45", frame: "#b8893b" };
  } else if (floral) {
    palette = { bg: "#f3dcd6", ink: "#4a1f1c", accent: "#9a4a45", frame: "#9a4a45" };
  }
  palette = { ...palette, ink: ensureContrast(palette.bg, palette.ink) };

  const copy = COPY[locale];
  const styleLabel = najdi ? copy.najdi : floral ? copy.floral : "";
  const sep = locale === "ar" ? " و" : " and ";
  const colorText = used.length ? used.map((c) => COLOR_LABEL[locale][c]).join(sep) : copy.plain;
  const fonts = najdi || locale === "ar"
    ? { display: "Amiri", body: "IBM Plex Sans Arabic" }
    : { display: "Cormorant Garamond", body: "IBM Plex Sans Arabic" };

  return {
    palette,
    headline: copy.headline[occasion],
    message: copy.message[occasion],
    fonts,
    rationale: copy.rationale(colorText, styleLabel),
  };
}
