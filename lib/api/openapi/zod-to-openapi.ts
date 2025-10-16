/**
 * Zod to OpenAPI Schema Converter
 * 
 * Converts Zod schemas to OpenAPI 3.0 schema objects.
 * Supports common Zod types and validation rules.
 */

import { z } from 'zod';

/**
 * OpenAPI 3.0 Schema Object
 */
export interface OpenAPISchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  description?: string;
  example?: unknown;
  default?: unknown;
  enum?: unknown[];
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  nullable?: boolean;
  allOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  not?: OpenAPISchema;
  additionalProperties?: boolean | OpenAPISchema;
  $ref?: string;
}

/**
 * Conversion options
 */
export interface ZodToOpenAPIOptions {
  /**
   * Include example values in schema
   */
  includeExamples?: boolean;

  /**
   * Include descriptions from Zod schemas
   */
  includeDescriptions?: boolean;

  /**
   * Strict mode: fail on unsupported types
   */
  strict?: boolean;

  /**
   * Component name for references (e.g., "User" → "#/components/schemas/User")
   */
  componentName?: string;

  /**
   * Depth limit for nested objects (prevent infinite recursion)
   */
  maxDepth?: number;
}

/**
 * Convert Zod schema to OpenAPI schema
 */
export function zodToOpenAPI(
  schema: z.ZodTypeAny,
  options: ZodToOpenAPIOptions = {},
  depth = 0
): OpenAPISchema {
  const { strict = false, maxDepth = 10 } = options;

  // Prevent infinite recursion
  if (depth > maxDepth) {
    return { type: 'object', description: 'Max depth reached' };
  }

  // Get schema definition
  const def = schema._def;

  // Handle ZodOptional
  if (schema instanceof z.ZodOptional) {
    const innerSchema = zodToOpenAPI(def.innerType, options, depth + 1);
    return innerSchema;
  }

  // Handle ZodNullable
  if (schema instanceof z.ZodNullable) {
    const innerSchema = zodToOpenAPI(def.innerType, options, depth + 1);
    return { ...innerSchema, nullable: true };
  }

  // Handle ZodDefault
  if (schema instanceof z.ZodDefault) {
    const innerSchema = zodToOpenAPI(def.innerType, options, depth + 1);
    return {
      ...innerSchema,
      default: def.defaultValue(),
    };
  }

  // Handle ZodString
  if (schema instanceof z.ZodString) {
    const result: OpenAPISchema = { type: 'string' };

    // Check for validations
    def.checks.forEach((check: { kind: string; value?: number; regex?: RegExp }) => {
      switch (check.kind) {
        case 'min':
          result.minLength = check.value;
          break;
        case 'max':
          result.maxLength = check.value;
          break;
        case 'email':
          result.format = 'email';
          break;
        case 'url':
          result.format = 'uri';
          break;
        case 'uuid':
          result.format = 'uuid';
          break;
        case 'regex':
          if (check.regex) {
            result.pattern = check.regex.source;
          }
          break;
      }
    });

    return result;
  }

  // Handle ZodNumber
  if (schema instanceof z.ZodNumber) {
    const result: OpenAPISchema = {
      type: def.checks.some((c: { kind: string }) => c.kind === 'int') ? 'integer' : 'number',
    };

    // Check for validations
    def.checks.forEach((check: { kind: string; value?: number }) => {
      switch (check.kind) {
        case 'min':
          result.minimum = check.value;
          break;
        case 'max':
          result.maximum = check.value;
          break;
      }
    });

    return result;
  }

  // Handle ZodBoolean
  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  // Handle ZodEnum
  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: def.values,
    };
  }

  // Handle ZodLiteral
  if (schema instanceof z.ZodLiteral) {
    return {
      type: typeof def.value as 'string' | 'number' | 'boolean',
      enum: [def.value],
    };
  }

  // Handle ZodArray
  if (schema instanceof z.ZodArray) {
    const result: OpenAPISchema = {
      type: 'array',
      items: zodToOpenAPI(def.type, options, depth + 1),
    };

    // Check for min/max items
    if (def.minLength !== null) {
      result.minItems = def.minLength.value;
    }
    if (def.maxLength !== null) {
      result.maxItems = def.maxLength.value;
    }

    return result;
  }

  // Handle ZodObject
  if (schema instanceof z.ZodObject) {
    const properties: Record<string, OpenAPISchema> = {};
    const required: string[] = [];

    const shape = def.shape();

    for (const key in shape) {
      const fieldSchema = shape[key];
      properties[key] = zodToOpenAPI(fieldSchema, options, depth + 1);

      // Check if field is required
      if (!isOptional(fieldSchema)) {
        required.push(key);
      }
    }

    const result: OpenAPISchema = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return result;
  }

  // Handle ZodUnion
  if (schema instanceof z.ZodUnion) {
    return {
      anyOf: def.options.map((option: z.ZodTypeAny) =>
        zodToOpenAPI(option, options, depth + 1)
      ),
    };
  }

  // Handle ZodIntersection
  if (schema instanceof z.ZodIntersection) {
    return {
      allOf: [
        zodToOpenAPI(def.left, options, depth + 1),
        zodToOpenAPI(def.right, options, depth + 1),
      ],
    };
  }

  // Handle ZodRecord
  if (schema instanceof z.ZodRecord) {
    return {
      type: 'object',
      additionalProperties: zodToOpenAPI(def.valueType, options, depth + 1),
    };
  }

  // Handle ZodDate
  if (schema instanceof z.ZodDate) {
    return {
      type: 'string',
      format: 'date-time',
    };
  }

  // Handle ZodAny
  if (schema instanceof z.ZodAny) {
    return {};
  }

  // Handle ZodUnknown
  if (schema instanceof z.ZodUnknown) {
    return {};
  }

  // Handle ZodNever
  if (schema instanceof z.ZodNever) {
    return { not: {} };
  }

  // Unsupported type
  if (strict) {
    throw new Error(`Unsupported Zod type: ${schema.constructor.name}`);
  }

  return {
    type: 'object',
    description: `Unsupported type: ${schema.constructor.name}`,
  };
}

