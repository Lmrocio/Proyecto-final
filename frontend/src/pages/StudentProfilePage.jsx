import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import StudentPlaceholderPage from './StudentPlaceholderPage'

const SECTION_LABELS = {
  overview: 'Perfil',
  settings: 'Ajustes del perfil',
  accessibility: 'Accesibilidad',
  privacy: 'Privacidad',
  security: 'Seguridad',
  grades: 'Calificaciones',
}

const StudentProfilePage = () => {
  const { section = 'overview' } = useParams()
  const label = useMemo(() => SECTION_LABELS[section] ?? 'Perfil', [section])

  return <StudentPlaceholderPage label={label} />
}

export default StudentProfilePage