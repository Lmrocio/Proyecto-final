import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import { apiClient } from '../../services/apiClient'
import { dataItems, formatDate, getErrorMessage, updateFormField } from './adminPageUtils'

const initialCourseForm = { title: '', teacher_id: '', meeting_link: '', start_date: '2026-06-01', end_date: '2026-07-31', bonus_id: '' }
const initialEnrollmentForm = { student_id: '', course_id: '', status: 'active' }

const CourseForm = ({ bonuses, form, onChange, onSubmit, teachers }) => (
  <form className="management__form management__grid" onSubmit={onSubmit}>
    <label className="management__field"><span>Título</span><input name="title" value={form.title} onChange={onChange} required /></label>
    <label className="management__field"><span>Profesor</span><select name="teacher_id" value={form.teacher_id} onChange={onChange} required><option value="">Selecciona profesor</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
    <label className="management__field"><span>Inicio</span><input name="start_date" type="date" value={form.start_date} onChange={onChange} required /></label>
    <label className="management__field"><span>Fin</span><input name="end_date" type="date" value={form.end_date} onChange={onChange} required /></label>
    <label className="management__field"><span>Videollamada</span><input name="meeting_link" type="url" value={form.meeting_link} onChange={onChange} /></label>
    <label className="management__field"><span>Bono</span><select name="bonus_id" value={form.bonus_id} onChange={onChange}><option value="">Sin bono</option>{bonuses.map((bonus) => <option key={bonus.id} value={bonus.id}>{bonus.name}</option>)}</select></label>
    <button className="management__button management__button--primary" type="submit">Guardar curso</button>
  </form>
)

const EnrollmentForm = ({ courses, form, onChange, onSubmit, students }) => (
  <form className="management__form management__grid" onSubmit={onSubmit}>
    <label className="management__field"><span>Alumno</span><select name="student_id" value={form.student_id} onChange={onChange} required><option value="">Selecciona alumno</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    <label className="management__field"><span>Curso</span><select name="course_id" value={form.course_id} onChange={onChange} required><option value="">Selecciona curso</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
    <label className="management__field"><span>Estado</span><select name="status" value={form.status} onChange={onChange}><option value="active">Activa</option><option value="inactive">Inactiva</option></select></label>
    <button className="management__button management__button--primary" type="submit">Guardar matrícula</button>
  </form>
)

