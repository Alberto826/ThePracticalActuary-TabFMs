import { describe, expect, it } from 'vitest'
import { tabArenaSnapshot } from '../src/content/benchmarks'
import { claims } from '../src/content/claims'
import { modelMatrix } from '../src/content/modelMatrix'
import { papers } from '../src/content/papers'
import {
  attentionForQuery,
  expectedCost,
  heroProbability,
  makePriorPoints,
  makeTableRows,
  scalingSnapshot,
  severityQuantiles,
} from '../src/lib/simulations'

describe('educational simulations', () => {
  it('keeps seeded prior samples reproducible', () => {
    const settings = { family: 'Mixture' as const, smoothness: 0.6, noise: 0.2, seed: 91 }
    expect(makePriorPoints(settings)).toEqual(makePriorPoints(settings))
  })

  it('normalizes query attention weights', () => {
    const weights = attentionForQuery(6)
    expect(weights).toHaveLength(6)
    expect(weights.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1)
    expect(weights.every((value) => value >= 0)).toBe(true)
  })

  it('keeps severity quantiles monotone', () => {
    const quantiles = severityQuantiles(3000, 900, 450)
    expect(quantiles.every((value, index) => index === 0 || value >= quantiles[index - 1])).toBe(true)
  })

  it('decomposes expected cost transparently', () => {
    expect(expectedCost(0.25, 4000)).toBe(1000)
  })

  it('shows compression helping when feature count is high', () => {
    const snapshot = scalingSnapshot(50000, 500)
    expect(snapshot.compressed).toBeLessThan(snapshot.classic)
    expect(snapshot.compressedMemory).toBeLessThan(snapshot.classicMemory)
  })

  it('returns a bounded context-driven probability', () => {
    const probability = heroProbability(makeTableRows(), 4)
    expect(probability).toBeGreaterThan(0)
    expect(probability).toBeLessThan(1)
  })

  it('covers every local source in the evidence model', () => {
    expect(papers).toHaveLength(6)
    expect(new Set(claims.map((claim) => claim.sourceId)).size).toBe(6)
  })

  it('keeps one complete architecture record per model generation', () => {
    expect(modelMatrix).toHaveLength(6)
    expect(new Set(modelMatrix.map((model) => model.model)).size).toBe(6)
    expect(modelMatrix.every((model) => model.rowAttention && model.columnAttention && model.tasks && model.maxInput && model.maxOutput && model.innovation)).toBe(true)
  })

  it('keeps benchmark regimes explicit', () => {
    const regimes = new Set(tabArenaSnapshot.map((row) => row.regime))
    expect(regimes).toEqual(new Set(['Default', 'Tuned + ensemble', 'Thinking / API']))
    expect(tabArenaSnapshot.every((row) => row.elo > 0 && row.improvability > 0 && row.note.length > 0)).toBe(true)
  })
})