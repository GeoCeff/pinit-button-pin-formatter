import { createContext, use, useId, useMemo, type KeyboardEvent, type ReactNode } from 'react'

export type InspectorTab = 'artwork' | 'sheet'
const Context = createContext<{ value: InspectorTab; onChange: (value: InspectorTab) => void; id: string } | null>(null)

function useTabs() {
  const tabs = use(Context)
  if (!tabs) throw new Error('Inspector tabs must be inside their root.')
  return tabs
}

function Root({ value, onChange, children }: { value: InspectorTab; onChange: (value: InspectorTab) => void; children: ReactNode }) {
  const id = useId()
  const context = useMemo(() => ({ value, onChange, id }), [value, onChange, id])
  return <Context value={context}><div className="inspector-tabs">{children}</div></Context>
}

function List({ children }: { children: ReactNode }) {
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    event.preventDefault()
    tabs[next]?.click()
    tabs[next]?.focus()
  }
  return <div className="inspector-tab-list" role="tablist" aria-label="Inspector sections" onKeyDown={navigate}>{children}</div>
}

function Tab({ value, children }: { value: InspectorTab; children: ReactNode }) {
  const tabs = useTabs()
  const selected = tabs.value === value
  return <button role="tab" id={`${tabs.id}-${value}-tab`} aria-controls={`${tabs.id}-${value}-panel`} aria-selected={selected} tabIndex={selected ? 0 : -1} onClick={() => tabs.onChange(value)}>{children}</button>
}

function Panel({ value, children }: { value: InspectorTab; children: ReactNode }) {
  const tabs = useTabs()
  return <section className="inspector-tab-panel" role="tabpanel" id={`${tabs.id}-${value}-panel`} aria-labelledby={`${tabs.id}-${value}-tab`} hidden={tabs.value !== value}>{children}</section>
}

export const InspectorTabs = { Root, List, Tab, Panel }
