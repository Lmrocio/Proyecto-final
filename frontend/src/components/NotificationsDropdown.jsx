import { useMemo, useState } from 'react'
import { CheckCheck, RefreshCcw, Search, Trash2 } from 'lucide-react'
import Skeleton from './Skeleton'

const normalizeSearch = (value) => value.trim().toLocaleLowerCase('es')

const NotificationsDropdown = ({
  notifications = [],
  isLoading = false,
  error = null,
  onRetry,
  onMarkAllAsRead,
  onMarkAsRead,
  onDelete,
}) => {
  const [search, setSearch] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const query = normalizeSearch(search)

  const filteredNotifications = useMemo(() => {
    if (!query) {
      return notifications
    }

    return notifications.filter((notification) => {
      const title = normalizeSearch(notification.title ?? '')
      const body = normalizeSearch(notification.body ?? '')

      return title.includes(query) || body.includes(query)
    })
  }, [notifications, query])

  const handleMarkAllAsRead = async () => {
    setPendingAction('all')
    try {
      await onMarkAllAsRead?.()
    } finally {
      setPendingAction(null)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    setPendingAction(`read-${notificationId}`)
    try {
      await onMarkAsRead?.(notificationId)
    } finally {
      setPendingAction(null)
    }
  }

  const handleDelete = async (notificationId) => {
    setPendingAction(`delete-${notificationId}`)
    try {
      await onDelete?.(notificationId)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section className="notifications-dropdown" aria-label="Notificaciones">
      <header className="notifications-dropdown__header">
        <h2 className="notifications-dropdown__title">Notificaciones</h2>
        <button
          className="notifications-dropdown__mark-all"
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={!notifications.length || pendingAction === 'all'}
        >
          Marcar todo como leído
        </button>
      </header>

      <label className="notifications-dropdown__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscador"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {isLoading ? <Skeleton variant="row" lines={3} label="Cargando notificaciones" /> : null}

      {!isLoading && error ? (
        <div className="notifications-dropdown__state notifications-dropdown__state--error">
          <p>No se pudieron cargar las notificaciones.</p>
          {onRetry ? (
            <button className="notifications-dropdown__retry" type="button" onClick={onRetry}>
              <RefreshCcw size={15} aria-hidden="true" />
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error ? (
        <ul className="notifications-dropdown__list">
          {filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className={
                notification.is_read
                  ? 'notifications-dropdown__item'
                  : 'notifications-dropdown__item notifications-dropdown__item--unread'
              }
            >
              <div className="notifications-dropdown__content">
                <h3 className="notifications-dropdown__item-title">{notification.title}</h3>
                <p className="notifications-dropdown__body">{notification.body}</p>
              </div>
              <div className="notifications-dropdown__actions">
                {!notification.is_read ? (
                  <button
                    className="notifications-dropdown__icon"
                    type="button"
                    title="Marcar como leído"
                    aria-label="Marcar como leído"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={pendingAction === `read-${notification.id}`}
                  >
                    <CheckCheck size={16} />
                  </button>
                ) : null}
                <button
                  className="notifications-dropdown__icon notifications-dropdown__icon--danger"
                  type="button"
                  title="Eliminar notificación"
                  aria-label="Eliminar notificación"
                  onClick={() => handleDelete(notification.id)}
                  disabled={pendingAction === `delete-${notification.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && !error && !filteredNotifications.length ? (
        <p className="notifications-dropdown__state">No hay notificaciones.</p>
      ) : null}
    </section>
  )
}

export default NotificationsDropdown