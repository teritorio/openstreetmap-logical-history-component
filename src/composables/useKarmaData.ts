import type * as GeoJSON from 'geojson'
import type { ComputedRef, Ref } from 'vue'
import type { KarmaManifest } from '@/lib/karma-api'
import { cellToBoundary, cellToParent } from 'h3-js'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { bboxToCells, cellsMinMaxSet } from '@/lib/h3-bbox'
import { loadManifest } from '@/lib/karma-api'
import { queryChanges } from '@/lib/karma-query'

const KARMA_BASE_URL = import.meta.env.VITE_KARMA_DATASET_URL as string | undefined
const MAX_QUERY_CELLS = 20000

function getDisplayRes(resultSize: number, manifestRes: number): number {
  if (resultSize > 3500)
    return Math.max(0, manifestRes - 3)
  if (resultSize > 500)
    return Math.max(0, manifestRes - 2)
  if (resultSize > 70)
    return Math.max(0, manifestRes - 1)
  return manifestRes
}

function aggregateCells(byCell: Map<bigint, number>, toRes: number): Map<bigint, number> {
  const result = new Map<bigint, number>()
  for (const [cell, count] of byCell) {
    const parentHex = cellToParent(cell.toString(16), toRes)
    const parentCell = BigInt(`0x${parentHex}`)
    result.set(parentCell, (result.get(parentCell) ?? 0) + count)
  }
  return result
}

function h3CellsToGeoJSON(byCell: Map<bigint, number>): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []
  for (const [cell, count] of byCell.entries()) {
    const hex = cell.toString(16)
    const boundary = cellToBoundary(hex, true) as [number, number][]
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [boundary] },
      properties: { count },
    })
  }
  return { type: 'FeatureCollection', features }
}

export interface UseKarmaDataOptions {
  bbox: Ref<string | undefined>
  dateStart: Ref<string | undefined>
  dateEnd: Ref<string | undefined>
}

export function useKarmaData(opts: UseKarmaDataOptions): {
  histogramData: Ref<[number, number][]>
  heatmapData: Ref<GeoJSON.FeatureCollection | null>
  dateRange: ComputedRef<{ min_date: string, max_date: string } | null>
} {
  const histogramData = ref<[number, number][]>([])
  const heatmapData = ref<GeoJSON.FeatureCollection | null>(null)
  const manifest = ref<KarmaManifest | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let currentQueryId = 0

  const dateRange = computed(() => manifest.value?.date_range ?? null)

  onMounted(async () => {
    if (!KARMA_BASE_URL)
      return
    try {
      manifest.value = await loadManifest(KARMA_BASE_URL)
    }
    catch (err) {
      console.warn('KarmaMap manifest unavailable:', err)
    }
  })

  watch([opts.bbox, opts.dateStart, opts.dateEnd, manifest], () => {
    if (!KARMA_BASE_URL)
      return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(runQuery, 500)
  })

  onUnmounted(() => clearTimeout(debounceTimer))

  async function runQuery(): Promise<void> {
    histogramData.value = []
    heatmapData.value = null

    const queryId = ++currentQueryId
    const bboxVal = opts.bbox.value
    const dateStartVal = opts.dateStart.value
    const dateEndVal = opts.dateEnd.value
    if (!manifest.value || !bboxVal || !dateStartVal)
      return

    const manifestRes = manifest.value.h3_resolution

    const parts = bboxVal.split(',').map(Number)
    if (parts.length !== 4 || parts.some(Number.isNaN))
      return
    const bbox = parts as [number, number, number, number]

    let hexCells: string[]
    try {
      hexCells = bboxToCells(bbox, manifestRes)
    }
    catch {
      return
    }
    if (!hexCells.length || hexCells.length > MAX_QUERY_CELLS)
      return

    const { min, max, set } = cellsMinMaxSet(hexCells)
    const startDate = new Date(dateStartVal)
    const endDate = dateEndVal ? new Date(dateEndVal) : new Date()
    const startMonth = dateStartVal.slice(0, 7)
    const endMonth = endDate.toISOString().slice(0, 7)

    try {
      const { byCell, byDay } = await queryChanges({
        baseUrl: KARMA_BASE_URL!,
        manifest: manifest.value,
        cellMin: min,
        cellMax: max,
        cellSet: set,
        startDate,
        endDate,
        startMonth,
        endMonth,
      })

      if (queryId !== currentQueryId)
        return

      histogramData.value = Array.from(byDay.entries(), ([day, count]): [number, number] => [new Date(`${day}T00:00:00Z`).getTime(), count])
        .sort(([a], [b]) => a - b)

      const displayRes = getDisplayRes(byCell.size, manifestRes)
      const displayCells = displayRes === manifestRes
        ? byCell
        : aggregateCells(byCell, displayRes)
      heatmapData.value = h3CellsToGeoJSON(displayCells)
    }
    catch (err) {
      console.warn('KarmaMap query failed:', err)
    }
  }

  return { histogramData, heatmapData, dateRange }
}
