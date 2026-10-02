import { describe, expect, it } from "vitest";
import { formatSaudiMobile, normalizeSaudiMobile } from "@/lib/phone/saudi";

describe("normalizeSaudiMobile", () => {
  it.each([
    ["0501234567", "+966501234567"],
    ["501234567", "+966501234567"],
    ["+966 50 123 4567", "+966501234567"],
    ["966501234567", "+966501234567"],
    ["00966501234567", "+966501234567"],
    ["+966 (0) 50-123-4567", "+966501234567"],
    ["٠٥٠١٢٣٤٥٦٧", "+966501234567"],
    ["+٩٦٦٥٥٥٥٥٥٥٥٥", "+966555555555"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeSaudiMobile(input)).toBe(expected);
  });

  it.each(["", "0112345678", "+971501234567", "05012345", "05012345678", "abc", "+966401234567"])(
    "rejects %s",
    (input) => {
      expect(normalizeSaudiMobile(input)).toBeNull();
    },
  );

  it("formats for display", () => {
    expect(formatSaudiMobile("+966501234567")).toBe("+966 50 123 4567");
  });
});
