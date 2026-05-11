import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient, clearAuthToken, getStoredToken, setAuthToken } from '../services/apiClient'
import { AuthContext } from './authContext'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(getStoredToken() ? 'loading' : 'anonymous')
  const [error, setError] = useState(null)

  const setSession = useCallback((payload) => {
    if (payload?.token) {
      setAuthToken(payload.token)
    }

    if (payload?.user) {
      setUser(payload.user)
      setStatus('ready')
      setError(null)
      return
    }

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
      const { data } = await apiClient.get('/auth/user')
      setUser(data)
      setStatus('ready')
    } catch (err) {
      const code = err?.response?.status

      if (code === 401 || code === 403) {
        clearAuthToken()
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
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    if (!getStoredToken()) {
      return undefined
    }

    let isMounted = true

    const loadStoredUser = async () => {
      try {
        const { data } = await apiClient.get('/auth/user')

        if (!isMounted) {
          return
        }

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
          setUser(null)
          setStatus('anonymous')
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
