import axios from 'axios'

const DEFAULT_API_URL = 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? DEFAULT_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})
