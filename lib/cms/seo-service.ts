/**
 * CMS SEO Management Service
 * 
 * Provides comprehensive SEO optimization tools:
 * - Meta tags (title, description, keywords)
 * - Open Graph tags
 * - Twitter Card tags
 * - Structured data (JSON-LD)
 * - SEO scoring and validation
 * - Sitemap generation
 * - Robots.txt management
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SeoMetadata {
  // Basic SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  robots?: string; // "index,follow" | "noindex,nofollow" etc.
  
  // Open Graph
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;
  
  // Twitter Card
  twitterCard?: string; // "summary" | "summary_large_image" | "app" | "player"
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  
  // Structured Data
  structuredData?: Record<string, unknown>;
}

export interface SeoScore {
  overall: number; // 0-100
  scores: {
    metaTags: number;
    openGraph: number;
    twitter: number;
    structuredData: number;
    contentQuality: number;
    technical: number;
  };
  issues: SeoIssue[];
  recommendations: string[];
}

export interface SeoIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  field?: string;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number; // 0.0 - 1.0
}

export interface RobotsConfig {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  sitemap?: string[];
}

// ============================================================================
// SEO Metadata Management
// ============================================================================

/**
 * Get SEO metadata for a page
 */
export async function getPageSeo(pageId: string): Promise<SeoMetadata | null> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: {
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImage: true,
      ogTitle: true,
      ogDescription: true,
      structuredData: true,
    },
  });

  if (!page) {
    return null;
  }

  // Parse structured data if it exists
  let structuredData: Record<string, unknown> | undefined;
  if (page.structuredData && typeof page.structuredData === 'object') {
    structuredData = page.structuredData as Record<string, unknown>;
  }

  return {
    metaTitle: page.metaTitle || undefined,
    metaDescription: page.metaDescription || undefined,
    metaKeywords: page.metaKeywords || undefined,
    ogImage: page.ogImage || undefined,
    ogTitle: page.ogTitle || undefined,
    ogDescription: page.ogDescription || undefined,
    structuredData,
  };
}

/**
 * Update SEO metadata for a page
 */
export async function updatePageSeo(
  pageId: string,
  seoData: Partial<SeoMetadata>
): Promise<void> {
  // Verify page exists
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: { id: true },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  // Update SEO fields
  await prisma.cmsPage.update({
    where: { id: pageId },
    data: {
      metaTitle: seoData.metaTitle,
      metaDescription: seoData.metaDescription,
      metaKeywords: seoData.metaKeywords,
      ogImage: seoData.ogImage,
      ogTitle: seoData.ogTitle,
      ogDescription: seoData.ogDescription,
      structuredData: seoData.structuredData as Record<string, unknown> | undefined,
    },
  });
}

/**
 * Generate default SEO metadata from page content
 */
export async function generateDefaultSeo(pageId: string): Promise<SeoMetadata> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: {
      pageTitle: true,
      slug: true,
      metaDescription: true,
      sections: {
        where: { isVisible: true },
        orderBy: { order: 'asc' },
        take: 1,
        select: {
          content: true,
        },
      },
    },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  // Extract text from first section for description if no metaDescription
  let description = page.metaDescription || '';
  
  if (!description && page.sections.length > 0) {
    const firstSection = page.sections[0];
    const sectionContent = firstSection.content as { text?: string; description?: string };
    description = (sectionContent.description || sectionContent.text || '').substring(0, 160);
  }

  return {
    metaTitle: page.pageTitle,
    metaDescription: description,
    ogTitle: page.pageTitle,
    ogDescription: description,
    twitterTitle: page.pageTitle,
    twitterDescription: description,
    twitterCard: 'summary_large_image',
  };
}

// ============================================================================
// SEO Scoring & Validation
// ============================================================================

/**
 * Calculate SEO score for a page
 */
