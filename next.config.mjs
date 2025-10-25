/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC minification for faster builds
  swcMinify: true,

  // CRITICAL: Disable ALL static optimization
  // This app requires dynamic rendering for all pages
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'chart.js',
      'react-chartjs-2',
    ],
    // Reduce memory usage during build
    workerThreads: false,
    cpus: 1,
    // Disable memory-intensive optimizations during build
    optimizeCss: false,
    // Faster builds
    turbotrace: {
      logLevel: 'error',
    },
  },

  // Increase static page generation timeout to 5 minutes
  staticPageGenerationTimeout: 300,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (keep error and warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // DISABLE type checking and linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    unoptimized: true,
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com', // GitHub profile images
      'cdn.discordapp.com', // Discord profile images
      'graph.microsoft.com', // Microsoft profile images
      'media.licdn.com', // LinkedIn profile images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.microsoft.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' *.pusher.com wss://*.pusher.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ],
      },
    ]
  },

  // Enable compression
  compress: true,

  // Production optimization
  productionBrowserSourceMaps: false, // Disable source maps in production to save memory
  
  // Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Webpack memory optimizations
  webpack: (config, { isServer, webpack }) => {
    // Exclude client-only packages from server bundle
    if (isServer) {
      config.externals.push({
        'jspdf': 'jspdf',
        'html2canvas': 'html2canvas',
        'socket.io-client': 'socket.io-client',
      })
    }

    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunk (react, react-dom, next)
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Common UI libraries
          lib: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|cmdk)[\\/]/,
            name: 'lib',
            priority: 30,
          },
          // Vendor chunk (other node_modules)
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          }
        },
        maxInitialRequests: 25,
        minSize: 20000,
      },
      // Minimize build time
      minimize: process.env.NODE_ENV === 'production',
      minimizer: config.optimization.minimizer,
    }
    
    // Limit parallelism to reduce memory
    config.parallelism = 1
    
    // Ignore problematic warnings
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^encoding$/,
        contextRegExp: /node-fetch/,
      })
    )
    
    return config
  },
}

// Inject Sentry configuration
import { withSentryConfig } from "@sentry/nextjs";

// Disable Sentry during build to avoid "self is not defined" errors
const sentryConfig = process.env.SENTRY_BUILD_DISABLED === 'true' ? {
  disableClientWebpackPlugin: true,
  disableServerWebpackPlugin: true,
} : {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "zyphex-tech",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Disable source map upload to save memory during build
  widenClientFileUpload: false,
  
  // Disable automatic upload in CI/CD - can be done separately
  disableClientWebpackPlugin: true,
  disableServerWebpackPlugin: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryConfig);