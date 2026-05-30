import { useEffect, useMemo, useState } from 'react'
import { RefreshCcw, Trash2 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/authContext'
import { useConfig } from '../context/configContext'
import { apiClient } from '../services/apiClient'

const VARIANTS = [
  { id: 'v1', title: 'Tema Orgánico (V1)', description: 'Layout clásico con paleta en tonos tierra.' },
  { id: 'v2', title: 'Tema Institucional (V2)', description: 'Layout dividido con paleta teal.' },
  { id: 'v3', title: 'Tema Neón (V3)', description: 'Layout glassmorphism con acentos azules.' },
]

const initialUserForm = { name: '', email: '', role: 'student', password: 'Password123', phone: '' }
const initialCourseForm = { title: '', teacher_id: '', meeting_link: '', start_date: '2026-06-01', end_date: '2026-07-31', bonus_id: '' }
const initialEnrollmentForm = { student_id: '', course_id: '', status: 'active' }
const initialAssignmentForm = { course_id: '', title: '', unit_name: 'UNIT 1', description: '', due_date: '2026-06-15T12:00' }
const initialBonusForm = { name: '', type: 'monthly', price: '120', description: '' }

const dataItems = (response) => (Array.isArray(response?.data?.data) ? response.data.data : [])
const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? fallback

const AdminSettings = () => {
  const { status: authStatus, isAdmin, logout, refreshUser, user } = useAuth()
  const { uiVariant, status, refreshConfig, updateUiVariant, updating } = useConfig()
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [assignments, setAssignments] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [userForm, setUserForm] = useState(initialUserForm)
  const [courseForm, setCourseForm] = useState(initialCourseForm)
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm)
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm)
  const [bonusForm, setBonusForm] = useState(initialBonusForm)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  const activeVariant = useMemo(() => uiVariant ?? 'v1', [uiVariant])
  const teachers = users.filter((item) => item.role === 'teacher')
  const students = users.filter((item) => item.role === 'student')

  const loadAdminData = async () => {
    setIsLoading(true)
    setFeedback('')

    try {
      const [usersResponse, coursesResponse, enrollmentsResponse, bonusesResponse, assignmentsResponse] = await Promise.all([
        apiClient.get('/users', { params: { per_page: 100 } }),
        apiClient.get('/courses', { params: { per_page: 100 } }),
        apiClient.get('/enrollments', { params: { per_page: 100 } }),
        apiClient.get('/bonuses', { params: { per_page: 100 } }),
        apiClient.get('/assignments', { params: { per_page: 100 } }),
      ])

      setUsers(dataItems(usersResponse))
      setCourses(dataItems(coursesResponse))
      setEnrollments(dataItems(enrollmentsResponse))
      setBonuses(dataItems(bonusesResponse))
      setAssignments(dataItems(assignmentsResponse))
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudieron cargar los datos de administración.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authStatus === 'ready' && isAdmin) {
      Promise.resolve().then(loadAdminData)
    }
  }, [authStatus, isAdmin])

  const updateForm = (setter) => (event) => {
    const { name, value } = event.target
    setter((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const createUser = async (event) => {
    event.preventDefault()
    try {
      const { data } = await apiClient.post('/users', userForm)
      setUsers((currentUsers) => [data, ...currentUsers])
      setUserForm(initialUserForm)
      setFeedback('Usuario creado correctamente.')
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudo crear el usuario.'))
    }
  }

  const createCourse = async (event) => {
    event.preventDefault()
    try {
      const payload = { ...courseForm, bonus_id: courseForm.bonus_id || null, meeting_link: courseForm.meeting_link || null }
      const { data } = await apiClient.post('/courses', payload)
      setCourses((currentCourses) => [data, ...currentCourses])
      setCourseForm(initialCourseForm)
      setFeedback('Curso creado correctamente.')
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudo crear el curso.'))
    }
  }

  const createEnrollment = async (event) => {
    event.preventDefault()
    try {
      const { data } = await apiClient.post('/enrollments', enrollmentForm)
      setEnrollments((currentEnrollments) => [data, ...currentEnrollments.filter((item) => item.id !== data.id)])
      setEnrollmentForm(initialEnrollmentForm)
      setFeedback('Matrícula guardada correctamente.')
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudo guardar la matrícula.'))
    }
  }

  const createAssignment = async (event) => {
    event.preventDefault()
    try {
      const { data } = await apiClient.post('/assignments', assignmentForm)
      setAssignments((currentAssignments) => [data, ...currentAssignments])
      setAssignmentForm(initialAssignmentForm)
      setFeedback('Tarea creada correctamente.')
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudo crear la tarea.'))
    }
  }

  const createBonus = async (event) => {
    event.preventDefault()
    try {
      const { data } = await apiClient.post('/bonuses', { ...bonusForm, price: Number(bonusForm.price) })
      setBonuses((currentBonuses) => [data, ...currentBonuses])
      setBonusForm(initialBonusForm)
      setFeedback('Bono creado correctamente.')
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudo crear el bono.'))
    }
  }

  const deleteResource = async (resource, id, setter, successMessage) => {
    if (!window.confirm('¿Eliminar este registro?')) {
      return
    }

    try {
      await apiClient.delete(`/${resource}/${id}`)
      setter((currentItems) => currentItems.filter((item) => item.id !== id))
      setFeedback(successMessage)
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudo eliminar el registro.'))
    }
  }

  const updateEnrollmentStatus = async (enrollment, statusValue) => {
    try {
      const { data } = await apiClient.put(`/enrollments/${enrollment.id}`, { status: statusValue })
      setEnrollments((currentEnrollments) => currentEnrollments.map((item) => (item.id === data.id ? data : item)))
      setFeedback('Estado de matrícula actualizado.')
    } catch (error) {
      setFeedback(getErrorMessage(error, 'No se pudo actualizar la matrícula.'))
    }
  }

  const handleSelectTheme = async (variantId) => {
    setFeedback('Actualizando configuración...')
    const result = await updateUiVariant(variantId)
    setFeedback(result.ok ? 'Configuración guardada correctamente.' : 'No se pudo guardar el tema.')
  }

  if (authStatus === 'loading' || status === 'loading') {
    return <main className="settings"><section className="settings__panel">Cargando panel...</section></main>
  }

  if (authStatus === 'error') {
    return <main className="settings"><EmptyState title="Error de sesión" text="No se pudo validar la sesión actual." actionLabel="Reintentar" onAction={refreshUser} tone="error" /></main>
  }

  if (!isAdmin) {
    return <main className="settings"><EmptyState title="Sin permisos" text="Tu cuenta no tiene permisos de administrador." actionLabel="Cerrar sesión" onAction={logout} tone="error" /></main>
  }

  if (status === 'error' || status === 'empty') {
    return <main className="settings"><EmptyState title="Sin configuración" text="No hay datos de configuración visual disponibles." actionLabel="Reintentar" onAction={refreshConfig} tone="error" /></main>
  }

  return (
    <main className="settings management">
      <header className="settings__header management__header">
        <div>
          <p className="settings__kicker">Admin dashboard</p>
          <h1 className="settings__title">Gestión de OpenClassy</h1>
          <p className="settings__subtitle">Administra usuarios, cursos, matrículas, tareas, bonos y tema global.</p>
        </div>
        <div className="management__actions">
          <a className="settings__link" href="/login">Ver login</a>
          <button className="management__button management__button--secondary" type="button" onClick={loadAdminData} disabled={isLoading}>
            <RefreshCcw size={16} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      </header>

      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}

      <section className="settings__panel management__section" aria-labelledby="theme-title">
        <div className="management__section-header">
          <h2 className="management__section-title" id="theme-title">Tema global</h2>
        </div>
        <div className="settings__grid">
          {VARIANTS.map((variant) => {
            const isActive = activeVariant === variant.id
            return (
              <button key={variant.id} className={`settings__card ${isActive ? 'settings__card--active' : ''}`} type="button" onClick={() => handleSelectTheme(variant.id)} aria-pressed={isActive} disabled={updating}>
                <span className="settings__card-title">{variant.title}</span>
                <span className="settings__card-text">{variant.description}</span>
                <span className="settings__card-meta">{isActive ? 'Activo' : 'Seleccionar'}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="management__section" aria-labelledby="users-title">
        <div className="management__section-header"><h2 className="management__section-title" id="users-title">Usuarios</h2></div>
        <form className="management__form management__grid" onSubmit={createUser}>
          <label className="management__field"><span>Nombre</span><input name="name" value={userForm.name} onChange={updateForm(setUserForm)} required /></label>
          <label className="management__field"><span>Email</span><input name="email" type="email" value={userForm.email} onChange={updateForm(setUserForm)} required /></label>
          <label className="management__field"><span>Rol</span><select name="role" value={userForm.role} onChange={updateForm(setUserForm)}><option value="student">Alumno</option><option value="teacher">Profesor</option><option value="admin">Admin</option></select></label>
          <label className="management__field"><span>Contraseña</span><input name="password" value={userForm.password} onChange={updateForm(setUserForm)} required /></label>
          <label className="management__field"><span>Teléfono</span><input name="phone" value={userForm.phone} onChange={updateForm(setUserForm)} /></label>
          <button className="management__button management__button--primary" type="submit">Crear usuario</button>
        </form>
        <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Usuario</th><th>Rol</th><th>Contacto</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><p className="management__table-meta">{item.email}</p></td><td>{item.role}</td><td>{item.phone ?? '-'}</td><td><button className="management__button management__button--danger" type="button" disabled={item.id === user?.id} onClick={() => deleteResource('users', item.id, setUsers, 'Usuario eliminado.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
      </section>

      <section className="management__section" aria-labelledby="courses-title">
        <div className="management__section-header"><h2 className="management__section-title" id="courses-title">Cursos</h2></div>
        <form className="management__form management__grid" onSubmit={createCourse}>
          <label className="management__field"><span>Título</span><input name="title" value={courseForm.title} onChange={updateForm(setCourseForm)} required /></label>
          <label className="management__field"><span>Profesor</span><select name="teacher_id" value={courseForm.teacher_id} onChange={updateForm(setCourseForm)} required><option value="">Selecciona profesor</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
          <label className="management__field"><span>Inicio</span><input name="start_date" type="date" value={courseForm.start_date} onChange={updateForm(setCourseForm)} required /></label>
          <label className="management__field"><span>Fin</span><input name="end_date" type="date" value={courseForm.end_date} onChange={updateForm(setCourseForm)} required /></label>
          <label className="management__field"><span>Videollamada</span><input name="meeting_link" type="url" value={courseForm.meeting_link} onChange={updateForm(setCourseForm)} /></label>
          <label className="management__field"><span>Bono</span><select name="bonus_id" value={courseForm.bonus_id} onChange={updateForm(setCourseForm)}><option value="">Sin bono</option>{bonuses.map((bonus) => <option key={bonus.id} value={bonus.id}>{bonus.name}</option>)}</select></label>
          <button className="management__button management__button--primary" type="submit">Crear curso</button>
        </form>
        <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Curso</th><th>Profesor</th><th>Fechas</th><th /></tr></thead><tbody>{courses.map((course) => <tr key={course.id}><td><strong>{course.title}</strong><p className="management__table-meta">{course.meeting_link ?? 'Sin videollamada'}</p></td><td>{course.teacher?.name ?? course.teacher_id}</td><td>{course.start_date?.slice(0, 10)} - {course.end_date?.slice(0, 10)}</td><td><button className="management__button management__button--danger" type="button" onClick={() => deleteResource('courses', course.id, setCourses, 'Curso eliminado.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
      </section>

      <section className="management__section" aria-labelledby="enrollments-title">
        <div className="management__section-header"><h2 className="management__section-title" id="enrollments-title">Matrículas</h2></div>
        <form className="management__form management__grid" onSubmit={createEnrollment}>
          <label className="management__field"><span>Alumno</span><select name="student_id" value={enrollmentForm.student_id} onChange={updateForm(setEnrollmentForm)} required><option value="">Selecciona alumno</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
          <label className="management__field"><span>Curso</span><select name="course_id" value={enrollmentForm.course_id} onChange={updateForm(setEnrollmentForm)} required><option value="">Selecciona curso</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label className="management__field"><span>Estado</span><select name="status" value={enrollmentForm.status} onChange={updateForm(setEnrollmentForm)}><option value="active">Activa</option><option value="inactive">Inactiva</option></select></label>
          <button className="management__button management__button--primary" type="submit">Guardar matrícula</button>
        </form>
        <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Alumno</th><th>Curso</th><th>Estado</th><th /></tr></thead><tbody>{enrollments.map((enrollment) => <tr key={enrollment.id}><td>{enrollment.student?.name ?? enrollment.student_id}</td><td>{enrollment.course?.title ?? enrollment.course_id}</td><td><select value={enrollment.status} onChange={(event) => updateEnrollmentStatus(enrollment, event.target.value)}><option value="active">Activa</option><option value="inactive">Inactiva</option></select></td><td><button className="management__button management__button--danger" type="button" onClick={() => deleteResource('enrollments', enrollment.id, setEnrollments, 'Matrícula eliminada.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
      </section>

      <section className="management__section" aria-labelledby="assignments-title">
        <div className="management__section-header"><h2 className="management__section-title" id="assignments-title">Tareas</h2></div>
        <form className="management__form management__grid" onSubmit={createAssignment}>
          <label className="management__field"><span>Curso</span><select name="course_id" value={assignmentForm.course_id} onChange={updateForm(setAssignmentForm)} required><option value="">Selecciona curso</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label className="management__field"><span>Título</span><input name="title" value={assignmentForm.title} onChange={updateForm(setAssignmentForm)} required /></label>
          <label className="management__field"><span>Unidad</span><input name="unit_name" value={assignmentForm.unit_name} onChange={updateForm(setAssignmentForm)} /></label>
          <label className="management__field"><span>Fecha límite</span><input name="due_date" type="datetime-local" value={assignmentForm.due_date} onChange={updateForm(setAssignmentForm)} /></label>
          <label className="management__field"><span>Descripción</span><textarea name="description" value={assignmentForm.description} onChange={updateForm(setAssignmentForm)} rows="3" /></label>
          <button className="management__button management__button--primary" type="submit">Crear tarea</button>
        </form>
        <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Tarea</th><th>Curso</th><th>Entregas</th><th /></tr></thead><tbody>{assignments.map((assignment) => <tr key={assignment.id}><td><strong>{assignment.title}</strong><p className="management__table-meta">{assignment.unit_name ?? 'Unidad general'} · {assignment.due_date?.slice(0, 16) ?? 'Sin fecha'}</p></td><td>{assignment.course?.title ?? assignment.course_id}</td><td>{assignment.submissions_count ?? 0}</td><td><button className="management__button management__button--danger" type="button" onClick={() => deleteResource('assignments', assignment.id, setAssignments, 'Tarea eliminada.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
      </section>

      <section className="management__section" aria-labelledby="bonuses-title">
        <div className="management__section-header"><h2 className="management__section-title" id="bonuses-title">Bonos</h2></div>
        <form className="management__form management__grid" onSubmit={createBonus}>
          <label className="management__field"><span>Nombre</span><input name="name" value={bonusForm.name} onChange={updateForm(setBonusForm)} required /></label>
          <label className="management__field"><span>Tipo</span><select name="type" value={bonusForm.type} onChange={updateForm(setBonusForm)}><option value="monthly">Mensual</option><option value="pack">Pack</option></select></label>
          <label className="management__field"><span>Precio</span><input name="price" type="number" min="0" value={bonusForm.price} onChange={updateForm(setBonusForm)} required /></label>
          <label className="management__field"><span>Descripción</span><input name="description" value={bonusForm.description} onChange={updateForm(setBonusForm)} /></label>
          <button className="management__button management__button--primary" type="submit">Crear bono</button>
        </form>
        <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Bono</th><th>Tipo</th><th>Precio</th><th /></tr></thead><tbody>{bonuses.map((bonus) => <tr key={bonus.id}><td><strong>{bonus.name}</strong><p className="management__table-meta">{bonus.description ?? '-'}</p></td><td>{bonus.type}</td><td>{bonus.price} €</td><td><button className="management__button management__button--danger" type="button" onClick={() => deleteResource('bonuses', bonus.id, setBonuses, 'Bono eliminado.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
      </section>
    </main>
  )
}

export default AdminSettings