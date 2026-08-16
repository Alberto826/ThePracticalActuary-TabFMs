import type { AttentionCell, PriorPoint, TableRow } from '../types'

export type PriorFamily = 'SCM' | 'Tree' | 'Mixture'

export type PriorSettings = {
  family: PriorFamily
  smoothness: number
  noise: number
  seed?: number
}

export type ScalingSnapshot = {
  classic: number
  compressed: number
  rowOnly: number
  classicMemory: number
  compressedMemory: number
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value))

export const seededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const makeTableRows = (): TableRow[] => [
  { id: 'a1', driverAge: 22, vehicleAge: 11, annualMiles: 18, region: 'Urban', claim: 1, severity: 2.8 },
  { id: 'b2', driverAge: 28, vehicleAge: 4, annualMiles: 10, region: 'Rural', claim: 0, severity: 0 },
  { id: 'c3', driverAge: 35, vehicleAge: 7, annualMiles: 14, region: 'Urban', claim: 0, severity: 0 },
  { id: 'd4', driverAge: 43, vehicleAge: 2, annualMiles: 8, region: 'Rural', claim: 0, severity: 0 },
  { id: 'e5', driverAge: 51, vehicleAge: 9, annualMiles: 16, region: 'Urban', claim: 1, severity: 1.6 },
  { id: 'f6', driverAge: 64, vehicleAge: 5, annualMiles: 6, region: 'Rural', claim: 0, severity: 0 },
  { id: 'g7', driverAge: 31, vehicleAge: 12, annualMiles: 21, region: 'Urban', claim: 1, severity: 3.4 },
  { id: 'h8', driverAge: 47, vehicleAge: 3, annualMiles: 11, region: 'Rural', claim: 0, severity: 0 },
]

export const heroProbability = (rows: TableRow[], contextSize: number) => {
  const context = rows.slice(0, contextSize)
  const query = { driverAge: 39, vehicleAge: 8, annualMiles: 15, region: 'Urban' }
  const weighted = context.reduce(
    (total, row) => {
      const distance =
        Math.abs(row.driverAge - query.driverAge) / 35 +
        Math.abs(row.vehicleAge - query.vehicleAge) / 12 +
        Math.abs(row.annualMiles - query.annualMiles) / 20 +
        (row.region === query.region ? 0 : 0.7)
      const weight = Math.exp(-distance * 1.45)
      return total + weight * row.claim
    },
    0,
  )
  const denominator = context.reduce((total, row) => {
    const distance =
      Math.abs(row.driverAge - query.driverAge) / 35 +
      Math.abs(row.vehicleAge - query.vehicleAge) / 12 +
      Math.abs(row.annualMiles - query.annualMiles) / 20 +
      (row.region === query.region ? 0 : 0.7)
    return total + Math.exp(-distance * 1.45)
  }, 0)
  return clamp(denominator === 0 ? 0.5 : weighted / denominator, 0.08, 0.92)
}

export const makePriorPoints = ({ family, smoothness, noise, seed = 13 }: PriorSettings): PriorPoint[] => {
  const random = seededRandom(seed)
  const points: PriorPoint[] = []
  for (let index = 0; index < 56; index += 1) {
    const x = random() * 2 - 1
    const y = random() * 2 - 1
    const wave = Math.sin((x + y) * (1.8 + (1 - smoothness) * 4)) * 0.3
    const treeStep = x > -0.2 && x < 0.42 && y > -0.3 ? 0.5 : -0.18
    const base = family === 'Tree' ? treeStep : family === 'SCM' ? x * 0.78 + y * 0.45 + wave : x * 0.58 + y * 0.35 + wave + treeStep * 0.5
    const jitter = (random() - 0.5) * noise * 1.2
    points.push({ x, y, label: base + jitter > 0 ? 1 : 0 })
  }
  return points
}

export const makeAttentionCells = (contextSize: number, focus = 2): AttentionCell[] => {
  const cells: AttentionCell[] = []
  for (let row = 0; row < contextSize; row += 1) {
    const raw = Array.from({ length: contextSize }, (_, column) => {
      const distance = Math.abs(row - column)
      const queryBoost = column === focus ? 1.25 : 0
      return Math.exp(-distance * 0.72 + queryBoost)
    })
    const total = raw.reduce((sum, value) => sum + value, 0)
    raw.forEach((value, column) => cells.push({ row, column, value: value / total }))
  }
  return cells
}

export const attentionForQuery = (contextSize: number, focus = 2) => {
  const raw = Array.from({ length: contextSize }, (_, index) => Math.exp(-Math.abs(index - focus) * 0.65))
  const total = raw.reduce((sum, value) => sum + value, 0)
  return raw.map((value) => value / total)
}

export const severityQuantiles = (base: number, spread: number, tail: number) => {
  const levels = [0.05, 0.15, 0.25, 0.5, 0.75, 0.85, 0.95]
  return levels.map((level) => {
    const centered = (level - 0.5) * 2
    const tailLift = Math.sign(centered) * Math.pow(Math.abs(centered), 1.6) * tail
    return Math.max(0.15, base + centered * spread + tailLift)
  })
}

export const quantileToDensity = (quantiles: number[], width = 280) => {
  if (quantiles.length < 2) return []
  const min = Math.min(...quantiles)
  const max = Math.max(...quantiles)
  return quantiles.map((value, index) => ({
    x: ((value - min) / Math.max(max - min, 0.01)) * width,
    y: 22 + Math.abs(index - (quantiles.length - 1) / 2) * 8,
  }))
}

export const expectedCost = (frequency: number, severity: number) => frequency * severity

export const calibrationBuckets = (probability: number) => {
  const base = [0.16, 0.31, 0.47, 0.64, 0.78]
  return base.map((value, index) => ({
    predicted: clamp(value * (0.78 + probability * 0.44)),
    observed: clamp(value * (0.82 + probability * 0.29) + (index - 2) * 0.015),
  }))
}

export const scalingSnapshot = (rows: number, features: number): ScalingSnapshot => {
  const rowTerm = rows / 1000
  const featureTerm = features / 100
  const classic = rowTerm * rowTerm * featureTerm + rowTerm * featureTerm * featureTerm
  const compressed = rowTerm * rowTerm + rowTerm * featureTerm * featureTerm
  const rowOnly = rowTerm * rowTerm
  return {
    classic,
    compressed,
    rowOnly,
    classicMemory: classic * 0.9 + featureTerm * 0.35,
    compressedMemory: compressed * 0.36 + featureTerm * 0.4,
  }
}

export const softmax = (values: number[]) => {
  const max = Math.max(...values)
  const exponentials = values.map((value) => Math.exp(value - max))
  const total = exponentials.reduce((sum, value) => sum + value, 0)
  return exponentials.map((value) => value / total)
}

export const targetProbability = (driverAge: number, vehicleAge: number, annualMiles: number, urban: boolean) => {
  const score = -1.6 + (45 - driverAge) * 0.018 + vehicleAge * 0.07 + annualMiles * 0.035 + (urban ? 0.34 : -0.12)
  return sigmoid(score)
}
