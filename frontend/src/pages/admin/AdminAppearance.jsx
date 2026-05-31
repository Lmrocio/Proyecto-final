import { useMemo, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { useConfig } from '../../context/configContext'

const VARIANTS = [
  { id: 'v1', title: 'Tema Orgánico (V1)', description: 'Layout clásico con paleta en tonos tierra.' },
  { id: 'v2', title: 'Tema Institucional (V2)', description: 'Layout dividido con paleta teal.' },
  { id: 'v3', title: 'Tema Neón (V3)', description: 'Layout glassmorphism con acentos azules.' },
]

const AdminAppearance = () => {
  const { uiVariant, status, refreshConfig, updateUiVariant, updating } = useConfig()
  const [feedback, setFeedback] = useState('')
  const activeVariant = useMemo(() => uiVariant ?? 'v1', [uiVariant])

  const handleSelectTheme = async (variantId) => {
    setFeedback('Actualizando configuración...')
    const result = await updateUiVariant(variantId)
    setFeedback(result.ok ? 'Configuración guardada correctamente.' : 'No se pudo guardar el tema.')
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
        <div><p className="management__eyebrow">Apariencia</p><h1 className="management__title" id="admin-appearance-title">Tema global</h1><p className="management__subtitle">Cambia la variante visual de OpenClassy manteniendo el estilo V1 como base elegante.</p></div>
      </header>
      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      <section className="settings__panel management__section"><div className="settings__grid">{VARIANTS.map((variant) => { const isActive = activeVariant === variant.id; return <button key={variant.id} className={`settings__card ${isActive ? 'settings__card--active' : ''}`} type="button" onClick={() => handleSelectTheme(variant.id)} aria-pressed={isActive} disabled={updating}><span className="settings__card-title">{variant.title}</span><span className="settings__card-text">{variant.description}</span><span className="settings__card-meta">{isActive ? 'Activo' : 'Seleccionar'}</span></button> })}</div></section>
    </section>
  )
}

export default AdminAppearance