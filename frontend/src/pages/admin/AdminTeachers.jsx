import UserRoleManagement from './UserRoleManagement'

const AdminTeachers = () => (
  <UserRoleManagement
    role="teacher"
    title="Docentes"
    eyebrow="Usuarios"
    description="Gestiona las cuentas de profesores responsables de los grupos."
    createLabel="Nuevo docente"
    emptyText="No hay docentes registrados."
  />
)

export default AdminTeachers