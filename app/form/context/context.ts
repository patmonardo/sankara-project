import { FormRelation } from "@/form/relation/relation"; // Assuming emitter access
import { EntityEngineVerbs } from "../entity/engine"; // Assuming verbs are defined here

/**
 * Sandarbha (FormContext) implementation
 *
 * A Sandarbha represents a bounded operational environment
 * within which vastu (entities) and sambandha (relations) operate.
 */

// Define an interface for the query options (if not already defined)
interface SambandhaQueryOptions {
  mode?: string; // Relation type
  sūtra?: string; // Source ID
  para?: string; // Target ID
  // Add other potential query fields if needed
}

/**
 * SandarbhaGhaṭanā interface for context lifecycle events
 */
export interface SandarbhaGhaṭanā {
  mode: "utpanna" | "sakriya" | "niṣkriya" | "parivardhita" | "nāśa";
  // "created", "activated", "deactivated", "updated", "deleted" -> Sanskrit equivalents
  sandarbhaId: string;
  kālamudrā: number; // timestamp
  mark?: Record<string, any>; // metadata
}

export class Sandarbha<T = any> {
  // Svarūpa - Identity properties
  id: string;
  mode: string; // (type)
  nāma?: string; // (name)

  // Sopāna - Hierarchical structure
  janakId?: string; // (parentId)
  santati: Set<string> = new Set(); // (children)

  // Viṣaya - Content tracking
  vastu: Set<string> = new Set(); // (entities)
  sambandha: Set<string> = new Set(); // (relations)
  ghaṭanā: Set<string> = new Set(); // New Sanskrit: events -> ghaṭanā

  // Avasthā - Status
  sakriya: boolean = false; // (active)
  kālamudrā: number; // (timestamp)

  // Lakṣaṇa - Metadata
  mark?: Record<string, any>; // (metadata)
  adhikāra?: Record<string, boolean>; // New Sanskrit: permissions -> adhikāra

  // Lifecycle tracking
  utpanna: number; // New Sanskrit: created -> utpanna
  parivardhita: number; // New Sanskrit: updated -> parivardhita
  kartā?: string; // New Sanskrit: createdBy -> kartā

  // Viṣaya/Vinyāsa - Content/configuration
  vinyāsa?: T; // (config)
  data?: Record<string, any>; // New Sanskrit: state -> data

  // Vyavahāra - Transaction support
  vyavahāraId?: string; // Transaction ID
  vyavahāraSthiti: string = "śūnya"; // Transaction state: none/active/committed/rolled back

  // Ghaṭanā prasāraka - Event emitter for local events
  private ghaṭanāPrasāraka: any = null; // (eventEmitter)

  // Static context registry
  private static sandarbha: Map<string, Sandarbha> = new Map();
  private static sakriyaSandarbhaId: string | null = null;

