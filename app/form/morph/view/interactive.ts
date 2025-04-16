import { SimpleMorph } from "../morph";
import { FormShape } from "../../schema/form";
import { FormExecutionContext, ViewContext } from "../../schema/context";
import { ViewOutput, ViewField, determineFieldState } from "./display";
import { defineFieldStyles, defineActionStyles } from "./style";

/**
 * Action button definition
 */
export interface ActionButton {
  id: string;
  label: string;
  type: 'button';
  icon?: string;
  handler: string;
  meta?: Record<string, any>;
}

/**
 * Interactive view field
 */
export interface InteractiveViewField extends ViewField {
  interactive: true;
  expandable?: boolean;
  editable?: boolean;
}

/**
 * Interactive view output
 */
export interface InteractiveViewOutput extends ViewOutput {
  interactive: true;
  fields: InteractiveViewField[];
  actions?: ActionButton[];
  handlers?: Record<string, string>;
}

/**
 * Is a field type expandable?
 */
export function isExpandableFieldType(type: string): boolean {
  return ['object', 'array', 'json', 'richtext', 'code', 'table'].includes(type);
}

/**
 * Process a field for interactive view
 */
export function processFieldForInteractiveView(
  field: ViewField, 
  context: ViewContext
): InteractiveViewField {
  // Determine if field is expandable
  const expandable = isExpandableFieldType(field.type);
  
  // Generate interactive field styles
  const styles = defineFieldStyles(field.type, 'view', {
    state: determineFieldState(field),
    variant: context.variant,
    properties: {
      cursor: expandable ? 'pointer' : undefined,
      transition: 'all 0.2s ease',
      ':hover': expandable ? {
        backgroundColor: 'var(--hover-bg, rgba(0,0,0,0.03))'
      } : undefined
    }
  });
  
  return {
    ...field,
    interactive: true,
    expandable,
    editable: context.editable === true,
    meta: {
      ...field.meta,
      styles
    }
  };
}

/**
 * Generate default actions for interactive view
 */
export function generateDefaultActions(context: ViewContext): ActionButton[] {
  const actions: ActionButton[] = [];
  
  // Add edit button if editing is allowed
  if (context.allowEdit !== false) {
    actions.push({
      id: 'edit',
      label: 'Edit',
      type: 'button',
      icon: 'edit',
      handler: 'onEdit',
      meta: {
        styles: defineActionStyles('button', {
          intent: 'primary',
          scale: 'md'
        })
      }
    });
  }
  
  // Add print button
  actions.push({
    id: 'print',
    label: 'Print',
    type: 'button',
    icon: 'print',
    handler: 'onPrint',
    meta: {
      styles: defineActionStyles('button', {
        intent: 'secondary',
        scale: 'md'
      })
    }
  });
  
  // Add custom actions from context
  if (context.customActions?.length) {
    actions.push(...context.customActions.map(action => ({
      ...action,
      meta: {
        ...action.meta,
        styles: defineActionStyles('button', {
          intent: action.meta?.intent || 'secondary',
          scale: action.meta?.scale || 'md'
        })
      }
    })));
  }
  
  return actions;
}

/**
 * Transform form to interactive view
 */
export const InteractiveViewMorph = new SimpleMorph<FormShape, InteractiveViewOutput>(
  "InteractiveViewMorph",
  (form, context: FormExecutionContext) => {
    // Validate input
    if (!form || !Array.isArray(form.fields)) {
      throw new Error("Invalid form shape provided to InteractiveViewMorph");
    }
    
    // First create basic view
    const basicView = ShapeViewMorph.apply(form, context) as ViewOutput;
    
    // Ensure we're working with a view context
    const viewContext = context as ViewContext;
    
    // Process fields for interactivity
    const interactiveFields = basicView.fields.map(field => 
      processFieldForInteractiveView(field, viewContext)
    );
    
    // Generate actions
    const actions = generateDefaultActions(viewContext);
    
    // Create standard handlers
    const handlers = {
      onToggleField: 'toggleFieldDetails',
      onAction: 'handleAction',
      ...(viewContext.handlers || {})
    };
    
    // Return interactive view
    return {
      ...basicView,
      fields: interactiveFields,
      interactive: true,
      actions,
      handlers
    };
  },
  {
    pure: true,
    fusible: false,  // Can't be fused since it depends on ViewTransformMorph
    cost: 3,
    memoizable: true
  }
);

/**
 * Make a regular view interactive
 */
export const AddInteractivityMorph = new SimpleMorph<ViewOutput, InteractiveViewOutput>(
  "AddInteractivityMorph",
  (view, context: FormExecutionContext) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to AddInteractivityMorph");
    }
    
    // Ensure we're working with a view context
    const viewContext = context as ViewContext;
    
    // Process fields for interactivity
    const interactiveFields = view.fields.map(field => 
      processFieldForInteractiveView(field, viewContext)
    );
    
    // Generate actions
    const actions = generateDefaultActions(viewContext);
    
    // Create standard handlers
    const handlers = {
      onToggleField: 'toggleFieldDetails',
      onAction: 'handleAction',
      ...(viewContext.handlers || {})
    };
    
    // Return interactive view
    return {
      ...view,
      fields: interactiveFields,
      interactive: true,
      actions,
      handlers
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1.5,
    memoizable: true
  }
);