import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ListFilter, SlidersHorizontal } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { apiClient } from '../../services/apiClient'
import { dataItems, formatDate, getErrorMessage } from './adminPageUtils'

const KPI_CARDS = [
	{ key: 'active_students', label: 'Alumnos activos', total: 60 },
	{ key: 'active_courses', label: 'Cursos activos', total: 10 },
	{ key: 'active_teachers', label: 'Docentes activos', total: 14 },
]

const PAGE_SIZE = 14

const initialDashboardStats = {
	active_students: 0,
	active_teachers: 0,
	active_courses: 0,
	recent_level_test_leads: 0,
}

const recommendedBonusByLevel = {
	A1: 'Conversación avanzada',
	A2: 'Inglés para negocios',
	B1: 'Intensivo de verano',
	B2: 'Inglés académico',
	C1: 'Curso de pronunciación',
	C2: 'Inglés para viajes',
}

const isRecentLead = (lead) => {
	const createdAt = new Date(lead.created_at)

	if (Number.isNaN(createdAt.getTime())) {
		return false
	}

	return Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000
}

const paginationPages = (currentPage, lastPage) => {
	if (lastPage <= 5) {
		return Array.from({ length: lastPage }, (_, index) => index + 1)
	}

	if (currentPage <= 3) {
		return [1, 2, 3, 4, 'ellipsis', lastPage]
	}

	if (currentPage >= lastPage - 2) {
		return [1, 'ellipsis', lastPage - 3, lastPage - 2, lastPage - 1, lastPage]
	}

	return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', lastPage]
}

