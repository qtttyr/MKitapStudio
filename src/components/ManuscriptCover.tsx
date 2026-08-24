import type { Project } from '../types'

type Props = {
  project: Project
}

/**
 * Обложка рукописи: градиентный пресет или фото с плёночной обработкой.
 * Чистый кадр: ничего лишнего сверху, название — снизу слева.
 */
export function ManuscriptCover({ project }: Props) {
  const hasPhoto = Boolean(project.cover.photo)
  return (
    <div
      className={`book-cover ${hasPhoto ? 'has-photo' : ''}`}
      style={hasPhoto ? undefined : { background: project.cover.gradient }}
    >
      {hasPhoto ? (
        <>
          <img className="cover-photo" src={project.cover.photo} alt="" draggable={false} />
          <span className="fx-shade" aria-hidden="true" />
          <span className="fx-vignette" aria-hidden="true" />
          <span className="fx-leak" aria-hidden="true" />
          <span className="fx-grain" aria-hidden="true" />
        </>
      ) : (
        <>
          <div className="cover-sun" />
          <span
            className="cover-grain"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.28), transparent 70%)' }}
          />
        </>
      )}
      <div className="cover-copy">
        <strong>{project.title}</strong>
        {project.author && <span className="author-sub">{project.author}</span>}
      </div>
    </div>
  )
}
