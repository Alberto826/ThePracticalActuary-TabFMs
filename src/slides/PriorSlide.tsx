import { BlockMath, InlineMath } from 'react-katex'
import { ArrowRight, Database, GitBranch, Layers3 } from 'lucide-react'
import { SlideFrame } from './shared'

export function PriorSlide() {
  return (
    <SlideFrame number="02" kicker="The prior / one pre-training episode" tone="yellow">
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 grid min-w-0">
          <h2 className="slide-title">Before the model sees a table, the simulator makes a <em>tiny world.</em></h2>
          <p className="slide-lead">Pre-training repeats one simple recipe millions of times: 1) choose a hidden rulebook, a data generator, 2) generate a small table, hide one answer, 3) model outputs distribution, 4) and penalize the model for assigning the hidden answer too little probability.</p>
          <div className="mt-5 border-l-2 border-[#c78924] pl-5 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#8b661c]">The key distinction:</span> the distributions describe how the simulator behaves across many episodes. A single episode contributes ordinary numbers to the model&apos;s input.</div>
          <div className="mt-5 min-w-0 overflow-hidden rounded-[14px] border border-[#e2c679] bg-[#f8edc9] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a36b13]">1 / <InlineMath math={String.raw`p(\phi)`} /></span><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#8b661c]">sample one hidden rulebook</span></div>
            <p className="mt-4 text-sm leading-6 text-[#806b3c]"><span className="font-semibold text-[#7e5a18]"><InlineMath math={String.raw`p(\phi)`} /></span> is the simulator&apos;s distribution over possible rulebooks. For this one episode, it happens to draw a simple causal housing model where <InlineMath math={String.raw`x^{(1)}`}/> is the size of the house in <InlineMath math={String.raw`m^{2}`}/>, <InlineMath math={String.raw`x^{(2)}`}/> is the number of beds, and <InlineMath math={String.raw`y`}/> is the house price:</p>
            <div className="mt-4 grid min-w-0 gap-2 overflow-hidden rounded-[10px] bg-[#fff7d9] px-4 py-3 text-[#1e2a35]"><BlockMath math={String.raw`x^{(2)}\sim\operatorname{Poisson}(3)`} /><BlockMath math={String.raw`x^{(1)}=500x^{(2)}+\epsilon_x`} /><BlockMath math={String.raw`y=100x^{(1)}+20{,}000x^{(2)}+\epsilon_y`} /></div>
            <p className="mt-4 text-xs leading-5 text-[#7e5a18]"><span className="font-semibold">What gets passed forward?</span> One concrete draw, <InlineMath math={String.raw`\phi_1`} />: these formulas plus the sampled noise values. The probability distribution <InlineMath math={String.raw`p(\phi)`} /> itself is not a column in the table.</p>
          </div>
        </div>
        <div className="lg:col-span-3 grid min-w-0 gap-4">
          <div className="surface-panel overflow-hidden bg-[#fffdf8] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3869a8]">2 / <InlineMath math={String.raw`p(x)`} /></p><p className="mt-1 text-lg font-semibold">One generated episode</p></div><span className="rounded-full bg-[#e4edf8] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#3869a8]">D + query</span></div>
            <p className="mt-4 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#3869a8]"><InlineMath math={String.raw`p(x)`} /></span> is the distribution used to draw feature rows. Here the simulator draws four houses from the rulebook: three become context D, and one becomes the query.</p>
            <div className="mt-5 overflow-x-auto"><table className="min-w-[500px] w-full border-collapse text-left text-[11px]"><thead><tr className="border-b border-[#1e2a35]/10 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]"><th className="pb-3 pr-3 font-medium">row</th><th className="pb-3 pr-3 font-medium">feature 1 / sq ft</th><th className="pb-3 pr-3 font-medium">feature 2 / beds</th><th className="pb-3 font-medium">target / price</th></tr></thead><tbody><tr className="border-b border-[#1e2a35]/7"><td className="py-3 pr-3 font-mono font-semibold text-[#2f8175]">D1</td><td className="py-3 pr-3 font-mono">1,050</td><td className="py-3 pr-3 font-mono">2</td><td className="py-3 font-mono">$143k</td></tr><tr className="border-b border-[#1e2a35]/7"><td className="py-3 pr-3 font-mono font-semibold text-[#2f8175]">D2</td><td className="py-3 pr-3 font-mono">1,480</td><td className="py-3 pr-3 font-mono">3</td><td className="py-3 font-mono">$209k</td></tr><tr className="border-b border-[#1e2a35]/7"><td className="py-3 pr-3 font-mono font-semibold text-[#2f8175]">D3</td><td className="py-3 pr-3 font-mono">2,020</td><td className="py-3 pr-3 font-mono">4</td><td className="py-3 font-mono">$281.5k</td></tr><tr className="bg-[#e4edf8] text-[#3869a8]"><td className="py-3 pr-3 font-mono font-semibold">Q</td><td className="py-3 pr-3 font-mono">1,510</td><td className="py-3 pr-3 font-mono">3</td><td className="py-3 font-mono font-semibold">hidden</td></tr></tbody></table></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-[10px] bg-[#dfeee7] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#2f8175]">context D</p><p className="mt-1 text-xs font-semibold">the first 3 rows</p></div><div className="rounded-[10px] bg-[#e4edf8] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#3869a8]">query <InlineMath math={String.raw`x_{\mathrm{test}}`} /></p><p className="mt-1 font-mono text-xs font-semibold">(1,510, 3)</p></div></div>
            <p className="mt-4 text-xs leading-5 text-[#74808a]">The simulator knows the hidden answer too: <InlineMath math={String.raw`y_{\mathrm{test}}=\text{\$212k}`} />. The model receives only the query features, not that price.</p>
          </div>
          <div className="grid min-w-0 gap-4">
            <div className="min-w-0 rounded-[14px] border border-[#a8d2c3] bg-[#dfeee7] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f8175]">3 / <InlineMath math={String.raw`p(y\mid x,D)`} /></p><p className="mt-3 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#2f8175]"><InlineMath math={String.raw`p(y\mid x,D)`} /></span> asks what prices are plausible after seeing D. The model outputs an approximation <InlineMath math={String.raw`q_\theta`} />.</p><div className="mt-4 grid grid-cols-3 gap-1.5"><div className="rounded-[8px] bg-[#fbe4dc] p-2 text-center"><p className="font-mono text-[8px] text-[#8a4d43]">low</p><p className="mt-1 font-serif text-lg text-[#d64e3b]">3.5%</p></div><div className="rounded-[8px] bg-[#f8edc9] p-2 text-center"><p className="font-mono text-[8px] text-[#8b661c]">medium</p><p className="mt-1 font-serif text-lg text-[#a36b13]">94.2%</p></div><div className="rounded-[8px] bg-[#e4edf8] p-2 text-center"><p className="font-mono text-[8px] text-[#3869a8]">high</p><p className="mt-1 font-serif text-lg text-[#3869a8]">2.3%</p></div></div><QueryDistributionFormula /></div>
            <div className="min-w-0 rounded-[14px] border border-[#efb2a2] bg-[#fbe4dc] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64e3b]">4 / loss on this sample</p><p className="mt-3 text-sm leading-6 text-[#8a4d43]">$212k is in the middle bin, so y = [0, 1, 0]. Cross-entropy checks the probability assigned to that bin.</p><LossFormula /><p className="mt-3 font-mono text-[10px] font-semibold text-[#7b3328]">bad guess: -log(0.05) = 2.996</p></div>
          </div>
        </div>
      </div>
      <div className="mt-5 border-t border-[#1e2a35]/10 pt-5 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#8b661c]">In one sentence:</span> <InlineMath math={String.raw`p(\phi)`} /> chooses the hidden world, <InlineMath math={String.raw`p(x)`} /> supplies the rows, and <InlineMath math={String.raw`p(y\mid x,D)`} /> is the distribution the model learns to predict for the held-out row. The distributions are not extra input columns; repeated sampled tables and their losses carve the pattern into the model&apos;s weights.</div>
      <section className="mt-6 rounded-[14px] border border-[#a8c4e6] bg-[#e4edf8] p-5" aria-labelledby="scm-scaling-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3869a8]">5 / scaling the prior</p>
          <div className="mt-5 border-t border-[#3869a8]/20 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3869a8]">inside the sampler</p><h4 className="mt-1 text-lg font-semibold">A hidden rulebook is sampled in four parts.</h4></div>
              <span className="rounded-full bg-[#fffdf8] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#3869a8]">new SCM per episode</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <SamplerStep number="1" title="sample nodes" formula={String.raw`d\sim p(d)`} text="Choose how many variables the table will contain." tone="yellow" />
              <SamplerStep number="2" title="sample edges" formula={String.raw`G\sim p(G\mid d)`} text="Choose a directed acyclic graph: which variables can cause which others." tone="mint" />
              <SamplerStep number="3" title="sample functions" formula={String.raw`X_j=f_j(\operatorname{pa}_j,\epsilon_j)`} text="Assign a mechanism to every node using its parent values." tone="cobalt" />
              <SamplerStep number="4" title="sample noise" formula={String.raw`\epsilon_j\sim p(\epsilon_j)`} text="Draw fresh disturbances so each table is a new episode." tone="coral" />
            </div>
          </div>
          <div className="mt-5 border-t border-[#3869a8]/20 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3869a8]">other hidden rulebooks</p><h4 className="mt-1 text-lg font-semibold">Change the graph, and the prediction task changes with it.</h4></div>
              <p className="max-w-xl text-xs leading-5 text-[#53606a]">The prior can generate many causal stories, not just housing. Each graph becomes a different family of synthetic tables and target relationships.</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <RulebookGraph
                title="customer churn"
                subtitle="4 nodes / fork + chain"
                equation={String.raw`\operatorname{churn}=f(\operatorname{tenure},\operatorname{support},\operatorname{price},\epsilon)`}
                description="Tenure changes support needs and churn directly; plan price adds another route to the outcome."
                nodes={[{ label: 'tenure', x: 10, y: 18, tone: 'mint' }, { label: 'plan price', x: 10, y: 86, tone: 'yellow' }, { label: 'support', x: 108, y: 18, tone: 'cobalt' }, { label: 'churn', x: 208, y: 52, tone: 'coral' }]}
                edges={[{ x1: 90, y1: 31, x2: 108, y2: 31 }, { x1: 188, y1: 32, x2: 208, y2: 59 }, { x1: 90, y1: 42, x2: 208, y2: 67 }, { x1: 90, y1: 99, x2: 208, y2: 74 }]}
              />
              <RulebookGraph
                title="insurance cost"
                subtitle="5 nodes / common cause"
                equation={String.raw`\operatorname{risk}=f(\operatorname{age},\operatorname{miles},\epsilon)`}
                description="Driver age and mileage shape latent risk, which drives both claim occurrence and cost."
                nodes={[{ label: 'driver age', x: 10, y: 18, tone: 'mint' }, { label: 'mileage', x: 10, y: 86, tone: 'yellow' }, { label: 'risk', x: 108, y: 52, tone: 'cobalt' }, { label: 'claim', x: 208, y: 18, tone: 'coral' }, { label: 'cost', x: 208, y: 86, tone: 'coral' }]}
                edges={[{ x1: 90, y1: 31, x2: 108, y2: 65 }, { x1: 90, y1: 99, x2: 108, y2: 65 }, { x1: 190, y1: 65, x2: 208, y2: 31 }, { x1: 190, y1: 65, x2: 208, y2: 99 }, { x1: 249, y1: 44, x2: 249, y2: 86 }]}
              />
              <RulebookGraph
                title="loan default"
                subtitle="4 nodes / mediated effect"
                equation={String.raw`\operatorname{default}=f(\operatorname{debt},\operatorname{rate},\epsilon)`}
                description="Income and debt set the rate; debt and the resulting rate shape default risk."
                nodes={[{ label: 'income', x: 10, y: 18, tone: 'mint' }, { label: 'debt', x: 10, y: 86, tone: 'yellow' }, { label: 'rate', x: 108, y: 52, tone: 'cobalt' }, { label: 'default', x: 208, y: 52, tone: 'coral' }]}
                edges={[{ x1: 90, y1: 31, x2: 108, y2: 65 }, { x1: 90, y1: 99, x2: 108, y2: 65 }, { x1: 90, y1: 99, x2: 208, y2: 65 }, { x1: 190, y1: 65, x2: 208, y2: 65 }]}
              />
            </div>
          </div>
            <h3 id="scm-scaling-title" className="mt-1 text-2xl font-semibold">Structural Causal Models make synthetic pre-training scalable.</h3>
          </div>
          <span className="rounded-full bg-[#fffdf8] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#3869a8]">SCM → synthetic data</span>
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-[#53606a]">Instead of hand-building every table, sample a causal graph, its structural equations, and fresh noise. The simulator then produces a new context-and-query episode for every training step.</p>
        <div className="mt-5 grid min-w-0 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)_auto_minmax(0,1fr)]">
          <div className="min-w-0 rounded-[10px] bg-[#fffdf8] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f8edc9] text-[#a36b13]"><GitBranch size={17} /></span>sample a causal world</div>
            <div className="mt-3 overflow-hidden rounded-[8px] bg-[#f5f2ea] px-2 py-2"><BlockMath math={String.raw`X_j=f_j(\operatorname{pa}_j,\epsilon_j)`} /></div>
            <div className="mt-3 overflow-hidden rounded-[8px] bg-[#f5f2ea] p-2">
              <svg className="h-auto w-full" viewBox="0 0 300 150" role="img" aria-label="Structural causal model graph: beds cause size and price, size also causes price, and noise enters the size and price equations">
                <defs>
                  <marker id="scm-arrow" markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3" viewBox="0 0 6 6">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#3869a8" />
                  </marker>
                </defs>
                <path d="M84 69 L116 31" fill="none" markerEnd="url(#scm-arrow)" stroke="#3869a8" strokeWidth="2" />
                <path d="M84 69 L216 69" fill="none" markerEnd="url(#scm-arrow)" stroke="#3869a8" strokeWidth="2" />
                <path d="M184 29 L216 60" fill="none" markerEnd="url(#scm-arrow)" stroke="#3869a8" strokeWidth="2" />
                <path d="M82 122 L116 35" fill="none" markerEnd="url(#scm-arrow)" stroke="#a36b13" strokeDasharray="4 4" strokeWidth="1.5" />
                <path d="M184 122 L216 83" fill="none" markerEnd="url(#scm-arrow)" stroke="#a36b13" strokeDasharray="4 4" strokeWidth="1.5" />
                <rect fill="#dfeee7" height="28" rx="7" stroke="#a8d2c3" width="70" x="14" y="55" />
                <rect fill="#f8edc9" height="28" rx="7" stroke="#e2c679" width="70" x="114" y="15" />
                <rect fill="#fbe4dc" height="28" rx="7" stroke="#efb2a2" width="70" x="214" y="55" />
                <rect fill="#fffdf8" height="24" rx="6" stroke="#d9d6cc" strokeDasharray="3 3" width="68" x="14" y="110" />
                <rect fill="#fffdf8" height="24" rx="6" stroke="#d9d6cc" strokeDasharray="3 3" width="68" x="114" y="110" />
                <text fill="#2f8175" fontFamily="DM Mono, monospace" fontSize="11" fontWeight="600" textAnchor="middle" x="49" y="73">beds</text>
                <text fill="#a36b13" fontFamily="DM Mono, monospace" fontSize="11" fontWeight="600" textAnchor="middle" x="149" y="33">size</text>
                <text fill="#d64e3b" fontFamily="DM Mono, monospace" fontSize="11" fontWeight="600" textAnchor="middle" x="249" y="73">price</text>
                <text fill="#74808a" fontFamily="DM Mono, monospace" fontSize="10" textAnchor="middle" x="48" y="126">noise x</text>
                <text fill="#74808a" fontFamily="DM Mono, monospace" fontSize="10" textAnchor="middle" x="148" y="126">noise y</text>
              </svg>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] text-[#74808a]"><span><span className="font-semibold text-[#3869a8]">solid</span> causal edge</span><span><span className="font-semibold text-[#a36b13]">dashed</span> exogenous noise</span></div>
            <p className="mt-3 text-xs leading-5 text-[#74808a]">The graph, mechanisms, and noise define one hidden rulebook.</p>
          </div>
          <ArrowRight className="mx-auto self-center rotate-90 text-[#3869a8] md:rotate-0" size={18} aria-hidden="true" />
          <div className="min-w-0 rounded-[10px] bg-[#fffdf8] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#e4edf8] text-[#3869a8]"><Database size={17} /></span>generate a synthetic batch</div>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[9px]"><span className="rounded-[7px] bg-[#dfeee7] px-2 py-2 text-[#2f8175]">episode 001 / D + Q</span><span className="rounded-[7px] bg-[#fbe4dc] px-2 py-2 text-[#8a4d43]">episode 002 / D + Q</span><span className="rounded-[7px] bg-[#f8edc9] px-2 py-2 text-[#8b661c]">episode 003 / D + Q</span><span className="rounded-[7px] bg-[#e4edf8] px-2 py-2 text-[#3869a8]">episode ... / D + Q</span></div>
            <p className="mt-3 text-xs leading-5 text-[#74808a]">Each episode has ordinary numeric rows and one hidden target.</p>
          </div>
          <ArrowRight className="mx-auto self-center rotate-90 text-[#3869a8] md:rotate-0" size={18} aria-hidden="true" />
          <div className="min-w-0 rounded-[10px] bg-[#fffdf8] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#dfeee7] text-[#2f8175]"><Layers3 size={17} /></span>train on the holdout</div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[9px]"><span className="rounded-full bg-[#dfeee7] px-2 py-1 text-[#2f8175]">D, x</span><ArrowRight size={12} className="text-[#3869a8]" /><span className="rounded-full bg-[#e4edf8] px-2 py-1 text-[#3869a8]">qθ</span><ArrowRight size={12} className="text-[#d64e3b]" /><span className="rounded-full bg-[#fbe4dc] px-2 py-1 text-[#8a4d43]">loss</span></div>
            <div className="mt-3 overflow-hidden rounded-[8px] bg-[#f5f2ea] px-2 py-2"><BlockMath math={String.raw`-\log q_\theta(y\mid x,\mathcal{D})`} /></div>
            <p className="mt-3 text-xs leading-5 text-[#74808a]">Repeat the hidden-answer loss across the sampled batch.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#3869a8]/20 pt-4 font-mono text-[10px] text-[#53606a]"><span className="uppercase tracking-[0.1em] text-[#3869a8]">scale</span><span className="rounded-full bg-[#fffdf8] px-2.5 py-1">1 SCM</span><ArrowRight size={13} className="text-[#3869a8]" /><span className="rounded-full bg-[#fffdf8] px-2.5 py-1">1,000 tables</span><ArrowRight size={13} className="text-[#3869a8]" /><span className="rounded-full bg-[#fffdf8] px-2.5 py-1 font-semibold text-[#2f8175]">millions of episodes</span><ArrowRight size={13} className="text-[#3869a8]" /><span className="rounded-full bg-[#dfeee7] px-2.5 py-1 font-semibold text-[#2f8175]">one reusable predictor</span></div>
        <p className="mt-4 border-t border-[#3869a8]/20 pt-4 text-sm leading-6 text-[#53606a]"><span className="font-semibold text-[#3869a8]">The scaling trick:</span> generation happens offline, so a large and varied synthetic prior can teach the model a prediction algorithm before deployment. At inference time, the trained model only needs a new table and query.</p>
      </section>
    </SlideFrame>
  )
}

function QueryDistributionFormula() {
  return <ResponsiveFormula desktop={String.raw`q_\theta(y\mid x,D)=[0.035,\ 0.942,\ 0.023]`} mobile={String.raw`\begin{aligned}q_\theta(y\mid x,D)&=[0.035,\\&\quad 0.942,\\&\quad 0.023]\end{aligned}`} />
}

function LossFormula() {
  return <ResponsiveFormula desktop={String.raw`\begin{aligned}\mathcal{L}_{\mathrm{CE}}&=-\sum_{c=0}^{2}y_c\log\hat y_c\\&=-\left(0\log 0.035+1\log 0.942+0\log 0.023\right)\\&=-\log(0.942)\approx 0.060\end{aligned}`} mobile={String.raw`\begin{aligned}\mathcal{L}_{\mathrm{CE}}&=-\sum_{c=0}^{2}\\&\quad y_c\log\hat y_c\\&=-0\log 0.035\\&\quad -1\log 0.942\\&\quad -0\log 0.023\\&=-\log(0.942)\\&\quad \approx 0.060\end{aligned}`} />
}

function ResponsiveFormula({ desktop, mobile }: { desktop: string; mobile: string }) {
  return <div className="mt-4 overflow-hidden rounded-[8px] bg-[#fffdf8] px-3 py-2"><div className="hidden sm:block"><BlockMath math={desktop} /></div><div className="sm:hidden"><BlockMath math={mobile} /></div></div>
}

type GraphTone = 'coral' | 'cobalt' | 'yellow' | 'mint'
type GraphNode = { label: string; x: number; y: number; tone: GraphTone }
type GraphEdge = { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }

const graphToneStyles: Record<GraphTone, { fill: string; stroke: string; text: string }> = {
  coral: { fill: '#fbe4dc', stroke: '#efb2a2', text: '#d64e3b' },
  cobalt: { fill: '#e4edf8', stroke: '#a8c4e6', text: '#3869a8' },
  yellow: { fill: '#f8edc9', stroke: '#e2c679', text: '#a36b13' },
  mint: { fill: '#dfeee7', stroke: '#a8d2c3', text: '#2f8175' },
}

function SamplerStep({ number, title, formula, text, tone }: { number: string; title: string; formula: string; text: string; tone: GraphTone }) {
  const palette = graphToneStyles[tone]
  return <div className="min-w-0 rounded-[9px] bg-[#fffdf8] p-3"><div className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-semibold" style={{ backgroundColor: palette.fill, color: palette.text }}>{number}</span><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#53606a]">{title}</span></div><div className="mt-2 overflow-hidden rounded-[7px] bg-[#f5f2ea] px-2 py-1"><InlineMath math={formula} /></div><p className="mt-2 text-[11px] leading-4 text-[#74808a]">{text}</p></div>
}

function RulebookGraph({ title, subtitle, equation, description, nodes, edges }: { title: string; subtitle: string; equation: string; description: string; nodes: GraphNode[]; edges: GraphEdge[] }) {
  const graphId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <div className="min-w-0 rounded-[10px] bg-[#fffdf8] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold">{title}</p><p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#8a9295]">{subtitle}</p></div><GitBranch size={15} className="text-[#3869a8]" /></div><svg className="mt-3 h-auto w-full" viewBox="0 0 300 130" role="img" aria-label={`${title} causal graph`}><defs><marker id={`${graphId}-causal-arrow`} markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3" viewBox="0 0 6 6"><path d="M0,0 L6,3 L0,6 Z" fill="#3869a8" /></marker><marker id={`${graphId}-noise-arrow`} markerHeight="6" markerWidth="6" orient="auto" refX="5" refY="3" viewBox="0 0 6 6"><path d="M0,0 L6,3 L0,6 Z" fill="#a36b13" /></marker></defs>{edges.map((edge, index) => <line key={`${graphId}-edge-${index}`} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke={edge.dashed ? '#a36b13' : '#3869a8'} strokeDasharray={edge.dashed ? '4 4' : undefined} strokeWidth={edge.dashed ? 1.5 : 2} markerEnd={`url(#${graphId}-${edge.dashed ? 'noise' : 'causal'}-arrow)`} />)}{nodes.map((node) => { const palette = graphToneStyles[node.tone]; return <g key={node.label}><rect fill={palette.fill} height="26" rx="7" stroke={palette.stroke} width="80" x={node.x} y={node.y} /><text fill={palette.text} fontFamily="DM Mono, monospace" fontSize="10" fontWeight="600" textAnchor="middle" x={node.x + 40} y={node.y + 17}>{node.label}</text></g> })}</svg><div className="overflow-hidden rounded-[7px] bg-[#f5f2ea] px-2 py-1 text-center text-[10px] text-[#53606a]"><InlineMath math={equation} /></div><p className="mt-2 text-[11px] leading-4 text-[#74808a]">{description}</p></div>
}