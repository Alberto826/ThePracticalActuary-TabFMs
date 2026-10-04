import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  Table2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { heroProbability, makeTableRows } from './lib/simulations'
import { ArchitectureSlide, type ModelKey } from './slides/ArchitectureSlide'
import { AttentionSlide, type AttentionPhase } from './slides/AttentionSlide'
import { BenchmarkJourneySlide } from './slides/BenchmarkJourneySlide'
import { EvidenceSlide } from './slides/EvidenceSlide'
import { ProbabilitySlide, type ProbabilityMode } from './slides/ProbabilitySlide'
import { PosteriorPredictiveSlide } from './slides/PosteriorPredictiveSlide'
import { PriorSlide } from './slides/PriorSlide'
import { PromptSlide } from './slides/PromptSlide'

type SlideId = 'prompt' | 'ppd' | 'prior' | 'attention' | 'architectures' | 'probability' | 'benchmarks' | 'evidence'

const slides: { id: SlideId; number: string; label: string; title: string }[] = [
  { id: 'benchmarks', number: '01', label: 'The journey', title: 'From GLMs to tabular foundation models' },
  { id: 'prompt', number: '02', label: 'The prompt', title: 'A table can be a prompt' },
  { id: 'ppd', number: '03', label: 'Posterior predictive', title: 'The distribution PFNs learn to approximate' },
  { id: 'prior', number: '04', label: 'The prior', title: 'Before the model sees your table' },
  { id: 'attention', number: '05', label: 'In context', title: 'How attention turns rows into a prediction' },
  { id: 'architectures', number: '06', label: 'Architectures', title: 'The evolution of the table reader' },
  { id: 'probability', number: '07', label: 'Probability', title: 'The output is a distribution' },
  { id: 'evidence', number: '08', label: 'Evidence', title: 'Compare the model families' },
]

function getSlideIndexFromHash() {
  if (typeof window === 'undefined') return 0
  const slideId = window.location.hash.slice(1).replace(/^slide-/, '')
  const index = slides.findIndex((slide) => slide.id === slideId)
  return index === -1 ? 0 : index
}

function getSlideHash(index: number) {
  return `#slide-${slides[index].id}`
}

export default function SlideApp() {
  const rows = makeTableRows()
  const [activeIndex, setActiveIndex] = useState(getSlideIndexFromHash)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contextSize, setContextSize] = useState(3)
  const [showHeldOutAnswer, setShowHeldOutAnswer] = useState(false)
  const [attentionPhase, setAttentionPhase] = useState<AttentionPhase>('input')
  const [attentionPlaying, setAttentionPlaying] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelKey>('TabICL')
  const [probabilityMode, setProbabilityMode] = useState<ProbabilityMode>('classification')

  const activeSlide = slides[activeIndex]
  const goToSlide = (index: number) => {
    const nextIndex = Math.min(slides.length - 1, Math.max(0, index))
    setActiveIndex(nextIndex)
    setMobileMenuOpen(false)
    const nextHash = getSlideHash(nextIndex)
    if (window.location.hash !== nextHash) window.location.hash = nextHash
  }

  useEffect(() => {
    const syncSlideFromHash = () => {
      const index = getSlideIndexFromHash()
      const canonicalHash = getSlideHash(index)
      if (window.location.hash !== canonicalHash) window.history.replaceState(null, '', canonicalHash)
      setActiveIndex(index)
      setMobileMenuOpen(false)
    }

    syncSlideFromHash()
    window.addEventListener('hashchange', syncSlideFromHash)
    return () => window.removeEventListener('hashchange', syncSlideFromHash)
  }, [])

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
    const phaseOrder: AttentionPhase[] = ['input', 'tfcol', 'cell-embeddings', 'tfrow', 'row-embeddings', 'icl', 'contextualized-vectors', 'decode']
    const timer = window.setInterval(() => {
      setAttentionPhase((currentPhase) => phaseOrder[(phaseOrder.indexOf(currentPhase) + 1) % phaseOrder.length])
    }, 3000)
    return () => window.clearInterval(timer)
  }, [attentionPlaying])

  const probability = heroProbability(rows, contextSize)

  return (
    <div className="slide-app min-h-screen overflow-hidden bg-[#f5f2ea] text-[#1e2a35]">
      <DeckHeader activeIndex={activeIndex} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} goToSlide={goToSlide} />
      <main className="deck-main">
        <AnimatePresence mode="wait">
          <motion.div id={`slide-${activeSlide.id}`} key={activeSlide.id} className="slide-scroll" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
            {activeSlide.id === 'prompt' && <PromptSlide rows={rows} contextSize={contextSize} setContextSize={setContextSize} probability={probability} showHeldOutAnswer={showHeldOutAnswer} setShowHeldOutAnswer={setShowHeldOutAnswer} />}
            {activeSlide.id === 'ppd' && <PosteriorPredictiveSlide />}
            {activeSlide.id === 'prior' && <PriorSlide />}
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