  /**
   * Create a new Sandarbha (context)
   */
  constructor(vikalpa: {
    id?: string;
    mode?: string;
    nāma?: string;
    janakId?: string;
    mark?: Record<string, any>;
    vinyāsa?: T;
    svataḥSakriya?: boolean; // autoActivate
    adhikāra?: Record<string, boolean>; // New param: permissions
    kartā?: string; // New param: creator
    vyavahāraId?: string; // Transaction ID
    vyavahāraSthiti?: string; // Transaction state
  }) {
    this.id =
      vikalpa.id ||
      `sandarbha:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    this.mode = vikalpa.mode || "sandarbha";
    this.nāma = vikalpa.nāma;
    this.janakId = vikalpa.janakId;
    this.mark = vikalpa.mark || {};
    this.vinyāsa = vikalpa.vinyāsa;
    this.adhikāra = vikalpa.adhikāra; // New property
    this.kartā = vikalpa.kartā; // New property
    this.kālamudrā = Date.now();
    this.utpanna = Date.now(); // Initialize creation time
    this.parivardhita = Date.now(); // Initialize update time

    // Initialize new properties
    this.ghaṭanā = new Set();
    this.data = {};

    // Initialize transaction properties
    this.vyavahāraId = vikalpa.vyavahāraId;
    this.vyavahāraSthiti = vikalpa.vyavahāraSthiti || "śūnya";

    // Register in context registry
    Sandarbha.sandarbha.set(this.id, this);

    // Add as child to parent if exists
    if (this.janakId) {
      const janaka = Sandarbha.getSandarbha(this.janakId);
      if (janaka) {
        janaka.santati.add(this.id);
      }
    }

    // Emit context created event
    this.emitSandarbhaGhaṭanā("utpanna");

    // Activate if specified
    if (vikalpa.svataḥSakriya) {
      this.sakriyaKaraṇa(); // activate
    }
  }

  /**
   * Get the active Sandarbha or null if none is active
   */
  static getSakriyaSandarbha(): Sandarbha | null {
    return Sandarbha.sakriyaSandarbhaId
      ? Sandarbha.sandarbha.get(Sandarbha.sakriyaSandarbhaId) || null
      : null;
  }

  /**
   * Get a Sandarbha by ID
   */
  static getSandarbha(id: string): Sandarbha | undefined {
    return Sandarbha.sandarbha.get(id);
  }

  /**
   * Switch the active context to the specified context
   */
  static parivartanaSandarbha(
    sandarbhaId: string,
    vikalpa: {
      janakaSandarbhaRakṣaṇa?: boolean; // preserveParentContext
      maunī?: boolean; // silent
    } = {}
  ): boolean {
    const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
    if (!sandarbha) {
      return false;
    }

    // Check if this context is already active
    if (Sandarbha.sakriyaSandarbhaId === sandarbhaId) {
      return true;
    }

    // Deactivate current context if one is active
    if (Sandarbha.sakriyaSandarbhaId) {
      const vartamānaSandarbha = Sandarbha.getSandarbha(
        Sandarbha.sakriyaSandarbhaId
      );
      if (vartamānaSandarbha) {
        vartamānaSandarbha.niṣkriyaKaraṇa({
          maunī: vikalpa.maunī,
        });
      }
    }

    // Activate the new context
    return sandarbha.sakriyaKaraṇa({
      sakriyaSandarbhaRakṣaṇa: vikalpa.janakaSandarbhaRakṣaṇa, // preserveActiveContext
      maunī: vikalpa.maunī,
    });
  }

  /**
   * Execute a function within a specific context
   */
  static sāthaSandarbha<R>(sandarbhaId: string, kārya: () => R): R {
    const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
    if (!sandarbha) {
      throw new Error(`Sandarbha not found: ${sandarbhaId}`);
    }

    // Store the previous active context
    const pūrvaSandarbhaId = Sandarbha.sakriyaSandarbhaId;

    try {
      // Activate this context temporarily
      Sandarbha.sakriyaSandarbhaId = sandarbhaId;

      // Execute function
      return kārya();
    } finally {
      // Restore previous context
      Sandarbha.sakriyaSandarbhaId = pūrvaSandarbhaId;
    }
  }

  /**
   * Create a new Sandarbha instance (static factory method)
   */
  static sṛjSandarbha(vikalpa: {
    id?: string;
    mode?: string;
    nāma?: string;
    janakId?: string;
    mark?: Record<string, any>;
    vinyāsa?: any;
    svataḥSakriya?: boolean;
    vyavahāraId?: string;
    vyavahāraSthiti?: string;
  }): Sandarbha {
    return new Sandarbha(vikalpa);
  }

  /**
   * Activate this context - sakriyaKaraṇa (making active)
   */
  sakriyaKaraṇa(
    vikalpa: {
      santatiSakriyaKaraṇa?: boolean; // activateChildren
      punaḥpraveśa?: boolean; // recursive
      maunī?: boolean; // silent
      sakriyaSandarbhaRakṣaṇa?: boolean; // preserveActiveContext
    } = {}
  ): boolean {
    if (this.sakriya) {
      return true;
    }

    // Check for circular context activation
    if (this.janakId && this.hasPūrvaja(this.id)) {
      throw new Error(`Circular context activation detected: ${this.id}`);
    }

    // Deactivate current active context if exists and we're not preserving it
    if (!vikalpa.sakriyaSandarbhaRakṣaṇa && Sandarbha.sakriyaSandarbhaId) {
      const vartamānaSandarbha = Sandarbha.getSandarbha(
        Sandarbha.sakriyaSandarbhaId
      );
      if (vartamānaSandarbha) {
        vartamānaSandarbha.niṣkriyaKaraṇa({ maunī: vikalpa.maunī });
      }
    }

    // Set as active
    this.sakriya = true;
    Sandarbha.sakriyaSandarbhaId = this.id;
    this.kālamudrā = Date.now();

    // Emit context activated event if not silent
    if (!vikalpa.maunī) {
      this.emitSandarbhaGhaṭanā("sakriya");
    }

    // Activate children if requested
    if (vikalpa.santatiSakriyaKaraṇa && this.santati.size > 0) {
      for (const santatiId of this.santati) {
        const santati = Sandarbha.getSandarbha(santatiId);
        if (santati) {
          santati.sakriyaKaraṇa({
            santatiSakriyaKaraṇa: vikalpa.punaḥpraveśa,
            maunī: vikalpa.maunī,
            sakriyaSandarbhaRakṣaṇa: true,
          });
        }
      }
    }

    return true;
  }

  /**
   * Deactivate this context - niṣkriyaKaraṇa (making inactive)
   */
  niṣkriyaKaraṇa(
    vikalpa: {
      santatiNiṣkriyaKaraṇa?: boolean; // deactivateChildren
      punaḥpraveśa?: boolean; // recursive
      maunī?: boolean; // silent
      janakaSakriyaKaraṇa?: boolean; // activateParent
    } = {}
  ): boolean {
    if (!this.sakriya) {
      return true;
    }

    // Save parent reference before deactivation
    const janakId = this.janakId;

    // Deactivate children first if requested
    if (
      (vikalpa.santatiNiṣkriyaKaraṇa || vikalpa.punaḥpraveśa) &&
      this.santati.size > 0
    ) {
      for (const santatiId of this.santati) {
        const santati = Sandarbha.getSandarbha(santatiId);
        if (santati) {
          santati.niṣkriyaKaraṇa({
            santatiNiṣkriyaKaraṇa: vikalpa.punaḥpraveśa,
            maunī: vikalpa.maunī,
          });
        }
      }
    }

    this.sakriya = false;

    // Clear active context reference if we're the active context
    if (Sandarbha.sakriyaSandarbhaId === this.id) {
      Sandarbha.sakriyaSandarbhaId = null;
    }

    // Emit context deactivated event if not silent
    if (!vikalpa.maunī) {
      this.emitSandarbhaGhaṭanā("niṣkriya");
    }

    // Activate parent if requested
    if (vikalpa.janakaSakriyaKaraṇa && janakId) {
      const janaka = Sandarbha.getSandarbha(janakId);
      if (janaka) {
        janaka.sakriyaKaraṇa({ maunī: vikalpa.maunī });
      }
    }

    return true;
  }

  /**
   * Update context properties - parivardhita (developed/updated)
   */
  parivardhana(parivardhita: {
    nāma?: string;
    mark?: Record<string, any>;
    vinyāsa?: T;
    data?: Record<string, any>; // State updates
    vyavahāraId?: string; // Transaction ID
    vyavahāraSthiti?: string; // Transaction state
  }): boolean {
    // Update properties
    if (parivardhita.nāma !== undefined) {
      this.nāma = parivardhita.nāma;
    }

    if (parivardhita.mark) {
      this.mark = {
        ...this.mark,
        ...parivardhita.mark,
      };
    }

    if (parivardhita.vinyāsa) {
      this.vinyāsa = {
        ...this.vinyāsa,
        ...parivardhita.vinyāsa,
      };
    }

    // Handle state updates
    if (parivardhita.data) {
      this.data = {
        ...this.data,
        ...parivardhita.data,
      };
    }

    // Handle transaction updates
    if (parivardhita.vyavahāraId !== undefined) {
      this.vyavahāraId = parivardhita.vyavahāraId;
    }

    if (parivardhita.vyavahāraSthiti !== undefined) {
      this.vyavahāraSthiti = parivardhita.vyavahāraSthiti;
    }

    this.kālamudrā = Date.now();
    this.parivardhita = Date.now(); // Update modification timestamp

    // Update in registry
    Sandarbha.sandarbha.set(this.id, this);

    // Emit context updated event
    this.emitSandarbhaGhaṭanā("parivardhita");

    return true;
  }

  /**
   * Delete this context - nāśa (destruction)
   */
  nāśa(): boolean {
    // Cannot delete active context
    if (this.sakriya) {
      throw new Error(`Cannot delete active context: ${this.id}`);
    }

    // Remove from parent's children list
    if (this.janakId) {
      const janaka = Sandarbha.getSandarbha(this.janakId);
      if (janaka) {
        janaka.santati.delete(this.id);
      }
    }

    // Transfer children to parent or make them root contexts
    if (this.santati.size > 0) {
      for (const santatiId of this.santati) {
        const santati = Sandarbha.getSandarbha(santatiId);
        if (santati) {
          santati.janakId = this.janakId;
          if (this.janakId) {
            const janaka = Sandarbha.getSandarbha(this.janakId);
            if (janaka) {
              janaka.santati.add(santatiId);
            }
          }
        }
      }
    }

    // Emit context deleted event
    this.emitSandarbhaGhaṭanā("nāśa");

    // Remove from registry
    return Sandarbha.sandarbha.delete(this.id);
  }

  /**
   * Start a transaction - vyavahāraPrārambha
   */
  vyavahāraPrārambha(vyavahāraId?: string): boolean {
    if (this.vyavahāraSthiti !== "śūnya") {
      return false; // Already in a transaction
    }

    this.vyavahāraId =
      vyavahāraId ||
      `vyavahāra:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    this.vyavahāraSthiti = "sakriya";

    return true;
  }

