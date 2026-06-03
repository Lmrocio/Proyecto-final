import { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/authContext'
import { apiClient } from '../../services/apiClient'
import {
  dataItems,
  formatDate,
  getErrorMessage,
  getUserFirstName,
  getUserFullName,
  getUserLastName,
  normalizeSearchText,
  roleLabels,
  updateFormField,
} from './adminPageUtils'

const USER_ROLES = ['student', 'teacher', 'admin']

const buildInitialForm = (role) => ({
  first_name: '',
  last_name: '',
  email: '',
  role,
  password: 'Password123!',
  phone: '',
  course_id: '',
  bonus_id: '',
})

const buildUserPayload = (form, mode) => {
  const payload = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    name: `${form.first_name} ${form.last_name}`.trim(),
    email: form.email,
    role: form.role,
    phone: form.phone || null,
  }

  if (mode === 'create' || form.password.trim()) {
    payload.password = form.password
  }

  return payload
}

const findActiveEnrollment = (userId, enrollments) =>
  enrollments.find((enrollment) => enrollment.student_id === userId && enrollment.status === 'active')

const findStudentCourse = (userId, enrollments, courses) => {
  const enrollment = findActiveEnrollment(userId, enrollments)

  return courses.find((course) => course.id === enrollment?.course_id) ?? enrollment?.course ?? null
}

const getStudentBonus = (userId, enrollments, courses, bonuses) => {
  const course = findStudentCourse(userId, enrollments, courses)

  return bonuses.find((bonus) => bonus.id === course?.bonus_id) ?? course?.bonus ?? null
}

const getTeacherCourses = (teacherId, courses) => courses.filter((course) => course.teacher_id === teacherId)

