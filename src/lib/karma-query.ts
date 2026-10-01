// Port of KarmaMap web/changes/query.js — canonical source:
// https://github.com/teritorio/KarmaMap/blob/main/web/changes/query.js
import type { ParquetQueryFilter } from 'hyparquet'
import type { KarmaManifest } from './karma-api'
import { dayKey, epochDay } from './karma-api'
import { queryRows } from './parquet'

function monthsInRange(startMonth: string, endMonth: string): string[] {
  const [sy, sm] = startMonth.split('-').map(Number) as [number, number]
  const [ey, em] = endMonth.split('-').map(Number) as [number, number]
  const months: string[] = []
  let y = sy
  let m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return months
}

function yearsInRange(startMonth: string, endMonth: string): string[] {
  return [...new Set(monthsInRange(startMonth, endMonth).map(m => m.slice(0, 4)))]
}

function partitionPath(datasetPath: string, year: string): string {
  return `${datasetPath}/year=${year}/data.parquet`
}

async function queryOneFile(
  baseUrl: string,
  path: string,
  footerSize: number | undefined,
  cellMin: bigint,
  cellMax: bigint,
  startDay: number,
  endDay: number,
  cellSet: Set<bigint>,
): Promise<Record<string, unknown>[]> {
  const filter: ParquetQueryFilter = {
    h3_cell: { $gte: cellMin, $lte: cellMax },
    change_date: { $gte: startDay, $lte: endDay },
  }
  const rows = await queryRows(baseUrl, path, filter, undefined, footerSize)
  return rows.filter(row => cellSet.has(BigInt(row.h3_cell as number)))
}

export interface QueryChangesOptions {
  baseUrl: string
  manifest: KarmaManifest
  cellMin: bigint
  cellMax: bigint
  cellSet: Set<bigint>
  startDate: Date
  endDate: Date
  startMonth: string
  endMonth: string
}

export interface QueryChangesResult {
  byCell: Map<bigint, number>
  byDay: Map<string, number>
}

export async function queryChanges(opts: QueryChangesOptions): Promise<QueryChangesResult> {
  const { baseUrl, manifest, cellMin, cellMax, cellSet, startDate, endDate, startMonth, endMonth } = opts
  const years = yearsInRange(startMonth, endMonth)
  const startDay = epochDay(startDate)
  const endDay = epochDay(endDate)

  const tasks: Promise<Record<string, unknown>[]>[] = []
  for (const year of years) {
    for (const datasetName of Object.keys(manifest.datasets)) {
      const dataset = manifest.datasets[datasetName]!
      if (!Array.isArray(dataset.partitions) || dataset.partitions.length === 0)
        continue
      if (!dataset.partitions.includes(year))
        continue
      const path = partitionPath(dataset.path, year)
      const footerSize = dataset.partition_footer_sizes?.[year]
      tasks.push(queryOneFile(baseUrl, path, footerSize, cellMin, cellMax, startDay, endDay, cellSet))
    }
  }

  const results = await Promise.all(tasks)
  const byCell = new Map<bigint, number>()
  const byDay = new Map<string, number>()

  for (const rows of results) {
    for (const row of rows) {
      const count = Number(row.count)
      const cell = BigInt(row.h3_cell as number)
      byCell.set(cell, (byCell.get(cell) ?? 0) + count)
      const day = dayKey(row.change_date as number)
      byDay.set(day, (byDay.get(day) ?? 0) + count)
    }
  }

  return { byCell, byDay }
}
