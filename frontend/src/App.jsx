import { useCallback, useEffect, useState } from 'react'
import { apiClient } from './services/apiClient'
import EmptyState from './components/EmptyState'
import AdminSettings from './pages/AdminSettings'
import Login from './pages/Login'

function App() {
  const initialPath = typeof window === 'undefined' ? '/' : window.location.pathname
  const [pathname, setPathname] = useState(initialPath)
  const [uiState, setUiState] = useState('loading')
  const [courses, setCourses] = useState([])

  useEffect(() => {
    if (pathname !== '/') {
      return
    }

    const loadDemoData = async () => {
      try {
        const { data } = await apiClient.get('/demo-data')
        const demoCourses = data?.courses ?? []

        setCourses(demoCourses)
        setUiState(demoCourses.length > 0 ? 'ready' : 'empty')
      } catch {
        setUiState('error')
      }
    }

    loadDemoData()
  }, [pathname])

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigate = useCallback(
    (event, nextPath) => {
      event.preventDefault()

      if (nextPath === pathname) {
        return
      }

      window.history.pushState({}, '', nextPath)
      setPathname(nextPath)
    },
    [pathname],
  )

  if (pathname === '/login') {
    return <Login />
  }

  if (pathname === '/admin/settings') {
    return <AdminSettings />
  }

  const statusText =
    uiState === 'loading'
      ? 'Cargando cursos de ejemplo...'
      : uiState === 'empty'
        ? 'Todavia no hay cursos demo para mostrar.'
        : uiState === 'error'
          ? 'No se pudo conectar con la API.'
          : 'Demo tecnica cargada desde Laravel.'

  return (
    <main className="app-shell">
      <nav className="app-nav" aria-label="Principal">
        <a
          className="app-nav__link"
          href="/"
          onClick={(event) => handleNavigate(event, '/')}
        >
          Inicio
        </a>
        <a
          className="app-nav__link"
          href="/login"
          onClick={(event) => handleNavigate(event, '/login')}
        >
          Login
        </a>
        <a
          className="app-nav__link"
          href="/admin/settings"
          onClick={(event) => handleNavigate(event, '/admin/settings')}
        >
          Admin
        </a>
      </nav>
      <header className="hero hero--openclassy">
        <p className="hero__kicker">OpenClassy</p>
        <h1 className="hero__title">Academia de Inglés</h1>
        <p className="hero__subtitle">{statusText}</p>
      </header>

      <section className="state-panel" aria-live="polite">
        {uiState === 'loading' && (
          <div className="skeleton" role="status" aria-label="Cargando">
            <span className="skeleton__line" />
            <span className="skeleton__line skeleton__line--short" />
          </div>
        )}

        {uiState === 'empty' && (
          <EmptyState
            title="Estado vacio"
            text="No se encontraron recursos."
            tone="ok"
          />
        )}

        {uiState === 'error' && (
          <EmptyState
            title="Error de conexion"
            text="Revisa backend y VITE_API_URL."
            tone="error"
          />
        )}

        {uiState === 'ready' && (
          <div className="course-grid">
            {courses.map((course) => (
              <article key={course.id} className="course-card">
                <p className="course-card__eyebrow">Curso demo</p>
                <h2 className="course-card__title">{course.title}</h2>
                <p className="course-card__meta">Profesor: {course.teacher_name ?? 'Sin asignar'}</p>
                <p className="course-card__meta">
                  {course.start_date} - {course.end_date}
                </p>
                {course.meeting_link ? (
                  <a className="course-card__link" href={course.meeting_link} target="_blank" rel="noreferrer">
                    Ver enlace
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="app-footer">Demo técnica conectada con Laravel 11</footer>
    </main>
  )
}

export default App
