import { useMemo, useState } from 'react'
import UserRoleManagement from './UserRoleManagement'

const USER_TABS = [
  {
    role: 'student',
    label: 'Alumnado',
    createLabel: 'Añadir usuario',
    emptyText: 'No hay alumnos registrados.',
    description: 'Gestiona las cuentas de alumnos y sus datos académicos.',
  },
  {
    role: 'teacher',
    label: 'Docentes',
    createLabel: 'Añadir usuario',
    emptyText: 'No hay docentes registrados.',
    description: 'Gestiona las cuentas de profesores responsables de los grupos.',
  },
  {
    role: 'admin',
    label: 'Administradores',
    createLabel: 'Añadir usuario',
    emptyText: 'No hay administradores registrados.',
    description: 'Gestiona las cuentas con permisos completos de administración.',
  },
]

const AdminUsers = ({ initialRole = 'student' }) => {
  const [activeRole, setActiveRole] = useState(initialRole)
  const activeTab = useMemo(
    () => USER_TABS.find((tab) => tab.role === activeRole) ?? USER_TABS[0],
    [activeRole],
  )

  return (
    <section className="admin-users" aria-labelledby="admin-users-title">
      <h1 className="u-visually-hidden" id="admin-users-title">Usuarios</h1>
      <div className="management__tabs management__tabs--large" role="tablist" aria-label="Gestión de usuarios">
        {USER_TABS.map((tab) => (
          <button
            key={tab.role}
            className={activeRole === tab.role ? 'management__tab management__tab--active' : 'management__tab'}
            type="button"
            role="tab"
            aria-selected={activeRole === tab.role}
            onClick={() => setActiveRole(tab.role)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <UserRoleManagement
        key={activeRole}
        role={activeTab.role}
        title={activeTab.label}
        eyebrow="Usuarios"
        description={activeTab.description}
        createLabel={activeTab.createLabel}
        emptyText={activeTab.emptyText}
        showHeader={false}
      />
    </section>
  )
}

export default AdminUsers
