import { BlockMath, InlineMath } from 'react-katex'
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