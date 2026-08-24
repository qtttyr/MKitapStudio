/* Конфетти из букв и звёзд в тёплой палитре приложения.
   Взрыв снизу вверх + мягкое падение с гравитацией. */

const COLORS = ['#ffa45c', '#f0683a', '#f5d97a', '#e27b65', '#f3ead9']
const GLYPHS = ['A', 'B', 'K', 'M', 'а', 'к', 'и', 'т', 'e', 's', '✦', '★']

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  color: string
  glyph: string
  star: boolean
}

function drawStar(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45
    const a = (Math.PI / 5) * i - Math.PI / 2
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

/** Запустить салют на весь экран; возвращает функцию остановки. */
export function fireConfetti(canvas: HTMLCanvasElement, durationMs = 3400): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const W = canvas.width
  const H = canvas.height
  const parts: Particle[] = []

  for (let i = 0; i < 110; i++) {
    /* два залпа из нижних углов — как настоящий фейерверк */
    const fromLeft = i % 2 === 0
    const ang = (fromLeft ? -0.9 : -Math.PI + 0.9) + (Math.random() - 0.5) * 1.1
    const sp = 11 + Math.random() * 10
    parts.push({
      x: fromLeft ? W * 0.12 : W * 0.88,
      y: H + 10,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      size: 13 + Math.random() * 17,
      color: COLORS[i % COLORS.length],
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      star: Math.random() < 0.45,
    })
  }

  const start = performance.now()
  let raf = 0
  const frame = (now: number) => {
    const el = now - start
    ctx.clearRect(0, 0, W, H)
    ctx.globalAlpha = Math.min(1, Math.max(0, 1 - el / durationMs))
    for (const p of parts) {
      p.vy += 0.17 // гравитация
      p.vx *= 0.991 // сопротивление воздуха
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.star) {
        drawStar(ctx, p.size * 0.55)
      } else {
        ctx.font = `700 ${p.size}px "DM Sans", Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.glyph, 0, 0)
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1
    if (el < durationMs) {
      raf = requestAnimationFrame(frame)
    } else {
      ctx.clearRect(0, 0, W, H)
    }
  }
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}
