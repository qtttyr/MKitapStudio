import { Feather, Library, User } from 'lucide-react'
import type { StudioSection } from '../types'
import { useI18n } from '../lib/i18n'

type Props = {
  section: StudioSection
  changeSection: (next: StudioSection) => void
  bookCount: number
}

export function SideNav({ section, changeSection, bookCount }: Props) {
  const { t } = useI18n()

  const navItems = [
    { id: 'home' as StudioSection, label: t('navHome'), icon: Feather },
    { id: 'books' as StudioSection, label: t('navBooks'), icon: Library },
    { id: 'profile' as StudioSection, label: t('navProfile'), icon: User },
  ]

  return (
    <aside className="side-nav">
      <p className="eyebrow">Studio</p>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button key={id} className={`side-link ${section === id ? 'active' : ''}`} onClick={() => changeSection(id)}>
          <Icon size={17} />
          <span>{label}</span>
          {id === 'books' && bookCount > 0 && <span className="nav-count">{bookCount}</span>}
        </button>
      ))}
    </aside>
  )
}
