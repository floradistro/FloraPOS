import { render, screen, fireEvent } from '@testing-library/react'
import { WarningMessages } from '../WarningMessages'

describe('WarningMessages', () => {
  const mockOnDismiss = jest.fn()

  beforeEach(() => {
    mockOnDismiss.mockClear()
  })

  it('renders nothing when no warnings', () => {
    const { container } = render(
      <WarningMessages warnings={[]} onDismiss={mockOnDismiss} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders warning messages when provided', () => {
    const warnings = ['Warning 1', 'Warning 2']
    render(<WarningMessages warnings={warnings} onDismiss={mockOnDismiss} />)
    
    expect(screen.getByText('Warning 1')).toBeTruthy()
    expect(screen.getByText('Warning 2')).toBeTruthy()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const warnings = ['Test warning']
    render(<WarningMessages warnings={warnings} onDismiss={mockOnDismiss} />)
    
    const dismissButton = screen.getByTitle('Dismiss warnings')
    fireEvent.click(dismissButton)
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders correct number of warning paragraphs', () => {
    const warnings = ['Warning 1', 'Warning 2', 'Warning 3']
    render(<WarningMessages warnings={warnings} onDismiss={mockOnDismiss} />)
    
    const warningElements = screen.getAllByText(/Warning \d/)
    expect(warningElements).toHaveLength(3)
  })
})
