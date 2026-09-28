import { BlockMath, InlineMath } from 'react-katex'
import { ArrowDown, ExternalLink } from 'lucide-react'
import { SlideFrame } from './shared'

const notationStyles = {
  coral: 'bg-[#fbe4dc] text-[#d64e3b]',
  cobalt: 'bg-[#e4edf8] text-[#3869a8]',
  yellow: 'bg-[#f8edc9] text-[#a36b13]',
  mint: 'bg-[#dfeee7] text-[#2f8175]',
} as const

export function PosteriorPredictiveSlide() {
  return (
    <SlideFrame number="08" kicker="Posterior predictive distribution / the Bayesian target" tone="cobalt">
      <div className="slide-wide">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h2 className="slide-title">Bayesian prediction averages over the tasks that remain <em>plausible.</em></h2>
            <p className="slide-lead max-w-3xl">The paper "Transformers Can Do Bayesian Inference" (Müller et al, 2022) frames supervised prediction as a Bayesian problem, then shows how a Prior-Data Fitted Network can learn the resulting distribution directly from sampled tasks and datasets.</p>
          </div>
          <a href="https://arxiv.org/html/2112.10510v7" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1e2a35] px-4 py-3 text-xs font-semibold text-[#f5f2ea] hover:bg-[#3869a8]">paper / sections 2-3 <ExternalLink size={14} /></a>
        </div>

        <section className="mt-8 rounded-[14px] border border-[#a8c4e6] bg-[#e4edf8] p-5" aria-labelledby="ppd-section-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3869a8]">part 1 / PPDs</p>
              <h3 id="ppd-section-title" className="mt-1 text-2xl font-semibold">The predictive target is an average over hidden rulebooks.</h3>
            </div>
            <span className="rounded-full bg-[#fffdf8] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#3869a8]">posterior predictive distribution</span>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-[#53606a]">In this work, we model the output <InlineMath math={String.raw`y`} /> for a new input <InlineMath math={String.raw`x`} /> based on a supervised dataset of arbitrary size <InlineMath math={String.raw`n`} />. The dataset is a collection of observed input-output pairs:</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-[10px] bg-[#fffdf8] px-4 py-3 text-[#1e2a35]"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a9295]">supervised dataset</p><ResponsiveMath className="mt-1" desktop={String.raw`\mathcal{D}=\{(x_i,y_i)\}_{i=1}^{n}`} mobile={String.raw`\mathcal{D}=\{(x_i,y_i)\}_{i=1}^{n}`} /><p className="text-xs leading-5 text-[#53606a]">Here <InlineMath math={String.raw`y_i`} /> is the output observed for <InlineMath math={String.raw`x_i`} />.</p></div>
            <div className="rounded-[10px] border border-[#a8c4e6] bg-[#f8fbff] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#3869a8]">Bayesian update</p>
              <p className="mt-2 text-xs leading-5 text-[#53606a]">We place a prior <InlineMath math={String.raw`p(\phi)`} /> over the latent variable <InlineMath math={String.raw`\phi`} />, the hidden rulebook or data-generating function. After observing <InlineMath math={String.raw`\mathcal{D}`} />, Bayes&apos; theorem gives the posterior:</p>
              <ResponsiveMath className="mt-2" desktop={String.raw`p(\phi\mid\mathcal{D})\propto p(\mathcal{D}\mid\phi)\,p(\phi)`} mobile={String.raw`\begin{aligned}p(\phi\mid\mathcal{D})&\propto p(\mathcal{D}\mid\phi)\\&\quad{}\times p(\phi)\end{aligned}`} />
            </div>
          </div>
          <div className="mt-4 rounded-[10px] border border-[#3869a8]/25 bg-[#fffdf8] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#3869a8]">the PPD equation</p>
            <p className="mt-2 text-xs leading-5 text-[#53606a]">The crucial distribution for prediction averages the task-specific predictions using the posterior weight of each task:</p>
            <AnnotatedPPDFormula />
          </div>
          <p className="mt-4 border-t border-[#3869a8]/20 pt-4 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#3869a8]">Interpretation:</span> the integral carries uncertainty about which hidden rulebook generated the data into the prediction for the new input. A PPD is not one best task; it is the distribution of predictions after averaging over plausible tasks.</p>
        </section>

        <section className="mt-6 rounded-[14px] border border-[#a8d2c3] bg-[#dfeee7] p-5" aria-labelledby="pfn-section-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f8175]">part 2 / approximating the PPD with PFNs</p>
              <h3 id="pfn-section-title" className="mt-1 text-2xl font-semibold">Learn the Bayesian prediction rule from prior-generated holdouts.</h3>
            </div>
            <span className="rounded-full bg-[#fffdf8] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#2f8175]">PFN objective</span>
          </div>
          <div className="mt-4 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm leading-6 text-[#53606a]">Consider a parameterized model <InlineMath math={String.raw`q_\theta`} /> that accepts a dataset <InlineMath math={String.raw`\mathcal{D}`} /> and a query <InlineMath math={String.raw`x`} />, then predicts a distribution over possible values of <InlineMath math={String.raw`y`} />. Many neural architectures can implement this contract; the paper uses a Transformer variant for reliable set-valued inputs.</p>
              <div className="mt-4 rounded-[10px] bg-[#fffdf8] p-4"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#2f8175]">the learned approximation</p><ResponsiveMath className="mt-2" desktop={String.raw`q_\theta(y\mid x,\mathcal{D})\approx p(y\mid x,\mathcal{D})`} mobile={String.raw`\begin{aligned}q_\theta(y\mid x,\mathcal{D})\\&\approx p(y\mid x,\mathcal{D})\end{aligned}`} /><p className="text-xs leading-5 text-[#53606a]">The model receives the context dataset and query, and returns an approximation to the PPD in one forward pass.</p></div>
            </div>
            <div className="rounded-[10px] border border-[#d64e3b]/20 bg-[#fffdf8] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#d64e3b]">Prior-Data Negative Log-Likelihood</p><p className="mt-1 text-lg font-semibold">Train by scoring a hidden answer.</p></div><span className="rounded-full bg-[#fbe4dc] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#d64e3b]">cross-entropy</span></div>
              <p className="mt-3 text-sm leading-6 text-[#53606a]">We sample a dataset from the prior, hold out one labeled pair <InlineMath math={String.raw`(x,y)`} />, and penalize the model when it assigns the true <InlineMath math={String.raw`y`} /> too little probability:</p>
              <ResponsiveMath className="mt-3 rounded-[10px] bg-[#f5f2ea] px-3 py-2" desktop={String.raw`\ell_\theta=\mathbb{E}_{\mathcal{D}\cup\{(x,y)\}\sim p(\mathcal{D})}\left[-\log q_\theta(y\mid x,\mathcal{D})\right]`} mobile={String.raw`\begin{aligned}\ell_\theta&=\mathbb{E}_{\mathcal{D}\cup\{(x,y)\}\sim p(\mathcal{D})}\\&\quad\left[-\log q_\theta(y\mid x,\mathcal{D})\right]\end{aligned}`} />
              <p className="mt-3 text-xs leading-5 text-[#74808a]">Repeating this over prior-generated datasets teaches <InlineMath math={String.raw`q_\theta`} /> to assign high probability to the held-out outcomes that the exact PPD would favor.</p>
            </div>
          </div>
          <div className="mt-5 rounded-[10px] border border-[#2f8175]/20 bg-[#fffdf8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#2f8175]">Insight 1 / what the objective means</p><h4 className="mt-1 text-lg font-semibold">Prior-Data NLL is expected cross-entropy between the PPD and its approximation.</h4></div><span className="rounded-full bg-[#dfeee7] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#2f8175]">same target, different view</span></div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[#53606a]">The algebra turns the loss on individual sampled outcomes into an average divergence between the true posterior predictive distribution and <InlineMath math={String.raw`q_\theta`} />:</p>
            <div className="mt-4 grid gap-2">
              <DerivationStep number="1" label="expand the prior-data expectation" formula={String.raw`\ell_\theta=-\int_{\mathcal{D},x,y}p(x,y,\mathcal{D})\log q_\theta(y\mid x,\mathcal{D})`} mobileFormula={String.raw`\begin{aligned}\ell_\theta&=-\int_{\mathcal{D},x,y}p(x,y,\mathcal{D})\\&\quad{}\times\log q_\theta(y\mid x,\mathcal{D})\end{aligned}`} />
              <DerivationStep number="2" label="factor out the data and query" formula={String.raw`=-\int_{\mathcal{D},x}p(x,\mathcal{D})\int_y p(y\mid x,\mathcal{D})\log q_\theta(y\mid x,\mathcal{D})`} mobileFormula={String.raw`\begin{aligned}&=-\int_{\mathcal{D},x}p(x,\mathcal{D})\\&\quad{}\times\int_y p(y\mid x,\mathcal{D})\\&\quad{}\times\log q_\theta(y\mid x,\mathcal{D})\end{aligned}`} />
              <DerivationStep number="3" label="recognize cross-entropy" formula={String.raw`=\int_{\mathcal{D},x}p(x,\mathcal{D})H\left(p(\cdot\mid x,\mathcal{D}),q_\theta(\cdot\mid x,\mathcal{D})\right)`} mobileFormula={String.raw`\begin{aligned}&=\int_{\mathcal{D},x}p(x,\mathcal{D})\\&\quad{}\times H\bigl(p(\cdot\mid x,\mathcal{D}),\\&\qquad q_\theta(\cdot\mid x,\mathcal{D})\bigr)\end{aligned}`} />
              <DerivationStep number="4" label="rewrite as an expectation over prior-data" formula={String.raw`=\mathbb{E}_{x,\mathcal{D}\sim p(\mathcal{D})}\left[H\left(p(\cdot\mid x,\mathcal{D}),q_\theta(\cdot\mid x,\mathcal{D})\right)\right]`} mobileFormula={String.raw`\begin{aligned}&=\mathbb{E}_{x,\mathcal{D}\sim p(\mathcal{D})}\\&\quad{}[H\bigl(p(\cdot\mid x,\mathcal{D}),\\&\qquad q_\theta(\cdot\mid x,\mathcal{D})\bigr)]\end{aligned}`} />
              <DerivationStep number="5" label="decompose into entropy plus Kullback-Leibler (KL) divergence" formula={String.raw`=\mathbb{E}_{x,\mathcal{D}\sim p(\mathcal{D})}\left[H\left(p(\cdot\mid x,\mathcal{D})\right)+\mathrm{KL}\left(p(\cdot\mid x,\mathcal{D})\parallel q_\theta(\cdot\mid x,\mathcal{D})\right)\right]`} mobileFormula={String.raw`\begin{aligned}&=\mathbb{E}_{x,\mathcal{D}\sim p(\mathcal{D})}\bigl[H\bigl(p(\cdot\mid x,\mathcal{D})\bigr)\\&\quad{}+\mathrm{KL}\bigl(p(\cdot\mid x,\mathcal{D})\\&\qquad{}\parallel q_\theta(\cdot\mid x,\mathcal{D})\bigr)\bigr]\end{aligned}`} />
            </div>
            <p className="mt-4 border-t border-[#1e2a35]/10 pt-4 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#2f8175]">Consequence:</span> minimizing the Prior-Data NLL trains the PFN to match the full predictive distribution, not merely its most likely answer.</p>
          </div>
        </section>

        <div className="mt-5 border-t border-[#1e2a35]/10 pt-5 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#3869a8]">The bridge:</span> Part 1 defines the Bayesian target <InlineMath math={String.raw`p(y\mid x,\mathcal{D})`} />. Part 2 shows how PFNs learn <InlineMath math={String.raw`q_\theta`} /> to approximate it by repeatedly hiding outcomes from prior-generated datasets.</div>
      </div>
    </SlideFrame>
  )
}

function AnnotatedPPDFormula() {
  return <div className="mt-4 rounded-[10px] bg-[#f5f2ea] p-3">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <VariableAnnotation symbol={String.raw`y`} label="output" description="for the new input" tone="coral" />
      <VariableAnnotation symbol={String.raw`x`} label="new input" description="the query" tone="cobalt" />
      <VariableAnnotation symbol={String.raw`\phi`} label="latent task" description="hidden rulebook / generator" tone="yellow" />
      <VariableAnnotation symbol={String.raw`\mathcal{D}`} label="dataset" description="observed labeled pairs" tone="mint" />
    </div>
    <ResponsiveMath className="mt-2 rounded-[8px] bg-[#fffdf8] px-2 py-4" desktop={String.raw`p(\color{#d64e3b}{y}\mid\color{#3869a8}{x},\color{#2f8175}{\mathcal{D}})
        =\int_{\color{#a36b13}{\phi}}p(\color{#d64e3b}{y}\mid\color{#3869a8}{x},\color{#2f8175}{\mathcal{D}},\color{#a36b13}{\phi})\,p(\color{#a36b13}{\phi}\mid\color{#2f8175}{\mathcal{D}})\,d\color{#a36b13}{\phi} \\
        =\int_{\color{#a36b13}{\phi}}p(\color{#d64e3b}{y}\mid\color{#3869a8}{x},\color{#a36b13}{\phi})\,p(\color{#a36b13}{\phi}\mid\color{#2f8175}{\mathcal{D}})\,d\color{#a36b13}{\phi}`}
        mobile={String.raw`\begin{aligned}p(\color{#d64e3b}{y}\mid\color{#3869a8}{x},\color{#2f8175}{\mathcal{D}})&=\int_{\color{#a36b13}{\phi}}p(\color{#d64e3b}{y}\mid\color{#3869a8}{x},\color{#a36b13}{\phi})\\&\quad{}\times p(\color{#a36b13}{\phi}\mid\color{#2f8175}{\mathcal{D}})\,d\color{#a36b13}{\phi}\end{aligned}`} />
    <p className="mt-2 text-center text-[10px] leading-4 text-[#74808a]">Arrows point from each definition to its color-matched variable in the equation.</p>
  </div>
}

function VariableAnnotation({ symbol, label, description, tone }: { symbol: string; label: string; description: string; tone: keyof typeof notationStyles }) {
  return <div className={`rounded-[8px] p-2 text-center ${notationStyles[tone]}`}><div className="flex items-center justify-center gap-1.5"><span className="font-serif text-lg"><InlineMath math={symbol} /></span><span className="font-mono text-[8px] uppercase tracking-[0.06em]">{label}</span></div><p className="mt-1 text-[10px] leading-4 text-[#53606a]">{description}</p><ArrowDown className="mx-auto mt-1" size={14} aria-hidden="true" /></div>
}

function DerivationStep({ number, label, formula, mobileFormula }: { number: string; label: string; formula: string; mobileFormula: string }) {
  return <div className="grid min-w-0 gap-2 rounded-[8px] border border-[#1e2a35]/8 bg-[#f5f2ea] p-3 sm:grid-cols-[170px_1fr] sm:items-center"><div className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dfeee7] font-mono text-[9px] font-semibold text-[#2f8175]">{number}</span><span className="font-mono text-[9px] uppercase leading-4 tracking-[0.06em] text-[#74808a]">{label}</span></div><ResponsiveMath className="min-w-0 text-[#1e2a35]" desktop={formula} mobile={mobileFormula} /></div>
}

function ResponsiveMath({ desktop, mobile, className = '' }: { desktop: string; mobile: string; className?: string }) {
  return <div className={`formula-wrap ${className}`}><div className="hidden sm:block"><BlockMath math={desktop} /></div><div className="sm:hidden"><BlockMath math={mobile} /></div></div>
}
