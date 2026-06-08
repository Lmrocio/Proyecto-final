const AdminPlaceholder = ({ title, description }) => (
  <section className="management management__page" aria-labelledby="admin-placeholder-title">
    <header className="management__header">
      <div>
        <p className="management__eyebrow">Panel de administración</p>
        <h1 className="management__title" id="admin-placeholder-title">{title}</h1>
        <p className="management__subtitle">{description}</p>
      </div>
    </header>
  </section>
)

export default AdminPlaceholder
