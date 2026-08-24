import { useState } from 'react'
import { Feather, X } from 'lucide-react'
import { useStudio } from '../lib/studioContext'
import { useI18n } from '../lib/i18n'
import type { CoverPreset } from '../types'

type Props = {
  onClose: () => void
  onCreated: (id: string, startWriting: boolean) => void
}

const PRESETS: CoverPreset[] = ['film', 'vintage', 'minimal', 'cyber']

function randomPreset(): CoverPreset {
  return PRESETS[Math.floor(Math.random() * PRESETS.length)]
}

/**
 * Одна мысль — одно поле. Название книги — и сразу к тексту.
 * Жанр и цель можно донастроить позже в карточке рукописи.
 */
export function NewBookModal({ onClose, onCreated }: Props) {
  const { createProject, authorName } = useStudio()
  const { t } = useI18n()

  const [title, setTitle] = useState('')
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
      genre: t('genreFiction'),
      targetWords: 50000,
      preset: randomPreset(),
    })
    onClose()
    onCreated(p.id, startWriting)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="modal-card nb-card"
        style={shake ? { animation: 'nbShake 0.4s ease' } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label={t('close')}>
          <X size={19} />
        </button>

        <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Feather size={12} /> {t('nbKicker')}
        </p>
        <h2>{t('nbTitle')}</h2>

        <div className="field">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate(true)}
            placeholder={t('namePh')}
            maxLength={120}
            autoFocus
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '15px 16px',
              fontSize: 16,
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              color: 'var(--foreground)',
            }}
          />
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
