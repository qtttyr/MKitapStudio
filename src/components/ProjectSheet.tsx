import { useState } from 'react'
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { COVER_PRESETS } from '../lib/covers'
import { projectWords, useStudio } from '../lib/studioContext'
import { useI18n, type MessageKey } from '../lib/i18n'
import type { CoverPreset } from '../types'
import { CoverCropModal } from './CoverCropModal'

type Props = {
  projectId: string
  onClose: () => void
  onExport: (id: string) => void
}

const PRESETS: CoverPreset[] = ['film', 'vintage', 'minimal', 'cyber']
const PRESET_LABELS: Record<CoverPreset, MessageKey> = {
  film: 'presetFilm',
  vintage: 'presetVintage',
  minimal: 'presetMinimal',
  cyber: 'presetCyber',
}

/**
 * Manuscript card: metadata + a live cover studio.
 * Everything edits instantly and autosaves.
 */
export function ProjectSheet({ projectId, onClose, onExport }: Props) {
  const { projects, updateProjectMeta, setCover, deleteProject } = useStudio()
  const { t } = useI18n()
  const [cropOpen, setCropOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const p = projects.find((x) => x.id === projectId)
  if (!p) return null

  const words = projectWords(p)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" style={{ width: 'min(760px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('close')}>
          вњ•
        </button>

        <p className="eyebrow">{t('psDetails')}</p>
        <h2>{p.title}</h2>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '-14px 0 22px' }}>
          {words.toLocaleString()} / {p.targetWords.toLocaleString()} {t('wordsShort')}
        </p>

        <div className="ps-layout">
          <div>
            <div className="field">
              <label htmlFor="ps-title">{t('titleLabel')}</label>
              <input
                id="ps-title"
                type="text"
                value={p.title}
                onChange={(e) => updateProjectMeta(projectId, { title: e.target.value })}
                maxLength={120}
              />
            </div>

            <div className="field">
              <label htmlFor="ps-author">{t('authorLabel')}</label>
              <input
                id="ps-author"
                type="text"
                value={p.author}
                onChange={(e) => updateProjectMeta(projectId, { author: e.target.value })}
                maxLength={60}
              />
            </div>

            <div className="field">
              <label htmlFor="ps-target">{t('targetWordsLabel')}</label>
              <input
                id="ps-target"
                type="number"
                min={1000}
                step={1000}
                value={p.targetWords}
                onChange={(e) => updateProjectMeta(projectId, { targetWords: Math.max(1000, Number(e.target.value) || 1000) })}
              />
            </div>

            <div className="field">
              <label>{t('coverStudio')}</label>
              <div className="preset-swatches">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    title={t(PRESET_LABELS[preset])}
                    className={`preset-swatch ${!p.cover.photo && p.cover.preset === preset ? 'selected' : ''}`}
                    style={{ background: COVER_PRESETS[preset] }}
                    onClick={() => setCover(projectId, { photo: undefined, gradient: COVER_PRESETS[preset], preset })}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn-primary" onClick={() => setCropOpen(true)}>
                  {p.cover.photo ? <ImageIcon size={13} /> : <Upload size={13} />}
                  <span>{p.cover.photo ? t('editCover') : t('uploadPhoto')}</span>
                </button>
                {p.cover.photo && (
                  <button className="btn-secondary" onClick={() => setCover(projectId, { photo: undefined })}>
                    <Trash2 size={13} />
                    <span>{t('removePhoto')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="ps-actions">
              <button className="btn-primary" onClick={() => { onClose(); onExport(projectId) }}>
                {t('exportCta')}
              </button>
              {!confirmDelete ? (
                <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} />
                  <span>{t('deleteProjectCta')}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
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
                  <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>
                    {t('cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="cover-preview-wrap">
            <div className="cover-preview-card" style={!p.cover.photo ? { background: p.cover.gradient } : undefined}>
              {p.cover.photo && (
                <>
                  <img className="cp-photo" src={p.cover.photo} alt="" draggable={false} />
                  <span className="fx-shade" aria-hidden="true" />
                  <span className="fx-vignette" aria-hidden="true" />
                  <span className="fx-leak" aria-hidden="true" />
                  <span className="fx-grain" aria-hidden="true" />
                </>
              )}
              {!p.cover.photo && (
                <>
                  <div className="cp-sun" />
                  <span
                    style={{
                      position: 'absolute',
                      width: 120,
                      height: 130,
                      left: -18,
                      bottom: -18,
                      borderRadius: '50% 48% 0 0',
                      opacity: 0.85,
                      background: 'radial-gradient(circle, rgba(255,255,255,0.28), transparent 70%)',
                    }}
                    aria-hidden="true"
                  />
                </>
              )}
              <div className="cp-frame" />
              <div className="cp-copy">
                <strong>{p.title}</strong>
                {p.author && <span className="cp-author">{p.author}</span>}
              </div>
            </div>
            <span className="cp-hint">{t('previewHint')}</span>
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
