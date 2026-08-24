export type StudioSection = 'home' | 'books' | 'profile'

export type CoverPreset = 'film' | 'vintage' | 'minimal' | 'cyber'

export type LoreCategory = 'character' | 'location' | 'item'

export type LoreItem = {
  id: string
  name: string
  category: LoreCategory
  description: string
}

export type Chapter = {
  id: string
  title: string
  content: string
  wordCount: number
  createdAt: number
  updatedAt: number
}

export type CoverDesign = {
  preset: CoverPreset
  gradient: string
  photo?: string // dataUrl загруженной фотографии
}

export type Project = {
  id: string
  title: string
  author: string
  genre: string
  targetWords: number
  cover: CoverDesign
  chapters: Chapter[]
  lore: LoreItem[]
  createdAt: number
  updatedAt: number
}
