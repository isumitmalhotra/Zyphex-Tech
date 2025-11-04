import * as React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Header from "@/components/header"
import ConditionalFooter from "@/components/conditional-footer"
import { ScrollProgressBar, ZyphexParticles } from "@/components/scroll-animations"
import AuthProvider from "@/providers/AuthProvider"
import { ReactQueryProvider } from "@/providers/ReactQueryProvider"
import { Toaster } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Zyphex Tech - Leading Remote IT Services Agency",
    template: "%s | Zyphex Tech"
  },
  description:
    "Transform your business with cutting-edge remote IT solutions. Custom software development, cloud migration, mobile apps, and more. Expert remote teams delivering exceptional results.",
  keywords: [
    "remote IT services",
    "software development",
    "cloud solutions",
    "mobile apps",
    "web development",
    "digital transformation",
    "remote teams",
    "Zyphex Tech",
    "IT consulting",
    "custom software",
    "enterprise solutions"
  ],
  authors: [{ name: "Zyphex Tech", url: "https://zyphextech.com" }],
  creator: "Zyphex Tech",
  publisher: "Zyphex Tech",
  metadataBase: new URL("https://zyphextech.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zyphextech.com",
    siteName: "Zyphex Tech",
    title: "Zyphex Tech - Leading Remote IT Services Agency",
    description:
      "Transform your business with cutting-edge remote IT solutions. Custom software development, cloud migration, mobile apps, and more. Expert remote teams delivering exceptional results.",
    images: [
      {
        url: "/zyphex-logo.png",
        width: 1200,
        height: 630,
        alt: "Zyphex Tech Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zyphex Tech - Leading Remote IT Services Agency",
    description:
      "Transform your business with cutting-edge remote IT solutions. Custom software development, cloud migration, mobile apps, and more.",
    images: ["/zyphex-logo.png"],
    creator: "@zyphextech",
    site: "@zyphextech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/zyphex-logo.png", type: "image/png", sizes: "500x500" },
    ],
    shortcut: "/favicon.ico",
    apple: "/zyphex-logo.png",
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "Xx8bp9kK4_61FWwvhZ_rONEWJm4ZEp-tZt_2UM_FCms",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zyphex Tech",
    url: "https://zyphextech.com",
    logo: "https://zyphextech.com/zyphex-logo.png",
    description:
      "Transform your business with cutting-edge remote IT solutions. Custom software development, cloud migration, mobile apps, and more.",
    email: "info@zyphextech.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sector 115",
      addressLocality: "Mohali",
      addressRegion: "Punjab",
      addressCountry: "India",
    },
    sameAs: [
      "https://www.linkedin.com/company/zyphextech",
      "https://twitter.com/zyphextech",
      "https://github.com/zyphextech",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-7777010114",
      email: "info@zyphextech.com",
      contactType: "Customer Service",
    },
    offers: {
      "@type": "AggregateOffer",
      offerCount: "10+",
      offers: [
        {
          "@type": "Offer",
          name: "Custom Software Development",
          description: "Tailored software solutions for your business needs",
        },
        {
          "@type": "Offer",
          name: "Cloud Solutions",
          description: "Cloud migration and infrastructure management",
        },
        {
          "@type": "Offer",
          name: "Mobile App Development",
          description: "iOS and Android mobile applications",
        },
      ],
    },
  }

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/zyphex-logo.png" />
      </head>
      <body className={`${inter.className} dark`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8XVCWLN7YV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8XVCWLN7YV');
          `}
        </Script>

        <ErrorBoundary>
          <AuthProvider>
            <ReactQueryProvider>
              <Toaster position="top-right" theme="dark" />
              <ScrollProgressBar />
              <div className="min-h-screen relative flex flex-col">
                <ZyphexParticles />
                <div className="relative z-10 flex flex-col min-h-screen">
                  <Header />
                  <main className="relative flex-1">{children}</main>
                  <ConditionalFooter />
                </div>
              </div>
            </ReactQueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
