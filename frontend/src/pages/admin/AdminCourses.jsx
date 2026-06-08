import { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import Modal from '../../components/Modal'
import { apiClient } from '../../services/apiClient'
import { dataItems, formatDate, getErrorMessage, getUserFullName, normalizeSearchText, updateFormField } from './adminPageUtils'

const initialCourseForm = {
  title: '',
  description: '',
  teacher_id: '',
  meeting_link: '',
  start_date: '2026-06-01',
  end_date: '2026-07-31',
  schedule: '',
  bonus_id: '',
}

const CourseForm = ({ bonuses, form, onChange, onSubmit, teachers }) => (
  <form className="management__form management__grid" onSubmit={onSubmit}>
    <label className="management__field"><span>Nombre curso</span><input name="title" value={form.title} onChange={onChange} required /></label>
    <label className="management__field"><span>Docente</span><select name="teacher_id" value={form.teacher_id} onChange={onChange} required><option value="">Selecciona docente</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{getUserFullName(teacher)}</option>)}</select></label>
    <label className="management__field"><span>Inicio</span><input name="start_date" type="date" value={form.start_date} onChange={onChange} required /></label>
    <label className="management__field"><span>Fin</span><input name="end_date" type="date" value={form.end_date} onChange={onChange} required /></label>
    <label className="management__field"><span>Horarios</span><input name="schedule" value={form.schedule} onChange={onChange} placeholder="L/X 17:00-18:30" /></label>
    <label className="management__field"><span>Bono asociado</span><select name="bonus_id" value={form.bonus_id} onChange={onChange}><option value="">Sin bono</option>{bonuses.map((bonus) => <option key={bonus.id} value={bonus.id}>{bonus.name}</option>)}</select></label>
    <label className="management__field"><span>Videollamada</span><input name="meeting_link" type="url" value={form.meeting_link} onChange={onChange} /></label>
    <label className="management__field management__field--wide"><span>Descripción</span><textarea name="description" rows="3" value={form.description} onChange={onChange} /></label>
    <button className="management__button management__button--primary" type="submit">Guardar curso</button>
  </form>
)

