import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

const keys = (o: unknown, p = ""): string[] =>
  typeof o === "object" && o !== null
    ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k))
    : [p];

describe("translations", () => {
  it("ar and en have identical keys", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
});
