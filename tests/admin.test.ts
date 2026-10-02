import { describe, expect, it } from "vitest";
import { createSeed } from "@/lib/demo/seed";
import { addClient, addInvite, revokeInvite } from "@/lib/demo/actions";
import {
  computeKpis, customerRows, delta, deliveryFunnel, eventRows, failureReasons, groupOfKind, lastMonths,
  messagesByMonth, revenueByMonth, slugify, templateUsage, topCustomers,
} from "@/lib/admin/metrics";

const NOW = Date.parse("2026-10-02T09:00:00Z");

describe("admin metrics", () => {
  it("builds six months ending with the current one", () => {
    const m = lastMonths(NOW, 6);
    expect(m.map((x) => x.key)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(m[5].end).toBeGreaterThan(NOW);
    expect(m[4].end).toBe(m[5].start);
  });

  it("handles year rollover", () => {
    expect(lastMonths(Date.parse("2026-02-10T00:00:00Z"), 3).map((x) => x.key)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });

  it("delta has no percentage without a baseline", () => {
    expect(delta(5, 0).pct).toBeNull();
    expect(delta(150, 100).pct).toBeCloseTo(0.5);
  });

  it("KPIs and monthly revenue agree on totals", () => {
    const s = createSeed(NOW);
    const k = computeKpis(s, NOW);
    const total = s.orders.reduce((a, o) => a + o.total, 0);
    expect(k.revenue.incVat).toBeCloseTo(total, 2);
    expect(k.revenue.exVat).toBeLessThan(k.revenue.incVat);
    expect(k.events.live + k.events.done + k.events.draft).toBe(k.events.total);
    expect(k.customers.total).toBe(k.customers.hosts + k.customers.planners);
    const six = revenueByMonth(s, NOW, 6).reduce((a, m) => a + m.incVat, 0);
    expect(six).toBeLessThanOrEqual(total + 0.01);
  });

  it("splits messages by group per month", () => {
    const s = createSeed(NOW);
    const months = messagesByMonth(s.messages, NOW, 6);
    for (const m of months) expect(m.total).toBe(Object.values(m.byGroup).reduce((a, b) => a + b, 0));
    expect(groupOfKind("reminder_1d")).toBe("reminders");
    expect(groupOfKind("reply")).toBe("replies");
  });

  it("funnel stages never grow", () => {
    const f = deliveryFunnel(createSeed(NOW).messages);
    expect(f.sent).toBeLessThanOrEqual(f.outbound);
    expect(f.delivered).toBeLessThanOrEqual(f.sent);
    expect(f.readOrReplied).toBeLessThanOrEqual(f.delivered);
    expect(f.failureRate).toBeGreaterThanOrEqual(0);
  });

  it("aggregates failure reasons, customers, events and template usage", () => {
    const s = createSeed(NOW);
    expect(failureReasons(s)[0]?.reason).toBe("not_on_whatsapp");
    const top = topCustomers(s, 3);
    expect(top[0].spend).toBeGreaterThanOrEqual(top[1].spend);
    expect(customerRows(s).every((r) => r.user.role === "host" || r.user.role === "planner")).toBe(true);
    expect(eventRows(s)).toHaveLength(s.events.length);
    expect(Object.values(templateUsage(s)).reduce((a, b) => a + b, 0)).toBe(s.events.length);
  });

  it("slugifies English names", () => {
    expect(slugify("  Royal Navy & Gold! ")).toBe("royal-navy-gold");
    expect(slugify("نجدي")).toBe("");
  });
});

describe("planner clients and team", () => {
  it("adds clients and tolerates missing invites", () => {
    const s = createSeed(NOW);
    expect(s.invites).toBeUndefined();
    const { state, client } = addClient(s, "u-planner", " New Co ", "+966500000999");
    expect(state.clients.at(-1)).toEqual(client);
    expect(client.name).toBe("New Co");
    const withInvite = addInvite(state, "u-planner", "A@B.com", "coordinator", "2026-10-02T00:00:00Z");
    expect(withInvite.invites).toHaveLength(1);
    expect(withInvite.invites![0].email).toBe("a@b.com");
    expect(revokeInvite(withInvite, withInvite.invites![0].id).invites).toHaveLength(0);
    expect(revokeInvite(s, "x").invites).toEqual([]);
  });
});

describe("template deletion", () => {
  it("refuses to delete a template that events use", async () => {
    const { deleteTemplate, upsertTemplate } = await import("@/lib/demo/actions");
    const s = createSeed(NOW);
    expect(deleteTemplate(s, "royal-navy-gold").templates).toHaveLength(s.templates.length);
    const t = { ...s.templates[0], slug: "unused-x", published: false };
    const s2 = upsertTemplate(s, t);
    expect(deleteTemplate(s2, "unused-x").templates).toHaveLength(s.templates.length);
  });
});
