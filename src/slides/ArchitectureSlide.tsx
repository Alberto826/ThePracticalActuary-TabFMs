import { ArrowRight, Check } from 'lucide-react'
import { modelMatrix, type ModelComparison } from '../content/modelMatrix'
import { SlideFrame } from './shared'

export type ModelKey = 'TabPFN v1' | 'Nature / TabPFN v2' | 'TabPFN-2.5' | 'TabICL' | 'TabICLv2' | 'TabPFN-3'

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

export function ArchitectureSlide({ model, setModel }: { model: ModelKey; setModel: (value: ModelKey) => void }) {
  const detail = modelDetails[model]
  const matrix = modelMatrix.find((item) => item.model === model) as ModelComparison
  return <SlideFrame number="04" kicker="Architectures / innovations across the lineage" tone="cobalt"><div className="slide-wide"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><h2 className="slide-title">One family, several answers to the same bottleneck.</h2><p className="slide-lead max-w-3xl">Use the tabs as a timeline. Each version keeps the learned-algorithm idea, then changes where information is represented, where attention is spent, or what the output head can express.</p></div><span className="rounded-full border border-[#a8c4e6] bg-[#e4edf8] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#3869a8]">innovation timeline</span></div><div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Architecture timeline">{(Object.keys(modelDetails) as ModelKey[]).map((key) => <button key={key} onClick={() => setModel(key)} role="tab" aria-selected={model === key} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold ${model === key ? 'border-[#3869a8] bg-[#e4edf8] text-[#3869a8]' : 'border-[#1e2a35]/12 bg-[#fffdf8] text-[#74808a] hover:text-[#1e2a35]'}`}>{key}</button>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><div className="surface-panel bg-[#fffdf8] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: detail.color }}>{model}</p><p className="mt-1 text-xl font-semibold">{detail.headline}</p></div><span className="rounded-[8px] px-3 py-2 font-mono text-[10px]" style={{ backgroundColor: `${detail.color}16`, color: detail.color }}>{matrix.tasks}</span></div><ArchitecturePath stages={detail.stages} color={detail.color} /><div className="mt-7 grid gap-4 border-t border-[#1e2a35]/10 pt-5 sm:grid-cols-2"><DetailBox label="attention" value={detail.attention} /><DetailBox label="synthetic prior" value={detail.prior} /><DetailBox label="output" value={detail.output} /><DetailBox label="input envelope" value={matrix.maxInput} /></div></div><div className="grid gap-5"><div className="surface-panel bg-[#1e2a35] p-5 text-[#f5f2ea]"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f6c34a]">what this version introduced</p><div className="mt-4 grid gap-3">{detail.innovation.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-[#d6dddd]"><Check size={15} className="mt-1 shrink-0 text-[#f6c34a]" />{item}</div>)}</div></div><div className="rounded-[14px] border border-[#efb2a2] bg-[#fbe4dc] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64e3b]">read the boundary</p><p className="mt-3 text-sm leading-6 text-[#7b3328]">{detail.caveat}</p></div></div></div><div className="mt-5 overflow-x-auto rounded-[14px] border border-[#1e2a35]/10 bg-[#ebe7dc] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#74808a]">side-by-side facts</p><table className="mt-4 min-w-[760px] w-full border-collapse text-left text-xs"><thead><tr className="border-b border-[#1e2a35]/12 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a9295]"><th className="pb-3 pr-4">model</th><th className="pb-3 pr-4">row attention</th><th className="pb-3 pr-4">column attention</th><th className="pb-3 pr-4">input envelope</th><th className="pb-3">output</th></tr></thead><tbody><tr><td className="py-4 pr-4 font-semibold">{matrix.model}</td><td className="py-4 pr-4">{matrix.rowAttention}</td><td className="py-4 pr-4">{matrix.columnAttention}</td><td className="py-4 pr-4">{matrix.maxInput}</td><td className="py-4">{matrix.maxOutput}</td></tr></tbody></table></div></div></SlideFrame>
}

function ArchitecturePath({ stages, color }: { stages: string[]; color: string }) {
  return <div className="mt-8 grid gap-2 sm:grid-cols-4">{stages.map((stage, index) => <div key={stage} className="relative"><div className="flex min-h-[94px] flex-col justify-between rounded-[10px] border p-3" style={{ borderColor: `${color}55`, backgroundColor: `${color}0c` }}><span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color }}>stage {index + 1}</span><span className="text-sm font-semibold leading-5">{stage}</span></div>{index < stages.length - 1 && <ArrowRight className="absolute -right-3 top-10 z-10 hidden bg-[#fffdf8] text-[#74808a] sm:block" size={17} />}</div>)}</div>
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return <div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a9295]">{label}</p><p className="mt-2 text-xs leading-5 text-[#53606a]">{value}</p></div>
}