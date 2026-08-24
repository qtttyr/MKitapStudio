import { useState } from 'react'
import { Monitor, Moon, Paintbrush, SunMedium, Type, X } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import type { Theme } from '../lib/theme'
import { DEFAULT_EDITOR_SETTINGS, PAPERS, loadEditorSettings, saveEditorSettings, type EditorSettings, type PaperTheme } from '../lib/editorSettings'

type Props = {
  onClose: () => void
  theme: Theme
  setTheme: (t: Theme) => void
}

/** Настройки: оформление, язык и то, как выглядит страница редактора. */
export function SettingsScreen({ onClose, theme, setTheme }: Props) {
  const { t, lang, setLang } = useI18n()
  const [editor, setEditor] = useState<EditorSettings>(loadEditorSettings)

  const patchEditor = (patch: Partial<EditorSettings>) => {
    const next = { ...editor, ...patch }
    setEditor(next)
    saveEditorSettings(next)
  }

  const themeOptions: { value: Theme; label: string; icon: typeof SunMedium }[] = [
    { value: 'light', label: t('themeLight'), icon: SunMedium },
    { value: 'dark', label: t('themeDark'), icon: Moon },
    { value: 'system', label: t('themeSystem'), icon: Monitor },
  ]

  const papers: PaperTheme[] = ['paper', 'sepia', 'night']

  return (
    <div className="settings-screen" role="dialog" aria-modal="true" aria-label={t('settings')}>
      <header className="settings-head">
        <div>
          <p className="eyebrow">MK.STUDIO</p>
          <h2>{t('settings')}</h2>
        </div>
        <button className="modal-close" onClick={onClose} aria-label={t('close')}>
          <X size={19} />
        </button>
      </header>

      <div className="settings-scroll">
        <div className="settings-inner">
          <section className="settings-section">
            <h3>
              <Paintbrush size={15} /> {t('appearanceL')}
            </h3>
            <div className="theme-options">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button key={value} className={`theme-option ${theme === value ? 'selected' : ''}`} onClick={() => setTheme(value)}>
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>{t('languageL')}</h3>
            <div className="seg-toggle">
              <button className={lang === 'en' ? 'selected' : ''} onClick={() => setLang('en')}>
                English
              </button>
              <button className={lang === 'ru' ? 'selected' : ''} onClick={() => setLang('ru')}>
                Русский
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>
              <Type size={15} /> {t('editorDefaults')}
            </h3>

            <div className="setting-row">
              <span>{t('typography')}</span>
              <div className="seg-toggle">
                <button className={editor.font === 'serif' ? 'selected' : ''} onClick={() => patchEditor({ font: 'serif' })}>
                  {t('fontSerif')}
                </button>
                <button className={editor.font === 'sans' ? 'selected' : ''} onClick={() => patchEditor({ font: 'sans' })}>
                  {t('fontSans')}
                </button>
              </div>
            </div>

            <div className="setting-row">
              <span>
                {t('fontSize')} <strong>{editor.size}</strong>
              </span>
              <input type="range" min={16} max={26} step={1} value={editor.size} onChange={(e) => patchEditor({ size: Number(e.target.value) })} />
            </div>

            <div className="setting-row">
              <span>
                {t('lineHeight')} <strong>{editor.lineHeight.toFixed(2)}</strong>
              </span>
              <input type="range" min={1.4} max={2.2} step={0.05} value={editor.lineHeight} onChange={(e) => patchEditor({ lineHeight: Number(e.target.value) })} />
            </div>

            <div className="setting-row">
              <span>
                {t('pageWidth')} <strong>{editor.width}</strong>
              </span>
              <input type="range" min={520} max={840} step={10} value={editor.width} onChange={(e) => patchEditor({ width: Number(e.target.value) })} />
            </div>

            <div className="setting-row">
              <span>{t('paperThemeL')}</span>
              <div className="paper-swatches">
                {papers.map((p) => (
                  <button
                    key={p}
                    className={editor.paper === p ? 'selected' : ''}
                    style={{ background: PAPERS[p].bg, color: PAPERS[p].fg }}
                    onClick={() => patchEditor({ paper: p })}
                  >
                    {t(`paper${p.charAt(0).toUpperCase()}${p.slice(1)}` as 'paperPaper')}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span>
                {t('typewriterL')}
                <br />
                <span className="sub">{t('typewriterHint')}</span>
              </span>
              <span
                className={`toggle ${editor.typewriter ? 'is-dark' : ''}`}
                role="switch"
                aria-checked={editor.typewriter}
                onClick={() => patchEditor({ typewriter: !editor.typewriter })}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => patchEditor(DEFAULT_EDITOR_SETTINGS)}>
                Reset to defaults
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>{t('aboutL')}</h3>
            <p className="about-text">
              mk.studio — {t('versionL')}
              <br />
              Made with care for people who write.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
