import { describe, expect, it } from 'vitest'
import helloWorld from '../src/index'

describe('basic test', () => {
  it('should say hello world', () => {
    expect(helloWorld()).toBe('Hello World')
  })
})
