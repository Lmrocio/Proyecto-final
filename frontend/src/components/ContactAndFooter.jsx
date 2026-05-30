import { Camera, MessageCircle, Play, Send, Users } from 'lucide-react'

const SOCIAL_LINKS = [
  { id: 'facebook', label: 'Facebook', icon: Users },
  { id: 'youtube', label: 'Youtube', icon: Play },
  { id: 'twitter', label: 'Twitter', icon: Send },
  { id: 'whatsapp', label: 'Whatsapp', icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', icon: Camera },
]

const ContactAndFooter = () => (
  <section className="home-contact">
    <div className="home-grid home-contact__contact-block">
      <div className="home-contact__heading-block">
        <h2 className="home-contact__title">Contáctanos</h2>
        <p className="home-contact__subtitle">Envíanos tus dudas</p>
      </div>

      <div className="home-contact__media-block">
        <div className="home-contact__media" aria-hidden="true" />
        <button className="home-contact__button" type="button">
          Enviar email
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
          <p className="home-footer__brand">OpenClassy</p>
          <p className="home-footer__tagline">tu academia a medida</p>
        </div>

        <div className="home-footer__socials" aria-label="Redes sociales">
          {SOCIAL_LINKS.map(({ id, label, icon: Icon }) => (
            <a key={id} className="home-footer__social" href="/" title={label} aria-label={label}>
              <Icon size={16} aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="home-footer__decor" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="home-footer__decor-cell" />
          ))}
        </div>
      </div>
    </footer>
  </section>
)

export default ContactAndFooter