//@/graphics/font/lusitana.ts
import { Lusitana } from 'next/font/google'

export const lusitana = Lusitana({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ["400", "700"]  // Common weights for Inter
})
