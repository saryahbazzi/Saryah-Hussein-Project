import { describe, expect, it } from "vitest";
import { bucketOf, daysUntil, expectedPeople, fileSlug, lastActivity, percent } from "@/components/dashboard/event-utils";
import type { DemoGuest } from "@/lib/demo/types";

const NOW = Date.parse("2026-05-01T10:00:00Z"); // 13:00 Riyadh

describe("dashboard utils", () => {
  it("counts calendar days in Riyadh time", () => {
    expect(daysUntil("2026-05-01T20:30:00Z", NOW)).toBe(0); // 23:30 Riyadh, same day
  });
  it("is zero for later the same Riyadh day and negative for the past", () => {
    expect(daysUntil("2026-05-01T17:00:00Z", NOW)).toBe(0);
    expect(daysUntil("2026-05-01T21:30:00Z", NOW)).toBe(1); // 00:30 AST next day
    expect(daysUntil("2026-04-29T10:00:00Z", NOW)).toBe(-2);
    expect(daysUntil("2026-05-11T10:00:00Z", NOW)).toBe(10);
  });
  it("buckets events", () => {
    expect(bucketOf({ status: "draft", startsAt: "2026-06-01T10:00:00Z" }, NOW)).toBe("drafts");
    expect(bucketOf({ status: "live", startsAt: "2026-06-01T10:00:00Z" }, NOW)).toBe("upcoming");
    expect(bucketOf({ status: "live", startsAt: "2026-04-01T10:00:00Z" }, NOW)).toBe("past");
    expect(bucketOf({ status: "done", startsAt: "2026-06-01T10:00:00Z" }, NOW)).toBe("past");
  });
  it("percent and expected people", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(1, 0)).toBe(0);
    const g = (status: DemoGuest["status"], partySize: number) => ({ status, partySize }) as DemoGuest;
    expect(expectedPeople([g("confirmed", 2), g("confirmed", 1), g("declined", 4)])).toBe(3);
  });
  it("lastActivity picks the latest timestamp", () => {
    expect(lastActivity({ sentAt: "2026-01-01T00:00:00Z", respondedAt: "2026-01-02T00:00:00Z" } as DemoGuest)).toBe("2026-01-02T00:00:00Z");
    expect(lastActivity({} as DemoGuest)).toBeUndefined();
  });
  it("fileSlug", () => {
    expect(fileSlug("Sara's Birthday Dinner")).toBe("Sara-s-Birthday-Dinner");
    expect(fileSlug("حفل زفاف")).toBe("حفل-زفاف");
    expect(fileSlug("!!!")).toBe("event");
  });
});
