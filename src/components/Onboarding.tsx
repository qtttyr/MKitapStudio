import { useEffect, useState } from 'react'
import { ArrowRight, Feather } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { GoalRing } from './GoalRing'

type Props = {
  defaultName: string
  onFinish: (name: string) => void
}

const COUNT = 4

const DEMO_TEXT = 'It was a quiet evening when the first sentence finally arrived — and the room disappeared.'

/** Онбординг: четыре тихих слайда о главном. */
export function Onboarding({ defaultName, onFinish }: Props) {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)
  const [name, setName] = useState(defaultName === 'Alex' ? '' : defaultName)
  const [typed, setTyped] = useState(0)
  const [ringPct, setRingPct] = useState(0)

  /* слайд 2: печатающийся текст по кругу */
  useEffect(() => {
    if (index !== 1) return
    let i = 0
    let timer = 0
    const tick = () => {
      i += 1
      if (i > DEMO_TEXT.length) {
        window.setTimeout(() => {
          i = 0
          setTyped(0)
          tick()
        }, 2600)
        return
      }
      setTyped(i)
      timer = window.setTimeout(tick, 34 + Math.random() * 40)
    }
    timer = window.setTimeout(tick, 400)
    return () => window.clearTimeout(timer)
  }, [index])

  /* слайд 3: кольцо наполняется при входе, тап — заново */
  const goTo = (i: number) => {
    setIndex(i)
    if (i === 2) {
      setRingPct(0)
      window.setTimeout(() => setRingPct(0.78), 500)
    }
  }

  const next = () => goTo(Math.min(COUNT - 1, index + 1))
  const prev = () => goTo(Math.max(0, index - 1))

  const finish = () => onFinish(name.trim() || 'Alex')

  return (
    <div className="onboarding" onClick={next}>
      <div className="onb-segments" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: COUNT }, (_, i) => (
          <span key={i} className="onb-seg">
            <span className={`${i < index ? 'done' : ''} ${i === index ? 'fill' : ''}`} />
          </span>
        ))}
      </div>

      <div className="onb-viewport">
        <div key={index} className="onb-slide">
          {index === 0 && (
            <>
              <p className="onb-kicker">{t('ob1K')}</p>
              <h2>{t('ob1T')}</h2>
              <p className="onb-sub">{t('ob1S')}</p>
              <div className="onb-demo">
                <span className="onb-quill">
                  <Feather size={56} strokeWidth={1.2} />
                </span>
              </div>
              <p className="onb-hint">{t('ob1H')}</p>
            </>
          )}

          {index === 1 && (
            <>
              <p className="onb-kicker">{t('ob2K')}</p>
              <h2>{t('ob2T')}</h2>
              <p className="onb-sub">{t('ob2S')}</p>
              <div className="onb-demo">
                <p className="onb-type-demo">
                  {DEMO_TEXT.slice(0, typed)}
                  <span className="caret" />
                </p>
              </div>
              <p className="onb-hint">{t('ob2H')}</p>
            </>
          )}

          {index === 2 && (
            <>
              <p className="onb-kicker">{t('ob3K')}</p>
              <h2>{t('ob3T')}</h2>
              <p className="onb-sub">{t('ob3S')}</p>
              <div
                className="onb-demo"
                onClick={(e) => {
                  e.stopPropagation()
                  setRingPct((v) => (v >= 1 ? 0.15 : v + 0.28))
                }}
              >
                <span style={{ position: 'relative', display: 'inline-grid', placeItems: 'center' }}>
                  <GoalRing pct={ringPct} size={120} stroke={8} />
                  <em style={{ position: 'absolute', font: '600 26px var(--font-serif)', fontStyle: 'normal' }}>
                    {Math.round(ringPct * 100)}%
                  </em>
                </span>
              </div>
              <p className="onb-hint">{t('ob3H')}</p>
            </>
          )}

          {index === 3 && (
            <>
              <p className="onb-kicker">{t('ob4K')}</p>
              <h2>{t('ob4NameL')}</h2>
              <p className="onb-sub">{t('ob4S')}</p>
              <input
                className="onb-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') finish()
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder={t('ob4NamePh')}
                maxLength={40}
                autoFocus
              />
              <button
                className="onb-start"
                onClick={(e) => {
                  e.stopPropagation()
                  finish()
                }}
              >
                {t('obStart')} <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="onb-controls" onClick={(e) => e.stopPropagation()}>
        <button className="btn-secondary" style={{ visibility: index === 0 ? 'hidden' : undefined }} onClick={prev}>
          {t('obBack')}
        </button>
        {index < COUNT - 1 && (
          <button className="btn-secondary" onClick={() => { onFinish(name.trim() || defaultName) }}>
            {t('obSkip')}
          </button>
        )}
      </div>
    </div>
  )
}
