import { useMemo, useState } from 'react'
import { apiClient } from './services/apiClient'

function App() {
  const [uiState, setUiState] = useState('loading')

  const statusText = useMemo(() => {
    if (uiState === 'loading') return 'Cargando datos iniciales...'
    if (uiState === 'empty') return 'Todavia no hay contenido para mostrar.'
    if (uiState === 'error') return 'No se pudo conectar con la API.'
    return 'Frontend inicializado con React + Vite + SASS + Axios.'
  }, [uiState])

  const pingApi = async () => {
    try {
      await apiClient.get('/up')
      setUiState('ready')
    } catch {
      setUiState('error')
    }
  }

  return (
    <main className="app-shell">
      <header className="hero hero--openclassy">
        <p className="hero__kicker">OpenClassy</p>
        <h1 className="hero__title">Frontend SPA</h1>
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
          <div className="empty-state empty-state--ok">
            <h2 className="empty-state__title">Todo listo</h2>
            <p className="empty-state__text">Puedes empezar a construir modulos.</p>
          </div>
        )}
      </section>

      <section className="actions">
        <button type="button" className="button button--primary" onClick={pingApi}>
          Probar API Laravel
        </button>
        <button type="button" className="button" onClick={() => setUiState('empty')}>
          Simular Empty
        </button>
        <button type="button" className="button" onClick={() => setUiState('loading')}>
          Simular Loading
        </button>
      </section>

      <footer className="app-footer">Base inicial alineada con FRONTEND.md</footer>
    </main>
  )
}

export default App
