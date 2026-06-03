import { useCallback, useEffect, useState } from 'react'
import { BookOpen, GraduationCap, Mail, Trash2, UserRoundCheck } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { apiClient } from '../../services/apiClient'
import { dataItems, formatDate, getErrorMessage } from './adminPageUtils'

const KPI_CARDS = [
	{ key: 'active_students', label: 'Alumnos', icon: UserRoundCheck },
	{ key: 'active_teachers', label: 'Docentes', icon: GraduationCap },
	{ key: 'active_courses', label: 'Cursos activos', icon: BookOpen },
]

const initialDashboardStats = {
	active_students: 0,
	active_teachers: 0,
	active_courses: 0,
}

const recommendedBonusByLevel = {
	A1: 'Intensivo A2',
	A2: 'Intensivo B1',
	B1: 'Intensivo B2',
	B2: 'Intensivo C1',
	C1: 'Perfeccionamiento C2',
	C2: 'Conversación avanzada',
}

const AdminDashboard = () => {
	const { registerRefreshAction } = useOutletContext() ?? {}
	const [leads, setLeads] = useState([])
	const [dashboardStats, setDashboardStats] = useState(initialDashboardStats)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [feedback, setFeedback] = useState('')

	const loadDashboardData = useCallback(async () => {
		setIsLoading(true)
		setError('')
		setFeedback('')

		try {
			const [summaryResponse, leadsResponse] = await Promise.all([
				apiClient.get('/admin/dashboard'),
				apiClient.get('/level-tests', { params: { per_page: 100 } }),
			])

			setDashboardStats({ ...initialDashboardStats, ...summaryResponse.data })
			setLeads(dataItems(leadsResponse))
		} catch (requestError) {
			setError(getErrorMessage(requestError, 'No se pudieron cargar los datos del dashboard.'))
		} finally {
			setIsLoading(false)
		}
	}, [])

	const deleteLead = async (lead) => {
		if (!window.confirm('¿Eliminar esta prueba de nivel?')) {
			return
		}

		try {
			await apiClient.delete(`/level-tests/${lead.id}`)
			setLeads((currentLeads) => currentLeads.filter((item) => item.id !== lead.id))
			setFeedback('Prueba de nivel eliminada correctamente.')
		} catch (requestError) {
			setFeedback(getErrorMessage(requestError, 'No se pudo eliminar la prueba de nivel.'))
		}
	}

	useEffect(() => {
		Promise.resolve().then(loadDashboardData)
	}, [loadDashboardData])

	useEffect(() => {
		if (!registerRefreshAction) {
			return undefined
		}

		registerRefreshAction({ onRefresh: loadDashboardData, isLoading })

		return () => registerRefreshAction(null)
	}, [registerRefreshAction, loadDashboardData, isLoading])

	return (
		<section className="admin-dashboard" aria-labelledby="admin-dashboard-title">
			<h1 className="u-visually-hidden" id="admin-dashboard-title">Dashboard</h1>

			{error ? <div className="admin-dashboard__alert" role="alert">{error}</div> : null}
			{feedback ? <div className="admin-dashboard__alert admin-dashboard__alert--info" role="status">{feedback}</div> : null}

			<div className="admin-dashboard__kpis" aria-label="Indicadores principales">
				{KPI_CARDS.map(({ key, label, icon: Icon }) => (
					<article key={label} className="admin-dashboard__kpi-card">
						<span className="admin-dashboard__kpi-icon" aria-hidden="true"><Icon size={22} /></span>
						<span className="admin-dashboard__kpi-label">{label}</span>
						<strong className="admin-dashboard__kpi-value">{Number(dashboardStats[key] ?? 0).toLocaleString('es-ES')}</strong>
					</article>
				))}
			</div>

			<div className="admin-dashboard__main-grid admin-dashboard__main-grid--single">
				<section className="admin-dashboard__card admin-dashboard__card--leads" aria-labelledby="level-test-leads-title" aria-busy={isLoading}>
					<header className="admin-dashboard__card-header">
						<h2 className="admin-dashboard__card-title" id="level-test-leads-title">Pruebas de nivel recibidas</h2>
					</header>

					<div className="admin-dashboard__table-wrap">
						<table className="admin-dashboard__table">
							<thead><tr><th>Email</th><th>Nivel obtenido</th><th>Bono recomendado</th><th>Fecha realización</th><th>Acciones</th></tr></thead>
							<tbody>
								{!isLoading && leads.length === 0 ? <tr className="admin-dashboard__empty-row"><td colSpan={5}>Sin registros</td></tr> : null}
								{leads.map((lead) => (
									<tr key={lead.id}>
										<td><strong>{lead.guest_email ?? lead.email ?? 'Sin email'}</strong></td>
										<td>{lead.cefr_level ?? '-'}</td>
										<td>{recommendedBonusByLevel[lead.cefr_level] ?? 'Pendiente de valoración'}</td>
										<td>{formatDate(lead.test_date ?? lead.created_at)}</td>
										<td>
											<div className="management__row-actions">
												<a className="management__icon-action" href={`mailto:${lead.guest_email ?? lead.email}?subject=Resultado de tu prueba de nivel OpenClassy`} title="Mandar email" aria-label="Mandar email"><Mail size={18} aria-hidden="true" /></a>
												<button className="management__icon-action management__icon-action--danger" type="button" title="Eliminar" aria-label="Eliminar prueba" onClick={() => deleteLead(lead)}><Trash2 size={18} aria-hidden="true" /></button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</section>
	)
}

export default AdminDashboard