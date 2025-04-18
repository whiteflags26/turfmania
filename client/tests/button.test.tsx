import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '../components/Button'

// Mock the cn utility if needed
jest.mock('@/lib/utils/utils', () => ({
  cn: jest.fn((...args) => args.join(' '))
}))

describe('Button Component', () => {
  it('renders as a button by default', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders as a link when href is provided', () => {
    render(<Button href="/about">About</Button>)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('applies default variant classes', () => {
    render(<Button variant="default">Default</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary text-primary-foreground')
    expect(button).toHaveClass('inline-flex items-center justify-center rounded-md')
  })

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive text-destructive-foreground')
  })

  it('applies size classes', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-11 px-8 rounded-md')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable</Button>)
    fireEvent.click(screen.getByText('Clickable'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('buttonVariants utility', () => {
  it('returns correct classes for default variant', () => {
    const result = buttonVariants({ variant: 'default' })
    expect(result).toContain('bg-primary text-primary-foreground')
  })
})