import type messages from "./messages/en"

declare module "next-intl" {
  interface AppConfig {
    Locale: "en" | "ar"
    Messages: typeof messages
  }
}
