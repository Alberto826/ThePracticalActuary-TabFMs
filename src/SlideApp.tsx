import { useEffect, useState, type ReactNode } from 'react'
import { BlockMath } from 'react-katex'
import { scaleLinear } from 'd3-scale'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  ExternalLink,
  Eye,
  GitBranch,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Menu,
  Network,
  Pause,
  Play,
  RefreshCcw,
  Table2,
  Target,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { benchmarkJourney, benchmarkNotes, tabArenaSnapshot, type BenchmarkRow, type BenchmarkEra } from './content/benchmarks'
import { equations } from './content/equations'
import { modelMatrix, type ModelComparison } from './content/modelMatrix'
import { papers } from './content/papers'
import {
  attentionForQuery,
  heroProbability,
  makeTableRows,
  severityQuantiles,
  targetProbability,
} from './lib/simulations'
import type { TableRow } from './types'

type SlideId = 'prompt' | 'prior' | 'attention' | 'architectures' | 'probability' | 'benchmarks' | 'evidence'
type PriorTab = 'scm' | 'tree' | 'mixed'
type AttentionPhase = 'column' | 'row' | 'alternating' | 'icl'
type ProbabilityMode = 'classification' | 'regression'
type ModelKey = 'TabPFN v1' | 'Nature / TabPFN v2' | 'TabPFN-2.5' | 'TabICL' | 'TabICLv2' | 'TabPFN-3'
type BenchmarkKey = 'tabArena' | 'talent' | 'openMl'

const slides: { id: SlideId; number: string; label: string; title: string }[] = [
  { id: 'benchmarks', number: '01', label: 'The journey', title: 'From GLMs to tabular foundation models' },
  { id: 'prompt', number: '02', label: 'The prompt', title: 'A table can be a prompt' },
  { id: 'prior', number: '03', label: 'The prior', title: 'Before the model sees your table' },
  { id: 'attention', number: '04', label: 'In context', title: 'How attention turns rows into a prediction' },
  { id: 'architectures', number: '05', label: 'Architectures', title: 'The evolution of the table reader' },
  { id: 'probability', number: '06', label: 'Probability', title: 'The output is a distribution' },
  { id: 'evidence', number: '07', label: 'Evidence', title: 'Compare the model families' },
]

const modelDetails: Record<ModelKey, { sourceId: string; color: string; headline: string; stages: string[]; attention: string; prior: string; output: string; innovation: string[]; caveat: string }> = {
  'TabPFN v1': {
    sourceId: 'tabpfn-v1',
    color: '#d95b46',
    headline: 'The original idea: make rows the tokens and learn the learning algorithm.',
    stages: ['row encoder', 'train rows self-attend', 'query rows cross-attend to train', 'class probabilities'],
    attention: 'Row-token self-attention. The test rows are masked from one another and can only read the labeled context.',
    prior: 'A mixture of structural causal model and Bayesian neural network generators, biased toward simple mechanisms.',
    output: 'Classification probabilities for up to 10 classes in the validated regime.',
    innovation: ['Turns offline synthetic task training into a reusable prediction algorithm.', 'Introduces a table-native form of in-context learning without gradient updates at inference.', 'Shows a Bayesian-style posterior predictive can be approximated by a Transformer.'],
    caveat: 'Designed for small, clean, numerical tables; categorical values, missingness, irrelevant features, and long sequences were known limitations.',
  },
  'Nature / TabPFN v2': {
    sourceId: 'tabpfn-nature',
    color: '#c78924',
    headline: 'The practical successor moves from whole-row tokens toward cell-aware representations.',
    stages: ['group cells', 'feature / column attention', 'row / sample attention', 'classification or regression head'],
    attention: 'Alternating attention lets representations mix information down columns and across features within rows.',
    prior: 'A richer synthetic prior and preprocessing pipeline designed for heterogeneous tabular data.',
    output: 'Classification and regression predictions, including predictive distributions in the broader PFN framing.',
    innovation: ['Extends the validated data regime toward 10,000 samples and mixed feature types.', 'Introduces a practical foundation for fine-tuning, density estimation, generation, and embeddings.', 'Demonstrates the speed and accuracy claim in a peer-reviewed Nature article.'],
    caveat: 'The attention pattern is expressive but expensive because it keeps a cell-level representation while rows and features interact.',
  },
  'TabPFN-2.5': {
    sourceId: 'tabpfn-2-5',
    color: '#d95b46',
    headline: 'The same alternating design, pushed with deeper networks, grouped features, and deployment paths.',
    stages: ['feature groups of 3', '18 / 24 Transformer layers', '64 learned thinking rows', 'ICL or distilled MLP / tree'],
    attention: 'Alternating feature-wise and sample-wise attention over grouped cell tokens; training and test context are separated by masks and caching.',
    prior: 'Purely synthetic pretraining with broader distributions; an optional Real-TabPFN variant continues pretraining on deduplicated real data.',
    output: 'Classification probabilities or a binned regression distribution; decision threshold and temperature calibration are available as post-processing.',
    innovation: ['Increases feature group size from 2 to 3 to reduce token count.', 'Uses deeper classifiers and regression models plus learned thinking rows inspired by extra computation tokens.', 'Adds a distillation engine that turns a context-dependent model into a dataset-specific MLP or tree ensemble.'],
    caveat: 'The 50,000-row figure is the design target; report benchmarks also include larger tables, with comparisons that must retain tuning and fine-tuning labels.',
  },
  TabICL: {
    sourceId: 'tabicl-v1',
    color: '#3e8d7e',
    headline: 'A deliberate split: understand columns, compress rows, then perform ICL over the compressed table.',
    stages: ['TFcol: distribution-aware column embedding', 'TFrow: feature interaction + 4 CLS tokens', 'TFicl: row-level in-context learning', 'class probabilities'],
    attention: 'Induced column attention captures distributional statistics; row attention captures feature interactions; final ICL operates on fixed-width row vectors.',
    prior: 'SCM generators enriched with tree-based SCMs and more varied activation functions; a curriculum grows synthetic tables from 1K to 60K rows.',
    output: 'Classification; hierarchical decomposition extends beyond the <=10-class pretraining head.',
    innovation: ['Uses a Set Transformer to make a column aware of its own empirical distribution.', 'Collapses the feature dimension before the expensive dataset-wise ICL stage.', 'Demonstrates ICL on large tables, including 55 datasets above 10K rows in the TALENT analysis.'],
    caveat: 'The released paper is classification-focused; the authors explicitly note that inference remains costly and benchmark comparisons inherit TALENT protocol choices.',
  },
  TabICLv2: {
    sourceId: 'tabicl-v2',
    color: '#4775b3',
    headline: 'TabICL’s compression path, upgraded for long context, richer priors, many classes, and distributions.',
    stages: ['repeated feature grouping + target embedding', 'TFcol + QASSMax', 'TFrow + RoPE + CLS tokens', 'TFicl + quantile / class output'],
    attention: 'QASSMax rescales query elements with a learned, length-aware factor so attention does not fade as the context grows.',
    prior: 'A modular generator spanning MLPs, tree ensembles, GP functions, linear, quadratic, EM-like, and product functions, with filtering and correlated hyperparameters.',
    output: 'Classification with mixed-radix and hierarchical many-class handling; regression with 999 quantiles and reconstructed PDF, CDF, moments, and CRPS.',
    innovation: ['Repeated feature grouping gives each feature multiple local views instead of dropping detail once.', 'Injects targets early to break representation symmetries and improve row embeddings.', 'Adds QASSMax, Muon pretraining, disk offloading, and a quantile-native regression head.'],
    caveat: 'The report’s distributional regression validation is largely synthetic/toy; missing values and distribution shift remain explicit limitations.',
  },
  'TabPFN-3': {
    sourceId: 'tabpfn-3',
    color: '#3869a8',
    headline: 'Compression returns to the TabPFN lineage, now built around million-row inference.',
    stages: ['triplet cell embedding + missingness flags', 'column distribution embedding', 'row aggregation to fixed vectors', 'QASSMax ICL + retrieval decoder'],
    attention: 'Column-wise inducing attention and row-level ICL. Test queries use multi-query cross-attention with one KV head to reduce cache size.',
    prior: 'An expanded SCM prior with new graph samplers, function combiners, categorical mechanisms, temporal and OOD tasks, and spatial structure.',
    output: 'Classification with an attention-based retrieval decoder and a released-checkpoint ceiling of 160 classes; regression via a distributional/bar head.',
    innovation: ['Row chunking keeps feature activations bounded while preserving the semantics of full-table inducing summaries.', 'Reduced KV cache scales with rows rather than rows x features; the report gives a 7 GiB per-estimator example at 1M rows.', 'Native NaN/Inf indicators, orthogonal target embeddings, RMSNorm, and many-class retrieval decoding.'],
    caveat: 'TabPFN-3-Plus text support and Thinking mode are API/enterprise features; the open checkpoint and report claims should not be conflated.',
  },
}

