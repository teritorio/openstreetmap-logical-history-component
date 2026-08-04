// @vitest-environment jsdom

import type { LoCha } from '@/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'
import LoChaGroup from '@/components/LoCha/LoChaGroup.vue'
import { LOCHA_INSTANCE_ID_KEY, LOCHA_KEY } from '@/constants/injectionKeys'
import { createApiResponse, createFeature, createLink } from '../factories'

const LoChaObjectStub = { template: '<div><slot /><slot name="object-detail" /><slot name="before" /></div>' }
const VMapStub = { template: '<div />' }

function makeProvide(forceMultiColumn?: boolean): LoCha {
  const loChaData = createApiResponse(
    [],
    [[createLink({ before: 'n1', after: 'n2' })]],
    forceMultiColumn !== undefined ? { forceMultiColumn } : {},
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
        [LOCHA_KEY as symbol]: makeProvide(forceMultiColumn),
        [LOCHA_INSTANCE_ID_KEY as symbol]: 'test-instance',
      },
      stubs: { LoChaObject: LoChaObjectStub, VMap: VMapStub },
    },
  })
}

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
