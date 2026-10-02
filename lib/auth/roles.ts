export const ROLES = ["host", "planner", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** Self-service roles offered at sign-up. Staff and admin are assigned, never chosen. */
export const SIGNUP_ROLES = ["host", "planner"] as const;

export function homeFor(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/checkin";
    default:
      return "/dashboard";
  }
}

/** Which roles may open which top-level app areas. */
export const AREA_ROLES: Record<string, readonly Role[]> = {
  dashboard: ["host", "planner", "admin"],
  events: ["host", "planner", "admin"],
  checkin: ["staff", "host", "planner", "admin"],
  clients: ["planner", "admin"],
  admin: ["admin"],
};

export const canAccess = (area: string, role: Role) =>
  AREA_ROLES[area]?.includes(role) ?? false;

/** Only same-site relative paths may be used as post-login redirects. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}
