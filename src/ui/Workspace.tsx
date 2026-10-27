import { effectivePpi, type Asset, type Design } from '../core/model'
import { NumberField, SelectField } from './controls'
import { Icon } from './Icon'

export function ArtworkLibrary({ designs, selectedId, sources, total, disabled, onImport, onSelect, onRemove }: {
  designs: Design[]
  selectedId?: string
  sources: Record<string, string>
  total: number
  disabled: boolean
  onImport: () => void
  onSelect: (id: string) => void
  onRemove: (design: Design) => void
}) {
  return <aside className="designs-panel" aria-label="Design list">
    <div className="library-header">
      <div className="section-title"><h2>Your artwork</h2><span className="item-count">{designs.length}</span></div>
      <button className="import-button" disabled={disabled} onClick={onImport}><Icon name="plus" />Import artwork</button>
      <p className="hint">PNG or JPG. Originals preserved.</p>
    </div>
    <div className="design-list">
      {designs.length ? designs.map(design => <div key={design.id} className={`design-row ${selectedId === design.id ? 'selected' : ''}`}>
        <button className="design-select" onClick={() => onSelect(design.id)} aria-pressed={selectedId === design.id}>
          {sources[design.assetId] ? <img src={sources[design.assetId]} width="52" height="52" alt="" /> : <span className="missing-thumb"><Icon name="image" /><small>Missing</small></span>}
          <span className="design-copy"><strong title={design.name}>{design.name}</strong><small>{design.quantity.toLocaleString()} {design.quantity === 1 ? 'copy' : 'copies'}</small></span>
        </button>
        <button className="remove-design icon-button" disabled={disabled} aria-label={`Remove ${design.name}`} title={`Remove ${design.name}`} onClick={() => onRemove(design)}><Icon name="trash" size={16} /></button>
      </div>) : <div className="empty-list"><div className="empty-library-mark" aria-hidden="true"><Icon name="image" size={26} /></div><h3>A little art.<br />A lot of possibilities.</h3><p>Add your first design and give it a place on the sheet.</p></div>}
    </div>
    <footer className="design-footer"><div><strong>{total.toLocaleString()}</strong><span>copies in this run</span></div><p><Icon name="shield" size={16} />Local files. Always yours.</p></footer>
  </aside>
}

export function ArtworkControls({ design, asset, onChange, onFit, onRelink, picking, onTogglePick, sourceReady, ioBusy }: {
  design: Design
  asset: Asset
  onChange: (patch: Partial<Design>) => void
  onFit: (mode: 'safe' | 'contain' | 'fill') => void
  onRelink: () => void
  picking: boolean
  onTogglePick: () => void
  sourceReady: boolean
  ioBusy: boolean
}) {
  const ppi = effectivePpi(design.transform)
  return <div className="artwork-controls" aria-label="Artwork adjustments">
    <div className="inspector-heading"><h2>Artwork details</h2><button className="text-button" disabled={ioBusy} onClick={onRelink} aria-label="Replace or relink source"><Icon name="link" size={15} />Replace</button></div>
    <NumberField label="Total copies" value={design.quantity} onChange={quantity => onChange({ quantity })} min={0} max={100000} integer />
    <section className="inspector-section"><h3>Position & size</h3>
      <SelectField label="Image fit" value={design.fit} onChange={value => value === 'manual' ? onChange({ fit: 'manual' }) : onFit(value as 'safe' | 'contain' | 'fill')}><option value="safe">Whole image · safe circle</option><option value="contain">Whole image · face circle</option><option value="fill">Fill face circle</option><option value="manual">Manual</option></SelectField>
      <div className="two-col"><NumberField label="Artwork width" value={asset.width * design.transform.mmPerPixel} unit="mm" step={0.5} min={asset.width * 0.000001} onChange={value => onChange({ fit: 'manual', transform: { ...design.transform, mmPerPixel: value / asset.width } })} /><NumberField label="Rotation" value={design.transform.rotation} unit="°" onChange={value => onChange({ fit: 'manual', transform: { ...design.transform, rotation: value } })} /></div>
      <div className="two-col"><NumberField label="Horizontal offset" value={design.transform.x} unit="mm" step={0.5} onChange={value => onChange({ fit: 'manual', transform: { ...design.transform, x: value } })} /><NumberField label="Vertical offset" value={design.transform.y} unit="mm" step={0.5} onChange={value => onChange({ fit: 'manual', transform: { ...design.transform, y: value } })} /></div>
      <button className="text-button reset-fit" onClick={() => onFit('safe')}>Reset fit</button>
    </section>
    <section className="inspector-section"><h3>Background</h3>
      <label className="field"><span>Background fill</span><span className="color-input"><input type="color" name="background-color" aria-label="Background color" value={design.fill} onChange={event => onChange({ fill: event.target.value })} /><span>{design.fill.toUpperCase()}</span></span></label>
      <button className={`eyedropper-button ${picking ? 'active-button' : ''}`} disabled={!sourceReady} aria-pressed={picking} onClick={onTogglePick}><Icon name="dropper" size={16} />{picking ? 'Cancel eyedropper' : 'Eyedropper'}</button>
    </section>
    <div className={`quality-note ${ppi < 200 ? 'low-quality' : ''}`}><strong>{Number.isFinite(ppi) ? Math.round(ppi).toLocaleString() : '—'} source PPI</strong><p>{ppi < 200 ? 'Below 200 PPI. Export is allowed; fine detail may look soft.' : 'Original detail at the current print size.'}</p></div>
  </div>
}
