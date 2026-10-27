import { describe, expect, it } from 'vitest'
import { DOCK_BASE, DOCK_GAP, dockLayout } from './dock-layout'

describe('floating dock layout', () => {
  it('rests without displacement and handles an empty dock', () => {
    expect(dockLayout(4, null)).toEqual({ scales: [1, 1, 1, 1], shifts: [0, 0, 0, 0] })
    expect(dockLayout(0, 0)).toEqual({ scales: [], shifts: [] })
  })
  it('magnifies the closest icon while keeping neighboring tiles separated', () => {
    for (const pointer of [0, 24, 70, 130, 215, 280]) {
      const { scales, shifts } = dockLayout(4, pointer)
      scales.forEach(scale => expect(scale).toBeGreaterThanOrEqual(1))
      scales.forEach(scale => expect(scale).toBeLessThanOrEqual(1.35))
      for (let i = 0; i < 3; i++) {
        const right = i * (DOCK_BASE + DOCK_GAP) + DOCK_BASE / 2 + shifts[i] + DOCK_BASE * scales[i] / 2
        const nextLeft = (i + 1) * (DOCK_BASE + DOCK_GAP) + DOCK_BASE / 2 + shifts[i + 1] - DOCK_BASE * scales[i + 1] / 2
        expect(nextLeft - right).toBeCloseTo(DOCK_GAP)
      }
    }
  })
})
