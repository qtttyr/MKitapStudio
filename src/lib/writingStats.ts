/* Учёт written words по дням (localStorage) + стрик и цель дня писателя */

import { dayKey } from './utils'

const KEY = 'mkstudio.daily'
const GOAL_KEY = 'mkstudio.goal'
const CELEBRATE_KEY = 'mkstudio.goalParty'

type WordMap = Record<string, number> // 'YYYY-MM-DD' → слов за день

function wordMap(): WordMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as WordMap
  } catch {
    return {}
  }
}

function writeMap(m: WordMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

/** Записать дельту написанных сегодня слов. */
export function recordWords(delta: number): void {
  if (delta <= 0) return
  const m = wordMap()
  const k = dayKey(new Date())
  m[k] = (m[k] ?? 0) + delta
  /* держим карту компактной — максимум год назад */
  const keys = Object.keys(m).sort()
  while (keys.length > 400) delete m[keys.shift() as string]
  writeMap(m)
}

export function getTodayWords(): number {
  return wordMap()[dayKey(new Date())] ?? 0
}

/** Цель дня в словах (по умолчанию 300 — дружелюбный старт). */
export function getGoal(): number {
  const v = Number(localStorage.getItem(GOAL_KEY))
  return Number.isFinite(v) && v >= 50 ? Math.round(v) : 300
}

export function setGoal(words: number): void {
  localStorage.setItem(GOAL_KEY, String(Math.max(50, Math.round(words))))
}

/** Стрик: сколько дней подряд писали хотя бы слово. */
export function getStreak(): number {
  const m = wordMap()
  let streak = 0
  const d = new Date()
  /* если сегодня ещё пусто — стрик может держаться на вчера */
  if ((m[dayKey(d)] ?? 0) < 1) d.setDate(d.getDate() - 1)
  while ((m[dayKey(d)] ?? 0) >= 1) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export type DayStat = { key: string; words: number }

/** Последние n дней (старые → новые) для графика. */
export function history(n: number): DayStat[] {
  const m = wordMap()
  const out: DayStat[] = []
  const d = new Date()
  d.setDate(d.getDate() - (n - 1))
  for (let i = 0; i < n; i++) {
    out.push({ key: dayKey(d), words: m[dayKey(d)] ?? 0 })
    d.setDate(d.getDate() + 1)
  }
  return out
}

/** Конфетти «цель дня» — один раз в день. */
export function wasGoalCelebrated(): boolean {
  return localStorage.getItem(CELEBRATE_KEY) === dayKey(new Date())
}

export function markGoalCelebrated(): void {
  localStorage.setItem(CELEBRATE_KEY, dayKey(new Date()))
}
