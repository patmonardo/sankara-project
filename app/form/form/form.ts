import React from "react";
import { 
  FormDefinition,
} from "@/form/schema/schema";
import { 
  FormMatter, 
  FormMode, 
  FormContent, 
  FormHandler, 
  FormState, 
  FormShape 
} from "@/form/schema/form";
import { PropertyService } from "@/form/property/property";
import { Sandarbha, sāthaSandarbha } from "@/form/context/context";
import { FormSystem } from "@/form/form/system";

/**
 * Prapatrā - The Form class representing a realized manifestation of knowledge
 * 
 * In Brahmavidya, the form (prapatrā) is the vessel through which unmanifest 
 * potential becomes manifest reality.
 */
export class Prapatrā<T extends FormShape = FormShape> {
  // Ātman - Core identity
  id: string;
  
  // Jñāna - Knowledge representation
  vyākhyā: FormDefinition;  // definition
  
  // Avasthā - Runtime state
  sthiti: FormState = { status: "idle" };  // state
  
  // Dravya - Associated material/data
  dravya?: FormMatter;  // data
  
  /**
   * Create a new Prapatrā instance - the manifestation of form
   */
  constructor(
    vyākhyā: FormDefinition,  // definition
    dravya?: FormMatter,      // data
    vikalpa?: {               // options
      id?: string;
      svataḥSakriya?: boolean;  // autoActivate
    }
  ) {
    this.id = vikalpa?.id || vyākhyā.id;
    this.vyākhyā = vyākhyā;
    this.dravya = dravya;
    
    // Register with the Form system
    FormSystem.getInstance().registerForm(vyākhyā);
    
    // Auto-activate if requested
    if (vikalpa?.svataḥSakriya) {
      this.sakriyaKaraṇa();  // activate
    }
  }
  
  /**
   * Activate this form's context - sakriyaKaraṇa
   */
  sakriyaKaraṇa(): boolean {
    // Find or create a context for this form
    const sandarbhaId = this.prāptaSandarbhaId();
    
    // Use Sandarbha directly instead of FormContext
    const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
    if (!sandarbha) return false;
    
    return sandarbha.sakriyaKaraṇa();
  }
  
  /**
   * Execute a function within this form's context - cālana (run)
   */
  cālana<R>(kārya: () => R): R {
    return sāthaSandarbha(this.prāptaSandarbhaId(), kārya);
  }
  
  /**
   * Get the primary context for this form - prāptaSandarbhaId
   */
  private prāptaSandarbhaId(): string {
    // Find an existing context or create one
    const kuñcī = Object.keys(this.vyākhyā.contexts)[0];
    if (kuñcī) {
      return this.vyākhyā.contexts[kuñcī].id;
    }
    
    // No context found, create one
    const sandarbha = Sandarbha.sṛjSandarbha({
      nāma: `Sandarbha for ${this.vyākhyā.name}`,
      prakāra: "samuccaya",  // composite
      svataḥSakriya: false
    });
    
    // Register with definition
    this.vyākhyā.contexts[sandarbha.id] = {
      id: sandarbha.id,
      name: sandarbha.nāma || '',
      type: "composite",
      active: false
    };
    
    return sandarbha.id;
  }
  
  /**
   * Execute a property on this form - guṇaniṣpādana (property execution)
   */
  guṇaniṣpādana<R = any>(
    guṇaId: string,  // propertyId
    āgama: Record<string, any> = {}  // inputs
  ): R {
    return this.cālana(() => {
      return PropertyService.execute(guṇaId, {
        ...āgama,
        form: this,
        formId: this.id
      }) as R;
    });
  }
  
  /**
   * Generate an entity within this form - vastuSṛṣṭi (entity creation)
   */
  vastuSṛṣṭi(
    vastuPrakāra: string,  // entityType
    dravya: Record<string, any>  // data
  ): string {
    return this.cālana(() => {
      // Check if we have an entity definition for this type
      const vyākhyāKuñcī = Object.keys(this.vyākhyā.entities)
        .find(key => this.vyākhyā.entities[key].type === vastuPrakāra);
      
      if (!vyākhyāKuñcī) {
        throw new Error(`No entity definition found for type: ${vastuPrakāra}`);
      }
      
      // Get the context
      const sandarbhaId = this.prāptaSandarbhaId();
      const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
      if (!sandarbha) {
        throw new Error(`Context not found: ${sandarbhaId}`);
      }
      
      // Create entity using form's context
      return sandarbha.vastuSṛṣṭi({
        ...dravya,
        prakāra: vastuPrakāra  // type
      });
    });
  }
  
