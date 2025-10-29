/**
 * CMS Content Validation Utilities
 * Centralized validation helpers for content and sections
 */

import { validateSectionContent, type SectionType } from './section-schemas';
import { validateFieldValue, type FieldConfig } from './content-fields';

/**
 * ============================================================================
 * Validation Result Types
 * ============================================================================
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'warning';
}

/**
 * ============================================================================
 * Content Validation
 * ============================================================================
 */

/**
 * Validate complete section content
 */
export function validateSection(
  sectionType: SectionType,
  content: unknown
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate against section schema
  const schemaResult = validateSectionContent(sectionType, content);

  if (!schemaResult.valid) {
    errors.push({
      field: 'content',
      message: schemaResult.error || 'Content validation failed',
      code: 'INVALID_CONTENT',
      severity: 'error',
    });
  }

  // Additional content quality checks
  if (schemaResult.valid && schemaResult.data) {
    const qualityChecks = performQualityChecks(sectionType, schemaResult.data);
    warnings.push(...qualityChecks);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: schemaResult.data,
  };
}

/**
 * Validate individual field value
 */
export function validateField(
  fieldConfig: FieldConfig,
  value: unknown
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required field check
  if (fieldConfig.required && (value === null || value === undefined || value === '')) {
    errors.push({
      field: fieldConfig.name,
      message: `${fieldConfig.label} is required`,
      code: 'REQUIRED_FIELD',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }

  // Skip validation if field is empty and not required
  if (!fieldConfig.required && (value === null || value === undefined || value === '')) {
    return { valid: true, errors, warnings };
  }

  // Validate field value
  const result = validateFieldValue(fieldConfig, value);
  if (!result.valid) {
    errors.push({
      field: fieldConfig.name,
      message: result.error || 'Invalid value',
      code: 'INVALID_VALUE',
      severity: 'error',
    });
  }

  // Type-specific validation
  const typeValidation = validateFieldByType(fieldConfig, value);
  errors.push(...typeValidation.errors);
  warnings.push(...typeValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: value,
  };
}

/**
 * ============================================================================
 * Type-Specific Validation
 * ============================================================================
 */

function validateFieldByType(
  fieldConfig: FieldConfig,
  value: unknown
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  switch (fieldConfig.type) {
    case 'text':
    case 'textarea':
      if (typeof value === 'string') {
        if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
          errors.push({
            field: fieldConfig.name,
            message: `Minimum length is ${fieldConfig.minLength} characters`,
            code: 'MIN_LENGTH',
            severity: 'error',
          });
        }
        if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
          errors.push({
            field: fieldConfig.name,
            message: `Maximum length is ${fieldConfig.maxLength} characters`,
            code: 'MAX_LENGTH',
            severity: 'error',
          });
        }
        // Warn if close to max length
        if (fieldConfig.maxLength && value.length > fieldConfig.maxLength * 0.9) {
          warnings.push({
            field: fieldConfig.name,
            message: `Close to maximum length (${value.length}/${fieldConfig.maxLength})`,
            code: 'NEAR_MAX_LENGTH',
            severity: 'warning',
          });
        }
      }
      break;

    case 'richtext':
      if (typeof value === 'string') {
        if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
          errors.push({
            field: fieldConfig.name,
            message: `Content exceeds maximum length of ${fieldConfig.maxLength} characters`,
            code: 'MAX_LENGTH',
            severity: 'error',
          });
        }
        // Check for empty rich text (only HTML tags, no content)
        const textOnly = value.replace(/<[^>]*>/g, '').trim();
        if (textOnly.length === 0 && value.length > 0) {
          warnings.push({
            field: fieldConfig.name,
            message: 'Content appears to be empty',
            code: 'EMPTY_CONTENT',
            severity: 'warning',
          });
        }
      }
      break;

    case 'number':
      if (typeof value === 'number') {
        if (fieldConfig.min !== undefined && value < fieldConfig.min) {
          errors.push({
            field: fieldConfig.name,
            message: `Minimum value is ${fieldConfig.min}`,
            code: 'MIN_VALUE',
            severity: 'error',
          });
        }
        if (fieldConfig.max !== undefined && value > fieldConfig.max) {
          errors.push({
            field: fieldConfig.name,
            message: `Maximum value is ${fieldConfig.max}`,
            code: 'MAX_VALUE',
            severity: 'error',
          });
        }
      }
      break;

    case 'image':
      if (typeof value === 'object' && value !== null) {
        const imageValue = value as { url?: string; alt?: string };
        if (!imageValue.url) {
          errors.push({
            field: fieldConfig.name,
            message: 'Image URL is required',
            code: 'MISSING_IMAGE_URL',
            severity: 'error',
          });
        }
        if (fieldConfig.requireAlt && !imageValue.alt) {
          warnings.push({
            field: fieldConfig.name,
            message: 'Alt text is recommended for accessibility',
            code: 'MISSING_ALT_TEXT',
            severity: 'warning',
          });
        }
      }
      break;

    case 'gallery':
      if (Array.isArray(value)) {
        if (fieldConfig.minImages && value.length < fieldConfig.minImages) {
          errors.push({
            field: fieldConfig.name,
            message: `Minimum ${fieldConfig.minImages} images required`,
            code: 'MIN_IMAGES',
            severity: 'error',
          });
        }
        if (fieldConfig.maxImages && value.length > fieldConfig.maxImages) {
          errors.push({
            field: fieldConfig.name,
            message: `Maximum ${fieldConfig.maxImages} images allowed`,
            code: 'MAX_IMAGES',
            severity: 'error',
          });
        }
        // Check for missing alt text
        const missingAlt = value.filter((img: { alt?: string }) => !img.alt);
        if (missingAlt.length > 0) {
          warnings.push({
            field: fieldConfig.name,
            message: `${missingAlt.length} image(s) missing alt text`,
            code: 'MISSING_ALT_TEXT',
            severity: 'warning',
          });
        }
      }
      break;

    case 'repeater':
      if (Array.isArray(value)) {
        if (fieldConfig.minItems && value.length < fieldConfig.minItems) {
          errors.push({
            field: fieldConfig.name,
            message: `Minimum ${fieldConfig.minItems} items required`,
            code: 'MIN_ITEMS',
            severity: 'error',
          });
        }
        if (fieldConfig.maxItems && value.length > fieldConfig.maxItems) {
          errors.push({
            field: fieldConfig.name,
            message: `Maximum ${fieldConfig.maxItems} items allowed`,
            code: 'MAX_ITEMS',
            severity: 'error',
          });
        }
      }
      break;
  }

  return { errors, warnings };
}

