/**
 * CMS Internationalization (i18n) Service
 * 
 * Provides multi-language support for CMS content:
 * - Language management
 * - Content translation
 * - Locale detection
 * - Translation workflow
 * - Fallback strategies
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Language {
  code: string; // ISO 639-1 code (e.g., 'en', 'es', 'fr')
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
  direction: 'ltr' | 'rtl';
}

export interface TranslationStatus {
  pageId: string;
  pageTitle: string;
  slug: string;
  translations: {
    [languageCode: string]: {
      exists: boolean;
      translatedAt?: Date;
      translatedBy?: string;
      completeness: number; // 0-100
    };
  };
}

export interface TranslatePageInput {
  sourcePageId: string;
  targetLanguage: string;
  translations: {
    pageTitle?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    sections?: {
      sectionKey: string;
      title?: string;
      subtitle?: string;
      content?: Record<string, unknown>;
    }[];
  };
}

export interface LocaleContext {
  language: string;
  region?: string;
  fallbackLanguage: string;
}

// ============================================================================
// Supported Languages (Common)
// ============================================================================

export const COMMON_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isDefault: true,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isDefault: false,
    isActive: true,
    direction: 'rtl',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    isDefault: false,
    isActive: true,
    direction: 'ltr',
  },
];

// ============================================================================
// Language Management
// ============================================================================

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Language[] {
  return COMMON_LANGUAGES.filter(lang => lang.isActive);
}

/**
 * Get default language
 */
export function getDefaultLanguage(): Language {
  const defaultLang = COMMON_LANGUAGES.find(lang => lang.isDefault);
  return defaultLang || COMMON_LANGUAGES[0];
}

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): Language | null {
  return COMMON_LANGUAGES.find(lang => lang.code === code) || null;
}

/**
 * Validate language code
 */
export function isValidLanguage(code: string): boolean {
  return COMMON_LANGUAGES.some(lang => lang.code === code && lang.isActive);
}

// ============================================================================
// Content Translation
// ============================================================================

/**
 * Create translated version of a page
 */
export async function translatePage(
  input: TranslatePageInput,
  userId?: string
): Promise<string> {
  const { sourcePageId, targetLanguage, translations } = input;

  // Validate language
  if (!isValidLanguage(targetLanguage)) {
    throw new Error(`Invalid language code: ${targetLanguage}`);
  }

  // Get source page
  const sourcePage = await prisma.cmsPage.findUnique({
    where: { id: sourcePageId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!sourcePage) {
    throw new Error('Source page not found');
  }

  // Check if translation already exists
  const existingTranslation = await prisma.cmsPage.findFirst({
    where: {
      pageKey: `${sourcePage.pageKey}_${targetLanguage}`,
    },
  });

  if (existingTranslation) {
    throw new Error(`Translation for language '${targetLanguage}' already exists`);
  }

  // Create translated page
  const translatedPage = await prisma.cmsPage.create({
    data: {
      pageKey: `${sourcePage.pageKey}_${targetLanguage}`,
      pageTitle: translations.pageTitle || sourcePage.pageTitle,
      slug: translations.slug || `${sourcePage.slug}-${targetLanguage}`,
      pageType: sourcePage.pageType,
      templateId: sourcePage.templateId,
      metaTitle: translations.metaTitle || translations.pageTitle || sourcePage.metaTitle,
      metaDescription: translations.metaDescription || sourcePage.metaDescription,
      metaKeywords: translations.metaKeywords || sourcePage.metaKeywords,
      ogTitle: translations.ogTitle || translations.pageTitle || sourcePage.ogTitle,
      ogDescription: translations.ogDescription || sourcePage.ogDescription,
      ogImage: sourcePage.ogImage,
      structuredData: sourcePage.structuredData || undefined,
      status: 'draft', // Translations start as draft
      authorId: userId,
      lastEditedBy: userId,
      layout: sourcePage.layout,
      isPublic: sourcePage.isPublic,
      requiresAuth: sourcePage.requiresAuth,
      allowComments: sourcePage.allowComments,
      sections: {
        create: sourcePage.sections.map(section => {
          // Find translation for this section
          const sectionTranslation = translations.sections?.find(
            s => s.sectionKey === section.sectionKey
          );

          const content = sectionTranslation?.content || section.content;

          return {
            sectionKey: section.sectionKey,
            sectionType: section.sectionType,
            title: sectionTranslation?.title || section.title,
            subtitle: sectionTranslation?.subtitle || section.subtitle,
            content: content as never, // Type assertion for Prisma Json field
            order: section.order,
            isVisible: section.isVisible,
            cssClasses: section.cssClasses,
            customStyles: section.customStyles as never, // Type assertion for Prisma Json field
          };
        }),
      },
    },
  });

  return translatedPage.id;
}

/**
 * Update existing translation
 */
export async function updateTranslation(
  pageId: string,
  translations: TranslatePageInput['translations'],
  userId?: string
): Promise<void> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    include: {
      sections: true,
    },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  // Update page fields
  await prisma.cmsPage.update({
    where: { id: pageId },
    data: {
      pageTitle: translations.pageTitle || page.pageTitle,
      slug: translations.slug || page.slug,
      metaTitle: translations.metaTitle || page.metaTitle,
      metaDescription: translations.metaDescription || page.metaDescription,
      metaKeywords: translations.metaKeywords || page.metaKeywords,
      ogTitle: translations.ogTitle || page.ogTitle,
      ogDescription: translations.ogDescription || page.ogDescription,
      lastEditedBy: userId,
    },
  });

  // Update sections if translations provided
  if (translations.sections) {
    for (const sectionTranslation of translations.sections) {
      const section = page.sections.find(s => s.sectionKey === sectionTranslation.sectionKey);
      
      if (section) {
        await prisma.cmsPageSection.update({
          where: { id: section.id },
          data: {
            title: sectionTranslation.title || section.title,
            subtitle: sectionTranslation.subtitle || section.subtitle,
            content: sectionTranslation.content || (section.content as Record<string, unknown>),
          },
        });
      }
    }
  }
}

/**
 * Delete translation
 */
export async function deleteTranslation(pageId: string): Promise<void> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: { pageKey: true },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  // Ensure it's a translation (not the original)
  if (!page.pageKey.includes('_')) {
    throw new Error('Cannot delete original page. This endpoint is for translations only.');
  }

  await prisma.cmsPage.delete({
    where: { id: pageId },
  });
}

