import { Fragment, type ReactNode } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import { ArrowDown, ArrowRight, Layers3, Network, Pause, Play, Table2 } from 'lucide-react'
import { motion } from 'motion/react'
import { equations } from '../content/equations'
import { SlideFrame } from './shared'

export type AttentionPhase = 'input' | 'tfcol' | 'cell-embeddings' | 'tfrow' | 'row-embeddings' | 'icl' | 'contextualized-vectors' | 'decode'

type PhaseInfo = {
  id: AttentionPhase
  label: string
  title: string
  explanation: ReactNode
  caption: ReactNode
  formula?: string
}

const cellEmbeddingColors = ['#3869a8', '#2f8175', '#d64e3b'] as const

const phases: PhaseInfo[] = [
  { id: 'input', label: 'Input table', title: 'Context rows plus two queries', explanation: 'The context rows carry observed labels. Both query rows contribute their features, while their targets stay masked until decoding.', caption: 'Known labels in A-C; Q1 and Q2 are masked.' },
  { id: 'tfcol', label: 'TFcol', title: 'Attend within each column', explanation: 'Column-wise attention compares values within each feature column, encoding that column\'s distribution properties across rows. The highlighted age column is one example; TFrow later combines features within rows.', caption: 'Same feature, different rows.', formula: equations.columnAttention },
  { id: 'cell-embeddings', label: 'Cell embeddings', title: 'Make one vector per cell', explanation: 'TFcol produces a contextual embedding for every table cell, including the feature cells in both query rows. The two query targets remain masked.', caption: 'One vector for every cell.' },
  { id: 'tfrow', label: 'TFrow', title: 'Attend across each row', explanation: 'Each row combines its feature-cell embeddings with a CLS token. TFrow attention lets the CLS token collect row information while query labels stay masked.', caption: 'Four feature cells plus a CLS token per row.', formula: equations.rowAttention },
  {
    id: 'row-embeddings',
    label: 'Row embeddings',
    title: 'Add labels to CLS vectors',
    explanation: <>For context rows, add the known y-label embedding to the CLS output <InlineMath math={String.raw`\mathrm{CLS}_i`} /> to form row vector <InlineMath math="r_i" />. Query labels are masked, so <InlineMath math={String.raw`r_{Q_i}=\mathrm{CLS}_{Q_i}`} />.</>,
    caption: <>Context: <InlineMath math={String.raw`r_i=\mathrm{CLS}_i+e_{y_i}`} />; queries: <InlineMath math={String.raw`r_{Q_i}=\mathrm{CLS}_{Q_i}`} />.</>,
    formula: equations.rowEmbedding,
  },
  {
    id: 'icl',
    label: 'TFICL',
    title: 'Attend over the context',
    explanation: <>TFICL contextualizes the CLS-based row vectors. Each query reads labeled context vectors <InlineMath math="r_A,r_B,r_C" />, not the other query.</>,
    caption: <><InlineMath math="r_A,r_B,r_C" /> inform <InlineMath math="r_{Q_1},r_{Q_2}" />.</>,
    formula: equations.attention,
  },
  { id: 'contextualized-vectors', label: 'Contextualized vectors', title: 'Carry context into each row', explanation: <>TFICL transforms each CLS-based row vector <InlineMath math="r_i" /> into contextualized vector <InlineMath math="C_i" />, carrying labeled-context evidence into the queries.</>, caption: <>One contextualized vector <InlineMath math="C_i" /> per row.</> },
  {
    id: 'decode',
    label: 'Decode',
    title: 'Predict query values with MLP heads',
    explanation: <>All contextualized vectors <InlineMath math={String.raw`\mathbf C=(C_A,C_B,C_C,C_{Q_1},C_{Q_2})`} /> feed both MLP heads; each head predicts one query value.</>,
    caption: <><InlineMath math="\mathbf C" /> → two MLP heads → two predictions.</>,
    formula: equations.mlpDecode,
  },
]

