import type { ImageTransform } from './model'

export function snapToCenter(transform: ImageTransform, toleranceMm: number): ImageTransform {
  return {
    ...transform,
    x: Math.abs(transform.x) <= toleranceMm ? 0 : transform.x,
    y: Math.abs(transform.y) <= toleranceMm ? 0 : transform.y
  }
}

export function centerAlignment(transform: ImageTransform): { horizontal: boolean; vertical: boolean } {
  return { horizontal: Math.abs(transform.x) < 1e-7, vertical: Math.abs(transform.y) < 1e-7 }
}
