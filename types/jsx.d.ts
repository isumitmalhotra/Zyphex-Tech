/// <reference types="react" />
/// <reference types="react-dom" />

/**
 * Global JSX type declarations for Next.js application
 * This resolves IDE TypeScript Language Server display issues where
 * JSX elements show "implicitly has type 'any'" warnings
 */

declare global {
  namespace JSX {
    // Use React's built-in JSX namespace
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};