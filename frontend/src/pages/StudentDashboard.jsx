import { useCallback, useEffect, useState } from 'react'
import { Award, ClipboardList, Mail, UserSquare, Video } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiClient } from '../services/apiClient'
import CourseContent from '../components/CourseContent'
import Modal from '../components/Modal'
import StudentLayout from '../layouts/StudentLayout'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import { useAuth } from '../context/authContext'
import { useConfig } from '../context/configContext'

const EMPTY_COURSE = {
  id: null,
  title: '',
  meeting_link: null,
}

const dashboardContentRequests = new Map()

const fetchDashboardContent = (requestedCourseId) => {
  const requestKey = requestedCourseId ?? 'default'

  if (!dashboardContentRequests.has(requestKey)) {
    const request = (async () => {
      const { data: coursesResponse } = await apiClient.get('/courses', {
        params: {
          per_page: 50,
        },
      })

      const availableCourses = Array.isArray(coursesResponse?.data) ? coursesResponse.data : []
      const activeCourse = availableCourses.find((availableCourse) => availableCourse.id === requestedCourseId) ?? availableCourses[0]

      if (!activeCourse?.id) {
        return {
          course: EMPTY_COURSE,
          units: [],
        }
      }

      const { data } = await apiClient.get(`/student/courses/${activeCourse.id}/content`)

      return {
        course: data?.course ? { ...activeCourse, ...data.course } : activeCourse,
        units: Array.isArray(data?.units) ? data.units : [],
      }
    })().finally(() => {
      dashboardContentRequests.delete(requestKey)
    })

    dashboardContentRequests.set(requestKey, request)
  }

  return dashboardContentRequests.get(requestKey)
}

const StudentDashboard = () => {
  const { uiVariant } = useConfig()
  const { status: authStatus, user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const themeVariant = uiVariant ?? 'v1'
  const contentVariant = themeVariant === 'v2' ? 'accordion' : themeVariant === 'v3' ? 'summary' : 'tabs'
  const isStudent = user?.role === 'student'
  const requestedCourseId = searchParams.get('course')
  const [course, setCourse] = useState(EMPTY_COURSE)
  const [units, setUnits] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false)

  const handleLoginRedirect = useCallback(() => {
    window.localStorage.setItem('openclassy_redirect', '/student')
    window.location.assign('/login')
  }, [])

  const handleRoleRedirect = useCallback(() => {
    window.location.assign(user?.role === 'admin' ? '/admin/settings' : user?.role === 'teacher' ? '/teacher' : '/')
  }, [user?.role])

  useEffect(() => {
    if (authStatus !== 'ready' || !isStudent) {
      return undefined
    }

    let isMounted = true

    const loadContent = async () => {
      setIsLoading(true)
      setLoadError(false)

      try {
        const data = await fetchDashboardContent(requestedCourseId)
        if (!isMounted) {
          return
        }

        setCourse(data.course)
        setUnits(data.units)
      } catch {
        if (!isMounted) {
          return
        }
        setLoadError(true)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [authStatus, isStudent, requestedCourseId, reloadKey])

  if (authStatus === 'loading') {
    return (
      <StudentLayout variant={themeVariant}>
        <section className="student-dashboard">
          <div className="student-dashboard__loading">
            <Skeleton variant="card" lines={2} label="Validando sesión" />
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
          <h1 className="student-dashboard__title">{course.title || 'Aula virtual'}</h1>
          <button className="student-dashboard__cta" type="button" onClick={() => setIsClassroomModalOpen(true)}>
            <Video size={18} />
            Sala de clase
          </button>
        </header>

        <nav className="student-dashboard__quick-links" aria-label="Accesos del aula">
          <Link className="student-dashboard__quick-link" to="/student/tasks"><ClipboardList size={17} aria-hidden="true" />Tareas</Link>
          <Link className="student-dashboard__quick-link" to="/student/messages/new"><Mail size={17} aria-hidden="true" />Mensajes</Link>
          <Link className="student-dashboard__quick-link" to="/student/grades"><Award size={17} aria-hidden="true" />Calificaciones</Link>
          <Link className="student-dashboard__quick-link" to="/student/profile"><UserSquare size={17} aria-hidden="true" />Perfil</Link>
        </nav>

        {isLoading && !units.length ? (
          <div className="student-dashboard__loading">
            <Skeleton variant="card" lines={3} label="Cargando contenido" />
          </div>
        ) : null}

        {loadError ? (
          <EmptyState
            title="No se pudo cargar el aula"
            text="Ha ocurrido un error al obtener el contenido del curso. Inténtalo de nuevo."
            actionLabel="Reintentar"
            onAction={() => setReloadKey((key) => key + 1)}
            tone="error"
          />
        ) : null}

        {!loadError && !isLoading && !units.length ? (
          <EmptyState title="Sin contenido" text="No hay unidades disponibles." tone="ok" />
        ) : null}

        {!loadError && units.length ? <CourseContent units={units} variant={contentVariant} /> : null}

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
