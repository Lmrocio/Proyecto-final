import { useCallback, useEffect, useState } from 'react'
import { BookOpen, TrendingUp, UserRoundCheck } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { apiClient } from '../../services/apiClient'
import { dataItems, formatDate, getErrorMessage } from './adminPageUtils'

const KPI_CARDS = [
	{ key: 'active_students', label: 'Alumnos Activos', icon: UserRoundCheck },
	{ key: 'active_courses', label: 'Cursos en Marcha', icon: BookOpen },
	{ key: 'monthly_leads', label: 'Leads este mes', icon: TrendingUp },
]

const initialDashboardStats = {
	active_students: 0,
	active_courses: 0,
	monthly_leads: 0,
}

const AdminDashboard = () => {
	const navigate = useNavigate()
	const { registerRefreshAction } = useOutletContext() ?? {}
	const [leads, setLeads] = useState([])
	const [dashboardStats, setDashboardStats] = useState(initialDashboardStats)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const loadDashboardData = useCallback(async () => {
		setIsLoading(true)
		setError('')

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
			<header className="admin-dashboard__header">
				<h1 className="admin-dashboard__title" id="admin-dashboard-title">Dashboard</h1>
			</header>

			{error ? <div className="admin-dashboard__alert" role="alert">{error}</div> : null}

			<div className="admin-dashboard__kpis" aria-label="Indicadores principales">
				{KPI_CARDS.map(({ key, label, icon: Icon }) => (
					<article key={label} className="admin-dashboard__kpi-card">
						<span className="admin-dashboard__kpi-icon" aria-hidden="true"><Icon size={22} /></span>
						<span className="admin-dashboard__kpi-label">{label}</span>
						<strong className="admin-dashboard__kpi-value">{Number(dashboardStats[key] ?? 0).toLocaleString('es-ES')}</strong>
					</article>
				))}
			</div>

			<div className="admin-dashboard__main-grid">
				<section className="admin-dashboard__card admin-dashboard__card--leads" aria-labelledby="level-test-leads-title" aria-busy={isLoading}>
					<header className="admin-dashboard__card-header">
						<h2 className="admin-dashboard__card-title" id="level-test-leads-title">Últimos Tests de Nivel (Leads)</h2>
					</header>

					<div className="admin-dashboard__table-wrap">
						<table className="admin-dashboard__table">
							<thead><tr><th>Email</th><th>Nivel Sugerido</th><th>Puntuación</th><th>Fecha</th></tr></thead>
							<tbody>
								{!isLoading && leads.length === 0 ? <tr className="admin-dashboard__empty-row"><td colSpan={4}>Sin registros</td></tr> : null}
								{leads.map((lead) => (
									<tr key={lead.id}>
										<td><strong>{lead.guest_email ?? lead.email ?? 'Sin email'}</strong></td>
										<td><span className="admin-dashboard__level-badge">{lead.cefr_level ?? '-'}</span></td>
										<td>{lead.total_score ?? '-'}</td>
										<td>{formatDate(lead.test_date ?? lead.created_at)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<aside className="admin-dashboard__card admin-dashboard__card--actions" aria-labelledby="quick-actions-title">
					<h2 className="admin-dashboard__card-title" id="quick-actions-title">Acciones Rápidas</h2>
					<div className="admin-dashboard__actions">
						<button className="button button--primary admin-dashboard__action" type="button" onClick={() => navigate('/admin/students')}>Matricular Alumno</button>
						<button className="button button--primary admin-dashboard__action" type="button" onClick={() => navigate('/admin/courses')}>Abrir Nuevo Curso</button>
						<button className="button button--primary admin-dashboard__action" type="button" onClick={() => navigate('/admin/appearance')}>Configuración Visual</button>
					</div>
				</aside>
				</div>
		</section>
	)
}

export default AdminDashboard