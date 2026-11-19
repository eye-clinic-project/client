export type MessageValues = Record<string, string | number>

const SEPARATOR = "|"

export function vm(key: string, values?: MessageValues) {
  return values ? `${key}${SEPARATOR}${JSON.stringify(values)}` : key
}

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
