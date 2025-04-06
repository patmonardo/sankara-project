┌─────────────────────────────────────────────────────────────────┐
│                      MVC (Organism Level)                       │
│                                                                 │
│  ┌─────────────┐   ┌───────────────────────┐   ┌────────────┐   │
│  │    Model    │──▶│         View          │◀──│ Controller │   │
│  │ (Data Store)│   │ (Pipeline Orchestrator)│   │  (Events) │   │
│  └─────────────┘   └───────────────────────┘   └────────────┘   │
│         │                      │                      │         │
└─────────┼──────────────────────┼──────────────────────┼─────────┘
          │                      │                      │
          │                      ▼                      │
          │        ┌─────────────────────────────┐      │
          │        │     Form Pipeline System    │      │
          │        │                             │      │
          │        │  ┌─────────┐   ┌─────────┐  │      │
          │        │  │Transform│──▶│ Render  │  │      │
          │        │  │ Shape   │   │ Output  │  │      │
          │        │  └─────────┘   └─────────┘  │      │
          │        └──────────┬──────────────────┘      │
          │                   │                         │
          │               Mode Determines               │
          │                   │                         │
          ▼                   ▼                         ▼
┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────┐
│  FormMatter     │  │     Form Cells      │  │    User Input   │
│  (Graph Object) │  │                     │  │    Events       │
│                 │  │ ┌─────────────────┐ │  │                 │
│ ┌─────────────┐ │  │ │ Field Behavior  │ │  │ ┌─────────────┐ │
│ │ Nodes       │◀┼──┼─┤ Changes by Mode │ │  │ │ Present in  │ │
│ └─────────────┘ │  │ └─────────────────┘ │  │ │ All Modes   │ │
│ ┌─────────────┐ │  │ ┌─────┐ ┌────────┐  │  │ └─────────────┘ │
│ │ Edges       │◀┼──┼─┤Card │ │List    │  │  │ ┌─────────────┐ │
│ └─────────────┘ │  │ │Form │ │Form    │  │  │ │ Vary by Mode│ │
│                 │  │ └─────┘ └────────┘  │  │ └─────────────┘ │
└─────────────────┘  └─────────────────────┘  └─────────────────┘
┌───────────────────────────────────────────────────────────────┐
│                     Field Behavior by Mode                     │
├───────────────┬───────────────────────┬─────────────────────┤
│  View Mode    │      Edit Mode        │     Create Mode      │
├───────────────┼───────────────────────┼─────────────────────┤
│ • Read-only   │ • Editable values     │ • Empty inputs      │
│ • Interactive │ • Validation          │ • Default values    │
│ • Links active│ • Relationship editing│ • Relation creation │
│ • Tooltips    │ • Property updates    │ • New node formation│
│ • Expandable  │ • Edge modification   │ • Graph extension   │
└───────────────┴───────────────────────┴─────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                User Input Events Across Modes                  │
├───────────────┬───────────────────────┬─────────────────────┤
│  View Mode    │      Edit Mode        │     Create Mode      │
├───────────────┼───────────────────────┼─────────────────────┤
│ • Click       │ • Change              │ • Input              │
│ • Hover       │ • Focus/Blur          │ • Selection          │
│ • Select      │ • Drag                │ • Form submission    │
│ • Navigate    │ • Resize              │ • Cancellation      │
│ • Expand      │ • Submit              │ • Initial values     │
└───────────────┴───────────────────────┴─────────────────────┘
┌───────────────────────────────────────────────────────────────┐
│           Transformers vs. UI Components                      │
├─────────────────────────────┬─────────────────────────────────┤
│        Transformers         │        UI Components            │
├─────────────────────────────┼─────────────────────────────────┤
│ • Process reflection        │ • Process visualization         │
│ • Transform meaning         │ • Transform appearance          │
│ • Input: Data & context     │ • Input: Conceptual forms       │
│ • Output: Textual forms     │ • Output: Pixels                │
│ • Universal                 │ • Platform-specific             │
│ • Framework-agnostic        │ • Framework-dependent           │
│                             │ (React, Angular, etc.)          │
└─────────────────────────────┴─────────────────────────────────┘
