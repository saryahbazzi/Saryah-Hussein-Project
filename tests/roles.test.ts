import { describe, expect, it } from "vitest";
import { canAccess, homeFor, safeNext } from "@/lib/auth/roles";

describe("roles", () => {
  it("routes each role to its home", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("staff")).toBe("/checkin");
    expect(homeFor("host")).toBe("/dashboard");
    expect(homeFor("planner")).toBe("/dashboard");
  });
  it("restricts areas", () => {
    expect(canAccess("admin", "host")).toBe(false);
    expect(canAccess("admin", "admin")).toBe(true);
    expect(canAccess("dashboard", "staff")).toBe(false);
    expect(canAccess("checkin", "staff")).toBe(true);
  });
  it("only allows same-site redirects", () => {
    expect(safeNext("/ar/dashboard")).toBe("/ar/dashboard");
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext("/\\evil.com")).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
});
