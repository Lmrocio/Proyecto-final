import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentLayout from '../layouts/StudentLayout'
import { useAuth } from '../context/authContext'
import { useConfig } from '../context/configContext'
import { apiClient } from '../services/apiClient'

const getNameParts = (user) => {
  const firstName = String(user?.first_name ?? '').trim()
  const lastName = String(user?.last_name ?? '').trim()

  if (firstName || lastName) {
    return {
      firstName,
      lastName,
    }
  }

  const [derivedFirstName = '', derivedLastName = ''] = String(user?.name ?? '').trim().split(/\s+/, 2)

  return {
    firstName: derivedFirstName,
    lastName: derivedLastName,
  }
}

const getInitials = (firstName = '', lastName = '') => {
  const resolvedFirstName = firstName || 'Alumno'
  const resolvedLastName = lastName || 'OpenClassy'

  return `${resolvedFirstName.charAt(0)}${resolvedLastName.charAt(0)}`.toUpperCase()
}

const getCurrentCourse = (user) =>
  user?.current_course?.title ?? user?.course?.title ?? user?.enrollment?.course?.title ?? 'Inglés B2 - Conversación'

const getInitialAccessibility = (user) => {
  const settings = user?.accessibility_settings ?? {}

  return {
    colorBlind: Boolean(settings.color_blind ?? settings.high_contrast),
    dyslexic: Boolean(settings.dyslexic),
    fontSize: settings.font_size ?? 'medium',
  }
}

const AccessibilityToggle = ({ checked, label, name, onChange }) => (
  <label className="student-profile__toggle">
    <span>{label}</span>
    <input
      className="student-profile__toggle-input"
      type="checkbox"
      name={name}
      checked={checked}
      onChange={(event) => onChange(name, event.target.checked)}
    />
    <span className="student-profile__switch" aria-hidden="true">
      <span className="student-profile__switch-thumb" />
    </span>
  </label>
)

