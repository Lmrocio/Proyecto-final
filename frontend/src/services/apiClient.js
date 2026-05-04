import axios from 'axios'

const DEFAULT_API_URL = 'http://localhost:8000'

const rawApiUrl = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL
const normalizedApiUrl = rawApiUrl.replace(/\/$/, '')
const baseURL = normalizedApiUrl.endsWith('/api') ? normalizedApiUrl : `${normalizedApiUrl}/api`

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

const TOKEN_STORAGE_KEY = 'openclassy_auth_token'

export const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }

  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
}

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  delete apiClient.defaults.headers.common.Authorization
}

const storedToken = getStoredToken()
if (storedToken) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${storedToken}`
}
