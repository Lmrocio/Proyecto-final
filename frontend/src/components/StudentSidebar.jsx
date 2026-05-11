import { useCallback, useEffect, useState } from 'react'
import CalendarWidget from './CalendarWidget'
import TasksList from './TasksList'
import { useAuth } from '../context/authContext'
import { apiClient } from '../services/apiClient'

const normalizeAssignments = (assignments) =>
  assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title ?? 'Tarea sin titulo',
    description: assignment.description ?? '',
    unit_name: assignment.unit_name ?? '',
    due_date: assignment.due_date ?? null,
    status: assignment.status ?? 'pending',
    course: assignment.course ?? null,
    submission: assignment.submission ?? null,
  }))

const StudentSidebar = () => {
  const { status: authStatus, user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const canLoadAssignments = authStatus === 'ready' && user?.role === 'student'

  const loadAssignments = useCallback(async () => {
    if (!canLoadAssignments) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data } = await apiClient.get('/student/assignments')
      const items = Array.isArray(data?.data) ? data.data : []
      setAssignments(normalizeAssignments(items))
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [canLoadAssignments])

  useEffect(() => {
    if (!canLoadAssignments) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      loadAssignments()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [canLoadAssignments, loadAssignments])

  const visibleAssignments = canLoadAssignments ? assignments : []

  return (
    <aside className="student-sidebar">
      <CalendarWidget assignments={visibleAssignments} onSelectedDateChange={setSelectedDate} />
      <TasksList
        assignments={visibleAssignments}
        selectedDate={selectedDate}
        isLoading={canLoadAssignments && isLoading}
        error={canLoadAssignments ? error : null}
        onRetry={loadAssignments}
      />
    </aside>
  )
}

export default StudentSidebar
