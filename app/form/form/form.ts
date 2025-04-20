import {
  // FormDefinition, // Still removed
  FormMatter,
  FormState, // Import the correct type inferred from FormStateSchema
} from "../schema/form";
import { v4 as uuidv4 } from 'uuid';

/**
 * Form - A simple class representing a realized instance of a form definition.
 * Primarily acts as a data container managed by FormEngine.
 */
export class Form {
  public readonly id: string;
  public readonly definitionId: string;
  public readonly definitionName: string;
  public data?: FormMatter;
  public state: FormState; // Use the correct FormState type

  /**
   * Create a new Form instance. Typically called only by FormEngine.
   */
  constructor(config: {
    id?: string;
    definitionId: string;
    definitionName: string;
    initialData?: FormMatter;
    initialState?: FormState;
  }) {
    this.id = config.id || `form:${uuidv4()}`;
    this.definitionId = config.definitionId;
    this.definitionName = config.definitionName;
    this.data = config.initialData;
    // Use a valid default status from the schema
    this.state = config.initialState || { status: "idle" };
  }

  getInfo() {
    return {
      id: this.id,
      definitionId: this.definitionId,
      definitionName: this.definitionName,
      state: this.state,
    };
  }

}