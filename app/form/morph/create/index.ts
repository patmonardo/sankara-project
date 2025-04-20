// Export types
export * from "./types";

// Export core create morph
export { CreateMorph } from "./create";

// Export specialized morphs
export { GenerateCreateActionsMorph } from "./actions";
export { CustomizeFieldsMorph } from "./customize";
export { ApplyTemplateMorph } from "./template";

// Export pipeline
export { CreateModePipeline } from "./pipeline";

// Convenience functions
import { FormShape } from "../../schema/form";
import { CreateShape, CreateContext } from "./types";
import { CreateModePipeline } from "./pipeline";

/**
 * Transform a FormShape into a CreateShape
 */
export function createForm(shape: FormShape, context?: CreateContext): CreateShape {
  return CreateModePipeline.transform(shape, context);
}

/**
 * Create a form from a template
 */
export function createFromTemplate(
  shape: FormShape,
  template: {
    id: string;
    name: string;
    values: Record<string, any>;
    description?: string;
  },
  options: Partial<CreateContext> = {}
): CreateShape {
  const context: CreateContext = {
    ...options,
    template
  };
  
  return createForm(shape, context);
}

/**
 * Create a form with custom field configurations
 */
export function createCustomForm(
  shape: FormShape,
  customization: NonNullable<CreateContext['customization']>,
  options: Partial<CreateContext> = {}
): CreateShape {
  const context: CreateContext = {
    ...options,
    customization
  };
  
  return createForm(shape, context);
}