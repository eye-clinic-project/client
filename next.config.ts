/** Next.js config. The next-intl plugin points to src/i18n/request.ts for per-request locale + messages. */

import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
