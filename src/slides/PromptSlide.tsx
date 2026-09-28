import type { ReactNode } from 'react'
import { BlockMath } from 'react-katex'
import {
  ArrowRight,
  BrainCircuit,
  LockKeyhole,
  Table2,
} from 'lucide-react'
import { motion } from 'motion/react'
import { equations } from '../content/equations'
import type { TableRow } from '../types'
import { formatPercent, SlideFrame, Slider } from './shared'

export function PromptSlide({ rows, contextSize, setContextSize, probability, showHeldOutAnswer, setShowHeldOutAnswer }: { rows: TableRow[]; contextSize: number; setContextSize: (value: number) => void; probability: number; showHeldOutAnswer: boolean; setShowHeldOutAnswer: (value: boolean) => void }) {
  return (
    <SlideFrame number="01" kicker="The prompt / start with the analogy" tone="coral">
      <div className="slide-two-column">
        <div>
          <h1 className="slide-title">A table can be a <em>prompt.</em></h1>
          <p className="slide-lead">Large language models learn to continue a sequence after reading a context window. Tabular foundation models borrow the same shape of idea, but the “tokens” are structured rows and cells rather than words.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <AnalogyCard icon={<BrainCircuit size={18} />} title="LLM prompt" formula={equations.llmNextToken} text="The model reads the prompt tokens, then scores possible next tokens." tone="coral" />
            <AnalogyCard icon={<Table2 size={18} />} title="Tabular prompt" formula={equations.tableNextLabel} text="The model reads labeled rows plus a query row, then scores possible labels." tone="cobalt" />
          </div>
          <LlmPromptVisual />
        </div>
        <PromptWindow rows={rows} contextSize={contextSize} setContextSize={setContextSize} probability={probability} showHeldOutAnswer={showHeldOutAnswer} setShowHeldOutAnswer={setShowHeldOutAnswer} />
      </div>
    </SlideFrame>
  )
}

