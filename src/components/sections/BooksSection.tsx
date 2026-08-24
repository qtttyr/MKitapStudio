import { useMemo, useState } from 'react'
import { Search, Library } from 'lucide-react'
import { useStudio } from '../../lib/studioContext'
import { useI18n } from '../../lib/i18n'
import { EmptyState } from '../EmptyState'
import { ManuscriptCard } from './HomeSection'

type Props = {
  onOpenProject: (id: string) => void
  onOpenDetails: (id: string) => void
}

export function BooksSection({ onOpenProject, onOpenDetails }: Props) {
  const { projects, ready } = useStudio()
  const { t } = useI18n()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.genre.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q),
    )
  }, [projects, query])

  if (!ready) return null

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Library}
        variant="orbit"
        kicker={t('booksEmptyK')}
        title={t('booksEmptyT')}
        subtitle={t('booksEmptyS')}
      />
    )
  }

  return (
    <div className="books-section">
      <div className="page-intro">
        <p className="eyebrow">MK.STUDIO</p>
        <h1>
          {t('manuscriptsT')}
          <em>.</em>
        </h1>
        <p>{t('manuscriptsS')}</p>
      </div>

      {projects.length > 3 && (
        <div className="search-line">
          <label className="search-input">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPh')} />
          </label>
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: 12.5, padding: '20px 4px' }}>{t('searchPh')}: —</p>
      ) : (
        <div className="book-grid">
          {filtered.map((p) => (
            <ManuscriptCard key={p.id} id={p.id} onOpen={() => onOpenProject(p.id)} onMenu={() => onOpenDetails(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
