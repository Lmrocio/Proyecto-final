import StudentTopbar from '../components/StudentTopbar'
import StudentSidebar from '../components/StudentSidebar'

const StudentLayout = ({ children, variant = 'v1' }) => (
  <div className="student-layout" data-variant={variant}>
    <StudentTopbar />
    <div className="student-layout__body">
      <StudentSidebar />
      <main className="student-layout__main">{children}</main>
    </div>
  </div>
)

export default StudentLayout
