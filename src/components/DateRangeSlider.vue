<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import ApexCharts from 'apexcharts'
import { computed, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps<{
  start?: string
  end?: string
  histogramData?: [number, number][]
}>()

const emit = defineEmits<{
  (e: 'update:start', value: string): void
  (e: 'update:end', value: string): void
}>()

const OSM_EPOCH_MS = new Date('2009-04-21').getTime()
const TODAY_MS = Date.UTC(
  new Date().getUTCFullYear(),
  new Date().getUTCMonth(),
  new Date().getUTCDate(),
)

function dateToMs(date: string): number {
  return new Date(date).getTime()
}

function msToDate(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

const FLAT_SERIES = [[OSM_EPOCH_MS, 0], [TODAY_MS, 0]] as [number, number][]

const histogramSeries = computed(() => [{
  name: 'changes',
  data: props.histogramData ?? FLAT_SERIES,
}])

const histogramOptions: ApexOptions = {
  chart: {
    id: 'locha-histogram',
    type: 'bar',
    height: 100,
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: false },
    selection: { enabled: false },
  },
  xaxis: {
    type: 'datetime',
    min: OSM_EPOCH_MS,
    max: TODAY_MS,
    labels: {
      style: { fontSize: '10px', colors: '#888' },
      datetimeUTC: true,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false, min: 0 },
  grid: { show: false },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: { enabled: false },
  plotOptions: { bar: { columnWidth: '80%' } },
  colors: ['#082e4e'],
  fill: { opacity: 0.35 },
}

const brushOptions: ApexOptions = {
  chart: {
    id: 'locha-brush',
    type: 'area',
    height: 70,
    background: 'transparent',
    brush: {
      target: 'locha-histogram',
      enabled: true,
    },
    selection: {
      enabled: true,
      fill: { color: '#082e4e', opacity: 0.1 },
      stroke: { width: 1, color: '#082e4e', dashArray: 0, opacity: 0.9 },
      xaxis: {
        min: props.start ? dateToMs(props.start) : OSM_EPOCH_MS,
        max: props.end ? dateToMs(props.end) : TODAY_MS,
      },
    },
    events: {
      selection(_ctx: unknown, { xaxis }: { xaxis: { min: number, max: number } }) {
        emit('update:start', msToDate(xaxis.min))
        emit('update:end', msToDate(xaxis.max))
      },
    },
    toolbar: { show: false },
    animations: { enabled: false },
  },
  xaxis: {
    type: 'datetime',
    min: OSM_EPOCH_MS,
    max: TODAY_MS,
    tooltip: { enabled: false },
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false, min: 0, max: 1 },
  fill: { opacity: 0 },
  stroke: { width: 0 },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: { show: false },
  tooltip: { enabled: false },
}

const brushSeries = [{ name: '', data: FLAT_SERIES }]

watch(
  () => [props.start, props.end] as const,
  ([start, end]) => {
    ApexCharts.exec('locha-brush', 'updateOptions', {
      chart: {
        selection: {
          xaxis: {
            min: start ? dateToMs(start) : OSM_EPOCH_MS,
            max: end ? dateToMs(end) : TODAY_MS,
          },
        },
      },
    }, false, false)
  },
)
</script>

<template>
  <div class="date-range-slider">
    <VueApexCharts
      type="bar"
      height="100"
      :options="histogramOptions"
      :series="histogramSeries"
    />
    <VueApexCharts
      type="area"
      height="70"
      :options="brushOptions"
      :series="brushSeries"
    />
  </div>
</template>

<style scoped>
.date-range-slider {
  display: flex;
  flex-direction: column;
}

:deep(.apexcharts-canvas) {
  background: transparent !important;
}
</style>