export function AttentionSlide({ phase, setPhase, playing, setPlaying }: { phase: AttentionPhase; setPhase: (value: AttentionPhase) => void; playing: boolean; setPlaying: (value: boolean) => void }) {
  const activePhase = phases.find((item) => item.id === phase) ?? phases[0]
  const activeIndex = Math.max(0, phases.findIndex((item) => item.id === activePhase.id))

  return (
    <SlideFrame number="03" kicker="In context / the mechanics of attention" tone="mint">
      <div className="slide-wide">
        <div>
          <h2 className="slide-title">How TabICL attends to a table</h2>
          <p className="slide-lead max-w-4xl">Following Qu et al.'s <a href="https://arxiv.org/abs/2502.05564" target="_blank" rel="noreferrer" className="underline decoration-[#2f8175] underline-offset-2 hover:text-[#2f8175]">TabICL: A Tabular Foundation Model for In-Context Learning on Large Data</a> (ICML 2025), this walkthrough traces TFcol's column-wise attention, TFrow's row-wise attention, and TFICL's attention across the context before decoding both query labels.</p>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#2f8175]">the table's path through the model</p>
          <button onClick={() => setPlaying(!playing)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#f6c34a] px-3 py-2 text-xs font-semibold text-[#1e2a35]" aria-label={playing ? 'Pause eight-step sequence' : 'Play eight-step sequence'}>{playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'pause' : 'play sequence'}</button>
        </div>
        <div className="mt-4 grid min-w-0 items-start gap-5 md:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.36fr)]">
          <ArchitectureDiagram phase={phase} setPhase={setPhase} />
          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <motion.section key={activePhase.id} className="surface-panel bg-[#1e2a35] p-5 text-[#f5f2ea]" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8fc9bb]">step {String(activeIndex + 1).padStart(2, '0')} / 08 · {activePhase.label}</p>
              <h3 className="mt-2 text-xl font-semibold">{activePhase.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#d6dddd]">{activePhase.explanation}</p>
              {activePhase.formula && <div className="mt-4 overflow-x-auto border-t border-white/10 pt-3 text-[#f5f2ea]"><BlockMath math={activePhase.formula} /></div>}
            </motion.section>
            <div className="border-l-2 border-[#f6c34a] pl-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a36b13]">target mask</p>
              <p className="mt-2 text-sm leading-6 text-[#53606a]">Context labels stay with A-C. The features for <span className="font-mono text-[#d64e3b]">Q1</span> and <span className="font-mono text-[#d64e3b]">Q2</span> are visible, but both target labels remain masked until decoding.</p>
            </div>
          </aside>
        </div>
      </div>
    </SlideFrame>
  )
}

function ArchitectureDiagram({ phase, setPhase }: { phase: AttentionPhase; setPhase: (value: AttentionPhase) => void }) {
  const icons: Record<AttentionPhase, ReactNode> = {
    input: <Table2 size={15} />,
    tfcol: <ArrowDown size={15} />,
    'cell-embeddings': <Layers3 size={15} />,
    tfrow: <Network size={15} />,
    'row-embeddings': <Layers3 size={15} />,
    icl: <Network size={15} />,
    'contextualized-vectors': <Layers3 size={15} />,
    decode: <ArrowRight size={15} />,
  }
  const visuals: Record<AttentionPhase, ReactNode> = {
    input: <InputTable />,
    tfcol: <ColumnAttention />,
    'cell-embeddings': <ColumnEmbedding />,
    tfrow: <RowInteraction />,
    'row-embeddings': <RowEmbeddings />,
    icl: <DatasetICL />,
    'contextualized-vectors': <ContextualizedVectors />,
    decode: <Decoder />,
  }

  return (
    <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3" role="tablist" aria-label="Eight steps from table input to decoded query labels">
      {phases.map((step, index) => (
        <Fragment key={step.id}>
          <ArchitectureStage phase={step} index={index} active={phase === step.id} onSelect={setPhase} icon={icons[step.id]} visual={visuals[step.id]} />
          {index === 3 && <div className="col-span-full flex justify-center text-[#3869a8] lg:hidden" aria-hidden="true"><ArrowDown size={16} /></div>}
          {(index === 2 || index === 5) && <div className="col-span-full hidden justify-center text-[#3869a8] lg:flex" aria-hidden="true"><ArrowDown size={16} /></div>}
        </Fragment>
      ))}
    </div>
  )
}

function ArchitectureStage({ phase, index, active, onSelect, icon, visual }: { phase: PhaseInfo; index: number; active: boolean; onSelect: (value: AttentionPhase) => void; icon: ReactNode; visual: ReactNode }) {
  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={`Step ${index + 1}: ${phase.label}. ${phase.title}`}
      onClick={() => onSelect(phase.id)}
      className={`min-w-0 rounded-[10px] border p-3 text-left transition-colors ${active ? 'border-[#3e8d7e] bg-[#dfeee7]' : 'border-[#1e2a35]/10 bg-[#fffdf8] hover:border-[#3e8d7e]/50'}`}
      animate={{ y: active ? -2 : 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] ${active ? 'bg-[#2f8175] text-[#f5f2ea]' : 'bg-[#e4edf8] text-[#3869a8]'}`}>{icon}</span>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#3869a8]">{String(index + 1).padStart(2, '0')} / {phase.label}</span>
      </div>
      <p className="mt-2 min-h-8 text-[12px] font-semibold leading-4">{phase.title}</p>
      <div className="mt-2 flex min-h-[160px] items-center justify-center overflow-hidden rounded-[7px] bg-[#f5f2ea] p-2">{visual}</div>
      <p className="mt-2 text-[9px] leading-4 text-[#74808a]">{phase.caption}</p>
    </motion.button>
  )
}

function InputTable() {
  const rows = [
    { id: 'A', values: ['22', 'Sedan', '18k', 'NE', '0'] },
    { id: 'B', values: ['35', 'SUV', '7k', 'SW', '1'] },
    { id: 'C', values: ['51', 'Sedan', '9k', 'NE', '0'] },
    { id: 'Q1', values: ['39', 'SUV', '8k', 'SE', '?'] },
    { id: 'Q2', values: ['44', 'Sedan', '12k', 'NW', '?'] },
  ]
  const columns = ['age', 'car', 'miles', 'region', 'y']

  return (
    <div role="table" aria-label="Three context rows with claim labels and two query rows with their labels masked" className="w-full font-mono text-[8px]">
      <div role="row" className="grid grid-cols-[18px_repeat(5,minmax(0,1fr))] gap-0.5 text-center text-[#74808a]">
        <span role="columnheader" />
        {columns.map((column) => <span key={column} role="columnheader" className="truncate">{column}</span>)}
      </div>
      {rows.map((row) => (
        <div key={row.id} role="row" className="mt-1 grid grid-cols-[18px_repeat(5,minmax(0,1fr))] gap-0.5 text-center">
          <span role="rowheader" className={row.id.startsWith('Q') ? 'font-semibold text-[#d64e3b]' : 'text-[#74808a]'}>{row.id}</span>
          {columns.map((column, index) => {
            const value = row.values[index]
            const target = column === 'y'
            const queryRow = row.id.startsWith('Q')
            const masked = queryRow && target
            const queryFeature = queryRow && !target
            return <span key={`${row.id}-${column}`} role="cell" className={`truncate rounded-[3px] px-0.5 py-1 ${masked ? 'bg-[#f8edc9] font-semibold text-[#a36b13]' : queryFeature ? 'bg-[#fbe4dc] text-[#d64e3b]' : target ? 'bg-[#dfeee7] text-[#2f8175]' : 'bg-white text-[#53606a]'}`}>{masked ? '?' : value}</span>
          })}
        </div>
      ))}
    </div>
  )
}

type AttentionNetworkNode = {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  kind: 'context' | 'query' | 'output'
  vector?: boolean
  displayLabel?: ReactNode
}

type AttentionNetworkEdge = { from: string; to: string; bidirectional?: boolean; curve?: number }

function BidirectionalAttentionNetwork({ label, markerId, width, height, nodes, edges, displayHeight = height, preserveAspectRatio }: { label: string; markerId: string; width: number; height: number; nodes: AttentionNetworkNode[]; edges: AttentionNetworkEdge[]; displayHeight?: number; preserveAspectRatio?: 'none' }) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: displayHeight }} preserveAspectRatio={preserveAspectRatio}>
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" viewBox="0 0 6 6" refX="6" refY="3" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3869a8" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const from = nodesById.get(edge.from)
        const to = nodesById.get(edge.to)
        if (!from || !to) return null
        const fromX = from.x + from.width / 2
        const fromY = from.y + from.height / 2
        const toX = to.x + to.width / 2
        const toY = to.y + to.height / 2
        const deltaX = toX - fromX
        const deltaY = toY - fromY
        let path: string
        if (edge.curve) {
          if (Math.abs(deltaX) >= Math.abs(deltaY)) {
            const direction = deltaX >= 0 ? 1 : -1
            const startX = fromX + direction * from.width / 2
            const endX = toX - direction * to.width / 2
            const controlDistance = (endX - startX) * 0.35
            path = `M${startX} ${fromY} C${startX + controlDistance} ${fromY + edge.curve},${endX - controlDistance} ${toY + edge.curve},${endX} ${toY}`
          } else {
            const side = edge.curve > 0 ? 1 : -1
            const controlOffset = Math.abs(edge.curve)
            const verticalDistance = toY - fromY
            const startX = fromX + side * from.width / 2
            const endX = toX + side * to.width / 2
            path = `M${startX} ${fromY} C${startX + side * controlOffset} ${fromY + verticalDistance * 0.35},${endX + side * controlOffset} ${toY - verticalDistance * 0.35},${endX} ${toY}`
          }
        } else {
          const fromScale = 1 / Math.max(Math.abs(deltaX) / (from.width / 2), Math.abs(deltaY) / (from.height / 2))
          const toScale = 1 / Math.max(Math.abs(deltaX) / (to.width / 2), Math.abs(deltaY) / (to.height / 2))
          path = `M${fromX + deltaX * fromScale} ${fromY + deltaY * fromScale} L${toX - deltaX * toScale} ${toY - deltaY * toScale}`
        }

        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={path}
            fill="none"
            stroke="#3869a8"
            strokeOpacity="0.85"
            strokeWidth="1.25"
            markerStart={edge.bidirectional ? `url(#${markerId})` : undefined}
            markerEnd={`url(#${markerId})`}
          />
        )
      })}
      {nodes.map((node) => {
        const colors = node.kind === 'query'
          ? { fill: '#fbe4dc', stroke: '#efb2a2', text: '#d64e3b' }
          : node.kind === 'output'
            ? { fill: '#f8edc9', stroke: '#e3c66d', text: '#a36b13' }
            : { fill: '#e4edf8', stroke: '#b9cee8', text: '#3869a8' }

        return (
          <g key={node.id}>
            <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="4" fill={colors.fill} stroke={colors.stroke} strokeWidth="1" />
            {node.vector
              ? <g aria-hidden="true">{cellEmbeddingColors.map((color, index) => <rect key={color} x={node.x + (node.width - (cellEmbeddingColors.length * 5 + (cellEmbeddingColors.length - 1) * 2)) / 2 + index * 7} y={node.y + 4} width="5" height="8" rx="1" fill={color} />)}</g>
              : <text x={node.x + node.width / 2} y={node.y + node.height / 2} textAnchor="middle" dominantBaseline="middle" fill={colors.text} fontFamily="DM Mono, monospace" fontSize="8" fontWeight="600">{node.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function ColumnAttention() {
  const rows = [
    { id: 'a', label: 'A 22', kind: 'context' as const },
    { id: 'b', label: 'B 35', kind: 'context' as const },
    { id: 'c', label: 'C 51', kind: 'context' as const },
    { id: 'q1', label: 'Q1 39', kind: 'query' as const },
    { id: 'q2', label: 'Q2 44', kind: 'query' as const },
  ]
  const nodes: AttentionNetworkNode[] = rows.map((row, index) => ({ ...row, x: 70, y: 2 + index * 34, width: 60, height: 16 }))
  const edges: AttentionNetworkEdge[] = []
  for (let fromIndex = 0; fromIndex < rows.length; fromIndex += 1) {
    for (let toIndex = fromIndex + 1; toIndex < rows.length; toIndex += 1) {
      const gap = toIndex - fromIndex
      edges.push({ from: rows[fromIndex].id, to: rows[toIndex].id, bidirectional: true, ...(gap > 1 ? { curve: (fromIndex + toIndex) % 2 === 0 ? -12 - gap : 12 + gap } : {}) })
    }
  }

  return (
    <div className="w-full">
      <p className="mb-1 text-center font-mono text-[8px] uppercase text-[#3869a8]">age column · all pairs attend</p>
      <BidirectionalAttentionNetwork label="TFcol: three context age cells and two query age cells have bidirectional attention connections" markerId="tfcol-arrow" width={200} height={160} nodes={nodes} edges={edges} />
    </div>
  )
}

function ColumnEmbedding() {
  const columns = ['age', 'car', 'mi', 'region', 'y']
  const rows = ['A', 'B', 'C', 'Q1', 'Q2']

  return (
    <div role="img" aria-label="A vector embedding for each table cell; query targets in column y remain masked" className="grid w-full grid-cols-[12px_repeat(5,minmax(0,1fr))] items-center gap-x-1 gap-y-1 font-mono text-[7px]">
      <span />
      {columns.map((column) => <span key={column} className="truncate text-center text-[#74808a]">{column}</span>)}
      {rows.map((row) => (
        <Fragment key={row}>
          <span className={row === 'Q' ? 'text-[#d64e3b]' : 'text-[#74808a]'}>{row}</span>
          {columns.map((column) => {
            const queryRow = row.startsWith('Q')
            const masked = queryRow && column === 'y'
            const queryFeature = queryRow && !masked
            return (
              <span key={`${row}-${column}`} title={masked ? `Masked query target in ${column}` : `Embedding vector for ${row}, ${column}`} className={`flex h-6 min-w-0 items-center justify-center rounded-[3px] px-0.5 ${masked ? 'bg-[#f8edc9] text-[#a36b13]' : queryFeature ? 'bg-[#fbe4dc]' : 'bg-white'}`}>
                {masked ? '?' : <span className="grid w-full grid-cols-3 gap-[2px]" aria-hidden="true">{cellEmbeddingColors.map((color) => <span key={color} className="h-2 rounded-[2px]" style={{ backgroundColor: color }} />)}</span>}
              </span>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}

function RowInteraction() {
  const rows = [
    { id: 'A', kind: 'context' as const },
    { id: 'B', kind: 'context' as const },
    { id: 'C', kind: 'context' as const },
    { id: 'Q1', kind: 'query' as const },
    { id: 'Q2', kind: 'query' as const },
  ]
  const features = ['age', 'car', 'mi', 'region', 'CLS']

  return (
    <div className="w-full">
      <p className="mb-1 text-center font-mono text-[8px] uppercase text-[#2f8175]">cell embeddings + CLS token · every pair attends</p>
      <div className="grid grid-cols-[18px_repeat(5,minmax(0,1fr))] text-center font-mono text-[7px] text-[#74808a]">
        <span />
        {features.map((feature) => <span key={feature}>{feature}</span>)}
      </div>
      <div className="mt-0.5 space-y-1">
        {rows.map((row) => {
          const nodes: AttentionNetworkNode[] = features.map((feature, index) => ({
            id: `${row.id}-${feature}`,
            label: feature,
            x: 8 + index * 40,
            y: 10,
            width: 24,
            height: 16,
            kind: feature === 'CLS' ? 'output' : row.kind,
            vector: feature !== 'CLS',
          }))
          const edges: AttentionNetworkEdge[] = []
          for (let fromIndex = 0; fromIndex < features.length; fromIndex += 1) {
            for (let toIndex = fromIndex + 1; toIndex < features.length; toIndex += 1) {
              const gap = toIndex - fromIndex
              const curve = ((fromIndex + toIndex) % 2 === 0 ? -1 : 1) * (8 + gap * 3)
              edges.push({ from: nodes[fromIndex].id, to: nodes[toIndex].id, bidirectional: true, ...(gap > 1 ? { curve } : {}) })
            }
          }

          return (
            <div key={row.id} className="grid grid-cols-[18px_repeat(5,minmax(0,1fr))] items-center">
              <span className={`text-center font-mono text-[7px] ${row.kind === 'query' ? 'text-[#d64e3b]' : 'text-[#74808a]'}`}>{row.id}</span>
              <div className="col-span-5 min-w-0">
                <BidirectionalAttentionNetwork label={`${row.id} row: four cell embeddings and one CLS token connect bidirectionally across the row${row.kind === 'query' ? '; the target label remains masked' : ''}`} markerId={`tfrow-${row.id}`} width={200} height={36} displayHeight={36} preserveAspectRatio="none" nodes={nodes} edges={edges} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RowEmbeddings() {
  const rows = [
    { id: 'A', symbol: 'A', target: '0', kind: 'context' as const },
    { id: 'B', symbol: 'B', target: '1', kind: 'context' as const },
    { id: 'C', symbol: 'C', target: '0', kind: 'context' as const },
    { id: 'Q1', symbol: 'Q_1', target: null, kind: 'query' as const },
    { id: 'Q2', symbol: 'Q_2', target: null, kind: 'query' as const },
  ]

  return (
    <div role="img" aria-label="CLS vectors CLS_A, CLS_B, CLS_C, CLS_Q1 and CLS_Q2; context row vectors add their y-label embeddings, while query row vectors equal their CLS vectors because y is masked" className="w-full space-y-1 font-mono text-[8px]">
      {rows.map((row) => {
        const hasLabel = row.target !== null
        const rowColors = hasLabel ? [...cellEmbeddingColors, '#a36b13'] : cellEmbeddingColors

        return (
          <div key={row.id} className="grid w-full grid-cols-[14px_minmax(0,1fr)_10px_minmax(0,1fr)_10px_minmax(0,1fr)] items-center gap-x-1.5">
            <span className={row.kind === 'query' ? 'text-[#d64e3b]' : 'text-[#74808a]'}>{row.id}</span>
            <span className="flex h-7 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[4px] bg-white p-1 text-[8px]" title={`CLS token vector CLS_${row.id}`}>
              <span className="grid w-6 grid-cols-3 gap-[2px]" aria-hidden="true">
                {cellEmbeddingColors.map((color) => <span key={color} className="h-1.5 rounded-[2px]" style={{ backgroundColor: color }} />)}
              </span>
              <InlineMath math={String.raw`\mathrm{CLS}_{${row.symbol}}`} />
            </span>
            <span className="text-center text-[10px] text-[#74808a]" aria-hidden="true">{hasLabel ? '+' : ''}</span>
            {hasLabel ? (
              <span className="flex h-7 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[4px] bg-[#f8edc9] px-0.5 py-1 text-[8px] text-[#a36b13]" title={`Label embedding e_y=${row.target}`}>
                <span className="h-1.5 w-6 rounded-full bg-[#a36b13]" aria-hidden="true" />
                <span className="flex items-center gap-0.5"><InlineMath math={`e_{y_{${row.symbol}}}`} /><span className="text-[6px]">={row.target}</span></span>
              </span>
            ) : <span className="flex h-7 min-w-0 items-center justify-center whitespace-nowrap rounded-[4px] bg-[#f8edc9] px-1 text-[7px] text-[#a36b13]">y masked</span>}
            <span className="text-center text-[10px] text-[#74808a]" aria-hidden="true">=</span>
            <span className={`flex h-7 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[4px] p-1 text-[9px] ${row.kind === 'query' ? 'bg-[#fbe4dc]' : 'bg-white'}`} title={`Row embedding r_${row.id}`}>
              <span className={`grid w-7 ${hasLabel ? 'grid-cols-4' : 'grid-cols-3'} gap-[2px]`} aria-hidden="true">
                {rowColors.map((color) => <span key={color} className="h-1.5 rounded-[2px]" style={{ backgroundColor: color }} />)}
              </span>
              <InlineMath math={`r_{${row.symbol}}`} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DatasetICL() {
  const contextRows = [
    { id: 'a', rowLabel: 'A', symbol: 'A', target: '0', kind: 'context' as const },
    { id: 'b', rowLabel: 'B', symbol: 'B', target: '1', kind: 'context' as const },
    { id: 'c', rowLabel: 'C', symbol: 'C', target: '0', kind: 'context' as const },
  ]
  const queryRows = [
    { id: 'q1', rowLabel: 'Q1', symbol: 'Q_1', target: null, kind: 'query' as const },
    { id: 'q2', rowLabel: 'Q2', symbol: 'Q_2', target: null, kind: 'query' as const },
  ]
  const rows = [...contextRows, ...queryRows]
  const nodeSpacing = 34
  const nodes: AttentionNetworkNode[] = rows.map((row, index) => ({ id: row.id, label: '', x: 56, y: 2 + index * nodeSpacing, width: 88, height: 16, kind: row.kind }))
  const edges: AttentionNetworkEdge[] = []
  for (let fromIndex = 0; fromIndex < contextRows.length; fromIndex += 1) {
    for (let toIndex = fromIndex + 1; toIndex < contextRows.length; toIndex += 1) {
      const gap = toIndex - fromIndex
      edges.push({ from: rows[fromIndex].id, to: rows[toIndex].id, bidirectional: true, ...(gap > 1 ? { curve: (fromIndex + toIndex) % 2 === 0 ? -12 - gap : 12 + gap } : {}) })
    }
  }
  queryRows.forEach((query, queryIndex) => contextRows.forEach((context, contextIndex) => {
    const curve = (queryIndex + contextIndex) % 2 === 0 ? -18 : 18
    edges.push({ from: query.id, to: context.id, curve })
  }))

  return (
    <div className="w-full">
      <p className="mb-1 text-center font-mono text-[8px] uppercase text-[#3869a8]"><InlineMath math="r_A,r_B,r_C" /> attend mutually · queries read context only</p>
      <div className="relative w-full" style={{ height: 164 }}>
        <BidirectionalAttentionNetwork label="TFICL: row vectors r_A, r_B, r_C, r_Q1 and r_Q2; context rows connect bidirectionally and each query reads context only" markerId="tficl-arrow" width={200} height={164} displayHeight={164} preserveAspectRatio="none" nodes={nodes} edges={edges} />
        {rows.map((row, index) => (
          <div key={row.id} className={`absolute flex items-center justify-center gap-1 whitespace-nowrap font-mono text-[8px] ${row.kind === 'query' ? 'text-[#d64e3b]' : 'text-[#3869a8]'}`} style={{ left: '28%', top: 2 + index * nodeSpacing, width: '44%', height: 16 }}>
            <span>{row.rowLabel}</span>
            <InlineMath math={`r_{${row.symbol}}`} />
            <InlineMath math={`y=${row.target ?? '?'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ContextualizedVectors() {
  const rows = [
    { id: 'A', symbol: 'A' },
    { id: 'B', symbol: 'B' },
    { id: 'C', symbol: 'C' },
    { id: 'Q1', symbol: 'Q_1' },
    { id: 'Q2', symbol: 'Q_2' },
  ]
  const colors = [...cellEmbeddingColors, '#a36b13']

  return (
    <div role="img" aria-label="TFICL maps CLS-based row vectors r_A, r_B, r_C, r_Q1 and r_Q2 to contextualized vectors C_A, C_B, C_C, C_Q1 and C_Q2" className="w-full space-y-1.5 font-mono text-[8px]">
      <p className="text-center text-[7px] text-[#74808a]"><InlineMath math={String.raw`r_i \longrightarrow C_i`} /></p>
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2">
          <span className={row.id.startsWith('Q') ? 'text-[#d64e3b]' : 'text-[#74808a]'}>{row.id}</span>
          <span className={`grid grid-cols-4 gap-1 rounded-[4px] p-1 ${row.id.startsWith('Q') ? 'bg-[#fbe4dc]' : 'bg-[#dfeee7]'}`} title={`Contextualized vector C_${row.id}`} aria-label={`Contextualized vector C_${row.id}`}>
            {colors.map((color) => <span key={color} className="h-2.5 rounded-[2px]" style={{ backgroundColor: color }} />)}
          </span>
          <InlineMath math={`C_{${row.symbol}}`} />
        </div>
      ))}
    </div>
  )
}

function Decoder() {
  const inputRows = [
    { id: 'A', symbol: 'A', kind: 'context' as const },
    { id: 'B', symbol: 'B', kind: 'context' as const },
    { id: 'C', symbol: 'C', kind: 'context' as const },
    { id: 'Q1', symbol: 'Q_1', kind: 'query' as const },
    { id: 'Q2', symbol: 'Q_2', kind: 'query' as const },
  ]
  const queryRows = [
    { id: 'Q1', symbol: 'Q_1', prediction: '1' },
    { id: 'Q2', symbol: 'Q_2', prediction: '0' },
  ]
  const networkWidth = 250
  const networkHeight = 164
  const inputNodes: AttentionNetworkNode[] = inputRows.map((row, index) => ({
    id: `vector-${row.id}`,
    label: '',
    x: 0,
    y: 2 + index * 34,
    width: 54,
    height: 16,
    kind: row.kind,
    displayLabel: <InlineMath math={`C_{${row.symbol}}`} />,
  }))
  const mlpNodes: AttentionNetworkNode[] = queryRows.map((query, index) => ({
    id: `mlp-${query.id}`,
    label: '',
    x: 142,
    y: 2 + (inputRows.length - queryRows.length + index) * 34,
    width: 44,
    height: 16,
    kind: 'context',
    displayLabel: 'MLP',
  }))
  const predictionNodes: AttentionNetworkNode[] = queryRows.map((query, index) => ({
    id: `prediction-${query.id}`,
    label: '',
    x: 198,
    y: 2 + (inputRows.length - queryRows.length + index) * 34,
    width: 48,
    height: 16,
    kind: 'output',
    displayLabel: <InlineMath math={String.raw`\widehat{y}_{${query.symbol}}=${query.prediction}`} />,
  }))
  const nodes = [...inputNodes, ...mlpNodes, ...predictionNodes]
  const edges: AttentionNetworkEdge[] = []
  inputNodes.forEach((input) => mlpNodes.forEach((head, headIndex) => {
    if (input.kind === 'query' && head.id !== input.id.replace('vector-', 'mlp-')) return
    const curve = input.kind === 'context' ? (headIndex === 0 ? -12 : 12) : undefined
    edges.push({ from: input.id, to: head.id, ...(curve === undefined ? {} : { curve }) })
  }))
  mlpNodes.forEach((head, index) => edges.push({ from: head.id, to: predictionNodes[index].id }))

  return (
    <div role="img" aria-label="Context vectors C_A, C_B and C_C connect to both query MLP heads; C_Q1 and C_Q2 connect only to their matching heads, each of which predicts its query label" className="relative w-full" style={{ height: networkHeight }}>
      <BidirectionalAttentionNetwork label="Decoder: context vectors feed both query MLP heads; each query vector feeds its matching head and each head produces a predicted label" markerId="decoder-arrow" width={networkWidth} height={networkHeight} displayHeight={networkHeight} preserveAspectRatio="none" nodes={nodes} edges={edges} />
      {nodes.map((node) => (
        <div
          key={`${node.id}-label`}
          className={`absolute flex items-center justify-center whitespace-nowrap font-mono ${node.kind === 'query' ? 'text-[8px] text-[#d64e3b]' : node.kind === 'output' ? 'text-[7px] text-[#a36b13]' : 'text-[8px] text-[#3869a8]'}`}
          style={{ left: `${node.x / networkWidth * 100}%`, top: node.y, width: `${node.width / networkWidth * 100}%`, height: node.height }}
        >
          {node.displayLabel}
        </div>
      ))}
    </div>
  )
}