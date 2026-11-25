import { Loader2Icon } from "lucide-react"
import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  pending?: boolean
}

export function SubmitButton({
  pending,
  children,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn(
        "h-12 w-full rounded-none text-[15px] font-semibold",
        className
      )}
      {...props}
    >
      {pending && (
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </Button>
  )
}