  /**
   * Commit a transaction - vyavahāraSamāhāra
   */
  vyavahāraSamāhāra(): boolean {
    if (this.vyavahāraSthiti !== "sakriya") {
      return false; // Not in an active transaction
    }

    this.vyavahāraSthiti = "samāhita";

    return true;
  }

  /**
   * Rollback a transaction - vyavahāraVyāvartana
   */
  vyavahāraVyāvartana(): boolean {
    if (this.vyavahāraSthiti !== "sakriya") {
      return false; // Not in an active transaction
    }

    this.vyavahāraSthiti = "vyāvartita";

    return true;
  }

  /**
   * Register an entity with this context - vastuPañjīkaraṇa (entity registration)
   */
  vastuPañjīkaraṇa(vastuId: string): boolean {
    if (!vastuId) {
      return false;
    }

    // Add to entities set
    this.vastu.add(vastuId);

    // TODO: Update entity with context if entity implementation available

    return true;
  }

  /**
   * Retrieves relations within this context based on query options.
   * sambandhāḥPrāpti (Obtaining Relations)
   *
   * @param options - Criteria to filter relations (mode, sūtra, para).
   * @returns An array of matching FormRelation objects.
   */
  sambandhāḥPrāpti(options: SambandhaQueryOptions): FormRelation[] {
    console.log(
      `Querying relations in context ${this.id} with options:`,
      options
    );

    const results: FormRelation[] = [];

    // Iterate through the stored relation IDs in the Set
    for (const relationId of this.sambandha) {
      // Retrieve the full relation object using its ID
      // --- Use the preferred method name ---
      const relation = FormRelation.getRelation(relationId);
      // --- End change ---

      if (!relation) {
        // Relation ID exists in the context, but the object couldn't be found
        // This might indicate an inconsistency - log a warning.
        console.warn(
          `Relation object not found for registered ID ${relationId} during query in context ${this.id}.`
        );
        continue; // Skip this ID
      }

      // Now 'relation' is a FormRelation object, apply filtering
      let match = true;
      if (options.mode && relation.type !== options.mode) {
        match = false;
      }
      // --- Adjust filtering based on FormRelation properties ---
      // Assuming FormRelation has 'source' and 'target' properties which are FormEntity objects
      if (options.sūtra && relation.source?.id !== options.sūtra) {
        match = false;
      }
      if (options.para && relation.target?.id !== options.para) {
        match = false;
      }
      // --- End adjustment ---

      // If all criteria match, add the retrieved relation object to results
      if (match) {
        results.push(relation);
      }
    }

    console.log(
      `Found ${results.length} matching relations in context ${this.id}.`
    );
    return results;
  }

