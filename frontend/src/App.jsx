import { useEffect, useState } from 'react'
import { apiClient } from './services/apiClient'

function App() {
  const [uiState, setUiState] = useState('loading')
  const [courses, setCourses] = useState([])

  useEffect(() => {
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
  }, [])

  const statusText =
    uiState === 'loading'
      ? 'Cargando cursos de ejemplo...'
      : uiState === 'empty'
        ? 'Todavia no hay cursos demo para mostrar.'
        : uiState === 'error'
          ? 'No se pudo conectar con la API.'
          : 'Demo técnica cargada desde Laravel.'

  return (
    <main className="app-shell">
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
          <div className="empty-state">
            <h2 className="empty-state__title">Estado vacio</h2>
            <p className="empty-state__text">No se encontraron recursos.</p>
          </div>
        )}

        {uiState === 'error' && (
          <div className="empty-state empty-state--error">
            <h2 className="empty-state__title">Error de conexion</h2>
            <p className="empty-state__text">Revisa backend y VITE_API_URL.</p>
          </div>
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