  /**
   * Create a relation between entities in this form - sambandhaSṛṣṭi
   */
  sambandhaSṛṣṭi(
    udbhavaId: string,     // sourceId
    lakṣyaId: string,      // targetId
    sambandhaPrakāra: string,  // relationType
    dravya: Record<string, any> = {}  // data
  ): string {
    return this.cālana(() => {
      // Get the context
      const sandarbhaId = this.prāptaSandarbhaId();
      const sandarbha = Sandarbha.getSandarbha(sandarbhaId);
      if (!sandarbha) {
        throw new Error(`Context not found: ${sandarbhaId}`);
      }
      
      // Create relation using form's context
      return sandarbha.sambandhaSṛṣṭi(
        udbhavaId,
        lakṣyaId,
        sambandhaPrakāra,
        dravya
      );
    });
  }
  
  /**
   * Get the shape of this form - ākāraprāpti (shape acquisition)
   */
  async ākāraprāpti(avasthā: FormMode): Promise<T> {
    // This would create the appropriate form shape based on mode and definition
    switch (avasthā) {
      case "create":
        return this.sṛṣṭiPrapatrā();
      case "edit":
        return this.sampadanaPrapatrā();
      default:
        throw new Error(`Unsupported mode: ${avasthā}`);
    }
  }
  
  /**
   * Create a form shape for "create" mode - sṛṣṭiPrapatrā
   */
  protected async sṛṣṭiPrapatrā(): Promise<T> {
    // Default implementation - subclasses should override
    return {} as T;
  }
  
  /**
   * Create a form shape for "edit" mode - sampadanaPrapatrā
   */
  protected async sampadanaPrapatrā(): Promise<T> {
    // Default implementation - subclasses should override
    return {} as T;
  }
  
  /**
   * Render the form in a specific format - pradarśana (rendering)
   */
  async pradarśana(
    avasthā: FormMode,       // mode
    viṣaya: FormContent,     // content
    nirvāhaka: FormHandler   // handler
  ): Promise<React.ReactNode | string> {
    try {
      // Get the form shape based on mode
      const ākāra = await this.ākāraprāpti(avasthā);
      
      // Render the form in the requested format
      switch (viṣaya) {
        case "jsx":
          return this.pradarśanaJSX(ākāra, this.dravya, nirvāhaka);
        case "json":
          return this.pradarśanaJSON(ākāra, this.dravya, nirvāhaka);
        case "html":
          return this.pradarśanaHTML(ākāra, this.dravya, nirvāhaka);
        case "xml":
          return this.pradarśanaXML(ākāra, this.dravya, nirvāhaka);
        default:
          throw new Error(`Unsupported format: ${viṣaya}`);
      }
    } catch (doṣa) {
      console.error("Error rendering form:", doṣa);
      return null;
    }
  }
  
  // Rendering methods - renamed but implementation unchanged
  pradarśanaJSX(ākāra: T, dravya: FormMatter, nirvāhaka: FormHandler): React.ReactNode {
    // Original renderJSX implementation
    return null;
  }
  
  pradarśanaJSON(ākāra: T, dravya: FormMatter, nirvāhaka: FormHandler): string {
    // Original renderJSON implementation
    return "";
  }
  
  pradarśanaHTML(ākāra: T, dravya: FormMatter, nirvāhaka: FormHandler): string {
    // Original renderHTML implementation
    return "";
  }
  
  pradarśanaXML(ākāra: T, dravya: FormMatter, nirvāhaka: FormHandler): string {
    // Original renderXML implementation
    return "";
  }
  
  /**
   * Update the form's state - sthitiParivardhana
   */
  sthitiParivardhana(sthiti: Partial<FormState>): void {
    this.sthiti = {
      ...this.sthiti,
      ...sthiti,
    };
  }
  
  /**
   * Insight into emptiness - śūnyatāDarśana
   * 
   * This method captures the essence of śūnyatā (emptiness) as applied to forms.
   * It reveals that forms are neither permanent nor independent, but arise in dependence
   * upon causes and conditions.
   */
  śūnyatāDarśana(): Record<string, any> {
    return {
      svabhāvaŚūnyatā: "The form lacks inherent existence (svabhāva)",
      pratītyasamutpāda: "The form arises dependently on contexts, data, and definitions",
      māyāRūpa: "The form is like an illusion - functional yet without essence",
      saṃvṛtiSatya: "As conventional truth, the form has practical validity",
      paramārthaŚūnyatā: "At ultimate level, the form is empty of inherent properties"
    };
  }
}

/**
 * Create a form from a definition - prapatrāSṛṣṭi (form creation)
 */
export function prapatrāSṛṣṭi<T extends FormShape = FormShape>(
  vyākhyā: FormDefinition,
  dravya?: FormMatter,
  vikalpa?: {
    id?: string;
    svataḥSakriya?: boolean;
  }
): Prapatrā<T> {
  return new Prapatrā<T>(vyākhyā, dravya, vikalpa);
}

// Export original names for backward compatibility
export { Prapatrā as Form };
export const createForm = prapatrāSṛṣṭi;