import { useMemo, useState } from 'react'
import StudentLayout from '../layouts/StudentLayout'
import { useConfig } from '../context/configContext'

const COURSE_OPTIONS = [
  { id: 'all', label: 'Todos los cursos' },
  { id: 'english-b2', label: 'Inglés B2 - Conversación' },
  { id: 'business', label: 'Business English' },
]

const SUMMARY_STATS = [
  { id: 'average', label: 'Nota media', value: '10' },
  { id: 'submitted', label: 'Tareas entregadas', value: '10/14' },
  { id: 'absences', label: 'Faltas', value: '5' },
]

const GRADE_ROWS = [
  {
    id: 'essay-climate',
    courseId: 'english-b2',
    title: 'Writing Essay: Climate Action',
    date: '12/05/2026',
    grade: '10',
    feedback: 'Buen uso de conectores y conclusión sólida.',
  },
  {
    id: 'speaking-mock',
    courseId: 'english-b2',
    title: 'Speaking Mock Exam',
    date: '07/05/2026',
    grade: '10',
    feedback: 'Pronunciación clara y respuestas bien estructuradas.',
  },
  {
    id: 'reading-part-5',
    courseId: 'english-b2',
    title: 'Reading Mock Part 5',
    date: '30/04/2026',
    grade: '10',
    feedback: 'Excelente precisión en vocabulario contextual.',
  },
  {
    id: 'negotiation-email',
    courseId: 'business',
    title: 'Email de negociación',
    date: '24/04/2026',
    grade: '10',
    feedback: 'Registro profesional y cierre convincente.',
  },
]

const StudentGradesPage = () => {
  const { uiVariant } = useConfig()
  const [selectedCourse, setSelectedCourse] = useState('all')
  const visibleRows = useMemo(
    () => GRADE_ROWS.filter((row) => selectedCourse === 'all' || row.courseId === selectedCourse),
    [selectedCourse],
  )

  return (
    <StudentLayout variant={uiVariant ?? 'v1'}>
      <section className="student-grades" aria-labelledby="student-grades-title">
        <header className="student-grades__header">
          <div>
            <p className="student-grades__eyebrow">Calificaciones</p>
            <h1 className="student-grades__title" id="student-grades-title">
              Mi expediente
            </h1>
          </div>
          <label className="student-grades__filter">
            <span>Curso</span>
            <select
              className="student-grades__select"
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
            >
              {COURSE_OPTIONS.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="student-grades__stats" aria-label="Resumen del expediente">
          {SUMMARY_STATS.map((stat) => (
            <article className="student-grades__stat" key={stat.id}>
              <span className="student-grades__stat-label">{stat.label}</span>
              <strong className="student-grades__stat-value">{stat.value}</strong>
            </article>
          ))}
        </div>

        <div className="student-grades__table-card">
          <div className="student-grades__table-scroll">
            <table className="student-grades__table">
              <thead>
                <tr>
                  <th scope="col">Tarea/examen</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Nota</th>
                  <th scope="col">Retroalimentación</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.date}</td>
                    <td>{row.grade}</td>
                    <td>{row.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="student-grades__footer">
            <button className="student-grades__button" type="button">
              Exportar como PDF
            </button>
          </footer>
        </div>
      </section>
    </StudentLayout>
  )
}

export default StudentGradesPage