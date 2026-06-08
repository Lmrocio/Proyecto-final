import LoginForm from './LoginForm'
import loginImage from '../assets/prueba.jpg'

const LoginFooter = ({ variant }) => {
  const classNames = ['login__footer']

  if (variant === 'v2') {
    classNames.push('login__footer--split')
  }

  if (variant === 'v3') {
    classNames.push('login__footer--glass')
  }

  return (
    <footer className={classNames.join(' ')}>
      <span className="login__brand">Openclassy</span>
      <nav className="login__footer-links" aria-label="Legal">
        <a className="login__footer-link" href="/privacy">
          Política de privacidad
        </a>
        <a className="login__footer-link" href="/terms">
          Términos y condiciones
        </a>
        <a className="login__footer-link" href="/support">
          Soporte/Preguntas frecuentes
        </a>
      </nav>
      <span className="login__footer-copy">© 2026 Openclassy. Todos los derechos reservados.</span>
    </footer>
  )
}

const LoginLayoutV1 = ({ form, onBack }) => (
  <div className="login__layout login__layout--center">
    <button className="login__back" type="button" onClick={onBack}>
      {'<- Volver'}
    </button>
    <div className="login__panel login__panel--card">{form}</div>
    <LoginFooter variant="v1" />
  </div>
)

const LoginLayoutV2 = ({ form, onBack }) => (
  <div className="login__layout login__layout--split">
    <div className="login__media" aria-hidden="true" />
    <div className="login__main">
      <button className="login__back login__back--split" type="button" onClick={onBack}>
        {'<- Volver'}
      </button>
      <div className="login__panel login__panel--plain">{form}</div>
    </div>
    <LoginFooter variant="v2" />
  </div>
)

const LoginLayoutV3 = ({ form, onBack }) => (
  <div className="login__layout login__layout--center login__layout--glass">
    <button className="login__back" type="button" onClick={onBack}>
      {'<- Volver'}
    </button>
    <div className="login__panel login__panel--card">{form}</div>
    <LoginFooter variant="v3" />
  </div>
)

const LoginManager = ({ variant = 'v1', onBack, onSuccess }) => {
  const form = <LoginForm onSuccess={onSuccess} />

  const sharedStyle = {
    '--login-image': `url(${loginImage})`,
  }

  if (variant === 'v2') {
    return (
      <main className="login" data-variant="v2" style={sharedStyle}>
        <LoginLayoutV2 form={form} onBack={onBack} />
      </main>
    )
  }

  if (variant === 'v3') {
    return (
      <main className="login" data-variant="v3" style={sharedStyle}>
        <LoginLayoutV3 form={form} onBack={onBack} />
      </main>
    )
  }

  return (
    <main className="login" data-variant="v1" style={sharedStyle}>
      <LoginLayoutV1 form={form} onBack={onBack} />
    </main>
  )
}

export default LoginManager
