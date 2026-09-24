/**
 * Converts ISO string to input[type="datetime-local"] format: YYYY-MM-DDTHH:mm
 */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number): string => n.toString().padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Converts input[type="datetime-local"] string back to ISO
 */
export function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString()
}

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

/** Converts a YYYY-MM-DD string to an ISO datetime string (midnight UTC) */
export function fromDateOnly(date: string): string {
  return new Date(date).toISOString()
}

/** Formats a YYYY-MM-DD string using the browser locale (UTC-safe) */
export function formatDateOnly(date: string): string {
  return new Date(date).toLocaleDateString(navigator.language, { timeZone: 'UTC' })
}
