import StudentLayout from '../layouts/StudentLayout'
import { useConfig } from '../context/ConfigContext'

const StudentPlaceholderPage = ({ label, children = null }) => {
  const { uiVariant } = useConfig()

  return (
    <StudentLayout variant={uiVariant ?? 'v1'}>
      <section className="student-dashboard" aria-label={label}>
        <h1 className="u-visually-hidden">{label}</h1>
        {children}
      </section>
    </StudentLayout>
  )
}

export default StudentPlaceholderPage