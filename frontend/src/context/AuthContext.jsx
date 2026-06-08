import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient, clearAuthToken, getStoredToken, setAuthToken } from '../services/apiClient'
import { AuthContext } from './authContext'

const USER_STORAGE_KEY = 'openclassy_auth_user'
let authenticatedUserRequest = null

const fetchAuthenticatedUser = () => {
  if (!authenticatedUserRequest) {
    authenticatedUserRequest = apiClient.get('/auth/user').finally(() => {
      authenticatedUserRequest = null
    })
  }

  return authenticatedUserRequest
}

const getStoredUser = () => {
  if (typeof window === 'undefined' || !getStoredToken()) {
    return null
  }

  const storedUser = window.localStorage.getItem(USER_STORAGE_KEY)
  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

const storeUser = (user) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }
}

const clearStoredUser = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(USER_STORAGE_KEY)
  }
}

const getInitialUser = () => getStoredUser()

const getInitialStatus = () => {
  if (!getStoredToken()) {
    return 'anonymous'
  }

  return getStoredUser() ? 'ready' : 'loading'
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser)
  const [status, setStatus] = useState(getInitialStatus)
  const [error, setError] = useState(null)

  const setSession = useCallback((payload) => {
    if (payload?.token) {
      setAuthToken(payload.token)
    }

    if (payload?.user) {
      storeUser(payload.user)
      setUser(payload.user)
      setStatus('ready')
      setError(null)
      return
    }

    clearStoredUser()
    setUser(null)
    setStatus(getStoredToken() ? 'loading' : 'anonymous')
  }, [])

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null)
      setStatus('anonymous')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const { data } = await fetchAuthenticatedUser()
      storeUser(data)
      setUser(data)
      setStatus('ready')
    } catch (err) {
      const code = err?.response?.status

      if (code === 401 || code === 403) {
        clearAuthToken()
        clearStoredUser()
        setUser(null)
        setStatus('anonymous')
        return
      }

      setStatus('error')
      setError(err)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignore network errors on logout
    }

    clearAuthToken()
    clearStoredUser()
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    if (!getStoredToken()) {
      return undefined
    }

    let isMounted = true
    const hasCachedUser = Boolean(getStoredUser())

    const loadStoredUser = async () => {
      try {
        const { data } = await fetchAuthenticatedUser()

        if (!isMounted) {
          return
        }

        storeUser(data)
        setUser(data)
        setStatus('ready')
        setError(null)
      } catch (err) {
        if (!isMounted) {
          return
        }

        const code = err?.response?.status

        if (code === 401 || code === 403) {
          clearAuthToken()
          clearStoredUser()
          setUser(null)
          setStatus('anonymous')
          return
        }

        if (hasCachedUser) {
          setStatus('ready')
          setError(err)
          return
        }

        setStatus('error')
        setError(err)
      }
    }

    loadStoredUser()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      setSession,
      refreshUser,
      logout,
    }),
    [user, status, error, setSession, refreshUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
