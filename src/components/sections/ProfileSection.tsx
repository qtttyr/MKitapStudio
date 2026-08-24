import { useEffect, useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { projectWords, useStudio } from '../../lib/studioContext'
import { getGoal, getStreak, history, setGoal } from '../../lib/writingStats'
import { formatBytes, getStorageEstimate } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

/** Author profile: quiet statistics and the daily-goal dial. */
export function ProfileSection({ onEraseAll }: { onEraseAll: () => void }) {
  const { projects, authorName, setAuthorName, ready, statsTick } = useStudio()
  const { t } = useI18n()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(authorName)
  const [goalDraft, setGoalDraft] = useState(getGoal())
  const [storage, setStorage] = useState({ usage: 0, quota: 0 })

  void statsTick

  useEffect(() => {
    let alive = true
    void getStorageEstimate().then((est) => {
      if (alive) setStorage(est)
    })
    return () => {
      alive = false
    }
  }, [projects.length])

  const words = projects.reduce((acc, p) => acc + projectWords(p), 0)
  const last7 = history(7)
  const avg = last7.length ? Math.round(last7.reduce((s, d) => s + d.words, 0) / last7.length) : 0

  const last14 = history(14)
  const maxWords = Math.max(1, ...last14.map((d) => d.words))

  if (!ready) return null

  return (
    <div className="profile-section">
      <div className="page-intro">
        <p className="eyebrow">{t('profileKicker')}</p>
        <h1>
          {authorName}
          <em>.</em>
        </h1>
        <p>MK.STUDIO · LOCAL · PRIVATE</p>
      </div>

      <div className="profile-stack">
        <div className="profile-stats">
          <div className="pstat">
            <span className="eyebrow">{t('totalWordsL')}</span>
            <strong>{words.toLocaleString()}</strong>
          </div>
          <div className="pstat">
            <span className="eyebrow">{t('manuscriptsL')}</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="pstat">
            <span className="eyebrow">{t('streakL')}</span>
            <strong>{getStreak()}</strong>
          </div>
          <div className="pstat">
            <span className="eyebrow">{t('avgPerDayL')}</span>
            <strong>{avg.toLocaleString()}</strong>
          </div>
        </div>

        <div className="chart-card">
          <span className="eyebrow">{t('last14Days')}</span>
          <div className="chart-bars" aria-hidden="true">
            {last14.map((d, i) => (
              <div
                key={d.key}
                className={`bar ${i === last14.length - 1 ? 'today' : ''}`}
                style={{ height: `${Math.max(3, (d.words / maxWords) * 100)}%` }}
                title={`${d.key}: ${d.words}`}
              />
            ))}
          </div>
          <div className="chart-labels" aria-hidden="true">
            {last14.map((d, i) => (
              <span key={d.key}>{i % 2 === 0 ? d.key.slice(8) : ''}</span>
            ))}
          </div>
        </div>

        <section className="settings-section">
          <h3>{t('authorNameL')}</h3>
          {editingName ? (
            <div className="name-edit">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAuthorName(nameDraft)
                    setEditingName(false)
                  }
                }}
                maxLength={40}
                autoFocus
              />
              <button
                className="btn-primary"
                onClick={() => {
                  setAuthorName(nameDraft)
                  setEditingName(false)
                }}
                aria-label={t('save')}
              >
                <Check size={15} />
              </button>
            </div>
          ) : (
            <button
              className="name-view"
              onClick={() => {
                setNameDraft(authorName)
                setEditingName(true)
              }}
            >
              <span>{authorName}</span>
              <Pencil size={14} />
            </button>
          )}
        </section>

        <section className="settings-section">
          <h3>{t('dailyGoalL')}</h3>
          <div className="setting-row">
            <span style={{ flex: 1 }}>
              <input
                type="range"
                min={50}
                max={3000}
                step={50}
                value={goalDraft}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setGoalDraft(v)
                  setGoal(v)
                }}
                style={{ maxWidth: 'none', width: '100%', accentColor: 'var(--accent)' }}
              />
            </span>
            <strong style={{ whiteSpace: 'nowrap' }}>
              {goalDraft} {t('goalHint')}
            </strong>
          </div>
        </section>

        <section className="settings-section">
          <h3>{t('storageL')}</h3>
          <div className="storage-info">
            <div>
              <span>{t('storageUsed')}</span>
              <strong>{formatBytes(storage.usage)}</strong>
            </div>
            <div>
              <span>{t('storageQuota')}</span>
              <strong>{storage.quota ? formatBytes(storage.quota) : '—'}</strong>
            </div>
          </div>
        </section>

        <section
          className="settings-section"
          style={{ borderColor: 'color-mix(in srgb, #c0392b 35%, var(--border))' }}
        >
          <h3 style={{ color: '#c0392b' }}>{t('dangerZone')}</h3>
          <button className="btn-danger" onClick={onEraseAll}>
            {t('deleteAllData')}
          </button>
        </section>

        <p className="about-text" style={{ textAlign: 'center', margin: '4px 0 0' }}>
          mk.studio — {t('versionL')}
        </p>
      </div>
    </div>
  )
}