const AdminCourses = () => {
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [modalMode, setModalMode] = useState(null)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [courseForm, setCourseForm] = useState(initialCourseForm)
  const [studentListCourse, setStudentListCourse] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const teachers = useMemo(() => users.filter((item) => item.role === 'teacher'), [users])

  const loadCoursesData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [usersResponse, coursesResponse, enrollmentsResponse, bonusesResponse] = await Promise.all([
        apiClient.get('/users', { params: { per_page: 100 } }),
        apiClient.get('/courses', { params: { per_page: 100 } }),
        apiClient.get('/enrollments', { params: { per_page: 100 } }),
        apiClient.get('/bonuses', { params: { per_page: 100 } }),
      ])

      setUsers(dataItems(usersResponse))
      setCourses(dataItems(coursesResponse))
      setEnrollments(dataItems(enrollmentsResponse))
      setBonuses(dataItems(bonusesResponse))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudieron cargar los datos de cursos.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadCoursesData)
  }, [loadCoursesData])

  const filteredCourses = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchTerm)

    return courses.filter((course) => {
      const teacher = users.find((item) => item.id === course.teacher_id) ?? course.teacher
      const haystack = normalizeSearchText(`${course.title} ${course.description ?? ''} ${course.schedule ?? ''} ${getUserFullName(teacher)}`)
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      const matchesTeacher = teacherFilter === 'all' || course.teacher_id === teacherFilter

      return matchesSearch && matchesTeacher
    })
  }, [courses, searchTerm, teacherFilter, users])

  const studentsForCourse = (courseId) => enrollments
    .filter((enrollment) => enrollment.course_id === courseId && enrollment.status === 'active')
    .map((enrollment) => users.find((user) => user.id === enrollment.student_id) ?? enrollment.student)
    .filter(Boolean)

  const openCreateCourse = () => {
    setCourseForm(initialCourseForm)
    setEditingCourseId(null)
    setModalMode('course')
    setFeedback('')
  }

  const openEditCourse = (course) => {
    setCourseForm({
      title: course.title ?? '',
      description: course.description ?? '',
      teacher_id: course.teacher_id ?? '',
      meeting_link: course.meeting_link ?? '',
      start_date: course.start_date?.slice(0, 10) ?? '',
      end_date: course.end_date?.slice(0, 10) ?? '',
      schedule: course.schedule ?? '',
      bonus_id: course.bonus_id ?? '',
    })
    setEditingCourseId(course.id)
    setModalMode('course')
    setFeedback('')
  }

  const closeCourseModal = () => {
    setModalMode(null)
    setEditingCourseId(null)
    setCourseForm(initialCourseForm)
  }

  const saveCourse = async (event) => {
    event.preventDefault()

    try {
      const payload = {
        ...courseForm,
        description: courseForm.description || null,
        bonus_id: courseForm.bonus_id || null,
        meeting_link: courseForm.meeting_link || null,
        schedule: courseForm.schedule || null,
      }

      if (editingCourseId) {
        await apiClient.put(`/courses/${editingCourseId}`, payload)
        setFeedback('Curso actualizado correctamente.')
      } else {
        await apiClient.post('/courses', payload)
        setFeedback('Curso creado correctamente.')
      }

      closeCourseModal()
      await loadCoursesData()
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo guardar el curso.'))
    }
  }

  const deleteCourse = async (course) => {
    if (!window.confirm('¿Eliminar este curso?')) {
      return
    }

    try {
      await apiClient.delete(`/courses/${course.id}`)
      setCourses((currentCourses) => currentCourses.filter((item) => item.id !== course.id))
      setFeedback('Curso eliminado correctamente.')
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo eliminar el curso.'))
    }
  }

  return (
    <section className="management management__page" aria-labelledby="admin-courses-title">
      <h1 className="u-visually-hidden" id="admin-courses-title">Cursos</h1>

      <div className="management__toolbar">
        <label className="management__search">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar curso" aria-label="Buscar curso" />
        </label>
        <label className="management__select-filter">
          <Filter size={18} aria-hidden="true" />
          <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} aria-label="Filtrar cursos por docente">
            <option value="all">Todos los docentes</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{getUserFullName(teacher)}</option>)}
          </select>
        </label>
        <button className="management__button management__button--primary" type="button" onClick={openCreateCourse}><Plus size={16} aria-hidden="true" />Añadir curso</button>
      </div>

      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      {error ? <p className="management__notice" role="alert">{error}</p> : null}

      <section className="management__section" aria-busy={isLoading}>
        <div className="management__table-wrap">
          <table className="management__table">
            <thead><tr><th>Nombre curso</th><th>Descripción</th><th>Fechas</th><th>Horarios</th><th>Docente</th><th>Alumnado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filteredCourses.map((course) => {
                const teacher = users.find((item) => item.id === course.teacher_id) ?? course.teacher
                const activeStudents = studentsForCourse(course.id)

                return (
                  <tr key={course.id}>
                    <td><strong>{course.title}</strong></td>
                    <td>{course.description ?? '-'}</td>
                    <td>{formatDate(course.start_date)} - {formatDate(course.end_date)}</td>
                    <td>{course.schedule ?? '-'}</td>
                    <td>{getUserFullName(teacher)}</td>
                    <td><button className="management__link-button" type="button" onClick={() => setStudentListCourse(course)}><Users size={16} aria-hidden="true" />{course.students_count ?? activeStudents.length}</button></td>
                    <td>
                      <div className="management__row-actions">
                        <button className="management__icon-action" type="button" title="Editar" aria-label={`Editar ${course.title}`} onClick={() => openEditCourse(course)}><Pencil size={18} aria-hidden="true" /></button>
                        <button className="management__icon-action management__icon-action--danger" type="button" title="Eliminar" aria-label={`Eliminar ${course.title}`} onClick={() => deleteCourse(course)}><Trash2 size={18} aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredCourses.length === 0 ? <p className="management__empty">No hay cursos registrados.</p> : null}
      </section>

      <Modal isOpen={Boolean(modalMode)} onClose={closeCourseModal} title={editingCourseId ? 'Editar curso' : 'Añadir curso'}>
        <CourseForm bonuses={bonuses} form={courseForm} onChange={updateFormField(setCourseForm)} onSubmit={saveCourse} teachers={teachers} />
      </Modal>

      <Modal isOpen={Boolean(studentListCourse)} onClose={() => setStudentListCourse(null)} title={`Alumnado de ${studentListCourse?.title ?? 'curso'}`}>
        <div className="management__list">
          {studentListCourse ? studentsForCourse(studentListCourse.id).map((student) => (
            <article className="management__item" key={student.id}>
              <h3 className="management__item-title">{getUserFullName(student)}</h3>
              <p className="management__item-copy">{student.email} · {student.phone ?? 'Sin teléfono'}</p>
            </article>
          )) : null}
          {studentListCourse && studentsForCourse(studentListCourse.id).length === 0 ? <p className="management__empty">No hay alumnos activos en este curso.</p> : null}
        </div>
      </Modal>
    </section>
  )
}

export default AdminCourses