export async function calculateSeoScore(pageId: string): Promise<SeoScore> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: {
      pageTitle: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImage: true,
      ogTitle: true,
      ogDescription: true,
      structuredData: true,
      sections: {
        where: { isVisible: true },
        select: {
          content: true,
        },
      },
    },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  const issues: SeoIssue[] = [];
  const recommendations: string[] = [];

  // Meta Tags Score (25 points)
  let metaTagsScore = 0;
  if (page.metaTitle) {
    metaTagsScore += 10;
    if (page.metaTitle.length >= 30 && page.metaTitle.length <= 60) {
      metaTagsScore += 5;
    } else {
      issues.push({
        severity: 'warning',
        category: 'meta_tags',
        message: `Meta title should be 30-60 characters (current: ${page.metaTitle.length})`,
        field: 'metaTitle',
      });
    }
  } else {
    issues.push({
      severity: 'error',
      category: 'meta_tags',
      message: 'Meta title is missing',
      field: 'metaTitle',
    });
    recommendations.push('Add a meta title to improve search visibility');
  }

  if (page.metaDescription) {
    metaTagsScore += 10;
    if (page.metaDescription.length >= 120 && page.metaDescription.length <= 160) {
      metaTagsScore += 0;
    } else {
      issues.push({
        severity: 'warning',
        category: 'meta_tags',
        message: `Meta description should be 120-160 characters (current: ${page.metaDescription.length})`,
        field: 'metaDescription',
      });
    }
  } else {
    issues.push({
      severity: 'error',
      category: 'meta_tags',
      message: 'Meta description is missing',
      field: 'metaDescription',
    });
    recommendations.push('Add a meta description to improve click-through rates');
  }

  // Open Graph Score (20 points)
  let openGraphScore = 0;
  const hasOgTitle = page.ogTitle || page.metaTitle;
  const hasOgDescription = page.ogDescription || page.metaDescription;
  const hasOgImage = page.ogImage;

  if (hasOgTitle) openGraphScore += 7;
  if (hasOgDescription) openGraphScore += 7;
  if (hasOgImage) {
    openGraphScore += 6;
  } else {
    issues.push({
      severity: 'warning',
      category: 'open_graph',
      message: 'Open Graph image is missing',
      field: 'ogImage',
    });
    recommendations.push('Add an Open Graph image for better social media sharing');
  }

  // Twitter Card Score (15 points)
  let twitterScore = 0;
  if (hasOgTitle) twitterScore += 5;
  if (hasOgDescription) twitterScore += 5;
  if (hasOgImage) {
    twitterScore += 5;
  } else {
    recommendations.push('Add a Twitter Card image for better Twitter sharing');
  }

  // Structured Data Score (15 points)
  let structuredDataScore = 0;
  if (page.structuredData && typeof page.structuredData === 'object') {
    const data = page.structuredData as Record<string, unknown>;
    if (data['@type']) {
      structuredDataScore += 15;
    } else {
      structuredDataScore += 5;
      issues.push({
        severity: 'info',
        category: 'structured_data',
        message: 'Structured data is incomplete',
        field: 'structuredData',
      });
    }
  } else {
    issues.push({
      severity: 'warning',
      category: 'structured_data',
      message: 'Structured data (JSON-LD) is missing',
      field: 'structuredData',
    });
    recommendations.push('Add structured data for better search engine understanding');
  }

  // Content Quality Score (15 points)
  let contentQualityScore = 0;
  
  // Calculate total content length from sections
  const totalContentLength = page.sections.reduce((total, section) => {
    const content = section.content as { text?: string; description?: string; content?: string };
    const text = content.text || content.description || content.content || '';
    return total + text.length;
  }, 0);

  if (totalContentLength >= 300) {
    contentQualityScore += 10;
  } else if (totalContentLength > 0) {
    contentQualityScore += 5;
    issues.push({
      severity: 'info',
      category: 'content',
      message: 'Content is too short for optimal SEO (recommended: 300+ characters)',
    });
  } else {
    issues.push({
      severity: 'warning',
      category: 'content',
      message: 'Page has no content',
    });
  }

  if (page.metaDescription) {
    contentQualityScore += 5;
  }

  // Technical Score (10 points)
  let technicalScore = 0;

  // Check slug quality
  if (page.slug) {
    const slugWords = page.slug.split('-').length;
    if (slugWords >= 2 && slugWords <= 5) {
      technicalScore += 10;
    } else {
      issues.push({
        severity: 'info',
        category: 'technical',
        message: 'Slug should contain 2-5 words for best SEO',
        field: 'slug',
      });
      technicalScore += 5;
    }
  }

  // Calculate overall score
  const overall = Math.round(
    metaTagsScore +
    openGraphScore +
    twitterScore +
    structuredDataScore +
    contentQualityScore +
    technicalScore
  );

  return {
    overall,
    scores: {
      metaTags: metaTagsScore,
      openGraph: openGraphScore,
      twitter: twitterScore,
      structuredData: structuredDataScore,
      contentQuality: contentQualityScore,
      technical: technicalScore,
    },
    issues,
    recommendations,
  };
}

/**
 * Validate SEO metadata
 */
