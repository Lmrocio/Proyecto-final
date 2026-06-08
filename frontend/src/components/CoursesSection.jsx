import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import CourseCard from './CourseCard'
import { apiClient } from '../services/apiClient'
import { COURSES_SECTION_CONTENT } from '../data/homeData'

const CARDS_PER_PAGE = 4

const getPaginatedData = (response) => (Array.isArray(response?.data?.data) ? response.data.data : [])

const formatCourseDate = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const toCardCourse = (course, index) => {
  const startDate = formatCourseDate(course?.start_date)
  const endDate = formatCourseDate(course?.end_date)
  const teacherName = course?.teacher?.name ?? COURSES_SECTION_CONTENT.unknownTeacher
  const details = [`${COURSES_SECTION_CONTENT.teacherPrefix}: ${teacherName}`]

  if (course?.bonus?.name) {
    details.push(`${COURSES_SECTION_CONTENT.bonusPrefix}: ${course.bonus.name}`)
  }

  if (course?.meeting_link) {
    details.push(COURSES_SECTION_CONTENT.onlineBadge)
  }

  let level = COURSES_SECTION_CONTENT.scheduleFallback
  if (startDate && endDate) {
    level = `${startDate} - ${endDate}`
  } else if (startDate) {
    level = `Inicio ${startDate}`
  } else if (endDate) {
    level = `Hasta ${endDate}`
  }

  return {
    id: course?.id ?? `course-${index}`,
    title: course?.title ?? 'Curso sin titulo',
    level,
    description: details.join(' · '),
  }
}

const CoursesSection = () => {
  const [courses, setCourses] = useState([])
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [errorText, setErrorText] = useState(COURSES_SECTION_CONTENT.errorText)

  const loadCourses = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    setErrorText(COURSES_SECTION_CONTENT.errorText)

    try {
      const response = await apiClient.get('/courses', {
        params: {
          per_page: 100,
        },
      })

      const backendCourses = getPaginatedData(response)
      setCourses(backendCourses.map(toCardCourse))
      setPage(0)
    } catch (error) {
      setCourses([])
      setLoadError(true)

      const errorStatus = error?.response?.status
      if (errorStatus === 401 || errorStatus === 403) {
        setErrorText(COURSES_SECTION_CONTENT.authRequiredText)
        return
      }

      setErrorText(error?.response?.data?.message ?? COURSES_SECTION_CONTENT.errorText)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadCourses)
  }, [loadCourses])

  const totalPages = Math.max(1, Math.ceil(courses.length / CARDS_PER_PAGE))

  const visibleCourses = useMemo(() => {
    const firstItem = page * CARDS_PER_PAGE
    return courses.slice(firstItem, firstItem + CARDS_PER_PAGE)
  }, [courses, page])

  const hasPrevious = page > 0
  const hasNext = page < totalPages - 1

  const showControls = !isLoading && !loadError && courses.length > CARDS_PER_PAGE

  return (
    <section className="home-courses">
      <div className="home-grid home-courses__header-row">
        <div className="home-courses__controls" aria-hidden={!showControls}>
          <button
            className="home-courses__control"
            type="button"
            title={COURSES_SECTION_CONTENT.previousLabel}
            aria-label={COURSES_SECTION_CONTENT.previousLabel}
            disabled={!hasPrevious || !showControls}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="home-courses__control"
            type="button"
            title={COURSES_SECTION_CONTENT.nextLabel}
            aria-label={COURSES_SECTION_CONTENT.nextLabel}
            disabled={!hasNext || !showControls}
            onClick={() => setPage((currentPage) => Math.min(currentPage + 1, totalPages - 1))}
          >
            <ArrowRight size={18} />
          </button>
        </div>
        <h2 className="home-courses__title">{COURSES_SECTION_CONTENT.title}</h2>
      </div>

      {isLoading ? (
        <div className="home-grid home-courses__grid" aria-live="polite">
          <p>{COURSES_SECTION_CONTENT.loadingText}</p>
        </div>
      ) : null}

      {loadError ? (
        <div className="home-grid home-courses__grid" aria-live="polite">
          <p>{errorText}</p>
          <button className="home-courses__control" type="button" onClick={loadCourses}>
            {COURSES_SECTION_CONTENT.retryLabel}
          </button>
        </div>
      ) : null}

      {!isLoading && !loadError && !visibleCourses.length ? (
        <div className="home-grid home-courses__grid" aria-live="polite">
          <p>{COURSES_SECTION_CONTENT.emptyText}</p>
        </div>
      ) : null}

      {!isLoading && !loadError && visibleCourses.length ? (
        <div className="home-grid home-courses__grid">
          {visibleCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default CoursesSection