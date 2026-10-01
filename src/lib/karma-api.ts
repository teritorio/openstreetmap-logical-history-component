// Port of KarmaMap web/lib/api.js — canonical source:
// https://github.com/teritorio/KarmaMap/blob/main/web/lib/api.js

export interface KarmaManifest {
  h3_resolution: number
  date_range?: { min_date: string, max_date: string }
  datasets: Record<string, {
    path: string
    partitions?: string[]
    partition_footer_sizes?: Record<string, number>
  }>
}

export async function loadManifest(baseUrl: string): Promise<KarmaManifest> {
  const res = await fetch(`${baseUrl}/manifest.json`)
  if (!res.ok)
    throw new Error(`Failed to load manifest.json: HTTP ${res.status}`)
  return res.json()
}

export function coverageDays(manifest: KarmaManifest): { minDate: string, maxDate: string } | null {
  const range = manifest.date_range
  if (!range?.min_date || !range?.max_date)
    return null
  return { minDate: range.min_date, maxDate: range.max_date }
}

export function epochDay(date: Date): number {
  return Math.floor(date.getTime() / 86400000)
}

export function dayKey(changeDate: number): string {
  return new Date(Number(changeDate) * 86400000).toISOString().slice(0, 10)
}