/**
 * ============================================================================
 * Content Quality Checks
 * ============================================================================
 */

function performQualityChecks(
  sectionType: SectionType,
  content: unknown
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (typeof content !== 'object' || content === null) {
    return warnings;
  }

  const data = content as Record<string, unknown>;

  // Check for empty headings
  if (data.heading && typeof data.heading === 'string') {
    if (data.heading.trim().length === 0) {
      warnings.push({
        field: 'heading',
        message: 'Heading is empty',
        code: 'EMPTY_HEADING',
        severity: 'warning',
      });
    }
    // Check heading length for SEO
    if (data.heading.length > 70) {
      warnings.push({
        field: 'heading',
        message: 'Heading is longer than recommended (70 characters)',
        code: 'LONG_HEADING',
        severity: 'warning',
      });
    }
  }

  // Check for broken links
  if (data.primaryButton && typeof data.primaryButton === 'object') {
    const button = data.primaryButton as { url?: string };
    if (button.url === '#' || button.url === '') {
      warnings.push({
        field: 'primaryButton',
        message: 'Button has no destination URL',
        code: 'EMPTY_LINK',
        severity: 'warning',
      });
    }
  }

  // Section-specific quality checks
  switch (sectionType) {
    case 'hero':
      if (!data.primaryButton) {
        warnings.push({
          field: 'primaryButton',
          message: 'Hero section typically needs a call-to-action button',
          code: 'MISSING_CTA',
          severity: 'warning',
        });
      }
      break;

    case 'features':
      if (Array.isArray(data.features) && data.features.length < 3) {
        warnings.push({
          field: 'features',
          message: 'Consider adding at least 3 features for better presentation',
          code: 'FEW_ITEMS',
          severity: 'warning',
        });
      }
      break;

    case 'testimonials':
      if (Array.isArray(data.testimonials) && data.testimonials.length < 2) {
        warnings.push({
          field: 'testimonials',
          message: 'Consider adding at least 2 testimonials for credibility',
          code: 'FEW_ITEMS',
          severity: 'warning',
        });
      }
      break;
  }

  return warnings;
}

