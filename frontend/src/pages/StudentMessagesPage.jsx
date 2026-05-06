import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import StudentPlaceholderPage from './StudentPlaceholderPage'

const FOLDER_LABELS = {
  new: 'Nuevo mensaje',
  settings: 'Configuración de mensajes',
  inbox: 'Bandeja de entrada',
  starred: 'Destacados',
  sent: 'Enviados',
  drafts: 'Borradores',
  trash: 'Papelera',
}

const StudentMessagesPage = () => {
  const { folder = 'inbox' } = useParams()
  const label = useMemo(() => FOLDER_LABELS[folder] ?? 'Mensajes', [folder])

  return <StudentPlaceholderPage label={label} />
}

export default StudentMessagesPage