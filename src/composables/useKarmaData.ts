import type * as GeoJSON from 'geojson'
import type { Ref } from 'vue'
import type { KarmaManifest } from '@/lib/karma-api'
import { cellToBoundary } from 'h3-js'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { bboxToCells, cellsMinMaxSet } from '@/lib/h3-bbox'
import { loadManifest } from '@/lib/karma-api'
import { queryChanges } from '@/lib/karma-query'

const KARMA_BASE_URL = import.meta.env.VITE_KARMA_DATASET_URL as string | undefined

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

export function useKarmaData(opts: UseKarmaDataOptions): { histogramData: Ref<[number, number][]>, heatmapData: Ref<GeoJSON.FeatureCollection | null> } {
  const histogramData = ref<[number, number][]>([])
  const heatmapData = ref<GeoJSON.FeatureCollection | null>(null)
  const manifest = ref<KarmaManifest | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let currentQueryId = 0

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
    const queryId = ++currentQueryId
    const bboxVal = opts.bbox.value
    const dateStartVal = opts.dateStart.value
    const dateEndVal = opts.dateEnd.value
    if (!manifest.value || !bboxVal || !dateStartVal)
      return

    const parts = bboxVal.split(',').map(Number)
    if (parts.length !== 4 || parts.some(Number.isNaN))
      return
    const bbox = parts as [number, number, number, number]

    let hexCells: string[]
    try {
      hexCells = bboxToCells(bbox, manifest.value.h3_resolution)
    }
    catch {
      return
    }
    if (!hexCells.length)
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

      heatmapData.value = h3CellsToGeoJSON(byCell)
    }
    catch (err) {
      console.warn('KarmaMap query failed:', err)
    }
  }

  return { histogramData, heatmapData }
}
