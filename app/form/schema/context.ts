 import { z } from "zod";

/**
 * Prakāra Schema - Defines the fundamental modes of consciousness in our Form system
 * Replacing FormContextTypeSchema with consciousness modes from Sanskrit philosophy
 */
export const PrakāraSchema = z.enum([
  "view", // For viewing/perceiving entities (was "view")
  "edit", // For transforming/modifying existing entities (was "edit")
  "create", // For creating/manifesting new entities (was "create")
  "list", // For collecting/aggregating entities (was "list")
  "search", // For seeking/searching entities (was "search")
  "action", // For performing actions/operations (was "action")
  "composite", // For combining/synthesizing multiple contexts (was "composite")
  "workflow", // For sequential/procedural processing (was "workflow")
]);

/**
 * Mūla Schema - Core properties for all context types
 * Replacing FormContextRootSchema with Sanskrit term for "root/foundation"
 */
export const MūlaSchema = z.object({
  // Identity (Svarūpa - self-nature)
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  mode: PrakāraSchema.optional(), // Replacing "type" with mode (mode/category)

  // Hierarchical structure (Sopāna - hierarchical structure)
  parentId: z.string().optional(),

 // Context-specific data (Jñāna - knowledge)
 data: z.record(z.any()).optional().default({}).optional(),
 mark: z.record(z.any()).optional().default({}).optional(),

  // State tracking (Avasthā - state/condition)
  active: z.boolean().default(false).optional(),
  timestamp: z.number().default(() => Date.now()),

  // Content (Viṣaya - content/object)
  vastu: z.array(z.string()).optional().default([]).optional(),
  sambandha: z.array(z.string()).optional().default([]).optional(),
  ghaṭanā: z.array(z.string()).optional().default([]).optional(),

 
  // Access control (Adhikāra - authority/rights)
  adhikāra: z.record(z.boolean()).optional(),
  // Lifecycle properties (Jīvana-cakra - life cycle)
  utpanna: z
    .date()
    .optional()
    .default(() => new Date())
    .optional(),
  parivardhita: z
    .date()
    .optional()
    .default(() => new Date())
    .optional(),
  kartā: z.string().optional(),
});

/**
 * Niyama Schema - Defines constraints for context operations
 * Replacing FormContextConstraintSchema with Sanskrit term for "rule/restraint"
 */
export const NiyamaSchema = z.object({
  maximumVastu: z.number().optional(),
  maximumSambandha: z.number().optional(),
  maximumGhaṭanā: z.number().optional(),
  anumataVastuPrakāra: z.array(z.string()).optional(),
  anumataSambandhaPrakāra: z.array(z.string()).optional(),
  pathyaMātra: z.boolean().optional().default(false).optional(),
  pramāṇaStara: z
    .enum(["śūnya", "alpa", "prāmāṇika", "kaṭhora"])
    .optional()
    .default("prāmāṇika"),
});

/**
 * Svabhāva Schema - Defines behaviors attached to contexts
 * Replacing FormContextBehaviorSchema with Sanskrit term for "inherent nature/behavior"
 */
export const SvabhāvaSchema = z.object({
  name: z.string(),
  ghaṭanā: z.enum([
    "utpattiPara",
    "sakriyaPara",
    "niṣkriyaPara",
    "pariṇāmaPara",
    "nāśaPara",
    "vastuYojitaPara",
    "vastuApasāritaPara",
    "sambandhaYojitaPara",
    "sambandhaApasāritaPara",
    "ghaṭanāPara",
  ]),
  nirvāhaka: z.function().or(z.string()),
  upādhi: z.record(z.any()).optional(),
  sakriya: z.boolean().default(true),
});

/**
 * Anveṣaṇa Schema - For querying contexts
 * Replacing FormContextQuerySchema with Sanskrit term for "inquiry/search"
 */
export const AnveṣaṇaSchema = z.object({
  mode: PrakāraSchema.optional(),
  sakriya: z.boolean().optional(),
  janakId: z.string().optional(),
  vastuDhārita: z.string().optional(),
  sambandhaDhārita: z.string().optional(),
  mark: z.record(z.any()).optional(),
  punaḥpraveśa: z.boolean().optional().default(false).optional(),
  niṣkriyaAnṭarbhāva: z.boolean().optional().default(false).optional(),
});

