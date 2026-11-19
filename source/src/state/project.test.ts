import { describe, expect, it } from 'vitest'
import { createHistory, historyReducer } from './project'
import type { Imported } from '../bridge'

function sampleImport(id: string, name: string, suggestedFill = '#112233'): Imported {
  return {
    asset: { id, kind: 'png', path: `assets/${id}.png`, width: 1000, height: 800 },
    name,
    source: `data:image/png;base64,${id}`,
    suggestedFill,
  }
}

describe('project history and batch actions', () => {
  it('tracks undo/redo accurately without colliding revisions on divergent edits', () => {
    let state = createHistory()
    const savedRev = state.present.revision
    state = historyReducer(state, { type: 'name', name: 'Batch A', timestamp: 100 })
    state = historyReducer(state, { type: 'name', name: 'Batch B', timestamp: 1000 })
    expect(state.present.name).toBe('Batch B')
    expect(state.present.revision).not.toBe(savedRev)

    state = historyReducer(state, { type: 'undo' })
    expect(state.present.name).toBe('Batch A')
    const branchRev = state.present.revision

    state = historyReducer(state, { type: 'undo' })
    expect(state.present.revision).toBe(savedRev)

    state = historyReducer(state, { type: 'redo' })
    expect(state.present.revision).toBe(branchRev)

    // Branching forward after undo produces a strictly fresh revision.
    state = historyReducer(state, { type: 'name', name: 'Branch C', timestamp: 2000 })
    expect(state.future).toEqual([])
    expect(state.present.revision).toBeGreaterThan(branchRev)
  })

  it('coalesces continuous keyed edits and caps history at 50 entries', () => {
    let state = createHistory()
    state = historyReducer(state, { type: 'name', name: 'A', coalesceKey: 'name', timestamp: 100 })
    state = historyReducer(state, { type: 'name', name: 'AB', coalesceKey: 'name', timestamp: 250 })
    state = historyReducer(state, { type: 'name', name: 'ABC', coalesceKey: 'name', timestamp: 400 })
    expect(state.past).toHaveLength(1)
    expect(state.present.name).toBe('ABC')

    for (let i = 0; i < 65; i++) {
      state = historyReducer(state, { type: 'name', name: `Job ${i}` })
    }
    expect(state.past).toHaveLength(50)
  })

  it('supports duplicate, batch fit, batch fill, setQuantityAll, fillRemaining, and removeZeroCopies', () => {
    let state = createHistory()
    state = historyReducer(state, {
      type: 'import',
      images: [sampleImport('a1', 'Pin A', '#aa0000'), sampleImport('a2', 'Pin B', '#00aa00')],
    })
    expect(state.present.designs).toHaveLength(2)

    const firstId = state.present.designs[0].id
    state = historyReducer(state, { type: 'duplicate', id: firstId, newId: 'dup-1' })
    expect(state.present.designs).toHaveLength(3)
    expect(state.present.designs[1].name).toBe('Pin A (copy)')

    state = historyReducer(state, { type: 'applyFitAll', mode: 'bleed' })
    expect(state.present.designs.every(d => d.fit === 'bleed')).toBe(true)
    expect(state.present.designs[0].transform.mmPerPixel).toBeCloseTo(53 / 800, 12)

    state = historyReducer(state, { type: 'applyFillAll', fill: '#123456' })
    expect(state.present.designs.every(d => d.fill === '#123456')).toBe(true)

    state = historyReducer(state, { type: 'applySuggestedFills', fills: { a1: '#aa0000', a2: '#00aa00' } })
    expect(state.present.designs.map(d => d.fill)).toEqual(['#aa0000', '#aa0000', '#00aa00'])

    state = historyReducer(state, { type: 'setQuantityAll', quantity: 4 })
    expect(state.present.designs.map(d => d.quantity)).toEqual([4, 4, 4])

    state = historyReducer(state, { type: 'fillRemaining', remaining: 6 })
    expect(state.present.designs.map(d => d.quantity)).toEqual([6, 6, 6])

    state = historyReducer(state, { type: 'design', id: 'dup-1', patch: { quantity: 0 } })
    state = historyReducer(state, { type: 'removeZeroCopies' })
    expect(state.present.designs.map(d => d.name)).toEqual(['Pin A', 'Pin B'])
    expect(state.present.assets).toHaveLength(2)
  })
})
