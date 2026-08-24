/* Мини-Markdown для писателя: безопасный (всё экранируется), без зависимостей.
   Поддержка: # заголовки, **жирный**, *курсив*, _курсив_, ~~зачёркнутый~~,
   `код`, [ссылки](https://…), > цитаты, --- разделители, списки,
   ``` блоки кода и ||спойлеры|| как в Telegram. */

export type SpoilerMode = 'style' | 'plain'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Инлайн-разметка поверх экранированного текста. */
function inline(raw: string, spoilerMode: SpoilerMode): string {
  let s = esc(raw)

  /* `код` — первым, чтобы внутреннее не форматировалось */
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>')

  /* [текст](https://…) — только http(s) */
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  /* жирный */
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')

  /* курсив — одиночные * или _, не внутри слов (snake_case не ломаем) */
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')

  /* зачёркнутый */
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')

  /* спойлер как в Telegram: в превью скрывается, при экспорте остаётся текстом */
  if (spoilerMode === 'plain') {
    s = s.replace(/\|\|([^|\n]+)\|\|/g, '$1')
  } else {
    s = s.replace(/\|\|([^|\n]+)\|\|/g, '<span class="spoiler">$1</span>')
  }

  return s
}

export function mdToHtml(md: string, opts?: { spoilers?: SpoilerMode }): string {
  const spoilerMode = opts?.spoilers ?? 'style'
  const lines = String(md ?? '').replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []

  let para: string[] = []
  let quote: string[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null
  let fence = false
  const codeLines: string[] = []

  const flushPara = () => {
    if (!para.length) return
    out.push(`  <p>${para.map((l) => inline(l, spoilerMode)).join('<br/>')}</p>`)
    para = []
  }
  const flushQuote = () => {
    if (!quote.length) return
    out.push(`  <blockquote><p>${quote.map((l) => inline(l, spoilerMode)).join('<br/>')}</p></blockquote>`)
    quote = []
  }
  const flushList = () => {
    if (!list) return
    const tag = list.type
    out.push(
      `  <${tag}>\n${list.items.map((it) => `    <li>${inline(it, spoilerMode)}</li>`).join('\n')}\n  </${tag}>`,
    )
    list = null
  }
  const flushAll = () => {
    flushPara()
    flushQuote()
    flushList()
  }

  for (const line of lines) {
    /* fenced code */
    if (/^\s*```/.test(line)) {
      if (fence) {
        out.push(`  <pre><code>${esc(codeLines.join('\n'))}</code></pre>`)
        codeLines.length = 0
        fence = false
      } else {
        flushAll()
        fence = true
      }
      continue
    }
    if (fence) {
      codeLines.push(line)
      continue
    }

    const t = line.trim()

    if (!t) {
      flushAll()
      continue
    }

    /* заголовки: # → h2, ## → h3, ### → h4 (h1 занят названием главы) */
    const h = t.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      flushAll()
      const level = h[1].length + 1
      out.push(`  <h${level}>${inline(h[2], spoilerMode)}</h${level}>`)
      continue
    }

    /* разделитель */
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      flushAll()
      out.push('  <hr/>')
      continue
    }

    /* цитата */
    const q = line.match(/^\s*>\s?(.*)$/)
    if (q) {
      flushPara()
      flushList()
      quote.push(q[1])
      continue
    }

    /* списки */
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      flushPara()
      flushQuote()
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(ul[1])
      continue
    }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ol) {
      flushPara()
      flushQuote()
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(ol[1])
      continue
    }

    /* обычная строка абзаца */
    flushQuote()
    flushList()
    para.push(t)
  }

  /* хвосты */
  if (fence && codeLines.length) out.push(`  <pre><code>${esc(codeLines.join('\n'))}</code></pre>`)
  flushAll()

  return out.join('\n')
}
