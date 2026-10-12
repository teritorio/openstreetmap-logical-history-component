<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  start?: string
  end?: string
  histogramData?: [number, number][]
  dateRange?: { min_date: string, max_date: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:start', value: string): void
  (e: 'update:end', value: string): void
}>()

const isEmpty = computed(() => !props.histogramData?.length)

const AXIS_STYLE = {
  axisLine: { lineStyle: { color: '#d0d2d5' } },
  axisTick: { lineStyle: { color: '#d0d2d5' } },
  axisLabel: { color: '#555555' },
  splitLine: { lineStyle: { color: '#d0d2d5' } },
}

const containerRef = useTemplateRef<HTMLDivElement>('container')
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// Prevents the programmatic dispatchAction from looping back into the emit.
let isProgrammaticZoom = false

// Fixed x-axis bounds (full dataset coverage from manifest).
let axisMin: number | undefined
let axisMax: number | undefined

function dateToMs(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime()
}

function msToDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function computeAxisBounds(): void {
  if (props.dateRange) {
    axisMin = dateToMs(props.dateRange.min_date.slice(0, 10))
    axisMax = dateToMs(props.dateRange.max_date.slice(0, 10))
  }
  else if (props.histogramData?.length) {
    axisMin = props.histogramData[0][0]
    axisMax = props.histogramData.at(-1)![0]
  }
}

function setWindow(start: string, end: string): void {
  if (!chart)
    return
  isProgrammaticZoom = true
  chart.dispatchAction({
    type: 'dataZoom',
    startValue: dateToMs(start),
    endValue: dateToMs(end),
  })
}

function syncWindowToProp(): void {
  if (props.start && props.end)
    setWindow(props.start, props.end)
}

onMounted(() => {
  if (!containerRef.value)
    return

  computeAxisBounds()

  chart = echarts.init(containerRef.value)
  chart.setOption({
    grid: { left: 44, right: 16, top: 12, bottom: 44 },
    xAxis: { type: 'time', min: axisMin, max: axisMax, ...AXIS_STYLE },
    yAxis: { type: 'log', logBase: 10, min: 1, ...AXIS_STYLE },
    tooltip: { trigger: 'axis' },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 20,
        bottom: 10,
        borderColor: '#d0d2d5',
        fillerColor: 'rgba(8, 46, 78, 0.1)',
        handleStyle: { color: '#082e4e' },
        moveHandleStyle: { color: '#082e4e' },
        selectedDataBackground: { lineStyle: { color: '#082e4e' }, areaStyle: { color: 'rgba(8, 46, 78, 0.3)' } },
        textStyle: { color: '#555555' },
      },
      { type: 'inside', xAxisIndex: 0 },
    ],
    series: [{ type: 'bar', name: 'Changes', data: props.histogramData ?? [], itemStyle: { color: '#1565c0' } }],
  })

  nextTick(() => chart?.resize())

  chart.on('dataZoom', () => {
    if (isProgrammaticZoom) {
      isProgrammaticZoom = false
      return
    }
    const option = chart!.getOption() as { dataZoom: { start?: number, end?: number, startValue?: number, endValue?: number }[] }
    const dz = option.dataZoom[0]
    let startTs: number | undefined
    let endTs: number | undefined
    if (axisMin != null && axisMax != null && dz.start != null && dz.end != null) {
      startTs = axisMin + ((axisMax - axisMin) * dz.start) / 100
      endTs = axisMin + ((axisMax - axisMin) * dz.end) / 100
    }
    else if (dz.startValue != null && dz.endValue != null) {
      startTs = dz.startValue
      endTs = dz.endValue
    }
    if (startTs == null || endTs == null || !Number.isFinite(startTs) || !Number.isFinite(endTs))
      return
    emit('update:start', msToDate(startTs))
    emit('update:end', msToDate(endTs))
  })

  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(containerRef.value)

  syncWindowToProp()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})

watch(() => props.histogramData, (data) => {
  if (!chart)
    return
  computeAxisBounds()
  chart.setOption({
    xAxis: { min: axisMin, max: axisMax },
    series: [{ data: data ?? [] }],
  })
  syncWindowToProp()
})

watch(() => props.dateRange, (range) => {
  if (!chart || !range)
    return
  computeAxisBounds()
  chart.setOption({ xAxis: { min: axisMin, max: axisMax } })
  syncWindowToProp()
})

// When selected dates change externally (inputs, presets), sync the dataZoom window.
watch(() => [props.start, props.end] as const, ([start, end]) => {
  if (start && end)
    setWindow(start, end)
}, { flush: 'post' })
</script>

<template>
  <div class="date-range-slider-wrapper">
    <div
      v-show="!isEmpty"
      ref="container"
      class="date-range-slider"
      role="img"
      aria-label="Change frequency histogram — use the date inputs below to adjust the range"
    />
    <div class="date-range-empty" :class="{ 'date-range-empty--visible': isEmpty }" aria-live="polite" aria-atomic="true">
      <span v-if="isEmpty">No change data available for this area</span>
    </div>
  </div>
</template>

<style scoped>
.date-range-slider-wrapper {
  position: relative;
  height: 140px;
}

.date-range-slider {
  height: 100%;
}

.date-range-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.date-range-empty--visible {
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-text-muted, #888);
  font-size: var(--text-sm, 0.875rem);
}
</style>
