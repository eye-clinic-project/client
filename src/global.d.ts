/** Types next-intl with the English messages, so unknown translation keys are compile errors. */

import type messages from "./i18n/messages/en"

declare module "next-intl" {
  interface AppConfig {
    Locale: "en" | "ar"
    Messages: typeof messages
  }
}
