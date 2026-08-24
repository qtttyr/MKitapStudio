import { Feather, Library, User } from 'lucide-react'
import type { StudioSection } from '../types'
import { useI18n } from '../lib/i18n'

type Props = {
  section: StudioSection
  changeSection: (next: StudioSection) => void
}

const icons = { home: Feather, books: Library, profile: User }

export function BottomNav({ section, changeSection }: Props) {
  const { t } = useI18n()

  const items = [
    { id: 'home' as StudioSection, label: t('navHome') },
    { id: 'books' as StudioSection, label: t('navBooks') },
    { id: 'profile' as StudioSection, label: t('navProfile') },
  ]

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation">
      {items.map(({ id, label }) => {
        const Icon = icons[id]
        return (
          <button key={id} className={section === id ? 'active' : ''} onClick={() => changeSection(id)}>
            <Icon size={19} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
