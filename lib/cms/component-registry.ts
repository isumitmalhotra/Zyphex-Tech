/**
 * CMS Section Component Registry
 * Maps section types to React components for rendering
 */

import { type ComponentType } from 'react';
import {
  type HeroSectionContent,
  type FeaturesSectionContent,
  type TestimonialsSectionContent,
  type CtaSectionContent,
  type ContentSectionContent,
  type GallerySectionContent,
  type FaqSectionContent,
  type CustomSectionContent,
} from './section-schemas';

/**
 * ============================================================================
 * Section Component Props Interface
 * ============================================================================
 */

export interface BaseSectionProps {
  id: string;
  sectionKey: string;
  className?: string;
  customStyles?: Record<string, unknown>;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

export interface HeroSectionProps extends BaseSectionProps {
  content: HeroSectionContent;
}

export interface FeaturesSectionProps extends BaseSectionProps {
  content: FeaturesSectionContent;
}

export interface TestimonialsSectionProps extends BaseSectionProps {
  content: TestimonialsSectionContent;
}

export interface CtaSectionProps extends BaseSectionProps {
  content: CtaSectionContent;
}

export interface ContentSectionProps extends BaseSectionProps {
  content: ContentSectionContent;
}

export interface GallerySectionProps extends BaseSectionProps {
  content: GallerySectionContent;
}

export interface FaqSectionProps extends BaseSectionProps {
  content: FaqSectionContent;
}

export interface CustomSectionProps extends BaseSectionProps {
  content: CustomSectionContent;
}

export type SectionProps =
  | HeroSectionProps
  | FeaturesSectionProps
  | TestimonialsSectionProps
  | CtaSectionProps
  | ContentSectionProps
  | GallerySectionProps
  | FaqSectionProps
  | CustomSectionProps;

/**
 * ============================================================================
 * Component Type Definitions
 * ============================================================================
 */

export type HeroSectionComponent = ComponentType<HeroSectionProps>;
export type FeaturesSectionComponent = ComponentType<FeaturesSectionProps>;
export type TestimonialsSectionComponent = ComponentType<TestimonialsSectionProps>;
export type CtaSectionComponent = ComponentType<CtaSectionProps>;
export type ContentSectionComponent = ComponentType<ContentSectionProps>;
export type GallerySectionComponent = ComponentType<GallerySectionProps>;
export type FaqSectionComponent = ComponentType<FaqSectionProps>;
export type CustomSectionComponent = ComponentType<CustomSectionProps>;

/**
 * ============================================================================
 * Component Registry Interface
 * ============================================================================
 */

export interface SectionComponentRegistry {
  hero: HeroSectionComponent;
  features: FeaturesSectionComponent;
  testimonials: TestimonialsSectionComponent;
  cta: CtaSectionComponent;
  content: ContentSectionComponent;
  gallery: GallerySectionComponent;
  faq: FaqSectionComponent;
  custom: CustomSectionComponent;
}

/**
 * ============================================================================
 * Default Component Registry
 * These are placeholder paths - actual components will be created in Phase 2
 * ============================================================================
 */

// Lazy load components for better performance
export const defaultSectionComponents: Partial<SectionComponentRegistry> = {
  // Components will be registered here in Phase 2
  // hero: lazy(() => import('@/components/cms/sections/HeroSection')),
  // features: lazy(() => import('@/components/cms/sections/FeaturesSection')),
  // etc...
};

/**
 * ============================================================================
 * Component Registry Manager
 * ============================================================================
 */

class ComponentRegistryManager {
  private registry: Partial<SectionComponentRegistry> = { ...defaultSectionComponents };

  /**
   * Register a component for a section type
   */
  register<T extends keyof SectionComponentRegistry>(
    sectionType: T,
    component: SectionComponentRegistry[T]
  ): void {
    this.registry[sectionType] = component;
  }

  /**
   * Get component for a section type
   */
  get<T extends keyof SectionComponentRegistry>(
    sectionType: T
  ): SectionComponentRegistry[T] | undefined {
    return this.registry[sectionType];
  }

