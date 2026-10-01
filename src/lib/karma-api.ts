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

export function epochDay(date: Date): number {
  return Math.floor(date.getTime() / 86400000)
}

export function dayKey(changeDate: number): string {
  return new Date(changeDate * 86400000).toISOString().slice(0, 10)
}
