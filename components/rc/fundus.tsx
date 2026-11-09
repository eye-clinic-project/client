"use client"

import { useState } from "react"

import { assetUrl } from "@/lib/api-config"
import { cn } from "@/lib/utils"

/** Square fundus photo on black, as in the design. */
export function FundusImage({
  src,
  alt,
  className,
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={cn("flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#0B0605]", className)}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetUrl(src)} alt={alt} onError={() => setFailed(true)} className="size-full object-contain" />
      ) : (
        <span className="px-6 text-center text-sm text-white/70">{failed ? "Image could not be loaded" : "No image"}</span>
      )}
    </div>
  )
}

/** Original image with the Grad-CAM heatmap layered on top; opacity is adjustable. */
export function GradCamOverlay({
  imageSrc,
  gradCamSrc,
  alt,
  showSlider = true,
}: {
  imageSrc?: string | null
  gradCamSrc?: string | null
  alt: string
  showSlider?: boolean
}) {
  const [opacity, setOpacity] = useState(0.75)
  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#0B0605]">
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(imageSrc)} alt={gradCamSrc ? "" : alt} className="absolute inset-0 size-full object-contain" />
        )}
        {gradCamSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetUrl(gradCamSrc)}
            alt={alt}
            style={{ opacity }}
            className="absolute inset-0 size-full object-contain mix-blend-screen"
          />
        )}
      </div>
      {!gradCamSrc && <span className="text-[13px] text-muted-foreground">Heatmap not available for this result.</span>}
      {showSlider && gradCamSrc && (
        <label className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="shrink-0">Heatmap</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Heatmap opacity"
          />
          <span className="flex shrink-0 items-center gap-1.5">
            low
            <span
              aria-hidden="true"
              className="h-2 w-16 rounded-full"
              style={{ background: "linear-gradient(90deg,#1F3BFF,#E0001B,#FF7A00,#FFF200)" }}
            />
            high influence
          </span>
        </label>
      )}
    </div>
  )
}
