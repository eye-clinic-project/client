/** Report editor form. Empty optional sections are omitted from the request. */

import { z } from "zod"

import { optionalText, requiredText } from "./common.schema"

export const reportSchema = z
  .object({
    title: requiredText(200),
    content: optionalText(10000),
    recommendations: optionalText(5000),
  })
  .transform((value) => ({
    title: value.title,
    content: value.content || undefined,
    recommendations: value.recommendations || undefined,
  }))

export type ReportInput = z.input<typeof reportSchema>
