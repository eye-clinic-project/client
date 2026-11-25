import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"

export async function AuthTabs({ active }: { active: "sign-in" | "sign-up" }) {
  const t = await getTranslations("auth.tabs")
  const tab = (isActive: boolean) =>
    cn(
      "inline-flex min-h-9 items-center px-3.5 text-sm font-semibold",
      isActive
        ? "bg-background text-foreground shadow-[0_1px_2px_rgba(15,30,38,0.12)]"
        : "text-muted-foreground hover:text-foreground"
    )

  return (
    <nav
      aria-label={t("label")}
      className="inline-flex gap-1 self-start bg-muted p-1"
    >
      <Link
        href="/sign-in"
        aria-current={active === "sign-in" ? "page" : undefined}
        className={tab(active === "sign-in")}
      >
        {t("signIn")}
      </Link>
      <Link
        href="/sign-up"
        aria-current={active === "sign-up" ? "page" : undefined}
        className={tab(active === "sign-up")}
      >
        {t("signUp")}
      </Link>
    </nav>
  )
}
