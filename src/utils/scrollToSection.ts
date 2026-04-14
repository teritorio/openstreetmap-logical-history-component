export interface ScrollToSectionOptions extends ScrollIntoViewOptions {
  container?: Element | Document
}

export function scrollToSection(sectionId: string, options: ScrollToSectionOptions = {}): boolean {
  const {
    container = document,
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
  } = options

  const id = sectionId.startsWith('#') ? sectionId.slice(1) : sectionId
  const element = container.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null

  if (!element) {
    console.warn(`Element with ID "${sectionId}" not found`)
    return false
  }

  element.scrollIntoView({
    behavior,
    block,
    inline,
  })

  return true
}
