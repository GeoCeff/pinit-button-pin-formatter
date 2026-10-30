import { useState, type MouseEvent } from 'react'
import { Dialog } from './controls'
import { Icon } from './Icon'
import './quick-start.css'

const steps = [
  {
    label: 'Import',
    title: 'Start with your artwork.',
    description: 'Add one or more PNG or JPG files. Choose a design from the artwork tray to work on it.',
    tip: 'Your original files stay intact. Positioning and sizing only change how the artwork appears on the pin.',
  },
  {
    label: 'Position',
    title: 'Find the perfect position.',
    description: 'Drag the image to move it. Pull a round corner handle to resize. Hold Alt while dragging to skip snapping. The center guides help you line it up.',
    tip: 'The outer circle is the cut line; the inner circle is the visible face. Safe is an optional margin guide. Use Adjust artwork for exact size, rotation and offsets.',
  },
  {
    label: 'Print',
    title: 'Build your sheet. Then export.',
    description: 'Set Copies beside the artwork name. Use Setup in the sheet preview to choose paper and spacing. The preview updates alongside your work.',
    tip: 'Export sheets as PDF, PNG or JPG. When printing, choose actual size or 100% so the pin dimensions stay correct.',
  },
] as const

function ImportDiagram() {
  return <svg viewBox="0 0 340 236" role="img" aria-label="PNG and JPG artwork imported into a pin with a cut circle and a face circle">
    <g className="tour-file"><path d="M28 38h48l16 16v60H28Z" /><path d="M76 38v16h16" /><text x="60" y="92">PNG</text></g>
    <g className="tour-file"><path d="M52 124h48l16 16v60H52Z" /><path d="M100 124v16h16" /><text x="84" y="178">JPG</text></g>
    <path className="tour-arrow" d="M132 118h32m-7-7 7 7-7 7" />
    <circle className="tour-cut" cx="249" cy="118" r="72" />
    <circle className="tour-face" cx="249" cy="118" r="59" />
    <text className="tour-art-label" x="249" y="114">YOUR</text><text className="tour-art-label" x="249" y="135">ART</text>
  </svg>
}

function PositionDiagram() {
  return <svg viewBox="0 0 340 236" role="img" aria-label="Artwork centered on both axes with circular resize handles, a cut line and a visible face circle">
    <circle className="tour-cut" cx="170" cy="106" r="83" />
    <circle className="tour-face" cx="170" cy="106" r="69" />
    <path className="tour-center-guide" d="M170 14v184M78 106h184" />
    <rect className="tour-selection" x="116" y="62" width="108" height="88" />
    <text className="tour-art-label" x="170" y="102">YOUR</text><text className="tour-art-label" x="170" y="123">ART</text>
    {[[116, 62], [224, 62], [116, 150], [224, 150]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="tour-handle" cx={cx} cy={cy} r="5" />)}
    <g className="tour-centered"><rect x="113" y="202" width="114" height="28" rx="14" /><path d="m126 216 4 4 8-9" /><text x="177" y="220">Centered</text></g>
  </svg>
}

function SheetDiagram() {
  return <svg viewBox="0 0 340 236" role="img" aria-label="A print sheet of repeated circular designs exported at actual size, 100 percent">
    <rect className="tour-paper-shadow" x="67" y="25" width="140" height="190" rx="2" />
    <rect className="tour-paper" x="62" y="20" width="140" height="190" rx="2" />
    {[53, 98, 143, 188].flatMap(cy => [88, 132, 176].map(cx => <g key={`${cx}-${cy}`}><circle className="tour-sheet-cut" cx={cx} cy={cy} r="18" /><circle className="tour-sheet-face" cx={cx} cy={cy} r="12" /></g>))}
    <path className="tour-arrow" d="M221 118h30m-7-7 7 7-7 7" />
    <g className="tour-scale"><text x="289" y="115">100%</text><text x="289" y="137">Actual size</text></g>
  </svg>
}

export function QuickStart({ onClose, onImport, hasArtwork }: { onClose: () => void; onImport: () => void; hasArtwork: boolean }) {
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
  return <Dialog title="A quick tour of PinIt" className="quick-start-dialog" onClose={onClose}>
    <div className="quick-start">
      <ol className="quick-start-progress" aria-label="Tutorial progress">
        {steps.map((item, index) => <li key={item.label} aria-current={step === index ? 'step' : undefined} data-complete={step > index}>
          <span className="quick-start-step" aria-hidden="true">{step > index ? <Icon name="check" size={14} /> : index + 1}</span><span>{item.label}</span>
        </li>)}
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
        <p className="quick-start-count" role="status" aria-live="polite" aria-atomic="true"><span className="quick-start-sr-only">{current.title} </span>Step {step + 1} of {steps.length}</p>
        <div className="quick-start-buttons">
          {step > 0 ? <button type="button" onClick={event => go(step - 1, event)}><Icon name="left" size={16} />Back</button> : null}
          {step < steps.length - 1 ? <button type="button" className="primary" onClick={event => go(step + 1, event)}>Next<Icon name="right" size={16} /></button> : <button type="button" className="primary" onClick={finish}>{hasArtwork ? 'Start editing' : 'Import artwork'}<Icon name={hasArtwork ? 'check' : 'upload'} size={16} /></button>}
        </div>
      </div>
      <p className="quick-start-replay">You can reopen this tour anytime from Help in the toolbar.</p>
    </div>
  </Dialog>
}
