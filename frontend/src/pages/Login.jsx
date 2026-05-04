import { useCallback, useMemo } from 'react'
import EmptyState from '../components/EmptyState'
import LoginForm from '../components/LoginForm'
import { useConfig } from '../context/ConfigContext'

const VARIANT_LABELS = {
  v1: '07V01',
  v2: '07V02',
  v3: '07V03',
}

const Login = () => {
  const { status, loginVariant, refreshConfig } = useConfig()
  const variant = loginVariant ?? 'v1'

  const layoutLabel = useMemo(() => VARIANT_LABELS[variant] ?? VARIANT_LABELS.v1, [variant])

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign('/')
  }, [])

  const handleSuccess = useCallback(() => {
    const redirect = window.localStorage.getItem('openclassy_redirect')

    if (redirect) {
      window.localStorage.removeItem('openclassy_redirect')
      window.location.assign(redirect)
      return
    }

    window.location.assign('/')
  }, [])

  if (status === 'loading') {
    return (
      <main className="login" data-variant="v1">
        <div className="login__canvas">
          <div className="login__layout login__layout--loading">
            <div className="login__panel">
              <div className="skeleton" role="status" aria-label="Cargando">
                <span className="skeleton__line" />
                <span className="skeleton__line skeleton__line--short" />
                <span className="skeleton__line" />
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (status === 'error' || status === 'empty') {
    return (
      <main className="login" data-variant="v1">
        <div className="login__canvas">
          <EmptyState
            title="No hay configuracion"
            text="No se pudo cargar el tema visual del login."
            actionLabel="Reintentar"
            onAction={refreshConfig}
            tone="error"
          />
        </div>
      </main>
    )
  }

  return (
    <main className="login" data-variant={variant}>
      <div className="login__canvas">
        <header className="login__header">
          {variant !== 'v2' ? (
            <button className="login__back" type="button" onClick={handleBack}>
              Volver
            </button>
          ) : null}
          <div className="login__intro">
            <p className="login__eyebrow">Panel academico</p>
            <h1 className="login__title">Acceso OpenClassy</h1>
            <p className="login__subtitle">Gestiona usuarios, clases y mensajes en segundos.</p>
          </div>
        </header>

        <div className="login__layout">
          {variant === 'v2' ? <div className="login__visual" aria-hidden="true" /> : null}
          <section className="login__panel" aria-labelledby="login-title">
            {variant === 'v2' ? (
              <button className="login__back login__back--inline" type="button" onClick={handleBack}>
                Volver
              </button>
            ) : null}
            <LoginForm onSuccess={handleSuccess} />
          </section>
        </div>

        <footer className="login__footer">
          <span className="login__brand">Openclassy</span>
          <nav className="login__footer-links" aria-label="Politicas">
            <a className="login__footer-link" href="/privacy">
              Privacidad
            </a>
            <a className="login__footer-link" href="/terms">
              Terminos
            </a>
            <a className="login__footer-link" href="/cookies">
              Cookies
            </a>
          </nav>
          <span className="login__variant">Layout {layoutLabel}</span>
        </footer>
      </div>
    </main>
  )
}

export default Login
