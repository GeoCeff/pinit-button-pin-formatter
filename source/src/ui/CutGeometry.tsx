import type { CircleSettings } from '../core/model'

export function CutMark() {
  return (
    <svg viewBox="-12 -16 144 144" fill="currentColor" aria-hidden="true">
      <path d="M7 3H74V27H31V47H68V69H31V109H7Z" />
      <path d="M78 3Q118 3 118 42V74Q118 109 78 109H49V85H75Q94 85 94 69V43Q94 27 78 27Z" />
    </svg>
  )
}

export function CutGeometry() {
  return (
    <svg className="cut-geometry" viewBox="0 0 280 180" fill="none" aria-hidden="true">
      <path d="M44 15h102l28 28v122H44V15Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M146 15v28h28" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="109" cy="94" r="43" fill="var(--panel)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="109" cy="94" r="34" stroke="currentColor" strokeDasharray="4 4" />
      <path d="M191 73h45m-9-9 9 9-9 9M191 115h45" stroke="currentColor" strokeWidth="1.5" />
      <path d="M236 106v18m-45-18v18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function PinDimensions({ circles }: { circles: CircleSettings }) {
  const face = Number.isFinite(circles.inner / circles.outer) ? Math.max(0, Math.min(1, circles.inner / circles.outer)) * 42 : 35
  return (
    <svg className="pin-dimensions" viewBox="0 0 240 112" fill="none" role="img" aria-label="Cut boundary surrounds the visible pin face">
      <circle cx="64" cy="56" r="42" fill="var(--canvas)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="64" cy="56" r={face} stroke="currentColor" strokeDasharray="3 3" />
      <path d="M110 30h25m-25 49h25" stroke="currentColor" />
      <text x="144" y="34" fill="currentColor">Cut boundary</text>
      <text x="144" y="83" fill="currentColor">Visible face</text>
    </svg>
  )
}
