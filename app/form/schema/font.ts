//@/form/schema/font.ts
import { z } from 'zod'
import { FormShapeSchema } from './form'
import type { NextFontWithVariable } from 'next/dist/compiled/@next/font'

// Next.js font configuration schema
export const NextFontConfigSchema = z.object({
  subsets: z.array(z.string()),
  display: z.enum(['auto', 'block', 'swap', 'fallback', 'optional']),
  variable: z.string().optional(),
  weight: z.array(z.string()).optional(), // UPDATED
  style: z.enum(['normal', 'italic']).optional()
})

// Our form-based font schema
export const FontShapeSchema = FormShapeSchema.extend({
  family: z.string(),
  metrics: z.object({
    size: z.string(),
    height: z.string(),
    weight: z.union([z.number(), z.array(z.number())])
  })
})

export type NextFontConfig = z.infer<typeof NextFontConfigSchema>
export type FontInstance = NextFontWithVariable
export type FontShape = z.infer<typeof FontShapeSchema>
