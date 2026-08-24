import { useState } from 'react'
import { Camera, ChevronDown, Pencil, Play, Send, Trash2, X } from 'lucide-react'
import { COVER_PRESETS } from '../lib/covers'
import { projectWords, useStudio } from '../lib/studioContext'
import { useI18n, type MessageKey } from '../lib/i18n'
import { relTime } from '../lib/utils'
import type { CoverPreset } from '../types'
import { CoverCropModal } from './CoverCropModal'

type Props = {
  projectId: string
  onClose: () => void
  onExport: (id: string) => void
  onWrite: (id: string) => void
}

const PRESETS: CoverPreset[] = ['film', 'vintage', 'minimal', 'cyber']
const PRESET_LABELS: Record<CoverPreset, MessageKey> = {
  film: 'presetFilm',
  vintage: 'presetVintage',
  minimal: 'presetMinimal',
  cyber: 'presetCyber',
}

/**
 * Модалка книги — как в MKitap Reader: большая обложка с камерой,
 * название с карандашом, прогресс и действия. «Писать» — главный жест.
 */
export function ProjectSheet({ projectId, onClose, onExport, onWrite }: Props) {
  const { projects, updateProjectMeta, setCover, deleteProject } = useStudio()
  const { t, lang } = useI18n()
  const [cropOpen, setCropOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const p = projects.find((x) => x.id === projectId)
  if (!p) return null

  const words = projectWords(p)
  const pct = Math.min(100, Math.round((words / Math.max(1, p.targetWords)) * 100))
  const hasPhoto = Boolean(p.cover.photo)

  const saveTitle = () => {
    const next = titleDraft.trim()
    if (next && next !== p.title) updateProjectMeta(projectId, { title: next })
    setEditingTitle(false)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card book-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('close')}>
          <X size={19} />
        </button>

        <div className="bookm-layout">
          {/* обложка с камерой */}
          <div className="bookm-cover-side">
            <div
              className={`bookm-cover ${hasPhoto ? 'has-photo' : ''}`}
              style={hasPhoto ? undefined : { background: p.cover.gradient }}
              onClick={() => setCropOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setCropOpen(true)}
            >
              {hasPhoto ? (
                <>
                  <img className="cover-photo" src={p.cover.photo} alt="" draggable={false} />
                  <span className="fx-shade" aria-hidden="true" />
                  <span className="fx-vignette" aria-hidden="true" />
                  <span className="fx-leak" aria-hidden="true" />
                  <span className="fx-grain" aria-hidden="true" />
                </>
              ) : (
                <>
                  <div className="cover-sun" />
                  <span
                    style={{
                      position: 'absolute', width: 130, height: 140,
                      left: -20, bottom: -20,
                      borderRadius: '50% 48% 0 0', opacity: 0.85,
                      background: 'radial-gradient(circle, rgba(255,255,255,0.28), transparent 70%)',
                    }}
                    aria-hidden="true"
                  />
                </>
              )}
              <div className="cover-copy">
                <strong>{p.title}</strong>
                {p.author && <span className="author-sub">{p.author}</span>}
              </div>
              <span className="bd-cover-btn" aria-hidden="true">
                <Camera size={16} />
              </span>
            </div>
          </div>

          {/* инфо + действия */}
          <div className="bookm-body">
            <p className="eyebrow">{t('psDetails')}</p>

            <div className="bm-title-row">
              {editingTitle ? (
                <input
                  className="chapter-rename"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle()
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                  maxLength={120}
                  autoFocus
                />
              ) : (
                <>
                  <h2>{p.title}</h2>
                  <button
                    className="meta-menu"
                    aria-label={t('rename')}
                    title={t('rename')}
                    onClick={() => {
                      setTitleDraft(p.title)
                      setEditingTitle(true)
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>

            <div className="bookm-chips">
              <span className="chip selected" style={{ pointerEvents: 'none' }}>{p.genre}</span>
              <span className="bk-chip-plain">{relTime(p.updatedAt, lang)}</span>
            </div>

            <div className="cc-progress">
              <div className="cc-progress-label">
                <span>
                  {t('wordsOfTarget').replace('{cur}', words.toLocaleString()).replace('{target}', p.targetWords.toLocaleString())}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>

            <button className="btn-primary bookm-write" onClick={() => onWrite(projectId)}>
              <Play size={16} fill="currentColor" />
              <span>{t('writeNow')}</span>
            </button>

            <div className="bookm-row-actions">
              <button className="btn-secondary" onClick={() => { onClose(); onExport(projectId) }}>
                <Send size={14} />
                <span>{t('exportCta')}</span>
              </button>
              {!confirmDelete ? (
                <button className="btn-secondary bm-del" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} />
                  <span>{t('deleteProjectCta')}</span>
                </button>
              ) : (
                <button
                  className="btn-danger"
                  onClick={() => {
                    void deleteProject(projectId)
                    onClose()
                  }}
                >
                  <Trash2 size={14} />
                  <span>{t('delete')}?</span>
                </button>
              )}
            </div>

            {/* сворачиваемые детали */}
            <button className="details-toggle" onClick={() => setShowDetails((v) => !v)}>
              <span>{t('msDetailsToggle')}</span>
              <ChevronDown size={15} className={showDetails ? 'open' : ''} />
            </button>

            {showDetails && (
              <div className="details-panel">
                <div className="field">
                  <label htmlFor="bm-author">{t('authorLabel')}</label>
                  <input
                    id="bm-author"
                    type="text"
                    value={p.author}
                    onChange={(e) => updateProjectMeta(projectId, { author: e.target.value })}
                    maxLength={60}
                  />
                </div>

                <div className="field">
                  <label htmlFor="bm-target">{t('targetWordsLabel')}</label>
                  <input
                    id="bm-target"
                    type="number"
                    min={1000}
                    step={1000}
                    value={p.targetWords}
                    onChange={(e) =>
                      updateProjectMeta(projectId, { targetWords: Math.max(1000, Number(e.target.value) || 1000) })
                    }
                  />
                </div>

                <div className="field">
                  <label>{t('coverStyleLabel')}</label>
                  <div className="preset-swatches">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset}
                        title={t(PRESET_LABELS[preset])}
                        className={`preset-swatch ${!hasPhoto && p.cover.preset === preset ? 'selected' : ''}`}
                        style={{ background: COVER_PRESETS[preset] }}
                        onClick={() =>
                          setCover(projectId, { photo: undefined, gradient: COVER_PRESETS[preset], preset })
                        }
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn-secondary" onClick={() => setCropOpen(true)}>
                      <Camera size={13} />
                      <span>{hasPhoto ? t('editCover') : t('uploadPhoto')}</span>
                    </button>
                    {hasPhoto && (
                      <button className="btn-secondary" onClick={() => setCover(projectId, { photo: undefined })}>
                        <Trash2 size={13} />
                        <span>{t('removePhoto')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {cropOpen && (
        <CoverCropModal
          currentCover={p.cover.photo}
          onSave={(dataUrl) => {
            setCover(projectId, { photo: dataUrl })
            setCropOpen(false)
          }}
          onRemove={
            p.cover.photo
              ? () => {
                  setCover(projectId, { photo: undefined })
                  setCropOpen(false)
                }
              : undefined
          }
          onClose={() => setCropOpen(false)}
        />
      )}
    </div>
  )
}
