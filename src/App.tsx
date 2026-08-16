import { useEffect, useState } from 'react'
import { BlockMath } from 'react-katex'
import { scaleBand, scaleLinear } from 'd3-scale'
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CircleHelp,
  ExternalLink,
  Gauge,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Menu,
  Network,
  Scale,
  Table2,
  Target,
  Timer,
  Waypoints,
  X,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { claims } from './content/claims'
import { equations } from './content/equations'
import { paperById, papers } from './content/papers'
import {
  attentionForQuery,
  calibrationBuckets,
  expectedCost,
  heroProbability,
  makeAttentionCells,
  makePriorPoints,
  makeTableRows,
  quantileToDensity,
  scalingSnapshot,
  severityQuantiles,
  targetProbability,
  type PriorFamily,
} from './lib/simulations'
import type { Claim, PaperSource } from './types'

type Tone = 'coral' | 'cobalt' | 'mint' | 'yellow'
type ModelKey = 'TabPFN' | 'TabPFN-v2' | 'TabPFN-2.5' | 'TabICL' | 'TabICLv2' | 'TabPFN-3'
type ProbabilityMode = 'frequency' | 'severity'

const steps = [
  { id: 'start', label: 'The prompt' },
  { id: 'prior', label: 'The prior' },
  { id: 'icl', label: 'In-context' },
  { id: 'architectures', label: 'Architectures' },
  { id: 'probability', label: 'Probability' },
  { id: 'scaling', label: 'Scaling' },
  { id: 'evidence', label: 'Evidence' },
]

const modelProfiles: Record<ModelKey, { subtitle: string; steps: string[]; complexity: string; color: Tone; note: string }> = {
  TabPFN: {
    subtitle: 'Rows become tokens',
    steps: ['encode each row', 'train rows attend', 'test rows attend to train', 'class probabilities'],
    complexity: 'O(n^2)',
    color: 'coral',
    note: 'The original design makes the dataset itself the context. It is elegant for small tables, but the attention sequence grows with the number of rows.',
  },
  'TabPFN-v2': {
    subtitle: 'Cells with alternating attention',
    steps: ['group cells', 'feature attention', 'row attention', 'prediction head'],
    complexity: 'O(n^2m + nm^2)',
    color: 'yellow',
    note: 'The v2 lineage adds richer handling of mixed real-world columns, but keeps expensive interactions across both rows and features.',
  },
  'TabPFN-2.5': {
    subtitle: 'More depth, more deployment paths',
    steps: ['grouped cell embeddings', 'alternating attention', 'thinking rows', 'ICL or distilled model'],
    complexity: 'O(n^2m + nm^2)',
    color: 'coral',
    note: 'The report increases depth and feature grouping, then adds a practical off-ramp: distill the fitted context into an MLP or tree ensemble.',
  },
  TabICL: {
    subtitle: 'Compress first, reason second',
    steps: ['column-wise Set Transformer', 'row-wise aggregation', 'fixed row vectors', 'dataset-wise ICL'],
    complexity: 'O(n^2 + nm^2)',
    color: 'mint',
    note: 'TabICL collapses the feature dimension before the expensive dataset-wise context step. That makes longer tables a first-class target.',
  },
  TabICLv2: {
    subtitle: 'Long-context attention with distributions',
    steps: ['target-aware groups', 'QASSMax attention', 'row vectors', 'quantiles or classes'],
    complexity: 'O(n^2 + nm^2)',
    color: 'cobalt',
    note: 'TabICLv2 keeps the compression shape and adds a broader prior, long-context attention scaling, many-class handling, and quantile regression.',
  },
  'TabPFN-3': {
    subtitle: 'A million-row compression pipeline',
    steps: ['feature distribution embedding', 'row aggregation', 'QASSMax ICL', 'retrieval decoder + cache'],
    complexity: 'O(n^2 + nm)',
    color: 'cobalt',
    note: 'The technical report pushes compression, chunking, caching, and a non-parametric class decoder to make very large contexts operationally plausible.',
  },
}

const toneClasses: Record<Tone, { text: string; bg: string; border: string; fill: string }> = {
  coral: { text: 'text-[#d64e3b]', bg: 'bg-[#fbe4dc]', border: 'border-[#efb2a2]', fill: '#d95b46' },
  cobalt: { text: 'text-[#3869a8]', bg: 'bg-[#e4edf8]', border: 'border-[#a8c4e6]', fill: '#4775b3' },
  mint: { text: 'text-[#2f8175]', bg: 'bg-[#dfeee7]', border: 'border-[#a8d2c3]', fill: '#3e8d7e' },
  yellow: { text: 'text-[#a36b13]', bg: 'bg-[#f8edc9]', border: 'border-[#e2c679]', fill: '#c78924' },
}

