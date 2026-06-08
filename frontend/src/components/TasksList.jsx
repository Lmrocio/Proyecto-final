import { format, isAfter, isSameDay, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'

const parseAssignmentDate = (dueDate) => {
  if (!dueDate) {
    return null
  }

  const parsedDate = typeof dueDate === 'string' ? parseISO(dueDate) : new Date(dueDate)
  return isValid(parsedDate) ? parsedDate : null
}

const sortByDueDate = (leftAssignment, rightAssignment) => {
  const leftDate = parseAssignmentDate(leftAssignment.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
  const rightDate = parseAssignmentDate(rightAssignment.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER

  return leftDate - rightDate
}

const formatTime = (dueDate) => (dueDate ? format(dueDate, 'HH:mm') : 'Sin hora')

const formatDay = (dueDate) => (dueDate ? format(dueDate, 'd MMM yyyy', { locale: es }) : 'Sin fecha')

const TaskCard = ({ assignment, compact = false }) => {
  const dueDate = parseAssignmentDate(assignment.due_date)

  return (
    <li className="tasks-list__item">
      <span className="tasks-list__name">{assignment.title}</span>
      <span className="tasks-list__meta">
        {compact ? `${formatDay(dueDate)} · ` : ''}
        {formatTime(dueDate)}
      </span>
      {assignment.course?.title ? <span className="tasks-list__course">{assignment.course.title}</span> : null}
    </li>
  )
}

const TasksList = ({ assignments = [], selectedDate = new Date(), isLoading = false, error = null, onRetry }) => {
  const selectedAssignments = assignments
    .filter((assignment) => {
      const dueDate = parseAssignmentDate(assignment.due_date)
      return dueDate ? isSameDay(dueDate, selectedDate) : false
    })
    .sort(sortByDueDate)

  const upcomingAssignments = assignments
    .filter((assignment) => {
      const dueDate = parseAssignmentDate(assignment.due_date)
      return dueDate ? isAfter(dueDate, new Date()) : false
    })
    .sort(sortByDueDate)
    .slice(0, 3)

  return (
    <section className="tasks-list" aria-live="polite">
      <div className="tasks-list__header">
        <h2 className="tasks-list__title">Tareas pendientes:</h2>
        <Link className="tasks-list__link" to="/student/tasks">
          Ver todas
        </Link>
      </div>

      {isLoading ? <p className="tasks-list__state">Cargando tareas...</p> : null}

      {!isLoading && error ? (
        <div className="tasks-list__state tasks-list__state--error">
          <p>No se pudieron cargar las tareas.</p>
          {onRetry ? (
            <button className="tasks-list__retry" type="button" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && selectedAssignments.length ? (
        <ul className="tasks-list__items">
          {selectedAssignments.map((assignment) => (
            <TaskCard key={assignment.id} assignment={assignment} />
          ))}
        </ul>
      ) : null}

      {!isLoading && !error && !selectedAssignments.length ? (
        <div className="tasks-list__empty">
          <p>No hay tareas para este día.</p>
          <h3 className="tasks-list__subtitle">Próximas tareas:</h3>
          {upcomingAssignments.length ? (
            <ul className="tasks-list__items">
              {upcomingAssignments.map((assignment) => (
                <TaskCard key={assignment.id} assignment={assignment} compact />
              ))}
            </ul>
          ) : (
            <p className="tasks-list__state">No hay tareas próximas.</p>
          )}
        </div>
      ) : null}
    </section>
  )
}

export default TasksList