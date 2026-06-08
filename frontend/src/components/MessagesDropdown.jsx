import { File, Inbox, Send, Settings, Star, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const ITEMS = [
  { id: 'inbox', label: 'Bandeja de entrada', icon: Inbox },
  { id: 'starred', label: 'Destacados', icon: Star },
  { id: 'sent', label: 'Enviados', icon: Send },
  { id: 'drafts', label: 'Borradores', icon: File },
  { id: 'trash', label: 'Papelera', icon: Trash2 },
]

const MessagesDropdown = ({ onNavigate }) => (
  <section className="dropdown-panel dropdown-panel--messages" aria-label="Accesos rápidos de mensajes">
    <header className="dropdown-panel__header">
      <Link className="dropdown-panel__action" to="/student/messages/new" onClick={onNavigate}>
        Nuevo mensaje
      </Link>
      <Link
        className="dropdown-panel__icon-link"
        to="/student/messages/settings"
        title="Configurar mensajes"
        aria-label="Configurar mensajes"
        onClick={onNavigate}
      >
        <Settings size={16} />
      </Link>
    </header>

    <nav className="dropdown-panel__nav" aria-label="Carpetas de mensajes">
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <Link key={id} className="dropdown-panel__nav-link" to={`/student/messages/${id}`} onClick={onNavigate}>
          <Icon size={16} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  </section>
)

export default MessagesDropdown