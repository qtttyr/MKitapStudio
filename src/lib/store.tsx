import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Chapter, CoverDesign, LoreItem } from '../types'
import { dbProjects, requestPersistentStorage } from './db'
import { countWords, genId } from './utils'
import { recordWords } from './writingStats'
import { COVER_PRESETS } from './covers'
import {
  StudioContext,
  loadAuthorName,
  loadLastOpen,
  storeLastOpen,
  type NewProjectInput,
} from './studioContext'

const NAME_KEY = 'mkstudio.authorName'

function makeChapter(): Chapter {
  return {
    id: genId(),
    title: '',
    content: '',
    wordCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [projects, setProjects] = useState<import('../types').Project[]>([])
  const [authorName, setAuthorNameState] = useState<string>(loadAuthorName)
  const [lastOpenId, setLastOpenState] = useState<string | null>(loadLastOpen)
  const [statsTick, setStatsTick] = useState(0)

  /* отложенная запись проекта в IndexedDB — по таймеру на каждый проект */
  const timersRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    void requestPersistentStorage()
    let alive = true
    void dbProjects.all().then((all) => {
      if (alive) {
        setProjects(all)
        setReady(true)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const bumpStats = useCallback(() => setStatsTick((v) => v + 1), [])

  const setAuthorName = useCallback((name: string) => {
    const clean = name.trim().slice(0, 40) || 'Alex'
    localStorage.setItem(NAME_KEY, clean)
    setAuthorNameState(clean)
  }, [])

  const setLastOpen = useCallback((id: string | null) => {
    storeLastOpen(id)
    setLastOpenState(id)
  }, [])

  /** Записать свежий снимок проекта в БД (debounce). */
  const persistSoon = useCallback((id: string, delay = 500) => {
    const prev = timersRef.current.get(id)
    if (prev) window.clearTimeout(prev)
    const timer = window.setTimeout(() => {
      timersRef.current.delete(id)
      setProjects((list) => {
        const p = list.find((x) => x.id === id)
        if (p) void dbProjects.put(p)
        return list
      })
    }, delay)
    timersRef.current.set(id, timer)
  }, [])

  /** Обновить проект в состоянии (иммутабельно). */
  const patchProject = useCallback((id: string, fn: (p: import('../types').Project) => import('../types').Project) => {
    setProjects((list) => list.map((p) => (p.id === id ? fn({ ...p }) : p)))
  }, [])

  const touch = useCallback((p: import('../types').Project): import('../types').Project => ({ ...p, updatedAt: Date.now() }), [])

  const createProject = useCallback(
    (input: NewProjectInput): import('../types').Project => {
      const now = Date.now()
      const project: import('../types').Project = {
        id: genId(),
        title: input.title.trim() || 'Untitled',
        author: input.author.trim(),
        genre: input.genre,
        targetWords: input.targetWords,
        cover: { preset: input.preset, gradient: COVER_PRESETS[input.preset] },
        chapters: [makeChapter()],
        lore: [],
        createdAt: now,
        updatedAt: now,
      }
      void dbProjects.put(project)
      setProjects((list) => [project, ...list])
      storeLastOpen(project.id)
      setLastOpenState(project.id)
      return project
    },
    [],
  )

  const updateProjectMeta = useCallback(
    (id: string, patch: Partial<Pick<import('../types').Project, 'title' | 'author' | 'genre' | 'targetWords'>>) => {
      patchProject(id, (p) => touch({ ...p, ...patch }))
      persistSoon(id, 400)
    },
    [patchProject, persistSoon, touch],
  )

  const setCover = useCallback(
    (id: string, patch: Partial<CoverDesign>) => {
      patchProject(id, (p) => touch({ ...p, cover: { ...p.cover, ...patch } }))
      persistSoon(id, 300)
    },
    [patchProject, persistSoon, touch],
  )

  const deleteProject = useCallback(async (id: string) => {
    await dbProjects.remove(id)
    setProjects((list) => list.filter((p) => p.id !== id))
    setLastOpenState((cur) => (cur === id ? null : cur))
    if (localStorage.getItem('mkstudio.lastProject') === id) localStorage.removeItem('mkstudio.lastProject')
  }, [])

  const deleteAllProjects = useCallback(async () => {
    await dbProjects.clear()
    localStorage.removeItem('mkstudio.daily')
    localStorage.removeItem('mkstudio.lastProject')
    setLastOpenState(null)
    setProjects([])
  }, [])

  const saveChapter = useCallback(
    (pid: string, cid: string, patch: { content?: string; title?: string }) => {
      let delta = 0
      patchProject(pid, (base) => {
        const chapters = base.chapters.map((c) => {
          if (c.id !== cid) return c
          const content = patch.content ?? c.content
          const wc = countWords(content)
          delta += wc - c.wordCount
          return { ...c, content, title: patch.title ?? c.title, wordCount: wc, updatedAt: Date.now() }
        })
        return touch({ ...base, chapters })
      })
      if (delta > 0) {
        recordWords(delta)
        bumpStats()
      }
      persistSoon(pid)
    },
    [bumpStats, patchProject, persistSoon, touch],
  )

  const addChapter = useCallback(
    (pid: string): Chapter => {
      const ch = makeChapter()
      patchProject(pid, (p) => touch({ ...p, chapters: [...p.chapters, ch] }))
      persistSoon(pid)
      return ch
    },
    [patchProject, persistSoon, touch],
  )

  const deleteChapter = useCallback(
    (pid: string, cid: string) => {
      patchProject(pid, (p) => {
        if (p.chapters.length <= 1) return p
        return touch({ ...p, chapters: p.chapters.filter((c) => c.id !== cid) })
      })
      persistSoon(pid)
    },
    [patchProject, persistSoon, touch],
  )

  const moveChapter = useCallback(
    (pid: string, cid: string, dir: -1 | 1) => {
      patchProject(pid, (p) => {
        const idx = p.chapters.findIndex((c) => c.id === cid)
        const next = idx + dir
        if (idx < 0 || next < 0 || next >= p.chapters.length) return p
        const chapters = [...p.chapters]
        ;[chapters[idx], chapters[next]] = [chapters[next], chapters[idx]]
        return touch({ ...p, chapters })
      })
      persistSoon(pid)
    },
    [patchProject, persistSoon, touch],
  )

  const upsertLore = useCallback(
    (pid: string, item: LoreItem) => {
      patchProject(pid, (p) => {
        const exists = p.lore.some((l) => l.id === item.id)
        const lore = exists ? p.lore.map((l) => (l.id === item.id ? item : l)) : [...p.lore, item]
        return touch({ ...p, lore })
      })
      persistSoon(pid)
    },
    [patchProject, persistSoon, touch],
  )

  const removeLore = useCallback(
    (pid: string, lid: string) => {
      patchProject(pid, (p) => touch({ ...p, lore: p.lore.filter((l) => l.id !== lid) }))
      persistSoon(pid)
    },
    [patchProject, persistSoon, touch],
  )

  const value = useMemo(
    () => ({
      ready,
      projects,
      authorName,
      setAuthorName,
      lastOpenId,
      setLastOpen,
      createProject,
      updateProjectMeta,
      deleteProject,
      deleteAllProjects,
      setCover,
      saveChapter,
      addChapter,
      deleteChapter,
      moveChapter,
      upsertLore,
      removeLore,
      statsTick,
      bumpStats,
    }),
    [
      ready, projects, authorName, setAuthorName, lastOpenId, setLastOpen, createProject,
      updateProjectMeta, deleteProject, deleteAllProjects, setCover, saveChapter, addChapter,
      deleteChapter, moveChapter, upsertLore, removeLore, statsTick, bumpStats,
    ],
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}
