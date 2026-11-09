import type { DrLevel } from "@/lib/api-types"

export const GRADE_LABELS: Record<DrLevel, string> = {
  0: "No DR",
  1: "Mild",
  2: "Moderate",
  3: "Severe",
  4: "Proliferative",
}

/** Plain-language explanation for patients (matches the server's wording). */
export const GRADE_DESCRIPTIONS: Record<DrLevel, string> = {
  0: "No signs of diabetic retinopathy were detected.",
  1: "Early, small changes in the retinal blood vessels. Usually monitored with regular check-ups.",
  2: "More blood vessels are affected. Referral to an eye specialist is recommended.",
  3: "Many blood vessels are blocked. Prompt specialist assessment is needed.",
  4: "Advanced stage with new abnormal blood vessels. Urgent specialist treatment is needed.",
}

/** Chip colours per grade (text on tint), from the design. Classes include dark-mode variants. */
export const GRADE_CHIP: Record<DrLevel, string> = {
  0: "bg-[#E7F5EC] text-[#166534] dark:bg-[#123322] dark:text-[#8fe0aa]",
  1: "bg-[#FBF3D9] text-[#7A5A00] dark:bg-[#3a3010] dark:text-[#f2d77a]",
  2: "bg-[#FDEBDD] text-[#9A3A06] dark:bg-[#3d2212] dark:text-[#ffb98a]",
  3: "bg-[#FCE4E4] text-[#A11B1B] dark:bg-[#3d1717] dark:text-[#ffaaaa]",
  4: "bg-[#F6E3EE] text-[#6B1640] dark:bg-[#3a1529] dark:text-[#f5a8cf]",
}

/** Solid colours for the severity scale and probability bars. */
export const GRADE_COLOR: Record<DrLevel, string> = {
  0: "#2E8B57",
  1: "#C9A227",
  2: "#D9692A",
  3: "#A11B1B",
  4: "#8A2A5C",
}

/** Headline text colour for a grade (e.g. on the patient home). */
export const GRADE_TEXT: Record<DrLevel, string> = {
  0: "text-[#166534] dark:text-[#8fe0aa]",
  1: "text-[#7A5A00] dark:text-[#f2d77a]",
  2: "text-[#9A3A06] dark:text-[#ffb98a]",
  3: "text-[#A11B1B] dark:text-[#ffaaaa]",
  4: "text-[#6B1640] dark:text-[#f5a8cf]",
}

export const GRADES: DrLevel[] = [0, 1, 2, 3, 4]

export function isLevel(value: unknown): value is DrLevel {
  return typeof value === "number" && value >= 0 && value <= 4 && Number.isInteger(value)
}
