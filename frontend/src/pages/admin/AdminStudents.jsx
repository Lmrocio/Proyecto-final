import UserRoleManagement from './UserRoleManagement'

const AdminStudents = () => (
  <UserRoleManagement
    role="student"
    title="Alumnado"
    eyebrow="Usuarios"
    description="Gestiona las cuentas de alumnos y sus datos de acceso."
    createLabel="Nuevo alumno"
    emptyText="No hay alumnos registrados."
  />
)

export default AdminStudents