const formatMoney = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`

function App() {
  const rows = makeTableRows()
  const [activeStep, setActiveStep] = useState('start')
  const [contextSize, setContextSize] = useState(3)
  const [priorFamily, setPriorFamily] = useState<PriorFamily>('SCM')
  const [smoothness, setSmoothness] = useState(0.62)
  const [priorNoise, setPriorNoise] = useState(0.22)
  const [iclSize, setIclSize] = useState(5)
  const [architecture, setArchitecture] = useState<ModelKey>('TabICL')
  const [architectureRows, setArchitectureRows] = useState(10000)
  const [probabilityMode, setProbabilityMode] = useState<ProbabilityMode>('frequency')
  const [driverAge, setDriverAge] = useState(39)
  const [vehicleAge, setVehicleAge] = useState(8)
  const [annualMiles, setAnnualMiles] = useState(15)
  const [urban, setUrban] = useState(true)
  const [severitySpread, setSeveritySpread] = useState(950)
  const [severityTail, setSeverityTail] = useState(430)
  const [scaleRows, setScaleRows] = useState(10000)
  const [scaleFeatures, setScaleFeatures] = useState(100)
  const [memory, setMemory] = useState(24)
  const [evidenceFilter, setEvidenceFilter] = useState('All')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const observed = steps
      .map((step) => document.getElementById(step.id))
      .filter((section): section is HTMLElement => Boolean(section))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]
        if (visible) setActiveStep(visible.target.id)
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0.05, 0.2, 0.5] },
    )
    observed.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileMenuOpen(false)
  }

  const heroRisk = heroProbability(rows, contextSize)
  const priorPoints = makePriorPoints({ family: priorFamily, smoothness, noise: priorNoise })
  const attentionCells = makeAttentionCells(iclSize)
  const queryAttention = attentionForQuery(iclSize)
  const chosenProbability = targetProbability(driverAge, vehicleAge, annualMiles, urban)
  const severityBase = 2900 + vehicleAge * 95 + annualMiles * 44 + (urban ? 240 : -130)
  const quantiles = severityQuantiles(severityBase, severitySpread, severityTail)
  const densityPoints = quantileToDensity(quantiles)
  const cost = expectedCost(chosenProbability, severityBase)
  const calibration = calibrationBuckets(chosenProbability)
  const scale = scalingSnapshot(scaleRows, scaleFeatures)
  const filteredClaims = claims.filter((claim) => evidenceFilter === 'All' || claim.family === evidenceFilter || claim.kind === evidenceFilter)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f2ea] text-[#1e2a35]">
      <SiteHeader activeStep={activeStep} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} jumpTo={jumpTo} />
      <main>
        <HeroSection rows={rows} contextSize={contextSize} setContextSize={setContextSize} heroRisk={heroRisk} jumpTo={jumpTo} />
        <PriorSection
          family={priorFamily}
          setFamily={setPriorFamily}
          smoothness={smoothness}
          setSmoothness={setSmoothness}
          noise={priorNoise}
          setNoise={setPriorNoise}
          points={priorPoints}
        />
        <IclSection size={iclSize} setSize={setIclSize} cells={attentionCells} queryAttention={queryAttention} />
        <ArchitectureSection model={architecture} setModel={setArchitecture} rows={architectureRows} setRows={setArchitectureRows} />
        <ProbabilitySection
          mode={probabilityMode}
          setMode={setProbabilityMode}
          driverAge={driverAge}
          setDriverAge={setDriverAge}
          vehicleAge={vehicleAge}
          setVehicleAge={setVehicleAge}
          annualMiles={annualMiles}
          setAnnualMiles={setAnnualMiles}
          urban={urban}
          setUrban={setUrban}
          spread={severitySpread}
          setSpread={setSeveritySpread}
          tail={severityTail}
          setTail={setSeverityTail}
          probability={chosenProbability}
          baseSeverity={severityBase}
          quantiles={quantiles}
          densityPoints={densityPoints}
          cost={cost}
          calibration={calibration}
        />
        <ScalingSection rows={scaleRows} setRows={setScaleRows} features={scaleFeatures} setFeatures={setScaleFeatures} memory={memory} setMemory={setMemory} scale={scale} />
        <EvidenceSection filter={evidenceFilter} setFilter={setEvidenceFilter} claims={filteredClaims} />
      </main>
      <Footer jumpTo={jumpTo} />
    </div>
  )
}

function SiteHeader({ activeStep, mobileMenuOpen, setMobileMenuOpen, jumpTo }: { activeStep: string; mobileMenuOpen: boolean; setMobileMenuOpen: (value: boolean) => void; jumpTo: (id: string) => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1e2a35]/10 bg-[#f5f2ea]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
        <button className="group flex items-center gap-3 text-left" onClick={() => jumpTo('start')} aria-label="Go to the beginning">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1e2a35] text-[#f5f2ea] transition-transform group-hover:-rotate-6">
            <Table2 size={18} strokeWidth={1.8} />
          </span>
          <span>
            <span className="block font-serif text-lg leading-none">Table Sense</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-[#74808a]">TFM learning lab</span>
          </span>
        </button>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Lesson sections">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => jumpTo(step.id)}
              className={`group flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${activeStep === step.id ? 'bg-[#1e2a35] text-[#f5f2ea]' : 'text-[#74808a] hover:bg-[#e7e1d5] hover:text-[#1e2a35]'}`}
            >
              <span className={`font-mono text-[10px] ${activeStep === step.id ? 'text-[#f6c34a]' : 'text-[#a4a9aa]'}`}>{String(index + 1).padStart(2, '0')}</span>
              {step.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-[#1e2a35]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#74808a] sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3e8d7e]" />
            browser simulation
          </span>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1e2a35]/15 text-[#1e2a35] lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close lesson menu' : 'Open lesson menu'}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-[#1e2a35]/10 px-5 pb-4 lg:hidden" aria-label="Mobile lesson sections">
            <div className="grid gap-1 pt-3">
              {steps.map((step, index) => (
                <button key={step.id} onClick={() => jumpTo(step.id)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#53606a] hover:bg-[#e7e1d5]">
                  <span className="font-mono text-[10px] text-[#d64e3b]">{String(index + 1).padStart(2, '0')}</span>
                  {step.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

function HeroSection({ rows, contextSize, setContextSize, heroRisk, jumpTo }: { rows: ReturnType<typeof makeTableRows>; contextSize: number; setContextSize: (value: number) => void; heroRisk: number; jumpTo: (id: string) => void }) {
  return (
    <section id="start" className="relative scroll-mt-24 overflow-hidden border-b border-[#1e2a35]/10">
      <div className="absolute inset-0 dot-grid opacity-60" />
      <div className="relative mx-auto grid max-w-[1440px] gap-14 px-5 pb-24 pt-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-28">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <SectionLabel number="01" kicker="Start here / the central shift" tone="coral" />
          <h1 className="mt-7 max-w-3xl font-serif text-[clamp(3.8rem,8vw,8.2rem)] leading-[0.88] tracking-[-0.055em]">
            The table
            <br />
            is the <em className="font-serif not-italic text-[#d64e3b]">prompt.</em>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#53606a] lg:text-xl">
            Tabular foundation models learn a general prediction procedure before they meet your data. At inference time, your labeled rows become context, and the unlabeled row becomes a question.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button onClick={() => jumpTo('prior')} className="inline-flex items-center gap-2 rounded-full bg-[#1e2a35] px-5 py-3 text-sm font-semibold text-[#f5f2ea] transition-transform hover:-translate-y-0.5">
              Follow the signal <ArrowDownRight size={16} />
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#74808a]">No gradients on this table</span>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-[#1e2a35]/15 pt-5">
            <Stat value="1" label="forward pass" />
            <Stat value="0" label="fresh fit" />
            <Stat value="∞" label="possible priors" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.12 }}>
          <ContextTable rows={rows} contextSize={contextSize} setContextSize={setContextSize} probability={heroRisk} />
        </motion.div>
      </div>
    </section>
  )
}

function ContextTable({ rows, contextSize, setContextSize, probability }: { rows: ReturnType<typeof makeTableRows>; contextSize: number; setContextSize: (value: number) => void; probability: number }) {
  return (
    <div className="surface-panel relative overflow-hidden bg-[#fffdf8] shadow-[0_24px_60px_rgba(30,42,53,0.1)]">
      <div className="flex items-center justify-between border-b border-[#1e2a35]/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]"><span className="h-2 w-2 rounded-full bg-[#3e8d7e]" /> live context window</div>
          <p className="mt-1 text-sm font-semibold text-[#1e2a35]">Will this policyholder claim?</p>
        </div>
        <span className="rounded-full bg-[#dfeee7] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#2f8175]">query / Q-09</span>
      </div>
      <div className="overflow-x-auto px-5 py-5">
        <table className="min-w-[540px] w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e2a35]/10 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a9295]">
              <th className="pb-3 pr-3 font-medium">context</th>
              <th className="pb-3 pr-3 font-medium">driver age</th>
              <th className="pb-3 pr-3 font-medium">vehicle</th>
              <th className="pb-3 pr-3 font-medium">miles / yr</th>
              <th className="pb-3 font-medium">claim?</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((row, index) => {
              const active = index < contextSize
              return (
                <tr key={row.id} className={`border-b border-[#1e2a35]/7 transition-colors ${active ? 'text-[#1e2a35]' : 'text-[#aeb3b3]'}`}>
                  <td className="py-3 pr-3"><span className={`inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] ${active ? 'bg-[#f8edc9] text-[#a36b13]' : 'bg-[#f0eee7] text-[#9aa0a0]'}`}>{row.id.slice(0, 1).toUpperCase()}</span></td>
                  <td className="py-3 pr-3 font-mono">{row.driverAge}</td>
                  <td className="py-3 pr-3 font-mono">{row.vehicleAge} yrs</td>
                  <td className="py-3 pr-3 font-mono">{row.annualMiles}k</td>
                  <td className="py-3"><span className={`font-mono font-semibold ${active ? row.claim ? 'text-[#d64e3b]' : 'text-[#2f8175]' : 'text-[#aeb3b3]'}`}>{active ? row.claim ? 'yes' : 'no' : 'held out'}</span></td>
                </tr>
              )
            })}
            <tr className="bg-[#e4edf8] text-[#3869a8]">
              <td className="py-3 pl-2 pr-3"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4775b3] font-mono text-[9px] font-semibold text-white">Q</span></td>
              <td className="py-3 pr-3 font-mono">39</td>
              <td className="py-3 pr-3 font-mono">8 yrs</td>
              <td className="py-3 pr-3 font-mono">15k</td>
              <td className="py-3 font-mono font-semibold">?</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid gap-5 border-t border-[#1e2a35]/10 px-5 py-5 sm:grid-cols-[1fr_180px] sm:items-end">
        <RangeControl label="How much context reaches the model?" value={contextSize} min={1} max={6} step={1} onChange={setContextSize} suffix={`${contextSize} rows`} hint="More context can sharpen the local pattern, but it also changes the evidence available to the query." />
        <ProbabilityBar label="posterior class" value={probability} color="#d64e3b" />
      </div>
    </div>
  )
}

