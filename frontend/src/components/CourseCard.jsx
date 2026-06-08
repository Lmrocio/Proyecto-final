const CourseCard = ({ title, level, description }) => (
  <article className="landing-course-card">
    <div className="landing-course-card__media" aria-hidden="true" />
    <div className="landing-course-card__body">
      <div className="landing-course-card__header">
        <h3 className="landing-course-card__title">{title}</h3>
        <span className="landing-course-card__tag">{level}</span>
      </div>
      <p className="landing-course-card__text">{description}</p>
    </div>
  </article>
)

export default CourseCard