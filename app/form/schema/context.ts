import { z } from "zod";

/**
 * Prakāra Schema - Defines the fundamental modes of consciousness in our Form system
 * Replacing FormContextTypeSchema with consciousness modes from Sanskrit philosophy
 */
export const PrakāraSchema = z.enum([
  "darśana", // For viewing/perceiving entities (was "view")
  "pariṇāma", // For transforming/modifying existing entities (was "edit")
  "sṛṣṭi", // For creating/manifesting new entities (was "create")
  "saṃgraha", // For collecting/aggregating entities (was "list")
  "anveṣaṇa", // For seeking/searching entities (was "search")
  "karma", // For performing actions/operations (was "action")
  "samuccaya", // For combining/synthesizing multiple contexts (was "composite")
  "krama", // For sequential/procedural processing (was "workflow")
]);

/**
 * Mūla Schema - Core properties for all context types
 * Replacing FormContextRootSchema with Sanskrit term for "root/foundation"
 */
export const MūlaSchema = z.object({
  // Identity (Svarūpa - self-nature)
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  prakāra: PrakāraSchema, // Replacing "type" with prakāra (mode/category)

  // Hierarchical structure (Sopāna - hierarchical structure)
  parentId: z.string().optional(),

  // State tracking (Avasthā - state/condition)
  active: z.boolean().default(false),
  timestamp: z.number().default(() => Date.now()),

  // Content (Viṣaya - content/object)
  vastu: z.array(z.string()).optional().default([]), // Replacing "entities" with vastu (substances/entities)
  sambandha: z.array(z.string()).optional().default([]), // Replacing "relations" with sambandha (relations/connections)
  ghaṭanā: z.array(z.string()).optional().default([]), // Replacing "events" with ghaṭanā (occurrences/events)

  // Context-specific data (Jñāna - knowledge)
  sthiti: z.record(z.any()).optional().default({}), // Replacing "state" with sthiti (condition/state)
  lakṣaṇa: z.record(z.any()).optional().default({}), // Replacing "metadata" with lakṣaṇa (characteristics/attributes)

  // Access control (Adhikāra - authority/rights)
  adhikāra: z.record(z.boolean()).optional(), // Replacing "permissions" with adhikāra

  // Lifecycle properties (Jīvana-cakra - life cycle)
  utpanna: z
    .date()
    .optional()
    .default(() => new Date()), // Replacing "created" with utpanna (originated/arisen)
  parivardhita: z
    .date()
    .optional()
    .default(() => new Date()), // Replacing "updated" with parivardhita (developed/evolved)
  kartā: z.string().optional(), // Replacing "createdBy" with kartā (agent/doer)
});

/**
 * Niyama Schema - Defines constraints for context operations
 * Replacing FormContextConstraintSchema with Sanskrit term for "rule/restraint"
 */
export const NiyamaSchema = z.object({
  maximumVastu: z.number().optional(), // Replacing "maxEntities" with maximumVastu
  maximumSambandha: z.number().optional(), // Replacing "maxRelations" with maximumSambandha
  maximumGhaṭanā: z.number().optional(), // Replacing "maxEvents" with maximumGhaṭanā
  anumataVastuPrakāra: z.array(z.string()).optional(), // Replacing "allowedEntityTypes" with anumataVastuPrakāra
  anumataSambandhaPrakāra: z.array(z.string()).optional(), // Replacing "allowedRelationTypes" with anumataSambandhaPrakāra
  pathyaMātra: z.boolean().optional().default(false), // Replacing "readOnly" with pathyaMātra (read-only)
  pramāṇaStara: z
    .enum(["śūnya", "alpa", "prāmāṇika", "kaṭhora"])
    .optional()
    .default("prāmāṇika"),
  // Replacing "validationLevel" with pramāṇaStara (levels of epistemological validity)
  // "none", "minimal", "standard", "strict" -> "śūnya", "alpa", "prāmāṇika", "kaṭhora"
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
  ]), // Replacing "event" with ghaṭanā (event) + para (upon/following)
  nirvāhaka: z.function().or(z.string()), // Replacing "handler" with nirvāhaka (executor/performer)
  upādhi: z.record(z.any()).optional(), // Replacing "parameters" with upādhi (conditions/qualifications)
  sakriya: z.boolean().default(true), // Replacing "active" with sakriya (active/engaged)
});

/**
 * Anveṣaṇa Schema - For querying contexts
 * Replacing FormContextQuerySchema with Sanskrit term for "inquiry/search"
 */
export const AnveṣaṇaSchema = z.object({
  prakāra: PrakāraSchema.optional(), // Replacing "type" with prakāra
  sakriya: z.boolean().optional(), // Replacing "active" with sakriya
  janakId: z.string().optional(), // Replacing "parentId" with janakId (parent/generator)
  vastuDhārita: z.string().optional(), // Replacing "hasEntity" with vastuDhārita (entity-holding)
  sambandhaDhārita: z.string().optional(), // Replacing "hasRelation" with sambandhaDhārita
  lakṣaṇa: z.record(z.any()).optional(), // Replacing "metadata" with lakṣaṇa
  punaḥpraveśa: z.boolean().optional().default(false), // Replacing "recursive" with punaḥpraveśa (re-entering)
  niṣkriyaAnṭarbhāva: z.boolean().optional().default(false), // Replacing "includeInactive" with niṣkriyaAnṭarbhāva
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
  lakṣaṇa: z.record(z.any()).optional(), // metadata
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
  // Ensure prakāra is aligned with pariṇāma in execution contexts
  prakāra: z
    .enum(["niṣpādana", "guṇātmaka", "saṅkhyātmaka", "māyātmaka"])
    .default("niṣpādana"),

  // Execution-specific properties
  pariṇāma: NiṣpādanaPariṇāmaSchema.default("guṇātmaka"), // active execution mode
  // We keep niṣpādanaPariṇāma for backward compatibility
  niṣpādanaPariṇāma: NiṣpādanaPariṇāmaSchema.default("guṇātmaka"),

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
    .default([]),

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
    }),

  // Environment settings
  paryāvaraṇa: z.record(z.any()).optional().default({}), // environment variables

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
    }),
});

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
    .default("śūnya"),
  // Replacing "transactionState" with vyavahāraSthiti
  // "none", "active", "committed", "rolledBack" -> "śūnya", "sakriya", "samāhita", "vyāvartita"

  // Indexing and querying (Anukramaṇikā - indexing)
  anukramaṇikā: z
    .array(
      z.object({
        name: z.string(),
        prakāra: z.enum(["vastu", "sambandha", "ghaṭanā"]), // Replacing "type" with prakāra
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
      // Replacing "layout" with nyāsa (arrangement)
      // "default", "card", "table", "tree", "graph" -> "pramāṇika", "patraka", "tālikā", "vṛkṣa", "citragraphā"

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
        }),
    })
    .optional()
    .default({
      nyāsa: "pramāṇika",
    }),
});

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
export type FormContextRoot = Mūla;
export type FormExecutionEnvironmentType = NiṣpādanaPariṇāma;
export type FormExecutionOperation = KriyāPrakāra;
export type FormExecutionResult = NiṣpādanaPhala;
export type FormExecutionContext = NiṣpādanaSandarbha;
export type FormContext = Sandarbha;
