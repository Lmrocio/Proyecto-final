import StudentTopbar from '../components/StudentTopbar'
import StudentSidebar from '../components/StudentSidebar'

const StudentLayout = ({ children, variant = 'v1', showSidebar = true }) => (
  <div className={showSidebar ? 'student-layout' : 'student-layout student-layout--full'} data-variant={variant}>
    <StudentTopbar />
    <div className="student-layout__body">
      {showSidebar ? <StudentSidebar /> : null}
      <main className="student-layout__main">{children}</main>
    </div>
  </div>
)

export default StudentLayout
