import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import BudgetCalculator from '../BudgetCalculator'

const hasText = (expected) => (_content, element) =>
  element?.tagName.toLowerCase() === 'dd' && element.textContent.replace(/\s+/g, ' ').trim() === expected

describe('BudgetCalculator', () => {
  it('muestra un total estimado inicial', () => {
    render(<BudgetCalculator />)

    expect(screen.getByLabelText('Calculadora de presupuesto')).toBeInTheDocument()
    expect(screen.getByText('Total estimado')).toBeInTheDocument()
    expect(screen.getByText(hasText('16 semanas'))).toBeInTheDocument()
  })

  it('recalcula la duración al cambiar los meses', () => {
    render(<BudgetCalculator />)

    const monthsRange = screen.getByLabelText(/Meses de preparación/i)
    fireEvent.change(monthsRange, { target: { value: '6' } })

    expect(screen.getByText(hasText('24 semanas'))).toBeInTheDocument()
  })
})
