const Skeleton = ({ lines = 3, variant = 'text', label = 'Cargando', className = '' }) => {
  const variantClass = variant === 'row' ? 'skeleton skeleton--rows' : variant === 'card' ? 'skeleton skeleton--card' : 'skeleton'
  const composedClass = className ? `${variantClass} ${className}` : variantClass

  if (variant === 'row') {
    return (
      <div className={composedClass} role="status" aria-live="polite" aria-label={label}>
        {Array.from({ length: lines }).map((_, index) => (
          <div className="skeleton__row" key={index}>
            <span className="skeleton__chip" aria-hidden="true" />
            <span className="skeleton__line skeleton__line--name" aria-hidden="true" />
            <span className="skeleton__line" aria-hidden="true" />
            <span className="skeleton__line skeleton__line--date" aria-hidden="true" />
            <span className="skeleton__chip skeleton__chip--small" aria-hidden="true" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={composedClass} role="status" aria-live="polite" aria-label={label}>
        {Array.from({ length: lines }).map((_, index) => (
          <div className="skeleton__card" key={index}>
            <span className="skeleton__line skeleton__line--title" aria-hidden="true" />
            <span className="skeleton__line" aria-hidden="true" />
            <span className="skeleton__line skeleton__line--short" aria-hidden="true" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={composedClass} role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: lines }).map((_, index) => (
        <span
          className={index === lines - 1 ? 'skeleton__line skeleton__line--short' : 'skeleton__line'}
          key={index}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default Skeleton
