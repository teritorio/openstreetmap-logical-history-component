import type { ObjectType } from '@/types'

export const OBJTYPE_FULL: Record<ObjectType, string> = {
  n: 'node',
  w: 'way',
  r: 'relation',
}

export function getOsmHistoryUrl(objtype: ObjectType, id: number): string {
  return `https://www.openstreetmap.org/${OBJTYPE_FULL[objtype]}/${id}/history`
}

export function getOsmUserUrl(username: string): string {
  return `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`
}

export function getJosmUrl(objtype: ObjectType, id: number): string {
  return `http://127.0.0.1:8111/load_object?objects=${objtype}${id}`
}

export function getDeepHistoryUrl(objtype: ObjectType, id: number): string {
  return `https://osmlab.github.io/osm-deep-history/#/${OBJTYPE_FULL[objtype]}/${id}`
}

export function getOsmHistoryViewerUrl(objtype: ObjectType, id: number): string {
  return `https://pewu.github.io/osm-history/#/${OBJTYPE_FULL[objtype]}/${id}`
}
