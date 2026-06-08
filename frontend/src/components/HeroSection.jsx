import { ArrowRight, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from './Brand'
import { HERO_CONTENT } from '../data/homeData'

const HeroSection = () => (
  <section className="home-hero">
    <div className="home-hero__shell">
      <header className="home-hero__nav" aria-label={HERO_CONTENT.navAriaLabel}>
        <Link className="home-hero__brand" to="/">
          <Brand className="home-hero__brand-mark" textClassName="home-hero__brand-text" imageClassName="home-hero__brand-logo" />
        </Link>
        <Link
          className="home-hero__login"
          to="/login"
          aria-label={HERO_CONTENT.loginLabel}
          title={HERO_CONTENT.loginLabel}
        >
          <LogIn size={20} aria-hidden="true" />
        </Link>
      </header>

      <div className="home-grid home-hero__content">
        <div className="home-hero__headline-block">
          <p className="home-hero__eyebrow">{HERO_CONTENT.eyebrow}</p>
          <h1 className="home-hero__title">{HERO_CONTENT.title}</h1>
        </div>

        <aside className="home-hero__aside">
          <p className="home-hero__description">{HERO_CONTENT.description}</p>
          <Link className="home-hero__cta" to="/prueba-de-nivel">
            <span>{HERO_CONTENT.ctaLabel}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  </section>
)

export default HeroSection