import type maplibre from 'maplibre-gl'
import type { Ref, ShallowRef } from 'vue'
import { ref } from 'vue'

export interface UseDrawModeOptions {
  onDrawMove: (bbox: string) => void
  onDrawEnd: (bbox: string) => void
  onDrawCancel: () => void
}

export function useDrawMode(map: ShallowRef<maplibre.Map | null>, options: UseDrawModeOptions): { isDrawing: Ref<boolean>, toggle: () => void } {
  const isDrawing = ref(false)
  let drawStart: maplibre.LngLat | null = null

  function computeBbox(a: maplibre.LngLat, b: maplibre.LngLat): string {
    return `${Math.min(a.lng, b.lng)},${Math.min(a.lat, b.lat)},${Math.max(a.lng, b.lng)},${Math.max(a.lat, b.lat)}`
  }

  function onDrawMouseMove(e: maplibre.MapMouseEvent): void {
    if (!drawStart)
      return
    options.onDrawMove(computeBbox(drawStart, e.lngLat))
  }

  function deactivate(): void {
    if (!map.value)
      return
    map.value.off('mousedown', onDrawMouseDown)
    map.value.off('mousemove', onDrawMouseMove)
    map.value.off('mouseup', onDrawMouseUp)
    map.value.getCanvas().removeEventListener('mouseleave', cancel)
    map.value.getCanvas().style.cursor = ''
    map.value.dragPan.enable()
    isDrawing.value = false
    drawStart = null
  }

  function cancel(): void {
    deactivate()
    options.onDrawCancel()
  }

  function onDrawMouseUp(e: maplibre.MapMouseEvent): void {
    if (!drawStart || !map.value)
      return
    const startPx = map.value.project(drawStart)
    const endPx = map.value.project(e.lngLat)
    if (Math.abs(endPx.x - startPx.x) < 4 && Math.abs(endPx.y - startPx.y) < 4) {
      cancel()
      return
    }
    const bbox = computeBbox(drawStart, e.lngLat)
    deactivate()
    options.onDrawEnd(bbox)
  }

  function onDrawMouseDown(e: maplibre.MapMouseEvent): void {
    e.preventDefault()
    drawStart = e.lngLat
    map.value!.on('mousemove', onDrawMouseMove)
    map.value!.on('mouseup', onDrawMouseUp)
  }

  function toggle(): void {
    if (!map.value)
      return
    if (isDrawing.value) {
      cancel()
    }
    else {
      isDrawing.value = true
      map.value.getCanvas().style.cursor = 'crosshair'
      map.value.dragPan.disable()
      map.value.on('mousedown', onDrawMouseDown)
      map.value.getCanvas().addEventListener('mouseleave', cancel)
    }
  }

  return { isDrawing, toggle }
}
