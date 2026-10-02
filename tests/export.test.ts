import { describe, expect, it } from "vitest";
import { buildGuestCsv, csvCell } from "@/lib/guests/export";
import type { DemoGuest } from "@/lib/demo/types";

const guest = (over: Partial<DemoGuest> = {}): DemoGuest => ({
  id: "g1", eventId: "e1", name: "Fahad", phone: "+966501234567", partySize: 2, status: "confirmed",
  consentAt: "2026-01-01T00:00:00.000Z", consentSource: "host_attested", ...over,
});

describe("guest CSV export", () => {
  it("starts with a UTF-8 BOM and uses CRLF line endings", () => {
    const csv = buildGuestCsv([guest()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\r\n")).toHaveLength(3); // header, row, trailing empty
  });
  it("has the expected columns and values", () => {
    const [header, row] = buildGuestCsv([guest({ sentAt: "2026-01-02T00:00:00.000Z" })]).slice(1).split("\r\n");
    expect(header.split(",")).toHaveLength(10);
    expect(row).toBe("Fahad,+966501234567,2,confirmed,2026-01-02T00:00:00.000Z,,,,host_attested,2026-01-01T00:00:00.000Z");
  });
  it("accepts localized header labels", () => {
    expect(buildGuestCsv([], { name: "الاسم" }).slice(1).startsWith("الاسم,phone")).toBe(true);
  });
  it("quotes commas, quotes and newlines (RFC 4180)", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell("plain")).toBe("plain");
  });
  it("keeps Arabic text intact", () => {
    expect(buildGuestCsv([guest({ name: "عبدالله العتيبي" })])).toContain("عبدالله العتيبي,+966501234567");
  });
  it("neutralises formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("=1,2")).toBe(`"'=1,2"`);
    expect(buildGuestCsv([guest({ name: "=HYPERLINK(\"x\")" })])).toContain(`"'=HYPERLINK(""x"")"`);
  });
  it("leaves plain Saudi phone numbers untouched in the phone column", () => {
    expect(csvCell("+966501234567", { allowPlus: true })).toBe("+966501234567");
    expect(csvCell("+1+2", { allowPlus: true })).toBe("'+1+2");
  });
  it("renders numbers and empties", () => {
    expect(csvCell(0)).toBe("0");
    expect(csvCell(undefined)).toBe("");
  });
});
