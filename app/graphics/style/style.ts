import React from 'react';
import { md } from "@/ui/theme/token";
import { StyleContext } from "../schema/context";
import { SimpleMorph } from "../morph/morph";

/**
 * StyleShape: The input to a style morphism
 */
export interface StyleShape {
  domain?: 'knowledge' | 'text' | 'form' | 'visualization' | 'action';
  intent?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  scale?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: string;
  
  // For field styling
  fieldType?: string;
  
  // For action styling
  actionType?: 'button' | 'link' | 'menu' | 'icon';
  
  // Additional style properties
  properties?: Record<string, any>;
  
  // Theme override
  theme?: 'light' | 'dark' | 'high-contrast';
  
  // Style modifiers
  modifiers?: {
    disabled?: boolean;
    focused?: boolean;
    hovered?: boolean;
    active?: boolean;
    error?: boolean;
    success?: boolean;
    warning?: boolean;
    loading?: boolean;
  };
}

/**
 * StyleOutput: The transformed style definition
 */
export interface StyleOutput {
  className: string;
  cssVars: Record<string, string>;
  inlineStyles?: React.CSSProperties;
  animations?: string[];
  modifierClasses: string[];
  responsive?: Record<string, string>;
  semanticTokens: Record<string, string>;
}

/**
 * The base StyleMorph - transforms style shapes into concrete styles
 * 
 * This uses a formal shape-based approach similar to other Morpheus components.
 */