  /**
   * Register a relation with this context - sambandhaPañjīkaraṇa (relation registration)
   */
  sambandhaPañjīkaraṇa(sambandhaId: string): boolean {
    if (!sambandhaId) {
      return false;
    }

    // Add to relations set
    this.sambandha.add(sambandhaId);

    // TODO: Update relation with context if relation implementation available

    return true;
  }

  /**
   * Get all entities in this context - sarvaVastuPrāpti (obtain all entities)
   */
  sarvaVastuPrāpti(): any[] {
    // Note: Reimplement with actual entity type when available
    return Array.from(this.vastu)
      .map((id) => ({ id })) // Placeholder for entity retrieval
      .filter((entity) => entity !== undefined);
  }

  /**
   * Get all relations in this context - sarvaSambandhaPrāpti (obtain all relations)
   */
  sarvaSambandhaPrāpti(): any[] {
    // Note: Reimplement with actual relation type when available
    return Array.from(this.sambandha)
      .map((id) => ({ id })) // Placeholder for relation retrieval
      .filter((relation) => relation !== undefined);
  }

  /**
   * Request creation of a new entity associated with this context.
   * Emits a verb to EntityEngine.
   */
 
  /**
   * Create a new entity in this context - vastuNirmāṇa (entity construction/making)
   * TEMPORARY STUB - Does not actually create an entity or emit a verb.
   */
  vastuNirmāṇa(data: Record<string, any>): string {
    const tempId = data.id || `stub_entity:${Date.now()}`;
    console.warn(`Sandarbha.vastuNirmāṇa STUBBED: Would request entity creation for ID ${tempId} in context ${this.id}. Data:`, data);
    // Does NOT call FormEntity or emit a verb.
    return tempId; // Return a dummy ID
  }

