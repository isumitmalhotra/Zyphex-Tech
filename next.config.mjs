/** @type {import('next').NextConfig} */

import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
    // CRITICAL: Reduce memory usage during build
    workerThreads: false,
    cpus: 1,
    // Disable memory-intensive optimizations during build
    optimizeCss: false,
    // ENABLE instrumentation hook for Socket.io initialization
    instrumentationHook: true,
  },

  // Increase static page generation timeout to 5 minutes
  staticPageGenerationTimeout: 300,

  // Disable standalone output to skip build traces
  // output: 'standalone',

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
        'chart.js': 'chart.js',
        'react-chartjs-2': 'react-chartjs-2',
        'frappe-gantt': 'frappe-gantt',
        'puppeteer': 'puppeteer',
        'canvas': 'canvas',
      })
      
      // Don't apply splitChunks optimization for server bundle
      return config;
    }

    // Resolve fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }

    // Reduce memory usage during build - ONLY FOR CLIENT
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

// Export with bundle analyzer wrapper
export default withBundleAnalyzer(nextConfig);