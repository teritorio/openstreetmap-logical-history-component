// @vitest-environment jsdom

import type { LoCha } from '@/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import LoChaGroup from '@/components/LoCha/LoChaGroup.vue'
import { LOCHA_INSTANCE_ID_KEY, LOCHA_KEY } from '@/constants/injectionKeys'
import { createApiResponse, createFeature, createLink } from '../factories'

const LoChaObjectStub = defineComponent({
  props: { feature: Object, josmTarget: String, compact: Boolean, toolsOnly: Boolean },
  template: '<div :data-tools-only="toolsOnly"><slot /><slot name="object-detail" /><slot name="before" /></div>',
})
const VMapStub = { template: '<div />' }

function makeProvide(options: { forceMultiColumn?: boolean, links?: ReturnType<typeof createLink>[][] } = {}): LoCha {
  const loChaData = createApiResponse(
    [],
    options.links ?? [[createLink({ before: 'n1', after: 'n2' })]],
    options.forceMultiColumn !== undefined ? { forceMultiColumn: options.forceMultiColumn } : {},
  )
  const loCha = ref(loChaData)

  return {
    loCha,
    groups: ref([]),
    featureCount: computed(() => 0),
    setLoCha: () => {},
    resetLoCha: () => {},
    getStatus: () => 'updateAfter',
    getBeforeFeatures: features => features.filter(f => f.properties.is_before),
    getAfterFeatures: features => features.filter(f => !f.properties.is_before),
  }
}

const beforeFeature = createFeature({ id: 'n1', properties: { is_before: true, links: 0 } })
const afterFeature = createFeature({ id: 'n2', properties: { is_after: true, links: 0 } })
const features = [beforeFeature, afterFeature]

function mountGroup(forceMultiColumn?: boolean) {
  return mount(LoChaGroup, {
    props: { id: 'test-group', index: 0, features },
    global: {
      provide: {
        [LOCHA_KEY as symbol]: makeProvide({ forceMultiColumn }),
        [LOCHA_INSTANCE_ID_KEY as symbol]: 'test-instance',
      },
      stubs: { LoChaObject: LoChaObjectStub, VMap: VMapStub },
    },
  })
}

// Multi-link fixture: n1 → n3, n2 → n3 (two befores, one after)
const multiLinkBefore1 = createFeature({ id: 'n1', properties: { is_before: true, links: 0 } })
const multiLinkBefore2 = createFeature({ id: 'n2', properties: { is_before: true, links: 0 } })
const multiLinkAfter = createFeature({ id: 'n3', properties: { is_after: true, links: 0 } })
const multiLinkFeatures = [multiLinkBefore1, multiLinkBefore2, multiLinkAfter]
const multiLinkLinks = [[
  createLink({ before: 'n1', after: 'n3' }),
  createLink({ before: 'n2', after: 'n3' }),
]]

function mountMultiLink(withObjectDetailSlot = false) {
  return mount(LoChaGroup, {
    props: { id: 'test-group', index: 0, features: multiLinkFeatures },
    slots: withObjectDetailSlot
      ? { 'object-detail': () => h('span', 'detail') }
      : {},
    global: {
      provide: {
        [LOCHA_KEY as symbol]: makeProvide({ links: multiLinkLinks }),
        [LOCHA_INSTANCE_ID_KEY as symbol]: 'test-instance',
      },
      stubs: { LoChaObject: LoChaObjectStub, VMap: VMapStub },
    },
  })
}

describe('loChaGroup — toolsOnly', () => {
  it('does not set toolsOnly on after feature when no object-detail slot is provided', () => {
    const wrapper = mountMultiLink(false)
    const afterEl = wrapper.find('.after-list [data-tools-only]')
    expect(afterEl.attributes('data-tools-only')).toBe('false')
  })

  it('sets toolsOnly on after feature when object-detail slot is provided and multiple befores exist', () => {
    const wrapper = mountMultiLink(true)
    const afterEl = wrapper.find('.after-list [data-tools-only]')
    expect(afterEl.attributes('data-tools-only')).toBe('true')
  })

  it('does not set toolsOnly in a single-link group even with object-detail slot', () => {
    const wrapper = mount(LoChaGroup, {
      props: { id: 'test-group', index: 0, features },
      slots: { 'object-detail': () => h('span', 'detail') },
      global: {
        provide: {
          [LOCHA_KEY as symbol]: makeProvide({ forceMultiColumn: true }),
          [LOCHA_INSTANCE_ID_KEY as symbol]: 'test-instance',
        },
        stubs: { LoChaObject: LoChaObjectStub, VMap: VMapStub },
      },
    })
    const afterEl = wrapper.find('.after-list [data-tools-only]')
    expect(afterEl.attributes('data-tools-only')).toBe('false')
  })
})

describe('loChaGroup — forceMultiColumn', () => {
  it('hides before-list for a 1-before/1-after pair (default single-column behaviour)', () => {
    const wrapper = mountGroup()
    expect(wrapper.find('.before-list').exists()).toBe(false)
  })

  it('shows before-list when forceMultiColumn is true', () => {
    const wrapper = mountGroup(true)
    expect(wrapper.find('.before-list').exists()).toBe(true)
  })

  it('applies list--wide class to after-list in default single-column mode', () => {
    const wrapper = mountGroup()
    expect(wrapper.find('.after-list').classes()).toContain('list--wide')
  })

  it('does not apply list--wide when forceMultiColumn is true', () => {
    const wrapper = mountGroup(true)
    expect(wrapper.find('.after-list').classes()).not.toContain('list--wide')
  })
})