const StudentProfilePage = () => {
  const { uiVariant } = useConfig()
  const { user, setSession, logout } = useAuth()
  const navigate = useNavigate()
  const themeVariant = uiVariant ?? 'v1'
  const nameParts = useMemo(() => getNameParts(user), [user])
  const studentName = `${nameParts.firstName} ${nameParts.lastName}`.trim() || 'Alumno OpenClassy'
  const courseTitle = getCurrentCourse(user)
  const avatarInitials = useMemo(() => getInitials(nameParts.firstName, nameParts.lastName), [nameParts.firstName, nameParts.lastName])
  const [contactForm, setContactForm] = useState(() => ({
    first_name: nameParts.firstName,
    last_name: nameParts.lastName,
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  }))
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', nextPassword: '', confirmPassword: '' })
  const [accessibility, setAccessibility] = useState(() => getInitialAccessibility(user))
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleContactChange = (event) => {
    const { name, value } = event.target
    setContactForm((currentForm) => ({ ...currentForm, [name]: value }))
    setFeedback('')
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleAccessibilityChange = (name, checked) => {
    setAccessibility((currentSettings) => ({ ...currentSettings, [name]: checked }))
  }

  const handleFontSizeChange = (event) => {
    setAccessibility((currentSettings) => ({ ...currentSettings, fontSize: event.target.value }))
  }

  const handleContactSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setFeedback('')

    try {
      const { data } = await apiClient.put('/auth/user', {
        first_name: contactForm.first_name,
        last_name: contactForm.last_name,
        email: contactForm.email,
        phone: contactForm.phone,
      })
      setSession({ user: data })
      setFeedback('Datos personales guardados.')
    } catch (requestError) {
      setFeedback(requestError?.response?.data?.message ?? 'No se pudieron guardar los datos personales.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      setFeedback('La nueva contraseña y la confirmación no coinciden.')
      return
    }

    setIsSaving(true)
    setFeedback('')

    try {
      await apiClient.put('/auth/password', {
        current_password: passwordForm.currentPassword,
        password: passwordForm.nextPassword,
        password_confirmation: passwordForm.confirmPassword,
      })
      setPasswordForm({ currentPassword: '', nextPassword: '', confirmPassword: '' })
      setFeedback('Contraseña actualizada.')
    } catch (requestError) {
      setFeedback(requestError?.response?.data?.message ?? 'No se pudo actualizar la contraseña.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAccessibilitySubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setFeedback('')

    try {
      const { data } = await apiClient.put('/auth/user', {
        accessibility_settings: {
          ...(user?.accessibility_settings ?? {}),
          color_blind: accessibility.colorBlind,
          dyslexic: accessibility.dyslexic,
          font_size: accessibility.fontSize,
        },
      })
      setSession({ user: data })
      setFeedback('Preferencias de accesibilidad guardadas.')
    } catch (requestError) {
      setFeedback(requestError?.response?.data?.message ?? 'No se pudieron guardar las preferencias.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadData = () => {
    const payload = JSON.stringify({ user, accessibility }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'openclassy-datos-personales.json'
    link.click()
    URL.revokeObjectURL(url)
    setFeedback('Datos personales descargados.')
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return
    }

    setIsSaving(true)
    setFeedback('')

    try {
      await apiClient.delete('/auth/user')
      await logout()
      navigate('/login', { replace: true })
    } catch (requestError) {
      setFeedback(requestError?.response?.data?.message ?? 'No se pudo eliminar la cuenta.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <StudentLayout variant={themeVariant}>
      <section className="student-profile" aria-labelledby="student-profile-title">
        <header className="student-profile__header">
          <p className="student-profile__eyebrow">Área personal</p>
          <h1 className="student-profile__title" id="student-profile-title">
            Perfil del alumno
          </h1>
        </header>

        <div className="student-profile__shell">
          <div className="student-profile__grid">
            <div className="student-profile__column">
              <article className="student-profile__card">
                <div className="student-profile__identity">
                  <div className="student-profile__avatar" aria-hidden="true">
                    {avatarInitials}
                  </div>
                  <div>
                    <h2 className="student-profile__card-title">Datos personales</h2>
                    <p className="student-profile__name">{studentName}</p>
                    <p className="student-profile__course">Curso actual: {courseTitle}</p>
                  </div>
                </div>

                <form className="student-profile__form" onSubmit={handleContactSubmit}>
                  <label className="student-profile__field">
                    <span>Nombre</span>
                    <input
                      className="student-profile__input"
                      type="text"
                      name="first_name"
                      value={contactForm.first_name}
                      onChange={handleContactChange}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="student-profile__field">
                    <span>Apellidos</span>
                    <input
                      className="student-profile__input"
                      type="text"
                      name="last_name"
                      value={contactForm.last_name}
                      onChange={handleContactChange}
                      autoComplete="family-name"
                    />
                  </label>
                  <label className="student-profile__field">
                    <span>Correo</span>
                    <input
                      className="student-profile__input"
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactChange}
                      autoComplete="email"
                    />
                  </label>
                  <label className="student-profile__field">
                    <span>Teléfono</span>
                    <input
                      className="student-profile__input"
                      type="tel"
                      name="phone"
                      value={contactForm.phone}
                      onChange={handleContactChange}
                      autoComplete="tel"
                    />
                  </label>
                  <button className="student-profile__button student-profile__button--primary" type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              </article>

              <article className="student-profile__card">
                <h2 className="student-profile__card-title">Seguridad</h2>
                <form className="student-profile__form" onSubmit={handlePasswordSubmit}>
                  <label className="student-profile__field">
                    <span>Contraseña actual</span>
                    <input
                      className="student-profile__input"
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                    />
                  </label>
                  <label className="student-profile__field">
                    <span>Nueva contraseña</span>
                    <input
                      className="student-profile__input"
                      type="password"
                      name="nextPassword"
                      value={passwordForm.nextPassword}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="student-profile__field">
                    <span>Confirmar</span>
                    <input
                      className="student-profile__input"
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                    />
                  </label>
                  <button className="student-profile__button student-profile__button--primary" type="submit" disabled={isSaving}>
                    {isSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </form>
              </article>
            </div>

            <div className="student-profile__column">
              <article className="student-profile__card">
                <h2 className="student-profile__card-title">Accesibilidad</h2>
                <form className="student-profile__settings" onSubmit={handleAccessibilitySubmit}>
                  <AccessibilityToggle
                    checked={accessibility.colorBlind}
                    label="Modo daltónico"
                    name="colorBlind"
                    onChange={handleAccessibilityChange}
                  />
                  <AccessibilityToggle
                    checked={accessibility.dyslexic}
                    label="Modo disléxico"
                    name="dyslexic"
                    onChange={handleAccessibilityChange}
                  />
                  <label className="student-profile__field">
                    <span>Tamaño de letra</span>
                    <select
                      className="student-profile__input student-profile__select"
                      value={accessibility.fontSize}
                      onChange={handleFontSizeChange}
                    >
                      <option value="small">Pequeño</option>
                      <option value="medium">Normal</option>
                      <option value="large">Grande</option>
                    </select>
                  </label>
                  <button className="student-profile__button student-profile__button--primary" type="submit" disabled={isSaving}>
                    Guardar accesibilidad
                  </button>
                </form>
              </article>

              <aside className="student-profile__danger" aria-labelledby="student-profile-danger-title">
                <div>
                  <h2 className="student-profile__card-title" id="student-profile-danger-title">
                    Zona de peligro
                  </h2>
                  <p className="student-profile__danger-copy">Gestiona exportaciones y acciones sensibles de la cuenta.</p>
                </div>
                <div className="student-profile__danger-actions">
                  <button className="student-profile__button student-profile__button--outline" type="button" onClick={handleDownloadData}>
                    Descargar mis datos
                  </button>
                  <button className="student-profile__button student-profile__button--danger" type="button" onClick={handleDeleteAccount} disabled={isSaving}>
                    Eliminar cuenta
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {feedback ? <p className="student-profile__feedback">{feedback}</p> : null}
      </section>
    </StudentLayout>
  )
}

export default StudentProfilePage