/**
 * Check if a Zod schema is optional
 */
function isOptional(schema: z.ZodTypeAny): boolean {
  return (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodDefault ||
    (schema instanceof z.ZodNullable && isOptional(schema._def.innerType))
  );
}

/**
 * Generate OpenAPI schema with metadata
 */
export function zodToOpenAPIWithMetadata(
  schema: z.ZodTypeAny,
  metadata: {
    title?: string;
    description?: string;
    example?: unknown;
    deprecated?: boolean;
  } = {},
  options: ZodToOpenAPIOptions = {}
): OpenAPISchema & { title?: string; deprecated?: boolean } {
  const openAPISchema = zodToOpenAPI(schema, options);
  const result: OpenAPISchema & { title?: string; deprecated?: boolean } = { ...openAPISchema };

  if (metadata.title) {
    result.title = metadata.title;
  }

  if (metadata.description) {
    result.description = metadata.description;
  }

  if (metadata.example && options.includeExamples !== false) {
    result.example = metadata.example;
  }

  if (metadata.deprecated) {
    result.deprecated = true;
  }

  return result;
}

/**
 * Convert multiple Zod schemas to OpenAPI components
 */
export function zodSchemasToComponents(
  schemas: Record<string, z.ZodTypeAny>,
  options: ZodToOpenAPIOptions = {}
): Record<string, OpenAPISchema> {
  const components: Record<string, OpenAPISchema> = {};

  for (const [name, schema] of Object.entries(schemas)) {
    components[name] = zodToOpenAPI(schema, { ...options, componentName: name });
  }

  return components;
}

/**
 * Create a reference to a component schema
 */
export function createSchemaRef(componentName: string): OpenAPISchema {
  return {
    $ref: `#/components/schemas/${componentName}`,
  };
}

/**
 * Wrap schema in allOf for extending
 */
export function extendSchema(
  baseRef: string,
  extensions: OpenAPISchema
): OpenAPISchema {
  return {
    allOf: [{ $ref: baseRef }, extensions],
  };
}
