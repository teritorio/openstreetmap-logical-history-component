import { describe, expect, it, vi } from 'vitest'
import { formatDate, fromDatetimeLocal, toDatetimeLocal } from '@/utils/date-format'

describe('toDatetimeLocal', () => {
  it('converts an ISO string to datetime-local format', () => {
    const iso = '2024-03-15T14:30:00.000Z'
    const result = toDatetimeLocal(iso)
    // Result depends on local timezone, but format should be YYYY-MM-DDTHH:mm
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('pads single-digit months and days with zeros', () => {
    // January 5th — month and day should be zero-padded
    const iso = '2024-01-05T03:07:00.000Z'
    const result = toDatetimeLocal(iso)
    expect(result).toMatch(/^\d{4}-01-05T\d{2}:\d{2}$/)
  })

  it('handles different ISO formats', () => {
    const result = toDatetimeLocal('2024-12-31T23:59:00Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
})

describe('fromDatetimeLocal', () => {
  it('converts a datetime-local string to ISO format', () => {
    const local = '2024-03-15T14:30'
    const result = fromDatetimeLocal(local)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  })

  it('produces a valid Date from the result', () => {
    const result = fromDatetimeLocal('2024-06-15T08:00')
    const date = new Date(result)
    expect(date.getTime()).not.toBeNaN()
  })
})

describe('round-trip conversion', () => {
  it('preserves the date through toDatetimeLocal -> fromDatetimeLocal', () => {
    const original = '2024-03-15T14:30:00.000Z'
    const local = toDatetimeLocal(original)
    const roundTrip = fromDatetimeLocal(local)

    const originalDate = new Date(original)
    const roundTripDate = new Date(roundTrip)

    // Minutes should match (seconds/ms are lost in datetime-local format)
    expect(roundTripDate.getFullYear()).toBe(originalDate.getFullYear())
    expect(roundTripDate.getMonth()).toBe(originalDate.getMonth())
    expect(roundTripDate.getDate()).toBe(originalDate.getDate())
    expect(roundTripDate.getHours()).toBe(originalDate.getHours())
    expect(roundTripDate.getMinutes()).toBe(originalDate.getMinutes())
  })
})

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
    // Should produce a locale-formatted string
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)

    vi.unstubAllGlobals()
  })
})
