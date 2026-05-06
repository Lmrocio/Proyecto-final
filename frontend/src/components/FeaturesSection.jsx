import { Brain, GraduationCap, Monitor, Users } from 'lucide-react'

const FEATURES = [
  {
    id: 'official-preparation',
    icon: GraduationCap,
    title: 'Preparación oficial garantizada',
  },
  {
    id: 'integral-platform',
    icon: Monitor,
    title: 'Plataforma integral',
  },
  {
    id: 'smart-learning',
    icon: Brain,
    title: 'Aprendizaje inteligente, no repitas lo que ya sabes',
  },
  {
    id: 'continuous-support',
    icon: Users,
    title: 'Acompañamiento continuo',
  },
]

const FeaturesSection = () => (
  <section className="home-features">
    <div className="home-grid home-features__grid">
      <div className="home-features__visual" aria-hidden="true">
        <span className="home-features__visual-line home-features__visual-line--first" />
        <span className="home-features__visual-line home-features__visual-line--second" />
      </div>

      <div className="home-features__list-block">
        <ul className="home-features__list">
          {FEATURES.map(({ id, icon: Icon, title }) => (
            <li key={id} className="home-features__item">
              <span className="home-features__icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="home-features__text">{title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
)

export default FeaturesSection