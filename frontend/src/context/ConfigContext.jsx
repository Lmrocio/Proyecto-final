import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../services/apiClient'
import { ConfigContext } from './configContext'

const CONFIG_STORAGE_KEY = 'openclassy_site_config'
let siteConfigRequest = null

const fetchSiteConfig = () => {
  if (!siteConfigRequest) {
    siteConfigRequest = apiClient.get('/site-config').finally(() => {
      siteConfigRequest = null
    })
  }

  return siteConfigRequest
}

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

const DEFAULT_BRANDING = {
  site_name: 'OpenClassy',
  logo_type: 'text',
  logo_img_url: null,
  isotype_img_url: null,
}

const normalizeVariant = (variant) => {
  if (variant === 'v2' || variant === 'v3') {
    return variant
  }

  return 'v1'
}

const normalizeNullableString = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  return normalizedValue === '' ? null : normalizedValue
}

const normalizeBranding = (branding) => {
  if (!branding || typeof branding !== 'object') {
    return DEFAULT_BRANDING
  }

  const siteName = typeof branding.site_name === 'string' ? branding.site_name.trim() : ''

  return {
    site_name: siteName || DEFAULT_BRANDING.site_name,
    logo_type: branding.logo_type === 'image' ? 'image' : 'text',
    logo_img_url: normalizeNullableString(branding.logo_img_url),
    isotype_img_url: normalizeNullableString(branding.isotype_img_url),
  }
}

const normalizeConfig = (config) => {
  if (!config) {
    return null
  }

  return {
    ...config,
    ui_variant: normalizeVariant(config.ui_variant),
    branding: normalizeBranding(config.branding),
  }
}

const getStoredConfig = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const storedConfig = window.localStorage.getItem(CONFIG_STORAGE_KEY)
  if (!storedConfig) {
    return null
  }

  try {
    return normalizeConfig(JSON.parse(storedConfig))
  } catch {
    window.localStorage.removeItem(CONFIG_STORAGE_KEY)
    return null
  }
}

const storeConfig = (config) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizeConfig(config)))
  }
}

const clearStoredConfig = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CONFIG_STORAGE_KEY)
  }
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
  const [config, setConfig] = useState(getStoredConfig)
  const [status, setStatus] = useState(getStoredConfig() ? 'ready' : 'loading')
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)

  const refreshConfig = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const { data } = await fetchSiteConfig()
      const payload = normalizeConfig(data?.config ?? null)

      if (!payload) {
        clearStoredConfig()
        setConfig(null)
        setStatus('empty')
        return
      }

      storeConfig(payload)
      setConfig(payload)
      setStatus('ready')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [])

  const updateSiteConfig = useCallback(async (payload) => {
    setUpdating(true)

    try {
      const requestPayload = {
        ui_variant: normalizeVariant(payload?.ui_variant),
      }

      if (payload?.branding) {
        requestPayload.branding = normalizeBranding(payload.branding)
      }

      const { data } = await apiClient.put('/admin/settings', requestPayload)

      const nextConfig = normalizeConfig(data?.config ?? null)
      if (!nextConfig) {
        return { ok: false, reason: 'empty' }
      }

      storeConfig(nextConfig)
      setConfig(nextConfig)
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

  const updateUiVariant = useCallback(
    async (variant) => updateSiteConfig({ ui_variant: variant }),
    [updateSiteConfig],
  )

  useEffect(() => {
    let isMounted = true
    const hasCachedConfig = Boolean(getStoredConfig())

    const loadConfig = async () => {
      try {
        const { data } = await fetchSiteConfig()
        const payload = normalizeConfig(data?.config ?? null)

        if (!isMounted) {
          return
        }

        if (!payload) {
          clearStoredConfig()
          setConfig(null)
          setStatus('empty')
          return
        }

        storeConfig(payload)
        setConfig(payload)
        setStatus('ready')
      } catch (err) {
        if (!isMounted) {
          return
        }

        if (hasCachedConfig) {
          setStatus('ready')
          setError(err)
          return
        }

        setError(err)
        setStatus('error')
      }
    }

    loadConfig()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    applyTheme(config)
  }, [config])

  const value = useMemo(
    () => ({
      config,
      status,
      error,
      updating,
      branding: normalizeBranding(config?.branding),
      refreshConfig,
      updateSiteConfig,
      updateUiVariant,
      uiVariant: normalizeVariant(config?.ui_variant),
    }),
    [config, status, error, updating, refreshConfig, updateSiteConfig, updateUiVariant],
  )

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}
