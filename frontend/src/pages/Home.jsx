import { useConfig } from '../context/configContext'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import CoursesSection from '../components/CoursesSection'
import CertificationsAndCalc from '../components/CertificationsAndCalc'
import MethodologySection from '../components/MethodologySection'
import ContactAndFooter from '../components/ContactAndFooter'
import useScrollSpy from '../hooks/useScrollSpy'

const HOME_SECTIONS = [
  {
    id: 'hero',
    label: 'Inicio',
    title: 'Descubre OpenClassy',
    description: 'Punto de partida con identidad, propuesta de valor y llamada principal a la accion.',
    Component: HeroSection,
  },
  {
    id: 'features',
    label: 'Ventajas',
    title: 'Que nos hace diferentes',
    description: 'Beneficios claros para entender rapidamente por que la metodologia funciona.',
    Component: FeaturesSection,
  },
  {
    id: 'courses',
    label: 'Cursos',
    title: 'Encuentra tu ritmo',
    description: 'Recorrido de formaciones para cada perfil, nivel y objetivo academico.',
    Component: CoursesSection,
  },
  {
    id: 'certifications',
    label: 'Certificaciones',
    title: 'Prepara tu siguiente hito',
    description: 'Ruta para certificar competencias y calcular tu inversion con transparencia.',
    Component: CertificationsAndCalc,
  },
  {
    id: 'methodology',
    label: 'Metodologia',
    title: 'Aprendizaje guiado',
    description: 'Sistema de trabajo con seguimiento, materiales propios y enfoque practico.',
    Component: MethodologySection,
  },
  {
    id: 'contact',
    label: 'Contacto',
    title: 'Habla con nosotros',
    description: 'Ultima parada para resolver dudas y activar el siguiente paso de tu plan.',
    Component: ContactAndFooter,
  },
]

const JOURNEY_STOP_IDS = HOME_SECTIONS.map((section) => section.id)

const HomeLayoutV1 = () => (
  <div className="home-layout" data-variant="v1">
    <HeroSection />
    <FeaturesSection />
    <CoursesSection />
    <CertificationsAndCalc />
    <MethodologySection />
    <ContactAndFooter />
  </div>
)

const HomeLayoutV2 = () => (
  <div className="home-layout" data-variant="v2">
    <div className="home-zigzag">
      {HOME_SECTIONS.map(({ id, label, title, description, Component }, index) => {
        const sectionClassName =
          index % 2 === 0 ? 'home-zigzag__section' : 'home-zigzag__section home-zigzag__section--reverse'

        return (
          <section key={id} className={sectionClassName} aria-labelledby={`home-zigzag-title-${id}`}>
            <header className="home-zigzag__meta">
              <p className="home-zigzag__kicker">{label}</p>
              <h2 id={`home-zigzag-title-${id}`} className="home-zigzag__title">
                {title}
              </h2>
              <p className="home-zigzag__description">{description}</p>
            </header>

            <div className="home-zigzag__content">
              <Component />
            </div>
          </section>
        )
      })}
    </div>
  </div>
)

const HomeLayoutV3 = () => {
  const { activeId, registerSection } = useScrollSpy(JOURNEY_STOP_IDS)

  return (
    <div className="home-layout" data-variant="v3">
      <div className="home-journey" aria-label="Recorrido de aprendizaje OpenClassy">
        <span className="home-journey__line" aria-hidden="true" />

        {HOME_SECTIONS.map(({ id, label, title, Component }, index) => {
          const isActive = activeId === id
          const sideClassName = index % 2 === 0 ? 'home-journey__stop--left' : 'home-journey__stop--right'
          const activeClassName = isActive ? 'home-journey__stop home-journey__stop--active' : 'home-journey__stop'

          return (
            <section
              key={id}
              ref={registerSection(id)}
              className={`${activeClassName} ${sideClassName}`}
              aria-labelledby={`home-journey-title-${id}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="home-journey__node" aria-hidden="true" />

              <div className="home-journey__stop-content">
                <header className="home-journey__stop-header">
                  <p className="home-journey__stop-label">{label}</p>
                  <h2 id={`home-journey-title-${id}`} className="home-journey__stop-title">
                    {title}
                  </h2>
                </header>

                <div className="home-journey__stop-body">
                  <Component />
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

const Home = () => {
  const { uiVariant } = useConfig()
  const variant = uiVariant ?? 'v1'

  if (variant === 'v2') {
    return (
      <main className="home-page">
        <HomeLayoutV2 />
      </main>
    )
  }

  if (variant === 'v3') {
    return (
      <main className="home-page">
        <HomeLayoutV3 />
      </main>
    )
  }

  return (
    <main className="home-page">
      <HomeLayoutV1 />
    </main>
  )
}

export default Home