const RoleUserForm = ({ courses, form, mode, onChange, onSubmit }) => {
  const selectedCourse = courses.find((course) => course.id === form.course_id)

  return (
    <form className="management__form management__grid" onSubmit={onSubmit}>
      <label className="management__field"><span>Rol</span><select name="role" value={form.role} onChange={onChange}>{USER_ROLES.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
      <label className="management__field"><span>Nombre</span><input name="first_name" value={form.first_name} onChange={onChange} required /></label>
      <label className="management__field"><span>Apellidos</span><input name="last_name" value={form.last_name} onChange={onChange} required /></label>
      <label className="management__field"><span>Email</span><input name="email" type="email" value={form.email} onChange={onChange} required /></label>
      <label className="management__field"><span>Teléfono</span><input name="phone" value={form.phone} onChange={onChange} /></label>
      <label className="management__field">
        <span>{mode === 'create' ? 'Contraseña' : 'Nueva contraseña'}</span>
        <input name="password" type="password" autoComplete="new-password" placeholder={mode === 'create' ? undefined : 'Dejar en blanco para mantenerla'} value={form.password} onChange={onChange} required={mode === 'create'} />
      </label>

      {form.role === 'student' ? (
        <>
          <label className="management__field"><span>Curso</span><select name="course_id" value={form.course_id} onChange={onChange}><option value="">Sin matrícula inicial</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label className="management__field"><span>Bono aplicado</span><input value={selectedCourse?.bonus?.name ?? 'Según curso seleccionado'} readOnly /></label>
        </>
      ) : null}

      {form.role === 'teacher' ? (
        <label className="management__field"><span>Curso asignado</span><select name="course_id" value={form.course_id} onChange={onChange}><option value="">Sin asignación inicial</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
      ) : null}

      <button className="management__button management__button--primary" type="submit">{mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}</button>
    </form>
  )
}

const UserRoleManagement = ({ role, title, eyebrow, description, createLabel, emptyText, showHeader = true }) => {
  const { refreshUser, user } = useAuth()
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [form, setForm] = useState(() => buildInitialForm(role))
  const [editingUserId, setEditingUserId] = useState(null)
  const [modalMode, setModalMode] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [usersResponse, coursesResponse, enrollmentsResponse, bonusesResponse] = await Promise.all([
        apiClient.get('/users', { params: { role, per_page: 100 } }),
        apiClient.get('/courses', { params: { per_page: 100 } }),
        apiClient.get('/enrollments', { params: { per_page: 100 } }),
        apiClient.get('/bonuses', { params: { per_page: 100 } }),
      ])

      setUsers(dataItems(usersResponse))
      setCourses(dataItems(coursesResponse))
      setEnrollments(dataItems(enrollmentsResponse))
      setBonuses(dataItems(bonusesResponse))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudieron cargar los usuarios.'))
    } finally {
      setIsLoading(false)
    }
  }, [role])

  useEffect(() => {
    Promise.resolve().then(loadUsers)
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchTerm)

    return users.filter((item) => {
      const studentCourse = role === 'student' ? findStudentCourse(item.id, enrollments, courses) : null
      const teacherCourses = role === 'teacher' ? getTeacherCourses(item.id, courses) : []
      const courseText = role === 'student'
        ? studentCourse?.title ?? ''
        : teacherCourses.map((course) => course.title).join(' ')
      const haystack = normalizeSearchText(`${getUserFullName(item)} ${item.email} ${item.phone ?? ''} ${courseText}`)
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      const matchesCourse = courseFilter === 'all'
        || (role === 'student' && studentCourse?.id === courseFilter)
        || (role === 'teacher' && teacherCourses.some((course) => course.id === courseFilter))

      return matchesSearch && matchesCourse
    })
  }, [courseFilter, courses, enrollments, role, searchTerm, users])

  const courseOptions = useMemo(() => {
    if (role === 'admin') {
      return []
    }

    return role === 'student' || role === 'teacher' ? courses : []
  }, [courses, role])

  const openCreateModal = () => {
    setForm(buildInitialForm(role))
    setEditingUserId(null)
    setModalMode('create')
    setFeedback('')
  }

  const openEditModal = (selectedUser) => {
    const activeEnrollment = findActiveEnrollment(selectedUser.id, enrollments)
    const assignedTeacherCourse = getTeacherCourses(selectedUser.id, courses)[0]

    setForm({
      first_name: getUserFirstName(selectedUser),
      last_name: getUserLastName(selectedUser),
      email: selectedUser.email ?? '',
      role: selectedUser.role ?? role,
      password: '',
      phone: selectedUser.phone ?? '',
      course_id: selectedUser.role === 'student' ? activeEnrollment?.course_id ?? '' : assignedTeacherCourse?.id ?? '',
      bonus_id: '',
    })
    setEditingUserId(selectedUser.id)
    setModalMode('edit')
    setFeedback('')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingUserId(null)
    setForm(buildInitialForm(role))
  }

  const syncRoleSpecificData = async (savedUser) => {
    if (form.role === 'student' && form.course_id) {
      await apiClient.post('/enrollments', {
        student_id: savedUser.id,
        course_id: form.course_id,
        status: 'active',
      })
    }

    if (form.role === 'teacher' && form.course_id) {
      const selectedCourse = courses.find((course) => course.id === form.course_id)
      if (selectedCourse) {
        await apiClient.put(`/courses/${selectedCourse.id}`, {
          title: selectedCourse.title,
          description: selectedCourse.description ?? null,
          teacher_id: savedUser.id,
          meeting_link: selectedCourse.meeting_link ?? null,
          start_date: selectedCourse.start_date?.slice(0, 10),
          end_date: selectedCourse.end_date?.slice(0, 10),
          schedule: selectedCourse.schedule ?? null,
          bonus_id: selectedCourse.bonus_id ?? null,
        })
      }
    }
  }

  const saveUser = async (event) => {
    event.preventDefault()

    try {
      if (modalMode === 'edit' && editingUserId) {
        const { data } = await apiClient.put(`/users/${editingUserId}`, buildUserPayload(form, 'edit'))
        await syncRoleSpecificData(data)
        if (data.id === user?.id) {
          await refreshUser()
        }
        setFeedback('Usuario actualizado correctamente.')
      } else {
        const { data } = await apiClient.post('/users', buildUserPayload(form, 'create'))
        await syncRoleSpecificData(data)
        setFeedback('Usuario creado correctamente.')
      }

      closeModal()
      await loadUsers()
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo guardar el usuario.'))
    }
  }

  const deleteUser = async (selectedUser) => {
    if (!window.confirm('¿Eliminar este usuario?')) {
      return
    }

    try {
      await apiClient.delete(`/users/${selectedUser.id}`)
      setUsers((currentUsers) => currentUsers.filter((item) => item.id !== selectedUser.id))
      setFeedback('Usuario eliminado correctamente.')
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo eliminar el usuario.'))
    }
  }

  return (
    <section className="management management__page" aria-labelledby={`${role}-users-title`}>
      {showHeader ? (
        <header className="management__header">
          <div>
            <p className="management__eyebrow">{eyebrow}</p>
            <h1 className="management__title" id={`${role}-users-title`}>{title}</h1>
            <p className="management__subtitle">{description}</p>
          </div>
        </header>
      ) : null}

      <div className="management__toolbar">
        <label className="management__search">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar usuario" aria-label="Buscar usuario" />
        </label>
        <label className="management__select-filter">
          <Filter size={18} aria-hidden="true" />
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} aria-label="Filtrar usuarios">
            <option value="all">Todos</option>
            {courseOptions.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>
        <button className="management__button management__button--primary" type="button" onClick={openCreateModal}><Plus size={16} aria-hidden="true" />{createLabel}</button>
      </div>

      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      {error ? <p className="management__notice" role="alert">{error}</p> : null}

      <section className="management__section" aria-busy={isLoading}>
        <div className="management__table-wrap">
          <table className="management__table">
            <thead><tr><th>Nombre</th><th>Apellidos</th><th>Email</th><th>Teléfono</th><th>Fecha de alta</th><th>Curso</th>{role === 'student' ? <th>Bono aplicado</th> : null}<th>Acciones</th></tr></thead>
            <tbody>
              {filteredUsers.map((item) => {
                const studentCourse = role === 'student' ? findStudentCourse(item.id, enrollments, courses) : null
                const teacherCourses = role === 'teacher' ? getTeacherCourses(item.id, courses) : []
                const bonus = role === 'student' ? getStudentBonus(item.id, enrollments, courses, bonuses) : null
                const courseLabel = role === 'student'
                  ? studentCourse?.title ?? '-'
                  : role === 'teacher'
                    ? teacherCourses.map((course) => course.title).join(', ') || '-'
                    : '-'

                return (
                  <tr key={item.id}>
                    <td><strong>{getUserFirstName(item) || '-'}</strong></td>
                    <td>{getUserLastName(item) || '-'}</td>
                    <td>{item.email}</td>
                    <td>{item.phone ?? '-'}</td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>{courseLabel}</td>
                    {role === 'student' ? <td>{bonus?.name ?? '-'}</td> : null}
                    <td>
                      <div className="management__row-actions">
                        <button className="management__icon-action" type="button" title="Editar" aria-label={`Editar ${getUserFullName(item)}`} onClick={() => openEditModal(item)}><Pencil size={18} aria-hidden="true" /></button>
                        <button className="management__icon-action management__icon-action--danger" type="button" title="Eliminar" aria-label={`Eliminar ${getUserFullName(item)}`} disabled={item.id === user?.id} onClick={() => deleteUser(item)}><Trash2 size={18} aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredUsers.length === 0 ? <p className="management__empty">{emptyText}</p> : null}
      </section>

      <Modal isOpen={Boolean(modalMode)} onClose={closeModal} title={modalMode === 'edit' ? `Editar ${title.toLowerCase()}` : createLabel}>
        <RoleUserForm courses={courses} form={form} mode={modalMode ?? 'create'} onChange={updateFormField(setForm)} onSubmit={saveUser} />
      </Modal>
    </section>
  )
}

export default UserRoleManagement
