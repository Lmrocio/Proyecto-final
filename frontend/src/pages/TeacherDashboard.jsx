import { useEffect, useMemo, useState } from 'react'
import { RefreshCcw, Trash2 } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import StudentLayout from '../layouts/StudentLayout'
import { useConfig } from '../context/configContext'
import { apiClient } from '../services/apiClient'

const initialMaterialForm = { course_id: '', title: '', unit_name: 'UNIT 1', type: 'link', path: '' }
const initialAssignmentForm = { course_id: '', title: '', unit_name: 'UNIT 1', description: '', due_date: '2026-06-15T12:00' }

const dataItems = (response) => (Array.isArray(response?.data?.data) ? response.data.data : [])
const errorMessage = (error, fallback) => error?.response?.data?.message ?? fallback

const TeacherDashboard = () => {
  const { uiVariant } = useConfig()
  const [courses, setCourses] = useState([])
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [materialForm, setMaterialForm] = useState(initialMaterialForm)
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm)
  const [gradeDrafts, setGradeDrafts] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(null)

  const selectedCourseOptions = useMemo(() => courses.map((course) => ({ value: course.id, label: course.title })), [courses])

  const loadTeacherData = async () => {
    setIsLoading(true)
    setFeedback('')
    setError(null)

    try {
      const [coursesResponse, materialsResponse, assignmentsResponse, submissionsResponse] = await Promise.all([
        apiClient.get('/courses', { params: { per_page: 100 } }),
        apiClient.get('/materials', { params: { per_page: 100 } }),
        apiClient.get('/assignments', { params: { per_page: 100 } }),
        apiClient.get('/submissions', { params: { per_page: 100 } }),
      ])

      setCourses(dataItems(coursesResponse))
      setMaterials(dataItems(materialsResponse))
      setAssignments(dataItems(assignmentsResponse))
      setSubmissions(dataItems(submissionsResponse))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(loadTeacherData)
  }, [])

  const updateForm = (setter) => (event) => {
    const { name, value } = event.target
    setter((currentForm) => ({ ...currentForm, [name]: value }))
    setFeedback('')
  }

  const updateGradeDraft = (submissionId, field, value) => {
    setGradeDrafts((currentDrafts) => ({
      ...currentDrafts,
      [submissionId]: {
        ...currentDrafts[submissionId],
        [field]: value,
      },
    }))
    setFeedback('')
  }

  const createMaterial = async (event) => {
    event.preventDefault()

    try {
      const { data } = await apiClient.post('/materials', materialForm)
      setMaterials((currentMaterials) => [data, ...currentMaterials])
      setMaterialForm(initialMaterialForm)
      setFeedback('Material creado correctamente.')
    } catch (requestError) {
      setFeedback(errorMessage(requestError, 'No se pudo crear el material.'))
    }
  }

  const createAssignment = async (event) => {
    event.preventDefault()

    try {
      const { data } = await apiClient.post('/assignments', assignmentForm)
      setAssignments((currentAssignments) => [data, ...currentAssignments])
      setAssignmentForm(initialAssignmentForm)
      setFeedback('Tarea creada correctamente.')
    } catch (requestError) {
      setFeedback(errorMessage(requestError, 'No se pudo crear la tarea.'))
    }
  }

  const deleteItem = async (resource, id, setter, message) => {
    if (!window.confirm('¿Eliminar este elemento?')) {
      return
    }

    try {
      await apiClient.delete(`/${resource}/${id}`)
      setter((currentItems) => currentItems.filter((item) => item.id !== id))
      setFeedback(message)
    } catch (requestError) {
      setFeedback(errorMessage(requestError, 'No se pudo eliminar el elemento.'))
    }
  }

  const gradeSubmission = async (submission) => {
    const draft = gradeDrafts[submission.id] ?? {}
    const payload = {
      grade: draft.grade === '' || draft.grade === undefined ? submission.grade : Number(draft.grade),
      teacher_feedback: draft.teacher_feedback ?? submission.teacher_feedback ?? '',
    }

    try {
      const { data } = await apiClient.patch(`/submissions/${submission.id}/grade`, payload)
      setSubmissions((currentSubmissions) => currentSubmissions.map((item) => (item.id === data.id ? data : item)))
      setFeedback('Entrega calificada.')
    } catch (requestError) {
      setFeedback(errorMessage(requestError, 'No se pudo calificar la entrega.'))
    }
  }

  return (
    <StudentLayout variant={uiVariant ?? 'v1'} showSidebar={false}>
      <section className="management" aria-labelledby="teacher-panel-title">
        <header className="management__header">
          <div>
            <p className="management__eyebrow">Panel docente</p>
            <h1 className="management__title" id="teacher-panel-title">Cursos, materiales y correcciones</h1>
            <p className="management__subtitle">Gestiona el contenido de tus cursos y califica entregas desde una sola vista.</p>
          </div>
          <button className="management__button management__button--secondary" type="button" onClick={loadTeacherData} disabled={isLoading}>
            <RefreshCcw size={16} aria-hidden="true" />
            Actualizar
          </button>
        </header>

        {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
        {error ? <EmptyState title="No se pudo cargar el panel" text="Revisa tu conexión e inténtalo de nuevo." actionLabel="Reintentar" onAction={loadTeacherData} tone="error" /> : null}

        <div className="management__stats" aria-label="Resumen docente">
          <div className="management__stat"><span>Cursos</span><strong>{courses.length}</strong></div>
          <div className="management__stat"><span>Materiales</span><strong>{materials.length}</strong></div>
          <div className="management__stat"><span>Tareas</span><strong>{assignments.length}</strong></div>
          <div className="management__stat"><span>Entregas</span><strong>{submissions.length}</strong></div>
        </div>

        <section className="management__section" aria-labelledby="teacher-materials-title">
          <div className="management__section-header"><h2 className="management__section-title" id="teacher-materials-title">Materiales</h2></div>
          <form className="management__form management__grid" onSubmit={createMaterial}>
            <label className="management__field"><span>Curso</span><select name="course_id" value={materialForm.course_id} onChange={updateForm(setMaterialForm)} required><option value="">Selecciona curso</option>{selectedCourseOptions.map((course) => <option key={course.value} value={course.value}>{course.label}</option>)}</select></label>
            <label className="management__field"><span>Título</span><input name="title" value={materialForm.title} onChange={updateForm(setMaterialForm)} required /></label>
            <label className="management__field"><span>Unidad</span><input name="unit_name" value={materialForm.unit_name} onChange={updateForm(setMaterialForm)} /></label>
            <label className="management__field"><span>Tipo</span><select name="type" value={materialForm.type} onChange={updateForm(setMaterialForm)}><option value="link">Link</option><option value="video">Vídeo</option><option value="audio">Audio</option></select></label>
            <label className="management__field"><span>URL</span><input name="path" type="url" value={materialForm.path} onChange={updateForm(setMaterialForm)} required /></label>
            <button className="management__button management__button--primary" type="submit">Crear material</button>
          </form>
          <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Material</th><th>Curso</th><th>Tipo</th><th /></tr></thead><tbody>{materials.map((material) => <tr key={material.id}><td><strong>{material.title}</strong><p className="management__table-meta">{material.path}</p></td><td>{material.course?.title ?? material.course_id}</td><td>{material.type}</td><td><button className="management__button management__button--danger" type="button" onClick={() => deleteItem('materials', material.id, setMaterials, 'Material eliminado.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
        </section>

        <section className="management__section" aria-labelledby="teacher-assignments-title">
          <div className="management__section-header"><h2 className="management__section-title" id="teacher-assignments-title">Tareas</h2></div>
          <form className="management__form management__grid" onSubmit={createAssignment}>
            <label className="management__field"><span>Curso</span><select name="course_id" value={assignmentForm.course_id} onChange={updateForm(setAssignmentForm)} required><option value="">Selecciona curso</option>{selectedCourseOptions.map((course) => <option key={course.value} value={course.value}>{course.label}</option>)}</select></label>
            <label className="management__field"><span>Título</span><input name="title" value={assignmentForm.title} onChange={updateForm(setAssignmentForm)} required /></label>
            <label className="management__field"><span>Unidad</span><input name="unit_name" value={assignmentForm.unit_name} onChange={updateForm(setAssignmentForm)} /></label>
            <label className="management__field"><span>Fecha límite</span><input name="due_date" type="datetime-local" value={assignmentForm.due_date} onChange={updateForm(setAssignmentForm)} /></label>
            <label className="management__field"><span>Descripción</span><textarea name="description" value={assignmentForm.description} onChange={updateForm(setAssignmentForm)} rows="3" /></label>
            <button className="management__button management__button--primary" type="submit">Crear tarea</button>
          </form>
          <div className="management__table-wrap"><table className="management__table"><thead><tr><th>Tarea</th><th>Curso</th><th>Entregas</th><th /></tr></thead><tbody>{assignments.map((assignment) => <tr key={assignment.id}><td><strong>{assignment.title}</strong><p className="management__table-meta">{assignment.unit_name ?? 'Unidad general'} · {assignment.due_date?.slice(0, 16) ?? 'Sin fecha'}</p></td><td>{assignment.course?.title ?? assignment.course_id}</td><td>{assignment.submissions_count ?? 0}</td><td><button className="management__button management__button--danger" type="button" onClick={() => deleteItem('assignments', assignment.id, setAssignments, 'Tarea eliminada.')}><Trash2 size={15} aria-hidden="true" />Eliminar</button></td></tr>)}</tbody></table></div>
        </section>

        <section className="management__section" aria-labelledby="teacher-submissions-title">
          <div className="management__section-header"><h2 className="management__section-title" id="teacher-submissions-title">Entregas</h2></div>
          {!submissions.length && !isLoading ? <EmptyState title="Sin entregas" text="Aún no hay tareas entregadas en tus cursos." tone="ok" /> : null}
          <div className="management__list">
            {submissions.map((submission) => (
              <article className="management__item" key={submission.id}>
                <div className="management__item-main">
                  <span className="management__badge management__badge--active">{submission.grade === null || submission.grade === undefined ? 'Pendiente' : `Nota ${submission.grade}`}</span>
                  <h3 className="management__item-title">{submission.assignment?.title ?? 'Entrega'}</h3>
                  <p className="management__item-copy">{submission.content ?? 'Entrega sin texto adjunto.'}</p>
                  <div className="management__meta"><span>{submission.student?.name ?? 'Alumno'}</span><span>{submission.assignment?.course?.title ?? 'Curso'}</span></div>
                </div>
                <div className="management__inline-form">
                  <label className="management__field"><span>Nota</span><input type="number" min="0" max="100" value={gradeDrafts[submission.id]?.grade ?? submission.grade ?? ''} onChange={(event) => updateGradeDraft(submission.id, 'grade', event.target.value)} /></label>
                  <label className="management__field"><span>Feedback</span><textarea rows="3" value={gradeDrafts[submission.id]?.teacher_feedback ?? submission.teacher_feedback ?? ''} onChange={(event) => updateGradeDraft(submission.id, 'teacher_feedback', event.target.value)} /></label>
                  <button className="management__button management__button--primary" type="button" onClick={() => gradeSubmission(submission)}>Guardar corrección</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </StudentLayout>
  )
}

export default TeacherDashboard