import { useEffect, useMemo, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { RefreshCcw, Send } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import StudentLayout from '../layouts/StudentLayout'
import { useConfig } from '../context/configContext'
import { apiClient } from '../services/apiClient'

const STATUS_LABELS = {
	pending: 'Pendiente',
	submitted: 'Entregada',
	graded: 'Calificada',
	overdue: 'Vencida',
}

const parseDate = (value) => {
	if (!value) {
		return null
	}

	const parsedDate = typeof value === 'string' ? parseISO(value) : new Date(value)
	return isValid(parsedDate) ? parsedDate : null
}

const formatDueDate = (value) => {
	const date = parseDate(value)
	return date ? format(date, "d MMM yyyy 'a las' HH:mm", { locale: es }) : 'Sin fecha limite'
}

const resolveStatus = (assignment) => {
	if (assignment.submission?.grade !== null && assignment.submission?.grade !== undefined) {
		return 'graded'
	}

	if (assignment.submission) {
		return 'submitted'
	}

	return assignment.status ?? 'pending'
}

const StudentTasksPage = () => {
	const { uiVariant } = useConfig()
	const [assignments, setAssignments] = useState([])
	const [drafts, setDrafts] = useState({})
	const [filter, setFilter] = useState('all')
	const [isLoading, setIsLoading] = useState(true)
	const [pendingId, setPendingId] = useState(null)
	const [error, setError] = useState(null)
	const [feedback, setFeedback] = useState('')

	const loadAssignments = async () => {
		setIsLoading(true)
		setError(null)

		try {
			const { data } = await apiClient.get('/student/assignments')
			setAssignments(Array.isArray(data?.data) ? data.data : [])
		} catch (requestError) {
			setError(requestError)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		let isMounted = true

		const run = async () => {
			try {
				const { data } = await apiClient.get('/student/assignments')
				if (isMounted) {
					setAssignments(Array.isArray(data?.data) ? data.data : [])
					setError(null)
				}
			} catch (requestError) {
				if (isMounted) {
					setError(requestError)
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		run()

		return () => {
			isMounted = false
		}
	}, [])

	const filteredAssignments = useMemo(() => {
		const sortedAssignments = [...assignments].sort((leftAssignment, rightAssignment) => {
			const leftDate = parseDate(leftAssignment.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
			const rightDate = parseDate(rightAssignment.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
			return leftDate - rightDate
		})

		if (filter === 'all') {
			return sortedAssignments
		}

		return sortedAssignments.filter((assignment) => resolveStatus(assignment) === filter)
	}, [assignments, filter])

	const counts = useMemo(
		() => assignments.reduce(
			(currentCounts, assignment) => {
				const status = resolveStatus(assignment)
				return {
					...currentCounts,
					[status]: currentCounts[status] + 1,
					all: currentCounts.all + 1,
				}
			},
			{ all: 0, pending: 0, submitted: 0, graded: 0, overdue: 0 },
		),
		[assignments],
	)

	const updateDraft = (assignmentId, value) => {
		setDrafts((currentDrafts) => ({ ...currentDrafts, [assignmentId]: value }))
		setFeedback('')
	}

	const submitAssignment = async (assignment) => {
		const content = drafts[assignment.id]?.trim()
		if (!content) {
			setFeedback('Escribe una respuesta antes de entregar la tarea.')
			return
		}

		setPendingId(assignment.id)
		setFeedback('')

		try {
			const { data } = await apiClient.post('/submissions', {
				assignment_id: assignment.id,
				content,
			})

			setAssignments((currentAssignments) =>
				currentAssignments.map((currentAssignment) =>
					currentAssignment.id === assignment.id
						? {
								...currentAssignment,
								status: data?.grade !== null && data?.grade !== undefined ? 'graded' : 'submitted',
								submission: {
									id: data?.id,
									grade: data?.grade,
									teacher_feedback: data?.teacher_feedback,
									submitted_at: data?.created_at,
								},
							}
						: currentAssignment,
				),
			)
			setDrafts((currentDrafts) => ({ ...currentDrafts, [assignment.id]: '' }))
			setFeedback('Tarea entregada correctamente.')
		} catch (requestError) {
			setFeedback(requestError?.response?.data?.message ?? 'No se pudo entregar la tarea.')
		} finally {
			setPendingId(null)
		}
	}

	return (
		<StudentLayout variant={uiVariant ?? 'v1'}>
			<section className="management management--student" aria-labelledby="student-tasks-title">
				<header className="management__header">
					<div>
						<p className="management__eyebrow">Aula virtual</p>
						<h1 className="management__title" id="student-tasks-title">Todas las tareas</h1>
						<p className="management__subtitle">Consulta, filtra y entrega tus actividades pendientes.</p>
					</div>
					<button className="management__button management__button--secondary" type="button" onClick={loadAssignments} disabled={isLoading}>
						<RefreshCcw size={16} aria-hidden="true" />
						Actualizar
					</button>
				</header>

				<div className="management__stats" aria-label="Resumen de tareas">
					{[
						['all', 'Total'],
						['pending', 'Pendientes'],
						['submitted', 'Entregadas'],
						['graded', 'Calificadas'],
						['overdue', 'Vencidas'],
					].map(([key, label]) => (
						<button
							key={key}
							className={filter === key ? 'management__stat management__stat--active' : 'management__stat'}
							type="button"
							onClick={() => setFilter(key)}
						>
							<span>{label}</span>
							<strong>{counts[key]}</strong>
						</button>
					))}
				</div>

				{feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}

				{isLoading ? <Skeleton variant="card" lines={4} label="Cargando tareas" /> : null}

				{!isLoading && error ? (
					<EmptyState title="No se pudieron cargar las tareas" text="Revisa tu conexión e inténtalo de nuevo." actionLabel="Reintentar" onAction={loadAssignments} tone="error" />
				) : null}

				{!isLoading && !error && !filteredAssignments.length ? (
					<EmptyState title="Sin tareas" text="No hay tareas en este filtro." tone="ok" />
				) : null}

				{!isLoading && !error && filteredAssignments.length ? (
					<div className="management__list">
						{filteredAssignments.map((assignment) => {
							const status = resolveStatus(assignment)
							const isPending = status === 'pending' || status === 'overdue'

							return (
								<article className="management__item" key={assignment.id}>
									<div className="management__item-main">
										<span className={`management__badge management__badge--${status}`}>{STATUS_LABELS[status] ?? status}</span>
										<h2 className="management__item-title">{assignment.title}</h2>
										<p className="management__item-copy">{assignment.description ?? 'El profesor no ha añadido instrucciones adicionales.'}</p>
										<div className="management__meta">
											<span>{assignment.course?.title ?? 'Curso'}</span>
											<span>{assignment.unit_name ?? 'Unidad general'}</span>
											<span>{formatDueDate(assignment.due_date)}</span>
										</div>
										{assignment.submission ? (
											<div className="management__notice">
												<strong>Entrega registrada.</strong>
												{assignment.submission.grade !== null && assignment.submission.grade !== undefined ? <span>Nota: {assignment.submission.grade}</span> : null}
												{assignment.submission.teacher_feedback ? <span>{assignment.submission.teacher_feedback}</span> : null}
											</div>
										) : null}
									</div>

									{isPending ? (
										<form
											className="management__inline-form"
											onSubmit={(event) => {
												event.preventDefault()
												submitAssignment(assignment)
											}}
										>
											<label className="management__field">
												<span>Respuesta</span>
												<textarea
													rows="4"
													value={drafts[assignment.id] ?? ''}
													onChange={(event) => updateDraft(assignment.id, event.target.value)}
													placeholder="Escribe tu entrega o pega el enlace al archivo compartido."
												/>
											</label>
											<button className="management__button management__button--primary" type="submit" disabled={pendingId === assignment.id}>
												<Send size={16} aria-hidden="true" />
												{pendingId === assignment.id ? 'Entregando...' : 'Entregar'}
											</button>
										</form>
									) : null}
								</article>
							)
						})}
					</div>
				) : null}
			</section>
		</StudentLayout>
	)
}

export default StudentTasksPage