import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, AudioLines, BookMarked, Eye, List, Type } from 'lucide-react'
import { useStudio } from '../../lib/studioContext'
import { loadEditorSettings, PAPERS, saveEditorSettings, type EditorSettings } from '../../lib/editorSettings'
import { caretY } from '../../lib/caret'
import { countWords } from '../../lib/utils'
import { mdToHtml } from '../../lib/markdown'
import { getGoal, getStreak, getTodayWords, wasGoalCelebrated, markGoalCelebrated } from '../../lib/writingStats'
import { getAmbience, setAmbience, type AmbienceKind } from '../../lib/ambience'
import { fireConfetti } from '../../lib/confetti'
import { useI18n } from '../../lib/i18n'
import { toast } from '../../lib/toastBus'
import { GoalRing } from '../GoalRing'
import { ChaptersSheet, LoreSheet, AaPanel, AmbPopover } from './panels'

type Props = {
  projectId: string
  onClose: () => void
}

type PanelKind = null | 'chapters' | 'lore' | 'aa' | 'amb'

export function WriterScreen({ projectId, onClose }: Props) {
  const { projects, saveChapter, addChapter, deleteChapter, moveChapter, upsertLore, removeLore, statsTick } = useStudio()
  const { t } = useI18n()

  const project = projects.find((p) => p.id === projectId)

  /* ---------- local chapter state ---------- */
  const [chapterId, setChapterId] = useState<string>(() => project?.chapters[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [panel, setPanel] = useState<PanelKind>(null)
  const [preview, setPreview] = useState(false)
  const [typingIdle, setTypingIdle] = useState(false)
  const chromeHidden = typingIdle && panel === null
  const [settings, setSettings] = useState<EditorSettings>(loadEditorSettings)
  const [ambKind, setAmbKind] = useState<AmbienceKind | null>(() => getAmbience())

  /* ---------- refs ---------- */
  const taRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const debounceRef = useRef<number | undefined>(undefined)
  const idleTimerRef = useRef<number | undefined>(undefined)
  const rafRef = useRef<number | undefined>(undefined)
  const dirtyRef = useRef(false)
  const latestRef = useRef({ chapterId: '', title: '', text: '' })
  const panelRef = useRef<PanelKind>(null)

  /* keep fresh snapshots for reliable flushes from timers/events */
  useEffect(() => {
    latestRef.current = { chapterId, title, text }
  })
  useEffect(() => {
    panelRef.current = panel
  }, [panel])

  /* ---------- load chapter: adjust state when the key changes ---------- */
  const loadKey = `${projectId}|${chapterId}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  if (project && loadedKey !== loadKey) {
    const ch =
      project.chapters.find((c) => c.id === chapterId) ?? project.chapters[0]
    if (ch) {
      setChapterId(ch.id)
      setTitle(ch.title)
      setText(ch.content)
      setSaveState('idle')
      setLoadedKey(`${projectId}|${ch.id}`)
    }
  }

  /* after a chapter loads - drop dirty flag, scroll to top, focus the page */
  useEffect(() => {
    if (!loadedKey) return
    dirtyRef.current = false
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    const id = window.setTimeout(() => taRef.current?.focus(), 60)
    return () => window.clearTimeout(id)
  }, [loadedKey])

  /* ---------- saving ---------- */
  const doFlush = useCallback(() => {
    window.clearTimeout(debounceRef.current)
    if (!dirtyRef.current) return
    const { chapterId: cid, title: ttl, text: txt } = latestRef.current
    if (!cid) return
    dirtyRef.current = false
    saveChapter(projectId, cid, { content: txt, title: ttl })
  }, [projectId, saveChapter])

  const scheduleSave = useCallback(() => {
    setSaveState('saving')
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      doFlush()
      setSaveState('saved')
      window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1600)
    }, 700)
  }, [doFlush])

  /* flush on exit and on tab close - the words matter most */
  useEffect(() => {
    const onBeforeUnload = () => doFlush()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      doFlush()
    }
  }, [doFlush])

  /* ---------- editor settings persist ---------- */
  useEffect(() => {
    saveEditorSettings(settings)
  }, [settings])

  const paper = PAPERS[settings.paper]

  /* ---------- dissolving chrome ---------- */
  const armHide = useCallback(() => {
    window.clearTimeout(idleTimerRef.current)
    idleTimerRef.current = window.setTimeout(() => {
      const typing =
        document.activeElement === taRef.current || document.activeElement === titleRef.current
      if (typing && !panelRef.current) setTypingIdle(true)
    }, 2400)
  }, [])

  const wakeChrome = useCallback(() => {
    setTypingIdle(false)
    armHide()
  }, [armHide])

  useEffect(() => {
    if (panel !== null) {
      window.clearTimeout(idleTimerRef.current)
    } else {
      armHide()
    }
  }, [panel, armHide])

  /* ---------- scroll progress hairline (rAF, no re-renders) ---------- */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !progressRef.current) return
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined
      const max = el.scrollHeight - el.clientHeight
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0
      progressRef.current!.style.width = `${pct}%`
    })
  }, [])

  /* ---------- typewriter mode ---------- */
  const centerCaret = useCallback(() => {
    const ta = taRef.current
    const sc = scrollRef.current
    if (!ta || !sc) return
    const pos = ta.selectionStart ?? ta.value.length
    const y = caretY(ta, pos)
    const taTop = ta.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop
    sc.scrollTop = taTop + y - sc.clientHeight * 0.42
  }, [])

  /* ---------- input ---------- */
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value)
      dirtyRef.current = true
      scheduleSave()
      wakeChrome()
      if (settings.typewriter) requestAnimationFrame(centerCaret)
    },
    [centerCaret, scheduleSave, settings.typewriter, wakeChrome],
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value)
      dirtyRef.current = true
      scheduleSave()
      wakeChrome()
    },
    [scheduleSave, wakeChrome],
  )

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        doFlush()
        setSaveState('saved')
        window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
        return
      }
      if (e.key === 'Escape') {
        if (preview) {
          setPreview(false)
        } else if (panelRef.current) {
          setPanel(null)
        } else {
          doFlush()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doFlush, onClose, preview])

  /* ambience fades away together with the editor */
  useEffect(() => {
    return () => {
      void setAmbience(null)
    }
  }, [])

  /* daily-goal celebration */
  useEffect(() => {
    if (statsTick === 0) return
    if (getTodayWords() >= getGoal() && !wasGoalCelebrated()) {
      markGoalCelebrated()
      if (confettiRef.current) fireConfetti(confettiRef.current)
      toast(t('goalReachedT'), { sparkle: true })
    }
  }, [statsTick, t])

  if (!project) return null

  const words = countWords(text)
  const today = getTodayWords()
  const goal = getGoal()
  const pct = Math.min(1, today / Math.max(1, goal))

  const switchChapter = (id: string) => {
    doFlush()
    setChapterId(id)
  }

  const handleAddChapter = () => {
    doFlush()
    const ch = addChapter(projectId)
    setPanel(null)
    setChapterId(ch.id)
  }

  const handleDeleteChapter = (id: string) => {
    const victim = project.chapters.find((c) => c.id === id)
    const wc = victim?.wordCount ?? 0
    if (!window.confirm(t('deleteChapterQ').replace('{n}', String(wc)))) return
    if (id === chapterId) {
      const rest = project.chapters.filter((c) => c.id !== id)
      doFlush()
      setChapterId(rest[0]?.id ?? '')
    }
    deleteChapter(projectId, id)
  }

  return (
    <div
      className={`writer-screen ${chromeHidden ? 'chrome-hidden' : ''}`}
      style={{
        background: paper.bg,
        color: paper.fg,
        ['--ws-bg' as string]: paper.bg,
        ['--ws-fg' as string]: paper.fg,
        ['--wp-w' as string]: `${settings.width}px`,
        ['--wp-size' as string]: `${settings.size}px`,
        ['--wp-lh' as string]: String(settings.lineHeight),
        ['--wp-font' as string]:
          settings.font === 'serif' ? "'Cormorant Garamond', Georgia, serif" : "'DM Sans', Arial, sans-serif",
      }}
      onPointerMove={wakeChrome}
      onPointerDown={wakeChrome}
    >
      <canvas ref={confettiRef} className="finish-confetti" />
      <div className="writer-progress">
        <span ref={progressRef} style={{ width: 0 }} />
      </div>

      {/* top bar - dissolves while you write */}
      <div className="writer-top">
        <div className="wt-side">
          <button className="w-icon" onClick={() => { doFlush(); onClose() }} aria-label={t('exitEditor')}>
            <ArrowLeft size={18} />
          </button>
        </div>
        <span className="wt-title">{project.title}</span>
        <div className="wt-side right">
          <span className={`ws-dot ${saveState}`} title={saveState === 'saved' ? t('savedDot') : saveState === 'saving' ? t('savingDot') : ''} />
        </div>
      </div>

      {/* the page */}
      <div className="writer-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="writer-page">
          {preview ? (
            <>
              <h1 className={`wp-static-title ${title.trim() ? '' : 'is-empty'}`}>
                {title.trim() || t('untitled')}
              </h1>
              <article
                className="wp-preview"
                dangerouslySetInnerHTML={{
                  __html:
                    mdToHtml(text) ||
                    `<p class="wp-empty">${t('typeHere')}</p>`,
                }}
              />
            </>
          ) : (
            <>
              <input
                ref={titleRef}
                className="wp-chapter-title"
                value={title}
                onChange={handleTitleChange}
                placeholder={t('emptyChapterTitle')}
                maxLength={140}
                spellCheck
              />
              <textarea
                ref={taRef}
                className="wp-text"
                value={text}
                onChange={handleTextChange}
                placeholder={t('typeHere')}
                spellCheck
              />
            </>
          )}
        </div>
      </div>

      {/* side rail */}
      <div className="writer-rail">
        <button className={`w-icon ${panel === 'chapters' ? 'active' : ''}`} onClick={() => setPanel(panel === 'chapters' ? null : 'chapters')} aria-label={t('chapters')} title={t('chapters')}>
          <List size={17} />
        </button>
        <button className={`w-icon ${panel === 'lore' ? 'active' : ''}`} onClick={() => setPanel(panel === 'lore' ? null : 'lore')} aria-label={t('lorebook')} title={t('lorebook')}>
          <BookMarked size={17} />
        </button>
        <button
          className={`w-icon ${preview ? 'active' : ''}`}
          onClick={() => {
            const next = !preview
            setPreview(next)
            if (next && scrollRef.current) scrollRef.current.scrollTop = 0
          }}
          aria-label={t('preview')}
          title={t('preview')}
        >
          <Eye size={17} />
        </button>
        <button className={`w-icon ${panel === 'aa' ? 'active' : ''}`} onClick={() => setPanel(panel === 'aa' ? null : 'aa')} aria-label={t('typography')} title={t('typography')}>
          <Type size={17} />
        </button>
        <button className={`w-icon ${panel === 'amb' ? 'active' : ''} ${ambKind ? 'playing' : ''}`} onClick={() => setPanel(panel === 'amb' ? null : 'amb')} aria-label={t('ambience')} title={t('ambience')}>
          <AudioLines size={17} />
        </button>
      </div>

      {/* panels */}
      {panel === 'chapters' && (
        <div className="writer-panel" onClick={(e) => e.stopPropagation()}>
          <ChaptersSheet
            project={project}
            activeId={chapterId}
            onSelect={switchChapter}
            onAdd={handleAddChapter}
            onDelete={handleDeleteChapter}
            onMove={(id, dir) => moveChapter(projectId, id, dir)}
            onRename={(id, ttl) => saveChapter(projectId, id, { title: ttl })}
            onClose={() => setPanel(null)}
          />
        </div>
      )}

      {panel === 'lore' && (
        <div className="writer-panel" onClick={(e) => e.stopPropagation()}>
          <LoreSheet
            project={project}
            onUpsert={(item) => upsertLore(projectId, item)}
            onRemove={(lid) => removeLore(projectId, lid)}
            onClose={() => setPanel(null)}
          />
        </div>
      )}

      {panel === 'aa' && (
        <div className="writer-panel" onClick={(e) => e.stopPropagation()}>
          <AaPanel settings={settings} onChange={setSettings} onClose={() => setPanel(null)} />
        </div>
      )}

      {panel === 'amb' && (
        <div className="writer-panel" onClick={(e) => e.stopPropagation()}>
          <AmbPopover
            kind={ambKind}
            onPick={(k) => {
              setAmbKind(k)
              void setAmbience(k)
            }}
          />
        </div>
      )}

      {/* status pill - the only permanent companion */}
      <div className="writer-status">
        <span>
          {words.toLocaleString()} {t('wordsShort')}
        </span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>+{today.toLocaleString()}{getStreak() > 1 ? ` · ${getStreak()}` : ''}</span>
        <GoalRing pct={pct} size={26} stroke={3.4} />
      </div>
    </div>
  )
}
