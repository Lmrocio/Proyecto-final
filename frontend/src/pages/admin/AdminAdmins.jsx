import UserRoleManagement from './UserRoleManagement'

const AdminAdmins = () => (
  <UserRoleManagement
    role="admin"
    title="Administradores"
    eyebrow="Usuarios"
    description="Gestiona las cuentas con permisos completos de administración."
    createLabel="Nuevo administrador"
    emptyText="No hay administradores registrados."
  />
)

export default AdminAdmins