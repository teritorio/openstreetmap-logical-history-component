import type * as GeoJSON from 'geojson'
import type { ComputedRef, Ref } from 'vue'
import type { KarmaManifest } from '@/lib/karma-api'
import { cellToBoundary, cellToParent } from 'h3-js'
import { computed, onMounted, ref, watch } from 'vue'
import { bboxToCells, cellsMinMaxSet } from '@/lib/h3-bbox'
import { loadManifest } from '@/lib/karma-api'
import { queryChanges } from '@/lib/karma-query'
import { parseBbox } from '@/utils/bbox'

const KARMA_BASE_URL = import.meta.env.VITE_KARMA_DATASET_URL as string | undefined
const MAX_QUERY_CELLS = 20000

interface QueryDates {
  startDate: Date
  endDate: Date
  startMonth: string
  endMonth: string
}

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

function buildHeatmap(byCell: Map<bigint, number>, manifestRes: number): GeoJSON.FeatureCollection {
  const displayRes = getDisplayRes(byCell.size, manifestRes)
  const displayCells = displayRes === manifestRes ? byCell : aggregateCells(byCell, displayRes)
  return h3CellsToGeoJSON(displayCells)
}

function buildHistogram(byDay: Map<string, number>): [number, number][] {
  return Array.from(
    byDay.entries(),
    ([day, count]): [number, number] => [new Date(`${day}T00:00:00Z`).getTime(), count],
  ).sort(([a], [b]) => a - b)
}

export interface UseKarmaDataOptions {
  viewportBbox: Ref<string>
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
  let queryInFlight = false
  let queryQueued = false

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

  watch([opts.viewportBbox, opts.bbox, opts.dateStart, opts.dateEnd, manifest], scheduleQuery)

  function scheduleQuery(): void {
    if (!KARMA_BASE_URL)
      return
    if (queryInFlight) {
      queryQueued = true
      return
    }
    void runQuery()
  }

  async function runQuery(): Promise<void> {
    queryInFlight = true
    try {
      await doQuery()
    }
    finally {
      queryInFlight = false
      if (queryQueued) {
        queryQueued = false
        await runQuery()
      }
    }
  }

  async function fetchBboxData(
    bboxStr: string,
    manifestSnap: KarmaManifest,
    dates: QueryDates,
  ): Promise<{ byCell: Map<bigint, number>, byDay: Map<string, number> } | null> {
    const bbox = parseBbox(bboxStr)
    if (!bbox)
      return null
    let hexCells: string[]
    try {
      hexCells = bboxToCells(bbox, manifestSnap.h3_resolution)
    }
    catch {
      return null
    }
    if (!hexCells.length || hexCells.length > MAX_QUERY_CELLS)
      return null
    const { min, max, set } = cellsMinMaxSet(hexCells)
    try {
      return await queryChanges({
        baseUrl: KARMA_BASE_URL!,
        manifest: manifestSnap,
        cellMin: min,
        cellMax: max,
        cellSet: set,
        startDate: dates.startDate,
        endDate: dates.endDate,
        startMonth: dates.startMonth,
        endMonth: dates.endMonth,
      })
    }
    catch (err) {
      console.warn('KarmaMap query failed:', err)
      return null
    }
  }

  async function doQuery(): Promise<void> {
    const viewportBboxVal = opts.viewportBbox.value
    const bboxVal = opts.bbox.value || ''
    const dateStartVal = opts.dateStart.value
    const dateEndVal = opts.dateEnd.value

    if (!manifest.value || !dateStartVal || (!viewportBboxVal && !bboxVal)) {
      histogramData.value = []
      heatmapData.value = null
      return
    }

    const manifestSnap = manifest.value
    const endDate = dateEndVal ? new Date(dateEndVal) : new Date()
    const dates: QueryDates = {
      startDate: new Date(dateStartVal),
      endDate,
      startMonth: dateStartVal.slice(0, 7),
      endMonth: endDate.toISOString().slice(0, 7),
    }

    if (bboxVal && viewportBboxVal) {
      // Drawn bbox: viewport for heatmap, bbox for histogram — run in parallel
      const [viewportResult, bboxResult] = await Promise.all([
        fetchBboxData(viewportBboxVal, manifestSnap, dates),
        fetchBboxData(bboxVal, manifestSnap, dates),
      ])
      heatmapData.value = viewportResult ? buildHeatmap(viewportResult.byCell, manifestSnap.h3_resolution) : null
      histogramData.value = bboxResult ? buildHistogram(bboxResult.byDay) : []
    }
    else if (bboxVal) {
      // Viewport unavailable (zoom < 12) but bbox drawn: histogram only
      const result = await fetchBboxData(bboxVal, manifestSnap, dates)
      histogramData.value = result ? buildHistogram(result.byDay) : []
      heatmapData.value = null
    }
    else {
      // No bbox: single viewport query for both
      const result = await fetchBboxData(viewportBboxVal, manifestSnap, dates)
      heatmapData.value = result ? buildHeatmap(result.byCell, manifestSnap.h3_resolution) : null
      histogramData.value = result ? buildHistogram(result.byDay) : []
    }
  }

  return { histogramData, heatmapData, dateRange }
}
