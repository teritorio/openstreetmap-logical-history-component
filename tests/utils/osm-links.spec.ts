import { describe, expect, it } from 'vitest'
import {
  getDeepHistoryUrl,
  getJosmUrl,
  getOsmHistoryUrl,
  getOsmHistoryViewerUrl,
  getOsmUserUrl,
  OBJTYPE_FULL,
} from '@/utils/osm-links'

describe('osm-links', () => {
  describe('objtype_full', () => {
    it('maps n to node', () => {
      expect(OBJTYPE_FULL.n).toBe('node')
    })

    it('maps w to way', () => {
      expect(OBJTYPE_FULL.w).toBe('way')
    })

    it('maps r to relation', () => {
      expect(OBJTYPE_FULL.r).toBe('relation')
    })
  })

  describe('getOsmHistoryUrl', () => {
    it('returns correct URL for node', () => {
      expect(getOsmHistoryUrl('n', 123)).toBe('https://www.openstreetmap.org/node/123/history')
    })

    it('returns correct URL for way', () => {
      expect(getOsmHistoryUrl('w', 456)).toBe('https://www.openstreetmap.org/way/456/history')
    })

    it('returns correct URL for relation', () => {
      expect(getOsmHistoryUrl('r', 789)).toBe('https://www.openstreetmap.org/relation/789/history')
    })
  })

  describe('getOsmUserUrl', () => {
    it('returns correct URL for plain username', () => {
      expect(getOsmUserUrl('testuser')).toBe('https://www.openstreetmap.org/user/testuser')
    })

    it('encodes special characters in username', () => {
      expect(getOsmUserUrl('user name')).toBe('https://www.openstreetmap.org/user/user%20name')
    })

    it('encodes unicode characters', () => {
      expect(getOsmUserUrl('usér/ñame')).toBe(`https://www.openstreetmap.org/user/${encodeURIComponent('usér/ñame')}`)
    })
  })

  describe('getJosmUrl', () => {
    it('uses http protocol (not https)', () => {
      const url = getJosmUrl('n', 1)
      expect(url).toMatch(/^http:\/\//)
      expect(url).not.toMatch(/^https:\/\//)
    })

    it('returns correct URL for node', () => {
      expect(getJosmUrl('n', 100)).toBe('http://127.0.0.1:8111/load_object?objects=n100')
    })

    it('returns correct URL for way', () => {
      expect(getJosmUrl('w', 200)).toBe('http://127.0.0.1:8111/load_object?objects=w200')
    })

    it('returns correct URL for relation', () => {
      expect(getJosmUrl('r', 300)).toBe('http://127.0.0.1:8111/load_object?objects=r300')
    })
  })

  describe('getDeepHistoryUrl', () => {
    it('returns correct URL for node', () => {
      expect(getDeepHistoryUrl('n', 10)).toBe('https://osmlab.github.io/osm-deep-history/#/node/10')
    })

    it('returns correct URL for way', () => {
      expect(getDeepHistoryUrl('w', 20)).toBe('https://osmlab.github.io/osm-deep-history/#/way/20')
    })

    it('returns correct URL for relation', () => {
      expect(getDeepHistoryUrl('r', 30)).toBe('https://osmlab.github.io/osm-deep-history/#/relation/30')
    })
  })

  describe('getOsmHistoryViewerUrl', () => {
    it('returns correct URL for node', () => {
      expect(getOsmHistoryViewerUrl('n', 10)).toBe('https://pewu.github.io/osm-history/#/node/10')
    })

    it('returns correct URL for way', () => {
      expect(getOsmHistoryViewerUrl('w', 20)).toBe('https://pewu.github.io/osm-history/#/way/20')
    })

    it('returns correct URL for relation', () => {
      expect(getOsmHistoryViewerUrl('r', 30)).toBe('https://pewu.github.io/osm-history/#/relation/30')
    })
  })
})
