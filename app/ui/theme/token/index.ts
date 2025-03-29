// This file exports the theme tokens with md as the primary export

import { card } from "./card";
import { color } from "./color";
import { animation, duration, easing, elevation, shadow } from "./effect";
import { pattern } from "./pattern";
import { sanskrit } from "./sanskrit";
import { radius, shape, size, space, spacing } from "./spacing";
import { themeSchema, Theme } from "./theme";
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  typography,
} from "./typography";

// Export md as the main token object for component use
export const md = {
  // Color system
  color: color,

  // Typography system
  type: typography,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,

  // Spacing system
  space,
  spacing,
  sizes: size,
  radii: radius,
  shape,

  // Effect system
  shadows: shadow,
  elevation,
  durations: duration,
  easings: easing,
  animations: animation,

  // Sanskrit system
  sanskrit,

  // Pattern system
  pattern: pattern,

  // Card system
  card: card,
};

// Export the theme schema and type
export { themeSchema, type Theme };

// Export individual token categories for direct access if needed
export {
  card,
  color,
  animation,
  duration,
  easing,
  elevation,
  shadow,
  pattern,
  sanskrit,
  radius,
  shape,
  size,
  space,
  spacing,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  typography,
};
