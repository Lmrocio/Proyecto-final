import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import EmptyState from './EmptyState'

const ROLE_HOME = {
  admin: '/admin/settings',
  teacher: '/teacher',
  student: '/student',
}

const guardStyle = {
  minHeight: '60vh',
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
}

const ProtectedRoute = ({ roles }) => {
  const { status, user, refreshUser } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main style={guardStyle} aria-busy="true">
        <div className="skeleton" role="status" aria-label="Validando sesión">
          <span className="skeleton__line" />
          <span className="skeleton__line skeleton__line--short" />
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main style={guardStyle}>
        <EmptyState
          title="Error de sesión"
          text="No se pudo validar tu sesión. Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={refreshUser}
          tone="error"
        />
      </main>
    )
  }

  if (status === 'anonymous' || !user) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('openclassy_redirect', location.pathname)
    }

    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
