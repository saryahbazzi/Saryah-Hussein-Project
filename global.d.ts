import type { en } from "./messages";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof en;
  }
}
