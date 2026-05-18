import { useCallback, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/authContext'
import { useConfig } from '../context/configContext'
import { getStoredToken } from '../services/apiClient'

const VARIANTS = [
  {
    id: 'v1',
    title: 'Tema Orgánico (V1)',
    description: 'Layout clásico con paleta en tonos tierra.',
  },
  {
    id: 'v2',
    title: 'Tema Institucional (V2)',
    description: 'Layout dividido con paleta teal.',
  },
  {
    id: 'v3',
    title: 'Tema Neón (V3)',
    description: 'Layout glassmorphism con acentos azules.',
  },
]

const AdminSettings = () => {
  const { status: authStatus, isAdmin, logout, refreshUser } = useAuth()
  const { uiVariant, status, refreshConfig, updateUiVariant, updating } = useConfig()
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [updateMessage, setUpdateMessage] = useState('')

  const activeVariant = useMemo(() => uiVariant ?? 'v1', [uiVariant])

  const handleLoginRedirect = useCallback(() => {
    window.localStorage.setItem('openclassy_redirect', '/admin/settings')
    window.location.assign('/login')
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    window.location.assign('/login')
  }, [logout])

  const handleSelect = useCallback(
    async (variantId) => {
      if (!getStoredToken()) {
        setUpdateStatus('error')
        setUpdateMessage('Necesitas iniciar sesion como admin para guardar cambios.')
        return
      }

      setUpdateStatus('loading')
      setUpdateMessage('Actualizando configuracion...')

      const result = await updateUiVariant(variantId)

      if (result.ok) {
        setUpdateStatus('success')
        setUpdateMessage('Configuracion guardada correctamente.')
        return
      }

      setUpdateStatus('error')
      if (result.reason === 'unauthorized' || result.reason === 'forbidden') {
        setUpdateMessage('Necesitas iniciar sesion como admin para guardar cambios.')
        return
      }

      if (result.status && result.status >= 500) {
        setUpdateMessage('Error del servidor. Reintenta en unos segundos.')
        return
      }

      setUpdateMessage('No se pudo guardar. Revisa tu sesion de admin.')
    },
    [updateUiVariant],
  )

  if (authStatus === 'loading') {
    return (
      <main className="settings">
        <div className="settings__panel">
          <div className="skeleton" role="status" aria-label="Cargando">
            <span className="skeleton__line" />
            <span className="skeleton__line skeleton__line--short" />
          </div>
        </div>
      </main>
    )
  }

  if (authStatus === 'error') {
    return (
      <main className="settings">
        <EmptyState
          title="Error de sesion"
          text="No se pudo validar la sesion actual."
          actionLabel="Reintentar"
          onAction={refreshUser}
          tone="error"
        />
      </main>
    )
  }

  if (authStatus === 'anonymous') {
    return (
      <main className="settings">
        <EmptyState
          title="Acceso restringido"
          text="Necesitas iniciar sesion como admin para configurar el tema global."
          actionLabel="Iniciar sesion"
          onAction={handleLoginRedirect}
          tone="error"
        />
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="settings">
        <EmptyState
          title="Sin permisos"
          text="Tu cuenta no tiene permisos de administrador."
          actionLabel="Cerrar sesion"
          onAction={handleLogout}
          tone="error"
        />
      </main>
    )
  }

  if (status === 'loading') {
    return (
      <main className="settings">
        <div className="settings__panel">
          <div className="skeleton" role="status" aria-label="Cargando">
            <span className="skeleton__line" />
            <span className="skeleton__line skeleton__line--short" />
          </div>
        </div>
      </main>
    )
  }

  if (status === 'error' || status === 'empty') {
    return (
      <main className="settings">
        <EmptyState
          title="Sin configuracion"
          text="No hay datos de configuracion visual disponibles."
          actionLabel="Reintentar"
          onAction={refreshConfig}
          tone="error"
        />
      </main>
    )
  }

  return (
    <main className="settings">
      <header className="settings__header">
        <div>
          <p className="settings__kicker">Admin dashboard</p>
          <h1 className="settings__title">Configuracion visual</h1>
          <p className="settings__subtitle">Cambia el tema global (Login y Aula Virtual).</p>
        </div>
        <a className="settings__link" href="/login">
          Ver login
        </a>
      </header>

      <section className="settings__panel" aria-live="polite">
        <div className="settings__grid">
          {VARIANTS.map((variant) => {
            const isActive = activeVariant === variant.id

            return (
              <button
                key={variant.id}
                className={`settings__card ${isActive ? 'settings__card--active' : ''}`}
                type="button"
                onClick={() => handleSelect(variant.id)}
                aria-pressed={isActive}
                disabled={updating}
              >
                <span className="settings__card-title">{variant.title}</span>
                <span className="settings__card-text">{variant.description}</span>
                <span className="settings__card-meta">
                  {isActive ? 'Activo' : 'Seleccionar'}
                </span>
              </button>
            )
          })}
        </div>

        {updateStatus !== 'idle' ? (
          <div
            className={`settings__status ${
              updateStatus === 'error' ? 'settings__status--error' : 'settings__status--ok'
            }`}
            role={updateStatus === 'error' ? 'alert' : 'status'}
          >
            {updateMessage}
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default AdminSettings