  /**
   * Creates a new relation within this context.
   * (Implementation details will depend on how relations are stored)
   *
   * @param sūtraId - The ID of the source entity/node.
   * @param paraId - The ID of the target entity/node.
   * @param mode - The type of the relation.
   * @param mark - Optional properties/metadata for the relation.
   * @returns The created relation object or its ID (adjust as needed).
   */

  sambandhaNirmāṇa(
    sūtraId: string,
    paraId: string,
    mode: string,
    mark?: Record<string, any>
  ): any {
    // <-- Adjust return type as needed
    console.log(
      `Creating relation in context ${this.id}: ${sūtraId} -[${mode}]-> ${paraId}`
    );

    // --- IMPLEMENTATION NEEDED ---
    // This is where you'll add the logic to:
    // 1. Create a new relation object/record.
    // 2. Store it within the context's relation management system
    //    (e.g., add to a Map, push to an array, interact with a graph store).
    // 3. Return the newly created relation or relevant information.

    const newRelation = {
      id: `${mode}:${sūtraId}:${paraId}:${Date.now()}`, // Example ID
      sūtra: sūtraId,
      para: paraId,
      mode: mode,
      mark: { ...mark, created: new Date() },
      contextId: this.id,
    };

    // Example: Storing in a Map if relations are managed that way
    // if (!this.relations) this.relations = new Map(); // Assuming 'relations' property exists
    // this.relations.set(newRelation.id, newRelation);

    // Placeholder return - adjust based on your actual storage and needs
    return newRelation;
    // --- END IMPLEMENTATION ---
  }

