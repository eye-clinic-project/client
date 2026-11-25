/** User photo with initials fallback. */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  name: string | null | undefined
  src?: string | null
  tone?: "brand" | "soft"
  className?: string
}

export function UserAvatar({
  name,
  src,
  tone = "brand",
  className,
}: UserAvatarProps) {
  return (
    <Avatar className={cn("size-10", className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback
        className={cn(
          "text-sm font-semibold",
          tone === "brand"
            ? "bg-brand text-white"
            : "bg-brand-soft text-brand-strong"
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
