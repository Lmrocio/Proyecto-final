const EmptyState = ({ title, text, actionLabel, onAction, tone = 'default' }) => {
  const toneClass =
    tone === 'error' ? 'empty-state--error' : tone === 'ok' ? 'empty-state--ok' : ''

  return (
    <section
      className={`empty-state ${toneClass}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__text">{text}</p>
      {actionLabel && onAction ? (
        <button className="empty-state__action" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}

export default EmptyState
