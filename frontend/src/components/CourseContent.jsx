import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, FileText, FileUp, Link as LinkIcon, Video, Volume2 } from 'lucide-react'

const formatDueDate = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month} ${hours}:${minutes}`
}

const buildItems = (unit) => {
  const materials = (unit.materials ?? []).map((material) => ({
    id: material.id,
    kind: 'material',
    title: material.title,
    description: material.description ?? material.path ?? 'Lorem ipsum dolor sit amet.',
    materialType: material.type,
  }))

  const assignments = (unit.assignments ?? []).map((assignment) => ({
    id: assignment.id,
    kind: 'assignment',
    title: assignment.title,
    description: assignment.description ?? 'Lorem ipsum dolor sit amet, consectetur.',
    dueDate: assignment.due_date,
    status: assignment.status ?? 'Sin entregar',
    grade: assignment.grade ?? '-',
  }))

  return [...materials, ...assignments]
}

const computeCounts = (unit) => {
  if (unit.resource_counts) {
    return {
      file: unit.resource_counts.file ?? 0,
      link: unit.resource_counts.link ?? 0,
      video: unit.resource_counts.video ?? 0,
      audio: unit.resource_counts.audio ?? 0,
      assignment: unit.resource_counts.assignment ?? 0,
    }
  }

  const materials = unit.materials ?? []
  const assignments = unit.assignments ?? []

  return {
    file: materials.filter((item) => item.type === 'file').length,
    link: materials.filter((item) => item.type === 'link').length,
    video: materials.filter((item) => item.type === 'video').length,
    audio: materials.filter((item) => item.type === 'audio').length,
    assignment: assignments.length,
  }
}

const resolveIcon = (item) => {
  if (item.kind === 'assignment') {
    return <FileUp size={18} />
  }

  if (item.materialType === 'link') {
    return <LinkIcon size={18} />
  }

  if (item.materialType === 'video') {
    return <Video size={18} />
  }

  if (item.materialType === 'audio') {
    return <Volume2 size={18} />
  }

  return <FileText size={18} />
}

const CourseContent = ({ units, variant }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [openUnit, setOpenUnit] = useState('')

  const safeActiveIndex = useMemo(() => {
    if (!units.length) {
      return 0
    }

    return Math.min(activeIndex, units.length - 1)
  }, [activeIndex, units.length])

  const resolvedOpenUnit = useMemo(() => {
    if (!units.length) {
      return ''
    }

    const exists = units.some((unit) => unit.unit_name === openUnit)
    return exists ? openUnit : units[0].unit_name
  }, [openUnit, units])

  const activeUnit = units[safeActiveIndex]
  const items = useMemo(() => (activeUnit ? buildItems(activeUnit) : []), [activeUnit])

  if (!units.length) {
    return null
  }

  if (variant === 'accordion') {
    return (
      <section className="course-content course-content--accordion">
        {units.map((unit) => {
          const isOpen = resolvedOpenUnit === unit.unit_name
          const unitItems = buildItems(unit)

          return (
            <div key={unit.unit_name} className={`course-content__section ${isOpen ? 'course-content__section--open' : ''}`}>
              <button
                className="course-content__section-toggle"
                type="button"
                onClick={() => setOpenUnit(isOpen ? '' : unit.unit_name)}
              >
                <span>{unit.unit_name}</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isOpen ? (
                <div className="course-content__panel">
                  <ul className="course-content__list">
                    {unitItems.map((item) => (
                      <li key={item.id} className="course-content__item">
                        <span className="course-content__item-icon">{resolveIcon(item)}</span>
                        <div className="course-content__item-body">
                          <h4 className="course-content__item-title">{item.title}</h4>
                          <p className="course-content__item-description">{item.description}</p>
                          {item.kind === 'assignment' ? (
                            <div className="course-content__meta">
                              <span>Fecha: {formatDueDate(item.dueDate)}</span>
                              <span>Estado: {item.status}</span>
                              <span>Calificación: {item.grade}</span>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )
        })}
      </section>
    )
  }

  if (variant === 'summary') {
    return (
      <section className="course-content course-content--summary">
        {units.map((unit) => {
          const counts = computeCounts(unit)

          return (
            <article key={unit.unit_name} className="course-content__card">
              <h3 className="course-content__card-title">{unit.unit_name}</h3>
              <p className="course-content__card-text">{unit.description ?? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}</p>
              <div className="course-content__card-meta">
                <span className="course-content__meta-item">
                  <FileText size={16} />
                  <span>{counts.file}</span>
                </span>
                <span className="course-content__meta-item">
                  <FileUp size={16} />
                  <span>{counts.assignment}</span>
                </span>
                <span className="course-content__meta-item">
                  <Video size={16} />
                  <span>{counts.video}</span>
                </span>
                <span className="course-content__meta-item">
                  <Volume2 size={16} />
                  <span>{counts.audio}</span>
                </span>
                <span className="course-content__meta-item">
                  <LinkIcon size={16} />
                  <span>{counts.link}</span>
                </span>
              </div>
            </article>
          )
        })}
      </section>
    )
  }

  return (
    <section className="course-content course-content--tabs">
      <div className="course-content__tabs">
        {units.map((unit, index) => (
          <button
            key={unit.unit_name}
            className={`course-content__tab ${index === safeActiveIndex ? 'course-content__tab--active' : ''}`}
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            {unit.unit_name}
          </button>
        ))}
      </div>
      <div className="course-content__panel">
        <ul className="course-content__list">
          {items.map((item) => (
            <li key={item.id} className="course-content__item">
              <span className="course-content__item-icon">{resolveIcon(item)}</span>
              <div className="course-content__item-body">
                <h4 className="course-content__item-title">{item.title}</h4>
                <p className="course-content__item-description">{item.description}</p>
                {item.kind === 'assignment' ? (
                  <div className="course-content__meta">
                    <span>Fecha: {formatDueDate(item.dueDate)}</span>
                    <span>Estado: {item.status}</span>
                    <span>Calificación: {item.grade}</span>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default CourseContent
