/**
 * Translated Zod messages, step 1: encoding.
 *
 * Zod schemas can't call `t()` (they're plain modules), so they store a message
 * KEY plus optional values in one string: `vm("tooLong", { max: 5 })` →
 * `tooLong|{"max":5}`. useValidationMessage() decodes and translates it.
 */

export type MessageValues = Record<string, string | number>

const SEPARATOR = "|"

/** Encode a validation message key (from messages/<lang>/validation.json) with values. */
export function vm(key: string, values?: MessageValues) {
  return values ? `${key}${SEPARATOR}${JSON.stringify(values)}` : key
}

/** Decode a string produced by vm(). */
export function parseValidationMessage(message: string): {
  key: string
  values?: MessageValues
} {
  const index = message.indexOf(SEPARATOR)
  if (index === -1) return { key: message }
  try {
    return {
      key: message.slice(0, index),
      values: JSON.parse(message.slice(index + 1)) as MessageValues,
    }
  } catch {
    return { key: message }
  }
}
