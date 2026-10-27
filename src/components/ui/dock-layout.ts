export const DOCK_BASE = 48
export const DOCK_GAP = 16
const MAX_SCALE = 1.35
const SPREAD = 54

export function dockLayout(count: number, pointer: number | null) {
  const scales = Array.from({ length: count }, (_, index) => {
    if (pointer === null) return 1
    const distance = pointer - (index * (DOCK_BASE + DOCK_GAP) + DOCK_BASE / 2)
    return 1 + (MAX_SCALE - 1) * Math.exp(-(distance * distance) / (2 * SPREAD * SPREAD))
  })
  const extra = scales.map(scale => (scale - 1) * DOCK_BASE)
  const total = extra.reduce((sum, width) => sum + width, 0)
  let before = 0
  const shifts = extra.map(width => { const shift = before + width / 2 - total / 2; before += width; return shift })
  return { scales, shifts }
}
