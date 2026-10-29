import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { DOCK_BASE, DOCK_GAP, dockLayout } from './dock-layout'
gsap.registerPlugin(useGSAP)

export interface DockItem { id: string; label: string; icon: ReactNode; kind: 'view' | 'action'; disabled?: boolean }
interface MacFloatingDockProps { items: DockItem[]; active: string; onSelect: (id: string) => void }

// Adapted from the supplied dock: stable slots, bell-curve magnification and neighbor displacement.
export default function MacFloatingDock({ items, active, onSelect }: MacFloatingDockProps) {
  const row = useRef<HTMLUListElement>(null)
  const move = useRef<(pointer: number | null, instant?: boolean) => void>(() => {})
  useGSAP(() => {
    const node = row.current!
    const tiles = [...node.querySelectorAll<HTMLElement>('.dock-tile')]
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const setters = tiles.map(tile => ({ x: gsap.quickTo(tile, 'x', { duration: 0.16, ease: 'power3.out' }), scaleX: gsap.quickTo(tile, 'scaleX', { duration: 0.16, ease: 'power3.out' }), scaleY: gsap.quickTo(tile, 'scaleY', { duration: 0.16, ease: 'power3.out' }) }))
    move.current = (pointer, instant = false) => {
      const resting = query.matches || !fine.matches || instant
      const { scales, shifts } = dockLayout(tiles.length, resting ? null : pointer)
      tiles.forEach((tile, i) => {
        if (resting) {
          // Keep quickTo's reusable tweens alive when keyboard focus or motion preferences reset the dock.
          setters[i].x.tween.pause(); setters[i].scaleX.tween.pause(); setters[i].scaleY.tween.pause()
          gsap.set(tile, { x: shifts[i], scaleX: scales[i], scaleY: scales[i] })
        }
        else { setters[i].x(shifts[i]); setters[i].scaleX(scales[i]); setters[i].scaleY(scales[i]) }
      })
    }
    const reset = () => move.current(null, true)
    query.addEventListener('change', reset); fine.addEventListener('change', reset)
    return () => { move.current = () => {}; query.removeEventListener('change', reset); fine.removeEventListener('change', reset); gsap.killTweensOf(tiles) }
  }, { scope: row, dependencies: [items.length], revertOnUpdate: true })

  function navigate(event: KeyboardEvent<HTMLUListElement>) {
    const buttons = [...row.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = buttons.length - 1
    else return
    event.preventDefault(); move.current(null, true); buttons[next]?.focus()
  }

  return <nav className="floating-dock" aria-label="Studio tools">
    <ul ref={row} className="flex items-end" style={{ gap: DOCK_GAP }} onKeyDown={navigate}
      onPointerMove={event => { if (event.pointerType === 'mouse') move.current(event.clientX - row.current!.getBoundingClientRect().left) }}
      onPointerLeave={() => move.current(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) move.current(null, true) }}>
      {items.map(item => <li key={item.id} className="dock-slot" style={{ width: DOCK_BASE }}>
        <button type="button" className={item.id === active ? 'dock-button dock-selected' : 'dock-button'} aria-label={item.label} aria-pressed={item.kind === 'view' ? item.id === active : undefined} disabled={item.disabled}
          onFocus={() => move.current(null, true)} onClick={() => onSelect(item.id)}>
          <span className="dock-tile" aria-hidden="true">{item.icon}</span><span className="dock-label">{item.label}</span>
        </button>
      </li>)}
    </ul>
  </nav>
}
