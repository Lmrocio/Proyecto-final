import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  File,
  Inbox,
  MailOpen,
  RefreshCcw,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Star,
  Trash2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import MessageSettingsModal from '../components/MessageSettingsModal'
import StudentLayout from '../layouts/StudentLayout'
import { useAuth } from '../context/authContext'
import { useConfig } from '../context/configContext'
import { apiClient } from '../services/apiClient'

const PAGE_SIZE = 8

const DEFAULT_LIST_SETTINGS = {
  compactRows: false,
  unreadFirst: true,
}

const FOLDER_LABELS = {
  new: 'Nuevo mensaje',
  settings: 'Configuración de mensajes',
  inbox: 'Bandeja de entrada',
  starred: 'Destacados',
  sent: 'Enviados',
  drafts: 'Borradores',
  trash: 'Papelera',
}

const MESSAGE_FOLDERS = ['new', 'inbox', 'starred', 'sent', 'drafts', 'trash']

const QUICK_FOLDERS = [
  { id: 'starred', label: FOLDER_LABELS.starred, icon: Star },
  { id: 'sent', label: FOLDER_LABELS.sent, icon: Send },
  { id: 'drafts', label: FOLDER_LABELS.drafts, icon: File },
]

const SAMPLE_SENDERS = ['Marta Cano', 'Openclassy', 'Daniel Ruiz', 'Clara Vidal']

const SAMPLE_BODIES = [
  'Recuerda traer tus dudas para el speaking mock del viernes. Usaremos vocabulario de travel plans y holiday experiences.',
  'He revisado tu Reading Mock Part 5. Busca en el panel la retroalimentacion y corrige las preposiciones del ejercicio 14.',
  'La tarea Writing Essay Climate Action tiene una nueva rubrica. Revisa cohesion, linking words y conclusion.',
  'Para Business English, prepara vocabulario de negotiation, pricing y follow up emails para la proxima sesion.',
  'Se ha actualizado el calendario academico con una clase extra de pronunciation clinic el proximo martes.',
  'Busca en el material complementario la plantilla de essay y el checklist para writing exam.',
  'Tu audio My Last Holiday se ha recibido correctamente. Envia una segunda version si quieres mejorar pronunciacion.',
  'En la proxima clase haremos debate sobre climate action. Lleva tres argumentos a favor y uno en contra.',
]

const createSampleMessages = () =>
  Array.from({ length: 64 }, (_, index) => {
    const createdAt = new Date(Date.UTC(2026, 2, 12 - (index % 18), 9 + (index % 8), 30))

    return {
      id: `demo-message-${index + 1}`,
      sender: SAMPLE_SENDERS[index % SAMPLE_SENDERS.length],
      recipients: ['Alumno Openclassy'],
      title: index % 3 === 0 ? 'Seguimiento de clase' : 'Actualizacion del curso',
      body: SAMPLE_BODIES[index % SAMPLE_BODIES.length],
      createdAt: createdAt.toISOString(),
      isRead: index % 4 !== 0,
      isStarred: index % 7 === 0,
      source: 'demo',
    }
  })

const SAMPLE_DRAFTS = [
  {
    id: 'draft-message-1',
    sender: 'Borrador',
    recipients: ['Marta Cano'],
    title: 'Duda sobre writing',
    body: 'Queria preguntarte si puedo entregar una segunda version del essay antes del viernes.',
    createdAt: '2026-03-12T12:30:00.000Z',
    isRead: true,
    isStarred: false,
    source: 'draft',
  },
]

const isPersistentMessage = (messageId) => !String(messageId).startsWith('demo-') && !String(messageId).startsWith('draft-')

const normalizeText = (value = '') => value.trim().toLocaleLowerCase('es')

const parseMessageDate = (value) => {
  if (!value) {
    return null
  }

  const parsedDate = typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(parsedDate) ? parsedDate : null
}

const formatMessageDate = (value) => {
  const parsedDate = parseMessageDate(value)
  return parsedDate ? format(parsedDate, 'dd/MM/yy', { locale: es }) : '--/--/--'
}

