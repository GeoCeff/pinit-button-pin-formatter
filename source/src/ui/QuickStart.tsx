import { useState, type MouseEvent } from 'react'
import type { AppInfo } from '../bridge'
import { Dialog } from './controls'
import { Icon } from './Icon'
import './quick-start.css'

const steps = [
  {
    label: 'Import',
    title: 'Start with your artwork.',
    description: 'Browse, drag and drop, or paste (Ctrl+V) PNG, JPG, or WebP files. Choose any design from the artwork tray to edit it.',
    tip: 'Your original files stay intact. Positioning and sizing only change how the artwork appears on the pin.',
  },
  {
    label: 'Position',
    title: 'Find the perfect position.',
    description: 'Drag to move, pull a corner handle or scroll the mouse wheel to zoom, and use Safe, Face, Fill, or Bleed for one-click framing.',
    tip: 'Hold Alt while dragging to skip center snapping, or use arrow keys to nudge. Open Adjust artwork for rotation, flips, and exact millimeter offsets.',
  },
  {
    label: 'Print',
    title: 'Build your sheet. Then export.',
    description: 'Set Copies per design or use Library batch tools to fit, match colors, or fill empty sheet slots. Review the live preview beside your work.',
    tip: 'Export PDF (RGB/CMYK), PNG/JPG sheets, individual pin PNGs, or a 100% Calibration Sheet. Always print at Actual Size / 100%.',
  },
] as const

const shortcuts = [
  ['Ctrl + Z', 'Undo artwork or setting change'],
  ['Ctrl + Y / Ctrl + Shift + Z', 'Redo change'],
  ['Ctrl + I', 'Import artwork files'],
  ['Ctrl + V', 'Paste image from clipboard'],
  ['Ctrl + O', 'Open saved project folder'],
  ['Ctrl + S / Ctrl + Shift + S', 'Save / Save project copy'],
  ['Ctrl + E', 'Open Export sheets'],
  ['Mouse wheel (canvas)', 'Zoom artwork proportionally'],
  ['Arrow keys / Shift + Arrow', 'Nudge selected artwork (0.25 mm / 1 mm)'],
  ['Alt + Drag', 'Move freely without center snapping'],
  ['Escape', 'Deselect artwork or cancel eyedropper'],
] as const

function ImportDiagram() {
  return (
    <svg viewBox="0 0 340 236" role="img" aria-label="PNG and JPG artwork imported into a pin with a cut circle and a face circle">
      <g className="tour-file"><path d="M28 38h48l16 16v60H28Z" /><path d="M76 38v16h16" /><text x="60" y="92">PNG</text></g>
      <g className="tour-file"><path d="M52 124h48l16 16v60H52Z" /><path d="M100 124v16h16" /><text x="84" y="178">JPG</text></g>
      <path className="tour-arrow" d="M132 118h32m-7-7 7 7-7 7" />
      <circle className="tour-cut" cx="249" cy="118" r="72" />
      <circle className="tour-face" cx="249" cy="118" r="59" />
      <text className="tour-art-label" x="249" y="114">YOUR</text>
      <text className="tour-art-label" x="249" y="135">ART</text>
    </svg>
  )
}

function PositionDiagram() {
  return (
    <svg viewBox="0 0 340 236" role="img" aria-label="Artwork centered on both axes with circular resize handles, a cut line and a visible face circle">
      <circle className="tour-cut" cx="170" cy="106" r="83" />
      <circle className="tour-face" cx="170" cy="106" r="69" />
      <path className="tour-center-guide" d="M170 14v184M78 106h184" />
      <rect className="tour-selection" x="116" y="62" width="108" height="88" />
      <text className="tour-art-label" x="170" y="102">YOUR</text>
      <text className="tour-art-label" x="170" y="123">ART</text>
      {[[116, 62], [224, 62], [116, 150], [224, 150]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="tour-handle" cx={cx} cy={cy} r="5" />)}
      <g className="tour-centered"><rect x="113" y="202" width="114" height="28" rx="14" /><path d="m126 216 4 4 8-9" /><text x="177" y="220">Centered</text></g>
    </svg>
  )
}

function SheetDiagram() {
  return (
    <svg viewBox="0 0 340 236" role="img" aria-label="A print sheet of repeated circular designs exported at actual size, 100 percent">
      <rect className="tour-paper-shadow" x="67" y="25" width="140" height="190" rx="2" />
      <rect className="tour-paper" x="62" y="20" width="140" height="190" rx="2" />
      {[53, 98, 143, 188].flatMap(cy => [88, 132, 176].map(cx => (
        <g key={`${cx}-${cy}`}>
          <circle className="tour-sheet-cut" cx={cx} cy={cy} r="18" />
          <circle className="tour-sheet-face" cx={cx} cy={cy} r="12" />
        </g>
      )))}
      <path className="tour-arrow" d="M221 118h30m-7-7 7 7-7 7" />
      <g className="tour-scale"><text x="289" y="115">100%</text><text x="289" y="137">Actual size</text></g>
    </svg>
  )
}

