export function parseBbox(bbox: string): [number, number, number, number] | null {
  const parts = bbox.split(',').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN))
    return null
  return parts as [number, number, number, number]
}
