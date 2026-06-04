import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CirclePlus, MoreVertical, Search, Settings2 } from 'lucide-react'
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
const PAGE_SIZE = 14
const BULK_STATUS_OPTIONS = [
  { value: '', label: 'Mantener estado' },
  { value: 'active', label: 'Marcar usuarios como activos' },
  { value: 'inactive', label: 'Marcar usuarios como inactivos' },
]

const buildInitialForm = (role) => ({
  first_name: '',
  last_name: '',
  email: '',
  role,
  password: 'Password123!',
  phone: '',
  is_active: true,
  course_id: '',
  bonus_id: '',
})

const buildInitialBulkForm = () => ({
  course_id: '',
  status: '',
})

const settledDataItems = (result) => (result.status === 'fulfilled' ? dataItems(result.value) : [])

const isUserActive = (selectedUser) => selectedUser?.is_active ?? true

const normalizeBooleanValue = (value) => value === true || value === 'true'

const buildUserPayload = (form, mode) => {
  const payload = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    name: `${form.first_name} ${form.last_name}`.trim(),
    email: form.email,
    role: form.role,
    is_active: normalizeBooleanValue(form.is_active),
    phone: form.phone || null,
  }

  if (mode === 'create' || form.password.trim()) {
    payload.password = form.password
  }

  return payload
}

const findActiveEnrollment = (userId, enrollments) =>
  enrollments.find((enrollment) => enrollment.student_id === userId && enrollment.status === 'active')

const findStudentEnrollment = (userId, enrollments) =>
  findActiveEnrollment(userId, enrollments) ?? enrollments.find((enrollment) => enrollment.student_id === userId) ?? null

const findStudentCourse = (userId, enrollments, courses) => {
  const enrollment = findStudentEnrollment(userId, enrollments)

  return courses.find((course) => course.id === enrollment?.course_id) ?? enrollment?.course ?? null
}

const getStudentBonus = (userId, enrollments, courses, bonuses) => {
  const course = findStudentCourse(userId, enrollments, courses)

  return bonuses.find((bonus) => bonus.id === course?.bonus_id) ?? course?.bonus ?? null
}

const getTeacherCourses = (teacherId, courses) => courses.filter((course) => course.teacher_id === teacherId)

const getVisiblePages = (totalPages, currentPage) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 'ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages]
}

