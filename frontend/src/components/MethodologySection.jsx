import { useState } from 'react'

const METHODOLOGY_ITEMS = [
  {
    id: 'interactive-classes',
    label: 'Clases interactivas',
    title: 'Hablar desde el primer día cambia la curva de aprendizaje',
    description:
      'Sesiones activas con retos breves, conversación guiada y práctica oral útil para que avances con confianza desde la primera semana.',
  },
  {
    id: 'own-material',
    label: 'Material propio',
    title: 'Recursos diseñados para progresar, no para acumular fichas',
    description:
      'Creamos materiales claros, medibles y ajustados a cada etapa para que cada actividad tenga un propósito real dentro de tu camino.',
  },
  {
    id: 'continuous-support',
    label: 'Seguimiento continuo',
    title: 'Siempre sabes qué has mejorado y qué toca reforzar',
    description:
      'Revisión periódica, retroalimentación accionable y ajustes de ritmo para que el proceso no se estanque ni dependa de intuiciones.',
  },
  {
    id: 'native-teachers',
    label: 'Profesores nativos',
    title: 'Exposición natural al idioma con guía pedagógica sólida',
    description:
      'Combinamos naturalidad, corrección precisa y enfoque académico para que la inmersión tenga estructura y resultados medibles.',
  },
]

const MethodologySection = () => {
  const [activeTab, setActiveTab] = useState(0)
  const activeItem = METHODOLOGY_ITEMS[activeTab]

  return (
    <section className="home-methodology">
      <div className="home-grid">
        <h2 className="home-methodology__title">Nuestra metodología</h2>
      </div>

      <div className="home-grid home-methodology__wrapper">
        <article className="home-methodology__card">
          <div className="home-methodology__top">
            <div className="home-methodology__copy">
              <p className="home-methodology__eyebrow">Así trabajamos</p>
              <h3 className="home-methodology__heading">{activeItem.title}</h3>
              <p className="home-methodology__text">{activeItem.description}</p>
            </div>
            <div className="home-methodology__visual" aria-hidden="true">
              <span className="home-methodology__visual-label">{activeItem.label}</span>
            </div>
          </div>

          <div className="home-methodology__tabs" role="tablist" aria-label="Metodología de OpenClassy">
            {METHODOLOGY_ITEMS.map((item, index) => (
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