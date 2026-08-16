export type ModelComparison = {
  model: string
  sourceId: string
  family: 'TabPFN' | 'TabICL'
  rowAttention: string
  columnAttention: string
  iclStage: string
  compression: string
  classification: string
  regression: string
  tasks: string
  recommendedRows: string
  recommendedColumns: string
  nativeClassLimit: string
  regressionOutput: string
  missingCategorical: string
  sourceStatus: string
  maxInput: string
  maxOutput: string
  innovation: string
}

export const modelMatrix: ModelComparison[] = [
  {
    model: 'TabPFN v1',
    sourceId: 'tabpfn-v1',
    family: 'TabPFN',
    rowAttention: 'Yes: rows are tokens',
    columnAttention: 'Inside row encoder only',
    iclStage: 'Rows self-attend; query cross-attends',
    compression: 'No separate compression stage',
    classification: 'Yes',
    regression: 'No',
    tasks: 'Classification',
    recommendedRows: '<=1,000',
    recommendedColumns: '<=100 numeric',
    nativeClassLimit: '<=10 classes',
    regressionOutput: 'Not native',
    missingCategorical: 'Limited; numeric-focused',
    sourceStatus: '2022 paper / conference',
    maxInput: '1,000 rows x 100 numeric features',
    maxOutput: 'Up to 10 classes',
    innovation: 'Learns the prediction algorithm from synthetic tasks; row-level ICL.',
  },
  {
    model: 'Nature / TabPFN v2',
    sourceId: 'tabpfn-nature',
    family: 'TabPFN',
    rowAttention: 'Yes: alternating row attention',
    columnAttention: 'Yes: alternating feature attention',
    iclStage: 'Alternating cell attention',
    compression: 'No explicit compression stage',
    classification: 'Yes',
    regression: 'Yes',
    tasks: 'Classification + regression',
    recommendedRows: '~10,000',
    recommendedColumns: '~500 mixed',
    nativeClassLimit: 'Small-class head; wrappers possible',
    regressionOutput: 'Point / predictive distribution',
    missingCategorical: 'Broader preprocessing and encodings',
    sourceStatus: '2025 Nature article',
    maxInput: '10,000 rows x 500 mixed features',
    maxOutput: 'Classes or predictive distribution',
    innovation: 'Cell-based attention and broader real-world data handling.',
  },
  {
    model: 'TabPFN-2.5',
    sourceId: 'tabpfn-2-5',
    family: 'TabPFN',
    rowAttention: 'Yes: alternating row attention',
    columnAttention: 'Yes: grouped feature attention',
    iclStage: 'Alternating attention + thinking rows',
    compression: 'Groups of 3 cells; optional distillation',
    classification: 'Yes',
    regression: 'Yes',
    tasks: 'Classification + regression',
    recommendedRows: '50,000 target',
    recommendedColumns: '2,000',
    nativeClassLimit: 'Small-class pretraining head',
    regressionOutput: 'Binned predictive distribution',
    missingCategorical: 'Missing indicators + categorical preprocessing',
    sourceStatus: 'Technical report / v2',
    maxInput: '50,000 recommended x 2,000 features',
    maxOutput: 'Classes or binned distribution',
    innovation: 'Deeper grouped attention, thinking rows, richer preprocessing, distillation.',
  },
  {
    model: 'TabICL',
    sourceId: 'tabicl-v1',
    family: 'TabICL',
    rowAttention: 'Yes: row-wise feature interaction',
    columnAttention: 'Yes: distribution-aware Set Transformer',
    iclStage: 'TFicl over compressed row vectors',
    compression: 'TFcol + TFrow to fixed width',
    classification: 'Yes',
    regression: 'No',
    tasks: 'Classification',
    recommendedRows: '500,000 reported',
    recommendedColumns: '500 practical',
    nativeClassLimit: '<=10; hierarchical wrapper',
    regressionOutput: 'Not reported',
    missingCategorical: 'Preprocessing required; limitations noted',
    sourceStatus: 'ICML 2025 paper',
    maxInput: '500,000 rows x 500 features reported',
    maxOutput: 'Native <=10; hierarchical classes',
    innovation: 'Compress columns into fixed-size row embeddings before dataset ICL.',
  },
  {
    model: 'TabICLv2',
    sourceId: 'tabicl-v2',
    family: 'TabICL',
    rowAttention: 'Yes: TFrow with CLS tokens + RoPE',
    columnAttention: 'Yes: TFcol with induced attention + QASSMax',
    iclStage: 'TFicl after TFcol / TFrow',
    compression: 'Repeated grouping + QASSMax',
    classification: 'Yes',
    regression: 'Yes',
    tasks: 'Classification + regression',
    recommendedRows: 'Million-scale reported',
    recommendedColumns: '500 in large-table tests',
    nativeClassLimit: 'Mixed-radix / hierarchical many-class',
    regressionOutput: '999 quantiles + reconstructed distribution',
    missingCategorical: 'Missing values remain a limitation',
    sourceStatus: 'Technical report / open model',
    maxInput: 'Million-scale; 500 features in large-table tests',
    maxOutput: 'Many classes; 999 quantiles',
    innovation: 'Repeated feature grouping, target-aware embeddings, QASSMax, mixed-radix classes.',
  },
  {
    model: 'TabPFN-3',
    sourceId: 'tabpfn-3',
    family: 'TabPFN',
    rowAttention: 'Yes: row-level ICL after compression',
    columnAttention: 'Yes: inducing feature distribution embedding',
    iclStage: 'QASSMax row ICL + retrieval decoder',
    compression: 'Column embedding + row aggregation + chunking',
    classification: 'Yes',
    regression: 'Yes',
    tasks: 'Classification + regression + extensions',
    recommendedRows: '1M x 200 validated frontier',
    recommendedColumns: '2K at 100K rows; 20K at 1K rows',
    nativeClassLimit: '160 classes in released checkpoint',
    regressionOutput: 'Distributional / bar head',
    missingCategorical: 'NaN/Inf flags; text separate in Plus',
    sourceStatus: 'Technical report / v2',
    maxInput: '1M x 200; 100K x 2K; 1K x 20K',
    maxOutput: 'Up to 160 classes; distributional regression',
    innovation: 'Row chunking, reduced KV cache, missing indicators, retrieval decoder, QASSMax.',
  },
]
