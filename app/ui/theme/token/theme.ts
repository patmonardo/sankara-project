import { z } from "zod";

// Color system imports
import { colorSchema } from "./color";

// Typography system imports
import {
  typographySchema,
  fontFamilySchema,
  fontWeightSchema,
  fontSizeSchema,
  lineHeightSchema,
  letterSpacingSchema,
} from "./typography";

// Spacing system imports
import {
  spaceSchema,
  spacingSchema,
  sizeSchema,
  radiusSchema,
  shapeSchema,
} from "./spacing";

// Effect system imports
import {
  shadowSchema,
  elevationSchema,
  durationSchema,
  easingSchema,
  animationSchema,
} from "./effect";

// Sanskrit-specific system imports
import { sanskritSchema } from "./sanskrit";

// Pattern system imports
import { patternSchema } from "./pattern";

// Card system imports
import { cardSchema } from "./card";

// Complete theme schema
export const themeSchema = z.object({
  // Color system
  color: colorSchema,

  // Typography system
  typography: typographySchema,
  fontFamily: fontFamilySchema,
  fontWeight: fontWeightSchema,
  fontSize: fontSizeSchema,
  lineHeight: lineHeightSchema,
  letterSpacing: letterSpacingSchema,

  // Spacing system
  space: spaceSchema,
  spacing: spacingSchema,
  size: sizeSchema,
  radius: radiusSchema,
  shape: shapeSchema,

  // Effect system
  shadow: shadowSchema,
  elevation: elevationSchema,
  duration: durationSchema,
  easing: easingSchema,
  animation: animationSchema,

  // Sanskrit-specific system
  sanskrit: sanskritSchema,

  // Pattern system
  pattern: patternSchema,

  // Card system
  card: cardSchema,
});

// Export theme type
export type Theme = z.infer<typeof themeSchema>;

// Create theme instance (optional - can be implemented once all token files are complete)
// export const theme = themeSchema.parse({/* theme values */});
