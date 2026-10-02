import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Applies the real migrations + seed to an in-process Postgres (PGlite) with a
 * minimal stand-in for Supabase's `auth` schema, then exercises RLS and the
 * check-in function as different users.
 */
const ADMIN = "00000000-0000-0000-0000-0000000000a1";
const HOST = "00000000-0000-0000-0000-0000000000b1";
const PLANNER = "00000000-0000-0000-0000-0000000000c1";
const STAFF = "00000000-0000-0000-0000-0000000000d1";
const E1 = "00000000-0000-0000-0000-00000000e001";
const E2 = "00000000-0000-0000-0000-00000000e002";

const AUTH_STUB = `
  create schema auth;
  create table auth.users (
    instance_id uuid, id uuid primary key, aud text, role text, email text, phone text,
    email_confirmed_at timestamptz, phone_confirmed_at timestamptz,
    raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz,
    confirmation_token text, recovery_token text, email_change_token_new text, email_change text,
    phone_change text, phone_change_token text, email_change_token_current text, reauthentication_token text
  );
  create table auth.identities (
    id uuid, user_id uuid, identity_data jsonb, provider text, provider_id text,
    last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin;
  create role authenticated nologin;
`;

let db: PGlite;

async function as<T>(user: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${user ? "authenticated" : "anon"}; select set_config('request.jwt.claim.sub', '${user ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}
const q = async <T = Record<string, unknown>>(sql: string) => (await db.query<T>(sql)).rows;

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(AUTH_STUB);
  const dir = path.resolve(__dirname, "../supabase");
  for (const f of readdirSync(path.join(dir, "migrations")).sort()) {
    await db.exec(readFileSync(path.join(dir, "migrations", f), "utf8"));
  }
  await db.exec(readFileSync(path.join(dir, "seed.sql"), "utf8"));
  await db.exec(`grant usage on schema public to anon, authenticated;
                 grant all on all tables in schema public to anon, authenticated;
                 grant execute on all functions in schema public to anon, authenticated;
                 grant usage on schema auth to anon, authenticated;
                 grant execute on function auth.uid() to anon, authenticated;`);
}, 60_000);

describe("schema + seed", () => {
  it("creates profiles for seeded users with the right roles", async () => {
    const rows = await q<{ role: string }>("select role from public.profiles order by role");
    expect(rows.map((r) => r.role).sort()).toEqual(["admin", "host", "planner", "staff"]);
  });

  it("computes event stats", async () => {
    const [s] = await q<Record<string, number | string>>(`select * from public.event_stats where event_id = '${E1}'`);
    expect(Number(s.total)).toBe(60);
    expect(Number(s.confirmed)).toBe(30);
    expect(Number(s.declined)).toBe(6);
  });
});

describe("RLS", () => {
  it("hosts only see their own events", async () => {
    const rows = await as(HOST, () => q("select id from public.events"));
    expect(rows.map((r) => r.id).sort()).toEqual([E1, "00000000-0000-0000-0000-00000000e003"].sort());
  });

  it("planners see their organisation's events but not other hosts' guests", async () => {
    const events = await as(PLANNER, () => q("select id from public.events"));
    expect(events.map((r) => r.id)).toEqual([E2]);
    const guests = await as(PLANNER, () => q(`select id from public.guests where event_id = '${E1}'`));
    expect(guests).toHaveLength(0);
  });

  it("admins see everything", async () => {
    const rows = await as(ADMIN, () => q("select id from public.events"));
    expect(rows).toHaveLength(3);
  });

  it("anonymous visitors can read published templates only", async () => {
    await q("update public.templates set is_published = false where slug = 'gold-sparkle'");
    const rows = await as(null, () => q("select slug from public.templates"));
    expect(rows).toHaveLength(9);
    expect(await as(null, () => q("select id from public.events"))).toHaveLength(0);
  });

  it("users cannot promote themselves to admin", async () => {
    await expect(
      as(HOST, () => db.query(`update public.profiles set role = 'admin' where id = '${HOST}'`)),
    ).rejects.toThrow(/admin/);
  });

  it("new self-signups cannot choose staff/admin roles", async () => {
    await q(`insert into auth.users (id, email, raw_user_meta_data) values
      ('00000000-0000-0000-0000-0000000000e9', 'x@x.test', '{"role":"admin"}')`);
    const [p] = await q<{ role: string }>("select role from public.profiles where id = '00000000-0000-0000-0000-0000000000e9'");
    expect(p.role).toBe("host");
  });
});

describe("check_in_guest", () => {
  it("admits a confirmed guest once, then reports already used", async () => {
    const [g] = await q<{ id: string }>(
      `select id from public.guests where event_id = '${E1}' and status = 'confirmed' and checked_in_at is null limit 1`,
    );
    const first = await as(STAFF, () => q<{ check_in_guest: Record<string, unknown> }>(`select public.check_in_guest('${E1}', '${g.id}')`));
    expect(first[0].check_in_guest.result).toBe("valid");
    const second = await as(STAFF, () => q<{ check_in_guest: Record<string, unknown> }>(`select public.check_in_guest('${E1}', '${g.id}')`));
    expect(second[0].check_in_guest.result).toBe("already_used");
    expect(second[0].check_in_guest.attended).toBe(1);
  });

  it("rejects declined guests and unknown ids as invalid", async () => {
    const [d] = await q<{ id: string }>(`select id from public.guests where event_id = '${E1}' and status = 'declined' limit 1`);
    const r1 = await as(STAFF, () => q<{ check_in_guest: Record<string, unknown> }>(`select public.check_in_guest('${E1}', '${d.id}')`));
    expect(r1[0].check_in_guest.result).toBe("invalid");
    const r2 = await as(STAFF, () =>
      q<{ check_in_guest: Record<string, unknown> }>(`select public.check_in_guest('${E1}', gen_random_uuid())`),
    );
    expect(r2[0].check_in_guest.result).toBe("invalid");
  });

  it("refuses users with no access to the event", async () => {
    await expect(
      as(PLANNER, () => db.query(`select public.check_in_guest('${E1}', gen_random_uuid())`)),
    ).rejects.toThrow(/not allowed/);
  });

  it("does not let a guest be admitted at a different event", async () => {
    const [g] = await q<{ id: string }>(`select id from public.guests where event_id = '${E2}' and status = 'confirmed' and checked_in_at is null limit 1`);
    const r = await as(STAFF, () => q<{ check_in_guest: Record<string, unknown> }>(`select public.check_in_guest('${E1}', '${g.id}')`));
    expect(r[0].check_in_guest.result).toBe("invalid");
  });
});

describe("PDPL", () => {
  it("erase_guest removes the guest and their messages for managers only", async () => {
    const [g] = await q<{ id: string }>(`select id from public.guests where event_id = '${E1}' limit 1`);
    await expect(as(PLANNER, () => db.query(`select public.erase_guest('${g.id}')`))).rejects.toThrow(/not allowed/);
    await as(HOST, () => db.query(`select public.erase_guest('${g.id}')`));
    expect(await q(`select 1 from public.guests where id = '${g.id}'`)).toHaveLength(0);
    expect(await q(`select 1 from public.messages where guest_id = '${g.id}'`)).toHaveLength(0);
  });
});