  /**
   * Run a function in this context's scope - cālana (running)
   */
  cālana<R>(kārya: () => R): R {
    return Sandarbha.sāthaSandarbha(this.id, kārya);
  }

  /**
   * Emit a context event - sandarbhaGhaṭanāPrasāraṇa (context event emission)
   */
  protected emitSandarbhaGhaṭanā(
    mode: "utpanna" | "sakriya" | "niṣkriya" | "parivardhita" | "nāśa"
  ): void {
    const ghaṭanā: SandarbhaGhaṭanā = {
      mode,
      sandarbhaId: this.id,
      kālamudrā: Date.now(),
      mark: this.mark,
    };

    // TODO: Emit event properly when event system is available
    // For now, just add a listener method stub
  }

  /**
   * Add event listener - śrotaYojana (add listener)
   */
  on(ghaṭanāPrakāra: string, śrota: Function): void {
    // TODO: Implement event listener system
  }

  /**
   * Remove event listener - śrotaApasāraṇa (remove listener)
   */
  off(ghaṭanāPrakāra: string, śrota: Function): void {
    // TODO: Implement event listener removal
  }

  /**
   * Check if a context is an ancestor of this context - hasPūrvaja (has ancestor)
   */
  private hasPūrvaja(sandarbhaId: string): boolean {
    let vartamāna = this.janakId ? Sandarbha.getSandarbha(this.janakId) : null;

    while (vartamāna) {
      if (vartamāna.id === sandarbhaId) {
        return true;
      }
      vartamāna = vartamāna.janakId
        ? Sandarbha.getSandarbha(vartamāna.janakId)
        : null;
    }

    return false;
  }
}

/**
 * Create a Sandarbha instance - sandarbhaSṛṣṭi (create context)
 */
export function sandarbhaSṛṣṭi(vinyāsa: {
  id?: string;
  mode?: string; // type
  nāma?: string; // name
  janakId?: string; // parentId
  mark?: Record<string, any>; // metadata
  vinyāsa?: any; // config
  svataḥSakriya?: boolean; // autoActivate
  vyavahāraId?: string; // Transaction ID
  vyavahāraSthiti?: string; // Transaction state
}): Sandarbha {
  return new Sandarbha(vinyāsa);
}

/**
 * Get a context by ID - sandarbhaPrāpti (obtain context)
 */
export function sandarbhaPrāpti(id: string): Sandarbha | undefined {
  return Sandarbha.getSandarbha(id);
}

/**
 * Get the currently active context - sakriyaSandarbhaPrāpti (obtain active context)
 */
export function sakriyaSandarbhaPrāpti(): Sandarbha | null {
  return Sandarbha.getSakriyaSandarbha();
}

/**
 * Run a function in the context of a specific space - sāthaSandarbha (with context)
 */
export function sāthaSandarbha<T>(sandarbhaId: string, kārya: () => T): T {
  return Sandarbha.sāthaSandarbha(sandarbhaId, kārya);
}

// Export original names for backward compatibility
export { Sandarbha as FormContext };
export type { SandarbhaGhaṭanā as FormContextEvent };
export const createFormContext = sandarbhaSṛṣṭi;
export const getContext = sandarbhaPrāpti;
export const getActiveContext = sakriyaSandarbhaPrāpti;
export const withContext = sāthaSandarbha;