  /**
   * Check if a component is registered
   */
  has(sectionType: keyof SectionComponentRegistry): boolean {
    return this.registry[sectionType] !== undefined;
  }

  /**
   * Get all registered section types
   */
  getRegisteredTypes(): Array<keyof SectionComponentRegistry> {
    return Object.keys(this.registry) as Array<keyof SectionComponentRegistry>;
  }

  /**
   * Unregister a component
   */
  unregister(sectionType: keyof SectionComponentRegistry): void {
    delete this.registry[sectionType];
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.registry = {};
  }

  /**
   * Batch register multiple components
   */
  registerMultiple(components: Partial<SectionComponentRegistry>): void {
    Object.entries(components).forEach(([type, component]) => {
      if (component) {
        this.registry[type as keyof SectionComponentRegistry] = component as never;
      }
    });
  }
}

/**
 * Singleton instance of the component registry
 */
export const componentRegistry = new ComponentRegistryManager();

/**
 * ============================================================================
 * Helper Functions
 * ============================================================================
 */

/**
 * Get component for rendering a section
 */
export function getSectionComponent(
  sectionType: keyof SectionComponentRegistry
): ComponentType<SectionProps> | undefined {
  return componentRegistry.get(sectionType) as ComponentType<SectionProps> | undefined;
}

/**
 * Check if a section type has a registered component
 */
export function hasSectionComponent(sectionType: string): boolean {
  return componentRegistry.has(sectionType as keyof SectionComponentRegistry);
}

/**
 * Register a new section component
 */
export function registerSectionComponent<T extends keyof SectionComponentRegistry>(
  sectionType: T,
  component: SectionComponentRegistry[T]
): void {
  componentRegistry.register(sectionType, component);
}

/**
 * ============================================================================
 * Section Renderer Utility
 * ============================================================================
 */

export interface RenderSectionOptions {
  /**
   * Whether to render sections that are hidden on current device
   */
  respectDeviceVisibility?: boolean;
  
  /**
   * Current device type (for visibility filtering)
   */
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  
  /**
   * Fallback component when section component is not found
   */
  fallbackComponent?: ComponentType<{ sectionType: string; content: unknown }>;
  
