/* Настройки редактора — то, как писатель видит свою страницу */

export type PaperTheme = 'paper' | 'sepia' | 'night'

export type EditorSettings = {
  font: 'serif' | 'sans'
  size: number // 16..26 px
  lineHeight: number // 1.4..2.2
  width: number // 520..840 px
  paper: PaperTheme
  typewriter: boolean // держать курсор по центру экрана
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  font: 'serif',
  size: 20,
  lineHeight: 1.85,
  width: 660,
  paper: 'paper',
  typewriter: false,
}

export const PAPERS: Record<PaperTheme, { bg: string; fg: string; label: string }> = {
  paper: { bg: '#f7f3eb', fg: '#2d2824', label: 'Paper' },
  sepia: { bg: '#f0e7d3', fg: '#433422', label: 'Sepia' },
  night: { bg: '#191715', fg: '#d8d0c4', label: 'Night' },
}

const SETTINGS_KEY = 'mkstudio.editor'

export function loadEditorSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_EDITOR_SETTINGS
    const parsed = JSON.parse(raw) as Partial<EditorSettings>
    return { ...DEFAULT_EDITOR_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_EDITOR_SETTINGS
  }
}

export function saveEditorSettings(settings: EditorSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
