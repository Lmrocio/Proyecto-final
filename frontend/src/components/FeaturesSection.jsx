import { Brain, GraduationCap, Monitor, Users } from 'lucide-react'
import { FEATURES_ITEMS } from '../data/homeData'

const FEATURE_ICONS = {
  'official-preparation': GraduationCap,
  'integral-platform': Monitor,
  'smart-learning': Brain,
  'continuous-support': Users,
}

const FeaturesSection = () => (
  <section className="home-features">
    <div className="home-grid home-features__grid">
      <div className="home-features__visual" aria-hidden="true">
        <span className="home-features__visual-line home-features__visual-line--first" />
        <span className="home-features__visual-line home-features__visual-line--second" />
      </div>

      <div className="home-features__list-block">
        <ul className="home-features__list">
          {FEATURES_ITEMS.map(({ id, title }) => {
            const Icon = FEATURE_ICONS[id] ?? GraduationCap

            return (
              <li key={id} className="home-features__item">
                <span className="home-features__icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="home-features__text">{title}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  </section>
)

export default FeaturesSection