function LlmPromptVisual() {
  const promptTokens = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy']
  const nextTokens = [
    { token: 'dog', probability: 0.78, featured: true },
    { token: 'cat', probability: 0.09, featured: false },
    { token: 'rabbit', probability: 0.06, featured: false },
    { token: 'fox', probability: 0.04, featured: false },
    { token: 'car', probability: 0.03, featured: false },
  ]

  return (
    <div className="mt-5 rounded-[14px] bg-[#1e2a35] p-5 text-[#f5f2ea] shadow-[0_12px_30px_rgba(30,42,53,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6c34a]">LLM prompt</p>
          <p className="mt-1 text-sm font-semibold">The prompt tokens are fed into the model.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="LLM prompt tokens">
        {promptTokens.map((token, tokenIndex) => (
          <motion.span
            key={`${token}-${tokenIndex}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: tokenIndex * 0.04 }}
            className="rounded-[6px] border border-white/15 bg-white/10 px-2 py-1 font-mono text-[11px] text-[#f5f2ea]"
          >
            {token}
          </motion.span>
        ))}
      </div>
      <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] sm:items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#f6c34a]">
          <span>predict the next token</span>
          <ArrowRight size={15} />
        </div>
        <div className="space-y-2.5" aria-label="Next token probabilities">
          {nextTokens.map((candidate, candidateIndex) => (
            <div key={candidate.token} className="grid grid-cols-[52px_minmax(0,1fr)_36px] items-center gap-2 font-mono text-[10px]">
              <span className={candidate.featured ? 'font-semibold text-[#f6c34a]' : 'text-[#bbc4c4]'}>{candidate.token}</span>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div className={`h-full rounded-full ${candidate.featured ? 'bg-[#f6c34a]' : 'bg-[#8ba6c7]'}`} initial={{ width: 0 }} animate={{ width: `${candidate.probability * 100}%` }} transition={{ duration: 0.55, delay: 0.3 + candidateIndex * 0.08 }} />
              </div>
              <span className={candidate.featured ? 'text-right font-semibold text-[#f6c34a]' : 'text-right text-[#bbc4c4]'}>{formatPercent(candidate.probability)}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-[#bbc4c4]">The model scores the whole vocabulary; <span className="font-semibold text-[#f6c34a]">dog</span> is the most likely continuation.</p>
    </div>
  )
}

function PromptWindow({ rows, contextSize, setContextSize, probability, showHeldOutAnswer, setShowHeldOutAnswer }: { rows: TableRow[]; contextSize: number; setContextSize: (value: number) => void; probability: number; showHeldOutAnswer: boolean; setShowHeldOutAnswer: (value: boolean) => void }) {
  return <div className="surface-panel bg-[#fffdf8] shadow-[0_20px_60px_rgba(30,42,53,0.1)]">
    <div className="flex items-start justify-between gap-4 border-b border-[#1e2a35]/10 px-5 py-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64e3b]">Tabular prompt</p>
        <p className="mt-1 text-lg font-semibold">Will query policy claim?</p>
      </div>
    </div>
    <div className="overflow-x-auto px-5 py-4">
      <table className="min-w-[470px] w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-[#1e2a35]/10 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]">
            <th className="pb-3 pr-3 font-medium">role</th>
            <th className="pb-3 pr-3 font-medium">driver age</th>
            <th className="pb-3 pr-3 font-medium">vehicle age</th>
            <th className="pb-3 pr-3 font-medium">mileage</th>
            <th className="pb-3 font-medium">label</th>
          </tr>
        </thead>
        <tbody>{rows.slice(0, 8).map((row, index) => 
          <tr key={row.id} className={`border-b border-[#1e2a35]/7 ${index < contextSize ? 'text-[#1e2a35]' : 'text-[#abb1b1]'}`}>
            <td className="py-3 pr-3">
              <span className={`rounded-full px-2 py-1 font-mono text-[9px] ${index < contextSize ? 'bg-[#f8edc9] text-[#a36b13]' : 'bg-[#f0eee7] text-[#9aa0a0]'}`}>{index < contextSize ? 'context' : 'held out'}</span>
            </td>
            <td className="py-3 pr-3 font-mono">{row.driverAge}</td>
            <td className="py-3 pr-3 font-mono">{row.vehicleAge}y</td>
            <td className="py-3 pr-3 font-mono">{row.annualMiles}k</td>
            <td className={`py-3 font-mono font-semibold ${index < contextSize ? row.claim ? 'text-[#d64e3b]' : 'text-[#2f8175]' : 'text-[#abb1b1]'}`}>{index < contextSize ? row.claim ? 'yes' : 'no' : '—'}</td>
          </tr>)}
          <tr className="bg-[#e4edf8] text-[#3869a8]">
            <td className="py-3 pr-3">
              <span className="rounded-full bg-[#4775b3] px-2 py-1 font-mono text-[9px] font-semibold text-white">query</span>
            </td>
            <td className="py-3 pr-3 font-mono">39</td>
            <td className="py-3 pr-3 font-mono">8y</td>
            <td className="py-3 pr-3 font-mono">15k</td>
            <td className="py-3 font-mono font-semibold">{showHeldOutAnswer ? (probability > 0.5 ? 'yes' : 'no') : '?'}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="grid gap-5 border-t border-[#1e2a35]/10 px-5 py-5 sm:grid-cols-[1fr_170px] sm:items-end">
      <Slider label="context rows" value={contextSize} min={1} max={8} step={1} onChange={setContextSize} suffix={`${contextSize} rows`} hint="These labels are visible to the model." />
      <div>
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#74808a]">
          <span>Query output: P(claim)</span>
          <span className="text-[#d64e3b]">{formatPercent(probability)}</span>
        </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8e5dc]">
        <motion.div className="h-full rounded-full bg-[#d95b46]" animate={{ width: `${probability * 100}%` }} />
      </div>
      <button onClick={() => setShowHeldOutAnswer(!showHeldOutAnswer)} className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#3869a8] hover:underline">
        <LockKeyhole size={11} /> {showHeldOutAnswer ? 'hide label' : 'reveal label'}
      </button>
    </div>
  </div>
</div>
}

function AnalogyCard({ icon, title, formula, text, tone }: { icon: ReactNode; title: string; formula: string; text: string; tone: 'coral' | 'cobalt' }) {
  const color = tone === 'coral' ? '#d64e3b' : '#3869a8'
  const background = tone === 'coral' ? '#fbe4dc' : '#e4edf8'
  return <div className="rounded-[12px] border border-[#1e2a35]/10 bg-[#fffdf8] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ color, backgroundColor: background }}>{icon}</span>{title}</div><div className="mt-3 overflow-x-auto"><BlockMath math={formula} /></div><p className="text-xs leading-5 text-[#74808a]">{text}</p></div>
}