const RoleUserForm = ({ courses, form, mode, onChange, onSubmit }) => {
  const selectedCourse = courses.find((course) => course.id === form.course_id)

  return (
    <form className="management__form management__grid" onSubmit={onSubmit}>
      <label className="management__field"><span>Rol</span><select name="role" value={form.role} onChange={onChange}>{USER_ROLES.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
      <label className="management__field"><span>Nombre</span><input name="first_name" value={form.first_name} onChange={onChange} required /></label>
      <label className="management__field"><span>Apellidos</span><input name="last_name" value={form.last_name} onChange={onChange} required /></label>
      <label className="management__field"><span>Email</span><input name="email" type="email" value={form.email} onChange={onChange} required /></label>
      <label className="management__field"><span>Teléfono</span><input name="phone" value={form.phone} onChange={onChange} /></label>
      <label className="management__field"><span>Estado</span><select name="is_active" value={String(normalizeBooleanValue(form.is_active))} onChange={onChange}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
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
  const loadRequestIdRef = useRef(0)
  const loadAbortControllerRef = useRef(null)
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [form, setForm] = useState(() => buildInitialForm(role))
  const [editingUserId, setEditingUserId] = useState(null)
  const [modalMode, setModalMode] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkModal, setBulkModal] = useState(null)
  const [bulkForm, setBulkForm] = useState(buildInitialBulkForm)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [activeMenuUserId, setActiveMenuUserId] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const loadUsers = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    const abortController = new AbortController()

    loadRequestIdRef.current = requestId
    loadAbortControllerRef.current?.abort()
    loadAbortControllerRef.current = abortController
    setIsLoading(true)
    setError('')

    try {
      const [usersResponse, coursesResponse, enrollmentsResponse, bonusesResponse] = await Promise.allSettled([
        apiClient.get('/users', { params: { role, per_page: 100 }, signal: abortController.signal }),
        apiClient.get('/courses', { params: { per_page: 100 }, signal: abortController.signal }),
        apiClient.get('/enrollments', { params: { per_page: 100 }, signal: abortController.signal }),
        apiClient.get('/bonuses', { params: { per_page: 100 }, signal: abortController.signal }),
      ])

      if (usersResponse.status === 'rejected') {
        throw usersResponse.reason
      }

      if (requestId !== loadRequestIdRef.current) {
        return
      }

      setUsers(dataItems(usersResponse.value))
      setCourses(settledDataItems(coursesResponse))
      setEnrollments(settledDataItems(enrollmentsResponse))
      setBonuses(settledDataItems(bonusesResponse))
      setSelectedUsers([])
      setError('')
    } catch (requestError) {
      if (requestId !== loadRequestIdRef.current) {
        return
      }

      if (requestError?.code === 'ERR_CANCELED') {
        return
      }

      setError(getErrorMessage(requestError, 'No se pudieron cargar los usuarios.'))
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false)
        loadAbortControllerRef.current = null
      }
    }
  }, [role])

  useEffect(() => {
    Promise.resolve().then(loadUsers)
  }, [loadUsers])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setToast(''), 3200)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const visiblePages = getVisiblePages(totalPages, currentPage)

  const courseOptions = useMemo(() => {
    if (role === 'admin') {
      return []
    }

    return role === 'student' || role === 'teacher' ? courses : []
  }, [courses, role])

  const selectedStudentUsers = useMemo(
    () => users.filter((item) => selectedUsers.includes(item.id)),
    [selectedUsers, users],
  )

  const openCreateModal = () => {
    setForm(buildInitialForm(role))
    setEditingUserId(null)
    setModalMode('create')
    setToast('')
  }

  const openEditModal = async (selectedUser) => {
    setToast('')

    try {
      const { data } = await apiClient.get(`/users/${selectedUser.id}`)
      const activeEnrollment = findActiveEnrollment(data.id, enrollments) ?? findStudentEnrollment(data.id, enrollments)
      const assignedTeacherCourse = getTeacherCourses(data.id, courses)[0]

      setForm({
        first_name: getUserFirstName(data),
        last_name: getUserLastName(data),
        email: data.email ?? '',
        role: data.role ?? role,
        password: '',
        phone: data.phone ?? '',
        is_active: isUserActive(data),
        course_id: data.role === 'student' ? activeEnrollment?.course_id ?? '' : assignedTeacherCourse?.id ?? '',
        bonus_id: '',
      })
      setEditingUserId(data.id)
      setModalMode('edit')
    } catch (requestError) {
      setToast(getErrorMessage(requestError, 'No se pudieron cargar los datos del usuario.'))
    }
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingUserId(null)
    setForm(buildInitialForm(role))
  }

  const closeBulkModal = () => {
    setBulkModal(null)
    setBulkForm(buildInitialBulkForm())
  }

  const showToast = (message) => {
    setToast(message)
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
          showToast(data.role === 'student' ? 'Alumno actualizado correctamente' : 'Usuario actualizado correctamente.')
      } else {
        const { data } = await apiClient.post('/users', buildUserPayload(form, 'create'))
        await syncRoleSpecificData(data)
          showToast('Usuario creado correctamente.')
      }

      closeModal()
      await loadUsers()
    } catch (requestError) {
        showToast(getErrorMessage(requestError, 'No se pudo guardar el usuario.'))
    }
  }

    const confirmDeleteUser = async () => {
      if (!deleteTarget) {
        return
      }

    try {
        await apiClient.delete(`/users/${deleteTarget.id}`)
        setUsers((currentUsers) => currentUsers.filter((item) => item.id !== deleteTarget.id))
        setSelectedUsers((currentSelection) => currentSelection.filter((id) => id !== deleteTarget.id))
        showToast(role === 'student' ? 'Alumno eliminado correctamente.' : 'Usuario eliminado correctamente.')
        setDeleteTarget(null)
    } catch (requestError) {
        showToast(getErrorMessage(requestError, 'No se pudo eliminar el usuario.'))
      }
    }

    const confirmBulkDelete = async () => {
      const usersToDelete = selectedStudentUsers.filter((item) => item.id !== user?.id)

      try {
        await Promise.all(usersToDelete.map((item) => apiClient.delete(`/users/${item.id}`)))
        setUsers((currentUsers) => currentUsers.filter((item) => !usersToDelete.some((deletedUser) => deletedUser.id === item.id)))
        setSelectedUsers([])
        closeBulkModal()
        showToast(`${usersToDelete.length} alumnos eliminados`)
      } catch (requestError) {
        showToast(getErrorMessage(requestError, 'No se pudieron eliminar los alumnos seleccionados.'))
      }
    }

    const updateEnrollmentStatus = async (selectedUser, status, courseId = '') => {
      const currentEnrollment = findStudentEnrollment(selectedUser.id, enrollments)
      const targetCourseId = courseId || currentEnrollment?.course_id

      if (!targetCourseId) {
        return null
      }

      if (courseId) {
        const { data } = await apiClient.post('/enrollments', {
          student_id: selectedUser.id,
          course_id: courseId,
          status: status || currentEnrollment?.status || 'active',
        })

        return data
      }

      if (currentEnrollment && status) {
        const { data } = await apiClient.put(`/enrollments/${currentEnrollment.id}`, { status })

        return data
      }

      return null
    }

    const toggleUserActive = async (selectedUser, isActive) => {
      try {
        const { data } = await apiClient.put(`/users/${selectedUser.id}`, { is_active: isActive })
        setUsers((currentUsers) => currentUsers.map((item) => (item.id === selectedUser.id ? { ...item, is_active: data.is_active } : item)))
        await loadUsers()
        showToast(isActive ? 'Usuario marcado como activo.' : 'Usuario marcado como inactivo.')
      } catch (requestError) {
        showToast(getErrorMessage(requestError, 'No se pudo cambiar el estado del usuario.'))
      }
    }

    const applyBulkChanges = async (event) => {
      event.preventDefault()

      try {
        await Promise.all(selectedStudentUsers.map(async (item) => {
          await updateEnrollmentStatus(item, '', bulkForm.course_id)

          if (bulkForm.status) {
            await apiClient.put(`/users/${item.id}`, { is_active: bulkForm.status === 'active' })
          }
        }))
        closeBulkModal()
        setSelectedUsers([])
        await loadUsers()
        showToast(`${selectedStudentUsers.length} alumnos actualizados`)
      } catch (requestError) {
        showToast(getErrorMessage(requestError, 'No se pudieron actualizar los alumnos seleccionados.'))
    }
  }

    const goToPage = (nextPage) => {
      setPage(Math.min(Math.max(nextPage, 1), totalPages))
    }

    const updateSearchTerm = (event) => {
      setSearchTerm(event.target.value)
      setPage(1)
    }

    const updateCourseFilter = (event) => {
      setCourseFilter(event.target.value)
      setPage(1)
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
          <input type="search" value={searchTerm} onChange={updateSearchTerm} placeholder="Buscar usuario" aria-label="Buscar usuario" />
        </label>
        <button className="management__filter-button" type="button" onClick={() => setShowFilters((isVisible) => !isVisible)} aria-label="Filtros avanzados" title="Filtros avanzados"><Settings2 size={18} aria-hidden="true" /></button>
        <button className="management__button management__button--primary" type="button" onClick={openCreateModal}><CirclePlus size={18} aria-hidden="true" />{createLabel}</button>
      </div>

      {showFilters ? (
        <div className="management__filters-panel">
          <label className="management__select-filter">
            <span>Curso</span>
            <select value={courseFilter} onChange={updateCourseFilter} aria-label="Filtrar usuarios por curso">
              <option value="all">Todos</option>
              {courseOptions.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      <div className={selectedUsers.length > 0 ? 'management__bulk-bar management__bulk-bar--visible' : 'management__bulk-bar'} aria-hidden={selectedUsers.length === 0}>
        <strong>{selectedUsers.length} seleccionados</strong>
        <div className="management__bulk-actions">
          <button className="management__button management__button--secondary" type="button" onClick={() => setBulkModal('update')}>Cambiar curso/estado</button>
          <button className="management__button management__button--danger" type="button" onClick={() => setBulkModal('delete')}>Eliminar múltiples</button>
        </div>
      </div>

      {toast ? <p className="management__toast" role="status">{toast}</p> : null}
      {error ? <p className="management__notice" role="alert">{error}</p> : null}

      <section className="management__section" aria-busy={isLoading}>
        <div className="management__table-wrap">
          <table className={role === 'student' ? 'management__table management__table--students' : 'management__table'}>
            {role === 'student' ? (
              <thead><tr><th>Nombre</th><th>Apellidos</th><th>Fecha de alta</th><th>Curso actual</th><th>Bono aplicado</th><th>Activo</th><th aria-label="Acciones" /></tr></thead>
            ) : (
              <thead><tr><th>Nombre</th><th>Apellidos</th><th>Email</th><th>Fecha de alta</th><th>Activo</th><th aria-label="Acciones" /></tr></thead>
            )}
            <tbody>
              {paginatedUsers.map((item) => {
                const studentCourse = role === 'student' ? findStudentCourse(item.id, enrollments, courses) : null
                const bonus = role === 'student' ? getStudentBonus(item.id, enrollments, courses, bonuses) : null
                const courseLabel = studentCourse?.title ?? 'Sin asignar'
                const userIsActive = isUserActive(item)
                const canToggleActive = item.id !== user?.id

                return (
                  role === 'student' ? (
                    <tr key={item.id}>
                      <td><strong>{getUserFirstName(item) || '-'}</strong></td>
                      <td>{getUserLastName(item) || '-'}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td><span className={studentCourse ? undefined : 'management__muted'}>{courseLabel}</span></td>
                      <td>{bonus?.name ?? 'Sin bono aplicado'}</td>
                      <td>
                        <label className="management__switch" title={canToggleActive ? 'Cambiar estado del usuario' : 'No puedes desactivar tu propia cuenta'}>
                          <input type="checkbox" checked={userIsActive} disabled={!canToggleActive} onChange={(event) => toggleUserActive(item, event.target.checked)} aria-label={`Cambiar estado de ${getUserFullName(item)}`} />
                          <span />
                        </label>
                      </td>
                      <td>
                        <div className="management__row-menu">
                          <button className="management__menu-trigger" type="button" aria-label={`Abrir acciones de ${getUserFullName(item)}`} aria-expanded={activeMenuUserId === item.id} onClick={() => setActiveMenuUserId((currentId) => (currentId === item.id ? null : item.id))}><MoreVertical size={18} aria-hidden="true" /></button>
                          {activeMenuUserId === item.id ? (
                            <div className="management__actions-menu" role="menu">
                              <button type="button" role="menuitem" onClick={() => { setDetailTarget(item); setActiveMenuUserId(null) }}>Ver más</button>
                              <button type="button" role="menuitem" onClick={() => { openEditModal(item); setActiveMenuUserId(null) }}>Editar</button>
                              <button className="management__actions-menu-danger" type="button" role="menuitem" disabled={item.id === user?.id} onClick={() => { setDeleteTarget(item); setActiveMenuUserId(null) }}>Eliminar</button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id}>
                      <td><strong>{getUserFirstName(item) || '-'}</strong></td>
                      <td>{getUserLastName(item) || '-'}</td>
                      <td>{item.email}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <label className="management__switch" title={canToggleActive ? 'Cambiar estado del usuario' : 'No puedes desactivar tu propia cuenta'}>
                          <input type="checkbox" checked={userIsActive} disabled={!canToggleActive} onChange={(event) => toggleUserActive(item, event.target.checked)} aria-label={`Cambiar estado de ${getUserFullName(item)}`} />
                          <span />
                        </label>
                      </td>
                      <td>
                        <div className="management__row-menu">
                          <button className="management__menu-trigger" type="button" aria-label={`Abrir acciones de ${getUserFullName(item)}`} aria-expanded={activeMenuUserId === item.id} onClick={() => setActiveMenuUserId((currentId) => (currentId === item.id ? null : item.id))}><MoreVertical size={18} aria-hidden="true" /></button>
                          {activeMenuUserId === item.id ? (
                            <div className="management__actions-menu" role="menu">
                              <button type="button" role="menuitem" onClick={() => { setDetailTarget(item); setActiveMenuUserId(null) }}>Ver más</button>
                              <button type="button" role="menuitem" onClick={() => { openEditModal(item); setActiveMenuUserId(null) }}>Editar</button>
                              <button className="management__actions-menu-danger" type="button" role="menuitem" disabled={item.id === user?.id} onClick={() => { setDeleteTarget(item); setActiveMenuUserId(null) }}>Eliminar</button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                )
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredUsers.length > PAGE_SIZE ? (
          <nav className="management__pagination" aria-label="Paginación de usuarios">
            <button className="management__page-control" type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} aria-label="Página anterior"><ChevronLeft size={16} aria-hidden="true" /></button>
            {visiblePages.map((pageItem) => (
              typeof pageItem === 'number' ? (
                <button key={pageItem} className={pageItem === currentPage ? 'management__page management__page--active' : 'management__page'} type="button" onClick={() => goToPage(pageItem)} aria-current={pageItem === currentPage ? 'page' : undefined}>{pageItem}</button>
              ) : <span key={pageItem} className="management__pagination-ellipsis">...</span>
            ))}
            <button className="management__page-control" type="button" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} aria-label="Página siguiente"><ChevronRight size={16} aria-hidden="true" /></button>
          </nav>
        ) : null}
        {!isLoading && filteredUsers.length === 0 ? <p className="management__empty">{emptyText}</p> : null}
      </section>

      <Modal isOpen={Boolean(modalMode)} onClose={closeModal} title={modalMode === 'edit' ? `Editar ${title.toLowerCase()}` : createLabel}>
        <RoleUserForm courses={courses} form={form} mode={modalMode ?? 'create'} onChange={updateFormField(setForm)} onSubmit={saveUser} />
      </Modal>

      <Modal isOpen={Boolean(detailTarget)} onClose={() => setDetailTarget(null)} title="Detalle del usuario">
        <dl className="management__details">
          <div><dt>Nombre</dt><dd>{detailTarget ? getUserFullName(detailTarget) : '-'}</dd></div>
          <div><dt>Email</dt><dd>{detailTarget?.email ?? '-'}</dd></div>
          <div><dt>Teléfono</dt><dd>{detailTarget?.phone ?? '-'}</dd></div>
          <div><dt>Rol</dt><dd>{detailTarget ? roleLabels[detailTarget.role] : '-'}</dd></div>
          <div><dt>Estado</dt><dd>{isUserActive(detailTarget) ? 'Activo' : 'Inactivo'}</dd></div>
        </dl>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación">
        <div className="management__confirm">
          <p>Vas a eliminar a <strong>{deleteTarget ? getUserFullName(deleteTarget) : ''}</strong>. Esta acción no se puede deshacer.</p>
          <div className="management__modal-actions">
            <button className="management__button management__button--secondary" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button>
            <button className="management__button management__button--danger-solid" type="button" onClick={confirmDeleteUser}>Confirmar eliminación</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bulkModal === 'delete'} onClose={closeBulkModal} title="Eliminar alumnos seleccionados">
        <div className="management__confirm">
          <p>Vas a eliminar <strong>{selectedUsers.length}</strong> alumnos seleccionados. Esta acción no se puede deshacer.</p>
          <div className="management__modal-actions">
            <button className="management__button management__button--secondary" type="button" onClick={closeBulkModal}>Cancelar</button>
            <button className="management__button management__button--danger-solid" type="button" onClick={confirmBulkDelete}>Confirmar eliminación</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bulkModal === 'update'} onClose={closeBulkModal} title="Cambiar curso o estado">
        <form className="management__form" onSubmit={applyBulkChanges}>
          <p className="management__meta">Los cambios se aplicarán a {selectedUsers.length} alumnos seleccionados.</p>
          <label className="management__field"><span>Curso</span><select name="course_id" value={bulkForm.course_id} onChange={updateFormField(setBulkForm)}><option value="">Mantener curso actual</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label className="management__field"><span>Estado del usuario</span><select name="status" value={bulkForm.status} onChange={updateFormField(setBulkForm)}>{BULK_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <div className="management__modal-actions">
            <button className="management__button management__button--secondary" type="button" onClick={closeBulkModal}>Cancelar</button>
            <button className="management__button management__button--primary" type="submit">Aplicar cambios</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

export default UserRoleManagement