/**
 * Get translation status for a page
 */
export async function getTranslationStatus(pageId: string): Promise<TranslationStatus> {
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      pageKey: true,
      pageTitle: true,
      slug: true,
    },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  // Get all translations
  const basePageKey = page.pageKey.split('_')[0];
  const allVersions = await prisma.cmsPage.findMany({
    where: {
      pageKey: {
        startsWith: basePageKey,
      },
    },
    select: {
      pageKey: true,
      updatedAt: true,
      lastEditedBy: true,
    },
  });

  const translations: TranslationStatus['translations'] = {};
  const supportedLanguages = getSupportedLanguages();

  for (const lang of supportedLanguages) {
    const translationKey = lang.isDefault ? basePageKey : `${basePageKey}_${lang.code}`;
    const translation = allVersions.find(v => v.pageKey === translationKey);

    translations[lang.code] = {
      exists: !!translation,
      translatedAt: translation?.updatedAt,
      translatedBy: translation?.lastEditedBy || undefined,
      completeness: translation ? 100 : 0,
    };
  }

  return {
    pageId: page.id,
    pageTitle: page.pageTitle,
    slug: page.slug,
    translations,
  };
}

/**
 * Get all pages with translation status
 */
export async function getAllPagesTranslationStatus(): Promise<TranslationStatus[]> {
  // Get all base pages (without language suffix)
  const pages = await prisma.cmsPage.findMany({
    where: {
      pageKey: {
        not: {
          contains: '_',
        },
      },
    },
    select: {
      id: true,
      pageKey: true,
      pageTitle: true,
      slug: true,
    },
    orderBy: {
      pageTitle: 'asc',
    },
  });

  const statuses = await Promise.all(
    pages.map(page => getTranslationStatus(page.id))
  );

  return statuses;
}

// ============================================================================
// Locale Detection & Management
// ============================================================================

/**
 * Detect locale from Accept-Language header
 */
export function detectLocale(acceptLanguage?: string): LocaleContext {
  const defaultLanguage = getDefaultLanguage().code;

  if (!acceptLanguage) {
    return {
      language: defaultLanguage,
      fallbackLanguage: defaultLanguage,
    };
  }

  // Parse Accept-Language header
  // Format: "en-US,en;q=0.9,es;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1;
      return { code: code.split('-')[0].toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported language
  for (const lang of languages) {
    if (isValidLanguage(lang.code)) {
      return {
        language: lang.code,
        fallbackLanguage: defaultLanguage,
      };
    }
  }

  return {
    language: defaultLanguage,
    fallbackLanguage: defaultLanguage,
  };
}

/**
 * Get page by slug with language fallback
 */
export async function getPageBySlugWithFallback(
  slug: string,
  language: string
): Promise<{ id: string; pageTitle: string; slug: string } | null> {
  // Try to find page in requested language
  const languageSuffix = language === getDefaultLanguage().code ? '' : `-${language}`;
  const localizedSlug = `${slug}${languageSuffix}`;

  let page = await prisma.cmsPage.findFirst({
    where: {
      slug: localizedSlug,
      status: 'published',
    },
    select: {
      id: true,
      pageTitle: true,
      slug: true,
    },
  });

  // Fallback to default language
  if (!page && language !== getDefaultLanguage().code) {
    page = await prisma.cmsPage.findFirst({
      where: {
        slug,
        status: 'published',
      },
      select: {
        id: true,
        pageTitle: true,
        slug: true,
      },
    });
  }

  return page;
}

// Default export
const i18nService = {
  // Languages
  getSupportedLanguages,
  getDefaultLanguage,
  getLanguageByCode,
  isValidLanguage,

  // Translation
  translatePage,
  updateTranslation,
  deleteTranslation,
  getTranslationStatus,
  getAllPagesTranslationStatus,

  // Locale
  detectLocale,
  getPageBySlugWithFallback,
};

export default i18nService;