const priorCopy: Record<PriorTab, { label: string; title: string; body: string; teaches: string; formula: string }> = {
  scm: {
    label: 'SCM / causal graph',
    title: 'A story about how variables are generated',
    body: 'A structural causal model is a directed acyclic graph plus a function at each node. In a synthetic task, the graph is sampled first, then values flow from parent nodes to child nodes with noise. The arrows describe the generator used for pretraining; they are not a discovered causal graph for your portfolio.',
    teaches: 'Dependency structure, smooth or nonlinear relationships, and the idea that a target may be downstream of several features.',
    formula: equations.scm,
  },
  tree: {
    label: 'Tree-like generator',
    title: 'A story made from splits and regions',
    body: 'A tree-like generator creates outputs by splitting the feature space into regions. It can express thresholds, sharp edges, and interactions that look like boosted-tree decision rules. TabICL explicitly adds tree-based structural causal generators because trees remain strong inductive biases for tabular data.',
    teaches: 'Axis-aligned thresholds, discontinuities, class imbalance, and interactions that are not well represented by only smooth neural functions.',
    formula: String.raw`f(x)=\sum_{t=1}^{T} w_t\,\mathbf{1}\{x\in R_t\}`,
  },
  mixed: {
    label: 'Mixed prior',
    title: 'Several generator families, one training distribution',
    body: 'A mixed prior is not a third model architecture. It is a recipe for sampling many kinds of synthetic tasks: graph functions, tree ensembles, Gaussian-process-like functions, linear or quadratic relationships, discretization, and products. The model sees a broad menu instead of overfitting to one story about tables.',
    teaches: 'Robustness across smooth, jagged, categorical, heavy-tailed, and interacting relationships.',
    formula: String.raw`p(D)=\sum_{k} \pi_k\,p_k(D),\qquad \sum_k\pi_k=1`,
  },
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`
const formatMoney = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`

export default function SlideApp() {
  const rows = makeTableRows()
  const [activeIndex, setActiveIndex] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contextSize, setContextSize] = useState(3)
  const [showHeldOutAnswer, setShowHeldOutAnswer] = useState(false)
  const [priorTab, setPriorTab] = useState<PriorTab>('scm')
  const [priorSeed, setPriorSeed] = useState(1)
  const [attentionPhase, setAttentionPhase] = useState<AttentionPhase>('column')
  const [attentionPlaying, setAttentionPlaying] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelKey>('TabICL')
  const [probabilityMode, setProbabilityMode] = useState<ProbabilityMode>('classification')

  const activeSlide = slides[activeIndex]
  const goToSlide = (index: number) => {
    setActiveIndex(Math.min(slides.length - 1, Math.max(0, index)))
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      if (event.key === 'ArrowRight') goToSlide(activeIndex + 1)
      if (event.key === 'ArrowLeft') goToSlide(activeIndex - 1)
      if (event.key === 'Home') goToSlide(0)
      if (event.key === 'End') goToSlide(slides.length - 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex])

  useEffect(() => {
    if (!attentionPlaying) return
    const phaseOrder: AttentionPhase[] = ['column', 'row', 'alternating', 'icl']
    const timer = window.setInterval(() => {
      setAttentionPhase((currentPhase) => phaseOrder[(phaseOrder.indexOf(currentPhase) + 1) % phaseOrder.length])
    }, 1500)
    return () => window.clearInterval(timer)
  }, [attentionPlaying])

  const probability = heroProbability(rows, contextSize)

  return (
    <div className="slide-app min-h-screen overflow-hidden bg-[#f5f2ea] text-[#1e2a35]">
      <DeckHeader activeIndex={activeIndex} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} goToSlide={goToSlide} />
      <main className="deck-main">
        <AnimatePresence mode="wait">
          <motion.div key={activeSlide.id} className="slide-scroll" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
            {activeSlide.id === 'prompt' && <PromptSlide rows={rows} contextSize={contextSize} setContextSize={setContextSize} probability={probability} showHeldOutAnswer={showHeldOutAnswer} setShowHeldOutAnswer={setShowHeldOutAnswer} goToSlide={goToSlide} />}
            {activeSlide.id === 'prior' && <PriorSlide tab={priorTab} setTab={setPriorTab} seed={priorSeed} setSeed={setPriorSeed} />}
            {activeSlide.id === 'attention' && <AttentionSlide phase={attentionPhase} setPhase={setAttentionPhase} playing={attentionPlaying} setPlaying={setAttentionPlaying} />}
            {activeSlide.id === 'architectures' && <ArchitectureSlide model={selectedModel} setModel={setSelectedModel} />}
            {activeSlide.id === 'probability' && <ProbabilitySlide rows={rows} contextSize={contextSize} mode={probabilityMode} setMode={setProbabilityMode} showHeldOutAnswer={showHeldOutAnswer} setShowHeldOutAnswer={setShowHeldOutAnswer} />}
            {activeSlide.id === 'benchmarks' && <BenchmarkJourneySlide />}
            {activeSlide.id === 'evidence' && <EvidenceSlide />}
          </motion.div>
        </AnimatePresence>
      </main>
      <DeckFooter activeIndex={activeIndex} goToSlide={goToSlide} />
    </div>
  )
}

