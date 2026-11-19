import { fitImage, newProject, type Design, type FitMode, type Project, type Settings } from '../core/model'
import type { Imported } from '../bridge'

export type Action =
  | { type: 'replace'; project: Project }
  | { type: 'name'; name: string }
  | { type: 'settings'; settings: Settings }
  | { type: 'design'; id: string; patch: Partial<Design> }
  | { type: 'import'; images: Imported[] }
  | { type: 'remove'; id: string }
  | { type: 'relink'; id: string; image: Imported }
  | { type: 'duplicate'; id: string; newId: string }
  | { type: 'applyFitAll'; mode: Exclude<FitMode, 'manual'> }
  | { type: 'applyFillAll'; fill: string }
  | { type: 'applySuggestedFills'; fills: Record<string, string> }
  | { type: 'setQuantityAll'; quantity: number }
  | { type: 'fillRemaining'; remaining: number; designId?: string }
  | { type: 'removeZeroCopies' }

export type HistoryAction =
  | { type: 'undo' }
  | { type: 'redo' }
  | (Action & { coalesceKey?: string; timestamp?: number })

export interface HistoryState {
  past: Project[]
  present: Project
  future: Project[]
  nextRevision: number
  lastActionKey?: string
  lastActionAt?: number
}

const MAX_HISTORY = 50
const COALESCE_MS = 450

function applyAction(state: Project, action: Action): Project {
  let next = state
  switch (action.type) {
    case 'replace':
      return action.project
    case 'name':
      next = { ...state, name: action.name }
      break
    case 'settings':
      next = { ...state, settings: action.settings }
      break
    case 'design':
      next = { ...state, designs: state.designs.map(d => d.id === action.id ? { ...d, ...action.patch } : d) }
      break
    case 'import':
      if (!action.images.length) return state
      next = {
        ...state,
        assets: [...state.assets, ...action.images.map(i => i.asset)],
        designs: [
          ...state.designs,
          ...action.images.map(i => ({
            id: crypto.randomUUID(),
            name: i.name,
            assetId: i.asset.id,
            quantity: 1,
            fit: 'safe' as const,
            transform: fitImage(i.asset, state.settings.circles, 'safe'),
            fill: i.suggestedFill,
          })),
        ],
      }
      break
    case 'remove': {
      const designs = state.designs.filter(d => d.id !== action.id)
      if (designs.length === state.designs.length) return state
      next = { ...state, designs, assets: state.assets.filter(a => designs.some(d => d.assetId === a.id)) }
      break
    }
    case 'relink': {
      const design = state.designs.find(d => d.id === action.id)
      if (!design) return state
      const designs = state.designs.map(d => d.assetId === design.assetId ? { ...d, assetId: action.image.asset.id } : d)
      next = { ...state, designs, assets: [...state.assets.filter(a => a.id !== design.assetId), action.image.asset] }
      break
    }
    case 'duplicate': {
      const index = state.designs.findIndex(d => d.id === action.id)
      if (index === -1) return state
      const original = state.designs[index]
      const copyName = `${original.name} (copy)`.slice(0, 200)
      const clone: Design = { ...structuredClone(original), id: action.newId, name: copyName }
      const designs = [...state.designs]
      designs.splice(index + 1, 0, clone)
      next = { ...state, designs }
      break
    }
    case 'applyFitAll': {
      if (!state.designs.length) return state
      const assets = new Map(state.assets.map(a => [a.id, a]))
      next = {
        ...state,
        designs: state.designs.map(d => {
          const asset = assets.get(d.assetId)
          return asset ? { ...d, fit: action.mode, transform: fitImage(asset, state.settings.circles, action.mode) } : d
        }),
      }
      break
    }
    case 'applyFillAll':
      if (!state.designs.length) return state
      next = { ...state, designs: state.designs.map(d => ({ ...d, fill: action.fill })) }
      break
    case 'applySuggestedFills':
      if (!state.designs.length) return state
      next = {
        ...state,
        designs: state.designs.map(d => ({ ...d, fill: action.fills[d.assetId] ?? d.fill })),
      }
      break
    case 'setQuantityAll':
      if (!state.designs.length) return state
      next = { ...state, designs: state.designs.map(d => ({ ...d, quantity: action.quantity })) }
      break
    case 'fillRemaining': {
      if (action.remaining <= 0 || !state.designs.length) return state
      if (action.designId) {
        const exists = state.designs.some(d => d.id === action.designId)
        if (!exists) return state
        next = {
          ...state,
          designs: state.designs.map(d => d.id === action.designId ? { ...d, quantity: d.quantity + action.remaining } : d),
        }
        break
      }
      const activeIndices = state.designs.map((d, i) => d.quantity > 0 ? i : -1).filter(i => i !== -1)
      const targets = activeIndices.length ? activeIndices : state.designs.map((_, i) => i)
      const base = Math.floor(action.remaining / targets.length)
      const extra = action.remaining % targets.length
      const additions = new Map<number, number>()
      targets.forEach((index, pos) => additions.set(index, base + (pos < extra ? 1 : 0)))
      next = {
        ...state,
        designs: state.designs.map((d, i) => additions.has(i) ? { ...d, quantity: d.quantity + additions.get(i)! } : d),
      }
      break
    }
    case 'removeZeroCopies': {
      const designs = state.designs.filter(d => d.quantity > 0)
      if (designs.length === state.designs.length) return state
      next = { ...state, designs, assets: state.assets.filter(a => designs.some(d => d.assetId === a.id)) }
      break
    }
  }
  return { ...next, revision: state.revision + 1 }
}

export function projectReducer(state: Project, action: Action): Project {
  return applyAction(state, action)
}

export function createHistory(initial: Project = newProject()): HistoryState {
  return {
    past: [],
    present: initial,
    future: [],
    nextRevision: initial.revision + 1,
  }
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'undo') {
    if (!state.past.length) return state
    const previous = state.past[state.past.length - 1]
    return {
      ...state,
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future].slice(0, MAX_HISTORY),
      lastActionKey: undefined,
      lastActionAt: undefined,
    }
  }
  if (action.type === 'redo') {
    if (!state.future.length) return state
    const [next, ...rest] = state.future
    return {
      ...state,
      past: [...state.past, state.present].slice(-MAX_HISTORY),
      present: next,
      future: rest,
      lastActionKey: undefined,
      lastActionAt: undefined,
    }
  }
  if (action.type === 'replace') {
    return createHistory(action.project)
  }

  const next = applyAction(state.present, action)
  if (next === state.present) return state

  const nextProject: Project = { ...next, revision: state.nextRevision }
  const now = action.timestamp ?? Date.now()
  const key = action.coalesceKey
  const canCoalesce = Boolean(
    key &&
    state.lastActionKey === key &&
    state.lastActionAt !== undefined &&
    now - state.lastActionAt <= COALESCE_MS &&
    state.past.length > 0
  )

  return {
    past: canCoalesce ? state.past : [...state.past, state.present].slice(-MAX_HISTORY),
    present: nextProject,
    future: [],
    nextRevision: state.nextRevision + 1,
    lastActionKey: key,
    lastActionAt: key ? now : undefined,
  }
}

export { newProject }
