export type BenchmarkRow = {
  model: string
  regime: 'Default' | 'Tuned' | 'Tuned + ensemble' | 'Thinking / API' | 'Reference'
  elo: number
  improvability: number
  runtimeSecondsPerThousand: number
  family: 'TabPFN' | 'TabICL' | 'Tree / AutoML' | 'Linear' | 'Deep tabular'
  note: string
}

export type BenchmarkEra = {
  id: 'linear' | 'trees' | 'neural' | 'foundation'
  label: string
  title: string
  summary: string
  signal: string
}

export const benchmarkJourney: BenchmarkEra[] = [
  { id: 'linear', label: '01 / additive', title: 'GLMs + GAMs', summary: 'Strong, interpretable baselines when effects are mostly additive or smooth.', signal: 'reliable baseline' },
  { id: 'trees', label: '02 / ensembles', title: 'Random forest + boosted trees', summary: 'Nonlinearity and interactions moved tree ensembles ahead on many tabular tasks.', signal: 'tabular default' },
  { id: 'neural', label: '03 / first neural wave', title: 'Early neural nets', summary: 'More flexibility did not consistently beat well-tuned tree ensembles on ordinary tables.', signal: 'not a clear win' },
  { id: 'foundation', label: '04 / pretraining', title: 'TabPFN + TabICL', summary: 'Recent tabular foundation models can now beat strong tree baselines in benchmark snapshots.', signal: 'new lead' },
]

export const tabArenaSnapshot: BenchmarkRow[] = [
  { model: 'TabPFN-3 Thinking', regime: 'Thinking / API', elo: 1800, improvability: 4.7, runtimeSecondsPerThousand: 3.26, family: 'TabPFN', note: 'API / enterprise variant; not the open checkpoint.' },
  { model: 'AutoGluon 1.5 extreme', regime: 'Tuned + ensemble', elo: 1695, improvability: 5.8, runtimeSecondsPerThousand: 4.03, family: 'Tree / AutoML', note: 'Four-hour tuned ensemble; a higher-compute comparison than a default checkpoint.' },
  { model: 'TabPFN-3', regime: 'Default', elo: 1677, improvability: 6.3, runtimeSecondsPerThousand: 0.74, family: 'TabPFN', note: 'Default foundation model: +257 Elo vs CatBoost and +298 vs XGBoost in this snapshot.' },
  { model: 'TabPFN-2.6', regime: 'Default', elo: 1623, improvability: 8.7, runtimeSecondsPerThousand: 0.55, family: 'TabPFN', note: 'Default predecessor in the TabArena comparison.' },
  { model: 'TabICLv2', regime: 'Default', elo: 1599, improvability: 7.7, runtimeSecondsPerThousand: 0.38, family: 'TabICL', note: 'Open default model in the report snapshot.' },
  { model: 'RealTabPFN-2.5', regime: 'Tuned + ensemble', elo: 1602, improvability: 8.3, runtimeSecondsPerThousand: 8.92, family: 'TabPFN', note: 'Real-data continued pretraining plus tuning and ensembling.' },
  { model: 'CatBoost', regime: 'Tuned + ensemble', elo: 1420, improvability: 13.2, runtimeSecondsPerThousand: 0.65, family: 'Tree / AutoML', note: 'Strong tuned tree baseline; below default TabPFN-3 in this snapshot.' },
  { model: 'XGBoost', regime: 'Tuned + ensemble', elo: 1379, improvability: 14.4, runtimeSecondsPerThousand: 1.69, family: 'Tree / AutoML', note: 'Strong tuned tree baseline; below default TabPFN-3 in this snapshot.' },
  { model: 'Linear model', regime: 'Tuned + ensemble', elo: 961, improvability: 33.8, runtimeSecondsPerThousand: 1.19, family: 'Linear', note: 'Strong tuned and ensembled linear baseline.' },
]

export const benchmarkNotes = {
  tabArena: {
    title: 'TabArena',
    summary: 'In this report snapshot, default TabPFN-3 scores 1677 Elo versus 1420 for CatBoost and 1379 for XGBoost. A tuned AutoGluon extreme ensemble reaches 1695, so the foundation-model lead is clearest when default checkpoints are compared with strong tree-based baselines under a named regime. The living benchmark selects 51 representative datasets from a much larger candidate pool; the full view covers 816 tasks across repeated splits, with cheaper TabArena-Lite views also reported.',
    protocol: ['Binary classification: ROC AUC, often shown as 1 - ROC-AUC error', 'Multiclass classification: log loss', 'Regression: RMSE', 'Cross-validation or repeated splits; rank models per dataset', 'Aggregate views: Elo, average rank, improvability, Pareto front', 'Bootstrap confidence intervals quantify uncertainty in aggregate comparisons'],
  },
  talent: {
    title: 'TALENT',
    summary: 'A broader suite of 300 datasets: 120 binary classification, 80 multiclass classification, and 100 regression tasks. The common split is 64% train, 16% validation, and 20% test.',
    protocol: ['Primary classification metric: accuracy', 'Primary regression metric: RMSE', 'Supplementary metrics: AUC, log loss, MAE, R2', 'Results are aggregated by ranks, Elo, or improvability'],
  },
  openMl: {
    title: 'OpenML / Nature paper',
    summary: 'The original and Nature work use curated small-data OpenML suites to compare a one-pass PFN with tuned trees and AutoML systems.',
    protocol: ['Small numerical datasets are the clearest target regime', 'Evaluation repeats train/test splits across datasets', 'Runtime includes task-side fitting or tuning for baselines', 'Aggregate results hide dataset-to-dataset variation'],
  },
}
