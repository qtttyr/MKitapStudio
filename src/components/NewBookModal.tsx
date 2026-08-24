import { useState } from 'react'
import { Feather } from 'lucide-react'
import { COVER_PRESETS } from '../lib/covers'
import { useStudio } from '../lib/studioContext'
import { useI18n, type MessageKey } from '../lib/i18n'
import type { CoverPreset } from '../types'

type Props = {
  onClose: () => void
  onCreated: (id: string, startWriting: boolean) => void
}

const GENRES: MessageKey[] = [
  'genreFiction',
  'genreScifi',
  'genreFantasy',
  'genreNonfiction',
  'genrePoetry',
  'genreJournal',
  'genreMemoir',
  'genreOther',
]

const PRESETS: CoverPreset[] = ['film', 'vintage', 'minimal', 'cyber']
const TARGETS = [30000, 50000, 90000]

export function NewBookModal({ onClose, onCreated }: Props) {
  const { createProject, authorName } = useStudio()
  const { t } = useI18n()

  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState<MessageKey>('genreFiction')
  const [target, setTarget] = useState(50000)
  const [preset, setPreset] = useState<CoverPreset>('film')
  const [shake, setShake] = useState(false)

  const handleCreate = (startWriting: boolean) => {
    if (!title.trim()) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    const p = createProject({
      title,
      author: authorName,
      genre: t(genre),
      targetWords: target,
      preset,
    })
    onClose()
    onCreated(p.id, startWriting)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" style={shake ? { animation: 'toastIn .1s ease 3 alternate' } : undefined} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('close')}>
          вњ•
        </button>

        <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Feather size={12} /> {t('nbKicker')}
        </p>
        <h2>{t('nbTitle')}</h2>

        <div className="field">
          <label htmlFor="nb-title">{t('nameLabel')}</label>
          <input
            id="nb-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate(true)}
            placeholder={t('namePh')}
            maxLength={120}
            autoFocus
          />
        </div>

        <div className="field">
          <label>{t('genreLabel')}</label>
          <div className="chips-row">
            {GENRES.map((g) => (
              <button key={g} className={`chip ${genre === g ? 'selected' : ''}`} onClick={() => setGenre(g)}>
                {t(g)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('targetLabel')}</label>
          <div className="chips-row">
            {TARGETS.map((n) => (
              <button key={n} className={`chip ${target === n ? 'selected' : ''}`} onClick={() => setTarget(n)}>
                {(n / 1000).toFixed(0)}k
              </button>
            ))}
            <input
              type="number"
              min={1000}
              step={1000}
              value={target}
              onChange={(e) => setTarget(Math.max(1000, Number(e.target.value) || 1000))}
              style={{
                width: 110,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 99,
                padding: '7px 14px',
                fontSize: 12,
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
          </div>
          <p className="hint">{t('targetHint')}</p>
        </div>

        <div className="field">
          <label>{t('coverStyleLabel')}</label>
          <div className="preset-swatches">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`preset-swatch ${preset === p ? 'selected' : ''}`}
                style={{ background: COVER_PRESETS[p] }}
                onClick={() => setPreset(p)}
                aria-label={t(`preset${p.charAt(0).toUpperCase()}${p.slice(1)}` as MessageKey)}
              />
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => handleCreate(false)}>
            {t('createBook')}
          </button>
          <button className="btn-primary" onClick={() => handleCreate(true)}>
            {t('createStart')}
          </button>
        </div>
      </div>
    </div>
  )
}
