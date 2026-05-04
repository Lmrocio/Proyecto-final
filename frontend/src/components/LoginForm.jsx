import { useCallback, useMemo, useState } from 'react'
import { apiClient } from '../services/apiClient'
import EmptyState from './EmptyState'
import { useAuth } from '../context/AuthContext'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const LoginForm = ({ onSuccess }) => {
  const { setSession } = useAuth()
  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const errors = useMemo(() => {
    const nextErrors = {}

    if (!values.email) {
      nextErrors.email = 'El email es obligatorio.'
    } else if (!emailPattern.test(values.email)) {
      nextErrors.email = 'Introduce un email valido.'
    }

    if (!values.password) {
      nextErrors.password = 'La clave es obligatoria.'
    } else if (values.password.length < 8) {
      nextErrors.password = 'Usa al menos 8 caracteres.'
    }

    return nextErrors
  }, [values.email, values.password])

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors])

  const handleChange = useCallback((event) => {
    const { name, value } = event.target

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleBlur = useCallback((event) => {
    const { name } = event.target

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))
  }, [])

  const markAllTouched = useCallback(() => {
    setTouched({ email: true, password: true })
  }, [])

  const submitCredentials = useCallback(async () => {
    setStatus('loading')
    setMessage('')

    try {
      const { data } = await apiClient.post('/auth/login', {
        email: values.email,
        password: values.password,
      })

      if (!data?.token) {
        setStatus('empty')
        setMessage('No se recibio el token de acceso.')
        return
      }

      if (!data?.user) {
        setStatus('empty')
        setMessage('No se recibio el perfil de usuario.')
        return
      }

      setSession({ token: data.token, user: data.user })
      setStatus('success')
      setMessage('Acceso correcto. Ya puedes entrar al panel.')

      if (onSuccess) {
        onSuccess(data)
      }
    } catch {
      setStatus('error')
      setMessage('Credenciales invalidas o problema de conexion.')
    }
  }, [onSuccess, setSession, values.email, values.password])

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault()

      if (!isValid) {
        markAllTouched()
        return
      }

      submitCredentials()
    },
    [isValid, markAllTouched, submitCredentials],
  )

  const handleRetry = useCallback(() => {
    if (!isValid || status === 'loading') {
      return
    }

    submitCredentials()
  }, [isValid, status, submitCredentials])

  const emailError = touched.email ? errors.email : null
  const passwordError = touched.password ? errors.password : null

  return (
    <form className="login-form" onSubmit={handleSubmit} aria-busy={status === 'loading'}>
      <div className="login-form__header">
        <p className="login-form__kicker">Acceso seguro</p>
        <h2 className="login-form__title" id="login-title">
          Inicia sesion
        </h2>
        <p className="login-form__subtitle">Gestiona tu aula con OpenClassy.</p>
      </div>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-email">
          Email
        </label>
        <input
          className="login-form__input"
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? 'login-email-error' : undefined}
          disabled={status === 'loading'}
          required
        />
        {emailError ? (
          <span className="login-form__error" id="login-email-error" role="alert">
            {emailError}
          </span>
        ) : null}
      </div>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-password">
          Contrasena
        </label>
        <input
          className="login-form__input"
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? 'login-password-error' : undefined}
          disabled={status === 'loading'}
          required
        />
        {passwordError ? (
          <span className="login-form__error" id="login-password-error" role="alert">
            {passwordError}
          </span>
        ) : null}
      </div>

      <div className="login-form__actions">
        <button className="login-form__submit" type="submit" disabled={!isValid || status === 'loading'}>
          {status === 'loading' ? 'Accediendo...' : 'Entrar'}
        </button>
        {status === 'error' ? (
          <button className="login-form__ghost" type="button" onClick={handleRetry} disabled={status === 'loading'}>
            Reintentar
          </button>
        ) : null}
      </div>

      {status === 'loading' ? (
        <div className="login-form__loading" aria-hidden="true">
          <div className="skeleton">
            <span className="skeleton__line" />
            <span className="skeleton__line skeleton__line--short" />
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="login-form__alert" role="alert">
          {message}
        </div>
      ) : null}

      {status === 'success' ? (
        <div className="login-form__alert login-form__alert--ok" role="status">
          {message}
        </div>
      ) : null}

      {status === 'empty' ? (
        <EmptyState
          title="Respuesta vacia"
          text={message}
          actionLabel="Reintentar"
          onAction={handleRetry}
          tone="error"
        />
      ) : null}
    </form>
  )
}

export default LoginForm
