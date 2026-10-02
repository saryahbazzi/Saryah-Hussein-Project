"use client";

import { useMemo } from "react";
import { useDemo } from "@/lib/demo/store";
import { TEMPLATES, type CardSpec } from "@/lib/templates/catalog";

/**
 * Templates the visitor may choose from: the admin-managed list once the demo store is ready
 * (published only), the static catalog while it is not (server render, first paint).
 */
export function useCatalog(): { templates: CardSpec[]; ready: boolean } {
  const { ready, state } = useDemo();
  return useMemo(() => {
    if (!ready || state.templates.length === 0) return { templates: TEMPLATES, ready };
    return { templates: state.templates.filter((t) => t.published) as unknown as CardSpec[], ready };
  }, [ready, state.templates]);
}
