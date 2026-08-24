import type { CoverPreset } from '../types'

export type { CoverPreset }

export const COVER_PRESETS: Record<CoverPreset, string> = {
  film: 'linear-gradient(180deg, #ffcc80 0%, #e67e51 45%, #7a3238 80%, #2b141d 100%)',
  vintage: 'linear-gradient(180deg, #f0ad4e 0%, #965f1a 50%, #2b1c10 100%)',
  minimal: 'linear-gradient(180deg, #5cb85c 0%, #2b662b 50%, #102410 100%)',
  cyber: 'linear-gradient(180deg, #6f42c1 0%, #0275d8 50%, #0d0a1a 100%)',
}
