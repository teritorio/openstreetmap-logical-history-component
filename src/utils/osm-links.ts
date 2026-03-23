export function getOsmHistoryUrl(objtype: string, id: number): string {
  return `https://www.openstreetmap.org/${objtype}/${id}/history`
}

export function getOsmUserUrl(username: string): string {
  return `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`
}

export function getJosmUrl(objtype: string, id: number): string {
  return `http://127.0.0.1:8111/load_object?objects=${objtype[0]}${id}`
}

export function getDeepHistoryUrl(objtype: string, id: number): string {
  return `https://osmlab.github.io/osm-deep-history/#/${objtype}/${id}`
}

export function getOsmHistoryViewerUrl(objtype: string, id: number): string {
  return `https://pewu.github.io/osm-history/#/${objtype}/${id}`
}
