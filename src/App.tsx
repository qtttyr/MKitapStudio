import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import type { StudioSection } from './types'
import { useStudio } from './lib/studioContext'
import { applyTheme, loadTheme, saveTheme, watchSystemTheme, type Theme } from './lib/theme'
import { useI18n } from './lib/i18n'
import { requestPersistentStorage } from './lib/db'

import { TopBar } from './components/TopBar'
import { SideNav } from './components/SideNav'
import { BottomNav } from './components/BottomNav'
import { Toaster } from './components/Toaster'
import { NewBookModal } from './components/NewBookModal'
import { ProjectSheet } from './components/ProjectSheet'
import { ExportModal } from './components/ExportModal'
import { SettingsScreen } from './components/SettingsScreen'
import { Onboarding } from './components/Onboarding'
import { WriterScreen } from './components/writer/WriterScreen'

import { HomeSection } from './components/sections/HomeSection'
import { BooksSection } from './components/sections/BooksSection'
import { ProfileSection } from './components/sections/ProfileSection'

const ONBOARD_KEY = 'mkstudio.onboarded'

function AppInner() {
  const { projects, ready, authorName, setAuthorName, setLastOpen, deleteAllProjects, bumpStats } = useStudio()
  const { t } = useI18n()

  const [section, setSection] = useState<StudioSection>('home')
  const [theme, setTheme] = useState<Theme>(() => loadTheme())
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  const dark = theme === 'dark' || (theme === 'system' && systemDark)

  const [editorId, setEditorId] = useState<string | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [exportId, setExportId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [onboardOpen, setOnboardOpen] = useState(() => !localStorage.getItem(ONBOARD_KEY))

  /* theme */
  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])
  useEffect(() => watchSystemTheme(setSystemDark), [])

  /* persistent storage: manuscripts must survive everything */
  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  const openEditor = useCallback(
    (id: string) => {
      setLastOpen(id)
      setEditorId(id)
      bumpStats()
    },
    [bumpStats, setLastOpen],
  )

  const closeEditor = useCallback(() => {
    setEditorId(null)
    bumpStats()
  }, [bumpStats])

  const toggleDark = useCallback(() => setTheme(dark ? 'light' : 'dark'), [dark])

  const handleOnboardFinish = useCallback(
    (name: string) => {
      setAuthorName(name)
      localStorage.setItem(ONBOARD_KEY, '1')
      setOnboardOpen(false)
    },
    [setAuthorName],
  )

  if (!ready) return null

  return (
    <main className="mk-app">
      <TopBar
        dark={dark}
        onToggleTheme={toggleDark}
        userName={authorName}
        onOpenProfile={() => setSection('profile')}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="layout-shell">
        <SideNav section={section} changeSection={setSection} bookCount={projects.length} />

        <section className="content-area">
          {section === 'home' && (
            <HomeSection
              onOpenProject={openEditor}
              onNewBook={() => setNewOpen(true)}
              onGoBooks={() => setSection('books')}
            />
          )}
          {section === 'books' && (
            <BooksSection onOpenProject={openEditor} onOpenDetails={setDetailsId} />
          )}
          {section === 'profile' && (
            <ProfileSection
              onEraseAll={() => {
                if (window.confirm(t('deleteAllConfirm'))) void deleteAllProjects()
              }}
            />
          )}
        </section>
      </div>

      <BottomNav section={section} changeSection={setSection} />

      {section !== 'profile' && !editorId && (
        <button className="fab" onClick={() => setNewOpen(true)} aria-label={t('ariaNewBook')}>
          <Plus size={22} />
        </button>
      )}

      {newOpen && (
        <NewBookModal
          onClose={() => setNewOpen(false)}
          onCreated={(id, startWriting) => {
            setLastOpen(id)
            if (startWriting) openEditor(id)
          }}
        />
      )}

      {detailsId && (
        <ProjectSheet
          projectId={detailsId}
          onClose={() => setDetailsId(null)}
          onExport={(id) => setExportId(id)}
        />
      )}

      {exportId && <ExportModal projectId={exportId} onClose={() => setExportId(null)} />}

      {settingsOpen && <SettingsScreen onClose={() => setSettingsOpen(false)} theme={theme} setTheme={setTheme} />}

      {editorId && <WriterScreen projectId={editorId} onClose={closeEditor} />}

      {onboardOpen && <Onboarding defaultName={authorName} onFinish={handleOnboardFinish} />}

      <Toaster />
    </main>
  )
}

export function App() {
  return <AppInner />
}

export default App
