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
