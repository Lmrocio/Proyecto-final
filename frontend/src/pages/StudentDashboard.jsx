import { useCallback, useEffect, useState } from 'react'
import { Video } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../services/apiClient'
import CourseContent from '../components/CourseContent'
import Modal from '../components/Modal'
import StudentLayout from '../layouts/StudentLayout'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/authContext'
import { useConfig } from '../context/configContext'

const SAMPLE_COURSE = {
  id: null,
  title: 'Título del curso',
  meeting_link: null,
}

const SAMPLE_UNITS = [
  {
    unit_name: 'UNIDAD 1',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    materials: [
      {
        id: 'mat-1',
        title: 'Guía de lectura',
        type: 'file',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      {
        id: 'mat-2',
        title: 'Enlace de apoyo',
        type: 'link',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      {
        id: 'mat-3',
        title: 'Video introductorio',
        type: 'video',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      {
        id: 'mat-4',
        title: 'Audio practice',
        type: 'audio',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
    ],
    assignments: [
      {
        id: 'ass-1',
        title: 'Actividad 1',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        due_date: '2026-05-22T23:45:00',
      },
    ],
  },
  {
    unit_name: 'UNIDAD 2',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    materials: [
      {
        id: 'mat-5',
        title: 'Material de apoyo',
        type: 'file',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      {
        id: 'mat-6',
        title: 'Referencia externa',
        type: 'link',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
    ],
    assignments: [
      {
        id: 'ass-2',
        title: 'Actividad 2',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        due_date: '2026-05-28T18:30:00',
      },
    ],
  },
]

const StudentDashboard = () => {
  const { uiVariant } = useConfig()
  const { status: authStatus, user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const themeVariant = uiVariant ?? 'v1'
  const contentVariant = themeVariant === 'v2' ? 'accordion' : themeVariant === 'v3' ? 'summary' : 'tabs'
  const isStudent = user?.role === 'student'
  const requestedCourseId = searchParams.get('course')
  const [course, setCourse] = useState(SAMPLE_COURSE)
  const [units, setUnits] = useState(SAMPLE_UNITS)
  const [isLoading, setIsLoading] = useState(false)
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false)

  const handleLoginRedirect = useCallback(() => {
    window.localStorage.setItem('openclassy_redirect', '/student')
    window.location.assign('/login')
  }, [])

  const handleRoleRedirect = useCallback(() => {
    window.location.assign(user?.role === 'admin' ? '/admin/settings' : '/')
  }, [user?.role])

  useEffect(() => {
    if (authStatus !== 'ready' || !isStudent) {
      return undefined
    }

    let isActive = true

    const loadContent = async () => {
      setIsLoading(true)

      try {
        const { data: coursesResponse } = await apiClient.get('/courses', {
          params: {
            per_page: 50,
          },
        })

        if (!isActive) {
          return
        }

        const availableCourses = Array.isArray(coursesResponse?.data) ? coursesResponse.data : []
        const activeCourse = availableCourses.find((availableCourse) => availableCourse.id === requestedCourseId) ?? availableCourses[0]

        if (!activeCourse?.id) {
          setCourse(SAMPLE_COURSE)
          setUnits([])
          return
        }

        const { data } = await apiClient.get(`/student/courses/${activeCourse.id}/content`)
        if (!isActive) {
          return
        }

        if (data?.course) {
          setCourse({ ...activeCourse, ...data.course })
        }

        if (Array.isArray(data?.units) && data.units.length > 0) {
          setUnits(data.units)
        } else {
          setUnits([])
        }
      } catch {
        // keep sample data if request fails
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadContent()

    return () => {
      isActive = false
    }
  }, [authStatus, isStudent, requestedCourseId])

  if (authStatus === 'loading') {
    return (
      <StudentLayout variant={themeVariant}>
        <section className="student-dashboard">
          <div className="student-dashboard__loading">
            <div className="skeleton" role="status" aria-label="Validando sesion">
              <span className="skeleton__line" />
              <span className="skeleton__line skeleton__line--short" />
            </div>
          </div>
        </section>
      </StudentLayout>
    )
  }

  if (authStatus === 'error') {
    return (
      <StudentLayout variant={themeVariant}>
        <section className="student-dashboard">
          <EmptyState
            title="Error de sesion"
            text="No se pudo validar la sesion actual."
            actionLabel="Reintentar"
            onAction={refreshUser}
            tone="error"
          />
        </section>
      </StudentLayout>
    )
  }

  if (authStatus === 'anonymous') {
    return (
      <StudentLayout variant={themeVariant}>
        <section className="student-dashboard">
          <EmptyState
            title="Acceso restringido"
            text="Necesitas iniciar sesion como estudiante para entrar al aula virtual."
            actionLabel="Iniciar sesion"
            onAction={handleLoginRedirect}
            tone="error"
          />
        </section>
      </StudentLayout>
    )
  }

  if (!isStudent) {
    return (
      <StudentLayout variant={themeVariant}>
        <section className="student-dashboard">
          <EmptyState
            title="Sin permisos"
            text="Tu cuenta no tiene permisos de estudiante."
            actionLabel={user?.role === 'admin' ? 'Ir al panel admin' : 'Ir al inicio'}
            onAction={handleRoleRedirect}
            tone="error"
          />
        </section>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout variant={themeVariant}>
      <section className="student-dashboard">
        <header className="student-dashboard__header">
          <h1 className="student-dashboard__title">{course.title}</h1>
          <button className="student-dashboard__cta" type="button" onClick={() => setIsClassroomModalOpen(true)}>
            <Video size={18} />
            Sala de clase
          </button>
        </header>

        {isLoading && !units.length ? (
          <div className="student-dashboard__loading">
            <div className="skeleton" role="status" aria-label="Cargando">
              <span className="skeleton__line" />
              <span className="skeleton__line skeleton__line--short" />
            </div>
          </div>
        ) : null}

        {!units.length ? (
          <EmptyState title="Sin contenido" text="No hay unidades disponibles." tone="ok" />
        ) : null}

        {units.length ? <CourseContent units={units} variant={contentVariant} /> : null}

        <Modal isOpen={isClassroomModalOpen} onClose={() => setIsClassroomModalOpen(false)} title="Sala de clase">
          {course.meeting_link ? (
            <div className="student-dashboard__classroom">
              <p className="student-dashboard__classroom-text">
                El profesor ya ha configurado la videollamada de este curso. Puedes abrirla en una pestaña nueva.
              </p>
              <a
                href={course.meeting_link}
                target="_blank"
                rel="noreferrer"
                className="button button--primary student-dashboard__classroom-link"
              >
                Entrar a la videollamada
              </a>
            </div>
          ) : (
            <EmptyState
              title="Sala no disponible"
              text="El profesor aún no ha configurado el enlace para este curso"
              tone="ok"
            />
          )}
        </Modal>
      </section>
    </StudentLayout>
  )
}

export default StudentDashboard
