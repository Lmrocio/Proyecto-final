import { Camera, MessageCircle, Play, Send, Users } from 'lucide-react'
import { CONTACT_FOOTER_SECTION } from '../data/homeData'

const SOCIAL_ICONS = {
  facebook: Users,
  youtube: Play,
  twitter: Send,
  whatsapp: MessageCircle,
  instagram: Camera,
}

const ContactAndFooter = () => (
  <section className="home-contact">
    <div className="home-grid home-contact__contact-block">
      <div className="home-contact__heading-block">
        <h2 className="home-contact__title">{CONTACT_FOOTER_SECTION.title}</h2>
        <p className="home-contact__subtitle">{CONTACT_FOOTER_SECTION.subtitle}</p>
      </div>

      <div className="home-contact__media-block">
        <div className="home-contact__media" aria-hidden="true" />
        <button className="home-contact__button" type="button">
          {CONTACT_FOOTER_SECTION.emailButtonLabel}
        </button>
      </div>

      <div className="home-contact__form-skeleton" aria-hidden="true">
        <div className="home-contact__input home-contact__input--short" />
        <div className="home-contact__input home-contact__input--short" />
        <div className="home-contact__input home-contact__input--tall" />
      </div>
    </div>

    <footer className="home-footer">
      <div className="home-grid home-footer__grid">
        <div className="home-footer__brand-block">
          <p className="home-footer__brand">{CONTACT_FOOTER_SECTION.footerBrand}</p>
          <p className="home-footer__tagline">{CONTACT_FOOTER_SECTION.footerTagline}</p>
        </div>

        <div className="home-footer__socials" aria-label={CONTACT_FOOTER_SECTION.socialsAriaLabel}>
          {CONTACT_FOOTER_SECTION.socials.map(({ id, href, label }) => {
            const Icon = SOCIAL_ICONS[id] ?? Users

            return (
              <a key={id} className="home-footer__social" href={href} title={label} aria-label={label}>
                <Icon size={16} aria-hidden="true" />
              </a>
            )
          })}
        </div>

        <div className="home-footer__decor" aria-hidden="true">
          {Array.from({ length: CONTACT_FOOTER_SECTION.decorCells }).map((_, index) => (
            <span key={index} className="home-footer__decor-cell" />
          ))}
        </div>
      </div>
    </footer>
  </section>
)

export default ContactAndFooter