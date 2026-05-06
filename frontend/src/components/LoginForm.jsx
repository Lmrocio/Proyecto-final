import { useCallback, useState } from 'react'
import { apiClient } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

const LoginForm = ({ onSuccess }) => {
  const { setSession } = useAuth()
  const [values, setValues] = useState({ username: '', password: '', remember: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target

    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      if (isSubmitting) {
        return
      }

      setIsSubmitting(true)

      try {
        const { data } = await apiClient.post('/auth/login', {
          email: values.username,
          password: values.password,
        })

        if (data?.token && data?.user) {
          setSession({ token: data.token, user: data.user })
          if (onSuccess) {
            onSuccess(data)
          }
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, onSuccess, setSession, values.password, values.username],
  )

  return (
    <form className="login-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <h1 className="login-form__title" id="login-title">
        Welcome
      </h1>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-username">
          Usuario
        </label>
        <input
          className="login-form__input"
          id="login-username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Usuario"
          value={values.username}
          onChange={handleChange}
          required
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-password">
          Contraseña
        </label>
        <input
          className="login-form__input"
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={values.password}
          onChange={handleChange}
          required
        />
        <a className="login-form__recovery" href="/recuperar">
          ¿Has olvidado la contraseña?
        </a>
      </div>

      <label className="login-form__remember" htmlFor="login-remember">
        <input
          id="login-remember"
          name="remember"
          type="checkbox"
          checked={values.remember}
          onChange={handleChange}
        />
        Recordarme
      </label>

      <button className="login-form__submit" type="submit" disabled={isSubmitting}>
        Iniciar sesión
      </button>

      <div className="login-form__footer">
        <strong>¿Eres alumno nuevo?</strong>
        <span>Contacta con administración para obtener tus credenciales.</span>
        <span>soporte@academia.es +34 123 45 67 89</span>
      </div>
    </form>
  )
}

export default LoginForm
