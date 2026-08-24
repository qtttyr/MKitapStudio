/* Общие утилиты студии */

export function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Подсчёт слов: любые юникод-слова, разделённые пробелами. */
export function countWords(text: string): number {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** «только что / 5 мин / 2 ч / вчера / 12 мар» — коротко и по-человечески. */
export function relTime(ts: number, lang: string): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return lang === 'ru' ? 'только что' : 'just now'
  if (min < 60) return lang === 'ru' ? `${min} мин назад` : `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return lang === 'ru' ? `${h} ч назад` : `${h}h ago`
  const d = new Date(ts)
  const today = new Date()
  const yest = new Date()
  yest.setDate(today.getDate() - 1)
  if (dayKey(d) === dayKey(yest)) return lang === 'ru' ? 'вчера' : 'yesterday'
  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' }).format(ts)
}

/** Имя файла для экспорта. */
export function slugify(title: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }
  const s = title
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'manuscript'
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  try {
    const est = await navigator.storage?.estimate?.()
    return { usage: est?.usage ?? 0, quota: est?.quota ?? 0 }
  } catch {
    return { usage: 0, quota: 0 }
  }
}
