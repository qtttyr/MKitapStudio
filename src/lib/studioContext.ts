import { createContext, useContext } from 'react'
import type { Chapter, CoverDesign, LoreItem, Project } from '../types'
import type { CoverPreset } from './covers'

const LAST_KEY = 'mkstudio.lastProject'
const NAME_KEY = 'mkstudio.authorName'

export type NewProjectInput = {
  title: string
  author: string
  genre: string
  targetWords: number
  preset: CoverPreset
}

export type StudioCtx = {
  ready: boolean
  projects: Project[]
  authorName: string
  setAuthorName: (name: string) => void
  lastOpenId: string | null
  setLastOpen: (id: string | null) => void
  createProject: (input: NewProjectInput) => Project
  updateProjectMeta: (id: string, patch: Partial<Pick<Project, 'title' | 'author' | 'genre' | 'targetWords'>>) => void
  deleteProject: (id: string) => Promise<void>
  deleteAllProjects: () => Promise<void>
  setCover: (id: string, patch: Partial<CoverDesign>) => void
  saveChapter: (pid: string, cid: string, patch: { content?: string; title?: string }) => void
  addChapter: (pid: string) => Chapter
  deleteChapter: (pid: string, cid: string) => void
  moveChapter: (pid: string, cid: string, dir: -1 | 1) => void
  upsertLore: (pid: string, item: LoreItem) => void
  removeLore: (pid: string, lid: string) => void
  statsTick: number
  bumpStats: () => void
}

export const StudioContext = createContext<StudioCtx | null>(null)

export function useStudio(): StudioCtx {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used inside StudioProvider')
  return ctx
}

export function projectWords(p: Project): number {
  return p.chapters.reduce((acc, c) => acc + c.wordCount, 0)
}

export function loadAuthorName(): string {
  return localStorage.getItem(NAME_KEY) ?? 'Alex'
}

export function loadLastOpen(): string | null {
  return localStorage.getItem(LAST_KEY)
}

export function storeLastOpen(id: string | null): void {
  if (id) localStorage.setItem(LAST_KEY, id)
  else localStorage.removeItem(LAST_KEY)
}