function PriorSection({ family, setFamily, smoothness, setSmoothness, noise, setNoise, points }: { family: PriorFamily; setFamily: (value: PriorFamily) => void; smoothness: number; setSmoothness: (value: number) => void; noise: number; setNoise: (value: number) => void; points: ReturnType<typeof makePriorPoints> }) {
  return (
    <section id="prior" className="section-band scroll-mt-24 bg-[#1e2a35] text-[#f5f2ea]">
      <div className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32">
        <SectionLabel number="02" kicker="Before the table / prior design" tone="yellow" invert />
        <div className="mt-8 grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <h2 className="max-w-xl font-serif text-5xl leading-[0.96] tracking-[-0.04em] md:text-7xl">Every prediction starts with a guess about the world.</h2>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#bbc4c4]">A prior is not a single rule. It is a distribution over plausible data-generating mechanisms. TabPFN-style models learn to average those mechanisms after seeing the labeled rows.</p>
            <div className="mt-8 border-l-2 border-[#f6c34a] pl-5 text-sm leading-6 text-[#e6ddc9]">The prior is the model&apos;s inductive bias. It is not evidence that your real portfolio was literally generated by one known causal graph.</div>
            <div className="mt-10 rounded-[14px] border border-white/12 bg-white/6 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6c34a]">posterior predictive idea</p>
              <div className="mt-4 overflow-x-auto text-[#f5f2ea]"><BlockMath math={equations.posteriorPredictive} /></div>
              <p className="mt-3 text-xs leading-5 text-[#aeb8b8]">The model does not need to identify one true mechanism. It can combine many mechanisms, weighted by how well they explain the context.</p>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="rounded-[14px] border border-white/12 bg-[#263640] p-5">
              <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#bbc4c4]">prior controls</span><Network size={16} className="text-[#f6c34a]" /></div>
              <p className="mt-3 text-sm leading-6 text-[#d6dddd]">Change the mechanisms, then watch the kind of boundary the model is prepared to trust.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(['SCM', 'Tree', 'Mixture'] as PriorFamily[]).map((option) => (
                  <button key={option} onClick={() => setFamily(option)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${family === option ? 'border-[#f6c34a] bg-[#f6c34a] text-[#1e2a35]' : 'border-white/15 text-[#d6dddd] hover:border-white/35'}`}>{option === 'SCM' ? 'causal graph' : option === 'Tree' ? 'tree-like' : 'mixed prior'}</button>
                ))}
              </div>
              <div className="mt-7 grid gap-6">
                <RangeControl dark label="smoothness" value={smoothness} min={0.05} max={0.95} step={0.01} onChange={setSmoothness} suffix={smoothness.toFixed(2)} hint="Higher values prefer gentler changes." />
                <RangeControl dark label="observation noise" value={noise} min={0} max={0.65} step={0.01} onChange={setNoise} suffix={noise.toFixed(2)} hint="More noise makes the same context less decisive." />
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-[#bbc4c4]"><Lightbulb size={15} className="text-[#f6c34a]" /> Try a tree-like prior: its edges become more axis-aligned.</div>
            </div>
            <PriorScatter points={points} family={family} />
          </div>
        </div>
      </div>
    </section>
  )
}

function PriorScatter({ points, family }: { points: ReturnType<typeof makePriorPoints>; family: PriorFamily }) {
  const xScale = scaleLinear().domain([-1, 1]).range([28, 322])
  const yScale = scaleLinear().domain([-1, 1]).range([218, 22])
  return (
    <div className="rounded-[14px] bg-[#fffdf8] p-5 text-[#1e2a35]">
      <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">synthetic task sampler</p><p className="mt-1 text-sm font-semibold">One possible dataset from the {family.toLowerCase()} family</p></div><span className="rounded-full bg-[#fbe4dc] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#d64e3b]">conceptual</span></div>
      <svg className="mt-5 h-auto w-full" viewBox="0 0 350 250" role="img" aria-label={`Synthetic data scatter plot from the ${family} prior`}>
        <title>Synthetic data generated from a {family} prior</title>
        <rect x="0" y="0" width="350" height="250" rx="10" fill="#f3f0e7" />
        <line x1="28" x2="322" y1="120" y2="120" stroke="#d8d5cc" strokeWidth="1" />
        <line x1="175" x2="175" y1="22" y2="218" stroke="#d8d5cc" strokeWidth="1" />
        <path d={family === 'Tree' ? 'M 36 174 L 124 174 L 124 112 L 218 112 L 218 75 L 318 75' : family === 'SCM' ? 'M 34 170 C 95 158 118 128 170 126 C 218 124 250 87 316 68' : 'M 34 168 C 86 160 107 138 148 130 C 200 120 239 95 316 72'} fill="none" stroke="#1e2a35" strokeWidth="2.5" strokeDasharray={family === 'Tree' ? undefined : '5 5'} opacity="0.52" />
        {points.map((point, index) => <circle key={`${point.x}-${point.y}-${index}`} cx={xScale(point.x)} cy={yScale(point.y)} r="4.2" fill={point.label ? '#d95b46' : '#3e8d7e'} stroke="#fffdf8" strokeWidth="1.3" opacity="0.9" />)}
        <text x="28" y="239" fill="#8a9295" fontSize="9" fontFamily="DM Mono">feature 1</text>
        <text x="13" y="28" fill="#8a9295" fontSize="9" fontFamily="DM Mono" transform="rotate(-90 13 28)">feature 2</text>
      </svg>
      <div className="mt-4 flex gap-5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#74808a]"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#d95b46]" /> class 1</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#3e8d7e]" /> class 0</span></div>
    </div>
  )
}

function IclSection({ size, setSize, cells, queryAttention }: { size: number; setSize: (value: number) => void; cells: ReturnType<typeof makeAttentionCells>; queryAttention: number[] }) {
  return (
    <section id="icl" className="section-band scroll-mt-24 border-b border-[#1e2a35]/10 bg-[#f5f2ea]">
      <div className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <SectionLabel number="03" kicker="At inference / no fresh fit" tone="mint" />
            <h2 className="mt-7 max-w-xl font-serif text-5xl leading-[0.96] tracking-[-0.04em] md:text-7xl">The model reads your rows like a tiny case file.</h2>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#53606a]">In-context learning means the labeled training set sits inside the input. The weights stay fixed. Attention is the mechanism that lets a query compare itself with the context.</p>
            <div className="mt-8 rounded-[14px] border border-[#1e2a35]/12 bg-[#fffdf8] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f8175]">masking rule</p><p className="mt-3 text-sm leading-6 text-[#53606a]">Training rows may look across the training set. A test row can look back to training rows, but never at another test label.</p><div className="mt-4 overflow-x-auto"><BlockMath math={equations.attention} /></div></div>
          </div>
          <div className="surface-panel bg-[#fffdf8]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1e2a35]/10 px-5 py-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">attention lab / query focus</p><p className="mt-1 text-lg font-semibold">Who gets heard by row Q?</p></div><span className="rounded-full bg-[#dfeee7] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#2f8175]">no gradient step</span></div>
            <div className="grid gap-8 p-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div><RangeControl label="context rows" value={size} min={3} max={7} step={1} onChange={setSize} suffix={`${size} rows`} hint="The query gets a new prompt each time this changes." /><AttentionHeatmap size={size} cells={cells} /></div>
              <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">query attention weights</p><div className="mt-4 grid gap-3">{queryAttention.map((weight, index) => <div key={index} className="flex items-center gap-3"><span className="w-8 font-mono text-[10px] text-[#8a9295]">r{index + 1}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e8e5dc]"><motion.div className="h-full rounded-full bg-[#4775b3]" animate={{ width: `${weight * 100}%` }} transition={{ duration: 0.35 }} /></div><span className="w-10 text-right font-mono text-[10px] text-[#3869a8]">{Math.round(weight * 100)}%</span></div>)}</div><div className="mt-7 border-t border-[#1e2a35]/10 pt-5"><p className="text-sm leading-6 text-[#53606a]">The strongest signal is not necessarily the nearest row. It is the row whose representation makes the query most plausible under the learned prior.</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AttentionHeatmap({ size, cells }: { size: number; cells: ReturnType<typeof makeAttentionCells> }) {
  const band = scaleBand<number>().domain(Array.from({ length: size }, (_, index) => index)).range([30, 270]).padding(0.08)
  return <svg className="mt-7 h-auto w-full max-w-[340px]" viewBox="0 0 340 320" role="img" aria-label="Attention heatmap showing row-to-row context connections"><title>Training rows attend across the context</title><text x="30" y="16" fill="#8a9295" fontSize="9" fontFamily="DM Mono">keys / context rows</text><text x="8" y="290" fill="#8a9295" fontSize="9" fontFamily="DM Mono" transform="rotate(-90 8 290)">queries</text>{cells.map((cell) => <rect key={`${cell.row}-${cell.column}`} x={band(cell.column) ?? 0} y={(band(cell.row) ?? 0) + 20} width={band.bandwidth()} height={band.bandwidth()} rx="3" fill={cell.row === size - 1 ? '#4775b3' : '#3e8d7e'} opacity={0.1 + cell.value * 1.8} />)}{Array.from({ length: size }, (_, index) => <g key={index}><text x={(band(index) ?? 0) + band.bandwidth() / 2} y="300" textAnchor="middle" fill="#8a9295" fontSize="9" fontFamily="DM Mono">r{index + 1}</text><text x="20" y={(band(index) ?? 0) + 20 + band.bandwidth() / 2 + 3} textAnchor="middle" fill="#8a9295" fontSize="9" fontFamily="DM Mono">r{index + 1}</text></g>)}</svg>
}

function ArchitectureSection({ model, setModel, rows, setRows }: { model: ModelKey; setModel: (value: ModelKey) => void; rows: number; setRows: (value: number) => void }) {
  const profile = modelProfiles[model]
  const tone = toneClasses[profile.color]
  const chartScale = scaleLinear().domain([0, Math.max(1, scalingSnapshot(rows, 100).classic)]).range([0, 180])
  const classic = chartScale(scalingSnapshot(rows, 100).classic)
  const compressed = chartScale(scalingSnapshot(rows, 100).compressed)
  return (
    <section id="architectures" className="section-band scroll-mt-24 bg-[#ebe7dc]">
      <div className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32">
        <SectionLabel number="04" kicker="Two families / one idea" tone="cobalt" />
        <div className="mt-7 flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><h2 className="max-w-3xl font-serif text-5xl leading-[0.96] tracking-[-0.04em] md:text-7xl">Same promise. Different places to spend compute.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-[#53606a]">The lineage splits around one design question: do we let attention see every cell for longer, or compress the table before the expensive in-context step?</p></div><div className="flex items-center gap-2 rounded-full border border-[#1e2a35]/15 bg-[#f5f2ea] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#74808a]"><Waypoints size={14} className="text-[#4775b3]" /> explore the paths</div></div>
        <div className="mt-12 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Model architecture families">{(Object.keys(modelProfiles) as ModelKey[]).map((key) => <button key={key} role="tab" aria-selected={model === key} onClick={() => setModel(key)} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors ${model === key ? `${tone.bg} ${tone.border} ${tone.text}` : 'border-[#1e2a35]/12 bg-[#f5f2ea] text-[#74808a] hover:text-[#1e2a35]'}`}>{key}</button>)}</div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="surface-panel overflow-hidden bg-[#fffdf8]">
            <div className="flex items-start justify-between gap-4 border-b border-[#1e2a35]/10 px-5 py-5"><div><p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${tone.text}`}>{profile.subtitle}</p><p className="mt-1 text-lg font-semibold">{model} data path</p></div><span className={`rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold ${tone.bg} ${tone.text}`}>{profile.complexity}</span></div>
            <div className="relative px-5 py-8"><div className="absolute left-14 right-14 top-[76px] hidden h-px bg-[#1e2a35]/15 sm:block" /> <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">{profile.steps.map((step, index) => <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative z-10"><div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] border ${tone.border} ${tone.bg} ${tone.text}`}>{index === 0 ? <Layers3 size={21} /> : index === profile.steps.length - 1 ? <Target size={21} /> : <ArrowUpRight size={20} />}</div><p className="mt-4 text-center text-xs font-semibold leading-5 text-[#53606a]">{step}</p><p className="mt-1 text-center font-mono text-[9px] text-[#9ca3a3]">stage {index + 1}</p></motion.div>)}</div></div>
            <div className="border-t border-[#1e2a35]/10 bg-[#f8f6ef] px-5 py-5"><p className="text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#1e2a35]">What changes here?</span> {profile.note}</p></div>
          </div>
          <div className="surface-panel bg-[#1e2a35] text-[#f5f2ea]"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#bbc4c4]">compute sketch</p><Gauge size={17} className="text-[#f6c34a]" /></div><p className="mt-3 text-sm leading-6 text-[#d6dddd]">As rows grow, compressing the feature axis changes the shape of the bottleneck.</p><RangeControl dark label="training rows" value={rows} min={500} max={50000} step={500} onChange={setRows} suffix={rows.toLocaleString()} hint="Relative curve; not a hardware timing." />
            <div className="mt-7 space-y-5"><ComputeBar label="alternating cell attention" value={classic} color="#d95b46" /><ComputeBar label="compress then ICL" value={compressed} color="#3e8d7e" /><ComputeBar label="row-only ICL" value={Math.min(180, compressed * 0.62)} color="#f6c34a" /></div><div className="mt-7 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8f9b9c]">n = rows / m = features</div></div>
        </div>
      </div>
    </section>
  )
}

