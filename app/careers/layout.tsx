import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers at Zyphex Tech | Join Our Remote Team',
  description: 'Explore exciting career opportunities at Zyphex Tech. Join our innovative remote team and help shape the future of IT services. Competitive salaries, unlimited PTO, and remote work.',
  keywords: [
    'careers',
    'jobs',
    'remote work',
    'software engineer jobs',
    'developer jobs',
    'IT jobs',
    'tech careers',
    'Zyphex Tech jobs',
    'remote IT positions',
    'work from home'
  ],
  openGraph: {
    title: 'Careers at Zyphex Tech | Join Our Remote Team',
    description: 'Explore exciting career opportunities at Zyphex Tech. Join our innovative remote team and help shape the future of IT services.',
    url: 'https://zyphextech.com/careers',
    siteName: 'Zyphex Tech',
    images: [
      {
        url: '/og-careers.jpg',
        width: 1200,
        height: 630,
        alt: 'Zyphex Tech Careers',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers at Zyphex Tech | Join Our Remote Team',
    description: 'Explore exciting career opportunities at Zyphex Tech. Join our innovative remote team and help shape the future of IT services.',
    images: ['/og-careers.jpg'],
  },
  alternates: {
    canonical: 'https://zyphextech.com/careers',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
