import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginManager from '../components/LoginManager'
import { useConfig } from '../context/configContext'

const ROLE_ROUTES = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
}

const resolveRoleRedirect = (user, requestedRedirect) => {
  const roleRedirect = ROLE_ROUTES[user?.role]

  if (!roleRedirect) {
    return '/'
  }

  return requestedRedirect === roleRedirect ? requestedRedirect : roleRedirect
}

const Login = () => {
  const { uiVariant, status } = useConfig()
  const navigate = useNavigate()
  const variant = uiVariant ?? 'v1'

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign('/')
  }, [])

  const handleSuccess = useCallback((payload) => {
    const redirect = window.localStorage.getItem('openclassy_redirect')

    if (redirect) {
      window.localStorage.removeItem('openclassy_redirect')
    }

    navigate(resolveRoleRedirect(payload?.user, redirect), { replace: true })
  }, [navigate])

  if (status === 'loading' && !uiVariant) {
    return (
      <main className="login login--loading">
        <div className="login__loading-panel">
          <div className="skeleton" role="status" aria-label="Cargando login">
            <span className="skeleton__line login__skeleton-title" />
            <span className="skeleton__line login__skeleton-label" />
            <span className="skeleton__line login__skeleton-input" />
            <span className="skeleton__line login__skeleton-label" />
            <span className="skeleton__line login__skeleton-input" />
            <span className="skeleton__line skeleton__line--short" />
            <span className="skeleton__line login__skeleton-button" />
          </div>
        </div>
      </main>
    )
  }

  return <LoginManager variant={variant} onBack={handleBack} onSuccess={handleSuccess} />
}

export default Login
