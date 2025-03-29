//@/ui/graphics/font/inter.ts
import { Inter } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ["400", "500", "700"]  // Common weights for Inter
})
