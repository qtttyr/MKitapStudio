/* Рендер обложки книги на canvas → PNG blob (для EPUB и передачи в ридер) */

import type { CoverPreset } from '../types'

const W = 1200
const H = 1800

const PRESET_STOPS: Record<CoverPreset, [string, number][]> = {
  film: [
    ['#ffcc80', 0],
    ['#e67e51', 0.45],
    ['#7a3238', 0.8],
    ['#2b141d', 1],
  ],
  vintage: [
    ['#f0ad4e', 0],
    ['#965f1a', 0.5],
    ['#2b1c10', 1],
  ],
  minimal: [
    ['#5cb85c', 0],
    ['#2b662b', 0.5],
    ['#102410', 1],
  ],
  cyber: [
    ['#6f42c1', 0],
    ['#0275d8', 0.5],
    ['#0d0a1a', 1],
  ],
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Перенос строк по ширине. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export type RenderCoverInput = {
  preset: CoverPreset
  photo?: string
  title: string
  author: string
}

export async function renderCoverBlob(input: RenderCoverInput): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  /* фон */
  let painted = false
  if (input.photo) {
    const img = await loadImage(input.photo)
    if (img) {
      const scale = Math.max(W / img.width, H / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
      painted = true
    }
  }
  if (!painted) {
    const stops = PRESET_STOPS[input.preset] ?? PRESET_STOPS.film
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    for (const [color, at] of stops) grad.addColorStop(at, color)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    /* мягкое «солнце» */
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(W - 220, 300, 110, 0, Math.PI * 2)
    ctx.stroke()

    /* зерно */
    ctx.globalAlpha = 0.05
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000'
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2)
    }
    ctx.globalAlpha = 1
  } else {
    /* фото-затемнение снизу */
    const shade = ctx.createLinearGradient(0, H * 0.45, 0, H)
    shade.addColorStop(0, 'rgba(14,10,7,0)')
    shade.addColorStop(1, 'rgba(14,10,7,0.75)')
    ctx.fillStyle = shade
    ctx.fillRect(0, 0, W, H)
  }

  /* тонкая внутренняя рамка */
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 2
  ctx.strokeRect(46, 46, W - 92, H - 92)

  try {
    await document.fonts.ready
  } catch {
    /* ignore */
  }

  /* автор — сверху */
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 30px "DM Sans", Arial'
  ctx.textAlign = 'left'
  ctx.fillText(input.author.toUpperCase().slice(0, 40), 96, 150)

  /* название — снизу */
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 4
  ctx.font = '600 104px "Cormorant Garamond", Georgia, serif'
  const lines = wrapLines(ctx, input.title || 'Untitled', W - 200).slice(0, 4)
  let y = H - 170 - (lines.length - 1) * 112
  for (const line of lines) {
    ctx.fillText(line, 96, y)
    y += 112
  }
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