function ProbabilitySection({ mode, setMode, driverAge, setDriverAge, vehicleAge, setVehicleAge, annualMiles, setAnnualMiles, urban, setUrban, spread, setSpread, tail, setTail, probability, baseSeverity, quantiles, densityPoints, cost, calibration }: { mode: ProbabilityMode; setMode: (value: ProbabilityMode) => void; driverAge: number; setDriverAge: (value: number) => void; vehicleAge: number; setVehicleAge: (value: number) => void; annualMiles: number; setAnnualMiles: (value: number) => void; urban: boolean; setUrban: (value: boolean) => void; spread: number; setSpread: (value: number) => void; tail: number; setTail: (value: number) => void; probability: number; baseSeverity: number; quantiles: number[]; densityPoints: { x: number; y: number }[]; cost: number; calibration: { predicted: number; observed: number }[] }) {
  return (
    <section id="probability" className="section-band scroll-mt-24 border-b border-[#1e2a35]/10 bg-[#fffdf8]">
      <div className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start"><div><SectionLabel number="05" kicker="Actuary&apos;s probability lab" tone="coral" /><h2 className="mt-7 max-w-xl font-serif text-5xl leading-[0.96] tracking-[-0.04em] md:text-7xl">A probability is a decision input, not a verdict.</h2><p className="mt-7 max-w-lg text-base leading-7 text-[#53606a]">Try the same foundation-model ideas on a synthetic claims workflow. Frequency asks whether a claim occurs. Severity asks how large the positive claim might be. The uncertainty is part of the output.</p><div className="mt-8 rounded-[14px] border border-[#efb2a2] bg-[#fbe4dc] p-5"><div className="flex gap-3"><Scale size={18} className="mt-0.5 shrink-0 text-[#d64e3b]" /><div><p className="text-sm font-semibold text-[#7b3328]">Educational model only</p><p className="mt-1 text-xs leading-5 text-[#8a4d43]">The data is synthetic. The frequency-times-severity decomposition is illustrative and does not assume independence, solve pricing, or replace actuarial governance.</p></div></div></div><div className="mt-8 overflow-x-auto"><BlockMath math={equations.actuarialCost} /></div></div>
          <div className="surface-panel bg-[#f5f2ea]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2a35]/10 px-5 py-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">synthetic policy laboratory</p><p className="mt-1 text-lg font-semibold">One row, two uncertainty questions</p></div><div className="flex rounded-full border border-[#1e2a35]/12 bg-[#fffdf8] p-1" role="tablist" aria-label="Claims view">{(['frequency', 'severity'] as ProbabilityMode[]).map((option) => <button key={option} onClick={() => setMode(option)} className={`rounded-full px-3 py-2 text-xs font-semibold capitalize transition-colors ${mode === option ? 'bg-[#1e2a35] text-[#f5f2ea]' : 'text-[#74808a]'}`}>{option}</button>)}</div></div>
            <div className="grid gap-8 p-5 lg:grid-cols-[0.72fr_1.28fr]"><div className="grid content-start gap-5"><RangeControl label="driver age" value={driverAge} min={18} max={78} step={1} onChange={setDriverAge} suffix={`${driverAge}`} /><RangeControl label="vehicle age" value={vehicleAge} min={0} max={18} step={1} onChange={setVehicleAge} suffix={`${vehicleAge} yrs`} /><RangeControl label="annual distance" value={annualMiles} min={2} max={35} step={1} onChange={setAnnualMiles} suffix={`${annualMiles}k`} /><button onClick={() => setUrban(!urban)} className={`flex items-center justify-between rounded-[10px] border px-3 py-3 text-left text-xs font-semibold transition-colors ${urban ? 'border-[#a8c4e6] bg-[#e4edf8] text-[#3869a8]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a]'}`}><span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${urban ? 'bg-[#4775b3]' : 'bg-[#adb3b3]'}`} /> urban exposure</span><span className="font-mono text-[10px] uppercase">{urban ? 'on' : 'off'}</span></button>{mode === 'severity' && <><RangeControl label="spread" value={spread} min={300} max={1800} step={25} onChange={setSpread} suffix={formatMoney(spread)} /><RangeControl label="tail lift" value={tail} min={0} max={900} step={25} onChange={setTail} suffix={formatMoney(tail)} /></>}</div><div><AnimatePresence mode="wait"><motion.div key={mode} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }}>{mode === 'frequency' ? <FrequencyView probability={probability} calibration={calibration} /> : <SeverityView baseSeverity={baseSeverity} quantiles={quantiles} densityPoints={densityPoints} />}</motion.div></AnimatePresence><div className="mt-7 grid gap-3 sm:grid-cols-3"><MetricTile label="claim probability" value={`${Math.round(probability * 100)}%`} tone="coral" /><MetricTile label="expected severity" value={formatMoney(baseSeverity)} tone="yellow" /><MetricTile label="expected cost" value={formatMoney(cost)} tone="cobalt" /></div></div></div></div>
        </div>
      </div>
    </section>
  )
}

function FrequencyView({ probability, calibration }: { probability: number; calibration: { predicted: number; observed: number }[] }) {
  const xScale = scaleBand<number>().domain([0, 1, 2, 3, 4]).range([34, 300]).padding(0.32)
  const yScale = scaleLinear().domain([0, 1]).range([160, 20])
  return <div><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#74808a]">frequency posterior</p><p className="mt-2 font-serif text-6xl leading-none text-[#d64e3b]">{Math.round(probability * 100)}<span className="text-3xl">%</span></p><p className="mt-2 text-sm text-[#53606a]">estimated chance of at least one claim</p></div><div className="rounded-[10px] bg-[#fbe4dc] p-3 text-right"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a4d43]">Brier-like check</p><p className="mt-1 font-mono text-lg font-semibold text-[#7b3328]">{(0.18 - probability * 0.05).toFixed(2)}</p></div></div><div className="mt-7 rounded-[12px] bg-[#fffdf8] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#74808a]">calibration sketch</p><svg className="mt-3 h-auto w-full" viewBox="0 0 340 188" role="img" aria-label="Predicted versus observed calibration sketch"><title>Predicted versus observed probabilities</title><line x1="34" y1="160" x2="300" y2="20" stroke="#c8c6bd" strokeDasharray="4 5" /><line x1="34" y1="160" x2="300" y2="160" stroke="#d9d6cc" /><line x1="34" y1="160" x2="34" y2="20" stroke="#d9d6cc" />{calibration.map((bucket, index) => <g key={index}><rect x={xScale(index)} y={yScale(bucket.predicted)} width={xScale.bandwidth()} height={160 - yScale(bucket.predicted)} rx="4" fill="#4775b3" opacity="0.74" /><circle cx={(xScale(index) ?? 0) + xScale.bandwidth() / 2} cy={yScale(bucket.observed)} r="4" fill="#d95b46" /></g>)}<text x="34" y="178" fill="#8a9295" fontSize="9" fontFamily="DM Mono">low predicted</text><text x="226" y="178" fill="#8a9295" fontSize="9" fontFamily="DM Mono">high predicted</text></svg><div className="mt-3 flex gap-4 font-mono text-[9px] uppercase tracking-[0.08em] text-[#74808a]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#4775b3]" /> predicted</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d95b46]" /> observed</span></div></div></div>
}

function SeverityView({ baseSeverity, quantiles, densityPoints }: { baseSeverity: number; quantiles: number[]; densityPoints: { x: number; y: number }[] }) {
  const xScale = scaleLinear().domain([Math.min(...quantiles) - 300, Math.max(...quantiles) + 300]).range([30, 310])
  const points = densityPoints.map((point, index) => `${xScale(quantiles[index])},${130 - point.y}`).join(' ')
  return <div><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#74808a]">conditional severity distribution</p><p className="mt-2 font-serif text-5xl leading-none text-[#a36b13]">{formatMoney(baseSeverity)}</p><p className="mt-2 text-sm text-[#53606a]">central estimate, given a positive claim</p></div><div className="rounded-[10px] bg-[#f8edc9] p-3 text-right"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8b661c]">distribution</p><p className="mt-1 font-mono text-lg font-semibold text-[#8b661c]">7 quantiles</p></div></div><div className="mt-7 rounded-[12px] bg-[#fffdf8] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#74808a]">quantile ribbon</p><svg className="mt-3 h-auto w-full" viewBox="0 0 340 180" role="img" aria-label="Synthetic conditional severity quantiles"><title>Conditional severity quantile curve</title><line x1="30" y1="130" x2="310" y2="130" stroke="#d9d6cc" /><polyline points={points} fill="none" stroke="#c78924" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{quantiles.map((value, index) => <g key={index}><circle cx={xScale(value)} cy={130 - densityPoints[index].y} r="4.5" fill="#c78924" stroke="#fffdf8" strokeWidth="1.5" /><text x={xScale(value)} y={156} textAnchor="middle" fill="#8a9295" fontSize="8" fontFamily="DM Mono">{[5, 15, 25, 50, 75, 85, 95][index]}%</text></g>)}<text x="30" y="18" fill="#8a9295" fontSize="9" fontFamily="DM Mono">low severity</text><text x="242" y="18" fill="#8a9295" fontSize="9" fontFamily="DM Mono">tail severity</text></svg><p className="mt-2 text-xs leading-5 text-[#74808a]">A point forecast hides the shape of the risk. Quantiles make asymmetry and tail assumptions visible.</p></div></div>
}

function ScalingSection({ rows, setRows, features, setFeatures, memory, setMemory, scale }: { rows: number; setRows: (value: number) => void; features: number; setFeatures: (value: number) => void; memory: number; setMemory: (value: number) => void; scale: ReturnType<typeof scalingSnapshot> }) {
  const maximum = Math.max(scale.classicMemory, scale.compressedMemory, 1)
  return (
    <section id="scaling" className="section-band scroll-mt-24 bg-[#dfeee7]">
      <div className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32"><div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"><div><SectionLabel number="06" kicker="The practical frontier / scaling" tone="mint" /><h2 className="mt-7 max-w-xl font-serif text-5xl leading-[0.96] tracking-[-0.04em] md:text-7xl">The trick is knowing what to compress, cache, or carry.</h2><p className="mt-7 max-w-lg text-base leading-7 text-[#53606a]">Attention is expressive, but context is expensive. The later papers move the bottleneck: compress cells into row vectors, sharpen attention for long contexts, stream rows in chunks, and cache what does not change.</p><div className="mt-8 grid gap-3"><DeployStep icon={<Zap size={16} />} title="cold fit + predict" body="Build context and answer the query in one pass." tone="coral" /><DeployStep icon={<LockKeyhole size={16} />} title="KV cache" body="Keep the training-side keys and values for repeated predictions." tone="cobalt" /><DeployStep icon={<Timer size={16} />} title="distill" body="Trade a general context engine for a dataset-specific fast model." tone="yellow" /></div></div><div className="surface-panel bg-[#fffdf8]"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1e2a35]/10 px-5 py-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f8175]">resource sketch</p><p className="mt-1 text-lg font-semibold">Move the bottleneck around</p></div><span className="rounded-full bg-[#dfeee7] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#2f8175]">conceptual curves</span></div><div className="grid gap-6 p-5 sm:grid-cols-3"><RangeControl label="rows" value={rows} min={500} max={100000} step={500} onChange={setRows} suffix={rows.toLocaleString()} /><RangeControl label="features" value={features} min={10} max={500} step={10} onChange={setFeatures} suffix={`${features}`} /><RangeControl label="GPU memory" value={memory} min={8} max={80} step={1} onChange={setMemory} suffix={`${memory} GB`} /></div><div className="grid gap-8 border-t border-[#1e2a35]/10 p-5 lg:grid-cols-[1fr_0.72fr]"><div><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#74808a]">relative work</p><div className="mt-5 space-y-5"><ComputeBar label="classic alternating attention" value={(scale.classic / Math.max(scale.classic, 1)) * 180} color="#d95b46" /><ComputeBar label="compressed row embeddings" value={(scale.compressed / Math.max(scale.classic, 1)) * 180} color="#3e8d7e" /><ComputeBar label="row-only context stage" value={(scale.rowOnly / Math.max(scale.classic, 1)) * 180} color="#4775b3" /></div><div className="mt-7 rounded-[10px] bg-[#f5f2ea] p-4 font-mono text-[10px] leading-5 text-[#53606a]">At {rows.toLocaleString()} rows x {features} features, the compressed path is carrying {Math.round((scale.compressed / Math.max(scale.classic, 0.01)) * 100)}% of the classic sketch.</div></div><div><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#74808a]">memory fit</p><div className="mt-5 h-40 rounded-[10px] bg-[#f5f2ea] p-4"><div className="flex h-full items-end gap-5"><MemoryColumn label="classic" value={scale.classicMemory} max={maximum} color="#d95b46" /><MemoryColumn label="compressed" value={scale.compressedMemory} max={maximum} color="#3e8d7e" /><MemoryColumn label="available" value={memory / 24} max={maximum} color="#4775b3" /></div></div><p className="mt-4 text-xs leading-5 text-[#74808a]">This is an explanatory ratio, not a promise about a particular GPU. Actual memory depends on model width, batching, kernels, and caching.</p></div></div></div></div></div>
    </section>
  )
}

function EvidenceSection({ filter, setFilter, claims: filteredClaims }: { filter: string; setFilter: (value: string) => void; claims: Claim[] }) {
  const filters = ['All', 'paper-result', 'method', 'limitation', 'TabPFN', 'TabICL', 'TabICLv2', 'TabPFN-2.5', 'TabPFN-3']
  return (
    <section id="evidence" className="section-band scroll-mt-24 bg-[#f5f2ea]"><div className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32"><div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><SectionLabel number="07" kicker="Read the evidence / keep the caveat" tone="cobalt" /><h2 className="mt-7 max-w-3xl font-serif text-5xl leading-[0.96] tracking-[-0.04em] md:text-7xl">A benchmark is a window, not the weather.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-[#53606a]">The six papers tell a story of rapid progress. They do not erase regime, hardware, data quality, distribution shift, or governance. Use the filters to see what kind of statement you are reading.</p></div><div className="flex items-center gap-2 rounded-full border border-[#1e2a35]/15 bg-[#fffdf8] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#74808a]"><CircleHelp size={14} className="text-[#4775b3]" /> evidence has a context</div></div><div className="mt-10 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Evidence filters">{filters.map((value) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${filter === value ? 'border-[#3869a8] bg-[#e4edf8] text-[#3869a8]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a] hover:text-[#1e2a35]'}`}>{value === 'All' ? 'all signals' : value.replace('-', ' ')}</button>)}</div><div className="mt-5 grid gap-4 lg:grid-cols-2">{filteredClaims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)}</div><div className="mt-20"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">the reading shelf</p><h3 className="mt-2 font-serif text-4xl tracking-[-0.03em]">Six papers, one accelerating idea</h3></div><BookOpen className="hidden text-[#3869a8] sm:block" size={24} /></div><div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{papers.map((paper) => <PaperCard key={paper.id} paper={paper} />)}</div></div></div></section>
  )
}

