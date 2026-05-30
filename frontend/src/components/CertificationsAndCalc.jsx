import { ArrowRight } from 'lucide-react'

import BudgetCalculator from './BudgetCalculator'

const CERTIFICATIONS = [
  'Cambridge English',
  'Trinity College London',
  'Aptis (British Council) / Linguaskill',
]

const CertificationsAndCalc = () => (
  <section className="home-certifications">
    <div className="home-grid home-certifications__panels">
      <article className="home-certifications__panel home-certifications__panel--light">
        <h2 className="home-certifications__title">Certificaciones</h2>
        <p className="home-certifications__text">
          Te preparamos para superar con éxito los exámenes más reconocidos. Elige la certificación que
          impulsará tu futuro.
        </p>
        <div className="home-certifications__list" role="list">
          {CERTIFICATIONS.map((item) => (
            <button key={item} className="home-certifications__item" type="button">
              <span>{item}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      </article>

      <article className="home-certifications__panel home-certifications__panel--dark">
        <h2 className="home-certifications__title">Calcula tu inversión, transparencia desde el primer día</h2>
        <p className="home-certifications__text home-certifications__text--dark">
          ¿Ya sabes a qué examen quieres presentarte? Ajusta los meses y deja preparado tu presupuesto desde el inicio.
        </p>
        <BudgetCalculator />
      </article>
    </div>

    <div className="home-certifications__contact-bar">
      <div className="home-grid home-certifications__contact-grid">
        <p className="home-certifications__contact-item">+34 600 123 456</p>
        <p className="home-certifications__contact-item">Calle OpenClassy, 24 (Cádiz)</p>
        <p className="home-certifications__contact-item">info@openclassy.es</p>
      </div>
    </div>
  </section>
)

export default CertificationsAndCalc