// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollToSection } from './scrollToSection'

// jsdom does not implement CSS.escape
if (!globalThis.CSS?.escape) {
  globalThis.CSS = { escape: (s: string) => s.replace(/([^\w-])/g, '\\$1') } as typeof CSS
}

describe('scrollToSection', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('returns false when element is not found', () => {
    expect(scrollToSection('nonexistent', { container })).toBe(false)
  })

  it('scrolls to element by id and returns true', () => {
    const target = document.createElement('div')
    target.id = 'my-section'
    container.appendChild(target)
    target.scrollIntoView = vi.fn()

    expect(scrollToSection('my-section', { container })).toBe(true)
    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
  })

  it('strips leading # from sectionId', () => {
    const target = document.createElement('div')
    target.id = 'anchor'
    container.appendChild(target)
    target.scrollIntoView = vi.fn()

    expect(scrollToSection('#anchor', { container })).toBe(true)
    expect(target.scrollIntoView).toHaveBeenCalled()
  })

  it('respects custom ScrollIntoViewOptions', () => {
    const target = document.createElement('div')
    target.id = 'custom'
    container.appendChild(target)
    target.scrollIntoView = vi.fn()

    scrollToSection('custom', { container, behavior: 'instant', block: 'center' })

    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'instant',
      block: 'center',
      inline: 'nearest',
    })
  })

  it('defaults to document as container', () => {
    const target = document.createElement('div')
    target.id = 'in-document'
    document.body.appendChild(target)
    target.scrollIntoView = vi.fn()

    expect(scrollToSection('in-document')).toBe(true)
    expect(target.scrollIntoView).toHaveBeenCalled()
  })
})
