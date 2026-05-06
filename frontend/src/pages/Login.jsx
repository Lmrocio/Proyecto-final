import { useCallback } from 'react'
import LoginManager from '../components/LoginManager'
import { useConfig } from '../context/ConfigContext'

const Login = () => {
  const { loginVariant } = useConfig()
  const variant = loginVariant ?? 'v1'

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign('/')
  }, [])

  const handleSuccess = useCallback(() => {
    const redirect = window.localStorage.getItem('openclassy_redirect')

    if (redirect) {
      window.localStorage.removeItem('openclassy_redirect')
      window.location.assign(redirect)
      return
    }

    window.location.assign('/')
  }, [])

  return <LoginManager variant={variant} onBack={handleBack} onSuccess={handleSuccess} />
}

export default Login
