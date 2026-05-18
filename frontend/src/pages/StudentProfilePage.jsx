import { useMemo, useState } from 'react'
import StudentLayout from '../layouts/StudentLayout'
import { useAuth } from '../context/authContext'
import { useConfig } from '../context/configContext'

const getInitials = (name = '') => {
  const [firstName = 'Alumno', lastName = 'OpenClassy'] = name.trim().split(/\s+/)
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const getCurrentCourse = (user) =>
  user?.current_course?.title ?? user?.course?.title ?? user?.enrollment?.course?.title ?? 'Inglés B2 - Conversación'

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
  const { user } = useAuth()
  const themeVariant = uiVariant ?? 'v1'
  const studentName = user?.name ?? 'Alumno OpenClassy'
  const courseTitle = getCurrentCourse(user)
  const avatarInitials = useMemo(() => getInitials(studentName), [studentName])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', nextPassword: '', confirmPassword: '' })
  const [accessibility, setAccessibility] = useState({ colorBlind: false, dyslexic: false, fontSize: 'medium' })
  const [feedback, setFeedback] = useState('')

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

  const handleContactSubmit = (event) => {
    event.preventDefault()
    setFeedback('Cambios de contacto registrados.')
  }

  const handlePasswordSubmit = (event) => {
    event.preventDefault()
    setPasswordForm({ currentPassword: '', nextPassword: '', confirmPassword: '' })
    setFeedback('Contraseña actualizada.')
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

                <form className="student-profile__form" onSubmit={handleContactSubmit} key={user?.id ?? user?.email ?? 'contact'}>
                  <label className="student-profile__field">
                    <span>Correo</span>
                    <input
                      className="student-profile__input"
                      type="email"
                      name="email"
                      defaultValue={user?.email ?? ''}
                      autoComplete="email"
                    />
                  </label>
                  <label className="student-profile__field">
                    <span>Teléfono</span>
                    <input
                      className="student-profile__input"
                      type="tel"
                      name="phone"
                      defaultValue={user?.phone ?? ''}
                      autoComplete="tel"
                    />
                  </label>
                  <button className="student-profile__button student-profile__button--primary" type="submit">
                    Guardar cambios
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
                  <button className="student-profile__button student-profile__button--primary" type="submit">
                    Actualizar contraseña
                  </button>
                </form>
              </article>
            </div>

            <div className="student-profile__column">
              <article className="student-profile__card">
                <h2 className="student-profile__card-title">Accesibilidad</h2>
                <div className="student-profile__settings">
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
                </div>
              </article>

              <aside className="student-profile__danger" aria-labelledby="student-profile-danger-title">
                <div>
                  <h2 className="student-profile__card-title" id="student-profile-danger-title">
                    Zona de peligro
                  </h2>
                  <p className="student-profile__danger-copy">Gestiona exportaciones y acciones sensibles de la cuenta.</p>
                </div>
                <div className="student-profile__danger-actions">
                  <button className="student-profile__button student-profile__button--outline" type="button">
                    Descargar mis datos en PDF
                  </button>
                  <button className="student-profile__button student-profile__button--danger" type="button">
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