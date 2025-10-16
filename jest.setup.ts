// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Load environment variables for testing
import { config } from 'dotenv'
config()

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => Math.random().toString(36).substr(2, 21),
}))

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
global.Request = class MockRequest {
  url: string;
  method: string;
  headers: Headers;
  body: any;
  
  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body || null;
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body || {};
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : '';
  }
  
  async formData() {
    return new FormData();
  }
} as any;

global.Response = class MockResponse {
  body: any;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }
  
  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }
  
  async text() {
    if (typeof this.body === 'string') {
      return this.body;
    }
    return JSON.stringify(this.body);
  }
  
  clone() {
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }
} as any;

global.Headers = class MockHeaders {
  private headers: Map<string, string> = new Map();
  
  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (init instanceof MockHeaders) {
        init.forEach((value, key) => this.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }
  
  append(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }
  
  delete(name: string) {
    this.headers.delete(name.toLowerCase());
  }
  
  get(name: string) {
    return this.headers.get(name.toLowerCase()) || null;
  }
  
  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }
  
  set(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }
  
  forEach(callback: (value: string, key: string) => void) {
    this.headers.forEach((value, key) => callback(value, key));
  }
  
  entries() {
    return this.headers.entries();
  }
  
  keys() {
    return this.headers.keys();
  }
  
  values() {
    return this.headers.values();
  }
} as any;

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
