'use client'

/**
 * Test page for error.tsx error boundary
 * Navigate to /test-error to trigger the error boundary
 */
export default function TestErrorPage() {
  // Immediately throw an error when component renders
  throw new Error('Test Error: This is a simulated error to test app/error.tsx')
  
  // This code will never execute
  return <div>This should never render</div>
}
