//@/ui/graphics/schema/chart.ts
import { z } from 'zod'
import { FormShapeSchema } from './form'
import { DataSchema, VisualSchema } from './visualization'

export const ChartShapeSchema = FormShapeSchema.extend({
  data: DataSchema,
  visual: VisualSchema,
  axes: z.array(z.object({
    orient: z.enum(['left', 'right', 'top', 'bottom']),
    scale: z.string(),
    title: z.string().optional()
  }))
})

export type ChartShape = z.infer<typeof ChartShapeSchema>