const getMessageTitle = (message) => {
  const body = message?.body ?? ''
  const firstSentence = body.split(/[.!?]/).find(Boolean)?.trim()

  return message?.subject ?? message?.title ?? firstSentence ?? 'Mensaje'
}

const normalizeInboxMessage = (message) => {
  const senderName = message?.sender?.name ?? 'Openclassy'

  return {
    id: message?.id,
    sender: senderName,
    recipients: ['Alumno Openclassy'],
    title: getMessageTitle(message),
    body: message?.body ?? '',
    createdAt: message?.created_at ?? null,
    isRead: Boolean(message?.is_read),
    isStarred: false,
    source: 'api',
  }
}

const normalizeSentMessage = (message) => {
  const recipients = Array.isArray(message?.recipients) ? message.recipients : []
  const recipientNames = recipients.map((recipient) => recipient.name).filter(Boolean)

  return {
    id: message?.id,
    sender: recipientNames.length ? `Para ${recipientNames.join(', ')}` : 'Mensaje enviado',
    recipients: recipientNames,
    title: getMessageTitle(message),
    body: message?.body ?? '',
    createdAt: message?.created_at ?? null,
    isRead: true,
    isStarred: false,
    source: 'api',
  }
}

const getPaginationItems = (pageCount) => {
  if (pageCount <= 4) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  return [1, 2, 3, 'ellipsis', pageCount]
}

const MessageRow = ({ message, isSelected, onSelect, onOpen, onToggleStar }) => (
  <li className={message.isRead ? 'student-messages__row' : 'student-messages__row student-messages__row--unread'}>
    <label className="student-messages__row-check">
      <input
        type="checkbox"
        checked={isSelected}
        aria-label={`Seleccionar ${message.title}`}
        onChange={() => onSelect(message.id)}
      />
    </label>
    <button className="student-messages__message" type="button" onClick={() => onOpen(message)}>
      <span className="student-messages__sender">{message.sender}</span>
      <span className="student-messages__excerpt">{message.body}</span>
    </button>
    <time className="student-messages__date" dateTime={message.createdAt ?? undefined}>
      {formatMessageDate(message.createdAt)}
    </time>
    <button
      className={message.isStarred ? 'student-messages__star student-messages__star--active' : 'student-messages__star'}
      type="button"
      title={message.isStarred ? 'Quitar de destacados' : 'Marcar como destacado'}
      aria-label={message.isStarred ? 'Quitar de destacados' : 'Marcar como destacado'}
      aria-pressed={message.isStarred}
      onClick={() => onToggleStar(message.id)}
    >
      <Star size={16} />
    </button>
  </li>
)

