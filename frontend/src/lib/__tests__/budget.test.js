import { describe, expect, it } from 'vitest'

import { CERTIFICATIONS, ENROLLMENT_FEE, computeBudget, formatCurrency } from '../budget'

describe('computeBudget', () => {
  it('desglosa el presupuesto con los conceptos esperados', () => {
    const budget = computeBudget({ certificationId: 'cambridge', hoursPerWeek: 4, months: 4 })

    expect(budget).not.toBeNull()
    expect(budget.weeks).toBe(16)
    expect(budget.monthlyTuition).toBe(140)
    expect(budget.tuitionTotal).toBe(560)
    expect(budget.enrollmentFee).toBe(ENROLLMENT_FEE)
    expect(budget.examFee).toBe(220)
    expect(budget.total).toBe(560 + ENROLLMENT_FEE + 220)
  })

  it('aplica las tasas de examen de cada certificación', () => {
    CERTIFICATIONS.forEach((certification) => {
      const budget = computeBudget({ certificationId: certification.id, hoursPerWeek: 2, months: 1 })
      expect(budget.examFee).toBe(certification.examFee)
    })
  })

  it('devuelve null ante datos inválidos', () => {
    expect(computeBudget({ certificationId: 'inexistente', hoursPerWeek: 4, months: 4 })).toBeNull()
    expect(computeBudget({ certificationId: 'cambridge', hoursPerWeek: 0, months: 4 })).toBeNull()
    expect(computeBudget({ certificationId: 'cambridge', hoursPerWeek: 4, months: 0 })).toBeNull()
  })
})

describe('formatCurrency', () => {
  it('formatea importes en euros', () => {
    expect(formatCurrency(560)).toContain('560')
    expect(formatCurrency(560)).toContain('€')
  })
})
