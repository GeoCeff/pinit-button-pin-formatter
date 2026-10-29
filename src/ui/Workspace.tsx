import { effectivePpi, type Asset, type Design } from '../core/model'
import { NumberField, SelectField } from './controls'
import { Icon } from './Icon'

export function ArtworkLibrary({ designs, selectedId, sources, variant, disabled, onImport, onManage, onSelect, onRemove }: {
  designs: Design[]
  selectedId?: string
  sources: Record<string, string>
  variant: 'tray' | 'gallery'
  disabled: boolean
  onImport: () => void
  onManage: () => void
  onSelect: (id: string) => void
  onRemove: (design: Design) => void
}) {
  return <section className="designs-panel" aria-label="Artwork library" data-variant={variant}>
    <div className="library-header">
      {variant==='tray'?<div className="artwork-rail-heading"><div><span className="eyebrow">Your collection</span><h2>Artwork</h2></div><span className="item-count">{designs.length}</span></div>:null}
      <button className="import-button" disabled={disabled} onClick={onImport}><Icon name="upload" size={20}/><span>Import artwork</span></button>
      {variant==='gallery'?<p className="hint">PNG or JPG · original files preserved</p>:null}
    </div>
    <div className="design-list">
      {designs.length ? designs.map(design => <div key={design.id} className={`design-row ${selectedId === design.id ? 'selected' : ''}`}>
        <button className="design-select" onClick={() => onSelect(design.id)} aria-pressed={selectedId === design.id}>
          {sources[design.assetId] ? <img src={sources[design.assetId]} width="52" height="52" alt="" /> : <span className="missing-thumb"><Icon name="image" /><small>Missing</small></span>}
          <span className="design-copy"><strong title={design.name}>{design.name}</strong><small>{design.quantity.toLocaleString()} {design.quantity === 1 ? 'copy' : 'copies'}</small></span>
          {selectedId===design.id?<span className="design-selected-mark" aria-hidden="true"><Icon name="check" size={12}/></span>:null}
        </button>
        {variant==='gallery'?<button className="remove-design" disabled={disabled} aria-label={`Remove ${design.name}`} onClick={() => onRemove(design)}><Icon name="trash" size={15}/>Remove</button>:null}
      </div>) : <div className="empty-list"><Icon name="image" size={24}/><div><strong>No artwork yet</strong><p>Import a PNG or JPG to get started.</p></div></div>}
    </div>
    {variant==='tray'?<div className="library-bottom"><button className="manage-library text-button" onClick={onManage}><Icon name="folder" size={16}/>Manage artwork<Icon name="right" size={14}/></button><p><Icon name="shield" size={14}/>Original files preserved</p></div>:null}
  </section>
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
    <div className="inspector-heading"><h2>Artwork</h2><button className="text-button" disabled={ioBusy} onClick={onRelink} aria-label="Replace or relink source"><Icon name="link" size={15} />Replace</button></div>
    <NumberField label="Total copies" value={design.quantity} onChange={quantity => onChange({ quantity })} min={0} max={100000} integer />
    <section className="inspector-section"><h3>Position & size</h3>
      <SelectField label="Image fit" value={design.fit} onChange={value => value === 'manual' ? onChange({ fit: 'manual' }) : onFit(value as 'safe' | 'contain' | 'fill')}><option value="safe">Fit inside safe circle</option><option value="contain">Fit inside face circle</option><option value="fill">Fill face circle</option><option value="manual">Manual</option></SelectField>
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
