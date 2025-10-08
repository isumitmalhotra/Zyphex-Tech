/**
 * Mock helpers for NextAuth and API responses
 */

export const mockSession = (overrides: any = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    image: null,
    ...overrides.user,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
})

export const mockAdminSession = () =>
  mockSession({
    user: {
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

export const mockProjectManagerSession = () =>
  mockSession({
    user: {
      id: 'pm-user-id',
      email: 'manager@example.com',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
    },
  })

/**
 * Mock API responses
 */
export const mockApiResponse = {
  success: (data: any = {}, message = 'Success') => ({
    ok: true,
    json: async () => ({ success: true, data, message }),
    status: 200,
  }),

  error: (message = 'Error', status = 400) => ({
    ok: false,
    json: async () => ({ success: false, error: message }),
    status,
  }),

  unauthorized: () => ({
    ok: false,
    json: async () => ({ success: false, error: 'Unauthorized' }),
    status: 401,
  }),

  forbidden: () => ({
    ok: false,
    json: async () => ({ success: false, error: 'Forbidden' }),
    status: 403,
  }),

  notFound: () => ({
    ok: false,
    json: async () => ({ success: false, error: 'Not found' }),
    status: 404,
  }),
}

/**
 * Mock fetch for API testing
 */
export const mockFetch = (response: any) => {
  global.fetch = jest.fn(() => Promise.resolve(response)) as jest.Mock
}

/**
 * Reset mocks
 */
export const resetMocks = () => {
  jest.clearAllMocks()
  jest.resetAllMocks()
}

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mock file upload
 */
export const mockFileUpload = (filename = 'test.pdf', size = 1024) => {
  const file = new File(['test content'], filename, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Mock FormData
 */
export const mockFormData = (data: Record<string, any>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

/**
 * Mock Stripe
 */
export const mockStripe = {
  paymentMethods: {
    create: jest.fn().mockResolvedValue({ id: 'pm_test123' }),
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'secret_test123',
      status: 'requires_payment_method',
    }),
    confirm: jest.fn().mockResolvedValue({
      id: 'pi_test123',
      status: 'succeeded',
    }),
  },
  customers: {
    create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
  },
}

/**
 * Mock Resend email service
 */
export const mockResend = {
  emails: {
    send: jest.fn().mockResolvedValue({
      id: 'email_test123',
      from: 'test@example.com',
      to: 'recipient@example.com',
      created_at: new Date().toISOString(),
    }),
  },
}

/**
 * Mock Socket.io
 */
export const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
}

/**
 * Create mock request for API routes
 */
export const mockRequest = (method: string, body: any = {}, headers: any = {}) => ({
  method,
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  json: async () => body,
  body,
})

/**
 * Create mock Next.js request context
 */
export const mockRequestContext = (params: any = {}, searchParams: any = {}) => ({
  params,
  searchParams,
})
