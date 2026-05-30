// Modelo de presupuesto transparente para la preparación de certificaciones.
// Todos los importes están en euros y se exponen desglosados para que el
// usuario entienda cada concepto antes de matricularse.

export const ENROLLMENT_FEE = 50

export const CERTIFICATIONS = [
  { id: 'cambridge', label: 'Cambridge English', examFee: 220 },
  { id: 'trinity', label: 'Trinity College London', examFee: 150 },
  { id: 'aptis', label: 'Aptis (British Council) / Linguaskill', examFee: 90 },
]

export const INTENSITIES = [
  { id: 'light', label: '2 h / semana', hoursPerWeek: 2 },
  { id: 'standard', label: '4 h / semana', hoursPerWeek: 4 },
  { id: 'intensive', label: '6 h / semana', hoursPerWeek: 6 },
]

export const PRICE_PER_WEEKLY_HOUR = 35 // €/mes por cada hora semanal contratada
export const WEEKS_PER_MONTH = 4

const round2 = (value) => Math.round(value * 100) / 100

export const formatCurrency = (value) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

/**
 * Calcula el presupuesto desglosado de una preparación.
 *
 * @param {Object} params
 * @param {string} params.certificationId - id de CERTIFICATIONS
 * @param {number} params.hoursPerWeek - horas lectivas por semana
 * @param {number} params.months - número de meses de preparación
 * @returns {{
 *   weeks: number,
 *   monthlyTuition: number,
 *   tuitionTotal: number,
 *   enrollmentFee: number,
 *   examFee: number,
 *   total: number,
 * } | null}
 */
export const computeBudget = ({ certificationId, hoursPerWeek, months }) => {
  const certification = CERTIFICATIONS.find((item) => item.id === certificationId)

  if (!certification) {
    return null
  }

  const safeHours = Number(hoursPerWeek)
  const safeMonths = Number(months)

  if (!Number.isFinite(safeHours) || safeHours <= 0) {
    return null
  }

  if (!Number.isFinite(safeMonths) || safeMonths <= 0) {
    return null
  }

  const weeks = safeMonths * WEEKS_PER_MONTH
  const monthlyTuition = safeHours * PRICE_PER_WEEKLY_HOUR
  const tuitionTotal = monthlyTuition * safeMonths
  const examFee = certification.examFee
  const total = tuitionTotal + ENROLLMENT_FEE + examFee

  return {
    weeks,
    monthlyTuition: round2(monthlyTuition),
    tuitionTotal: round2(tuitionTotal),
    enrollmentFee: ENROLLMENT_FEE,
    examFee,
    total: round2(total),
  }
}
