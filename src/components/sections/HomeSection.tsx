import { ArrowRight, BookOpen, MoreHorizontal, PenLine, Plus } from 'lucide-react'
import { projectWords, useStudio } from '../../lib/studioContext'
import { getStreak, getTodayWords } from '../../lib/writingStats'
import { useI18n, type MessageKey } from '../../lib/i18n'
import { relTime } from '../../lib/utils'
import { ManuscriptCover } from '../ManuscriptCover'
import { StreakCard } from '../StreakCard'
import { EmptyState } from '../EmptyState'

type Props = {
  onOpenProject: (id: string) => void
  onNewBook: () => void
  onGoBooks: () => void
}

function greetingKey(): MessageKey {
  const h = new Date().getHours()
  if (h < 12) return 'gMorning'
  if (h < 18) return 'gAfternoon'
  return 'gEvening'
}

function dateEyebrow(lang: string): string {
  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(new Date())
    .toUpperCase()
}

export function HomeSection({ onOpenProject, onNewBook, onGoBooks }: Props) {
  const { projects, authorName, lastOpenId, ready, statsTick } = useStudio()
  const { t, lang } = useI18n()
  void statsTick

  if (!ready) return null

  if (projects.length === 0) {
    return (
      <div className="home-section">
        <div className="page-intro">
          <p className="eyebrow">{dateEyebrow(lang)}</p>
          <h1>
            {t(greetingKey())} <span className="greet-name">{authorName}</span>
            <em>.</em>
          </h1>
          <p>{t('welcomeSub')}</p>
        </div>
        <EmptyState
          icon={PenLine}
          variant="quill"
          kicker={t('homeEmptyK')}
          title={t('homeEmptyT')}
          subtitle={t('homeEmptyS')}
          actionLabel={t('startWriting')}
          onAction={onNewBook}
        />
      </div>
    )
  }

  const continueBook = projects.find((p) => p.id === lastOpenId) ?? projects[0]
  const cw = projectWords(continueBook)
  const pct = Math.min(100, Math.round((cw / Math.max(1, continueBook.targetWords)) * 100))
  const hasPhoto = Boolean(continueBook.cover.photo)

  return (
    <div className="home-section">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{dateEyebrow(lang)}</p>
          <h1 style={{ font: '600 clamp(30px,5vw,44px)/0.98 var(--font-serif)', letterSpacing: '-1.5px', margin: '4px 0 6px' }}>
            {t(greetingKey())} <span className="greet-name">{authorName}</span>
            <em>.</em>
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 12.5 }}>{t('welcomeSub')}</p>
        </div>
        <button className="btn-primary" onClick={onNewBook}>
          <Plus size={16} />
          <span>{t('newBook')}</span>
        </button>
      </div>

      <div className="feature-grid">
        <button className="continue-card" onClick={() => onOpenProject(continueBook.id)}>
          <div className="continue-art">
            {hasPhoto && <img className="art-photo" src={continueBook.cover.photo} alt="" draggable={false} />}
            <div className="art-lines" />
          </div>
          <div className="continue-info">
            <div className="eyebrow">
              {t('continueWriting')} <ArrowRight size={13} />
            </div>
            <h2>{continueBook.title}</h2>
            <span className="cc-sub">
              {cw.toLocaleString()} {t('wordsShort')} · {relTime(continueBook.updatedAt, lang)}
            </span>
            <div className="cc-progress">
              <div className="cc-progress-label">
                <span>{getTodayWords().toLocaleString()} {t('wordsToday')}</span>
                <span>{pct}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </button>

        <StreakCard refreshToken={getStreak()} />
      </div>

      <div className="home-section-row">
        <span className="eyebrow" style={{ marginBottom: 0 }}>{t('recentManuscripts')}</span>
        <button className="btn-secondary" onClick={onGoBooks}>
          <BookOpen size={14} />
          <span>{t('allManuscripts')}</span>
        </button>
      </div>

      <div className="book-grid">
        {projects.slice(0, 8).map((p) => (
          <ManuscriptCard key={p.id} id={p.id} onOpen={() => onOpenProject(p.id)} onMenu={onGoBooks} />
        ))}
      </div>
    </div>
  )
}

export function ManuscriptCard({ id, onOpen, onMenu }: { id: string; onOpen: () => void; onMenu?: () => void }) {
  const { projects } = useStudio()
  const { lang, t } = useI18n()
  const p = projects.find((x) => x.id === id)
  if (!p) return null
  const words = projectWords(p)
  const pct = Math.min(100, Math.round((words / Math.max(1, p.targetWords)) * 100))

  return (
    <button className="book-item" onClick={onOpen}>
      <ManuscriptCover project={p} />
      <div className="book-meta">
        <div className="bm-row">
          <span className="bm-text">
            <h3>{p.title}</h3>
          </span>
          {onMenu && (
            <span
              className="meta-menu"
              role="button"
              tabIndex={0}
              aria-label={t('psDetails')}
              onClick={(e) => {
                e.stopPropagation()
                onMenu()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onMenu()
                }
              }}
            >
              <MoreHorizontal size={16} />
            </span>
          )}
        </div>
        <div className="bm-progress">
          <span>
            {words.toLocaleString()} · {pct}%
          </span>
          <div className="progress-track">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        <p>{relTime(p.updatedAt, lang)}</p>
      </div>
    </button>
  )
}
