import { useState } from 'react'
import { Save } from 'lucide-react'
import { useAuth } from '../../context/authContext'
import { apiClient } from '../../services/apiClient'
import { getErrorMessage, updateFormField } from './adminPageUtils'

const buildInitialProfileForm = (user) => {
  const settings = user?.accessibility_settings ?? {}

  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    dyslexia_font: Boolean(settings.dyslexia_font),
    high_contrast: Boolean(settings.high_contrast),
    font_size: settings.font_size ?? 'normal',
  }
}

const AdminConfig = () => {
  const { refreshUser, user } = useAuth()
  const [form, setForm] = useState(() => buildInitialProfileForm(user))
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleToggleChange = (event) => {
    const { name, checked } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: checked }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setFeedback('')

    try {
      await apiClient.put('/auth/user', {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        accessibility_settings: {
          ...(user?.accessibility_settings ?? {}),
          dyslexia_font: form.dyslexia_font,
          high_contrast: form.high_contrast,
          font_size: form.font_size,
        },
      })
      await refreshUser()
      setFeedback('Configuración guardada correctamente.')
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo guardar la configuración.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="management management__page admin-config" aria-labelledby="admin-config-title">
      <header className="management__header"><div><p className="management__eyebrow">Configuración</p><h1 className="management__title" id="admin-config-title">Perfil y accesibilidad</h1><p className="management__subtitle">Personaliza tu cuenta de administrador y la experiencia visual del panel.</p></div></header>
      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      <form className="admin-config__card" onSubmit={saveProfile}>
        <div className="management__grid">
          <label className="management__field"><span>Nombre</span><input name="name" value={form.name} onChange={updateFormField(setForm)} required /></label>
          <label className="management__field"><span>Email</span><input name="email" type="email" value={form.email} onChange={updateFormField(setForm)} required /></label>
          <label className="management__field"><span>Teléfono</span><input name="phone" value={form.phone} onChange={updateFormField(setForm)} /></label>
        </div>
        <section className="admin-config__accessibility" aria-labelledby="admin-accessibility-title">
          <h2 className="management__section-title" id="admin-accessibility-title">Accesibilidad</h2>
          <label className="admin-config__toggle"><span>Activar tipografía para dislexia</span><input name="dyslexia_font" type="checkbox" checked={form.dyslexia_font} onChange={handleToggleChange} /></label>
          <label className="admin-config__toggle"><span>Modo de alto contraste (Daltónicos)</span><input name="high_contrast" type="checkbox" checked={form.high_contrast} onChange={handleToggleChange} /></label>
          <label className="management__field"><span>Tamaño de letra</span><select name="font_size" value={form.font_size} onChange={updateFormField(setForm)}><option value="small">Pequeña</option><option value="normal">Normal</option><option value="large">Grande</option><option value="extra-large">Extra grande</option></select></label>
        </section>
        <button className="management__button management__button--primary" type="submit" disabled={isSaving}><Save size={16} aria-hidden="true" />Guardar configuración</button>
      </form>
    </section>
  )
}

export default AdminConfig