import { useCallback, useMemo } from 'react'
import { BookOpen, Globe, LayoutDashboard, LogOut, Mail, UserCircle, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { to: '/admin/portal', label: 'Portal web', icon: Globe },
  { to: '/admin/messages', label: 'Mensajes', icon: Mail },
]

const AdminLayout = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const registerRefreshAction = useCallback(() => {}, [])

  const outletContext = useMemo(() => ({ registerRefreshAction }), [registerRefreshAction])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar" aria-label="Navegación de administración">
        <NavLink className="admin-layout__brand" to="/admin" end>
          <span>OpenClassy</span>
        </NavLink>

        <nav className="admin-layout__nav">
          {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} className={({ isActive }) => (isActive ? 'admin-layout__link admin-layout__link--active' : 'admin-layout__link')} to={to} end={end}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-layout__sidebar-footer">
          <div className="admin-layout__profile">
            <span className="admin-layout__profile-icon" aria-hidden="true"><UserCircle size={20} /></span>
            <div>
              <strong>{user?.name ?? 'Administrador'}</strong>
              <span>Ver perfil</span>
            </div>
          </div>

          <button className="admin-layout__logout" type="button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-layout__main">
        <Outlet context={outletContext} />
      </main>
    </div>
  )
}

export default AdminLayout