import { useState } from 'react'
import { METHODOLOGY_SECTION } from '../data/homeData'

const MethodologySection = () => {
  const [activeTab, setActiveTab] = useState(0)
  const activeItem = METHODOLOGY_SECTION.items[activeTab] ?? METHODOLOGY_SECTION.items[0]

  return (
    <section className="home-methodology">
      <div className="home-grid">
        <h2 className="home-methodology__title">{METHODOLOGY_SECTION.title}</h2>
      </div>

      <div className="home-grid home-methodology__wrapper">
        <article className="home-methodology__card">
          <div className="home-methodology__top">
            <div className="home-methodology__copy">
              <p className="home-methodology__eyebrow">{METHODOLOGY_SECTION.eyebrow}</p>
              <h3 className="home-methodology__heading">{activeItem.title}</h3>
              <p className="home-methodology__text">{activeItem.description}</p>
            </div>
            <div className="home-methodology__visual" aria-hidden="true">
              <span className="home-methodology__visual-label">{activeItem.label}</span>
            </div>
          </div>

          <div className="home-methodology__tabs" role="tablist" aria-label={METHODOLOGY_SECTION.tabListLabel}>
            {METHODOLOGY_SECTION.items.map((item, index) => (
              <button
                key={item.id}
                className={
                  index === activeTab
                    ? 'home-methodology__tab home-methodology__tab--active'
                    : 'home-methodology__tab'
                }
                type="button"
                role="tab"
                aria-selected={index === activeTab}
                onClick={() => setActiveTab(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

export default MethodologySection