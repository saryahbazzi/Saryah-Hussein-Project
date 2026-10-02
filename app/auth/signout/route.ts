import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

export async function POST(req: NextRequest) {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const form = await req.formData();
  const raw = String(form.get("locale") ?? "");
  const locale = (routing.locales as readonly string[]).includes(raw) ? raw : routing.defaultLocale;
  return NextResponse.redirect(new URL(`/${locale}`, req.url), 303);
}
