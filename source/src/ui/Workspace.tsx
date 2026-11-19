import { useState } from 'react'
import { Component as AppleColorPicker } from '@/components/ui/apple-color-picker'
import { effectivePpi, type Asset, type Design, type FitMode } from '../core/model'
import { NumberField, SelectField } from './controls'
import { Icon } from './Icon'

function normalizeAngle(deg: number): number {
  const wrapped = ((deg + 180) % 360 + 360) % 360 - 180
  return wrapped === -180 ? 180 : Number(wrapped.toFixed(2))
}

export function ArtworkLibrary({
  designs,
  selectedId,
  sources,
  remainingSlots,
  variant,
  disabled,
  onImport,
  onManage,
  onSelect,
  onRemove,
  onDuplicate,
  onSetQuantity,
  onApplyFitAll,
  onSetQuantityAll,
  onFillSheet,
  onApplyEdgeFills,
  onApplyCurrentFillAll,
  currentFill,
}: {
  designs: Design[]
  selectedId?: string
  sources: Record<string, string>
  remainingSlots: number
  variant: 'tray' | 'gallery'
  disabled: boolean
  onImport: () => void
  onManage: () => void
  onSelect: (id: string) => void
  onRemove: (design: Design) => void
  onDuplicate: (design: Design) => void
  onSetQuantity: (id: string, quantity: number) => void
  onApplyFitAll: (mode: Exclude<FitMode, 'manual'>) => void
  onSetQuantityAll: (quantity: number) => void
  onFillSheet: () => void
  onApplyEdgeFills: () => void
  onApplyCurrentFillAll: () => void
  currentFill?: string
}) {
  const [batchCopies, setBatchCopies] = useState(5)

  return (
    <section className="designs-panel" aria-label="Artwork library" data-variant={variant}>
      <div className="library-header">
        {variant === 'tray' ? (
          <div className="artwork-rail-heading">
            <h2>Artwork</h2>
            <span className="item-count">{designs.length}</span>
          </div>
        ) : null}
        <button className="import-button" disabled={disabled} onClick={onImport}>
          <Icon name="upload" size={20} />
          <span>Import artwork</span>
        </button>
        {variant === 'gallery' ? <p className="hint">PNG, JPG or WebP · drag & drop or paste supported · original files preserved</p> : null}
      </div>

      {variant === 'gallery' && designs.length > 0 ? (
        <div className="batch-bar" role="region" aria-label="Batch artwork actions">
          <div className="batch-group">
            <span className="batch-label">Fit all</span>
            <div className="batch-buttons" role="group" aria-label="Fit all designs">
              <button type="button" disabled={disabled} onClick={() => onApplyFitAll('safe')}>Safe</button>
              <button type="button" disabled={disabled} onClick={() => onApplyFitAll('contain')}>Face</button>
              <button type="button" disabled={disabled} onClick={() => onApplyFitAll('fill')}>Fill</button>
              <button type="button" disabled={disabled} onClick={() => onApplyFitAll('bleed')}>Bleed</button>
            </div>
          </div>

          <div className="batch-group">
            <span className="batch-label">Fill all</span>
            <div className="batch-buttons">
              <button type="button" disabled={disabled} onClick={onApplyEdgeFills}>Match edges</button>
              {currentFill ? (
                <button type="button" disabled={disabled} onClick={onApplyCurrentFillAll} title={`Apply ${currentFill.toUpperCase()} to all`}>
                  Use {currentFill.toUpperCase()}
                </button>
              ) : null}
            </div>
          </div>

          <div className="batch-group">
            <label className="batch-copies-input">
              <span>Copies all</span>
              <input
                type="number"
                aria-label="Set copies for all designs"
                min={0}
                max={100000}
                step={1}
                value={Number.isFinite(batchCopies) ? batchCopies : ''}
                onChange={e => setBatchCopies(e.target.value === '' ? 0 : Math.max(0, Math.min(100000, Math.round(Number(e.target.value)))))}
              />
            </label>
            <button type="button" disabled={disabled} onClick={() => onSetQuantityAll(batchCopies)}>Apply</button>
            {remainingSlots > 0 ? (
              <button type="button" className="batch-fill-sheet" disabled={disabled} onClick={onFillSheet}>
                <Icon name="sparkles" size={14} />
                Fill {remainingSlots} empty {remainingSlots === 1 ? 'slot' : 'slots'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="design-list">
        {designs.length ? (
          designs.map(design => {
            const lowRes = effectivePpi(design.transform) < 200
            return (
              <div key={design.id} className={`design-row ${selectedId === design.id ? 'selected' : ''}`}>
                <button className="design-select" onClick={() => onSelect(design.id)} aria-pressed={selectedId === design.id}>
                  {sources[design.assetId] ? (
                    <img src={sources[design.assetId]} width="52" height="52" alt="" />
                  ) : (
                    <span className="missing-thumb">
                      <Icon name="image" />
                      <small>Missing</small>
                    </span>
                  )}
                  <span className="design-copy">
                    <strong title={design.name}>{design.name}</strong>
                    <span className="design-meta">
                      <small title={`${design.quantity.toLocaleString()} ${design.quantity === 1 ? 'copy' : 'copies'}`}>
                        {design.quantity.toLocaleString()} {design.quantity === 1 ? 'copy' : 'copies'}
                      </small>
                      {variant === 'tray' && lowRes ? (
                        <span className="tray-ppi-warning" title="Below 200 source PPI" aria-hidden="true">
                          <Icon name="alert" size={12} />
                        </span>
                      ) : null}
                      {selectedId === design.id ? (
                        <span className="design-selected-mark" aria-hidden="true">
                          <Icon name="check" size={12} />
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>

                {variant === 'gallery' ? (
                  <div className="gallery-card-footer">
                    <div className="card-stepper" role="group" aria-label={`Copies for ${design.name}`}>
                      <button
                        type="button"
                        className="icon-button"
                        disabled={disabled || design.quantity <= 0}
                        aria-label={`Decrease copies for ${design.name}`}
                        onClick={() => onSetQuantity(design.id, Math.max(0, design.quantity - 1))}
                      >
                        <Icon name="minus" size={13} />
                      </button>
                      <span>{design.quantity.toLocaleString()}</span>
                      <button
                        type="button"
                        className="icon-button"
                        disabled={disabled || design.quantity >= 100000}
                        aria-label={`Increase copies for ${design.name}`}
                        onClick={() => onSetQuantity(design.id, Math.min(100000, design.quantity + 1))}
                      >
                        <Icon name="plus" size={13} />
                      </button>
                    </div>
                    {lowRes ? (
                      <span className="ppi-badge" title="Source resolution is below 200 PPI at this print size">
                        <Icon name="alert" size={12} />
                        Low PPI
                      </span>
                    ) : null}
                    <div className="card-actions">
                      <button
                        type="button"
                        className="card-action-button"
                        disabled={disabled}
                        aria-label={`Duplicate ${design.name}`}
                        title={`Duplicate ${design.name}`}
                        onClick={() => onDuplicate(design)}
                      >
                        <Icon name="copy" size={14} />
                      </button>
                      <button
                        type="button"
                        className="remove-design"
                        disabled={disabled}
                        aria-label={`Remove ${design.name}`}
                        onClick={() => onRemove(design)}
                      >
                        <Icon name="trash" size={15} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })
        ) : (
          <div className="empty-list">
            <Icon name="image" size={24} />
            <div>
              <strong>No artwork yet</strong>
              <p>Import or drop PNG, JPG, or WebP files to get started.</p>
            </div>
          </div>
        )}
      </div>

      {variant === 'tray' ? (
        <div className="library-bottom">
          <button className="manage-library text-button" onClick={onManage}>
            <Icon name="folder" size={16} />
            Manage artwork
            <Icon name="right" size={14} />
          </button>
          <p>
            <Icon name="shield" size={14} />
            Original files preserved
          </p>
        </div>
      ) : null}
    </section>
  )
}

export function ArtworkControls({
  design,
  asset,
  onChange,
  onFit,
  onRelink,
  picking,
  onTogglePick,
  sourceReady,
  ioBusy,
}: {
  design: Design
  asset: Asset
  onChange: (patch: Partial<Design>, coalesceKey?: string) => void
  onFit: (mode: Exclude<FitMode, 'manual'>) => void
  onRelink: () => void
  picking: boolean
  onTogglePick: () => void
  sourceReady: boolean
  ioBusy: boolean
}) {
  const ppi = effectivePpi(design.transform)
  const [colorOpen, setColorOpen] = useState(false)
  const t = design.transform

  return (
    <div className="artwork-controls" aria-label="Artwork adjustments">
      <div className="inspector-heading">
        <h2>Artwork</h2>
        <button className="text-button" disabled={ioBusy} onClick={onRelink} aria-label="Replace or relink source">
          <Icon name="link" size={15} />
          Replace
        </button>
      </div>

      <section className="inspector-section">
        <h3>Position & size</h3>
        <SelectField
          label="Image fit"
          value={design.fit}
          onChange={value => (value === 'manual' ? onChange({ fit: 'manual' }) : onFit(value as Exclude<FitMode, 'manual'>))}
        >
          <option value="safe">Fit inside safe circle</option>
          <option value="contain">Fit inside face circle</option>
          <option value="fill">Fill face circle</option>
          <option value="bleed">Fill cut circle (full bleed)</option>
          <option value="manual">Manual</option>
        </SelectField>
        <div className="two-col">
          <NumberField
            label="Artwork width"
            value={asset.width * t.mmPerPixel}
            unit="mm"
            step={0.5}
            min={asset.width * 0.000001}
            onChange={value => onChange({ fit: 'manual', transform: { ...t, mmPerPixel: value / asset.width } }, 'width')}
          />
          <NumberField
            label="Rotation"
            value={t.rotation}
            unit="°"
            onChange={value => onChange({ fit: 'manual', transform: { ...t, rotation: value } }, 'rotation')}
          />
        </div>
        <div className="two-col">
          <NumberField
            label="Horizontal offset"
            value={t.x}
            unit="mm"
            step={0.5}
            onChange={value => onChange({ fit: 'manual', transform: { ...t, x: value } }, 'offsetX')}
          />
          <NumberField
            label="Vertical offset"
            value={t.y}
            unit="mm"
            step={0.5}
            onChange={value => onChange({ fit: 'manual', transform: { ...t, y: value } }, 'offsetY')}
          />
        </div>
        <div className="quick-transform-row" role="group" aria-label="Quick transform">
          <button
            type="button"
            aria-label="Rotate 90 degrees left"
            title="Rotate -90°"
            onClick={() => onChange({ fit: 'manual', transform: { ...t, rotation: normalizeAngle(t.rotation - 90) } })}
          >
            <Icon name="rotateLeft" size={14} />-90°
          </button>
          <button
            type="button"
            aria-label="Rotate 90 degrees right"
            title="Rotate +90°"
            onClick={() => onChange({ fit: 'manual', transform: { ...t, rotation: normalizeAngle(t.rotation + 90) } })}
          >
            <Icon name="rotateRight" size={14} />+90°
          </button>
          <button
            type="button"
            aria-label="Flip horizontally"
            aria-pressed={!!t.flipX}
            title="Flip horizontally"
            onClick={() => onChange({ fit: 'manual', transform: { ...t, flipX: !t.flipX } })}
          >
            <Icon name="flipH" size={14} />Flip H
          </button>
          <button
            type="button"
            aria-label="Flip vertically"
            aria-pressed={!!t.flipY}
            title="Flip vertically"
            onClick={() => onChange({ fit: 'manual', transform: { ...t, flipY: !t.flipY } })}
          >
            <Icon name="flipV" size={14} />Flip V
          </button>
        </div>
        <button className="text-button reset-fit" onClick={() => onFit('safe')}>
          Reset fit
        </button>
      </section>

      <section className="inspector-section">
        <h3>Background</h3>
        <div className="field">
          <span>Background fill</span>
          <button
            className="color-input"
            aria-label="Background color"
            aria-haspopup="dialog"
            aria-expanded={colorOpen}
            onClick={() => {
              if (picking) onTogglePick()
              setColorOpen(true)
            }}
          >
            <i style={{ backgroundColor: design.fill }} />
            <span>{design.fill.toUpperCase()}</span>
            <Icon name="sliders" size={16} />
          </button>
        </div>
        <button className={`eyedropper-button ${picking ? 'active-button' : ''}`} disabled={!sourceReady} aria-pressed={picking} onClick={onTogglePick}>
          <Icon name="dropper" size={16} />
          {picking ? 'Cancel eyedropper' : 'Eyedropper'}
        </button>
      </section>

      <div className={`quality-note ${ppi < 200 ? 'low-quality' : ''}`}>
        <strong>{Number.isFinite(ppi) ? Math.round(ppi).toLocaleString() : '—'} source PPI</strong>
        <p>{ppi < 200 ? 'Below 200 PPI. Export is allowed; fine detail may look soft.' : 'Original detail at the current print size.'}</p>
      </div>

      <AppleColorPicker
        isOpen={colorOpen}
        onClose={() => setColorOpen(false)}
        initialColor={design.fill}
        onChange={fill => onChange({ fill }, 'fill')}
        canPick={sourceReady}
        onPick={onTogglePick}
      />
    </div>
  )
}
