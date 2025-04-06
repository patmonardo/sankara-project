import { z } from 'zod';

// Shadow schema for different elevation levels
export const shadowSchema = z.record(z.string().describe('Box shadow values for different elevations'));

// Simplified elevation system schema
export const elevationSchema = z.record(z.string().describe('Elevation classes combining shadows and z-index'));

// Transition duration schema
export const durationSchema = z.record(z.string().describe('Time duration for animations and transitions'));

// Easing function schema
export const easingSchema = z.record(z.string().describe('CSS easing functions for animations'));

// Animation presets schema
export const animationSchema = z.record(z.string().describe('Reusable animation patterns'));

// Raw shadow values
const shadowValues = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
};

// Elevation system tokens (simplified for Tailwind)
const elevationValues = {
  level0: 'shadow-none',
  level1: 'shadow-sm',
  level2: 'shadow',
  level3: 'shadow-md',
  level4: 'shadow-lg',
  level5: 'shadow-xl',
  level6: 'shadow-2xl',
  inset: 'shadow-inner',
};

// Transition durations
const durationValues = {
  none: '0ms',
  fastest: '75ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slowest: '700ms',
};

// Transition timing functions
const easingValues = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// Common animations
const animationValues = {
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s infinite',
  // Knowledge-specific animations
  fadeIn: 'transition-opacity duration-300 ease-in-out',
  slideIn: 'transition-transform duration-300 ease-out',
  expand: 'transition-all duration-300 ease-out',
  highlight: 'animate-pulse duration-1000 ease-in-out',
};

// Parse and validate
export const shadow = shadowSchema.parse(shadowValues);
export const elevation = elevationSchema.parse(elevationValues);
export const duration = durationSchema.parse(durationValues);
export const easing = easingSchema.parse(easingValues);
export const animation = animationSchema.parse(animationValues);

// Export types
export type Shadow = z.infer<typeof shadowSchema>;
export type Elevation = z.infer<typeof elevationSchema>;
export type Duration = z.infer<typeof durationSchema>;
export type Easing = z.infer<typeof easingSchema>;
export type Animation = z.infer<typeof animationSchema>;
