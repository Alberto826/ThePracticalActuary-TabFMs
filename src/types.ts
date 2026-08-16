export type EvidenceKind = 'paper-result' | 'method' | 'limitation'

export type PaperSource = {
  id: string
  file: string
  title: string
  authors: string
  status: 'Journal article' | 'Conference paper' | 'Technical report'
  date: string
  venue: string
  focus: string
  sourceUrl: string
  externalUrl: string
}

export type Claim = {
  id: string
  sourceId: string
  family: string
  kind: EvidenceKind
  claim: string
  context: string
  metric: string
  regime: string
  tags: string[]
}

export type TableRow = {
  id: string
  driverAge: number
  vehicleAge: number
  annualMiles: number
  region: string
  claim: 0 | 1
  severity: number
}

export type PriorPoint = {
  x: number
  y: number
  label: 0 | 1
}

export type AttentionCell = {
  value: number
  row: number
  column: number
}
