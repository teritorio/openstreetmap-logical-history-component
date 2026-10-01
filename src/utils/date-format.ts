export function formatDate(input: string): string {
  const date = new Date(input)
  const locale = navigator.language

  const datePart = date.toLocaleDateString(locale)
  const timePart = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

  return `${datePart} at ${timePart}`
}

/** Extracts the YYYY-MM-DD part from an ISO string */
export function toDateOnly(iso: string): string {
  return iso.slice(0, 10)
}

export function todayDate(): string {
  return toDateOnly(new Date().toISOString())
}

export function oneYearAgoDate(): string {
  const d = new Date()
  d.setUTCFullYear(d.getUTCFullYear() - 1)
  return toDateOnly(d.toISOString())
}

/** Converts a YYYY-MM-DD string to an ISO datetime string (midnight UTC) */
export function fromDateOnly(date: string): string {
  return new Date(date).toISOString()
}

/** Formats a YYYY-MM-DD string using the browser locale (UTC-safe) */
export function formatDateOnly(date: string): string {
  return new Date(date).toLocaleDateString(navigator.language, { timeZone: 'UTC' })
}
