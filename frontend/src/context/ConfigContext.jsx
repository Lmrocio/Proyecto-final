import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../services/apiClient'

const ConfigContext = createContext(null)

const COLOR_TO_CSS_VAR = {
  primary: '--primary',
  primary_contrast: '--primary-contrast',
  surface: '--surface',
  surface_strong: '--surface-strong',
  text_main: '--text-main',
  text_muted: '--text-muted',
  danger: '--danger',
  ok: '--ok',
}

const normalizeVariant = (variant) => {
  if (variant === 'v2' || variant === 'v3') {
    return variant
  }

  return 'v1'
}

const applyTheme = (config) => {
  if (!config?.colors) {
    return
  }

  const root = document.documentElement

  Object.entries(COLOR_TO_CSS_VAR).forEach(([key, cssVar]) => {
    const value = config.colors[key]
    if (value) {
      root.style.setProperty(cssVar, value)
    }
  })

  if (config.theme_name) {
    root.dataset.theme = config.theme_name
  }
}

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)

  const refreshConfig = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const { data } = await apiClient.get('/site-config')
      const payload = data?.config ?? null

      if (!payload) {
        setConfig(null)
        setStatus('empty')
        return
      }

      setConfig(payload)
      setStatus('ready')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [])

  const updateUiVariant = useCallback(async (variant) => {
    setUpdating(true)

    try {
      const { data } = await apiClient.put('/admin/settings', {
        ui_variant: normalizeVariant(variant),
      })

      const payload = data?.config ?? null
      if (!payload) {
        return { ok: false, reason: 'empty' }
      }

      setConfig(payload)
      return { ok: true }
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        return { ok: false, reason: 'unauthorized', status }
      }

      if (status === 403) {
        return { ok: false, reason: 'forbidden', status }
      }

      return { ok: false, reason: 'error', status, error: err }
    } finally {
      setUpdating(false)
    }
  }, [])

  useEffect(() => {
    refreshConfig()
  }, [refreshConfig])

  useEffect(() => {
    applyTheme(config)
  }, [config])

  const value = useMemo(
    () => ({
      config,
      status,
      error,
      updating,
      refreshConfig,
      updateUiVariant,
      uiVariant: normalizeVariant(config?.ui_variant),
    }),
    [config, status, error, updating, refreshConfig, updateUiVariant],
  )

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export const useConfig = () => {
  const context = useContext(ConfigContext)

  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider')
  }

  return context
}
