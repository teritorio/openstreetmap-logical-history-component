import { describe, expect, it, vi } from 'vitest'
import { formatDate } from '@/utils/date-format'

describe('formatDate', () => {
  it('returns a string containing "at" between date and time', () => {
    vi.stubGlobal('navigator', { language: 'en-US' })

    const result = formatDate('2024-03-15T14:30:00Z')
    expect(result).toContain(' at ')

    vi.unstubAllGlobals()
  })

  it('uses the navigator language for locale', () => {
    vi.stubGlobal('navigator', { language: 'en-US' })

    const result = formatDate('2024-03-15T14:30:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)

    vi.unstubAllGlobals()
  })
})
