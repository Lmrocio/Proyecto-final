import { useMemo } from 'react'
import { useConfig } from '../context/configContext'
import { getInitials } from '../lib/branding'

const DEFAULT_BRANDING = {
  site_name: 'OpenClassy',
  logo_type: 'text',
  logo_img_url: null,
  isotype_img_url: null,
}

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(' ')

const normalizeBranding = (branding) => {
  if (!branding || typeof branding !== 'object') {
    return DEFAULT_BRANDING
  }

  const siteName = typeof branding.site_name === 'string' ? branding.site_name.trim() : ''

  return {
    site_name: siteName || DEFAULT_BRANDING.site_name,
    logo_type: branding.logo_type === 'image' ? 'image' : 'text',
    logo_img_url: typeof branding.logo_img_url === 'string' && branding.logo_img_url.trim() ? branding.logo_img_url.trim() : null,
    isotype_img_url:
      typeof branding.isotype_img_url === 'string' && branding.isotype_img_url.trim() ? branding.isotype_img_url.trim() : null,
  }
}

const Brand = ({
  mode = 'logo',
  brandingOverride = null,
  className = '',
  textClassName = '',
  imageClassName = '',
  initialsClassName = '',
}) => {
  const { branding } = useConfig()
  const resolvedBranding = useMemo(
    () => normalizeBranding(brandingOverride ?? branding),
    [branding, brandingOverride],
  )

  if (mode === 'isotype') {
    if (resolvedBranding.isotype_img_url) {
      return (
        <span className={joinClassNames('brand', 'brand--isotype', className)}>
          <img
            className={joinClassNames('brand__image', 'brand__image--isotype', imageClassName)}
            src={resolvedBranding.isotype_img_url}
            alt={`Isotipo de ${resolvedBranding.site_name}`}
          />
        </span>
      )
    }

    return (
      <span className={joinClassNames('brand', 'brand--isotype', className)} aria-label={`Iniciales de ${resolvedBranding.site_name}`}>
        <span className={joinClassNames('brand__initials', initialsClassName)}>{getInitials(resolvedBranding.site_name)}</span>
      </span>
    )
  }

  if (resolvedBranding.logo_type === 'image' && resolvedBranding.logo_img_url) {
    return (
      <span className={joinClassNames('brand', 'brand--logo', className)}>
        <img
          className={joinClassNames('brand__image', 'brand__image--logo', imageClassName)}
          src={resolvedBranding.logo_img_url}
          alt={`Logotipo de ${resolvedBranding.site_name}`}
        />
      </span>
    )
  }

  return (
    <span className={joinClassNames('brand', 'brand--text', className)}>
      <span className={joinClassNames('brand__name', textClassName)}>{resolvedBranding.site_name}</span>
    </span>
  )
}

export default Brand