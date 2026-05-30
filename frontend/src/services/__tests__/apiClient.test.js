import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  apiClient,
  clearAuthToken,
  getStoredToken,
  setAuthToken,
} from '../apiClient'

const TOKEN_STORAGE_KEY = 'openclassy_auth_token'

describe('apiClient auth helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete apiClient.defaults.headers.common.Authorization
  })

  afterEach(() => {
    window.localStorage.clear()
    delete apiClient.defaults.headers.common.Authorization
  })

  it('persiste el token y configura la cabecera Authorization', () => {
    setAuthToken('abc.123')

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('abc.123')
    expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer abc.123')
  })

  it('recupera el token almacenado', () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'stored-token')

    expect(getStoredToken()).toBe('stored-token')
  })

  it('elimina el token y la cabecera al cerrar sesion', () => {
    setAuthToken('to-be-removed')

    clearAuthToken()

    expect(getStoredToken()).toBeNull()
    expect(apiClient.defaults.headers.common.Authorization).toBeUndefined()
  })

  it('usa una baseURL que termina en /api', () => {
    expect(apiClient.defaults.baseURL.endsWith('/api')).toBe(true)
  })
})
