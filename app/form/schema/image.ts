import { z } from 'zod'
import { FormShapeSchema, type FormShape } from './shape'

export const ImageSizeSchema = z.object({
  width: z.number().or(z.enum(['auto', 'full'])),
  height: z.number().or(z.enum(['auto', 'full'])),
  aspectRatio: z.string().optional()
})

export const ImageShapeSchema = FormShapeSchema.extend({
  src: z.string().url(),
  alt: z.string(),
  size: ImageSizeSchema,
  format: z.enum(['png', 'jpg', 'webp', 'svg', 'gif']).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'none']).default('cover'),
  position: z.enum(['center', 'top', 'bottom', 'left', 'right']).default('center'),
  loading: z.enum(['eager', 'lazy']).default('lazy'),
  quality: z.number().min(1).max(100).default(75)
})

export type ImageSize = z.infer<typeof ImageSizeSchema>
export type ImageShape = z.infer<typeof ImageShapeSchema>
