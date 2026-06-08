import { useMemo, useState } from 'react'

import {
  CERTIFICATIONS,
  INTENSITIES,
  computeBudget,
  formatCurrency,
} from '../lib/budget'

const DEFAULT_INTENSITY = INTENSITIES[1] // 4 h / semana

const BudgetCalculator = () => {
  const [certificationId, setCertificationId] = useState(CERTIFICATIONS[0].id)
  const [hoursPerWeek, setHoursPerWeek] = useState(DEFAULT_INTENSITY.hoursPerWeek)
  const [months, setMonths] = useState(4)

  const budget = useMemo(
    () => computeBudget({ certificationId, hoursPerWeek, months }),
    [certificationId, hoursPerWeek, months],
  )

  return (
    <form className="budget-calculator" aria-label="Calculadora de presupuesto" onSubmit={(event) => event.preventDefault()}>
      <div className="budget-calculator__field">
        <label className="budget-calculator__label" htmlFor="budget-certification">
          Certificación
        </label>
        <select
          id="budget-certification"
          className="budget-calculator__control"
          value={certificationId}
          onChange={(event) => setCertificationId(event.target.value)}
        >
          {CERTIFICATIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="budget-calculator__field">
        <label className="budget-calculator__label" htmlFor="budget-intensity">
          Intensidad
        </label>
        <select
          id="budget-intensity"
          className="budget-calculator__control"
          value={hoursPerWeek}
          onChange={(event) => setHoursPerWeek(Number(event.target.value))}
        >
          {INTENSITIES.map((item) => (
            <option key={item.id} value={item.hoursPerWeek}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="budget-calculator__field">
        <label className="budget-calculator__label" htmlFor="budget-months">
          Meses de preparación: <strong>{months}</strong>
        </label>
        <input
          id="budget-months"
          className="budget-calculator__range"
          type="range"
          min="1"
          max="12"
          step="1"
          value={months}
          onChange={(event) => setMonths(Number(event.target.value))}
        />
      </div>

      {budget ? (
        <div className="budget-calculator__summary" aria-live="polite">
          <dl className="budget-calculator__breakdown">
            <div className="budget-calculator__row">
              <dt>Duración estimada</dt>
              <dd>{budget.weeks} semanas</dd>
            </div>
            <div className="budget-calculator__row">
              <dt>Cuota mensual</dt>
              <dd>{formatCurrency(budget.monthlyTuition)}</dd>
            </div>
            <div className="budget-calculator__row">
              <dt>Clases ({months} meses)</dt>
              <dd>{formatCurrency(budget.tuitionTotal)}</dd>
            </div>
            <div className="budget-calculator__row">
              <dt>Matrícula</dt>
              <dd>{formatCurrency(budget.enrollmentFee)}</dd>
            </div>
            <div className="budget-calculator__row">
              <dt>Tasas de examen</dt>
              <dd>{formatCurrency(budget.examFee)}</dd>
            </div>
          </dl>

          <p className="budget-calculator__total">
            <span>Total estimado</span>
            <strong>{formatCurrency(budget.total)}</strong>
          </p>
        </div>
      ) : null}
    </form>
  )
}

export default BudgetCalculator
