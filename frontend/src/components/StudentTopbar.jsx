import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, Mail, UserSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import MessagesDropdown from './MessagesDropdown'
import NotificationsDropdown from './NotificationsDropdown'
import ProfileDropdown from './ProfileDropdown'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import { useNotifications } from '../hooks/useNotifications'

const StudentTopbar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const actionsRef = useRef(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  } = useNotifications()

  const closeDropdowns = useCallback(() => {
    setActiveDropdown(null)
  }, [])

  useOnClickOutside(actionsRef, closeDropdowns, activeDropdown !== null)

  useEffect(() => {
    if (!activeDropdown) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeDropdowns()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [activeDropdown, closeDropdowns])

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown((currentDropdown) => (currentDropdown === dropdownName ? null : dropdownName))
  }

  return (
    <header className="student-topbar">
      <Link className="student-topbar__brand" to="/">
        Openclassy
      </Link>
      <div className="student-topbar__actions" ref={actionsRef}>
        <div className="student-topbar__dropdown-wrap">
          <button
            className={
              activeDropdown === 'notifications'
                ? 'student-topbar__icon student-topbar__icon--active'
                : 'student-topbar__icon'
            }
            type="button"
            aria-label="Notificaciones"
            aria-haspopup="dialog"
            aria-expanded={activeDropdown === 'notifications'}
            onClick={() => toggleDropdown('notifications')}
          >
            <Bell size={18} />
            {unreadCount > 0 ? <span className="student-topbar__badge" /> : null}
          </button>
          {activeDropdown === 'notifications' ? (
            <NotificationsDropdown
              notifications={notifications}
              isLoading={isLoading}
              error={error}
              onRetry={loadNotifications}
              onMarkAllAsRead={markAllAsRead}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ) : null}
        </div>
        <div className="student-topbar__dropdown-wrap">
          <button
            className={activeDropdown === 'messages' ? 'student-topbar__icon student-topbar__icon--active' : 'student-topbar__icon'}
            type="button"
            aria-label="Mensajes"
            aria-haspopup="menu"
            aria-expanded={activeDropdown === 'messages'}
            onClick={() => toggleDropdown('messages')}
          >
            <Mail size={18} />
          </button>
          {activeDropdown === 'messages' ? <MessagesDropdown onNavigate={closeDropdowns} /> : null}
        </div>
        <div className="student-topbar__dropdown-wrap">
          <button
            className={
              activeDropdown === 'profile'
                ? 'student-topbar__icon student-topbar__icon--profile student-topbar__icon--active'
                : 'student-topbar__icon student-topbar__icon--profile'
            }
            type="button"
            aria-label="Perfil"
            aria-haspopup="menu"
            aria-expanded={activeDropdown === 'profile'}
            onClick={() => toggleDropdown('profile')}
          >
            <UserSquare size={18} />
          </button>
          {activeDropdown === 'profile' ? <ProfileDropdown onNavigate={closeDropdowns} /> : null}
        </div>
      </div>
    </header>
  )
}

export default StudentTopbar
