export type Theme = 'light' | 'dark' | 'system'

export const STATUS_BAR_COLORS = {
  light: '#f6f4ef',
  dark: '#1d1c1b',
} as const

export function setStatusBarColor(color: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = color
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  setStatusBarColor(STATUS_BAR_COLORS[resolved])
  document.documentElement.style.backgroundColor = STATUS_BAR_COLORS[resolved]
}

export function watchSystemTheme(callback: (dark: boolean) => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (event: MediaQueryListEvent) => callback(event.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

const THEME_KEY = 'mkstudio.theme'

export function loadTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
}
