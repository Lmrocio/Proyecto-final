import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/authContext'
import { apiClient } from '../services/apiClient'

const EMPTY_NOTIFICATIONS = []

const normalizeNotification = (notification) => {
  const senderName = notification?.sender?.name ?? 'OpenClassy'

  return {
    id: notification?.id,
    title: notification?.title ?? `Mensaje de ${senderName}`,
    body: notification?.body ?? '',
    is_read: Boolean(notification?.is_read ?? notification?.pivot?.is_read),
    read_at: notification?.read_at ?? notification?.pivot?.read_at ?? null,
    created_at: notification?.created_at ?? null,
    sender: notification?.sender ?? null,
  }
}

export const useNotifications = () => {
  const { status: authStatus, user } = useAuth()
  const canLoad = authStatus === 'ready' && Boolean(user)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadNotifications = useCallback(async () => {
    if (!canLoad) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data } = await apiClient.get('/messages')
      const items = Array.isArray(data?.data) ? data.data : []
      setNotifications(items.map(normalizeNotification).filter((item) => item.id))
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [canLoad])

  useEffect(() => {
    if (!canLoad) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      loadNotifications()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [canLoad, loadNotifications])

  const markAllAsRead = useCallback(async () => {
    await apiClient.patch('/messages/read-all')
    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })))
  }, [])

  const markAsRead = useCallback(async (notificationId) => {
    const { data } = await apiClient.patch(`/messages/${notificationId}/read`)
    const updatedNotification = data?.notification ? normalizeNotification(data.notification) : null

    setNotifications((current) =>
      current.map((notification) => {
        if (notification.id !== notificationId) {
          return notification
        }

        return updatedNotification?.id ? updatedNotification : { ...notification, is_read: true }
      }),
    )
  }, [])

  const deleteNotification = useCallback(async (notificationId) => {
    await apiClient.delete(`/messages/${notificationId}`)
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId))
  }, [])

  const visibleNotifications = canLoad ? notifications : EMPTY_NOTIFICATIONS

  const unreadCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.is_read).length,
    [visibleNotifications],
  )

  return {
    notifications: visibleNotifications,
    unreadCount,
    isLoading: canLoad && isLoading,
    error: canLoad ? error : null,
    loadNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  }
}