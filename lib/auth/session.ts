import "server-only";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { canAccess, homeFor, type Role } from "./roles";

export interface SessionProfile {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  role: Role;
}

/** Current signed-in user + profile, or null. Deduplicated per request. */
export const getSession = cache(async (): Promise<SessionProfile | null> => {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return {
    id: user.id,
    email: profile.email,
    phone: profile.phone,
    fullName: profile.full_name,
    role: profile.role as Role,
  };
});

/** Server-component guard: signed in, and allowed in this area. */
export async function requireArea(area: string, locale: string, next?: string): Promise<SessionProfile> {
  const session = await getSession();
  if (!session) {
    redirect({ href: { pathname: "/login", query: next ? { next } : {} }, locale });
    throw new Error("unreachable");
  }
  if (!canAccess(area, session.role)) {
    redirect({ href: homeFor(session.role), locale });
  }
  return session;
}