const AdminDashboard = () => {
	const { registerRefreshAction } = useOutletContext() ?? {}
	const [leads, setLeads] = useState([])
	const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 })
	const [dashboardStats, setDashboardStats] = useState(initialDashboardStats)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [feedback, setFeedback] = useState('')
	const requestIdRef = useRef(0)

	const loadDashboardData = useCallback(async (page = 1) => {
		const requestId = requestIdRef.current + 1
		requestIdRef.current = requestId
		setIsLoading(true)
		setError('')
		setFeedback('')

		try {
			const [summaryResponse, leadsResponse] = await Promise.all([
				apiClient.get('/admin/dashboard'),
				apiClient.get('/level-tests', { params: { page, per_page: PAGE_SIZE } }),
			])

			if (requestId === requestIdRef.current) {
				setDashboardStats({ ...initialDashboardStats, ...summaryResponse.data })
				setLeads(dataItems(leadsResponse))
				setPagination({
					currentPage: Number(leadsResponse.data?.current_page ?? page),
					lastPage: Number(leadsResponse.data?.last_page ?? 1),
					total: Number(leadsResponse.data?.total ?? 0),
				})
			}
		} catch (requestError) {
			if (requestId === requestIdRef.current) {
				setError(getErrorMessage(requestError, 'No se pudieron cargar los datos del dashboard.'))
			}
		} finally {
			if (requestId === requestIdRef.current) {
				setIsLoading(false)
			}
		}
	}, [])

	const recentLeadCount = Number(dashboardStats.recent_level_test_leads ?? leads.filter(isRecentLead).length)
	const pages = useMemo(() => paginationPages(pagination.currentPage, pagination.lastPage), [pagination.currentPage, pagination.lastPage])
	const leadLabel = `${recentLeadCount.toLocaleString('es-ES')} nuevos lead`

	const goToPage = (page) => {
		if (page < 1 || page > pagination.lastPage || page === pagination.currentPage || isLoading) {
			return
		}

		loadDashboardData(page)
	}

	useEffect(() => {
		Promise.resolve().then(() => loadDashboardData(1))
	}, [loadDashboardData])

	useEffect(() => {
		if (!registerRefreshAction) {
			return undefined
		}

		registerRefreshAction({ onRefresh: () => loadDashboardData(pagination.currentPage), isLoading })

		return () => registerRefreshAction(null)
	}, [registerRefreshAction, loadDashboardData, isLoading, pagination.currentPage])

	return (
		<section className="admin-dashboard" aria-labelledby="admin-dashboard-title">
			<header className="admin-dashboard__intro">
				<h1 className="admin-dashboard__title" id="admin-dashboard-title">Datos de la academia</h1>
			</header>

			{error ? <div className="admin-dashboard__alert" role="alert">{error}</div> : null}
			{feedback ? <div className="admin-dashboard__alert admin-dashboard__alert--info" role="status">{feedback}</div> : null}

			<div className="admin-dashboard__kpis" aria-label="Indicadores principales">
				{KPI_CARDS.map(({ key, label, total }) => (
					<article key={label} className="admin-dashboard__kpi-card">
						<span className="admin-dashboard__kpi-label">{label}</span>
						<strong className="admin-dashboard__kpi-value">{Number(dashboardStats[key] ?? 0).toLocaleString('es-ES')}<span>/{total}</span></strong>
					</article>
				))}
			</div>

			<div className="admin-dashboard__main-grid admin-dashboard__main-grid--single">
				<section className="admin-dashboard__card admin-dashboard__card--leads" aria-labelledby="level-test-leads-title" aria-busy={isLoading}>
					<header className="admin-dashboard__card-header">
						<div className="admin-dashboard__heading-group">
							<h2 className="admin-dashboard__card-title" id="level-test-leads-title">Pruebas de nivel recibidas</h2>
							<span className="admin-dashboard__lead-count">{leadLabel}</span>
						</div>
						<div className="admin-dashboard__toolbar" aria-label="Acciones de tabla">
							<button className="admin-dashboard__toolbar-button" type="button" title="Ordenar pruebas" aria-label="Ordenar pruebas">
								<ListFilter size={18} aria-hidden="true" />
							</button>
							<button className="admin-dashboard__toolbar-button" type="button" title="Filtrar pruebas" aria-label="Filtrar pruebas">
								<SlidersHorizontal size={18} aria-hidden="true" />
							</button>
						</div>
					</header>

					<div className="admin-dashboard__table-wrap">
						<table className="admin-dashboard__table">
							<thead><tr><th>Nombre</th><th>Email</th><th>Fecha</th><th>Nivel obtenido</th><th>Curso recomendado</th><th>Contactado</th></tr></thead>
							<tbody>
								{!isLoading && leads.length === 0 ? <tr className="admin-dashboard__empty-row"><td colSpan={6}>Sin registros</td></tr> : null}
								{leads.map((lead) => (
									<tr key={lead.id}>
										<td>{lead.name ?? 'Lead sin cuenta'}</td>
										<td>{lead.email ?? lead.guest_email ?? 'Sin email'}</td>
										<td>{formatDate(lead.test_date ?? lead.created_at)}</td>
										<td className="admin-dashboard__level-cell">{lead.cefr_level ?? '-'}</td>
										<td>{recommendedBonusByLevel[lead.cefr_level] ?? 'Pendiente de valoración'}</td>
										<td className="admin-dashboard__contact-cell"><input type="checkbox" title="Marcar como contactado" aria-label={`Marcar ${lead.name ?? lead.email ?? 'lead'} como contactado`} /></td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<nav className="admin-dashboard__pagination" aria-label="Paginación de pruebas de nivel">
						<button className="admin-dashboard__page-control" type="button" title="Página anterior" aria-label="Página anterior" disabled={pagination.currentPage <= 1 || isLoading} onClick={() => goToPage(pagination.currentPage - 1)}>
							<ChevronLeft size={18} aria-hidden="true" />
						</button>
						{pages.map((page) => (
							typeof page === 'number' ? (
								<button key={page} className={page === pagination.currentPage ? 'admin-dashboard__page admin-dashboard__page--active' : 'admin-dashboard__page'} type="button" aria-current={page === pagination.currentPage ? 'page' : undefined} onClick={() => goToPage(page)}>
									{page}
								</button>
							) : <span key={page} className="admin-dashboard__pagination-ellipsis">...</span>
						))}
						<button className="admin-dashboard__page-control" type="button" title="Página siguiente" aria-label="Página siguiente" disabled={pagination.currentPage >= pagination.lastPage || isLoading} onClick={() => goToPage(pagination.currentPage + 1)}>
							<ChevronRight size={18} aria-hidden="true" />
						</button>
					</nav>
				</section>
			</div>
		</section>
	)
}

export default AdminDashboard