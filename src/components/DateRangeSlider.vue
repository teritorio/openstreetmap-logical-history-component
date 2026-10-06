<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

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
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
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

onMounted(() => {
  if (!containerRef.value)
    return

  computeAxisBounds()

  chart = echarts.init(containerRef.value)
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 4, right: 4, top: 2, bottom: 38 },
    xAxis: {
      type: 'time',
      min: axisMin,
      max: axisMax,
      axisLabel: { fontSize: 10, color: '#888' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: { show: false, type: 'log', logBase: 10, min: 1 },
    tooltip: { trigger: 'axis' },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 16,
        bottom: 4,
        handleStyle: { color: '#082e4e' },
        selectedDataBackground: { lineStyle: { color: '#082e4e' }, areaStyle: { color: '#082e4e' } },
        fillerColor: 'rgba(8, 46, 78, 0.15)',
        borderColor: '#c0c0c8',
        dataBackground: { lineStyle: { color: '#bbb' }, areaStyle: { color: '#ddd' } },
        showDetail: false,
      },
      { type: 'inside', xAxisIndex: 0 },
    ],
    series: [{
      type: 'bar',
      name: 'Changes',
      data: props.histogramData ?? [],
      itemStyle: { color: '#082e4e', opacity: 0.6 },
    }],
  })

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
    if (startTs == null || endTs == null)
      return
    emit('update:start', msToDate(startTs))
    emit('update:end', msToDate(endTs))
  })

  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(containerRef.value)

  if (props.start && props.end)
    setWindow(props.start, props.end)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})

// When new histogram data arrives, update series and recalibrate axis.
watch(() => props.histogramData, (data) => {
  if (!chart)
    return
  computeAxisBounds()
  chart.setOption({
    xAxis: { min: axisMin, max: axisMax },
    series: [{ data: data ?? [] }],
  })
  if (props.start && props.end)
    setWindow(props.start, props.end)
})

// When manifest date range arrives, fix the full-coverage x-axis.
watch(() => props.dateRange, (range) => {
  if (!chart || !range)
    return
  axisMin = dateToMs(range.min_date.slice(0, 10))
  axisMax = dateToMs(range.max_date.slice(0, 10))
  chart.setOption({ xAxis: { min: axisMin, max: axisMax } })
  if (props.start && props.end)
    setWindow(props.start, props.end)
})

// When selected dates change externally (inputs, presets), sync the dataZoom window.
watch(() => [props.start, props.end] as const, ([start, end]) => {
  if (start && end)
    setWindow(start, end)
}, { flush: 'post' })
</script>

<template>
  <div ref="container" class="date-range-slider" />
</template>

<style scoped>
.date-range-slider {
  height: 140px;
}
</style>
