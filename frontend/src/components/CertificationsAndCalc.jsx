import { ArrowRight } from 'lucide-react'

import BudgetCalculator from './BudgetCalculator'
import { CERTIFICATIONS_SECTION } from '../data/homeData'

const CertificationsAndCalc = () => (
  <section className="home-certifications">
    <div className="home-grid home-certifications__panels">
      <article className="home-certifications__panel home-certifications__panel--light">
        <h2 className="home-certifications__title">{CERTIFICATIONS_SECTION.certificationTitle}</h2>
        <p className="home-certifications__text">{CERTIFICATIONS_SECTION.certificationText}</p>
        <div className="home-certifications__list" role="list">
          {CERTIFICATIONS_SECTION.certificationItems.map((item) => (
            <button key={item} className="home-certifications__item" type="button">
              <span>{item}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      </article>

      <article className="home-certifications__panel home-certifications__panel--dark">
        <h2 className="home-certifications__title">{CERTIFICATIONS_SECTION.calculatorTitle}</h2>
        <p className="home-certifications__text home-certifications__text--dark">{CERTIFICATIONS_SECTION.calculatorText}</p>
        <BudgetCalculator />
      </article>
    </div>

    <div className="home-certifications__contact-bar">
      <div className="home-grid home-certifications__contact-grid">
        {CERTIFICATIONS_SECTION.contactItems.map((item) => (
          <p key={item} className="home-certifications__contact-item">
            {item}
          </p>
        ))}
      </div>
    </div>
  </section>
)

export default CertificationsAndCalc