const AdminCourses = () => {
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [activeTab, setActiveTab] = useState('courses')
  const [modalType, setModalType] = useState(null)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [courseForm, setCourseForm] = useState(initialCourseForm)
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const teachers = users.filter((item) => item.role === 'teacher')
  const students = users.filter((item) => item.role === 'student')

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

  const openCreateCourse = () => {
    setCourseForm(initialCourseForm)
    setEditingCourseId(null)
    setModalType('course')
  }

  const openEditCourse = (course) => {
    setCourseForm({
      title: course.title ?? '',
      teacher_id: course.teacher_id ?? '',
      meeting_link: course.meeting_link ?? '',
      start_date: course.start_date?.slice(0, 10) ?? '',
      end_date: course.end_date?.slice(0, 10) ?? '',
      bonus_id: course.bonus_id ?? '',
    })
    setEditingCourseId(course.id)
    setModalType('course')
  }

  const openCreateEnrollment = () => {
    setEnrollmentForm(initialEnrollmentForm)
    setModalType('enrollment')
  }

  const closeModal = () => {
    setModalType(null)
    setEditingCourseId(null)
    setCourseForm(initialCourseForm)
    setEnrollmentForm(initialEnrollmentForm)
  }

  const saveCourse = async (event) => {
    event.preventDefault()

    try {
      const payload = { ...courseForm, bonus_id: courseForm.bonus_id || null, meeting_link: courseForm.meeting_link || null }
      if (editingCourseId) {
        const { data } = await apiClient.put(`/courses/${editingCourseId}`, payload)
        setCourses((currentCourses) => currentCourses.map((course) => (course.id === data.id ? data : course)))
        setFeedback('Curso actualizado correctamente.')
      } else {
        const { data } = await apiClient.post('/courses', payload)
        setCourses((currentCourses) => [data, ...currentCourses])
        setFeedback('Curso creado correctamente.')
      }
      closeModal()
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo guardar el curso.'))
    }
  }

  const createEnrollment = async (event) => {
    event.preventDefault()

    try {
      const { data } = await apiClient.post('/enrollments', enrollmentForm)
      setEnrollments((currentEnrollments) => [data, ...currentEnrollments.filter((item) => item.id !== data.id)])
      closeModal()
      setFeedback('Matrícula guardada correctamente.')
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo guardar la matrícula.'))
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
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo eliminar el registro.'))
    }
  }

  const updateEnrollmentStatus = async (enrollment, statusValue) => {
    try {
      const { data } = await apiClient.put(`/enrollments/${enrollment.id}`, { status: statusValue })
      setEnrollments((currentEnrollments) => currentEnrollments.map((item) => (item.id === data.id ? data : item)))
      setFeedback('Estado de matrícula actualizado.')
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo actualizar la matrícula.'))
    }
  }

  return (
    <section className="management management__page" aria-labelledby="admin-courses-title">
      <header className="management__header">
        <div><p className="management__eyebrow">Academia</p><h1 className="management__title" id="admin-courses-title">Cursos y matrículas</h1><p className="management__subtitle">Gestiona grupos, profesores asignados y matriculaciones activas.</p></div>
        <div className="management__actions">
          <button className="management__button management__button--secondary" type="button" onClick={loadCoursesData} disabled={isLoading}><RefreshCcw size={16} aria-hidden="true" />Actualizar</button>
          <button className="management__button management__button--primary" type="button" onClick={activeTab === 'courses' ? openCreateCourse : openCreateEnrollment}><Plus size={16} aria-hidden="true" />{activeTab === 'courses' ? 'Nuevo curso' : 'Nueva matrícula'}</button>
        </div>
      </header>

      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      {error ? <p className="management__notice" role="alert">{error}</p> : null}

      <section className="management__section" aria-busy={isLoading}>
        <div className="management__tabs" role="tablist" aria-label="Gestión de cursos">
          <button className={activeTab === 'courses' ? 'management__tab management__tab--active' : 'management__tab'} type="button" role="tab" aria-selected={activeTab === 'courses'} onClick={() => setActiveTab('courses')}>Cursos</button>
          <button className={activeTab === 'enrollments' ? 'management__tab management__tab--active' : 'management__tab'} type="button" role="tab" aria-selected={activeTab === 'enrollments'} onClick={() => setActiveTab('enrollments')}>Matrículas</button>
        </div>

        {activeTab === 'courses' ? (
          <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Curso</th><th>Profesor</th><th>Fechas</th><th>Acciones</th></tr></thead><tbody>{courses.map((course) => <tr key={course.id}><td><strong>{course.title}</strong><p className="management__table-meta">{course.meeting_link ?? 'Sin videollamada'}</p></td><td>{course.teacher?.name ?? course.teacher_id}</td><td>{formatDate(course.start_date)} - {formatDate(course.end_date)}</td><td><div className="management__row-actions"><button className="management__button management__button--secondary" type="button" onClick={() => openEditCourse(course)}><Pencil size={15} aria-hidden="true" />Editar</button><button className="management__button management__button--danger" type="button" onClick={() => deleteResource('courses', course.id, setCourses, 'Curso eliminado.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></div></td></tr>)}</tbody></table></div>
        ) : (
          <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Alumno</th><th>Curso</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{enrollments.map((enrollment) => <tr key={enrollment.id}><td>{enrollment.student?.name ?? enrollment.student_id}</td><td>{enrollment.course?.title ?? enrollment.course_id}</td><td><select value={enrollment.status} onChange={(event) => updateEnrollmentStatus(enrollment, event.target.value)}><option value="active">Activa</option><option value="inactive">Inactiva</option></select></td><td><button className="management__button management__button--danger" type="button" onClick={() => deleteResource('enrollments', enrollment.id, setEnrollments, 'Matrícula eliminada.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
        )}
      </section>

      <Modal isOpen={Boolean(modalType)} onClose={closeModal} title={modalType === 'enrollment' ? 'Nueva matrícula' : editingCourseId ? 'Editar curso' : 'Nuevo curso'}>
        {modalType === 'enrollment'
          ? <EnrollmentForm courses={courses} form={enrollmentForm} onChange={updateFormField(setEnrollmentForm)} onSubmit={createEnrollment} students={students} />
          : <CourseForm bonuses={bonuses} form={courseForm} onChange={updateFormField(setCourseForm)} onSubmit={saveCourse} teachers={teachers} />}
      </Modal>
    </section>
  )
}

export default AdminCourses