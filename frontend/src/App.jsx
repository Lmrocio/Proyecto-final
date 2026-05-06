import { Route, Routes } from 'react-router-dom'
import AdminSettings from './pages/AdminSettings'
import Home from './pages/Home'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import StudentMessagesPage from './pages/StudentMessagesPage'
import StudentProfilePage from './pages/StudentProfilePage'
import StudentTasksPage from './pages/StudentTasksPage'

function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/messages" element={<StudentMessagesPage />} />
      <Route path="/student/messages/:folder" element={<StudentMessagesPage />} />
      <Route path="/student/profile" element={<StudentProfilePage />} />
      <Route path="/student/profile/:section" element={<StudentProfilePage />} />
      <Route path="/student/tasks" element={<StudentTasksPage />} />
    </Routes>
  )
}

export default App
