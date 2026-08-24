import { useState } from 'react'
import { ArrowDown, ArrowUp, BookMarked, Check, MapPin, Pencil, Plus, Sparkles, Trash2, User, X } from 'lucide-react'
import type { Chapter, LoreCategory, LoreItem, Project } from '../../types'
import { useI18n, type MessageKey } from '../../lib/i18n'
import { relTime } from '../../lib/utils'
import { PAPERS, type EditorSettings, type PaperTheme } from '../../lib/editorSettings'
import type { AmbienceKind } from '../../lib/ambience'

/* ============================ Главы ============================ */

type ChaptersProps = {
  project: Project
  activeId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onRename: (id: string, title: string) => void
  onClose: () => void
}

export function ChaptersSheet({ project, activeId, onSelect, onAdd, onDelete, onMove, onRename, onClose }: ChaptersProps) {
  const { t, lang } = useI18n()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  const chapterTitle = (c: Chapter, i: number): string =>
    c.title.trim() || c.content.trim().slice(0, 40) || t('chapterN').replace('{n}', String(i + 1))

  return (
    <>
      <div className="wp-head">
        <h3>
          {t('chapters')} · {project.chapters.length}
        </h3>
        <button className="w-icon" onClick={onClose} aria-label={t('close')} style={{ width: 30, height: 30 }}>
          <X size={16} />
        </button>
      </div>

      <div className="chapter-list">
        {project.chapters.map((ch, i) => {
          const active = ch.id === activeId
          return (
            <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {renamingId === ch.id ? (
                <input
                  className="chapter-rename"
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRenameCommit(ch.id)
                    }
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  autoFocus
                />
              ) : (
                <button
                  className={`chapter-row ${active ? 'active' : ''}`}
                  onClick={() => {
                    onSelect(ch.id)
                    onClose()
                  }}
                >
                  <span className="cr-body">
                    <em>{chapterTitle(ch, i)}</em>
                    <span>
                      {ch.wordCount.toLocaleString()} · {relTime(ch.updatedAt, lang)}
                    </span>
                  </span>
                  <span className="cr-actions">
                    <button
                      aria-label={t('moveUp')}
                      onClick={(e) => {
                        e.stopPropagation()
                        onMove(ch.id, -1)
                      }}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      aria-label={t('moveDown')}
                      onClick={(e) => {
                        e.stopPropagation()
                        onMove(ch.id, 1)
                      }}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      aria-label={t('rename')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setRenamingId(ch.id)
                        setRenameDraft(ch.title)
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    {project.chapters.length > 1 && (
                      <button
                        className="cr-del"
                        aria-label={t('delete')}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(ch.id)
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={onAdd}>
        <Plus size={14} />
        <span>{t('addChapter')}</span>
      </button>
    </>
  )

  function onRenameCommit(id: string) {
    onRename(id, renameDraft)
    setRenamingId(null)
  }
}

/* ============================ Лорбук ============================ */

const CATS: LoreCategory[] = ['character', 'location', 'item']
const CAT_ICONS = { character: User, location: MapPin, item: Sparkles }
const TAB_KEYS: Record<LoreCategory | 'all', MessageKey> = {
  all: 'loreAll',
  character: 'loreCharacters',
  location: 'loreLocations',
  item: 'loreItems',
}

type LoreProps = {
  project: Project
  onUpsert: (item: LoreItem) => void
  onRemove: (id: string) => void
  onClose: () => void
}

export function LoreSheet({ project, onUpsert, onRemove, onClose }: LoreProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<LoreCategory | 'all'>('all')
  const [editing, setEditing] = useState<LoreItem | null>(null)

  const list = project.lore.filter((l) => tab === 'all' || l.category === tab)

  return (
    <>
      <div className="wp-head">
        <h3>{t('lorebook')}</h3>
        <button className="w-icon" onClick={onClose} aria-label={t('close')} style={{ width: 30, height: 30 }}>
          <X size={16} />
        </button>
      </div>

      <div className="lore-tabs">
        {(['all', ...CATS] as const).map((cat) => (
          <button key={cat} className={`lore-tab ${tab === cat ? 'selected' : ''}`} onClick={() => setTab(cat)}>
            {t(TAB_KEYS[cat])}
          </button>
        ))}
      </div>

      {editing && (
        <div className="lore-form" onClick={(e) => e.stopPropagation()}>
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            placeholder={t('loreNamePh')}
            maxLength={60}
            autoFocus
          />
          <textarea
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            placeholder={t('loreDescPh')}
            rows={3}
          />
          <div className="lf-row">
            {CATS.map((cat) => {
              const Icon = CAT_ICONS[cat]
              return (
                <button
                  key={cat}
                  className={`chip ${editing.category === cat ? 'selected' : ''}`}
                  onClick={() => setEditing({ ...editing, category: cat })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Icon size={11} /> {t(TAB_KEYS[cat])}
                </button>
              )
            })}
          </div>
          <div className="lf-row">
            <button
              className="btn-primary"
              onClick={() => {
                if (!editing.name.trim()) return
                onUpsert({ ...editing, name: editing.name.trim(), description: editing.description.trim() })
                setEditing(null)
              }}
            >
              <Check size={14} />
              <span>{t('save')}</span>
            </button>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="lore-list">
        {list.map((item) => {
          const Icon = CAT_ICONS[item.category]
          return (
            <div key={item.id} className="lore-entry">
              <div className="le-head">
                <span className="le-badge">
                  <Icon size={14} />
                </span>
                <h4>{item.name}</h4>
                <span className="le-tools">
                  <button aria-label="Edit" onClick={() => setEditing(item)}>
                    <Pencil size={12} />
                  </button>
                  <button
                    className="cr-del"
                    aria-label={t('delete')}
                    onClick={() => {
                      if (window.confirm(t('deleteLoreQ').replace('{name}', item.name))) onRemove(item.id)
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
              {item.description && <p className="le-desc">{item.description}</p>}
            </div>
          )
        })}
      </div>

      {!editing && (
        <button
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          onClick={() =>
            setEditing({ id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, name: '', category: 'character', description: '' })
          }
        >
          <BookMarked size={13} />
          <span>{t('addLore')}</span>
        </button>
      )}
    </>
  )
}

/* ============================ Типографика (Aa) ============================ */

type AaProps = {
  settings: EditorSettings
  onChange: (s: EditorSettings) => void
  onClose: () => void
}

export function AaPanel({ settings, onChange, onClose }: AaProps) {
  const { t } = useI18n()

  const papers: PaperTheme[] = ['paper', 'sepia', 'night']

  return (
    <>
      <div className="wp-head">
        <h3>{t('typography')}</h3>
        <button className="w-icon" onClick={onClose} aria-label={t('close')} style={{ width: 30, height: 30 }}>
          <X size={16} />
        </button>
      </div>

      <div className="seg-toggle" style={{ marginBottom: 10 }}>
        <button className={settings.font === 'serif' ? 'selected' : ''} onClick={() => onChange({ ...settings, font: 'serif' })}>
          {t('fontSerif')}
        </button>
        <button className={settings.font === 'sans' ? 'selected' : ''} onClick={() => onChange({ ...settings, font: 'sans' })}>
          {t('fontSans')}
        </button>
      </div>

      <div className="aa-row">
        <span>{t('fontSize')}</span>
        <input type="range" min={16} max={26} step={1} value={settings.size} onChange={(e) => onChange({ ...settings, size: Number(e.target.value) })} />
        <strong style={{ minWidth: 20, textAlign: 'right', color: 'var(--accent)' }}>{settings.size}</strong>
      </div>
      <div className="aa-row">
        <span>{t('lineHeight')}</span>
        <input type="range" min={1.4} max={2.2} step={0.05} value={settings.lineHeight} onChange={(e) => onChange({ ...settings, lineHeight: Number(e.target.value) })} />
        <strong style={{ minWidth: 26, textAlign: 'right', color: 'var(--accent)' }}>{settings.lineHeight.toFixed(2)}</strong>
      </div>
      <div className="aa-row">
        <span>{t('pageWidth')}</span>
        <input type="range" min={520} max={840} step={10} value={settings.width} onChange={(e) => onChange({ ...settings, width: Number(e.target.value) })} />
        <strong style={{ minWidth: 32, textAlign: 'right', color: 'var(--accent)' }}>{settings.width}</strong>
      </div>

      <p className="aa-label">{t('paperThemeL')}</p>
      <div className="aa-theme-row">
        {papers.map((p) => (
          <button
            key={p}
            className={settings.paper === p ? 'selected' : ''}
            style={{ background: PAPERS[p].bg, color: PAPERS[p].fg }}
            onClick={() => onChange({ ...settings, paper: p })}
          >
            {t(`paper${p.charAt(0).toUpperCase()}${p.slice(1)}` as MessageKey)}
          </button>
        ))}
      </div>

      <div className="aa-row" style={{ marginTop: 6 }}>
        <span>
          {t('typewriterL')}
          <br />
          <span style={{ fontSize: 9.5, opacity: 0.55 }}>{t('typewriterHint')}</span>
        </span>
        <span className={`toggle ${settings.typewriter ? 'is-dark' : ''}`} role="switch" aria-checked={settings.typewriter} onClick={() => onChange({ ...settings, typewriter: !settings.typewriter })} />
      </div>
    </>
  )
}

/* ============================ Амбиент ============================ */

type AmbProps = {
  kind: AmbienceKind | null
  onPick: (k: AmbienceKind | null) => void
}

export function AmbPopover({ kind, onPick }: AmbProps) {
  const { t } = useI18n()
  const kinds: AmbienceKind[] = ['rain', 'fire', 'cafe']
  const labels: Record<AmbienceKind, MessageKey> = { rain: 'ambRain', fire: 'ambFire', cafe: 'ambCafe' }

  return (
    <div className="amb-popover">
      {kinds.map((k) => (
        <button key={k} className={kind === k ? 'selected' : ''} onClick={() => onPick(k)}>
          <span>{t(labels[k])}</span>
          {kind === k && <Check size={13} />}
        </button>
      ))}
      <span className="amb-sep" />
      <button className={!kind ? 'selected' : ''} onClick={() => onPick(null)}>
        <span>{t('ambOff')}</span>
        {!kind && <Check size={13} />}
      </button>
    </div>
  )
}
