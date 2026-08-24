import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, Trash2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'

/* Соотношение обложки 2:3 (превью и экспорт). */
const VIEW_W = 300
const VIEW_H = 450
const OUT_W = 600
const OUT_H = 900
const MIN_SCALE = 1
const MAX_SCALE = 5

type Props = {
  currentCover?: string
  onSave: (dataUrl: string) => void
  onRemove?: () => void
  onClose: () => void
}

type ImgBase = { w: number; h: number }
type ViewState = { scale: number; tx: number; ty: number }

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Кроп фото для обложки: изображение всегда покрывает кадр 2:3,
 * писатель двигает и зумит — результат экспортируется в JPEG 600×900.
 * Портировано из MKitap Reader 1:1.
 */
export function CoverCropModal({ currentCover, onSave, onRemove, onClose }: Props) {
  const { t } = useI18n()
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [base, setBase] = useState<ImgBase | null>(null)
  const [view, setView] = useState<ViewState>({ scale: 1, tx: 0, ty: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const st = useRef<ViewState>({ scale: 1, tx: 0, ty: 0 })
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)

  const computeBase = (el: HTMLImageElement) => {
    const f = Math.max(VIEW_W / el.naturalWidth, VIEW_H / el.naturalHeight)
    setBase({ w: el.naturalWidth * f, h: el.naturalHeight * f })
  }

  const loadImage = useCallback((src: string) => {
    const el = new Image()
    el.onload = () => {
      computeBase(el)
      st.current = { scale: 1, tx: 0, ty: 0 }
      setView({ scale: 1, tx: 0, ty: 0 })
      setImg(el)
    }
    el.src = src
  }, [])

  /* текущая обложка подгружается для правки */
  useEffect(() => {
    if (currentCover) loadImage(currentCover)
  }, [currentCover, loadImage])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    loadImage(URL.createObjectURL(file))
    e.target.value = ''
  }

  /** tx/ty, при которых точка изображения (nx,ny) остаётся под точкой кадра (vx,vy). */
  const anchorOffsets = (nScale: number, nx: number, ny: number, vx: number, vy: number) => {
    const b = base
    if (!b) return { tx: 0, ty: 0 }
    const dispW = b.w * nScale
    const dispH = b.h * nScale
    return {
      tx: clamp(vx - nx * dispW, VIEW_W - dispW, 0),
      ty: clamp(vy - ny * dispH, VIEW_H - dispH, 0),
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: st.current.scale,
      }
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!img || !base || !viewportRef.current) return

    if (pointers.current.size >= 2 && pinchRef.current) {
      const pts = [...pointers.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (pinchRef.current.dist > 0 && dist > 0) {
        const nScale = clamp(pinchRef.current.scale * (dist / pinchRef.current.dist), MIN_SCALE, MAX_SCALE)
        const rect = viewportRef.current.getBoundingClientRect()
        const vx = (pts[0].x + pts[1].x) / 2 - rect.left
        const vy = (pts[0].y + pts[1].y) / 2 - rect.top
        const nx = (vx - st.current.tx) / (base.w * st.current.scale)
        const ny = (vy - st.current.ty) / (base.h * st.current.scale)
        const off = anchorOffsets(nScale, nx, ny, vx, vy)
        st.current = { scale: nScale, tx: off.tx, ty: off.ty }
        setView({ ...st.current })
      }
    } else {
      const dispW = base.w * st.current.scale
      const dispH = base.h * st.current.scale
      st.current.tx = clamp(st.current.tx + dx, VIEW_W - dispW, 0)
      st.current.ty = clamp(st.current.ty + dy, VIEW_H - dispH, 0)
      setView({ ...st.current })
    }
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchRef.current = null
  }

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!img || !base || !viewportRef.current) return
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    const nScale = clamp(st.current.scale * factor, MIN_SCALE, MAX_SCALE)
    const rect = viewportRef.current.getBoundingClientRect()
    const vx = e.clientX - rect.left
    const vy = e.clientY - rect.top
    const nx = (vx - st.current.tx) / (base.w * st.current.scale)
    const ny = (vy - st.current.ty) / (base.h * st.current.scale)
    const off = anchorOffsets(nScale, nx, ny, vx, vy)
    st.current = { scale: nScale, tx: off.tx, ty: off.ty }
    setView({ ...st.current })
  }

  const onSlider = (val: number) => {
    if (!img || !base || !viewportRef.current) return
    const nScale = clamp(val, MIN_SCALE, MAX_SCALE)
    const rect = viewportRef.current.getBoundingClientRect()
    const vx = rect.width / 2
    const vy = rect.height / 2
    const nx = (vx - st.current.tx) / (base.w * st.current.scale)
    const ny = (vy - st.current.ty) / (base.h * st.current.scale)
    const off = anchorOffsets(nScale, nx, ny, vx, vy)
    st.current = { scale: nScale, tx: off.tx, ty: off.ty }
    setView({ ...st.current })
  }

  const save = () => {
    if (!img || !base) return
    const { scale: s, tx: x, ty: y } = st.current
    const dispW = base.w * s
    const dispH = base.h * s
    const srcX = (-x / dispW) * img.naturalWidth
    const srcY = (-y / dispH) * img.naturalHeight
    const srcW = (VIEW_W / dispW) * img.naturalWidth
    const srcH = (VIEW_H / dispH) * img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W
    canvas.height = OUT_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H)
    onSave(canvas.toDataURL('image/jpeg', 0.88))
  }

  const { scale, tx, ty } = view

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('coverTitle')} style={{ zIndex: 100 }} onClick={onClose}>
      <div className="crop-card" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">{t('coverKicker')}</p>
        <h2>{t('coverTitle')}</h2>

        <div
          className="crop-viewport"
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onWheel={onWheel}
          style={{ touchAction: 'none' }}
        >
          {img && base ? (
            <img
              className="crop-img"
              src={img.src}
              alt=""
              draggable={false}
              style={{
                width: base.w * scale,
                height: base.h * scale,
                transform: `translate(${tx}px, ${ty}px)`,
              }}
            />
          ) : (
            <button className="crop-empty" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={26} />
              <span>{t('choosePhoto')}</span>
            </button>
          )}
          <span className="crop-guides" aria-hidden="true" />
        </div>

        {img && (
          <div className="crop-zoom-row">
            <span className="crop-zoom-minus">−</span>
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={scale}
              onChange={(e) => onSlider(Number(e.target.value))}
              aria-label="Zoom"
            />
            <span className="crop-zoom-plus">+</span>
          </div>
        )}

        <p className="crop-hint">{t('coverHint')}</p>

        <div className="crop-actions">
          <button className="crop-pick" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={15} /> {t('choosePhoto')}
          </button>
          {currentCover && onRemove && (
            <button
              className="crop-remove"
              onClick={() => {
                onRemove()
                onClose()
              }}
            >
              <Trash2 size={14} /> {t('removeCover')}
            </button>
          )}
        </div>

        <div className="crop-footer">
          <button className="btn-secondary" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="crop-save" onClick={save} disabled={!img}>
            <Check size={15} /> {t('save')}
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>
    </div>
  )
}
