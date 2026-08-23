import type { ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ExternalLink,
  GitBranch,
  Layers3,
} from 'lucide-react'
import { motion } from 'motion/react'
import { benchmarkJourney, tabArenaSnapshot, type BenchmarkEra, type BenchmarkRow } from '../content/benchmarks'
import { SlideFrame } from './shared'

export function BenchmarkJourneySlide() {
  const scoreRows = tabArenaSnapshot.filter((row) => ['TabPFN-3', 'TabICLv2', 'CatBoost', 'XGBoost', 'Linear model'].includes(row.model))
  const tabPfn3 = scoreRows.find((row) => row.model === 'TabPFN-3')
  const catBoost = scoreRows.find((row) => row.model === 'CatBoost')
  const xgBoost = scoreRows.find((row) => row.model === 'XGBoost')
  const maxElo = Math.max(...scoreRows.map((row) => row.elo), 1)
  const stageColors: Record<BenchmarkEra['id'], string> = {
    linear: '#3869a8',
    trees: '#c78924',
    neural: '#d64e3b',
    foundation: '#2f8175',
  }
  const stageIcons: Record<BenchmarkEra['id'], ReactNode> = {
    linear: <BarChart3 size={21} />,
    trees: <GitBranch size={21} />,
    neural: <BrainCircuit size={21} />,
    foundation: <Layers3 size={21} />,
  }

  return (
    <SlideFrame number="06" kicker="Benchmarks / the tabular model journey" tone="yellow">
      <div className="slide-wide">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h2 className="slide-title">The tabular winner changed.</h2>
            <p className="slide-lead max-w-3xl">Trees took the lead from additive models. Early neural nets did not consistently displace them. Recent tabular foundation models are the new challenge.</p>
          </div>
          <a href="https://huggingface.co/spaces/TabArena/leaderboard" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1e2a35] px-4 py-3 text-xs font-semibold text-[#f5f2ea] hover:bg-[#3869a8]">live TabArena board <ExternalLink size={14} /></a>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-4">
          {benchmarkJourney.map((stage, index) => {
            const color = stageColors[stage.id]
            return (
              <div key={stage.id} className="relative rounded-[14px] border border-[#1e2a35]/10 bg-[#fffdf8] p-4" style={{ borderTopColor: color, borderTopWidth: 3 }}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color }}>{stage.label}</p>
                  <span className="rounded-full px-2 py-1 font-mono text-[9px] font-semibold" style={{ color, backgroundColor: `${color}16` }}>{stage.signal}</span>
                </div>
                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-[10px]" style={{ color, backgroundColor: `${color}16` }}>{stageIcons[stage.id]}</div>
                <h3 className="mt-4 text-base font-semibold leading-5">{stage.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#74808a]">{stage.summary}</p>
                {index < benchmarkJourney.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden bg-[#f5f2ea] text-[#9aa0a0] lg:block" size={17} />}
              </div>
            )
          })}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-panel bg-[#fffdf8] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f8175]">current snapshot / TabArena</p>
                <h3 className="mt-1 text-lg font-semibold">Recent TFMs clear the tree baselines</h3>
              </div>
              <span className="rounded-full bg-[#dfeee7] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#2f8175]">higher Elo = better</span>
            </div>
            <div className="mt-7 grid gap-5">
              {scoreRows.map((row) => <BenchmarkJourneyBar key={row.model} row={row} maxElo={maxElo} />)}
            </div>
            <p className="mt-6 border-t border-[#1e2a35]/10 pt-4 text-[10px] leading-5 text-[#8a9295]">Reported regimes stay visible: TabPFN-3 and TabICLv2 are default checkpoints; CatBoost, XGBoost and Linear are tuned ensembles.</p>
          </div>

          <div className="surface-panel bg-[#1e2a35] p-5 text-[#f5f2ea]">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6c34a]">the takeaway</p>
            <p className="mt-4 font-serif text-3xl leading-[1.02]">Pretraining makes neural methods competitive on tables.</p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <JourneyMetric label="vs CatBoost" value={`+${(tabPfn3?.elo ?? 0) - (catBoost?.elo ?? 0)}`} />
              <JourneyMetric label="vs XGBoost" value={`+${(tabPfn3?.elo ?? 0) - (xgBoost?.elo ?? 0)}`} />
            </div>
            <p className="mt-6 border-t border-white/12 pt-4 text-xs leading-5 text-[#bbc4c4]">One caveat: a four-hour tuned AutoGluon extreme ensemble reaches 1695 Elo. The claim is about the changing baseline, not a universal win in every regime.</p>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

function BenchmarkJourneyBar({ row, maxElo }: { row: BenchmarkRow; maxElo: number }) {
  const isFoundationModel = row.family === 'TabPFN' || row.family === 'TabICL'
  const color = isFoundationModel ? '#2f8175' : row.family === 'Linear' ? '#3869a8' : '#c78924'
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold">{row.model}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a9295]">{row.regime} / {row.elo} Elo</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e8e5dc]"><motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${(row.elo / maxElo) * 100}%` }} transition={{ duration: 0.45 }} /></div>
    </div>
  )
}

function JourneyMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[10px] border border-white/12 bg-white/6 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#aeb8b8]">{label}</p><p className="mt-2 font-serif text-3xl text-[#f6c34a]">{value}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8f9b9c]">Elo</p></div>
}