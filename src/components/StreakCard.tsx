import { Flame } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { getGoal, getStreak, getTodayWords } from '../lib/writingStats'
import { GoalRing } from './GoalRing'

type Props = {
  refreshToken?: number
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

/** Тихая карточка ритма: огонёк стрика + кольцо цели дня. */
export function StreakCard({ refreshToken }: Props) {
  void refreshToken
  const { lang, t } = useI18n()

  const today = getTodayWords()
  const goal = getGoal()
  const streak = getStreak()
  const pct = goal > 0 ? Math.min(1, today / goal) : 0

  const streakLabel =
    lang === 'ru'
      ? `${streak} ${pluralRu(streak, 'день', 'дня', 'дней')} подряд`
      : `${streak}-day streak`

  const sub = t('todayOfGoal').replace('{w}', String(today)).replace('{goal}', String(goal))

  return (
    <div className="streak-card">
      <span className="streak-flame" aria-hidden="true">
        <Flame size={22} />
      </span>
      <strong>{streakLabel}</strong>
      <span className="streak-sub">{sub}</span>
      <span style={{ marginTop: 8 }}>
        <GoalRingWithCount pct={pct} today={today} goal={goal} />
      </span>
    </div>
  )
}

function GoalRingWithCount({ pct, today, goal }: { pct: number; today: number; goal: number }) {
  return (
    <span className="goal-ring-wrap" style={{ position: 'relative', display: 'inline-grid', placeItems: 'center' }}>
      <GoalRing pct={pct} />
      <em style={{ position: 'absolute', font: "600 17px var(--font-serif)", fontStyle: 'normal' }}>
        {today}
        <i style={{ fontStyle: 'normal', fontSize: 11, color: 'var(--muted-foreground)' }}>/{goal}</i>
      </em>
    </span>
  )
}