  /**
   * Whether to throw error when component is not found
   */
  throwOnMissing?: boolean;
}

/**
 * Check if section should be rendered based on device visibility
 */
export function shouldRenderSection(
  section: {
    showOnMobile?: boolean;
    showOnTablet?: boolean;
    showOnDesktop?: boolean;
  },
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): boolean {
  switch (deviceType) {
    case 'mobile':
      return section.showOnMobile !== false;
    case 'tablet':
      return section.showOnTablet !== false;
    case 'desktop':
      return section.showOnDesktop !== false;
    default:
      return true;
  }
}

/**
 * Build className for section based on visibility settings
 */
export function buildSectionClassName(
  section: {
    cssClasses?: string | null;
    showOnMobile?: boolean;
    showOnTablet?: boolean;
    showOnDesktop?: boolean;
  },
  baseClassName: string = 'cms-section'
): string {
  const classes = [baseClassName];

  if (section.cssClasses) {
    classes.push(section.cssClasses);
  }

  // Add responsive visibility classes
  if (section.showOnMobile === false) {
    classes.push('hidden-mobile');
  }
  if (section.showOnTablet === false) {
    classes.push('hidden-tablet');
  }
  if (section.showOnDesktop === false) {
    classes.push('hidden-desktop');
  }

  return classes.filter(Boolean).join(' ');
}

/**
 * ============================================================================
 * Type Guards
 * ============================================================================
 */

export function isHeroSection(props: SectionProps): props is HeroSectionProps {
  return 'content' in props && props.content !== undefined;
}

export function isFeaturesSection(props: SectionProps): props is FeaturesSectionProps {
  return 'content' in props && props.content !== undefined;
}

export function isTestimonialsSection(props: SectionProps): props is TestimonialsSectionProps {
  return 'content' in props && props.content !== undefined;
}

export function isCtaSection(props: SectionProps): props is CtaSectionProps {
  return 'content' in props && props.content !== undefined;
}

export function isContentSection(props: SectionProps): props is ContentSectionProps {
  return 'content' in props && props.content !== undefined;
}

export function isGallerySection(props: SectionProps): props is GallerySectionProps {
  return 'content' in props && props.content !== undefined;
}

export function isFaqSection(props: SectionProps): props is FaqSectionProps {
  return 'content' in props && props.content !== undefined;
}

export function isCustomSection(props: SectionProps): props is CustomSectionProps {
  return 'content' in props && props.content !== undefined;
}

/**
 * ============================================================================
 * Section Metadata
 * ============================================================================
 */

export interface SectionMetadata {
  type: keyof SectionComponentRegistry;
  name: string;
  description: string;
  icon: string;
  category: 'header' | 'content' | 'media' | 'social' | 'marketing' | 'custom';
  tags: string[];
  previewImage?: string;
  isCustom?: boolean;
}

export const sectionMetadata: Record<keyof SectionComponentRegistry, SectionMetadata> = {
  hero: {
    type: 'hero',
    name: 'Hero Section',
    description: 'Large header section with headline and call-to-action',
    icon: 'RocketLaunchIcon',
    category: 'header',
    tags: ['header', 'hero', 'banner', 'cta'],
    previewImage: '/cms/previews/hero.png',
  },
  features: {
    type: 'features',
    name: 'Features',
    description: 'Showcase features with icons and descriptions',
    icon: 'SparklesIcon',
    category: 'content',
    tags: ['features', 'services', 'benefits'],
    previewImage: '/cms/previews/features.png',
  },
  testimonials: {
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Display customer testimonials and reviews',
    icon: 'ChatBubbleLeftRightIcon',
    category: 'social',
    tags: ['testimonials', 'reviews', 'social proof'],
    previewImage: '/cms/previews/testimonials.png',
  },
  cta: {
    type: 'cta',
    name: 'Call to Action',
    description: 'Drive conversions with prominent CTA',
    icon: 'MegaphoneIcon',
    category: 'marketing',
    tags: ['cta', 'conversion', 'action'],
    previewImage: '/cms/previews/cta.png',
  },
  content: {
    type: 'content',
    name: 'Content',
    description: 'Rich text content with optional images',
    icon: 'DocumentTextIcon',
    category: 'content',
    tags: ['content', 'text', 'article'],
    previewImage: '/cms/previews/content.png',
  },
  gallery: {
    type: 'gallery',
    name: 'Gallery',
    description: 'Image gallery with multiple layouts',
    icon: 'PhotoIcon',
    category: 'media',
    tags: ['gallery', 'images', 'photos'],
    previewImage: '/cms/previews/gallery.png',
  },
  faq: {
    type: 'faq',
    name: 'FAQ',
    description: 'Frequently asked questions',
    icon: 'QuestionMarkCircleIcon',
    category: 'content',
    tags: ['faq', 'questions', 'help'],
    previewImage: '/cms/previews/faq.png',
  },
  custom: {
    type: 'custom',
    name: 'Custom Section',
    description: 'Create your own custom section',
    icon: 'CodeBracketIcon',
    category: 'custom',
    tags: ['custom', 'advanced'],
    previewImage: '/cms/previews/custom.png',
    isCustom: true,
  },
};

/**
 * Get metadata for a section type
 */
export function getSectionMetadata(
  sectionType: keyof SectionComponentRegistry
): SectionMetadata | undefined {
  return sectionMetadata[sectionType];
}

/**
 * Get all section types by category
 */
export function getSectionsByCategory(
  category: SectionMetadata['category']
): SectionMetadata[] {
  return Object.values(sectionMetadata).filter((meta) => meta.category === category);
}

/**
 * Search sections by tag
 */
export function searchSectionsByTag(tag: string): SectionMetadata[] {
  const lowerTag = tag.toLowerCase();
  return Object.values(sectionMetadata).filter((meta) =>
    meta.tags.some((t) => t.toLowerCase().includes(lowerTag))
  );
}
