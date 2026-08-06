// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import { createFeature } from '../factories'
import '../mocks/turf'

const feature = createFeature({ id: 'n1', properties: { links: 0 } })

function mountObject(toolsOnly = false, withBeforeSlot = false) {
  return mount(LoChaObject, {
    props: { feature, toolsOnly },
    slots: withBeforeSlot
      ? { before: () => h('span', { class: 'before-slot-content' }, 'before') }
      : {},
  })
}

describe('loChaObject — toolsOnly', () => {
  it('shows version link, date, username when toolsOnly is false', () => {
    const wrapper = mountObject(false)
    expect(wrapper.find('.wrap > a').exists()).toBe(true)
    expect(wrapper.find('.date').exists()).toBe(true)
  })

  it('hides version link, date, username when toolsOnly is true', () => {
    const wrapper = mountObject(true)
    expect(wrapper.find('.wrap > a').exists()).toBe(false)
    expect(wrapper.find('.date').exists()).toBe(false)
  })

  it('hides the before slot content when toolsOnly is true', () => {
    const wrapper = mountObject(true, true)
    expect(wrapper.find('.before-slot-content').exists()).toBe(false)
  })

  it('shows the before slot content when toolsOnly is false', () => {
    const wrapper = mountObject(false, true)
    expect(wrapper.find('.before-slot-content').exists()).toBe(true)
  })

  it('always shows the fab (Tools button) regardless of toolsOnly', () => {
    const wrapperDefault = mountObject(false)
    const wrapperTools = mountObject(true)
    expect(wrapperDefault.find('.fab').exists()).toBe(true)
    expect(wrapperTools.find('.fab').exists()).toBe(true)
  })
})