/**
 * NiṣpādanaPariṇāma Schema - The types of logical operations
 * Implementing the Guna-Sankhya-Maya triadic framework
 */
export const NiṣpādanaPariṇāmaSchema = z.enum([
  "guṇātmaka", // Qualitative - Syllogistic/conceptual logic - CPU-like operations
  "saṅkhyātmaka", // Quantitative - Mathematical/algorithmic logic - GPU-like operations
  "māyātmaka", // Measuremental - Self-referential/paradoxical logic - Quantum-like operations
]);

/**
 * KriyāPrakāra Schema - Operations supported in execution environments
 */
export const KriyāPrakāraSchema = z.enum([
  // Guṇātmaka operations (CPU-like)
  "abhijñāna", // Identify - Categorical judgment - "A is B"
  "vargīkaraṇa", // Classify - Classification of concepts
  "anumāna", // Syllogize - Syllogistic reasoning
  "sāmānyīkaraṇa", // Abstract - Abstraction of qualities
  "mūrtīkaraṇa", // Instantiate - Instantiation of concepts

  // Saṅkhyātmaka operations (GPU-like)
  "gaṇana", // Calculate - Mathematical calculation
  "māpana", // Measure - Measurement
  "pariṇamana", // Transform - Data transformation
  "viśleṣaṇa", // Analyze - Analysis of data
  "anukūlana", // Optimize - Optimization calculation

  // Māyātmaka operations (Quantum-like)
  "vyāvartana", // Superpose - Superposition of multiple states
  "saṃśayakriyā", // Entangle - Entanglement of separate entities
  "vikṣepaṇa", // Collapse - Wavefunction collapse to definite state
  "ātmasaṃvāda", // Self-reference - Self-referential operations
  "aparicchedya", // Indetermine - Indeterminacy operations
]);

/**
 * NiṣpādanaPhala Schema - Result of operation execution
 */
export const NiṣpādanaPhalaSchema = z.object({
  saphala: z.boolean(), // successful
  mūlya: z.any(), // value
  pariṇāma: NiṣpādanaPariṇāmaSchema, // mode/environment
  kriyā: KriyāPrakāraSchema, // operation/action
  sandarbhaId: z.string(), // Context ID
  kālamudrā: z.number().default(() => Date.now()), // timestamp
  mark: z.record(z.any()).optional(), // metadata
  doṣa: z
    .object({
      // error/defect
      sandeśa: z.string(), // message
      vivara: z.any().optional(), // details
    })
    .optional(),
});

/**
 * NiṣpādanaSandarbha Schema - Execution context definition
 */
export const NiṣpādanaSandarbhaSchema = MūlaSchema.extend({
  // Execution-specific properties
  pariṇāma: NiṣpādanaPariṇāmaSchema.default("guṇātmaka").optional(), // active execution mode
  // We keep niṣpādanaPariṇāma for backward compatibility
  niṣpādanaPariṇāma: NiṣpādanaPariṇāmaSchema.default("guṇātmaka").optional(),

  // Storage for execution history
  niṣpādanaItihāsa: z
    .array(
      z.object({
        kriyā: KriyāPrakāraSchema,
        pariṇāma: NiṣpādanaPariṇāmaSchema,
        kālamudrā: z.number(),
        saphala: z.boolean(),
        cālakId: z.string().optional(), // driver/initiator ID
        vivara: z.any().optional(), // details
      })
    )
    .optional()
    .default([])
    .optional(),

  // Execution stats
  sāṅkhyikī: z
    .object({
      prayogaSaṅkhyā: z.record(z.number()).optional().default({}), // operation counts
      saphalaAnupāta: z.number().optional().default(0), // success ratio
      auṣamaKāla: z.number().optional().default(0), // average time
    })
    .optional()
    .default({
      prayogaSaṅkhyā: {},
      saphalaAnupāta: 0,
      auṣamaKāla: 0,
    })
    .optional(),

  // Environment settings
  paryāvaraṇa: z.record(z.any()).optional().default({}).optional(), // environment variables

  // For māyātmaka operations
  māyāvīSthiti: z
    .object({
      vyāvartanāḥ: z.record(z.any()).optional().default({}), // superpositions
      saṃśayāḥ: z.record(z.any()).optional().default({}), // entanglements
      ātmasaṃvādāḥ: z.record(z.any()).optional().default({}), // self-references
    })
    .optional()
    .default({
      vyāvartanāḥ: {},
      saṃśayāḥ: {},
      ātmasaṃvādāḥ: {},
    })
    .optional(),
});

