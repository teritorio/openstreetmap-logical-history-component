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
