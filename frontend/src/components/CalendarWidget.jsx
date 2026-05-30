import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const parseAssignmentDate = (dueDate) => {
  if (!dueDate) {
    return null
  }

  const parsedDate = typeof dueDate === 'string' ? parseISO(dueDate) : new Date(dueDate)
  return isValid(parsedDate) ? parsedDate : null
}

const CalendarWidget = ({ assignments = [], onSelectedDateChange }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth)
    const monthEnd = endOfMonth(visibleMonth)

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    })
  }, [visibleMonth])

  const assignmentDates = useMemo(
    () => assignments.map((assignment) => parseAssignmentDate(assignment.due_date)).filter(Boolean),
    [assignments],
  )

  useEffect(() => {
    onSelectedDateChange?.(selectedDate)
  }, [onSelectedDateChange, selectedDate])

  const selectDay = (day) => {
    setSelectedDate(day)
    setVisibleMonth(day)
  }

  const goToToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setVisibleMonth(today)
  }

  return (
    <section className="calendar" aria-label="Calendario mensual">
      <header className="calendar__header">
        <div className="calendar__controls">
          <button
            className="calendar__control"
            type="button"
            title="Mes anterior"
            aria-label="Mes anterior"
            onClick={() => setVisibleMonth((currentMonth) => subMonths(currentMonth, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="calendar__control"
            type="button"
            title="Mes siguiente"
            aria-label="Mes siguiente"
            onClick={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="calendar__title">{format(visibleMonth, 'LLLL yyyy', { locale: es })}</span>
        <button className="calendar__today" type="button" onClick={goToToday}>
          Hoy
        </button>
      </header>
      <div className="calendar__grid" role="grid">
        {DAYS.map((day) => (
          <span key={day} className="calendar__dow" role="columnheader">
            {day}
          </span>
        ))}
        {calendarDays.map((day) => {
          const hasAssignments = assignmentDates.some((assignmentDate) => isSameDay(assignmentDate, day))
          const classNames = [
            'calendar__day',
            !isSameMonth(day, visibleMonth) ? 'calendar__day--muted' : '',
            isToday(day) ? 'calendar__day--today' : '',
            isSameDay(day, selectedDate) ? 'calendar__day--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={day.toISOString()}
              className={classNames}
              type="button"
              role="gridcell"
              aria-pressed={isSameDay(day, selectedDate)}
              onClick={() => selectDay(day)}
            >
              <span className="calendar__number">{format(day, 'd')}</span>
              {hasAssignments ? <span className="calendar__task-dot" aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default CalendarWidget
