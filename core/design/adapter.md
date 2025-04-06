FormShapeAdapter
├── View Pipeline
│   ├── ValidateTransformer
│   ├── ExtractQualitiesTransformer
│   └── ViewOutputTransformer
│
├── Edit Pipeline
│   ├── ValidateTransformer
│   ├── EditFieldsTransformer
│   └── EditOutputTransformer
│
└── Create Pipeline
    ├── ApplyDefaultsTransformer
    ├── CreateFieldsTransformer
    └── CreateOutputTransformer
┌─────────────────────────────────────────────────────────────┐
│                  FormShapeAdapter                           │
│          [Orchestrates mode-specific pipelines]             │
│                                                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  View Pipeline  │  │ Edit Pipeline│  │ Create Pipeline│  │
│  └────────┬────────┘  └──────┬───────┘  └───────┬────────┘  │
│           │                  │                   │          │
└───────────┼──────────────────┼───────────────────┼──────────┘
            │                  │                   │
┌───────────┼──────────────────┼───────────────────┼──────────┐
│           ▼                  ▼                   ▼          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │ Transformer │     │ Transformer │     │ Transformer │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│           │                  │                   │          │
│           ▼                  ▼                   ▼          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │ Transformer │     │ Transformer │     │ Transformer │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│           │                  │                   │          │
│           ▼                  ▼                   ▼          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │ Transformer │     │ Transformer │     │ Transformer │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

