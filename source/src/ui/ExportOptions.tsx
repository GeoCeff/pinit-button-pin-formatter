import { useState } from 'react'
import type { ExportSettings } from '../core/model'
import { CenterColorField, Check, NumberField, SelectField } from './controls'

export function ExportOptions({
  value: s,
  onChange,
  onProfile,
  cmyk,
  lowResCount = 0,
}: {
  value: ExportSettings
  onChange: (s: ExportSettings) => void
  onProfile: () => void
  cmyk: boolean
  lowResCount?: number
}) {
  const [customDpi, setCustomDpi] = useState(s.dpi !== 300 && s.dpi !== 600)

  return (
    <>
      <SelectField label="File format" value={s.format} onChange={v => onChange({ ...s, format: v as typeof s.format })}>
        <option value="pdf">PDF · all sheets in one file</option>
        <option value="png">PNG · one file per sheet</option>
        <option value="jpg">JPG · one file per sheet</option>
        <option value="pins">Individual pins (PNG) · one file per design</option>
      </SelectField>
      {s.format === 'pdf' ? (
        <>
          <SelectField label="PDF color" value={s.color} onChange={v => onChange({ ...s, color: v as typeof s.color })}>
            <option value="cmyk">CMYK · ICC conversion</option>
            <option value="rgb">RGB</option>
          </SelectField>
          {s.color === 'cmyk' ? (
            <>
              <p className="hint">
                {s.profile ? 'Custom CMYK profile' : 'Bundled generic CMYK profile'} · {cmyk ? 'engine ready' : 'engine missing'}
              </p>
              <div className="actions">
                <button onClick={onProfile}>Import ICC profile</button>
                {s.profile ? <button onClick={() => onChange({ ...s, profile: null })}>Use generic</button> : null}
              </div>
              <SelectField label="Rendering intent" value={String(s.intent)} onChange={v => onChange({ ...s, intent: Number(v) as typeof s.intent })}>
                <option value="0">Perceptual</option>
                <option value="1">Relative colorimetric</option>
                <option value="2">Saturation</option>
                <option value="3">Absolute colorimetric</option>
              </SelectField>
            </>
          ) : null}
        </>
      ) : s.format === 'pins' ? (
        <p className="hint">Exports one circular PNG per active design at exact cut diameter and chosen DPI.</p>
      ) : (
        <p className="hint">Raster exports use RGB with a white sheet background.</p>
      )}
      <SelectField label="Raster resolution" value={customDpi ? 'custom' : String(s.dpi)} onChange={v => {
        setCustomDpi(v === 'custom')
        if (v !== 'custom') onChange({ ...s, dpi: Number(v) })
      }}>
        <option value="300">300 DPI (recommended for everyday printing)</option>
        <option value="600">600 DPI (for fine detail in high-resolution artwork)</option>
        <option value="custom">Custom DPI</option>
      </SelectField>
      {customDpi ? (
        <NumberField label="Custom DPI" value={s.dpi} onChange={v => onChange({ ...s, dpi: v })} unit="DPI" min={1} max={2400} integer />
      ) : null}
      {s.format === 'jpg' ? <NumberField label="JPG quality" value={s.quality} onChange={v => onChange({ ...s, quality: v })} unit="%" min={1} max={100} /> : null}
      <h3>Include printed guides</h3>
      <div className="checks">
        <Check label="Cut boundary" checked={s.guides.outer} onChange={v => onChange({ ...s, guides: { ...s.guides, outer: v } })} />
        <Check label="Face / fold guide" checked={s.guides.inner} onChange={v => onChange({ ...s, guides: { ...s.guides, inner: v } })} />
        <Check label="Safe guide" checked={s.guides.safe} onChange={v => onChange({ ...s, guides: { ...s.guides, safe: v } })} />
        <Check label="Center" checked={!!s.guides.center} onChange={v => onChange({ ...s, guides: { ...s.guides, center: v } })} />
        {s.format !== 'pins' ? (
          <Check label="Cut crosshairs" checked={!!s.guides.crosshairs} onChange={v => onChange({ ...s, guides: { ...s.guides, crosshairs: v } })} />
        ) : null}
      </div>
      {s.guides.center ? (
        <CenterColorField value={s.guides.centerColor} onChange={centerColor => onChange({ ...s, guides: { ...s.guides, centerColor } })} />
      ) : null}
      {s.format !== 'pins' ? (
        <div className="checks">
          <Check label="Print job label in bottom margin" checked={!!s.sheetLabel} onChange={v => onChange({ ...s, sheetLabel: v })} />
        </div>
      ) : null}
      {lowResCount > 0 ? (
        <p className="export-warning" role="status">
          {lowResCount} active {lowResCount === 1 ? 'design is' : 'designs are'} below 200 source PPI and may look soft in print.
        </p>
      ) : null}
      <p className="hint">The preview shows crop and layout in RGB. Print at 100% and measure a calibration sheet before production.</p>
    </>
  )
}
