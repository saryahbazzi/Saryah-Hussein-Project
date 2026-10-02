import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const paletteSchema = z.object({ bg: hex, ink: hex, accent: hex, frame: hex });

export const adaptRequestSchema = z.object({
  theme: z.string().trim().min(2).max(300),
  locale: z.enum(["ar", "en"]),
  template: z.object({ slug: z.string().max(80), palette: paletteSchema }),
  hosts: z.string().max(120).optional().default(""),
  headline: z.string().max(120).optional().default(""),
});
export type AdaptRequest = z.infer<typeof adaptRequestSchema>;

export const adaptResultSchema = z.object({
  palette: paletteSchema,
  headline: z.string().trim().min(1).max(80),
  message: z.string().trim().max(200).default(""),
  fonts: z.object({ display: z.string().max(60), body: z.string().max(60) }).optional(),
  rationale: z.string().trim().max(300).default(""),
});
export type AdaptResult = z.infer<typeof adaptResultSchema>;
export type AdaptResponse = AdaptResult & { source: "ai" | "stub" };