export const StyleMorph = new SimpleMorph<StyleShape, StyleOutput>(
  "StyleMorph",
  (shape, context: StyleContext) => {
    // Merge shape and context properties
    // Context takes precedence over shape for flexibility
    const domain = context.domain || shape.domain || 'base';
    const mode = context.mode || 'view';
    const intent = context.intent || shape.intent;
    const scale = context.scale || shape.scale || 'md';
    const variant = context.variant || shape.variant;
    const theme = context.theme || shape.theme || 'light';
    
    // Determine interaction state
    const interaction = context.interaction || 
      (shape.modifiers?.disabled ? 'disabled' :
       shape.modifiers?.focused ? 'focus' :
       shape.modifiers?.active ? 'active' :
       shape.modifiers?.hovered ? 'hover' : undefined);
    
    // Determine state
    const state = context.state || 
      (shape.modifiers?.error ? 'error' :
       shape.modifiers?.success ? 'success' :
       shape.modifiers?.loading ? 'loading' : 'idle');
    
    // Base class generation
    const baseClass = `sankara-${domain}`;
    const modeClass = `mode-${mode}`;
    const intentClass = intent ? `intent-${intent}` : '';
    const stateClass = state ? `state-${state}` : '';
    const scaleClass = scale ? `scale-${scale}` : '';
    const variantClass = variant ? `variant-${variant}` : '';
    const interactionClass = interaction ? `interaction-${interaction}` : '';
    
    // Assemble the main class name
    const className = [
      baseClass, 
      modeClass, 
      intentClass, 
      stateClass, 
      scaleClass,
      variantClass,
      interactionClass
    ].filter(Boolean).join(' ');
    
    // Add responsive classes if needed
    const responsiveClasses = context.responsive ? {
      sm: 'sm:w-full sm:max-w-sm',
      md: 'md:w-full md:max-w-md',
      lg: 'lg:w-full lg:max-w-lg',
      xl: 'xl:w-full xl:max-w-xl',
    } : {};
    
    // Add animation classes if needed
    const animationClasses = context.animation ? [
      'transition-all',
      'duration-300',
      'ease-in-out'
    ] : [];
    
    // CSS variables based on material design tokens
    const cssVars: Record<string, string> = {
      '--primary-color': md.color.primary,
      '--secondary-color': md.color.secondary,
      '--surface-color': md.color.surface,
      '--background-color': md.color.background,
      '--text-primary-color': md.color.text.primary,
      '--text-secondary-color': md.color.text.secondary,
      '--error-color': md.color.error,
      '--success-color': md.color.success,
      '--warning-color': md.color.warning,
      '--outline-color': md.color.outline || '#e0e0e0',
      '--radius-sm': md.shape.small.replace('rounded-', ''),
      '--radius-md': md.shape.medium.replace('rounded-', ''),
      '--radius-lg': md.shape.large.replace('rounded-', ''),
      '--elevation-1': md.elevation.level1.replace('shadow-', ''),
      '--elevation-2': md.elevation.level2.replace('shadow-', ''),
      '--elevation-3': md.elevation.level3.replace('shadow-', '')
    };
    
    // Add domain-specific variables
    if (domain === 'form') {
      cssVars['--form-spacing'] = '1rem';
      cssVars['--form-field-gap'] = '0.75rem';
      cssVars['--form-label-size'] = '0.875rem';
    } else if (domain === 'visualization') {
      cssVars['--viz-accent'] = md.color.tertiary || '#7b1fa2';
      cssVars['--viz-grid'] = md.color.outline || '#e0e0e0';
    }
    
    // Add theme-specific variables
    if (theme === 'dark') {
      cssVars['--surface-color'] = '#121212';
      cssVars['--background-color'] = '#000000';
      cssVars['--text-primary-color'] = '#ffffff';
      cssVars['--text-secondary-color'] = 'rgba(255, 255, 255, 0.7)';
    } else if (theme === 'high-contrast') {
      cssVars['--text-primary-color'] = '#000000';
      cssVars['--outline-color'] = '#000000';
      cssVars['--surface-color'] = '#ffffff';
      cssVars['--primary-color'] = '#0000cc';
    }

    // Add custom properties from shape if available
    if (shape.properties) {
      Object.entries(shape.properties).forEach(([key, value]) => {
        if (typeof value === 'string') {
          cssVars[`--${key}`] = value;
        }
      });
    }
    
    return {
      className,
      cssVars,
      modifierClasses: [
        intentClass, 
        stateClass, 
        scaleClass, 
        variantClass, 
        interactionClass
      ].filter(Boolean),
      animations: animationClasses,
      responsive: responsiveClasses,
      semanticTokens: {
        headline: md.type.headline,
        title: md.type.title,
        body: md.type.body,
        label: md.type.label,
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
    memoizable: true,
    cacheTTL: 60000 // 1 minute cache
  }
);

/**
 * Form field style morph - transforms context into field styles
 */
export const FormFieldStyleMorph = new SimpleMorph<
  StyleShape & { fieldType: string },
  StyleOutput
>(
  "FormFieldStyleMorph",
  (shape, context: StyleContext) => {
    // Override domain to ensure consistent field styling
    const fieldContext = {
      ...context,
      domain: 'form'
    };
    
    // Get base styles
    const baseOutput = StyleMorph.apply({
      ...shape,
      domain: 'form'
    }, fieldContext);
    
    // Extract key properties 
    const fieldType = shape.fieldType;
    const mode = context.mode || 'view';
    const state = context.state || 
      (shape.modifiers?.error ? 'error' :
       shape.modifiers?.success ? 'success' : 'idle');
    const interaction = context.interaction || 
      (shape.modifiers?.disabled ? 'disabled' :
       shape.modifiers?.focused ? 'focus' :
       shape.modifiers?.active ? 'active' :
       shape.modifiers?.hovered ? 'hover' : undefined);
    const intent = context.intent || shape.intent;
    
    // Field-specific classes
    const fieldClass = `field field-${fieldType} field-mode-${mode}`;
    
    // State classes
    const stateClass = state ? `field-state-${state}` : '';
    
    // Intent classes (for validation, etc.)
    const intentClass = intent ? `field-intent-${intent}` : '';

    // Interactive state
    const interactionClass = interaction ? `field-${interaction}` : '';
    
    // Field-specific CSS variables
    const fieldCssVars = {
      ...baseOutput.cssVars,
      '--field-border-color': getBorderColor({ ...context, state, interaction, intent }),
      '--field-bg-color': getBackgroundColor({ ...context, state, interaction, intent }),
      '--field-text-color': getTextColor({ ...context, state, interaction, intent }),
      '--field-focus-color': md.color.primary,
      '--field-radius': md.shape.small.replace('rounded-', ''),
      '--field-padding': '0.75rem',
      '--field-margin': '0.5rem 0',
      '--field-label-size': '0.875rem',
      '--field-font-size': '1rem',
      '--field-line-height': '1.5',
    };

    // Generate inline styles for React
    const inlineStyles: React.CSSProperties = {
      borderColor: 'var(--field-border-color)',
      backgroundColor: 'var(--field-bg-color)',
      color: 'var(--field-text-color)',
      borderRadius: 'var(--field-radius)',
      padding: 'var(--field-padding)',
      margin: 'var(--field-margin)',
      fontSize: 'var(--field-font-size)',
      lineHeight: 'var(--field-line-height)',
    };
    
    // Add field type specific inline styles
    if (fieldType === 'textarea' || fieldType === 'richtext') {
      inlineStyles.minHeight = '6rem';
    }
    
    if (fieldType === 'checkbox' || fieldType === 'radio' || fieldType === 'boolean') {
      inlineStyles.display = 'flex';
      inlineStyles.alignItems = 'center';
      inlineStyles.gap = '0.5rem';
    }
    
    // Add custom properties from shape if available
    if (shape.properties) {
      Object.entries(shape.properties).forEach(([key, value]) => {
        if (typeof value === 'string') {
          fieldCssVars[`--field-${key}`] = value;
        } else if (key in inlineStyles && value !== undefined) {
          inlineStyles[key as keyof React.CSSProperties] = value as any;
        }
      });
    }
    
    return {
      ...baseOutput,
      className: `${fieldClass} ${stateClass} ${intentClass} ${interactionClass} ${baseOutput.className}`.trim(),
      cssVars: fieldCssVars,
      inlineStyles: inlineStyles,
      modifierClasses: [
        ...baseOutput.modifierClasses, 
        `field-${fieldType}`,
        stateClass, 
        intentClass, 
        interactionClass
      ].filter(Boolean)
    };
  },
  {
    pure: true,
    fusible: false,
    cost: 2,
    memoizable: true,
    cacheTTL: 60000 // 1 minute cache
  }
);

/**
 * Action style morph - for buttons, links, etc.
 */
export const ActionStyleMorph = new SimpleMorph<
  StyleShape & { actionType: 'button' | 'link' | 'menu' | 'icon' },
  StyleOutput
>(
  "ActionStyleMorph",
  (shape, context: StyleContext) => {
    // Override domain to ensure consistent action styling
    const actionContext = {
      ...context,
      domain: 'action'
    };
    
    // Get base styles with 'action' domain
    const baseOutput = StyleMorph.apply({
      ...shape,
      domain: 'action'
    }, actionContext);
    
    // Extract key properties
    const actionType = shape.actionType!;
    const intent = context.intent || shape.intent || 'primary';
    const state = context.state || 
      (shape.modifiers?.error ? 'error' :
       shape.modifiers?.success ? 'success' :
       shape.modifiers?.loading ? 'loading' : 'idle');
    const interaction = context.interaction || 
      (shape.modifiers?.disabled ? 'disabled' :
       shape.modifiers?.focused ? 'focus' :
       shape.modifiers?.active ? 'active' :
       shape.modifiers?.hovered ? 'hover' : undefined);
    const scale = context.scale || shape.scale || 'md';
    
    // Action-specific classes
    const actionTypeClass = `action-${actionType}`;
    const intentClass = `action-intent-${intent}`;
    const stateClass = state ? `action-state-${state}` : '';
    const interactionClass = interaction ? `action-${interaction}` : '';
    
    // Get appropriate background and text colors based on intent
    const bgColor = getActionBackgroundColor({ ...context, intent, interaction, state });
    const textColor = getActionTextColor({ ...context, intent, interaction, state });
    
    // Action-specific CSS variables
    const actionCssVars = {
      ...baseOutput.cssVars,
      '--action-bg-color': bgColor,
      '--action-text-color': textColor,
      '--action-border-color': intent === 'secondary' ? md.color.outline : bgColor,
      '--action-hover-bg-color': adjustColor(bgColor, -10), // Darken by 10%
      '--action-active-bg-color': adjustColor(bgColor, -20), // Darken by 20%
      '--action-focus-ring-color': `${md.color.primary}40`, // Add transparency
      '--action-padding-x': scale === 'sm' ? '0.75rem' : 
                           scale === 'lg' ? '1.5rem' : '1rem',
      '--action-padding-y': scale === 'sm' ? '0.375rem' : 
                           scale === 'lg' ? '0.75rem' : '0.5rem',
      '--action-font-size': scale === 'sm' ? '0.875rem' : 
                           scale === 'lg' ? '1.125rem' : '1rem',
    };
    
    // Generate inline styles for React
    const inlineStyles: React.CSSProperties = {
      backgroundColor: 'var(--action-bg-color)',
      color: 'var(--action-text-color)',
      borderColor: 'var(--action-border-color)',
      borderRadius: md.shape.small.replace('rounded-', ''),
      padding: `var(--action-padding-y) var(--action-padding-x)`,
      fontSize: `var(--action-font-size)`,
      fontWeight: 500,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease-in-out',
      textDecoration: actionType === 'link' ? 'none' : undefined,
      border: intent === 'secondary' ? '1px solid var(--action-border-color)' : 'none',
    };
    
    // Disable styles
    if (interaction === 'disabled') {
      inlineStyles.opacity = 0.6;
      inlineStyles.cursor = 'not-allowed';
    }
    
    // Loading styles
    if (state === 'loading') {
      inlineStyles.opacity = 0.8;
      inlineStyles.cursor = 'wait';
      // Add a loading indicator through a pseudo-element in the CSS
    }
    
    // Icon-only button adjustments
    if (actionType === 'icon') {
      inlineStyles.padding = scale === 'sm' ? '0.375rem' : 
                           scale === 'lg' ? '0.75rem' : '0.5rem';
      inlineStyles.borderRadius = '50%';
      inlineStyles.aspectRatio = '1/1';
    }
    
    // Add custom properties from shape if available
    if (shape.properties) {
      Object.entries(shape.properties).forEach(([key, value]) => {
        if (typeof value === 'string') {
          actionCssVars[`--action-${key}`] = value;
        } else if (key in inlineStyles && value !== undefined) {
          inlineStyles[key as keyof React.CSSProperties] = value as any;
        }
      });
    }
    
    return {
      ...baseOutput,
      className: `action ${actionTypeClass} ${intentClass} ${stateClass} ${interactionClass} ${baseOutput.className}`.trim(),
      cssVars: actionCssVars,
      inlineStyles: inlineStyles,
      modifierClasses: [
        ...baseOutput.modifierClasses, 
        actionTypeClass, 
        intentClass,
        stateClass,
        interactionClass
      ].filter(Boolean)
    };
  },
  {
    pure: true,
    fusible: false,
    cost: 2,
    memoizable: true,
    cacheTTL: 60000 // 1 minute cache
  }
);

/**
 * Get appropriate border color based on context
 */
function getBorderColor(context: {
  state?: string;
  interaction?: string;
  intent?: string;
}): string {
  if (context.state === 'error') {
    return md.color.error;
  } else if (context.state === 'success') {
    return md.color.success;
  } else if (context.interaction === 'focus') {
    return md.color.primary;
  }
  return md.color.outline || '#e0e0e0';
}

/**
 * Get appropriate background color based on context
 */
function getBackgroundColor(context: {
  state?: string;
  interaction?: string;
  intent?: string;
}): string {
  if (context.interaction === 'disabled') {
    return md.color.surfaceDisabled || '#f5f5f5';
  } else if (context.state === 'error') {
    return md.color.errorContainer || '#ffebee';
  }
  return md.color.surface || '#ffffff';
}

/**
 * Get appropriate text color based on context
 */
function getTextColor(context: {
  state?: string;
  interaction?: string;
  intent?: string;
}): string {
  if (context.interaction === 'disabled') {
    return md.color.text.disabled || '#9e9e9e';
  } else if (context.state === 'error') {
    return md.color.onErrorContainer || '#c62828';
  }
  return md.color.text.primary || '#212121';
}

/**
 * Get action background color based on context
 */
function getActionBackgroundColor(context: {
  intent?: string;
  interaction?: string;
  state?: string;
}): string {
  if (context.interaction === 'disabled') {
    return md.color.surfaceDisabled || '#f5f5f5';
  } 
  
  switch (context.intent) {
    case 'primary': return md.color.primary;
    case 'secondary': return 'transparent';
    case 'danger': return md.color.error;
    case 'warning': return md.color.warning;
    case 'success': return md.color.success;
    default: return md.color.primary;
  }
}

/**
 * Get action text color based on context
 */
function getActionTextColor(context: {
  intent?: string;
  interaction?: string;
  state?: string;
}): string {
  if (context.interaction === 'disabled') {
    return md.color.text.disabled || '#9e9e9e';
  }
  
  // For secondary actions, use text color
  if (context.intent === 'secondary') {
    return md.color.text.primary;
  }
  
  // For other intents, use white or on* colors
  switch (context.intent) {
    case 'primary': return md.color.onPrimary || '#ffffff';
    case 'danger': return md.color.onError || '#ffffff';
    case 'warning': return md.color.onWarning || '#000000';
    case 'success': return md.color.onSuccess || '#ffffff';
    default: return '#ffffff';
  }
}

/**
 * Simple utility to adjust a color's brightness
 * Note: In a real implementation, you'd use a proper color library
 */
function adjustColor(color: string, percent: number): string {
  // Very simplistic implementation - in production use a proper color library
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    const adjustValue = (value: number) => {
      const adjusted = Math.max(0, Math.min(255, value + (value * percent / 100)));
      return Math.round(adjusted);
    };
    
    return `#${
      adjustValue(r).toString(16).padStart(2, '0')
    }${
      adjustValue(g).toString(16).padStart(2, '0')
    }${
      adjustValue(b).toString(16).padStart(2, '0')
    }`;
  }
  
  return color;
}

/**
 * Generate field styles for use in React components
 * 
 * This is a more declarative approach to field styling that aligns
 * with the Morpheus philosophy of declarative transformations.
 */
export function defineFieldStyles(
  fieldType: string, 
  mode: 'view' | 'edit' | 'create',
  options: {
    state?: 'idle' | 'error' | 'success';
    intent?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
    interaction?: 'hover' | 'active' | 'focus' | 'disabled';
    theme?: 'light' | 'dark' | 'high-contrast';
    variant?: string;
    properties?: Record<string, any>;
  } = {}
): { className: string, style: React.CSSProperties } {
  // Create style shape with modifiers
  const shape: StyleShape & { fieldType: string } = {
    domain: 'form',
    fieldType,
    intent: options.intent,
    variant: options.variant,
    theme: options.theme,
    properties: options.properties,
    modifiers: {
      disabled: options.interaction === 'disabled',
      focused: options.interaction === 'focus',
      active: options.interaction === 'active',
      hovered: options.interaction === 'hover',
      error: options.state === 'error',
      success: options.state === 'success',
    }
  };
  
  // Create context
  const context: StyleContext = {
    mode,
    domain: 'form',
    state: options.state,
    interaction: options.interaction,
    intent: options.intent,
    theme: options.theme,
    variant: options.variant,
    responsive: true,
    animation: true,
  };
  
  // Apply the style morph
  const styleOutput = FormFieldStyleMorph.apply(shape, context);
  
  // Combine CSS variables and inline styles
  const style: React.CSSProperties = { ...styleOutput.inlineStyles || {} };
  if (styleOutput.cssVars) {
    Object.entries(styleOutput.cssVars).forEach(([key, value]) => {
      style[key as any] = value;
    });
  }
  
  return {
    className: styleOutput.className,
    style
  };
}

/**
 * Generate action styles for use in React components
 * 
 * This is a more declarative approach to action styling that aligns
 * with the Morpheus philosophy of declarative transformations.
 */
export function defineActionStyles(
  actionType: 'button' | 'link' | 'menu' | 'icon',
  options: {
    intent?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
    scale?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    state?: 'idle' | 'loading' | 'error' | 'success';
    interaction?: 'hover' | 'active' | 'focus' | 'disabled';
    theme?: 'light' | 'dark' | 'high-contrast';
    variant?: string;
    properties?: Record<string, any>;
  } = {}
): { className: string, style: React.CSSProperties } {
  // Create style shape with modifiers
  const shape: StyleShape & { actionType: typeof actionType } = {
    domain: 'action',
    actionType,
    intent: options.intent || 'primary',
    scale: options.scale || 'md',
    variant: options.variant,
    theme: options.theme,
    properties: options.properties,
    modifiers: {
      disabled: options.interaction === 'disabled',
      focused: options.interaction === 'focus',
      active: options.interaction === 'active',
      hovered: options.interaction === 'hover',
      error: options.state === 'error',
      success: options.state === 'success',
      loading: options.state === 'loading',
    }
  };
  
  // Create context
  const context: StyleContext = {
    mode: 'interactive',
    domain: 'action',
    state: options.state,
    interaction: options.interaction,
    intent: options.intent || 'primary',
    scale: options.scale || 'md',
    theme: options.theme,
    variant: options.variant,
    responsive: true,
    animation: true
  };
  
  // Apply the action style morph
  const styleOutput = ActionStyleMorph.apply(shape, context);
  
  // Combine CSS variables and inline styles
  const style: React.CSSProperties = { ...styleOutput.inlineStyles || {} };
  if (styleOutput.cssVars) {
    Object.entries(styleOutput.cssVars).forEach(([key, value]) => {
      style[key as any] = value;
    });
  }
  
  return {
    className: styleOutput.className,
    style
  };
}

// For backward compatibility
export const getFieldStyles = defineFieldStyles;
export const getActionStyles = defineActionStyles;