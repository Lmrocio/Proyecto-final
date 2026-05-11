import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const HeroSection = () => (
  <section className="home-hero">
    <div className="home-hero__shell">
      <header className="home-hero__nav" aria-label="Cabecera principal">
        <Link className="home-hero__brand" to="/">
          OpenClassy
        </Link>
      </header>

      <div className="home-grid home-hero__content">
        <div className="home-hero__headline-block">
          <p className="home-hero__eyebrow">Academia de inglés personalizada</p>
          <h1 className="home-hero__title">Inglés a medida, aprende a tu ritmo</h1>
        </div>

        <aside className="home-hero__aside">
          <p className="home-hero__description">
            Pon a prueba tu inglés con nuestro sistema de evaluación inteligente.
          </p>
          <Link className="home-hero__cta" to="/prueba-de-nivel">
            <span>Da el primer paso hoy</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  </section>
)

export default HeroSection