const StudentMessagesPage = () => {
  const { folder = 'inbox' } = useParams()
  const navigate = useNavigate()
  const { uiVariant } = useConfig()
  const { status: authStatus, user, refreshUser } = useAuth()
  const themeVariant = uiVariant ?? 'v1'
  const isSettingsRoute = folder === 'settings'
  const activeFolder = isSettingsRoute ? 'inbox' : MESSAGE_FOLDERS.includes(folder) ? folder : 'inbox'
  const isStudent = user?.role === 'student'
  const canLoadMessages = authStatus === 'ready' && isStudent
  const [inboxMessages, setInboxMessages] = useState(() => createSampleMessages())
  const [sentMessages, setSentMessages] = useState([])
  const [draftMessages, setDraftMessages] = useState(SAMPLE_DRAFTS)
  const [deletedMessages, setDeletedMessages] = useState([])
  const [starredIds, setStarredIds] = useState(
    () => new Set(createSampleMessages().filter((message) => message.isStarred).map((message) => message.id)),
  )
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [composeDraft, setComposeDraft] = useState({ recipient: '', subject: '', body: '' })
  const listSettings = DEFAULT_LIST_SETTINGS
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const abortControllerRef = useRef(null)

  const loadMessages = useCallback(async () => {
    if (!canLoadMessages) {
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = window.setTimeout(() => controller.abort(), 10000)

    setIsLoading(true)
    setError(null)

    try {
      const [inboxResponse, sentResponse] = await Promise.all([
        apiClient.get('/messages', { params: { per_page: 64 }, signal: controller.signal }),
        apiClient.get('/messages/sent', { params: { per_page: 64 }, signal: controller.signal }),
      ])

      if (controller.signal.aborted) {
        return
      }

      const inboxItems = Array.isArray(inboxResponse.data?.data) ? inboxResponse.data.data : []
      const sentItems = Array.isArray(sentResponse.data?.data) ? sentResponse.data.data : []
      const normalizedInbox = inboxItems.map(normalizeInboxMessage).filter((message) => message.id)
      const normalizedSent = sentItems.map(normalizeSentMessage).filter((message) => message.id)

      setInboxMessages(normalizedInbox)
      setSentMessages(normalizedSent)
      setStarredIds(new Set())
    } catch (requestError) {
      if (requestError?.name === 'CanceledError' || requestError?.code === 'ERR_CANCELED' || controller.signal.aborted) {
        return
      }
      setError(requestError)
    } finally {
      window.clearTimeout(timeoutId)
      if (abortControllerRef.current === controller) {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [canLoadMessages])

  useEffect(() => {
    if (!canLoadMessages) {
      return undefined
    }

    let shouldLoad = true
    window.queueMicrotask(() => {
      if (shouldLoad) {
        loadMessages()
      }
    })

    return () => {
      shouldLoad = false
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    }
  }, [canLoadMessages, loadMessages])

  const allMessages = useMemo(
    () => [...inboxMessages, ...sentMessages, ...draftMessages, ...deletedMessages],
    [deletedMessages, draftMessages, inboxMessages, sentMessages],
  )

  const visibleMessages = useMemo(() => {
    const starredMessages = allMessages.filter((message) => starredIds.has(message.id) || message.isStarred)
    const sourceMessages = {
      inbox: inboxMessages,
      starred: starredMessages,
      sent: sentMessages,
      drafts: draftMessages,
      trash: deletedMessages,
    }[activeFolder] ?? inboxMessages
    const query = normalizeText(search)

    return sourceMessages
      .map((message) => ({ ...message, isStarred: starredIds.has(message.id) || message.isStarred }))
      .filter((message) => {
        if (showUnreadOnly && message.isRead) {
          return false
        }

        if (!query) {
          return true
        }

        return [message.sender, message.title, message.body, message.recipients?.join(' ')]
          .map((value) => normalizeText(value ?? ''))
          .some((value) => value.includes(query))
      })
      .sort((leftMessage, rightMessage) => {
        if (listSettings.unreadFirst && leftMessage.isRead !== rightMessage.isRead) {
          return leftMessage.isRead ? 1 : -1
        }

        const leftDate = parseMessageDate(leftMessage.createdAt)?.getTime() ?? 0
        const rightDate = parseMessageDate(rightMessage.createdAt)?.getTime() ?? 0

        return rightDate - leftDate
      })
  }, [activeFolder, allMessages, deletedMessages, draftMessages, inboxMessages, listSettings.unreadFirst, search, sentMessages, showUnreadOnly, starredIds])

  const pageCount = Math.max(1, Math.ceil(visibleMessages.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginatedMessages = visibleMessages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selectedCount = selectedIds.size
  const allVisibleSelected = paginatedMessages.length > 0 && paginatedMessages.every((message) => selectedIds.has(message.id))

  const handleLoginRedirect = useCallback(() => {
    window.localStorage.setItem('openclassy_redirect', `/student/messages/${activeFolder}`)
    window.location.assign('/login')
  }, [activeFolder])

  const handleRoleRedirect = useCallback(() => {
    window.location.assign(user?.role === 'admin' ? '/admin/settings' : '/')
  }, [user?.role])

  const handleFolderNavigate = useCallback(
    (targetFolder) => {
      setSelectedIds(new Set())
      setPage(1)
      navigate(targetFolder === 'inbox' ? '/student/messages' : `/student/messages/${targetFolder}`)
    },
    [navigate],
  )

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleToggleSelection = (messageId) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(messageId)) {
        nextIds.delete(messageId)
      } else {
        nextIds.add(messageId)
      }

      return nextIds
    })
  }

  const handleTogglePageSelection = () => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      paginatedMessages.forEach((message) => {
        if (allVisibleSelected) {
          nextIds.delete(message.id)
        } else {
          nextIds.add(message.id)
        }
      })

      return nextIds
    })
  }

  const updateInboxMessage = useCallback((messageId, updater) => {
    setInboxMessages((currentMessages) =>
      currentMessages.map((message) => (message.id === messageId ? updater(message) : message)),
    )
  }, [])

  const handleOpenMessage = useCallback(
    async (message) => {
      if (activeFolder !== 'inbox' || message.isRead) {
        return
      }

      updateInboxMessage(message.id, (currentMessage) => ({ ...currentMessage, isRead: true }))

      if (!isPersistentMessage(message.id)) {
        return
      }

      try {
        await apiClient.patch(`/messages/${message.id}/read`)
      } catch (requestError) {
        setError(requestError)
        updateInboxMessage(message.id, (currentMessage) => ({ ...currentMessage, isRead: false }))
      }
    },
    [activeFolder, updateInboxMessage],
  )

  const handleToggleStar = (messageId) => {
    setStarredIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(messageId)) {
        nextIds.delete(messageId)
      } else {
        nextIds.add(messageId)
      }

      return nextIds
    })
  }

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedCount) {
      handleFolderNavigate('trash')
      return
    }

    const idsToDelete = new Set(selectedIds)
    const messagesToDelete = inboxMessages.filter((message) => idsToDelete.has(message.id))

    setInboxMessages((currentMessages) => currentMessages.filter((message) => !idsToDelete.has(message.id)))
    setDeletedMessages((currentMessages) => [...messagesToDelete, ...currentMessages])
    setSelectedIds(new Set())

    const persistentIds = messagesToDelete.map((message) => message.id).filter(isPersistentMessage)
    if (!persistentIds.length) {
      return
    }

    const results = await Promise.allSettled(persistentIds.map((messageId) => apiClient.delete(`/messages/${messageId}`)))
    const hasRejectedRequest = results.some((result) => result.status === 'rejected')

    if (hasRejectedRequest) {
      setError(new Error('No se pudieron eliminar todos los mensajes.'))
    }
  }, [handleFolderNavigate, inboxMessages, selectedCount, selectedIds])

  const handleSaveDraft = () => {
    const hasDraftContent = composeDraft.recipient.trim() || composeDraft.subject.trim() || composeDraft.body.trim()

    if (!hasDraftContent) {
      return
    }

    setDraftMessages((currentDrafts) => [
      {
        id: `draft-message-${Date.now()}`,
        sender: 'Borrador',
        recipients: composeDraft.recipient ? [composeDraft.recipient] : [],
        title: composeDraft.subject || 'Sin asunto',
        body: composeDraft.body || 'Mensaje sin contenido.',
        createdAt: new Date().toISOString(),
        isRead: true,
        isStarred: false,
        source: 'draft',
      },
      ...currentDrafts,
    ])
    setComposeDraft({ recipient: '', subject: '', body: '' })
    handleFolderNavigate('drafts')
  }

  const renderMessageList = () => (
    <>
      {isLoading ? (
        <div className="student-messages__state">
          <Skeleton variant="row" lines={6} label="Cargando mensajes" />
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="student-messages__notice" role="status">
          <span>No se pudieron sincronizar los mensajes.</span>
          <button className="student-messages__notice-action" type="button" onClick={loadMessages}>
            <RefreshCcw size={15} aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : null}

      {!isLoading && !paginatedMessages.length ? (
        <EmptyState title="Sin mensajes" text="No hay mensajes en esta carpeta." tone="ok" />
      ) : null}

      {paginatedMessages.length ? (
        <ul className={listSettings.compactRows ? 'student-messages__list student-messages__list--compact' : 'student-messages__list'}>
          {paginatedMessages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              isSelected={selectedIds.has(message.id)}
              onSelect={handleToggleSelection}
              onOpen={handleOpenMessage}
              onToggleStar={handleToggleStar}
            />
          ))}
        </ul>
      ) : null}

      {visibleMessages.length > PAGE_SIZE ? (
        <nav className="student-messages__pagination" aria-label="Paginacion de mensajes">
          <button
            className="student-messages__page-button"
            type="button"
            title="Pagina anterior"
            aria-label="Pagina anterior"
            disabled={currentPage === 1}
            onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
          >
            <ChevronLeft size={15} />
          </button>
          {getPaginationItems(pageCount).map((paginationItem) =>
            paginationItem === 'ellipsis' ? (
              <span key="ellipsis" className="student-messages__page-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={paginationItem}
                className={
                  currentPage === paginationItem
                    ? 'student-messages__page-button student-messages__page-button--active'
                    : 'student-messages__page-button'
                }
                type="button"
                aria-current={currentPage === paginationItem ? 'page' : undefined}
                onClick={() => setPage(paginationItem)}
              >
                {paginationItem}
              </button>
            ),
          )}
          <button
            className="student-messages__page-button"
            type="button"
            title="Pagina siguiente"
            aria-label="Pagina siguiente"
            disabled={currentPage === pageCount}
            onClick={() => setPage((currentValue) => Math.min(pageCount, currentValue + 1))}
          >
            <ChevronRight size={15} />
          </button>
        </nav>
      ) : null}
    </>
  )

  const renderComposer = () => (
    <section className="student-messages__composer" aria-label="Redactar mensaje">
      <label className="student-messages__field">
        <span>Para</span>
        <input
          type="text"
          value={composeDraft.recipient}
          onChange={(event) => setComposeDraft((currentDraft) => ({ ...currentDraft, recipient: event.target.value }))}
        />
      </label>
      <label className="student-messages__field">
        <span>Asunto</span>
        <input
          type="text"
          value={composeDraft.subject}
          onChange={(event) => setComposeDraft((currentDraft) => ({ ...currentDraft, subject: event.target.value }))}
        />
      </label>
      <label className="student-messages__field student-messages__field--body">
        <span>Mensaje</span>
        <textarea
          rows="8"
          value={composeDraft.body}
          onChange={(event) => setComposeDraft((currentDraft) => ({ ...currentDraft, body: event.target.value }))}
        />
      </label>
      <div className="student-messages__composer-actions">
        <button className="student-messages__secondary-action" type="button" onClick={handleSaveDraft}>
          Guardar borrador
        </button>
        <button className="student-messages__primary-action" type="button" onClick={handleSaveDraft}>
          Enviar
        </button>
      </div>
    </section>
  )

  const renderContent = () => {
    if (activeFolder === 'new') {
      return renderComposer()
    }

    return renderMessageList()
  }

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false)

    if (isSettingsRoute) {
      navigate('/student/messages', { replace: true })
    }
  }

  if (authStatus === 'loading') {
    return (
      <StudentLayout variant={themeVariant} showSidebar={false}>
        <section className="student-messages">
          <div className="student-messages__state">
            <Skeleton lines={3} label="Validando sesión" />
          </div>
        </section>
      </StudentLayout>
    )
  }

  if (authStatus === 'error') {
    return (
      <StudentLayout variant={themeVariant} showSidebar={false}>
        <section className="student-messages">
          <EmptyState title="Error de sesion" text="No se pudo validar la sesion actual." actionLabel="Reintentar" onAction={refreshUser} tone="error" />
        </section>
      </StudentLayout>
    )
  }

  if (authStatus === 'anonymous') {
    return (
      <StudentLayout variant={themeVariant} showSidebar={false}>
        <section className="student-messages">
          <EmptyState
            title="Acceso restringido"
            text="Necesitas iniciar sesion como estudiante para ver tus mensajes."
            actionLabel="Iniciar sesion"
            onAction={handleLoginRedirect}
            tone="error"
          />
        </section>
      </StudentLayout>
    )
  }

  if (!isStudent) {
    return (
      <StudentLayout variant={themeVariant} showSidebar={false}>
        <section className="student-messages">
          <EmptyState
            title="Sin permisos"
            text="Tu cuenta no tiene permisos de estudiante."
            actionLabel={user?.role === 'admin' ? 'Ir al panel admin' : 'Ir al inicio'}
            onAction={handleRoleRedirect}
            tone="error"
          />
        </section>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout variant={themeVariant} showSidebar={false}>
      <section className="student-messages" aria-label={FOLDER_LABELS[activeFolder]}>
        <h1 className="u-visually-hidden">{FOLDER_LABELS[activeFolder]}</h1>

        <div className="student-messages__toolbar" aria-label="Herramientas de mensajes">
          <div className="student-messages__search-group">
            <label className="student-messages__search">
              <Search size={15} aria-hidden="true" />
              <input type="search" placeholder="Buscador" value={search} onChange={handleSearchChange} />
            </label>
            <button
              className={showUnreadOnly ? 'student-messages__icon-button student-messages__icon-button--active' : 'student-messages__icon-button'}
              type="button"
              title="Filtrar no leidos"
              aria-label="Filtrar no leidos"
              aria-pressed={showUnreadOnly}
              onClick={() => {
                setShowUnreadOnly((currentValue) => !currentValue)
                setPage(1)
              }}
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          <label className="student-messages__select-all" title="Seleccionar mensajes visibles">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              disabled={!paginatedMessages.length || activeFolder === 'new'}
              aria-label="Seleccionar mensajes visibles"
              onChange={handleTogglePageSelection}
            />
            {allVisibleSelected ? <Check size={14} aria-hidden="true" /> : null}
            <ChevronDown size={14} aria-hidden="true" />
          </label>

          <div className="student-messages__folder-actions">
            <button className="student-messages__text-button" type="button" onClick={() => handleFolderNavigate('new')}>
              Nuevo mensaje
            </button>
            <button
              className={activeFolder === 'inbox' ? 'student-messages__text-button student-messages__text-button--active' : 'student-messages__text-button'}
              type="button"
              aria-current={activeFolder === 'inbox' ? 'page' : undefined}
              onClick={() => handleFolderNavigate('inbox')}
            >
              <Inbox size={15} aria-hidden="true" />
              Bandeja de entrada
            </button>
            {QUICK_FOLDERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={activeFolder === id ? 'student-messages__icon-button student-messages__icon-button--active' : 'student-messages__icon-button'}
                type="button"
                title={label}
                aria-label={label}
                aria-current={activeFolder === id ? 'page' : undefined}
                onClick={() => handleFolderNavigate(id)}
              >
                <Icon size={15} />
              </button>
            ))}
            <button
              className={activeFolder === 'trash' ? 'student-messages__icon-button student-messages__icon-button--active' : 'student-messages__icon-button'}
              type="button"
              title={selectedCount ? 'Eliminar seleccionados' : FOLDER_LABELS.trash}
              aria-label={selectedCount ? 'Eliminar seleccionados' : FOLDER_LABELS.trash}
              aria-current={activeFolder === 'trash' ? 'page' : undefined}
              onClick={handleDeleteSelected}
            >
              <Trash2 size={15} />
            </button>
            {selectedCount ? <span className="student-messages__selected-count">{selectedCount}</span> : null}
          </div>

          <button
            className={isSettingsModalOpen || isSettingsRoute ? 'student-messages__icon-button student-messages__icon-button--active' : 'student-messages__icon-button'}
            type="button"
            title={FOLDER_LABELS.settings}
            aria-label={FOLDER_LABELS.settings}
            aria-haspopup="dialog"
            aria-expanded={isSettingsModalOpen || isSettingsRoute}
            onClick={() => {
              setSelectedIds(new Set())
              setPage(1)
              setIsSettingsModalOpen(true)
            }}
          >
            <Settings size={17} />
          </button>
        </div>

        {selectedCount ? (
          <div className="student-messages__selection-bar" role="status">
            <span>{selectedCount} seleccionados</span>
            <button className="student-messages__selection-action" type="button" onClick={() => setSelectedIds(new Set())}>
              Limpiar
            </button>
            <button
              className="student-messages__selection-action"
              type="button"
              onClick={() => {
                selectedIds.forEach((messageId) => updateInboxMessage(messageId, (message) => ({ ...message, isRead: true })))
                setSelectedIds(new Set())
              }}
            >
              <MailOpen size={15} aria-hidden="true" />
              Leidos
            </button>
          </div>
        ) : null}

        {renderContent()}
      </section>
      <MessageSettingsModal isOpen={isSettingsModalOpen || isSettingsRoute} onClose={handleCloseSettingsModal} />
    </StudentLayout>
  )
}

export default StudentMessagesPage