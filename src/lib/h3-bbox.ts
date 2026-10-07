// Port of KarmaMap web/changes/h3-bbox.js — canonical source:
// https://github.com/teritorio/KarmaMap/blob/main/web/changes/h3-bbox.js
import { cellToBoundary, gridDisk, latLngToCell, polygonToCells } from 'h3-js'

type BBox = [number, number, number, number]
type Point = [number, number]
type Ring = Point[]

export function bboxToCells(bbox: BBox, resolution: number): string[] {
  const [minLng, minLat, maxLng, maxLat] = bbox
  const ring: Ring = [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ]

  let seeds = polygonToCells([ring], resolution, true)
  if (seeds.length === 0)
    seeds = [latLngToCell((minLat + maxLat) / 2, (minLng + maxLng) / 2, resolution)]

  const candidates = new Set<string>()
  for (const seed of seeds) {
    candidates.add(seed)
    for (const neighbor of gridDisk(seed, 1))
      candidates.add(neighbor)
  }

  return [...candidates].filter(hex => polygonIntersectsRect(cellToBoundary(hex, true) as Ring, bbox))
}

export function cellsMinMaxSet(hexCells: string[]): { min: bigint, max: bigint, set: Set<bigint> } {
  if (hexCells.length === 0)
    throw new Error('bboxToCells returned no cells — is the bbox valid?')

  const values = hexCells.map(hex => BigInt(`0x${hex}`))
  let min = values[0]!
  let max = values[0]!
  const set = new Set<bigint>()

  for (const v of values) {
    if (v < min)
      min = v
    if (v > max)
      max = v
    set.add(v)
  }

  return { min, max, set }
}

function pointInRect(pt: Point, rect: BBox): boolean {
  const [x, y] = pt
  const [minX, minY, maxX, maxY] = rect
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

function segmentIntersectsRect(p0: Point, p1: Point, rect: BBox): boolean {
  const [minX, minY, maxX, maxY] = rect
  const dx = p1[0] - p0[0]
  const dy = p1[1] - p0[1]
  let t0 = 0
  let t1 = 1
  const p = [-dx, dx, -dy, dy]
  const q = [p0[0] - minX, maxX - p0[0], p0[1] - minY, maxY - p0[1]]
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i]! < 0)
        return false
    }
    else {
      const r = q[i]! / p[i]!
      if (p[i]! < 0) {
        if (r > t1)
          return false
        if (r > t0)
          t0 = r
      }
      else {
        if (r < t0)
          return false
        if (r < t1)
          t1 = r
      }
    }
  }
  return true
}

function pointInPolygon(pt: Point, ring: Ring): boolean {
  const [x, y] = pt
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function polygonIntersectsRect(ring: Ring, rect: BBox): boolean {
  if (ring.some(pt => pointInRect(pt, rect)))
    return true
  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
    if (segmentIntersectsRect(ring[j]!, ring[i]!, rect))
      return true
  }
  const [minX, minY, maxX, maxY] = rect
  const corners: Ring = [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]]
  return corners.some(pt => pointInPolygon(pt, ring))
}