export function validateSeoMetadata(seo: Partial<SeoMetadata>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate meta title
  if (seo.metaTitle) {
    if (seo.metaTitle.length > 70) {
      errors.push('Meta title should not exceed 70 characters');
    }
    if (seo.metaTitle.length < 10) {
      errors.push('Meta title should be at least 10 characters');
    }
  }

  // Validate meta description
  if (seo.metaDescription) {
    if (seo.metaDescription.length > 200) {
      errors.push('Meta description should not exceed 200 characters');
    }
    if (seo.metaDescription.length < 50) {
      errors.push('Meta description should be at least 50 characters');
    }
  }

  // Validate canonical URL
  if (seo.canonicalUrl) {
    try {
      new URL(seo.canonicalUrl);
    } catch {
      errors.push('Canonical URL must be a valid URL');
    }
  }

  // Validate OG image
  if (seo.ogImage) {
    try {
      new URL(seo.ogImage);
    } catch {
      errors.push('Open Graph image must be a valid URL');
    }
  }

  // Validate Twitter card type
  if (seo.twitterCard) {
    const validTypes = ['summary', 'summary_large_image', 'app', 'player'];
    if (!validTypes.includes(seo.twitterCard)) {
      errors.push(`Twitter card type must be one of: ${validTypes.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Sitemap Generation
// ============================================================================

/**
 * Generate sitemap entries for all published pages
 */
export async function generateSitemap(baseUrl: string): Promise<SitemapEntry[]> {
  const pages = await prisma.cmsPage.findMany({
    where: {
      status: 'published',
    },
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return pages.map((page: { slug: string; updatedAt: Date; publishedAt: Date | null }) => ({
    url: `${baseUrl}/${page.slug}`,
    lastmod: (page.publishedAt || page.updatedAt).toISOString(),
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));
}

/**
 * Generate sitemap XML
 */
export async function generateSitemapXml(baseUrl: string): Promise<string> {
  const entries = await generateSitemap(baseUrl);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const entry of entries) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(entry.url)}</loc>\n`;
    if (entry.lastmod) {
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    }
    if (entry.changefreq) {
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    }
    if (entry.priority !== undefined) {
      xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>';

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// Robots.txt Generation
// ============================================================================

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(config: RobotsConfig[]): string {
  let content = '';

  for (const rule of config) {
    content += `User-agent: ${rule.userAgent}\n`;

    if (rule.allow) {
      for (const path of rule.allow) {
        content += `Allow: ${path}\n`;
      }
    }

    if (rule.disallow) {
      for (const path of rule.disallow) {
        content += `Disallow: ${path}\n`;
      }
    }

    if (rule.crawlDelay !== undefined) {
      content += `Crawl-delay: ${rule.crawlDelay}\n`;
    }

    content += '\n';
  }

  // Add sitemaps
  const sitemaps = config
    .flatMap(rule => rule.sitemap || [])
    .filter((value, index, self) => self.indexOf(value) === index); // Unique

  for (const sitemap of sitemaps) {
    content += `Sitemap: ${sitemap}\n`;
  }

  return content.trim();
}

/**
 * Get default robots.txt configuration
 */
export function getDefaultRobotsConfig(baseUrl: string): RobotsConfig[] {
  return [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: [
        '/api/',
        '/admin/',
        '/super-admin/',
        '/dashboard/',
        '/_next/',
        '/uploads/temp/',
      ],
      sitemap: [`${baseUrl}/sitemap.xml`],
    },
    {
      userAgent: 'Googlebot',
      allow: ['/'],
      disallow: ['/api/', '/admin/', '/super-admin/', '/dashboard/'],
      crawlDelay: 0,
    },
  ];
}

// ============================================================================
// Structured Data Helpers
// ============================================================================

/**
 * Generate Article structured data
 */
export function generateArticleStructuredData(params: {
  headline: string;
  description: string;
  image?: string;
  author?: string;
  datePublished?: Date;
  dateModified?: Date;
  publisher?: {
    name: string;
    logo?: string;
  };
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    description: params.description,
    image: params.image,
    author: params.author ? {
      '@type': 'Person',
      name: params.author,
    } : undefined,
    publisher: params.publisher ? {
      '@type': 'Organization',
      name: params.publisher.name,
      logo: params.publisher.logo ? {
        '@type': 'ImageObject',
        url: params.publisher.logo,
      } : undefined,
    } : undefined,
    datePublished: params.datePublished?.toISOString(),
    dateModified: params.dateModified?.toISOString(),
  };
}

/**
 * Generate WebPage structured data
 */
export function generateWebPageStructuredData(params: {
  name: string;
  description: string;
  url: string;
  image?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: params.name,
    description: params.description,
    url: params.url,
    image: params.image,
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Default export
const seoService = {
  // Metadata management
  getPageSeo,
  updatePageSeo,
  generateDefaultSeo,

  // Scoring & validation
  calculateSeoScore,
  validateSeoMetadata,

  // Sitemap
  generateSitemap,
  generateSitemapXml,

  // Robots.txt
  generateRobotsTxt,
  getDefaultRobotsConfig,

  // Structured data helpers
  generateArticleStructuredData,
  generateWebPageStructuredData,
  generateBreadcrumbStructuredData,
};

export default seoService;
