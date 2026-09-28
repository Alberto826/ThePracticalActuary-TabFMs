import type { ReactNode } from 'react'
import { BlockMath } from 'react-katex'
import { ArrowRight, Layers3, Network, Pause, Play, Table2 } from 'lucide-react'
import { motion } from 'motion/react'
import { equations } from '../content/equations'
import { SlideFrame } from './shared'

export type AttentionPhase = 'column' | 'row' | 'alternating' | 'icl'

type PhaseInfo = {
  id: AttentionPhase
  label: string
  stage: string
  title: string
  explanation: string
  formula: string
}

const phases: PhaseInfo[] = [
  { id: 'column', label: 'TFcol', stage: 'column-wise embedding', title: 'Understand each feature across rows', explanation: 'The column stage compares values within a feature. It can learn scale, spread, missingness, and empirical distribution before the model reasons about feature combinations.', formula: equations.columnAttention },
  { id: 'row', label: 'TFrow', stage: 'row-wise interaction', title: 'Mix features within each row', explanation: 'The row stage turns each table row into a fixed-width representation. Age, vehicle, mileage, and region can now interact inside one example.', formula: equations.rowAttention },
  { id: 'alternating', label: 'TFcol + TFrow', stage: 'alternating views', title: 'Let information travel through the table', explanation: 'Column and row views alternate. A value can first learn what is unusual within its feature, then influence how the complete row is represented.', formula: equations.alternating },
  { id: 'icl', label: 'TFicl', stage: 'dataset-wise ICL', title: 'Let the query read the context', explanation: 'The final stage operates on compressed row vectors. The query attends to labeled context rows while its target stays masked, then a head returns the prediction distribution.', formula: equations.tableNextLabel },
]

