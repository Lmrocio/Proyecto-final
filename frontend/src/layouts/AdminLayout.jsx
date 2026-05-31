import { useCallback, useMemo, useState } from 'react'
import { Bell, BookOpen, CreditCard, GraduationCap, LayoutDashboard, LogOut, Palette, RefreshCcw, Search, Settings, Shield, UserCircle, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Alumnado', icon: Users },
  { to: '/admin/teachers', label: 'Docentes', icon: GraduationCap },
  { to: '/admin/admins', label: 'Administradores', icon: Shield },
  { to: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { to: '/admin/bonuses', label: 'Bonos', icon: CreditCard },
  { to: '/admin/appearance', label: 'Apariencia', icon: Palette },
]

const AdminLayout = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [refreshAction, setRefreshAction] = useState(null)

  const registerRefreshAction = useCallback((action) => {
    setRefreshAction(() => action)
  }, [])

  const outletContext = useMemo(() => ({ registerRefreshAction }), [registerRefreshAction])

  const handleTopbarRefresh = () => {
    refreshAction?.onRefresh?.()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar" aria-label="Navegación de administración">
        <NavLink className="admin-layout__brand" to="/admin" end>
          <Settings size={22} aria-hidden="true" />
          <span>OpenClassy Admin</span>
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
            <strong>{user?.name ?? 'Administrador'}</strong>
          </div>

          <NavLink className={({ isActive }) => (isActive ? 'admin-layout__link admin-layout__link--active' : 'admin-layout__link')} to="/admin/config">
            <Settings size={18} aria-hidden="true" />
            <span>Configuración</span>
          </NavLink>

          <button className="admin-layout__logout" type="button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-layout__main">
        <header className="admin-layout__topbar" aria-label="Herramientas de administración">
          <label className="admin-layout__search">
            <Search size={16} aria-hidden="true" />
            <input className="admin-layout__search-input" type="search" placeholder="Buscar" aria-label="Buscar en administración" />
          </label>

          <button className="admin-layout__icon-button" type="button" aria-label="Notificaciones">
            <Bell size={18} aria-hidden="true" />
          </button>

          <button className="admin-layout__refresh" type="button" onClick={handleTopbarRefresh} disabled={!refreshAction?.onRefresh || refreshAction?.isLoading}>
            <RefreshCcw size={16} aria-hidden="true" />
            {refreshAction?.isLoading ? 'Actualizando' : 'Actualizar'}
          </button>
        </header>

        <Outlet context={outletContext} />
      </main>
    </div>
  )
}

export default AdminLayout