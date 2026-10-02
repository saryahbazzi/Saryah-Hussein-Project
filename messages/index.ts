import enCore from "./en/core.json";
import enLanding from "./en/landing.json";
import enAuth from "./en/auth.json";
import enWizard from "./en/wizard.json";
import enTemplates from "./en/templates.json";
import enDashboard from "./en/dashboard.json";
import enCheckin from "./en/checkin.json";
import enAdmin from "./en/admin.json";
import enLegal from "./en/legal.json";
import enTicket from "./en/ticket.json";
import arCore from "./ar/core.json";
import arLanding from "./ar/landing.json";
import arAuth from "./ar/auth.json";
import arWizard from "./ar/wizard.json";
import arTemplates from "./ar/templates.json";
import arDashboard from "./ar/dashboard.json";
import arCheckin from "./ar/checkin.json";
import arAdmin from "./ar/admin.json";
import arLegal from "./ar/legal.json";
import arTicket from "./ar/ticket.json";

/**
 * Translation files are split per feature (messages/<locale>/<feature>.json) and merged here.
 * Each file holds one or more top-level namespaces. `en` is the source of truth for types.
 */
export const en = {
  ...enCore, ...enLanding, ...enAuth, ...enWizard, ...enTemplates,
  ...enDashboard, ...enCheckin, ...enAdmin, ...enLegal, ...enTicket,
};
export const ar = {
  ...arCore, ...arLanding, ...arAuth, ...arWizard, ...arTemplates,
  ...arDashboard, ...arCheckin, ...arAdmin, ...arLegal, ...arTicket,
};
export const messages = { en, ar } as const;