/**
 * ============================================================================
 * Batch Validation
 * ============================================================================
 */

/**
 * Validate multiple sections at once
 */
export function validateMultipleSections(
  sections: Array<{ sectionType: SectionType; content: unknown }>
): ValidationResult[] {
  return sections.map((section) => validateSection(section.sectionType, section.content));
}

/**
 * Check if all sections are valid
 */
export function areAllSectionsValid(
  sections: Array<{ sectionType: SectionType; content: unknown }>
): boolean {
  const results = validateMultipleSections(sections);
  return results.every((result) => result.valid);
}

/**
 * ============================================================================
 * Error Formatting
 * ============================================================================
 */

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string[] {
  return [
    ...result.errors.map((error) => `${error.field}: ${error.message}`),
    ...result.warnings.map((warning) => `${warning.field}: ${warning.message}`),
  ];
}

/**
 * Get error count by severity
 */
export function getErrorCount(result: ValidationResult): {
  errors: number;
  warnings: number;
  total: number;
} {
  return {
    errors: result.errors.length,
    warnings: result.warnings.length,
    total: result.errors.length + result.warnings.length,
  };
}

/**
 * Check if result has critical errors
 */
export function hasCriticalErrors(result: ValidationResult): boolean {
  return result.errors.length > 0;
}

/**
 * ============================================================================
 * SEO Validation
 * ============================================================================
 */

/**
 * Validate SEO-related fields
 */
export function validateSEOContent(content: {
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Meta title validation
  if (content.metaTitle) {
    if (content.metaTitle.length > 60) {
      warnings.push({
        field: 'metaTitle',
        message: 'Meta title exceeds recommended length (60 characters)',
        code: 'LONG_META_TITLE',
        severity: 'warning',
      });
    }
    if (content.metaTitle.length < 30) {
      warnings.push({
        field: 'metaTitle',
        message: 'Meta title is shorter than recommended (30+ characters)',
        code: 'SHORT_META_TITLE',
        severity: 'warning',
      });
    }
  } else {
    warnings.push({
      field: 'metaTitle',
      message: 'Meta title is missing',
      code: 'MISSING_META_TITLE',
      severity: 'warning',
    });
  }

  // Meta description validation
  if (content.metaDescription) {
    if (content.metaDescription.length > 160) {
      warnings.push({
        field: 'metaDescription',
        message: 'Meta description exceeds recommended length (160 characters)',
        code: 'LONG_META_DESCRIPTION',
        severity: 'warning',
      });
    }
    if (content.metaDescription.length < 50) {
      warnings.push({
        field: 'metaDescription',
        message: 'Meta description is shorter than recommended (50+ characters)',
        code: 'SHORT_META_DESCRIPTION',
        severity: 'warning',
      });
    }
  } else {
    warnings.push({
      field: 'metaDescription',
      message: 'Meta description is missing',
      code: 'MISSING_META_DESCRIPTION',
      severity: 'warning',
    });
  }

  // Slug validation
  if (content.slug) {
    if (!/^[a-z0-9-/]+$/.test(content.slug)) {
      errors.push({
        field: 'slug',
        message: 'Slug contains invalid characters (use only lowercase letters, numbers, hyphens, and slashes)',
        code: 'INVALID_SLUG',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
