import { ArrowLeft, ArrowRight } from 'lucide-react'
import CourseCard from './CourseCard'

const COURSES = [
  {
    id: 'kids',
    title: 'Curso para niños',
    level: 'Jóvenes',
    description: 'Clases dinámicas y participativas enfocadas en una comunicación sin barreras.',
  },
  {
    id: 'teens',
    title: 'Preparación Cambridge',
    level: 'B1 - C1',
    description: 'Sesiones enfocadas en examen oficial, speaking práctico y estrategia de prueba.',
  },
  {
    id: 'adults',
    title: 'Inglés para adultos',
    level: 'Flexible',
    description: 'Aprende con una ruta adaptada a objetivos reales, horarios flexibles y feedback constante.',
  },
  {
    id: 'business',
    title: 'Business English',
    level: 'Profesional',
    description: 'Presentaciones, reuniones y comunicación internacional con enfoque útil y directo.',
  },
]

const CoursesSection = () => (
  <section className="home-courses">
    <div className="home-grid home-courses__header-row">
      <div className="home-courses__controls" aria-hidden="true">
        <button className="home-courses__control" type="button" title="Anterior" aria-label="Anterior">
          <ArrowLeft size={18} />
        </button>
        <button className="home-courses__control" type="button" title="Siguiente" aria-label="Siguiente">
          <ArrowRight size={18} />
        </button>
      </div>
      <h2 className="home-courses__title">NUESTROS CURSOS</h2>
    </div>

    <div className="home-grid home-courses__grid">
      {COURSES.map((course) => (
        <CourseCard key={course.id} {...course} />
      ))}
    </div>
  </section>
)

export default CoursesSection