export function AttentionSlide({ phase, setPhase, playing, setPlaying }: { phase: AttentionPhase; setPhase: (value: AttentionPhase) => void; playing: boolean; setPlaying: (value: boolean) => void }) {
  const activePhase = phases.find((item) => item.id === phase) ?? phases[0]
  const activeIndex = Math.max(0, phases.findIndex((item) => item.id === activePhase.id))

  return (
    <SlideFrame number="03" kicker="In context / the mechanics of attention" tone="mint">
      <div className="slide-wide">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h2 className="slide-title">A tabular transformer builds a prediction <em>in stages.</em></h2>
            <p className="slide-lead max-w-4xl">TabICL-style architectures do not flatten a table into one long sentence. They first understand each column, then each row, and finally let the query read the compressed context.</p>
          </div>
          <span className="rounded-full border border-[#a8d2c3] bg-[#dfeee7] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#2f8175]">TFcol · TFrow · TFicl</span>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="surface-panel bg-[#fffdf8] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f8175]">architecture overview</p>
                <p className="mt-1 text-xl font-semibold">Cells become row representations, then a query prediction.</p>
              </div>
              <span className="rounded-full bg-[#f5f2ea] px-3 py-1.5 font-mono text-[10px] text-[#74808a]">target stays hidden</span>
            </div>
            <ArchitectureDiagram activeIndex={activeIndex} />
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#1e2a35]/10 pt-4 text-[10px] leading-5 text-[#74808a]"><span><span className="font-semibold text-[#3869a8]">vertical arrows</span> column attention</span><span><span className="font-semibold text-[#2f8175]">horizontal arrows</span> row attention</span><span><span className="font-semibold text-[#d64e3b]">coral query</span> asks for the missing target</span><span><span className="font-semibold text-[#a36b13]">yellow mask</span> blocks label leakage</span></div>
          </div>

          <div className="surface-panel bg-[#1e2a35] p-5 text-[#f5f2ea]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8fc9bb]">stage explorer</p>
                <p className="mt-1 text-xl font-semibold">{activePhase.title}</p>
              </div>
              <button onClick={() => setPlaying(!playing)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#f6c34a] px-3 py-2 text-xs font-semibold text-[#1e2a35]" aria-label={playing ? 'Pause architecture sequence' : 'Play architecture sequence'}>{playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'pause' : 'play'}</button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Transformer architecture stages">
              {phases.map((item, index) => <button key={item.id} onClick={() => setPhase(item.id)} role="tab" aria-selected={phase === item.id} className={`rounded-[9px] border px-3 py-2 text-left ${phase === item.id ? 'border-[#8fc9bb] bg-[#2f8175] text-[#f5f2ea]' : 'border-white/10 bg-white/5 text-[#bbc4c4] hover:bg-white/10'}`}><span className="block font-mono text-[9px] uppercase tracking-[0.08em]">{String(index + 1).padStart(2, '0')} / {item.label}</span><span className="mt-1 block text-[11px] font-semibold leading-4">{item.stage}</span></button>)}
            </div>
            <motion.div key={activePhase.id} className="mt-5 rounded-[10px] bg-[#f5f2ea] p-4 text-[#1e2a35]" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#3869a8]">what this stage contributes</p>
              <p className="mt-2 text-sm leading-6 text-[#53606a]">{activePhase.explanation}</p>
              <div className="mt-3 overflow-x-auto"><BlockMath math={activePhase.formula} /></div>
            </motion.div>
            <div className="mt-4 rounded-[10px] border border-[#f6c34a]/35 bg-[#f6c34a]/10 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#f6c34a]">mask rule</p><p className="mt-2 text-xs leading-5 text-[#d6dddd]">Context labels are visible to the model. The query target is replaced by <span className="font-mono text-[#f6c34a]">?</span>, so the output cannot copy the answer.</p></div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-[#1e2a35]/10 pt-5 md:grid-cols-[1fr_1.35fr] md:items-center">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#74808a]">the readout</p><p className="mt-1 text-lg font-semibold">The final head turns context evidence into a distribution.</p><p className="mt-2 text-sm leading-6 text-[#53606a]">Attention creates the representation. A prediction head converts the query&apos;s final vector into probabilities for the missing label.</p></div>
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-[12px] bg-[#f5f2ea] p-4 font-mono text-[10px]"><span className="rounded-full bg-[#dfeee7] px-3 py-2 text-[#2f8175]">context rows</span><ArrowRight size={15} className="text-[#3869a8]" /><span className="rounded-full bg-[#e4edf8] px-3 py-2 text-[#3869a8]">query vector</span><ArrowRight size={15} className="text-[#3869a8]" /><span className="rounded-full bg-[#fbe4dc] px-3 py-2 font-semibold text-[#d64e3b]">P(label | table)</span></div>
        </div>
      </div>
    </SlideFrame>
  )
}

function ArchitectureDiagram({ activeIndex }: { activeIndex: number }) {
  const stages = [
    { eyebrow: 'input', title: 'table tokens', note: 'rows + query', icon: <Table2 size={16} />, visual: <InputTable />, active: false },
    { eyebrow: 'TFcol', title: 'column embedding', note: 'same feature, across rows', icon: <Layers3 size={16} />, visual: <ColumnEmbedding />, active: activeIndex === 0 || activeIndex === 2 },
    { eyebrow: 'TFrow', title: 'row interaction', note: 'features within a row', icon: <Network size={16} />, visual: <RowInteraction />, active: activeIndex === 1 || activeIndex === 2 },
    { eyebrow: 'TFicl', title: 'dataset-wise ICL', note: 'context → query', icon: <Layers3 size={16} />, visual: <DatasetICL />, active: activeIndex === 3 },
  ]
  return <div className="mt-6 grid min-w-0 items-stretch gap-3 lg:grid-cols-[minmax(0,1.08fr)_auto_minmax(0,1.08fr)_auto_minmax(0,1.08fr)_auto_minmax(0,1.08fr)]">{stages.map((stage, index) => <div key={stage.eyebrow} className="contents"><ArchitectureStage {...stage} />{index < stages.length - 1 && <ArrowRight className="mx-auto self-center rotate-90 text-[#3869a8] lg:rotate-0" size={18} aria-hidden="true" />}</div>)}</div>
}

function ArchitectureStage({ eyebrow, title, note, icon, visual, active }: { eyebrow: string; title: string; note: string; icon: ReactNode; visual: ReactNode; active: boolean }) {
  return <motion.div className={`min-w-0 rounded-[11px] border p-3 ${active ? 'border-[#3e8d7e] bg-[#dfeee7]' : 'border-[#1e2a35]/10 bg-[#f5f2ea]'}`} animate={{ y: active ? -3 : 0, opacity: active ? 1 : 0.72 }} transition={{ duration: 0.3 }}><div className="flex items-start gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] ${active ? 'bg-[#2f8175] text-[#f5f2ea]' : 'bg-[#fffdf8] text-[#3869a8]'}`}>{icon}</span><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#3869a8]">{eyebrow}</p><p className="mt-1 text-sm font-semibold leading-4">{title}</p><p className="mt-1 text-[10px] leading-4 text-[#74808a]">{note}</p></div></div>{visual}</motion.div>
}

function InputTable() {
  const rows = [['A', '22', '11', '18'], ['B', '35', '7', '14'], ['C', '51', '9', '16'], ['Q', '39', '8', '?']]
  const columnX = [54, 106, 158]
  const rowY = [42, 76, 110, 144]
  return <div className="mt-4 overflow-hidden rounded-[7px] bg-[#fffdf8] p-2"><svg className="h-auto w-full" viewBox="0 0 210 170" role="img" aria-label="Table with vertical column-attention arrows between rows and horizontal row-attention arrows between columns"><defs><marker id="input-column-arrow" markerHeight="5" markerWidth="5" orient="auto" refX="4" refY="2.5" viewBox="0 0 5 5"><path d="M0,0 L5,2.5 L0,5 Z" fill="#3869a8" /></marker><marker id="input-row-arrow" markerHeight="5" markerWidth="5" orient="auto" refX="4" refY="2.5" viewBox="0 0 5 5"><path d="M0,0 L5,2.5 L0,5 Z" fill="#2f8175" /></marker></defs><text fill="#74808a" fontFamily="DM Mono, monospace" fontSize="8" textAnchor="middle" x="54" y="15">age</text><text fill="#74808a" fontFamily="DM Mono, monospace" fontSize="8" textAnchor="middle" x="106" y="15">vehicle</text><text fill="#74808a" fontFamily="DM Mono, monospace" fontSize="8" textAnchor="middle" x="158" y="15">miles</text>{rows.map((row, rowIndex) => <g key={row[0]}><text fill={row[0] === 'Q' ? '#d64e3b' : '#74808a'} fontFamily="DM Mono, monospace" fontSize="8" fontWeight="600" textAnchor="middle" x="12" y={rowY[rowIndex] + 5}>{row[0]}</text>{columnX.map((x, columnIndex) => <rect key={`${row[0]}-${columnIndex}`} fill={row[0] === 'Q' ? '#fbe4dc' : '#f5f2ea'} height="24" rx="5" stroke={row[0] === 'Q' ? '#efb2a2' : '#e5e1d7'} width="42" x={x - 21} y={rowY[rowIndex] - 12} />)}{row.slice(1).map((cell, columnIndex) => <text key={`${row[0]}-label-${columnIndex}`} fill={row[0] === 'Q' ? '#d64e3b' : '#53606a'} fontFamily="DM Mono, monospace" fontSize="9" fontWeight={row[0] === 'Q' ? '600' : '400'} textAnchor="middle" x={columnX[columnIndex]} y={rowY[rowIndex] + 4}>{cell}</text>)}</g>)}{columnX.map((x, columnIndex) => <g key={`column-route-${columnIndex}`}><path d={`M${x} 54 V62`} fill="none" markerEnd="url(#input-column-arrow)" stroke="#3869a8" strokeWidth="1.5" /><path d={`M${x} 88 V96`} fill="none" markerEnd="url(#input-column-arrow)" stroke="#3869a8" strokeWidth="1.5" /><path d={`M${x} 122 V130`} fill="none" markerEnd="url(#input-column-arrow)" stroke="#3869a8" strokeWidth="1.5" /></g>)}{rowY.map((y, rowIndex) => <g key={`row-route-${rowIndex}`}><path d={`M76 ${y} H82`} fill="none" markerEnd="url(#input-row-arrow)" stroke="#2f8175" strokeWidth="1.5" /><path d={`M128 ${y} H134`} fill="none" markerEnd="url(#input-row-arrow)" stroke="#2f8175" strokeWidth="1.5" /></g>)}</svg><div className="mt-1 grid gap-1 font-mono text-[8px] leading-4 text-[#74808a] sm:grid-cols-2"><span><span className="font-semibold text-[#3869a8]">down a column:</span> compare rows</span><span><span className="font-semibold text-[#2f8175]">across a row:</span> mix features</span></div></div>
}

function ColumnEmbedding() {
  const columns = [['age', '22', '35', '51', 'e₁'], ['vehicle', '11', '7', '9', 'e₂'], ['miles', '18', '14', '16', 'e₃']]
  return <div className="mt-4 grid grid-cols-3 gap-1">{columns.map((column) => <div key={column[0]} className="min-w-0 text-center font-mono text-[8px]"><span className="block truncate text-[#74808a]">{column[0]}</span>{column.slice(1, 4).map((value) => <span key={value} className="mt-1 block rounded-[4px] bg-[#fffdf8] py-1 text-[#53606a]">{value}</span>)}<span className="mt-1 block rounded-[5px] bg-[#f8edc9] py-1 font-semibold text-[#a36b13]">{column[4]}</span></div>)}</div>
}

function RowInteraction() {
  return <div className="mt-4 space-y-1.5 font-mono text-[8px]"><div className="grid grid-cols-[32px_repeat(3,1fr)] gap-1 text-center text-[#74808a]"><span /><span>age</span><span>vehicle</span><span>miles</span></div>{['row A', 'row B', 'query'].map((row, index) => <div key={row} className="grid grid-cols-[32px_repeat(3,1fr)] items-center gap-1"><span className={index === 2 ? 'text-[#d64e3b]' : 'text-[#74808a]'}>{row}</span>{['h₁', 'h₂', 'h₃'].map((value) => <span key={`${row}-${value}`} className={`rounded-[5px] py-1 text-center ${index === 2 ? 'bg-[#fbe4dc] text-[#d64e3b]' : 'bg-[#e4edf8] text-[#3869a8]'}`}>{value}</span>)}</div>)}</div>
}

function DatasetICL() {
  return <div className="mt-4 space-y-1.5 font-mono text-[8px]"><div className="flex items-center gap-1.5"><span className="rounded-[5px] bg-[#dfeee7] px-2 py-1 text-[#2f8175]">hA, yA</span><ArrowRight size={11} className="text-[#3869a8]" /><span className="text-[#74808a]">context</span></div><div className="flex items-center gap-1.5"><span className="rounded-[5px] bg-[#dfeee7] px-2 py-1 text-[#2f8175]">hB, yB</span><ArrowRight size={11} className="text-[#3869a8]" /><span className="text-[#74808a]">context</span></div><div className="flex items-center gap-1.5"><span className="rounded-[5px] bg-[#fbe4dc] px-2 py-1 font-semibold text-[#d64e3b]">hQ, ?</span><ArrowRight size={11} className="text-[#d64e3b]" /><span className="rounded-[5px] bg-[#f8edc9] px-2 py-1 font-semibold text-[#a36b13]">P(yQ)</span></div></div>
}