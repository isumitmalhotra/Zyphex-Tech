/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import LoginForm from '@/components/auth/login-form'

// Mock next-auth
jest.mock('next-auth/react')

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form with all fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<LoginForm />)
    
    const form = screen.getByTestId('login-form')
    
    // Try to submit without filling fields
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByTestId('email-input')
    
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur event
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('validates password minimum length', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByTestId('password-input')
    
    await user.type(passwordInput, '12345')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    
    // Mock successful login
    ;(signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
    })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('submit-button')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles login failure with error message', async () => {
    const user = userEvent.setup()
    
    // Mock failed login
    ;(signIn as jest.Mock).mockResolvedValue({
      ok: false,
      error: 'Invalid credentials',
    })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('submit-button')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables submit button during login', async () => {
    const user = userEvent.setup()
    
    ;(signIn as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )
    
    render(<LoginForm />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('submit-button')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
  })

  it('shows/hides password when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
    const toggleButton = screen.getByTestId('toggle-password')
    
    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')
    
    // Click to show password
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    // Click to hide password again
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('navigates to register page', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const registerLink = screen.getByTestId('register-link')
    await user.click(registerLink)
    
    expect(mockPush).toHaveBeenCalledWith('/auth/register')
  })

  it('navigates to forgot password page', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const forgotPasswordLink = screen.getByTestId('forgot-password-link')
    await user.click(forgotPasswordLink)
    
    expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password')
  })

  it('handles OAuth login (Google)', async () => {
    const user = userEvent.setup()
    
    ;(signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
    })
    
    render(<LoginForm />)
    
    const googleButton = screen.getByTestId('google-login-button')
    await user.click(googleButton)
    
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
  })

  it('handles OAuth login (Microsoft)', async () => {
    const user = userEvent.setup()
    
    ;(signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
    })
    
    render(<LoginForm />)
    
    const microsoftButton = screen.getByTestId('microsoft-login-button')
    await user.click(microsoftButton)
    
    expect(signIn).toHaveBeenCalledWith('azure-ad', { callbackUrl: '/dashboard' })
  })
})