function DeckHeader({ activeIndex, mobileMenuOpen, setMobileMenuOpen, goToSlide }: { activeIndex: number; mobileMenuOpen: boolean; setMobileMenuOpen: (value: boolean) => void; goToSlide: (index: number) => void }) {
  return (
    <header className="deck-header border-b border-[#1e2a35]/10 bg-[#f5f2ea]/96 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 lg:px-10">
        <button className="group flex items-center gap-3 text-left" onClick={() => goToSlide(0)} aria-label="Return to slide one">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1e2a35] text-[#f5f2ea] transition-transform group-hover:-rotate-6"><Table2 size={18} /></span>
          <span><span className="block font-serif text-lg leading-none">Table Sense</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-[#74808a]">a tabular foundation models lab</span></span>
        </button>
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Slide tabs">
          {slides.map((slide, index) => <button key={slide.id} onClick={() => goToSlide(index)} aria-current={activeIndex === index ? 'step' : undefined} className={`group flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${activeIndex === index ? 'bg-[#1e2a35] text-[#f5f2ea]' : 'text-[#74808a] hover:bg-[#e7e1d5] hover:text-[#1e2a35]'}`}><span className={`font-mono text-[10px] ${activeIndex === index ? 'text-[#f6c34a]' : 'text-[#a4a9aa]'}`}>{slide.number}</span>{slide.label}</button>)}
        </nav>
        <div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-full border border-[#1e2a35]/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#74808a] sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3e8d7e]" /> browser simulation</span><button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1e2a35]/15 lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close slide menu' : 'Open slide menu'}>{mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
      </div>
      <AnimatePresence>{mobileMenuOpen && <motion.nav className="border-t border-[#1e2a35]/10 px-5 pb-4 lg:hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} aria-label="Mobile slide tabs"><div className="grid gap-1 pt-3">{slides.map((slide, index) => <button key={slide.id} onClick={() => goToSlide(index)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ${activeIndex === index ? 'bg-[#1e2a35] text-[#f5f2ea]' : 'text-[#53606a] hover:bg-[#e7e1d5]'}`}><span className="font-mono text-[10px] text-[#d64e3b]">{slide.number}</span>{slide.label}</button>)}</div></motion.nav>}</AnimatePresence>
    </header>
  )
}

function DeckFooter({ activeIndex, goToSlide }: { activeIndex: number; goToSlide: (index: number) => void }) {
  return <footer className="deck-footer border-t border-[#1e2a35]/10 bg-[#ebe7dc]"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3 lg:px-10"><button disabled={activeIndex === 0} onClick={() => goToSlide(activeIndex - 1)} className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-xs font-semibold text-[#53606a] transition-colors hover:bg-[#f5f2ea] disabled:cursor-not-allowed disabled:opacity-35"><ArrowLeft size={15} /> previous</button><div className="flex items-center gap-2" aria-label={`Slide ${activeIndex + 1} of ${slides.length}`}>{slides.map((slide, index) => <button key={slide.id} onClick={() => goToSlide(index)} aria-label={`Go to slide ${index + 1}: ${slide.label}`} className={`h-1.5 rounded-full transition-all ${activeIndex === index ? 'w-8 bg-[#d64e3b]' : 'w-1.5 bg-[#b7b6ae] hover:bg-[#74808a]'}`} />)}</div><button disabled={activeIndex === slides.length - 1} onClick={() => goToSlide(activeIndex + 1)} className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-xs font-semibold text-[#53606a] transition-colors hover:bg-[#f5f2ea] disabled:cursor-not-allowed disabled:opacity-35">next <ArrowRight size={15} /></button></div></footer>
}

function PromptSlide({ rows, contextSize, setContextSize, probability, showHeldOutAnswer, setShowHeldOutAnswer, goToSlide: goToSlideByIndex }: { rows: TableRow[]; contextSize: number; setContextSize: (value: number) => void; probability: number; showHeldOutAnswer: boolean; setShowHeldOutAnswer: (value: boolean) => void; goToSlide: (index: number) => void }) {
  const goToSlide = (index: number) => goToSlideByIndex(index === 1 ? 2 : index)
  return <SlideFrame number="01" kicker="The prompt / start with the analogy" tone="coral"><div className="slide-two-column"><div><h1 className="slide-title">A table can be a <em>prompt.</em></h1><p className="slide-lead">Large language models learn to continue a sequence after reading a context window. Tabular foundation models borrow the same shape of idea, but the “tokens” are structured rows and cells rather than words.</p><div className="grid gap-3 sm:grid-cols-2"><AnalogyCard icon={<BrainCircuit size={18} />} title="LLM prompt" formula={equations.llmNextToken} text="The model reads the prompt tokens, then scores possible next tokens." tone="coral" /><AnalogyCard icon={<Table2 size={18} />} title="Tabular prompt" formula={equations.tableNextLabel} text="The model reads labeled rows plus a query row, then scores possible labels." tone="cobalt" /></div><div className="mt-5 rounded-[14px] border border-[#1e2a35]/10 bg-[#fffdf8] p-5"><div className="flex items-start gap-3"><Eye size={18} className="mt-0.5 shrink-0 text-[#3869a8]" /><div><p className="text-sm font-semibold">What is the context window for?</p><p className="mt-2 text-sm leading-6 text-[#53606a]">It defines the evidence the model can compare at once. In an LLM, the window is a sequence of text tokens. In a TFM, it is usually a set of labeled context rows plus one or more unlabeled query rows. A larger window can expose more examples, but it also increases computation and can dilute a relevant pattern.</p></div></div></div><button onClick={() => goToSlide(1)} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#d64e3b] hover:underline">Next: where did the model learn its bias? <ArrowRight size={14} /></button></div><PromptWindow rows={rows} contextSize={contextSize} setContextSize={setContextSize} probability={probability} showHeldOutAnswer={showHeldOutAnswer} setShowHeldOutAnswer={setShowHeldOutAnswer} /></div></SlideFrame>
}

function PromptWindow({ rows, contextSize, setContextSize, probability, showHeldOutAnswer, setShowHeldOutAnswer }: { rows: TableRow[]; contextSize: number; setContextSize: (value: number) => void; probability: number; showHeldOutAnswer: boolean; setShowHeldOutAnswer: (value: boolean) => void }) {
  return <div className="surface-panel bg-[#fffdf8] shadow-[0_20px_60px_rgba(30,42,53,0.1)]"><div className="flex items-start justify-between gap-4 border-b border-[#1e2a35]/10 px-5 py-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64e3b]">one prompt / two jobs</p><p className="mt-1 text-lg font-semibold">Will policy Q-09 claim?</p></div><span className="rounded-full bg-[#e4edf8] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#3869a8]">query row</span></div><div className="overflow-x-auto px-5 py-4"><table className="min-w-[470px] w-full border-collapse text-left text-[11px]"><thead><tr className="border-b border-[#1e2a35]/10 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]"><th className="pb-3 pr-3 font-medium">role</th><th className="pb-3 pr-3 font-medium">driver age</th><th className="pb-3 pr-3 font-medium">vehicle</th><th className="pb-3 pr-3 font-medium">miles</th><th className="pb-3 font-medium">label</th></tr></thead><tbody>{rows.slice(0, 6).map((row, index) => <tr key={row.id} className={`border-b border-[#1e2a35]/7 ${index < contextSize ? 'text-[#1e2a35]' : 'text-[#abb1b1]'}`}><td className="py-3 pr-3"><span className={`rounded-full px-2 py-1 font-mono text-[9px] ${index < contextSize ? 'bg-[#f8edc9] text-[#a36b13]' : 'bg-[#f0eee7] text-[#9aa0a0]'}`}>{index < contextSize ? 'context' : 'held out'}</span></td><td className="py-3 pr-3 font-mono">{row.driverAge}</td><td className="py-3 pr-3 font-mono">{row.vehicleAge}y</td><td className="py-3 pr-3 font-mono">{row.annualMiles}k</td><td className={`py-3 font-mono font-semibold ${index < contextSize ? row.claim ? 'text-[#d64e3b]' : 'text-[#2f8175]' : 'text-[#abb1b1]'}`}>{index < contextSize ? row.claim ? 'yes' : 'no' : '—'}</td></tr>)}<tr className="bg-[#e4edf8] text-[#3869a8]"><td className="py-3 pr-3"><span className="rounded-full bg-[#4775b3] px-2 py-1 font-mono text-[9px] font-semibold text-white">query</span></td><td className="py-3 pr-3 font-mono">39</td><td className="py-3 pr-3 font-mono">8y</td><td className="py-3 pr-3 font-mono">15k</td><td className="py-3 font-mono font-semibold">{showHeldOutAnswer ? 'yes' : '?'}</td></tr></tbody></table></div><div className="grid gap-5 border-t border-[#1e2a35]/10 px-5 py-5 sm:grid-cols-[1fr_170px] sm:items-end"><Slider label="context rows" value={contextSize} min={1} max={6} step={1} onChange={setContextSize} suffix={`${contextSize} rows`} hint="These labels are visible to the model." /><div><div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#74808a]"><span>output: P(claim)</span><span className="text-[#d64e3b]">{formatPercent(probability)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8e5dc]"><motion.div className="h-full rounded-full bg-[#d95b46]" animate={{ width: `${probability * 100}%` }} /></div><button onClick={() => setShowHeldOutAnswer(!showHeldOutAnswer)} className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#3869a8] hover:underline"><LockKeyhole size={11} /> {showHeldOutAnswer ? 'hide label' : 'reveal held-out label'}</button></div></div><div className="border-t border-[#1e2a35]/10 bg-[#f8f6ef] px-5 py-4"><p className="text-xs leading-5 text-[#53606a]"><span className="font-semibold text-[#1e2a35]">Held out means hidden on purpose.</span> We hide the query label so the model has to predict it. During pretraining, the hidden label supplies the loss signal; during evaluation, it lets us check whether the probability was useful without leaking the answer.</p></div></div>
}

function PriorSlide({ tab, setTab, seed, setSeed }: { tab: PriorTab; setTab: (value: PriorTab) => void; seed: number; setSeed: (value: number) => void }) {
  const copy = priorCopy[tab]
  return <SlideFrame number="02" kicker="The prior / what was learned before your table" tone="yellow"><div className="slide-two-column"><div><h2 className="slide-title">Before the model sees your table, it has seen <em>many possible tables.</em></h2><p className="slide-lead">A prior is the synthetic universe used to teach the network what relationships are plausible. Think of it as a training generator, not as a single fitted curve and not as a causal conclusion about your business.</p><div className="flex flex-wrap gap-2">{(['scm', 'tree', 'mixed'] as PriorTab[]).map((option) => <button key={option} onClick={() => setTab(option)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${tab === option ? 'border-[#c78924] bg-[#f8edc9] text-[#8b661c]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a] hover:text-[#1e2a35]'}`}>{priorCopy[option].label}</button>)}</div><div className="mt-6 rounded-[14px] border border-[#e2c679] bg-[#f8edc9] p-5"><div className="flex items-start gap-3"><Lightbulb size={18} className="mt-0.5 shrink-0 text-[#a36b13]" /><div><p className="text-sm font-semibold text-[#7e5a18]">{copy.title}</p><p className="mt-2 text-sm leading-6 text-[#806b3c]">{copy.body}</p></div></div></div><div className="mt-5 overflow-x-auto rounded-[14px] border border-[#1e2a35]/10 bg-[#fffdf8] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a36b13]">generator shorthand</p><BlockMath math={copy.formula} /><p className="mt-2 text-xs leading-5 text-[#74808a]"><span className="font-semibold text-[#1e2a35]">What it teaches:</span> {copy.teaches}</p></div></div><div className="surface-panel bg-[#fffdf8] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">synthetic generator / universe {seed}</p><p className="mt-1 text-lg font-semibold">A generator you can read</p></div><button onClick={() => setSeed(seed + 1)} className="inline-flex items-center gap-2 rounded-full border border-[#1e2a35]/12 px-3 py-2 text-xs font-semibold text-[#53606a] hover:bg-[#f5f2ea]"><RefreshCcw size={14} /> new universe</button></div><PriorIllustration tab={tab} seed={seed} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><SmallDefinition title="sample" text="Draw a mechanism" /><SmallDefinition title="generate" text="Draw rows from it" /><SmallDefinition title="fit" text="Learn to infer" /></div><div className="mt-5 rounded-[10px] bg-[#f5f2ea] p-4 text-xs leading-5 text-[#53606a]">The loss compares the model&apos;s predicted distribution with the known hidden labels from each synthetic task. That is how the network learns an algorithm instead of memorizing one table.</div></div></div></SlideFrame>
}

function PriorIllustration({ tab, seed }: { tab: PriorTab; seed: number }) {
  if (tab === 'scm') return <svg className="mt-7 h-auto w-full" viewBox="0 0 520 240" role="img" aria-label="Structural causal model diagram"><defs><marker id="scm-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#4775b3" /></marker></defs><rect x="0" y="0" width="520" height="240" rx="12" fill="#e4edf8" /><text x="26" y="30" fill="#3869a8" fontSize="11" fontFamily="DM Mono">one possible dependency story</text><line x1="124" y1="98" x2="234" y2="92" stroke="#4775b3" strokeWidth="2" markerEnd="url(#scm-arrow)" /><line x1="124" y1="161" x2="234" y2="108" stroke="#4775b3" strokeWidth="2" markerEnd="url(#scm-arrow)" /><line x1="322" y1="100" x2="414" y2="128" stroke="#4775b3" strokeWidth="2" markerEnd="url(#scm-arrow)" /><line x1="322" y1="100" x2="414" y2="178" stroke="#4775b3" strokeWidth="2" markerEnd="url(#scm-arrow)" /><GraphNode x="85" y="98" label="driver age" sub="z1" color="#f8edc9" /><GraphNode x="85" y="161" label="vehicle age" sub="z2" color="#f8edc9" /><GraphNode x="280" y="100" label="risk score" sub="z3 = f(z1,z2)+ε" color="#dfeee7" /><GraphNode x="448" y="128" label="claim?" sub="y" color="#fbe4dc" /><GraphNode x="448" y="178" label="severity" sub="s | claim" color="#fbe4dc" /><text x="25" y="218" fill="#53606a" fontSize="10">Arrows are part of a synthetic generator, not evidence of causality in your data.</text></svg>
  if (tab === 'tree') return <svg className="mt-7 h-auto w-full" viewBox="0 0 520 240" role="img" aria-label="Tree-like prior diagram"><rect x="0" y="0" width="520" height="240" rx="12" fill="#f8edc9" /><text x="26" y="30" fill="#8b661c" fontSize="11" fontFamily="DM Mono">axis-aligned regions</text><line x1="260" y1="66" x2="155" y2="118" stroke="#c78924" strokeWidth="2" /><line x1="260" y1="66" x2="365" y2="118" stroke="#c78924" strokeWidth="2" /><line x1="155" y1="145" x2="94" y2="181" stroke="#c78924" strokeWidth="2" /><line x1="155" y1="145" x2="214" y2="181" stroke="#c78924" strokeWidth="2" /><line x1="365" y1="145" x2="304" y2="181" stroke="#c78924" strokeWidth="2" /><line x1="365" y1="145" x2="424" y2="181" stroke="#c78924" strokeWidth="2" /><TreeNode x="260" y="66" label="miles > 12?" color="#1e2a35" /><TreeNode x="155" y="145" label="vehicle > 8?" color="#1e2a35" /><TreeNode x="365" y="145" label="region = urban?" color="#1e2a35" /><Leaf x="94" y="194" label="low" /><Leaf x="214" y="194" label="medium" /><Leaf x="304" y="194" label="medium" /><Leaf x="424" y="194" label="high" /><text x="25" y="224" fill="#806b3c" fontSize="10">The generator teaches thresholds and sharp interactions.</text></svg>
  return <svg className="mt-7 h-auto w-full" viewBox="0 0 520 240" role="img" aria-label="Mixed prior diagram"><defs><marker id={`mix-arrow-${seed}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#1e2a35" /></marker></defs><rect x="0" y="0" width="520" height="240" rx="12" fill="#dfeee7" /><text x="26" y="30" fill="#2f8175" fontSize="11" fontFamily="DM Mono">mixture over task generators</text><MiniGenerator x="92" y="92" label="SCM" sub="dependencies" color="#e4edf8" /><MiniGenerator x="92" y="156" label="Tree" sub="thresholds" color="#f8edc9" /><MiniGenerator x="260" y="124" label="GP / linear" sub="smoothness" color="#fbe4dc" /><line x1="145" y1="92" x2="360" y2="113" stroke="#1e2a35" strokeWidth="1.7" markerEnd={`url(#mix-arrow-${seed})`} /><line x1="145" y1="156" x2="360" y2="133" stroke="#1e2a35" strokeWidth="1.7" markerEnd={`url(#mix-arrow-${seed})`} /><line x1="313" y1="124" x2="360" y2="124" stroke="#1e2a35" strokeWidth="1.7" markerEnd={`url(#mix-arrow-${seed})`} /><GraphNode x="427" y="124" label="synthetic table" sub="one draw" color="#fffdf8" /><text x="25" y="218" fill="#53606a" fontSize="10">Different stories create a broader training distribution.</text></svg>
}

function AttentionSlide({ phase, setPhase, playing, setPlaying }: { phase: AttentionPhase; setPhase: (value: AttentionPhase) => void; playing: boolean; setPlaying: (value: boolean) => void }) {
  const phases: { id: AttentionPhase; label: string; title: string; explanation: string; formula: string }[] = [
    { id: 'column', label: 'column attention', title: 'Look down a column', explanation: 'Cells in one feature compare across rows. The model can learn distributional facts such as scale, skew, extremes, or category patterns.', formula: equations.columnAttention },
    { id: 'row', label: 'row attention', title: 'Look across a row', explanation: 'Features within one policyholder interact. The model can combine age, vehicle, miles, and region before asking what they imply together.', formula: equations.rowAttention },
    { id: 'alternating', label: 'alternating attention', title: 'Column, then row, then repeat', explanation: 'TabPFN-v2 and TabPFN-2.5 alternate the two views so information can travel across the table without treating every cell as an isolated scalar.', formula: equations.alternating },
    { id: 'icl', label: 'compression then ICL', title: 'Compress, then let the query read context', explanation: 'TabICL names its stages TFcol, TFrow, and TFicl: columns become distribution-aware embeddings, rows become fixed-width vectors, then the query reads labeled rows. A readout converts the weighted evidence into the output cell.', formula: equations.tableNextLabel },
  ]
  const activePhase = phases.find((item) => item.id === phase) ?? phases[0]
  const queryWeights = attentionForQuery(4, 1)
  return <SlideFrame number="03" kicker="In context / the mechanics of attention" tone="mint"><div className="slide-two-column"><div><h2 className="slide-title">Attention is a routing rule for evidence.</h2><p className="slide-lead">The query is not “looking” in a human sense. Each attention head computes compatibility between a query vector and key vectors, then uses the resulting weights to mix value vectors.</p><div className="rounded-[14px] border border-[#a8d2c3] bg-[#dfeee7] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f8175]">the shared engine</p><BlockMath math={equations.attention} /><p className="text-xs leading-5 text-[#53606a]">Large weights route more of the value information into the next representation. The mask decides which comparisons are legal.</p></div><div className="mt-5 grid gap-2">{phases.map((item) => <button key={item.id} onClick={() => setPhase(item.id)} className={`flex items-center justify-between rounded-[10px] border px-4 py-3 text-left transition-colors ${phase === item.id ? 'border-[#3e8d7e] bg-[#dfeee7]' : 'border-[#1e2a35]/10 bg-[#fffdf8] hover:bg-[#f5f2ea]'}`}><span><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-xs text-[#74808a]">{item.title}</span></span><ArrowRight size={15} className={phase === item.id ? 'text-[#2f8175]' : 'text-[#a4a9aa]'} /></button>)}</div></div><div className="surface-panel bg-[#fffdf8] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">animated attention map</p><p className="mt-1 text-xl font-semibold">{activePhase.title}</p></div><button onClick={() => setPlaying(!playing)} className="inline-flex items-center gap-2 rounded-full bg-[#1e2a35] px-3 py-2 text-xs font-semibold text-[#f5f2ea]">{playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'pause' : 'play'} sequence</button></div><AttentionAnimation phase={phase} queryWeights={queryWeights} /><div className="mt-5 rounded-[10px] bg-[#f5f2ea] p-4"><p className="text-sm font-semibold">{activePhase.explanation}</p><div className="mt-3 overflow-x-auto"><BlockMath math={activePhase.formula} /></div></div><PredictionReadout phase={phase} /></div></div></SlideFrame>
}

function AttentionAnimation({ phase, queryWeights }: { phase: AttentionPhase; queryWeights: number[] }) {
  const rows = ['A', 'B', 'C', 'Q']
  const columns = ['age', 'vehicle', 'miles']
  return <div className="mt-7 rounded-[12px] border border-[#1e2a35]/10 bg-[#f5f2ea] p-4"><div className="grid grid-cols-[34px_repeat(3,1fr)_64px] items-center gap-2 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]"><span />{columns.map((column) => <span key={column}>{column}</span>)}<span>output</span>{rows.map((row, rowIndex) => <div key={row} className="contents"><span className={`text-left font-semibold ${row === 'Q' ? 'text-[#3869a8]' : 'text-[#74808a]'}`}>{row}</span>{columns.map((column, columnIndex) => { const active = phase === 'column' ? columnIndex === 1 : phase === 'row' ? rowIndex === 3 : phase === 'alternating' ? (rowIndex + columnIndex) % 2 === 0 : rowIndex === 3; return <motion.span key={`${row}-${column}`} className={`flex h-12 items-center justify-center rounded-[8px] border font-mono text-[10px] transition-colors ${active ? 'border-[#3e8d7e] bg-[#bfe0d3] text-[#1e5e55]' : 'border-[#1e2a35]/8 bg-[#fffdf8] text-[#74808a]'}`} animate={{ scale: active ? 1.05 : 1, opacity: active ? 1 : 0.62 }} transition={{ duration: 0.35 }}>{rowIndex === 3 && columnIndex === 2 ? '?' : `${[22, 11, 18, 39, 8, 15, 51, 9, 16, 64, 5, 6][rowIndex * 3 + columnIndex]}`}</motion.span> })}<motion.span className={`flex h-12 items-center justify-center rounded-[8px] border font-mono text-[10px] font-semibold ${row === 'Q' ? 'border-[#d64e3b] bg-[#fbe4dc] text-[#d64e3b]' : 'border-[#1e2a35]/8 bg-[#fffdf8] text-[#b0b5b4]'}`} animate={{ opacity: row === 'Q' ? 1 : phase === 'icl' ? 0.92 : 0.45 }}>{row === 'Q' ? `${Math.round((0.48 + queryWeights[1] * 0.4) * 100)}%` : '—'}</motion.span></div>)}</div><div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[9px] uppercase tracking-[0.08em] text-[#74808a]"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[#bfe0d3]" /> active route</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded border border-[#d64e3b] bg-[#fbe4dc]" /> predicted target</span></div></div>
}

function PredictionReadout({ phase }: { phase: AttentionPhase }) {
  const value = phase === 'column' ? 54 : phase === 'row' ? 61 : phase === 'alternating' ? 65 : 68
  return <><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_190px] sm:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#74808a]">the output cell is still missing</p><p className="mt-2 text-sm leading-6 text-[#53606a]">Attention changes the hidden representation. The final head maps that representation to a probability for the held-out claim label.</p></div><div className="rounded-[12px] border border-[#efb2a2] bg-[#fbe4dc] p-4"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a4d43]">P(claim = 1)</p><p className="mt-1 font-serif text-4xl text-[#d64e3b]">{value}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70"><motion.div className="h-full rounded-full bg-[#d64e3b]" animate={{ width: `${value}%` }} /></div></div></div><AttentionPipeline phase={phase} /></>
}

function AttentionPipeline({ phase }: { phase: AttentionPhase }) {
  const activeStep = phase === 'column' ? 0 : phase === 'row' ? 1 : phase === 'alternating' ? 2 : 3
  const steps = [
    ['Q · K', 'similarity scores'],
    ['softmax', 'attention weights'],
    ['Σ αV', 'weighted values'],
    ['head', 'logit / probability'],
  ]
  return <div className="mt-5 rounded-[12px] border border-[#1e2a35]/10 bg-[#f5f2ea] p-4"><div className="grid gap-2 sm:grid-cols-4">{steps.map(([label, text], index) => <motion.div key={label} className={`rounded-[9px] border p-3 ${activeStep === index ? 'border-[#3e8d7e] bg-[#dfeee7]' : 'border-[#1e2a35]/8 bg-[#fffdf8]'}`} animate={{ opacity: activeStep === index ? 1 : 0.58, y: activeStep === index ? -2 : 0 }}><p className="font-mono text-xs font-semibold text-[#1e2a35]">{label}</p><p className="mt-1 text-[10px] leading-4 text-[#74808a]">{text}</p></motion.div>)}</div><p className="mt-4 text-[10px] leading-5 text-[#74808a]"><span className="font-mono uppercase tracking-[0.08em] text-[#3869a8]">mask rule:</span> context labels are visible, the query label stays hidden, and no query token can read the held-out answer.</p></div>
}

function ArchitectureSlide({ model, setModel }: { model: ModelKey; setModel: (value: ModelKey) => void }) {
  const detail = modelDetails[model]
  const matrix = modelMatrix.find((item) => item.model === model) as ModelComparison
  return <SlideFrame number="04" kicker="Architectures / innovations across the lineage" tone="cobalt"><div className="slide-wide"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><h2 className="slide-title">One family, several answers to the same bottleneck.</h2><p className="slide-lead max-w-3xl">Use the tabs as a timeline. Each version keeps the learned-algorithm idea, then changes where information is represented, where attention is spent, or what the output head can express.</p></div><span className="rounded-full border border-[#a8c4e6] bg-[#e4edf8] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#3869a8]">innovation timeline</span></div><div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Architecture timeline">{(Object.keys(modelDetails) as ModelKey[]).map((key) => <button key={key} onClick={() => setModel(key)} role="tab" aria-selected={model === key} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold ${model === key ? 'border-[#3869a8] bg-[#e4edf8] text-[#3869a8]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a] hover:text-[#1e2a35]'}`}>{key}</button>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><div className="surface-panel bg-[#fffdf8] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: detail.color }}>{model}</p><p className="mt-1 text-xl font-semibold">{detail.headline}</p></div><span className="rounded-[8px] px-3 py-2 font-mono text-[10px]" style={{ backgroundColor: `${detail.color}16`, color: detail.color }}>{matrix.tasks}</span></div><ArchitecturePath stages={detail.stages} color={detail.color} /><div className="mt-7 grid gap-4 border-t border-[#1e2a35]/10 pt-5 sm:grid-cols-2"><DetailBox label="attention" value={detail.attention} /><DetailBox label="synthetic prior" value={detail.prior} /><DetailBox label="output" value={detail.output} /><DetailBox label="input envelope" value={matrix.maxInput} /></div></div><div className="grid gap-5"><div className="surface-panel bg-[#1e2a35] p-5 text-[#f5f2ea]"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6c34a]">what this version introduced</p><div className="mt-4 grid gap-3">{detail.innovation.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-[#d6dddd]"><Check size={15} className="mt-1 shrink-0 text-[#f6c34a]" />{item}</div>)}</div></div><div className="rounded-[14px] border border-[#efb2a2] bg-[#fbe4dc] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64e3b]">read the boundary</p><p className="mt-3 text-sm leading-6 text-[#7b3328]">{detail.caveat}</p></div></div></div><div className="mt-5 overflow-x-auto rounded-[14px] border border-[#1e2a35]/10 bg-[#ebe7dc] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">side-by-side facts</p><table className="mt-4 min-w-[760px] w-full border-collapse text-left text-xs"><thead><tr className="border-b border-[#1e2a35]/12 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]"><th className="pb-3 pr-4">model</th><th className="pb-3 pr-4">row attention</th><th className="pb-3 pr-4">column attention</th><th className="pb-3 pr-4">input envelope</th><th className="pb-3">output</th></tr></thead><tbody><tr><td className="py-4 pr-4 font-semibold">{matrix.model}</td><td className="py-4 pr-4">{matrix.rowAttention}</td><td className="py-4 pr-4">{matrix.columnAttention}</td><td className="py-4 pr-4">{matrix.maxInput}</td><td className="py-4">{matrix.maxOutput}</td></tr></tbody></table></div></div></SlideFrame>
}

function ArchitecturePath({ stages, color }: { stages: string[]; color: string }) {
  return <div className="mt-8 grid gap-2 sm:grid-cols-4">{stages.map((stage, index) => <div key={stage} className="relative"><div className="flex min-h-[94px] flex-col justify-between rounded-[10px] border p-3" style={{ borderColor: `${color}55`, backgroundColor: `${color}0c` }}><span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color }}>stage {index + 1}</span><span className="text-sm font-semibold leading-5">{stage}</span></div>{index < stages.length - 1 && <ArrowRight className="absolute -right-3 top-10 z-10 hidden bg-[#fffdf8] text-[#74808a] sm:block" size={17} />}</div>)}</div>
}

function ProbabilitySlide({ rows, contextSize, mode, setMode, showHeldOutAnswer, setShowHeldOutAnswer }: { rows: TableRow[]; contextSize: number; mode: ProbabilityMode; setMode: (value: ProbabilityMode) => void; showHeldOutAnswer: boolean; setShowHeldOutAnswer: (value: boolean) => void }) {
  const [driverAge, setDriverAge] = useState(39)
  const [vehicleAge, setVehicleAge] = useState(8)
  const [annualMiles, setAnnualMiles] = useState(15)
  const [urban, setUrban] = useState(true)
  const severity = 2900 + vehicleAge * 95 + annualMiles * 44 + (urban ? 240 : -130)
  const quantiles = severityQuantiles(severity, 950, 430)
  const promptProbability = targetProbability(driverAge, vehicleAge, annualMiles, urban)
  const expectedCost = promptProbability * severity
  return <SlideFrame number="05" kicker="Probability / bring the prompt into an actuarial workflow" tone="coral"><div className="slide-wide"><div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><h2 className="slide-title">The target is not just a class. It can be a probability or a distribution.</h2><p className="slide-lead">Use the same context-query contract from slide 1. The rows in the prompt are evidence; the query row is the policy we want to score. Classification asks for a probability of any claim. Regression asks for a conditional distribution of severity.</p></div><div className="rounded-[14px] border border-[#efb2a2] bg-[#fbe4dc] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64e3b]">same prompt, new head</p><p className="mt-2 text-sm leading-6 text-[#7b3328]">A TFM can use the same in-context evidence pattern for different output spaces. The head changes; the query/context relationship remains.</p></div></div><div className="mt-8 flex gap-2" role="tablist" aria-label="Probability output type"><button onClick={() => setMode('classification')} className={`rounded-full border px-4 py-2.5 text-xs font-semibold ${mode === 'classification' ? 'border-[#d64e3b] bg-[#fbe4dc] text-[#d64e3b]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a]'}`}>classification / claim probability</button><button onClick={() => setMode('regression')} className={`rounded-full border px-4 py-2.5 text-xs font-semibold ${mode === 'regression' ? 'border-[#a36b13] bg-[#f8edc9] text-[#a36b13]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a]'}`}>regression / severity distribution</button></div><div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.92fr]"><PromptMiniTable rows={rows} contextSize={contextSize} showHeldOutAnswer={showHeldOutAnswer} setShowHeldOutAnswer={setShowHeldOutAnswer} /><div className="surface-panel bg-[#fffdf8] p-5">{mode === 'classification' ? <ClassificationOutput probability={promptProbability} /> : <RegressionOutput severity={severity} quantiles={quantiles} />}<div className="mt-6 grid gap-4 border-t border-[#1e2a35]/10 pt-5 sm:grid-cols-3"><Slider label="driver age" value={driverAge} min={18} max={78} step={1} onChange={setDriverAge} suffix={`${driverAge}`} hint="query feature" /><Slider label="vehicle age" value={vehicleAge} min={0} max={18} step={1} onChange={setVehicleAge} suffix={`${vehicleAge}y`} hint="query feature" /><Slider label="annual miles" value={annualMiles} min={2} max={35} step={1} onChange={setAnnualMiles} suffix={`${annualMiles}k`} hint="query feature" /></div><button onClick={() => setUrban(!urban)} className={`mt-4 rounded-full border px-3 py-2 text-xs font-semibold ${urban ? 'border-[#a8c4e6] bg-[#e4edf8] text-[#3869a8]' : 'border-[#1e2a35]/12 text-[#74808a]'}`}>{urban ? 'urban exposure included' : 'rural exposure included'}</button></div></div><div className="mt-5 grid gap-4 md:grid-cols-3"><MetricCard title="context" value={`${contextSize} labeled rows`} text="The visible evidence in the prompt." color="#4775b3" icon={<Table2 size={16} />} /><MetricCard title="query" value="Q-09 / held out" text="Features are visible; target label is withheld." color="#d95b46" icon={<Target size={16} />} /><MetricCard title="actuarial bridge" value={formatMoney(expectedCost)} text="Illustrative frequency x conditional severity." color="#c78924" icon={<BarChart3 size={16} />} /></div><div className="mt-5 overflow-x-auto rounded-[14px] border border-[#1e2a35]/10 bg-[#ebe7dc] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">math link</p><div className="mt-3 overflow-x-auto"><BlockMath math={mode === 'classification' ? equations.tableNextLabel : equations.quantileLoss} /></div><p className="mt-2 text-xs leading-5 text-[#53606a]">For pricing or reserving, the prediction still needs exposure definitions, claim development, calibration checks, temporal validation, and governance. This slide only makes the model contract visible.</p></div></div></SlideFrame>
}

function PromptMiniTable({ rows, contextSize, showHeldOutAnswer, setShowHeldOutAnswer }: { rows: TableRow[]; contextSize: number; showHeldOutAnswer: boolean; setShowHeldOutAnswer: (value: boolean) => void }) {
  return <div className="surface-panel bg-[#1e2a35] p-5 text-[#f5f2ea]"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6c34a]">the prompt carried forward</p><p className="mt-1 text-lg font-semibold">Context rows teach the query</p></div><span className="rounded-full bg-white/10 px-3 py-1.5 font-mono text-[10px] text-[#bbc4c4]">{contextSize} examples</span></div><div className="mt-6 grid gap-2">{rows.slice(0, 6).map((row, index) => <div key={row.id} className={`grid grid-cols-[70px_1fr_1fr_1fr_48px] items-center gap-2 rounded-[8px] px-3 py-3 font-mono text-[10px] ${index < contextSize ? 'bg-white/10 text-[#f5f2ea]' : 'bg-white/4 text-[#788787]'}`}><span className="text-[9px] uppercase tracking-[0.08em]">{index < contextSize ? 'context' : 'unused'}</span><span>age {row.driverAge}</span><span>car {row.vehicleAge}y</span><span>miles {row.annualMiles}k</span><span className={row.claim ? 'text-[#f6c34a]' : 'text-[#82c7bb]'}>{index < contextSize ? row.claim ? 'yes' : 'no' : '—'}</span></div>)}<div className="grid grid-cols-[70px_1fr_1fr_1fr_48px] items-center gap-2 rounded-[8px] border border-[#f6c34a]/50 bg-[#f6c34a]/10 px-3 py-3 font-mono text-[10px] text-[#f6c34a]"><span className="text-[9px] uppercase tracking-[0.08em]">query</span><span>age 39</span><span>car 8y</span><span>miles 15k</span><span>{showHeldOutAnswer ? 'yes' : '?'}</span></div></div><button onClick={() => setShowHeldOutAnswer(!showHeldOutAnswer)} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#f6c34a] hover:underline"><Eye size={14} /> {showHeldOutAnswer ? 'hide the answer again' : 'reveal the held-out answer'}</button><div className="mt-6 border-t border-white/12 pt-5 text-sm leading-6 text-[#bbc4c4]">A predictive distribution is useful because it separates <span className="text-[#f6c34a]">what the model expects</span> from <span className="text-[#f5f2ea]">what happened for this one row</span>.</div></div>
}

function ClassificationOutput({ probability }: { probability: number }) {
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64e3b]">classification head</p><div className="mt-4 flex items-end justify-between gap-5"><div><p className="font-serif text-6xl text-[#d64e3b]">{formatPercent(probability)}</p><p className="mt-2 text-sm text-[#53606a]">P(at least one claim | query, context)</p></div><div className="w-40"><div className="flex items-center justify-between font-mono text-[9px] uppercase text-[#74808a]"><span>claim</span><span>{formatPercent(probability)}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e8e5dc]"><motion.div className="h-full rounded-full bg-[#d95b46]" animate={{ width: `${probability * 100}%` }} /></div><div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase text-[#74808a]"><span>no claim</span><span>{formatPercent(1 - probability)}</span></div></div></div><div className="mt-6 rounded-[10px] bg-[#fbe4dc] p-4 text-sm leading-6 text-[#7b3328]">The number is a probability, not a class label. Log loss and Brier score test whether the probability is discriminative and honest about uncertainty.</div></div>
}

function RegressionOutput({ severity, quantiles }: { severity: number; quantiles: number[] }) {
  const xScale = scaleLinear().domain([Math.min(...quantiles) - 250, Math.max(...quantiles) + 250]).range([24, 330])
  const points = quantiles.map((value, index) => `${xScale(value)},${128 - Math.abs(index - 3) * 14}`).join(' ')
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a36b13]">distributional regression head</p><div className="mt-4 flex items-end justify-between gap-5"><div><p className="font-serif text-5xl text-[#a36b13]">{formatMoney(severity)}</p><p className="mt-2 text-sm text-[#53606a]">central severity estimate, conditional on a claim</p></div><span className="rounded-[10px] bg-[#f8edc9] px-3 py-2 font-mono text-[10px] text-[#8b661c]">quantiles, not one point</span></div><svg className="mt-6 h-auto w-full" viewBox="0 0 355 170" role="img" aria-label="Conditional severity quantile curve"><title>Conditional severity predictive quantiles</title><line x1="24" x2="330" y1="128" y2="128" stroke="#d9d6cc" /><polyline points={points} fill="none" stroke="#c78924" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{quantiles.map((value, index) => <circle key={index} cx={xScale(value)} cy={128 - Math.abs(index - 3) * 14} r="4" fill="#c78924" />)}<text x="24" y="158" fill="#8a9295" fontSize="9" fontFamily="DM Mono">5th percentile</text><text x="260" y="158" fill="#8a9295" fontSize="9" fontFamily="DM Mono">95th percentile</text></svg><div className="mt-4 rounded-[10px] bg-[#f8edc9] p-4 text-sm leading-6 text-[#806b3c]">The context-query contract is unchanged. RMSE and MAE score point summaries; pinball loss, CRPS, and coverage score the predictive distribution and its intervals.</div></div>
}

export function BenchmarksSlide({ benchmarkKey, setBenchmarkKey, metric, setMetric }: { benchmarkKey: BenchmarkKey; setBenchmarkKey: (value: BenchmarkKey) => void; metric: 'elo' | 'improvability'; setMetric: (value: 'elo' | 'improvability') => void }) {
  const note = benchmarkNotes[benchmarkKey]
  const values = benchmarkKey === 'tabArena' ? [...tabArenaSnapshot].sort((first, second) => metric === 'elo' ? second.elo - first.elo : first.improvability - second.improvability) : []
  const maxValue = metric === 'elo' ? 1850 : 20
  return <SlideFrame number="06" kicker="Benchmarks / how evidence is assembled" tone="yellow"><div className="slide-wide"><div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-end"><div><h2 className="slide-title">A leaderboard is a protocol, not a magic number.</h2><p className="slide-lead">TabArena runs many datasets and task splits, scores each model with a task-appropriate metric, then aggregates results. The key question is always: compared under which data, split, tuning, and ensemble regime?</p></div><a href="https://huggingface.co/spaces/TabArena/leaderboard" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1e2a35] px-4 py-3 text-xs font-semibold text-[#f5f2ea] hover:bg-[#3869a8]">open live TabArena board <ExternalLink size={14} /></a></div><div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Benchmark views">{(['tabArena', 'talent', 'openMl'] as BenchmarkKey[]).map((key) => <button key={key} onClick={() => setBenchmarkKey(key)} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold ${benchmarkKey === key ? 'border-[#a36b13] bg-[#f8edc9] text-[#a36b13]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a]'}`}>{benchmarkNotes[key].title}</button>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"><BenchmarkMethodology note={note} benchmarkKey={benchmarkKey} /><div className="surface-panel bg-[#fffdf8] p-5">{benchmarkKey === 'tabArena' ? <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a36b13]">paper-linked TabArena snapshot</p><p className="mt-1 text-lg font-semibold">Default, tuned, and Thinking are different comparisons</p></div><div className="flex rounded-full border border-[#1e2a35]/12 bg-[#f5f2ea] p-1"><button onClick={() => setMetric('elo')} className={`rounded-full px-3 py-2 text-[10px] font-semibold ${metric === 'elo' ? 'bg-[#1e2a35] text-[#f5f2ea]' : 'text-[#74808a]'}`}>Elo</button><button onClick={() => setMetric('improvability')} className={`rounded-full px-3 py-2 text-[10px] font-semibold ${metric === 'improvability' ? 'bg-[#1e2a35] text-[#f5f2ea]' : 'text-[#74808a]'}`}>improvability</button></div></div><div className="mt-7 grid gap-4">{values.map((row) => <BenchmarkBar key={`${row.model}-${row.regime}`} row={row} metric={metric} maxValue={maxValue} />)}</div><div className="mt-6 border-t border-[#1e2a35]/10 pt-4 text-xs leading-5 text-[#74808a]">Snapshot values are transcribed from the TabPFN-3 report&apos;s TabArena table. The linked Hugging Face board is the place to inspect current leaderboard updates.</div></> : <BenchmarkSummary benchmarkKey={benchmarkKey} note={note} />}</div></div><div className="mt-5 grid gap-4 md:grid-cols-3"><MethodStep number="01" title="split" text="Create folds or fixed train / validation / test partitions." icon={<GitBranch size={17} />} /><MethodStep number="02" title="fit" text="Run each model under a named default, tuned, or ensemble regime." icon={<BrainCircuit size={17} />} /><MethodStep number="03" title="aggregate" text="Compare errors per dataset before averaging ranks or Elo." icon={<BarChart3 size={17} />} /></div></div></SlideFrame>
}

function BenchmarkJourneySlide() {
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

function BenchmarkMethodology({ note, benchmarkKey }: { note: typeof benchmarkNotes[BenchmarkKey]; benchmarkKey: BenchmarkKey }) {
  const tabPfn3 = tabArenaSnapshot.find((row) => row.model === 'TabPFN-3')
  const catBoost = tabArenaSnapshot.find((row) => row.model === 'CatBoost')
  const xgBoost = tabArenaSnapshot.find((row) => row.model === 'XGBoost')
  const tabPfn3Elo = tabPfn3?.elo ?? 0
  const catBoostElo = catBoost?.elo ?? 0
  const xgBoostElo = xgBoost?.elo ?? 0

  return (
    <div className="surface-panel bg-[#1e2a35] p-5 text-[#f5f2ea]">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6c34a]">{note.title} / method</p>
      <p className="mt-4 text-sm leading-6 text-[#d6dddd]">{note.summary}</p>
      <div className="mt-6 grid gap-3">{note.protocol.map((item) => <div key={item} className="flex gap-3 text-xs leading-5 text-[#bbc4c4]"><Check size={14} className="mt-0.5 shrink-0 text-[#f6c34a]" />{item}</div>)}</div>
      {benchmarkKey === 'tabArena' && (
        <>
          <div className="mt-6 border-t border-[#f6c34a]/30 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#f6c34a]">signal in this snapshot</p>
            <p className="mt-2 text-sm leading-6 text-[#f5f2ea]">Default TabPFN-3 is {tabPfn3Elo - catBoostElo} Elo ahead of CatBoost and {tabPfn3Elo - xgBoostElo} Elo ahead of XGBoost. That is a clear foundation-model lead over strong tree-based ML baselines; the tuned AutoGluon ensemble is a separate, higher-compute regime.</p>
          </div>
          <div className="mt-6 border-t border-white/12 pt-5 text-xs leading-5 text-[#aeb8b8]">A lower improvability score means a model is closer to the best method on each dataset. Elo is a pairwise rating; it is not an accuracy percentage.</div>
        </>
      )}
    </div>
  )
}

function BenchmarkBar({ row, metric, maxValue }: { row: BenchmarkRow; metric: 'elo' | 'improvability'; maxValue: number }) {
  const value = metric === 'elo' ? row.elo : row.improvability
  const width = metric === 'elo' ? ((value - 1150) / (maxValue - 1150)) * 100 : ((maxValue - value) / maxValue) * 100
  const color = row.family === 'TabPFN' ? '#d95b46' : row.family === 'TabICL' ? '#4775b3' : row.family === 'Tree / AutoML' ? '#c78924' : '#3e8d7e'
  return <div><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold">{row.model}</span><span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]">{row.regime} / {metric === 'elo' ? `${row.elo} Elo` : `${row.improvability}% gap`}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e8e5dc]"><motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${Math.max(8, Math.min(100, width))}%` }} /></div><p className="mt-1 text-[10px] text-[#8a9295]">{row.note}</p></div>
}

function BenchmarkSummary({ benchmarkKey, note }: { benchmarkKey: BenchmarkKey; note: typeof benchmarkNotes[BenchmarkKey] }) {
  const values = benchmarkKey === 'talent' ? [['datasets', '300'], ['binary', '120'], ['multiclass', '80'], ['regression', '100']] : [['datasets', 'OpenML suites'], ['training', 'one pass'], ['baselines', 'trees + AutoML'], ['focus', 'small data']]
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a36b13]">{note.title} / what to read</p><p className="mt-3 text-sm leading-6 text-[#53606a]">{note.summary}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{values.map(([label, value]) => <div key={label} className="rounded-[10px] border border-[#1e2a35]/10 bg-[#f5f2ea] p-4"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a9295]">{label}</p><p className="mt-2 font-serif text-2xl">{value}</p></div>)}</div><div className="mt-7 rounded-[10px] bg-[#e4edf8] p-4 text-xs leading-5 text-[#3869a8]">Use these suites to ask whether a model&apos;s advantage survives a change in dataset size, task type, feature mix, and evaluation metric. No single aggregate rank answers all four.</div></div>
}

function EvidenceSlide() {
  return <SlideFrame number="07" kicker="Evidence / the comparison table" tone="cobalt"><div className="slide-wide"><div className="grid gap-7 lg:grid-cols-[1fr_0.7fr] lg:items-end"><div><h2 className="slide-title">The family resemblance is real. The trade-offs are not.</h2><p className="slide-lead">This table is the compact reference after the lesson. “Maximum” means the recommended or benchmark-validated envelope reported by the source, not a universal hard limit.</p></div><div className="rounded-[14px] border border-[#a8c4e6] bg-[#e4edf8] p-5 text-sm leading-6 text-[#3869a8]"><span className="font-semibold">Read across.</span> Row attention asks whether examples interact. Column attention asks whether values in the same feature interact. ICL asks whether a new query reads a labeled context.</div></div><div className="mt-8 overflow-x-auto rounded-[14px] border border-[#1e2a35]/10 bg-[#fffdf8] p-5"><table className="min-w-[1180px] w-full border-collapse text-left text-xs"><thead><tr className="border-b border-[#1e2a35]/12 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]"><th className="pb-4 pr-4">model</th><th className="pb-4 pr-4">row attention</th><th className="pb-4 pr-4">column attention</th><th className="pb-4 pr-4">tasks</th><th className="pb-4 pr-4">maximum input</th><th className="pb-4 pr-4">maximum output</th><th className="pb-4">main innovation</th></tr></thead><tbody>{modelMatrix.map((row) => <tr key={row.model} className="border-b border-[#1e2a35]/8 align-top last:border-0"><td className="py-4 pr-4"><span className="font-semibold">{row.model}</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]">{row.family}</span></td><td className="py-4 pr-4 leading-5">{row.rowAttention}</td><td className="py-4 pr-4 leading-5">{row.columnAttention}</td><td className="py-4 pr-4 leading-5">{row.tasks}</td><td className="py-4 pr-4 leading-5">{row.maxInput}</td><td className="py-4 pr-4 leading-5">{row.maxOutput}</td><td className="py-4 leading-5 text-[#53606a]">{row.innovation}</td></tr>)}</tbody></table></div><div className="mt-7 grid gap-4 md:grid-cols-3"><ReferenceCard label="row attention" title="Examples exchange information" text="TabPFN v1 treats rows as tokens; later compressed models use row attention after feature embeddings." icon={<Network size={17} />} color="#d95b46" /><ReferenceCard label="column attention" title="A feature learns its distribution" text="TabPFNv2 alternates feature attention; TabICL and TabPFN-3 use inducing attention over columns or cells." icon={<Layers3 size={17} />} color="#3e8d7e" /><ReferenceCard label="output space" title="Classification is not the whole story" text="The papers cover class probabilities, regression distributions, quantiles, many-class decoding, and reusable embeddings." icon={<Target size={17} />} color="#4775b3" /></div><div className="mt-9"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">public reading shelf</p><h3 className="mt-2 font-serif text-3xl">The six source papers</h3></div><BookOpen className="text-[#3869a8]" size={23} /></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{papers.map((paper) => <a key={paper.id} href={paper.sourceUrl} target="_blank" rel="noreferrer" className="group rounded-[12px] border border-[#1e2a35]/10 bg-[#fffdf8] p-4 transition-transform hover:-translate-y-0.5"><div className="flex items-center justify-between gap-2"><span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#3869a8]">{paper.status}</span><ExternalLink size={13} className="text-[#a4a9aa] transition-colors group-hover:text-[#3869a8]" /></div><p className="mt-3 text-sm font-semibold leading-5">{paper.title}</p><p className="mt-2 font-mono text-[9px] text-[#8a9295]">{paper.file} / {paper.date}</p></a>)}</div></div></div></SlideFrame>
}

function DetailedEvidenceTable() {
  return <div className="mx-auto mt-8 max-w-[1500px] px-5 pb-12 lg:px-10"><div className="overflow-x-auto rounded-[14px] border border-[#1e2a35]/10 bg-[#ebe7dc] p-5"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3869a8]">full reference fields</p><p className="mt-2 text-lg font-semibold">Architecture, capability, and operating envelope</p></div><span className="hidden font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295] sm:block">horizontal scroll on narrow screens</span></div><table className="mt-5 min-w-[1900px] w-full border-collapse text-left text-[11px]"><thead><tr className="border-b border-[#1e2a35]/12 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]"><th className="pb-4 pr-4">model / source</th><th className="pb-4 pr-4">row attention</th><th className="pb-4 pr-4">column attention</th><th className="pb-4 pr-4">ICL location</th><th className="pb-4 pr-4">compression</th><th className="pb-4 pr-4">classification</th><th className="pb-4 pr-4">regression</th><th className="pb-4 pr-4">rows</th><th className="pb-4 pr-4">columns</th><th className="pb-4 pr-4">native classes / output</th><th className="pb-4 pr-4">regression form</th><th className="pb-4">missing / categorical</th></tr></thead><tbody>{modelMatrix.map((row) => <tr key={row.model} className="border-b border-[#1e2a35]/8 align-top last:border-0"><td className="py-4 pr-4"><span className="font-semibold">{row.model}</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.08em] text-[#3869a8]">{row.sourceStatus}</span></td><td className="py-4 pr-4 leading-5">{row.rowAttention}</td><td className="py-4 pr-4 leading-5">{row.columnAttention}</td><td className="py-4 pr-4 leading-5">{row.iclStage}</td><td className="py-4 pr-4 leading-5">{row.compression}</td><td className="py-4 pr-4 leading-5">{row.classification}</td><td className="py-4 pr-4 leading-5">{row.regression}</td><td className="py-4 pr-4 leading-5">{row.recommendedRows}</td><td className="py-4 pr-4 leading-5">{row.recommendedColumns}</td><td className="py-4 pr-4 leading-5">{row.nativeClassLimit}</td><td className="py-4 pr-4 leading-5">{row.regressionOutput}</td><td className="py-4 leading-5 text-[#53606a]">{row.missingCategorical}</td></tr>)}</tbody></table><p className="mt-5 text-[10px] leading-5 text-[#74808a]">Source status identifies the paper or report lineage represented here. The envelopes are reported recommendations or validated experiments, not absolute technical impossibilities.</p></div></div>
}

function SlideFrame({ number: legacyNumber, kicker, tone, children }: { number: string; kicker: string; tone: 'coral' | 'yellow' | 'mint' | 'cobalt'; children: ReactNode }) {
  const palette = { coral: ['#d64e3b', '#fbe4dc'], yellow: ['#a36b13', '#f8edc9'], mint: ['#2f8175', '#dfeee7'], cobalt: ['#3869a8', '#e4edf8'] }[tone]
  const number = ({ '01': '02', '02': '03', '03': '04', '04': '05', '05': '06', '06': '01', '07': '07' } as Record<string, string>)[legacyNumber] ?? legacyNumber
  return <div className="mx-auto flex min-h-full max-w-[1500px] flex-col px-5 py-8 lg:px-10 lg:py-12"><div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#74808a]"><span className="flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-semibold" style={{ borderColor: palette[0], color: palette[0] }}>{number}</span><span>{kicker}</span><span className="h-px w-12 bg-[#1e2a35]/15" /></div><div className="mt-7 flex-1">{children}</div>{number === '07' && <DetailedEvidenceTable />}</div>
}

function AnalogyCard({ icon, title, formula, text, tone }: { icon: ReactNode; title: string; formula: string; text: string; tone: 'coral' | 'cobalt' }) {
  const color = tone === 'coral' ? '#d64e3b' : '#3869a8'
  const background = tone === 'coral' ? '#fbe4dc' : '#e4edf8'
  return <div className="rounded-[12px] border border-[#1e2a35]/10 bg-[#fffdf8] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ color, backgroundColor: background }}>{icon}</span>{title}</div><div className="mt-3 overflow-x-auto"><BlockMath math={formula} /></div><p className="text-xs leading-5 text-[#74808a]">{text}</p></div>
}

function Slider({ label, value, min, max, step, onChange, suffix, hint }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix: string; hint?: string }) {
  return <label className="block"><span className="flex items-center justify-between gap-3 text-xs font-semibold text-[#53606a]"><span>{label}</span><output className="font-mono text-[10px] text-[#1e2a35]">{suffix}</output></span><input aria-label={label} className="range-input mt-3 w-full" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span className="mt-2 block text-[10px] leading-4 text-[#8a9295]">{hint}</span></label>
}

function SmallDefinition({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[10px] border border-[#1e2a35]/10 bg-[#f5f2ea] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#a36b13]">{title}</p><p className="mt-2 text-xs font-semibold text-[#53606a]">{text}</p></div>
}

function GraphNode({ x, y, label, sub, color }: { x: number | string; y: number | string; label: string; sub: string; color: string }) {
  const xPosition = Number(x)
  const yPosition = Number(y)
  return <g><rect x={xPosition - 45} y={yPosition - 23} width="90" height="46" rx="9" fill={color} stroke="#1e2a35" strokeOpacity="0.14" /><text x={xPosition} y={yPosition - 3} textAnchor="middle" fill="#1e2a35" fontSize="10" fontWeight="600">{label}</text><text x={xPosition} y={yPosition + 12} textAnchor="middle" fill="#53606a" fontSize="8" fontFamily="DM Mono">{sub}</text></g>
}

function TreeNode({ x, y, label, color }: { x: number | string; y: number | string; label: string; color: string }) {
  const xPosition = Number(x)
  const yPosition = Number(y)
  return <g><rect x={xPosition - 54} y={yPosition - 21} width="108" height="42" rx="8" fill="#fffdf8" stroke="#c78924" strokeWidth="1.5" /><text x={xPosition} y={yPosition + 4} textAnchor="middle" fill={color} fontSize="10" fontWeight="600">{label}</text></g>
}

function Leaf({ x, y, label }: { x: number | string; y: number | string; label: string }) {
  const xPosition = Number(x)
  const yPosition = Number(y)
  return <g><rect x={xPosition - 35} y={yPosition - 17} width="70" height="34" rx="17" fill="#d95b46" /><text x={xPosition} y={yPosition + 4} textAnchor="middle" fill="#fffdf8" fontSize="10" fontWeight="600">{label}</text></g>
}

function MiniGenerator({ x, y, label, sub, color }: { x: number | string; y: number | string; label: string; sub: string; color: string }) {
  const xPosition = Number(x)
  const yPosition = Number(y)
  return <g><rect x={xPosition - 53} y={yPosition - 24} width="106" height="48" rx="10" fill={color} stroke="#1e2a35" strokeOpacity="0.12" /><text x={xPosition} y={yPosition - 3} textAnchor="middle" fill="#1e2a35" fontSize="11" fontWeight="600">{label}</text><text x={xPosition} y={yPosition + 13} textAnchor="middle" fill="#53606a" fontSize="8" fontFamily="DM Mono">{sub}</text></g>
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return <div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a9295]">{label}</p><p className="mt-2 text-xs leading-5 text-[#53606a]">{value}</p></div>
}

function MetricCard({ title, value, text, color, icon }: { title: string; value: string; text: string; color: string; icon: ReactNode }) {
  return <div className="rounded-[12px] border border-[#1e2a35]/10 bg-[#fffdf8] p-4"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color }}>{title}</p><span style={{ color }}>{icon}</span></div><p className="mt-3 font-serif text-2xl">{value}</p><p className="mt-2 text-xs leading-5 text-[#74808a]">{text}</p></div>
}

function MethodStep({ number, title, text, icon }: { number: string; title: string; text: string; icon: ReactNode }) {
  return <div className="rounded-[12px] border border-[#1e2a35]/10 bg-[#fffdf8] p-4"><div className="flex items-center justify-between"><span className="font-mono text-[9px] text-[#d64e3b]">{number}</span><span className="text-[#a36b13]">{icon}</span></div><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-[#74808a]">{text}</p></div>
}

function ReferenceCard({ label, title, text, icon, color }: { label: string; title: string; text: string; icon: ReactNode; color: string }) {
  return <div className="rounded-[12px] border border-[#1e2a35]/10 bg-[#fffdf8] p-4"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color }}>{label}</p><span style={{ color }}>{icon}</span></div><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-[#74808a]">{text}</p></div>
}