export const FormExecutionContextSchema = NiṣpādanaSandarbhaSchema;

/**
 * SandarbhaSchema - The complete context definition
 * Replacing FormContextSchema with Sanskrit term for "context/framework"
 */
export const SandarbhaSchema = MūlaSchema.extend({
  // Enhanced properties
  niyama: NiyamaSchema.optional(), // Replacing "constraints" with niyama
  svabhāva: z.array(SvabhāvaSchema).optional(), // Replacing "behaviors" with svabhāva

  // Transaction support (Vyavahāra - transaction/dealing)
  vyavahāraId: z.string().optional(), // Replacing "transactionId" with vyavahāraId
  vyavahāraSthiti: z
    .enum(["śūnya", "sakriya", "samāhita", "vyāvartita"])
    .optional()
    .default("śūnya")
    .optional(),

  // Indexing and querying (Anukramaṇikā - indexing)
  anukramaṇikā: z
    .array(
      z.object({
        name: z.string(),
        mode: z.enum(["vastu", "sambandha", "ghaṭanā"]), // Replacing "type" with mode
        kṣetra: z.array(z.string()), // Replacing "fields" with kṣetra (fields/domains)
      })
    )
    .optional(),

  // View-specific properties
  darśanaVikalpa: z
    .object({
      nyāsa: z
        .enum(["pramāṇika", "patraka", "tālikā", "vṛkṣa", "citragraphā"])
        .optional()
        .default("pramāṇika"),

      kramīkaraṇa: z
        .array(
          z.object({
            kṣetra: z.string(), // Replacing "field" with kṣetra
            diśā: z.enum(["ārohaka", "avarohaka"]).default("ārohaka"),
            // Replacing "direction" with diśā (direction)
            // "asc", "desc" -> "ārohaka" (ascending), "avarohaka" (descending)
          })
        )
        .optional(),

      chaṭanī: z.record(z.any()).optional(), // Replacing "filtering" with chaṭanī (filtering/sifting)

      pṛṣṭhāṅkana: z
        .object({
          sakṣama: z.boolean().default(false), // Replacing "enabled" with sakṣama (capable/enabled)
          pṛṣṭhāMāpa: z.number().default(20), // Replacing "pageSize" with pṛṣṭhāMāpa (page measure)
          vartamānaPṛṣṭhā: z.number().default(1), // Replacing "currentPage" with vartamānaPṛṣṭhā
        })
        .optional()
        .default({
          sakṣama: false,
          pṛṣṭhāMāpa: 20,
          vartamānaPṛṣṭhā: 1,
        })
        .optional(),
    })
    .optional()
    .default({
      nyāsa: "pramāṇika",
    })
    .optional(),
});

export const FormContextSchema = SandarbhaSchema;

// Basic type exports
export type Prakāra = z.infer<typeof PrakāraSchema>;
export type Niyama = z.infer<typeof NiyamaSchema>;
export type Svabhāva = z.infer<typeof SvabhāvaSchema>;
export type Anveṣaṇa = z.infer<typeof AnveṣaṇaSchema>;
export type Mūla = z.infer<typeof MūlaSchema>;

// Execution type exports
export type NiṣpādanaPariṇāma = z.infer<typeof NiṣpādanaPariṇāmaSchema>;
export type KriyāPrakāra = z.infer<typeof KriyāPrakāraSchema>;
export type NiṣpādanaPhala = z.infer<typeof NiṣpādanaPhalaSchema>;
export type NiṣpādanaSandarbha = z.infer<typeof NiṣpādanaSandarbhaSchema>;

// Combined type exports
export type Sandarbha = z.infer<typeof SandarbhaSchema>;

// Also export with original names for backward compatibility
export type FormContextType = Prakāra;
export type FormContextConstraints = Niyama;
export type FormContextBehavior = Svabhāva;
export type FormContextQuery = Anveṣaṇa;
export type FormContextBase = Mūla;
export type FormExecutionEnvironmentType = NiṣpādanaPariṇāma;
export type FormExecutionOperation = KriyāPrakāra;
export type FormExecutionResult = NiṣpādanaPhala;
export type FormExecutionContext = NiṣpādanaSandarbha;
export type FormContext = Sandarbha;