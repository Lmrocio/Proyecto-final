import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PROFILE_LINKS = [
  { id: 'profile', label: 'Perfil', to: '/student/profile' },
  { id: 'profile-settings', label: 'Ajustes del perfil', to: '/student/profile/settings' },
  { id: 'accessibility', label: 'Accesibilidad', to: '/student/profile/accessibility' },
  { id: 'privacy', label: 'Privacidad', to: '/student/profile/privacy' },
  { id: 'security', label: 'Seguridad', to: '/student/profile/security' },
  { id: 'grades', label: 'Calificaciones', to: '/student/profile/grades' },
]

const ProfileDropdown = ({ onNavigate }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isClosingSession, setIsClosingSession] = useState(false)

  const handleLogout = async () => {
    setIsClosingSession(true)

    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <section className="dropdown-panel dropdown-panel--profile" aria-label="Opciones del perfil">
      <header className="dropdown-panel__profile-header">
        <p className="dropdown-panel__eyebrow">Sesión activa</p>
        <strong className="dropdown-panel__profile-name">{user?.name ?? 'Alumno OpenClassy'}</strong>
        <span className="dropdown-panel__profile-meta">{user?.email ?? 'Sin correo disponible'}</span>
      </header>

      <nav className="dropdown-panel__nav" aria-label="Acciones del perfil">
        {PROFILE_LINKS.map((item) => (
          <Link
            key={item.id}
            className="dropdown-panel__nav-link dropdown-panel__nav-link--simple"
            to={item.to}
            onClick={onNavigate}
          >
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          className="dropdown-panel__nav-link dropdown-panel__nav-link--simple dropdown-panel__nav-link--danger"
          type="button"
          onClick={handleLogout}
          disabled={isClosingSession}
        >
          <span>{isClosingSession ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
        </button>
      </nav>
    </section>
  )
}

export default ProfileDropdown