import { describe, expect, it } from "vitest";
import { classifyHeader, parseGuestRows, parseGuestText, reviewGuests, sampleCsv, isUsable } from "@/lib/guests/parse";

describe("classifyHeader", () => {
  it("detects English and Arabic headers", () => {
    expect(classifyHeader("Name")).toBe("name");
    expect(classifyHeader("الاسم")).toBe("name");
    expect(classifyHeader("اسم الضيف")).toBe("name");
    expect(classifyHeader("Mobile")).toBe("phone");
    expect(classifyHeader("جوال")).toBe("phone");
    expect(classifyHeader("رقم الجوال")).toBe("phone");
    expect(classifyHeader("Number of guests")).toBe("size");
    expect(classifyHeader("عدد")).toBe("size");
    expect(classifyHeader("notes")).toBeNull();
  });
});

describe("parseGuestText", () => {
  it("parses a BOM-prefixed Arabic CSV", () => {
    const r = parseGuestText(sampleCsv("ar"));
    expect(r.headerDetected).toBe(true);
    expect(r.rows).toHaveLength(3);
    expect(r.rows.every(isUsable)).toBe(true);
    expect(r.rows[0]).toMatchObject({ name: "محمد العتيبي", e164: "+966501234567", partySize: 2 });
  });
  it("handles semicolon and tab delimiters", () => {
    expect(parseGuestText("name;phone\nAli;0501234567").rows[0].e164).toBe("+966501234567");
    expect(parseGuestText("name\tphone\nAli\t0501234567").rows[0].e164).toBe("+966501234567");
  });
  it("handles Arabic-Indic digits", () => {
    const r = parseGuestText("الاسم,الجوال,عدد\nسعد,٠٥٠١٢٣٤٥٦٧,٣");
    expect(r.rows[0]).toMatchObject({ e164: "+966501234567", partySize: 3 });
  });
  it("works without a header, any column order", () => {
    const r = parseGuestText("0501234567,Ali\n0559876543,Sara");
    expect(r.headerDetected).toBe(false);
    expect(r.rows.map((x) => x.name)).toEqual(["Ali", "Sara"]);
    expect(r.rows.every(isUsable)).toBe(true);
  });
  it("skips blank lines", () => {
    expect(parseGuestText("name,phone\n\nAli,0501234567\n,\n").rows).toHaveLength(1);
  });
});

describe("parseGuestRows (Excel-style cells)", () => {
  it("accepts numeric phone cells missing the leading 0", () => {
    const r = parseGuestRows([["Name", "Phone"], ["Ali", 501234567], ["Sara", 966559876543]]);
    expect(r.rows[0].e164).toBe("+966501234567");
    expect(r.rows[1].e164).toBe("+966559876543");
  });
  it("flags invalid, duplicate and missing-name rows", () => {
    const r = parseGuestRows([
      ["name", "phone"],
      ["Ali", "0501234567"],
      ["Ali again", "+966 50 123 4567"],
      ["Bad", "12345"],
      ["", "0559876543"],
    ]);
    expect(r.rows.map((x) => x.issues)).toEqual([[], ["duplicate"], ["invalid_phone"], ["missing_name"]]);
  });
  it("returns nothing for empty input", () => {
    expect(parseGuestRows([]).rows).toEqual([]);
    expect(parseGuestRows([[], ["", ""]]).rows).toEqual([]);
  });
  it("clamps party size and defaults to 1", () => {
    const r = parseGuestRows([["name", "phone", "guests"], ["A", "0501234567", "abc"], ["B", "0559876543", 99]]);
    expect(r.rows.map((x) => x.partySize)).toEqual([1, 20]);
  });
});

describe("reviewGuests", () => {
  it("re-evaluates duplicates after an edit", () => {
    const first = reviewGuests([{ name: "A", phone: "0501234567", partySize: 1 }, { name: "B", phone: "0501234567", partySize: 1 }]);
    expect(first[1].issues).toContain("duplicate");
    const fixed = reviewGuests([first[0], { ...first[1], phone: "0559876543" }]);
    expect(fixed.every(isUsable)).toBe(true);
  });
});
