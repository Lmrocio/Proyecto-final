import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import AdminAppearance from './pages/admin/AdminAppearance'
import AdminBonuses from './pages/admin/AdminBonuses'
import AdminConfig from './pages/admin/AdminConfig'
import AdminCourses from './pages/admin/AdminCourses'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPlaceholder from './pages/admin/AdminPlaceholder'
import AdminUsers from './pages/admin/AdminUsers'
import Home from './pages/Home'
import LevelTest from './pages/LevelTest'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import StudentDashboard from './pages/StudentDashboard'
import StudentGradesPage from './pages/StudentGradesPage'
import StudentMessagesPage from './pages/StudentMessagesPage'
import StudentProfilePage from './pages/StudentProfilePage'
import StudentTasksPage from './pages/StudentTasksPage'
import TeacherDashboard from './pages/TeacherDashboard'

function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/prueba-de-nivel" element={<LevelTest />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="students" element={<AdminUsers initialRole="student" />} />
          <Route path="teachers" element={<AdminUsers initialRole="teacher" />} />
          <Route path="admins" element={<AdminUsers initialRole="admin" />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="portal" element={<AdminAppearance />} />
          <Route path="messages" element={<AdminPlaceholder title="Mensajes" description="La gestión completa de mensajes se abordará en la siguiente iteración del panel." />} />
          <Route path="bonuses" element={<AdminBonuses />} />
          <Route path="appearance" element={<AdminAppearance />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['teacher']} />}>
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/messages" element={<StudentMessagesPage />} />
        <Route path="/student/messages/:folder" element={<StudentMessagesPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
        <Route path="/student/grades" element={<StudentGradesPage />} />
        <Route path="/student/tasks" element={<StudentTasksPage />} />
      </Route>
    </Routes>
  )
}

export default App