export function QuickStart({
  onClose,
  onImport,
  hasArtwork,
  appInfo,
}: {
  onClose: () => void
  onImport: () => void
  hasArtwork: boolean
  appInfo?: AppInfo | null
}) {
  const [tab, setTab] = useState<'tour' | 'about'>('tour')
  const [step, setStep] = useState(0)
  const [pointerTransition, setPointerTransition] = useState(false)
  const current = steps[step]

  function go(next: number, event: MouseEvent<HTMLButtonElement>) {
    setPointerTransition(event.detail > 0)
    setStep(next)
  }

  function finish() {
    onClose()
    if (!hasArtwork) onImport()
  }

  return (
    <Dialog title="A quick tour of dfCuts" className="quick-start-dialog" onClose={onClose}>
      <div className="help-tabs" role="tablist" aria-label="Help sections">
        <button type="button" role="tab" aria-selected={tab === 'tour'} onClick={() => setTab('tour')}>
          Quick tour
        </button>
        <button type="button" role="tab" aria-selected={tab === 'about'} onClick={() => setTab('about')}>
          Shortcuts & About
        </button>
      </div>

      {tab === 'tour' ? (
        <div className="quick-start">
          <ol className="quick-start-progress" aria-label="Tutorial progress">
            {steps.map((item, index) => (
              <li key={item.label} aria-current={step === index ? 'step' : undefined} data-complete={step > index}>
                <span className="quick-start-step" aria-hidden="true">{step > index ? <Icon name="check" size={14} /> : index + 1}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ol>
          <div key={step} className="quick-start-content" data-motion={pointerTransition}>
            <figure className="quick-start-diagram">{step === 0 ? <ImportDiagram /> : step === 1 ? <PositionDiagram /> : <SheetDiagram />}</figure>
            <div className="quick-start-copy">
              <h3>{current.title}</h3>
              <p>{current.description}</p>
              <p className="quick-start-tip">{current.tip}</p>
            </div>
          </div>
          <div className="quick-start-navigation">
            <button type="button" className="text-button quick-start-skip" onClick={onClose}>Skip tour</button>
            <p className="quick-start-count" role="status" aria-live="polite" aria-atomic="true">
              <span className="quick-start-sr-only">{current.title} </span>Step {step + 1} of {steps.length}
            </p>
            <div className="quick-start-buttons">
              {step > 0 ? <button type="button" onClick={event => go(step - 1, event)}><Icon name="left" size={16} />Back</button> : null}
              {step < steps.length - 1 ? (
                <button type="button" className="primary" onClick={event => go(step + 1, event)}>Next<Icon name="right" size={16} /></button>
              ) : (
                <button type="button" className="primary" onClick={finish}>
                  {hasArtwork ? 'Start editing' : 'Import artwork'}
                  <Icon name={hasArtwork ? 'check' : 'upload'} size={16} />
                </button>
              )}
            </div>
          </div>
          <p className="quick-start-replay">You can reopen this tour anytime from Help in the toolbar.</p>
        </div>
      ) : (
        <div className="help-about">
          <div className="about-meta">
            <div>
              <strong>{appInfo?.name ?? 'dfCuts'} v{appInfo?.version ?? '1.0.0'}</strong>
              <span>{appInfo?.portable ? 'Portable offline Windows executable' : 'Offline desktop workbench'}</span>
            </div>
            <span className={`cmyk-status ${appInfo?.cmyk ? 'ready' : 'missing'}`}>
              {appInfo?.cmyk ? 'CMYK Ghostscript ready' : 'RGB only (CMYK engine missing)'}
            </span>
          </div>
          <h3>Keyboard & canvas shortcuts</h3>
          <dl className="shortcuts-grid">
            {shortcuts.map(([keys, desc]) => (
              <div key={keys}>
                <dt><kbd>{keys}</kbd></dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </dl>
          <p className="hint about-licenses">
            dfCuts source is MIT licensed. Bundled Ghostscript 10.08.0 is licensed under GNU AGPL v3; bundled Geist font is licensed under SIL OFL 1.1. See THIRD_PARTY_NOTICES.md alongside the application.
          </p>
        </div>
      )}
    </Dialog>
  )
}
