/**
 * CMS Content Models - Main Export
 * 
 * This module provides comprehensive content modeling for the CMS system including:
 * - Field type definitions and configurations
 * - Section schemas and validation
 * - Component registry for rendering
 * - Content validation utilities
 * - Permissions and role-based access control
 * - Authorization utilities and guards
 * - File upload and storage utilities
 */

// Field Definitions
export * from './content-fields';

// Section Schemas
export * from './section-schemas';

// Component Registry
export * from './component-registry';

// Validation Utilities
export * from './content-validation';

// Permissions & Roles
export * from './permissions';

// Authorization
export * from './authorization';

// File Upload & Storage
export * from './upload-config';
export * from './file-storage';

/**
 * Quick Start Guide:
 * 
 * 1. Define section content using schemas:
 *    ```typescript
 *    import { heroSectionContentSchema } from '@/lib/cms';
 *    const content = heroSectionContentSchema.parse(data);
 *    ```
 * 
 * 2. Validate section content:
 *    ```typescript
 *    import { validateSection } from '@/lib/cms';
 *    const result = validateSection('hero', content);
 *    ```
 * 
 * 3. Register and use components:
 *    ```typescript
 *    import { registerSectionComponent, getSectionComponent } from '@/lib/cms';
 *    registerSectionComponent('hero', HeroSection);
 *    const Component = getSectionComponent('hero');
 *    ```
 * 
 * 4. Get field configurations for forms:
 *    ```typescript
 *    import { getSectionFields } from '@/lib/cms';
 *    const fields = getSectionFields('hero');
 *    ```
 */

/**
 * Usage Examples:
 * 
 * @example Creating a section with validation
 * ```typescript
 * import { validateSection, getDefaultSectionContent } from '@/lib/cms';
 * 
 * const content = getDefaultSectionContent('hero');
 * content.heading = 'Welcome to Our Site';
 * 
 * const result = validateSection('hero', content);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 * 
 * @example Rendering a section
 * ```typescript
 * import { getSectionComponent, buildSectionClassName } from '@/lib/cms';
 * 
 * const SectionComponent = getSectionComponent('hero');
 * const className = buildSectionClassName(section);
 * 
 * return SectionComponent ? (
 *   <SectionComponent
 *     id={section.id}
 *     sectionKey={section.sectionKey}
 *     content={section.content}
 *     className={className}
 *   />
 * ) : null;
 * ```
 * 
 * @example Field-level validation
 * ```typescript
 * import { validateField, commonFieldPresets } from '@/lib/cms';
 * 
 * const fieldConfig = commonFieldPresets.heading();
 * const result = validateField(fieldConfig, userInput);
 * 
 * if (!result.valid) {
 *   result.errors.forEach(error => {
 *     console.log(`${error.field}: ${error.message}`);
 *   });
 * }
 * ```
 */
