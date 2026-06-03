import { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import Brand from '../../components/Brand'
import EmptyState from '../../components/EmptyState'
import { useConfig } from '../../context/configContext'
import { getInitials } from '../../lib/branding'

const VARIANTS = [
  { id: 'v1', title: 'Tema Orgánico (V1)', description: 'Layout clásico con paleta en tonos tierra.' },
  { id: 'v2', title: 'Tema Institucional (V2)', description: 'Layout dividido con paleta teal.' },
  { id: 'v3', title: 'Tema Neón (V3)', description: 'Layout glassmorphism con acentos azules.' },
]

const buildBrandingForm = (branding) => ({
  site_name: branding?.site_name ?? 'OpenClassy',
  logo_type: branding?.logo_type === 'image' ? 'image' : 'text',
  logo_img_url: branding?.logo_img_url ?? '',
  isotype_img_url: branding?.isotype_img_url ?? '',
})

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('invalid_file_result'))
    }

    reader.onerror = () => reject(new Error('file_read_error'))
    reader.readAsDataURL(file)
  })

const AdminAppearance = () => {
  const { branding, uiVariant, status, refreshConfig, updateSiteConfig, updateUiVariant, updating } = useConfig()
  const [feedback, setFeedback] = useState('')
  const [brandingDraft, setBrandingDraft] = useState(null)
  const activeVariant = useMemo(() => uiVariant ?? 'v1', [uiVariant])
  const brandingForm = useMemo(() => buildBrandingForm(branding), [branding])
  const currentBranding = brandingDraft ?? brandingForm
  const liveInitials = useMemo(() => getInitials(currentBranding.site_name), [currentBranding.site_name])

  const updateBrandingField = (field, value) => {
    setBrandingDraft((currentDraft) => ({
      ...(currentDraft ?? brandingForm),
      [field]: value,
    }))
  }

  const handleSelectTheme = async (variantId) => {
    setFeedback('Actualizando configuración...')
    const result = await updateUiVariant(variantId)
    setFeedback(result.ok ? 'Configuración guardada correctamente.' : 'No se pudo guardar el tema.')
  }

  const handleBrandingSubmit = async (event) => {
    event.preventDefault()
    setFeedback('Guardando identidad de marca...')

    const result = await updateSiteConfig({
      ui_variant: activeVariant,
      branding: currentBranding,
    })

    if (result.ok) {
      setBrandingDraft(null)
      setFeedback('Marca guardada correctamente.')
      return
    }

    setFeedback('No se pudo guardar la marca.')
  }

  const handleAssetUpload = (field) => async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const assetUrl = await readFileAsDataUrl(file)
      updateBrandingField(field, assetUrl)
      setFeedback(`Archivo "${file.name}" cargado localmente. Guarda la configuración para aplicarlo.`)
    } catch {
      setFeedback('No se pudo leer el archivo seleccionado.')
    } finally {
      event.target.value = ''
    }
  }

  if (status === 'loading') {
    return <section className="management__section" aria-busy="true">Cargando configuración...</section>
  }

  if (status === 'error' || status === 'empty') {
    return <EmptyState title="Sin configuración" text="No hay datos de configuración visual disponibles." actionLabel="Reintentar" onAction={refreshConfig} tone="error" />
  }

  return (
    <section className="management management__page" aria-labelledby="admin-appearance-title">
      <header className="management__header">
        <div><p className="management__eyebrow">Apariencia</p><h1 className="management__title" id="admin-appearance-title">Tema global y marca</h1><p className="management__subtitle">Configura la variante visual y la identidad de marca con fallback tipográfico e isotipo automático.</p></div>
      </header>
      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      <section className="settings__panel management__section"><div className="settings__grid">{VARIANTS.map((variant) => { const isActive = activeVariant === variant.id; return <button key={variant.id} className={`settings__card ${isActive ? 'settings__card--active' : ''}`} type="button" onClick={() => handleSelectTheme(variant.id)} aria-pressed={isActive} disabled={updating}><span className="settings__card-title">{variant.title}</span><span className="settings__card-text">{variant.description}</span><span className="settings__card-meta">{isActive ? 'Activo' : 'Seleccionar'}</span></button> })}</div></section>
      <form className="management__section admin-branding" onSubmit={handleBrandingSubmit}>
        <div className="management__section-header">
          <div>
            <h2 className="management__section-title">Marca blanca</h2>
            <p className="management__subtitle">Prioriza logo e isotipo, y cae a tipografía o iniciales cuando no exista un activo gráfico.</p>
          </div>
          <button className="management__button management__button--primary" type="submit" disabled={updating}>
            <Save size={16} aria-hidden="true" />
            Guardar marca
          </button>
        </div>

        <div className="management__grid">
          <label className="management__field">
            <span>Nombre del sitio</span>
            <input
              name="site_name"
              value={currentBranding.site_name}
              onChange={(event) => updateBrandingField('site_name', event.target.value)}
              required
            />
          </label>

          <label className="management__field">
            <span>Tipo de logotipo</span>
            <select
              name="logo_type"
              value={currentBranding.logo_type}
              onChange={(event) => updateBrandingField('logo_type', event.target.value)}
            >
              <option value="text">Solo texto</option>
              <option value="image">Logo de imagen</option>
            </select>
          </label>

          <label className="management__field management__field--wide">
            <span>URL del logo</span>
            <input
              name="logo_img_url"
              type="url"
              placeholder="https://cdn.tuacademia.com/logo.svg o carga un archivo"
              value={currentBranding.logo_img_url}
              onChange={(event) => updateBrandingField('logo_img_url', event.target.value)}
            />
          </label>

          <label className="management__field">
            <span>Cargar logo</span>
            <input type="file" accept="image/*" onChange={handleAssetUpload('logo_img_url')} />
          </label>

          <label className="management__field management__field--wide">
            <span>URL del isotipo</span>
            <input
              name="isotype_img_url"
              type="url"
              placeholder="https://cdn.tuacademia.com/isotipo.svg o carga un archivo"
              value={currentBranding.isotype_img_url}
              onChange={(event) => updateBrandingField('isotype_img_url', event.target.value)}
            />
          </label>

          <label className="management__field">
            <span>Cargar isotipo</span>
            <input type="file" accept="image/*" onChange={handleAssetUpload('isotype_img_url')} />
          </label>
        </div>

        <div className="admin-branding__actions">
          <button className="management__button management__button--secondary" type="button" onClick={() => updateBrandingField('logo_img_url', '')}>
            Limpiar logo
          </button>
          <button className="management__button management__button--secondary" type="button" onClick={() => updateBrandingField('isotype_img_url', '')}>
            Limpiar isotipo
          </button>
          <button className="management__button management__button--secondary" type="button" onClick={() => setBrandingDraft(brandingForm)}>
            Restaurar valores actuales
          </button>
        </div>

        <section className="admin-branding__preview" aria-labelledby="admin-branding-preview-title">
          <div>
            <p className="management__eyebrow">Live Preview</p>
            <h3 className="management__section-title" id="admin-branding-preview-title">Fallback de marca en vivo</h3>
            <p className="management__subtitle">Si faltan imágenes, el sistema usa el nombre de la academia o las iniciales generadas automáticamente.</p>
          </div>
          <div className="admin-branding__preview-grid">
            <div className="admin-branding__preview-card">
              <span className="admin-branding__preview-label">Logotipo</span>
              <Brand brandingOverride={currentBranding} className="admin-branding__brand-mark" textClassName="admin-branding__brand-name" imageClassName="admin-branding__brand-logo" />
            </div>
            <div className="admin-branding__preview-card">
              <span className="admin-branding__preview-label">Isotipo</span>
              <Brand brandingOverride={currentBranding} mode="isotype" className="admin-branding__isotype-wrap" imageClassName="admin-branding__isotype-image" initialsClassName="admin-branding__initials" />
            </div>
            <div className="admin-branding__preview-card admin-branding__preview-card--meta">
              <span className="admin-branding__preview-label">Iniciales generadas</span>
              <strong>{liveInitials}</strong>
              <p className="management__subtitle">Se calculan a partir de {currentBranding.site_name || 'OpenClassy'}.</p>
            </div>
          </div>
        </section>
      </form>
    </section>
  )
}

export default AdminAppearance