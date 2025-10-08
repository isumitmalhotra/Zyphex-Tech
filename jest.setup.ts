// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock Next.js server environment for API tests
global.Request = class Request {
  constructor(public url: string, public init?: RequestInit) {}
  headers = new Headers()
  method = 'GET'
  body = null
  json = async () => ({})
  text = async () => ''
  formData = async () => new FormData()
} as any

global.Response = class Response {
  constructor(public body?: BodyInit | null, public init?: ResponseInit) {}
  status = 200
  statusText = 'OK'
  headers = new Headers()
  ok = true
  json = async () => ({})
  text = async () => ''
} as any

global.Headers = class Headers {
  private headers: Map<string, string> = new Map()
  append(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value)
  }
  delete(name: string) {
    this.headers.delete(name.toLowerCase())
  }
  get(name: string) {
    return this.headers.get(name.toLowerCase()) || null
  }
  has(name: string) {
    return this.headers.has(name.toLowerCase())
  }
  set(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value)
  }
  forEach(callback: (value: string, key: string) => void) {
    this.headers.forEach((value, key) => callback(value, key))
  }
} as any

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock environment variables
process.env = {
  ...process.env,
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/test_db',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'test-secret',
  RESEND_API_KEY: 'test-resend-key',
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
}

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}
