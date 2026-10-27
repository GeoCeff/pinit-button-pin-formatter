import { describe, expect, it } from 'vitest'
import { centerAlignment, snapToCenter } from './alignment'

const transform = { x: 0.7, y: -2, rotation: 37, mmPerPixel: 0.04 }
describe('artwork center alignment', () => {
  it('snaps each axis independently without changing scale or rotation', () => {
    expect(snapToCenter(transform, 1)).toEqual({ ...transform, x: 0 })
    expect(snapToCenter({ ...transform, x: -0.7, y: 0.9 }, 1)).toEqual({ ...transform, x: 0, y: 0 })
    expect(snapToCenter({ ...transform, x: -2, y: 0.5 }, 1)).toEqual({ ...transform, x: -2, y: 0 })
  })
  it('leaves intentional offsets outside the snap zone untouched', () => {
    expect(snapToCenter(transform, 0.5)).toEqual(transform)
    expect(snapToCenter({ ...transform, x: 1, y: -1 }, 1)).toEqual({ ...transform, x: 0, y: 0 })
  })
  it('uses screen-scaled tolerance without rounding away deliberate edits', () => {
    const screenTolerance = 6
    expect(snapToCenter({ ...transform, x: 5 / 8 }, screenTolerance / 8).x).toBe(0)
    expect(snapToCenter({ ...transform, x: 7 / 8 }, screenTolerance / 8).x).toBe(7 / 8)
    expect(snapToCenter({ ...transform, x: 5 / 4 }, screenTolerance / 4).x).toBe(0)
    expect(centerAlignment({ ...transform, x: 0.001, y: 0 })).toEqual({ horizontal: false, vertical: true })
  })
  it('recognizes the rotated image center and tolerates only floating-point noise', () => {
    expect(centerAlignment({ ...transform, x: 0, y: 0 })).toEqual({ horizontal: true, vertical: true })
    expect(centerAlignment({ ...transform, x: 1e-9, y: -1e-9 })).toEqual({ horizontal: true, vertical: true })
    expect(centerAlignment(transform)).toEqual({ horizontal: false, vertical: false })
  })
})
