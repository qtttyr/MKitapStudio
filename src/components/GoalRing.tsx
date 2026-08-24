type Props = {
  /** 0..1 */
  pct: number
  size?: number
  stroke?: number
}

/** Кольцо цели — тихий ритуал каждого дня. */
export function GoalRing({ pct, size = 66, stroke = 5.5 }: Props) {
  const R = (size - stroke) / 2
  const C = 2 * Math.PI * R
  const clamped = Math.min(1, Math.max(0, pct))
  const tipOpacity = clamped > 0.02 && clamped < 1 ? 1 : 0

  return (
    <span className="goal-ring" aria-hidden="true">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffa45c" />
            <stop offset="55%" stopColor="#f0683a" />
            <stop offset="100%" stopColor="#f5d97a" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={R} strokeWidth={stroke} />
        <circle
          className="ring-fg"
          cx={size / 2}
          cy={size / 2}
          r={R}
          stroke="url(#goalGrad)"
          strokeWidth={stroke}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle
          cx={size / 2}
          cy={size / 2 - R}
          r={stroke / 2 + 0.6}
          fill="#f5d97a"
          transform={`rotate(${clamped * 360} ${size / 2} ${size / 2})`}
          style={{ opacity: tipOpacity }}
        />
      </svg>
    </span>
  )
}
