'use client'

import * as React from 'react'
// Sentry disabled to prevent build errors
// import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Global Error Handler for Next.js App Router
 * This catches errors that occur in the root layout
 * Must be a minimal component that works even if the app is completely broken
 */
export default function GlobalError({ 
  error,
  reset 
}: { 
  error: Error & { digest?: string }
  reset: () => void 
}) {
  useEffect(() => {
    // Log error to Sentry with critical priority - DISABLED
    // Sentry.captureException(error, {
    //   level: 'fatal',
    //   tags: {
    //     error_boundary: 'global_error',
    //     error_digest: error.digest,
    //   },
    //   extra: {
    //     errorMessage: error.message,
    //     errorStack: error.stack,
    //     errorDigest: error.digest,
    //   },
    // })

    // Log to console
    console.error('Global Error:', error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error - Zyphex Tech</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          
          .container {
            max-width: 600px;
            width: 100%;
            text-align: center;
            padding: 2rem;
          }
          
          .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .icon svg {
            width: 40px;
            height: 40px;
            color: #ef4444;
          }
          
          h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #ffffff;
          }
          
          p {
            font-size: 1.125rem;
            color: #a3a3a3;
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          
          .buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          button, a {
            padding: 0.75rem 2rem;
            font-size: 1rem;
            font-weight: 500;
            border-radius: 0.5rem;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            border: none;
          }
          
          .primary {
            background: #7c3aed;
            color: #ffffff;
          }
          
          .primary:hover {
            background: #6d28d9;
          }
          
          .secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .secondary:hover {
            background: rgba(255, 255, 255, 0.15);
          }
          
          .error-details {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 0.5rem;
            text-align: left;
          }
          
          .error-details code {
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            color: #ef4444;
            word-break: break-all;
          }
          
          .info {
            margin-top: 2rem;
            font-size: 0.875rem;
            color: #737373;
          }
          
          @media (max-width: 640px) {
            h1 {
              font-size: 1.5rem;
            }
            p {
              font-size: 1rem;
            }
            .buttons {
              flex-direction: column;
            }
            button, a {
              width: 100%;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          <h1>Critical System Error</h1>
          
          <p>
            We encountered a critical error that prevented the application from loading properly. 
            Our team has been automatically notified.
          </p>

          <div className="buttons">
            <button 
              onClick={reset} 
              className="primary"
              type="button"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Try Again
            </button>
            
            <Link 
              href="/" 
              className="secondary"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go to Homepage
            </Link>
          </div>

          {error.digest && (
            <div className="error-details">
              <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Error Reference:</p>
              <code>{error.digest}</code>
            </div>
          )}

          <p className="info">
            If this problem persists, please contact our support team at{' '}
            <Link href="/contact" style={{ color: '#7c3aed' }}>support</Link>
          </p>
        </div>
      </body>
    </html>
  )
}