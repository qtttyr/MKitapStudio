/* Мост в MKitap Reader: кладём книгу прямо в его IndexedDB.
   Работает только когда оба приложения живут на одном origin.
   Если ридера нет — честно возвращаем 'fallback' (UI предложит EPUB). */

import { openDB } from 'idb'

export type ReaderBookPayload = {
  title: string
  author: string
  contentHtml: string
}

/** Есть ли на этом origin база ридера? */
async function readerDbExists(): Promise<boolean> {
  try {
    const dbs = await indexedDB.databases?.()
    return (dbs ?? []).some((d) => d.name === 'mkitap')
  } catch {
    return false
  }
}

/**
 * Отправить книгу в MKitap Reader.
 * Никогда не создаём базу сами — только пишем в уже существующую,
 * чтобы не сломать схему ридера.
 */
export async function sendToReader(payload: ReaderBookPayload): Promise<'sent' | 'fallback'> {
  try {
    if (!(await readerDbExists())) return 'fallback'

    /* открываем БЕЗ указания версии — не трогаем upgrade-логику ридера */
    const db = await openDB('mkitap')
    if (!db.objectStoreNames.contains('books')) {
      db.close()
      return 'fallback'
    }

    const palettes = [
      { color: '#e9e1d7', accent: '#a52b2f' },
      { color: '#d8cdbb', accent: '#1b2437' },
      { color: '#efe6db', accent: '#d86d50' },
      { color: '#ddd9c9', accent: '#22201c' },
      { color: '#d9e0dd', accent: '#197c86' },
    ]
    let hash = 0
    for (let i = 0; i < payload.title.length; i++) hash = (hash * 31 + payload.title.charCodeAt(i)) >>> 0
    const palette = palettes[hash % palettes.length]

    await db.put('books', {
      id: `studio-${Date.now().toString(36)}`,
      title: payload.title,
      author: payload.author || 'Unknown author',
      format: 'EPUB',
      content: payload.contentHtml,
      color: palette.color,
      accent: palette.accent,
      progress: 0,
      addedAt: Date.now(),
    })
    db.close()
    return 'sent'
  } catch {
    return 'fallback'
  }
}
