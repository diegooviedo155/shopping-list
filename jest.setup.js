// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock NextResponse to ensure it works correctly in tests
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      json: (body, init = {}) => {
        // Create a proper Response with the body
        const response = new Response(JSON.stringify(body), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init.headers,
          },
        })
        // Ensure it has the json() method
        if (!response.json) {
          response.json = async () => body
        }
        return response
      },
    },
  }
})

// Polyfill for Request/Response (needed for Next.js API routes in test environment)
// NextRequest extends Request, so we need a basic Request implementation
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      const url = typeof input === 'string' ? input : (input?.url || '')
      // Define url as a readonly property to match NextRequest behavior
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true,
        configurable: false,
      })
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers || {})
      this.body = init.body || null
      this.bodyUsed = false
      this._bodyText = null
    }
    async json() {
      if (this.bodyUsed) {
        throw new TypeError('Body already used')
      }
      this.bodyUsed = true
      if (this._bodyText === null) {
        this._bodyText = typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
      }
      return Promise.resolve(JSON.parse(this._bodyText))
    }
    async text() {
      if (this.bodyUsed) {
        throw new TypeError('Body already used')
      }
      this.bodyUsed = true
      if (this._bodyText === null) {
        this._bodyText = typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
      }
      return Promise.resolve(this._bodyText)
    }
    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      })
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      // Handle body - could be string, object, or null
      if (body === null || body === undefined) {
        this._body = null
        this._bodyText = null
      } else if (typeof body === 'string') {
        this._body = body
        this._bodyText = body
      } else {
        this._body = body
        this._bodyText = JSON.stringify(body)
      }
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers || {})
      this.ok = this.status >= 200 && this.status < 300
      this.bodyUsed = false
    }
    async json() {
      if (this.bodyUsed) {
        throw new TypeError('Body already used')
      }
      this.bodyUsed = true
      if (this._bodyText === null || this._bodyText === undefined) {
        return Promise.resolve(null)
      }
      try {
        const parsed = typeof this._bodyText === 'string' ? JSON.parse(this._bodyText) : this._bodyText
        return Promise.resolve(parsed)
      } catch (e) {
        return Promise.resolve(this._bodyText)
      }
    }
    async text() {
      if (this.bodyUsed) {
        throw new TypeError('Body already used')
      }
      this.bodyUsed = true
      if (this._bodyText === null || this._bodyText === undefined) {
        return Promise.resolve('')
      }
      return Promise.resolve(typeof this._bodyText === 'string' ? this._bodyText : JSON.stringify(this._bodyText))
    }
    clone() {
      return new Response(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      })
    }
    // Static method for NextResponse.json()
    static json(body, init = {}) {
      const headers = new Headers({
        'Content-Type': 'application/json',
        ...init.headers,
      })
      return new Response(JSON.stringify(body), {
        ...init,
        headers,
      })
    }
  }
}

// Mock fetch globally
global.fetch = jest.fn()

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.location - use a safer approach that doesn't trigger navigation
// JSDOM has location as a non-configurable property, so we can't redefine it
// Instead, we'll just ensure the properties we need are accessible
if (typeof window !== 'undefined' && window.location) {
  // Try to set properties if they're writable, but don't fail if they're not
  try {
    if (Object.getOwnPropertyDescriptor(window.location, 'origin')?.writable) {
      window.location.origin = 'http://localhost:3000'
    }
  } catch (e) {
    // Ignore - origin might be read-only
  }
  try {
    if (Object.getOwnPropertyDescriptor(window.location, 'href')?.writable) {
      window.location.href = 'http://localhost:3000'
    }
  } catch (e) {
    // Ignore - href might be read-only
  }
}

