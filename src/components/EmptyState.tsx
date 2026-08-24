import type { LucideIcon } from 'lucide-react'

type Variant = 'orbit' | 'wave' | 'quill'

type Props = {
  icon: LucideIcon
  variant?: Variant
  kicker?: string
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

const WAVE_WORDS = ['Every', 'story', 'starts', 'with', 'a', 'single', 'sentence.']

/**
 * Живое пустое состояние: тихая сцена вместо «данных нет».
 * orbit — свечение и орбита; wave — бегущая волна по словам; quill — парящее перо.
 */
export function EmptyState({ icon: Icon, variant = 'orbit', kicker, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div className="empty-state">
      <div className="es-scene" aria-hidden="true">
        <div className="es-glow" />
        {variant === 'orbit' && (
          <>
            <span className="es-orb es-orb-1" />
            <span className="es-orb es-orb-2" />
            <div className="es-icon">
              <Icon size={44} strokeWidth={1.4} />
            </div>
          </>
        )}
        {variant === 'wave' && (
          <p style={{ maxWidth: 300 }}>
            {WAVE_WORDS.map((w, i) => (
              <span key={i} className="es-word" style={{ ['--i' as string]: i }}>
                {w}{' '}
              </span>
            ))}
          </p>
        )}
        {variant === 'quill' && (
          <div className="es-icon onb-quill">
            <Icon size={54} strokeWidth={1.3} />
          </div>
        )}
      </div>
      {kicker && <p className="eyebrow">{kicker}</p>}
      <h3 className="es-title">{title}</h3>
      {subtitle && <p className="es-sub">{subtitle}</p>}
      {actionLabel && onAction && (
        <button className="es-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