function ClaimCard({ claim }: { claim: Claim }) {
  const paper = paperById[claim.sourceId]
  const tone: Tone = claim.kind === 'limitation' ? 'coral' : claim.kind === 'paper-result' ? 'cobalt' : 'mint'
  const palette = toneClasses[tone]
  return <article className="rounded-[14px] border border-[#1e2a35]/10 bg-[#fffdf8] p-5 transition-transform hover:-translate-y-0.5"><div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${palette.bg} ${palette.text}`}>{claim.kind.replace('-', ' ')}</span><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9aa0a0]">{claim.family}</span></div><h3 className="mt-4 text-base font-semibold leading-6">{claim.claim}</h3><p className="mt-3 text-sm leading-6 text-[#53606a]">{claim.context}</p><div className="mt-5 grid gap-3 border-t border-[#1e2a35]/10 pt-4 sm:grid-cols-2"><div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9aa0a0]">metric / lens</p><p className="mt-1 text-xs font-semibold text-[#53606a]">{claim.metric}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9aa0a0]">regime</p><p className="mt-1 text-xs font-semibold text-[#53606a]">{claim.regime}</p></div></div><a href={paper.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3869a8] hover:underline">open source / {paper.file} <ExternalLink size={12} /></a></article>
}

function PaperCard({ paper }: { paper: PaperSource }) {
  const tone: Tone = paper.status === 'Journal article' ? 'coral' : paper.status === 'Conference paper' ? 'mint' : 'cobalt'
  const palette = toneClasses[tone]
  return <article className="group flex min-h-[230px] flex-col justify-between rounded-[14px] border border-[#1e2a35]/10 bg-[#fffdf8] p-5"><div><div className="flex items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${palette.bg} ${palette.text}`}>{paper.status}</span><span className="font-mono text-[9px] text-[#9aa0a0]">{paper.date}</span></div><h3 className="mt-4 text-lg font-semibold leading-6">{paper.title}</h3><p className="mt-2 font-mono text-[10px] leading-5 text-[#8a9295]">{paper.venue} / {paper.authors}</p><p className="mt-4 text-sm leading-6 text-[#53606a]">{paper.focus}</p></div><div className="mt-6 flex items-center justify-between border-t border-[#1e2a35]/10 pt-4"><a href={paper.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-[#1e2a35] hover:text-[#3869a8]">paper link <ExternalLink size={13} /></a><a href={paper.externalUrl} target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#74808a] hover:text-[#3869a8]">public record</a></div></article>
}

function Footer({ jumpTo }: { jumpTo: (id: string) => void }) {
  return <footer className="border-t border-[#1e2a35]/10 bg-[#ebe7dc]"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-7 px-5 py-10 sm:flex-row sm:items-end lg:px-10"><div><button onClick={() => jumpTo('start')} className="font-serif text-2xl">Table Sense</button><p className="mt-2 max-w-md text-xs leading-5 text-[#74808a]">An educational interface for understanding tabular foundation models. Browser simulations are explanatory, not model checkpoints or actuarial advice.</p></div><div className="text-left sm:text-right"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#74808a]">built from the public reading shelf</p><p className="mt-2 font-mono text-[10px] text-[#9aa0a0]">TabPFN / TabICL / 2026-08-01</p></div></div></footer>
}

function SectionLabel({ number, kicker, tone, invert = false }: { number: string; kicker: string; tone: Tone; invert?: boolean }) {
  const palette = toneClasses[tone]
  return <div className={`flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] ${invert ? 'text-[#bbc4c4]' : 'text-[#74808a]'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-semibold ${invert ? 'border-white/20' : `${palette.border} ${palette.text}`}`}>{number}</span><span>{kicker}</span><span className={`h-px w-12 ${invert ? 'bg-white/20' : 'bg-[#1e2a35]/15'}`} /></div>
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><p className="font-serif text-3xl leading-none">{value}</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a9295]">{label}</p></div>
}

function RangeControl({ label, value, min, max, step, onChange, suffix, hint, dark = false }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix: string; hint?: string; dark?: boolean }) {
  return <label className="block"><span className={`flex items-center justify-between gap-3 text-xs font-semibold ${dark ? 'text-[#d6dddd]' : 'text-[#53606a]'}`}><span>{label}</span><output className={`font-mono text-[10px] ${dark ? 'text-[#f6c34a]' : 'text-[#1e2a35]'}`}>{suffix}</output></span><input aria-label={label} className={`range-input mt-3 w-full ${dark ? 'range-dark' : ''}`} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span className={`mt-2 block text-[10px] leading-4 ${dark ? 'text-[#8f9b9c]' : 'text-[#8a9295]'}`}>{hint}</span></label>
}

function ProbabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#74808a]"><span>{label}</span><span>{Math.round(value * 100)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8e5dc]"><motion.div className="h-full rounded-full" style={{ backgroundColor: color }} animate={{ width: `${value * 100}%` }} /></div></div>
}

function ComputeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="flex items-center justify-between gap-3 text-xs"><span className="text-[#bbc4c4]">{label}</span><span className="font-mono text-[10px] text-[#f5f2ea]">{Math.round(value)} u</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full" style={{ backgroundColor: color }} animate={{ width: `${Math.min(100, Math.max(3, value / 1.8))}%` }} transition={{ duration: 0.4 }} /></div></div>
}

function MetricTile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const palette = toneClasses[tone]
  return <div className={`rounded-[10px] border p-3 ${palette.bg} ${palette.border}`}><p className={`font-mono text-[9px] uppercase tracking-[0.08em] ${palette.text}`}>{label}</p><p className={`mt-2 font-serif text-2xl ${palette.text}`}>{value}</p></div>
}

function DeployStep({ icon, title, body, tone }: { icon: React.ReactNode; title: string; body: string; tone: Tone }) {
  const palette = toneClasses[tone]
  return <div className="flex gap-3 rounded-[10px] border border-[#1e2a35]/10 bg-[#fffdf8] p-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] ${palette.bg} ${palette.text}`}>{icon}</span><div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[#74808a]">{body}</p></div></div>
}

function MemoryColumn({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return <div className="flex h-full flex-1 flex-col justify-end gap-2"><div className="flex h-full items-end"><motion.div className="w-full rounded-t-[6px]" style={{ backgroundColor: color }} animate={{ height: `${Math.min(100, Math.max(5, (value / max) * 100))}%` }} /></div><span className="text-center font-mono text-[9px] uppercase tracking-[0.06em] text-[#74808a]">{label}</span></div>
}

export default App