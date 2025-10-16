/**
 * TypeScript Type Generator from OpenAPI Schemas
 * 
 * Generates TypeScript types from OpenAPI 3.0 schemas for type-safe API consumption.
 */

import type { OpenAPISchema } from './zod-to-openapi';
import type { OpenAPISpec, OpenAPIComponents } from './generator';

// ===========================
// Type Generation Options
// ===========================

export interface TypeGeneratorOptions {
  /**
   * Include comments with descriptions
   */
  includeComments?: boolean;
  
  /**
   * Use interfaces instead of types
   */
  useInterfaces?: boolean;
  
  /**
   * Export all generated types
   */
  exportAll?: boolean;
  
  /**
   * Prefix for generated types
   */
  typePrefix?: string;
  
  /**
   * Suffix for generated types
   */
  typeSuffix?: string;
  
  /**
   * Include optional fields
   */
  includeOptional?: boolean;
}

// ===========================
// Type Generator Class
// ===========================

export class TypeGenerator {
  private options: Required<TypeGeneratorOptions>;
  private generatedTypes: Set<string> = new Set();
  
  constructor(options: TypeGeneratorOptions = {}) {
    this.options = {
      includeComments: options.includeComments ?? true,
      useInterfaces: options.useInterfaces ?? false,
      exportAll: options.exportAll ?? true,
      typePrefix: options.typePrefix ?? '',
      typeSuffix: options.typeSuffix ?? '',
      includeOptional: options.includeOptional ?? true
    };
  }
  
  /**
   * Generate TypeScript types from an OpenAPI spec
   */
  generateFromSpec(spec: OpenAPISpec): string {
    const lines: string[] = [];
    
    // Add header comment
    lines.push('/**');
    lines.push(' * Auto-generated TypeScript types from OpenAPI specification');
    lines.push(` * Generated at: ${new Date().toISOString()}`);
    lines.push(' * DO NOT EDIT MANUALLY');
    lines.push(' */');
    lines.push('');
    
    // Generate types from components
    if (spec.components?.schemas) {
      lines.push('// ===========================');
      lines.push('// Schema Types');
      lines.push('// ===========================');
      lines.push('');
      
      Object.entries(spec.components.schemas).forEach(([name, schema]) => {
        const typeName = this.formatTypeName(name);
        const typeDefinition = this.generateType(typeName, schema as OpenAPISchema);
        lines.push(typeDefinition);
        lines.push('');
      });
    }
    
    // Generate request/response types for paths
    if (spec.paths) {
      lines.push('// ===========================');
      lines.push('// Request/Response Types');
      lines.push('// ===========================');
      lines.push('');
      
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
          if (typeof operation !== 'object' || !operation) return;
          
          const operationId = operation.operationId || 
            `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
          // Generate request type if requestBody exists
          if (operation.requestBody?.content?.['application/json']?.schema) {
            const requestTypeName = `${operationId}_Request`;
            const requestType = this.generateType(
              requestTypeName,
              operation.requestBody.content['application/json'].schema
            );
            lines.push(requestType);
            lines.push('');
          }
          
          // Generate response types
          if (operation.responses) {
            Object.entries(operation.responses).forEach(([status, response]) => {
              if (typeof response !== 'object' || !response || !('content' in response)) return;
              const responseWithContent = response as { content?: Record<string, { schema?: unknown }> };
              if (responseWithContent.content?.['application/json']?.schema) {
                const responseTypeName = `${operationId}_Response_${status}`;
                const responseType = this.generateType(
                  responseTypeName,
                  responseWithContent.content['application/json'].schema as OpenAPISchema
                );
                lines.push(responseType);
                lines.push('');
              }
            });
          }
        });
      });
    }
    
    return lines.join('\n');
  }
  
  /**
   * Generate TypeScript types from OpenAPI components
   */
  generateFromComponents(components: OpenAPIComponents): string {
    const lines: string[] = [];
    
    lines.push('/**');
    lines.push(' * Auto-generated TypeScript types from OpenAPI components');
    lines.push(` * Generated at: ${new Date().toISOString()}`);
    lines.push(' */');
    lines.push('');
    
    if (components.schemas) {
      Object.entries(components.schemas).forEach(([name, schema]) => {
        const typeName = this.formatTypeName(name);
        const typeDefinition = this.generateType(typeName, schema as OpenAPISchema);
        lines.push(typeDefinition);
        lines.push('');
      });
    }
    
    return lines.join('\n');
  }
  
  /**
   * Generate a single type definition
   */
  generateType(name: string, schema: OpenAPISchema): string {
    const lines: string[] = [];
    const typeName = this.formatTypeName(name);
    
    // Add description as comment
    if (this.options.includeComments && schema.description) {
      lines.push('/**');
      lines.push(` * ${schema.description}`);
      lines.push(' */');
    }
    
    // Generate the type
    const exportKeyword = this.options.exportAll ? 'export ' : '';
    const typeKeyword = this.options.useInterfaces ? 'interface' : 'type';
    const typeBody = this.schemaToTypeScript(schema);
    
    if (this.options.useInterfaces && typeof typeBody === 'string' && typeBody.startsWith('{')) {
      lines.push(`${exportKeyword}${typeKeyword} ${typeName} ${typeBody}`);
    } else {
      lines.push(`${exportKeyword}${typeKeyword} ${typeName} = ${typeBody};`);
    }
    
    this.generatedTypes.add(typeName);
    
    return lines.join('\n');
  }
  
  /**
   * Convert OpenAPI schema to TypeScript type
   */
  private schemaToTypeScript(schema: OpenAPISchema): string {
    // Handle $ref
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop() || '';
      return this.formatTypeName(refName);
    }
    
    // Handle arrays
    if (schema.type === 'array' && schema.items) {
      const itemType = this.schemaToTypeScript(schema.items);
      return `Array<${itemType}>`;
    }
    
    // Handle objects
    if (schema.type === 'object' || schema.properties) {
      return this.objectToTypeScript(schema);
    }
    
    // Handle primitive types
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return schema.enum.map((v: unknown) => `'${v}'`).join(' | ');
        }
        return 'string';
      
      case 'number':
      case 'integer':
        return 'number';
      
      case 'boolean':
        return 'boolean';
      
      default:
        return 'unknown';
    }
  }
  
  /**
   * Convert object schema to TypeScript
   */
  private objectToTypeScript(schema: OpenAPISchema): string {
    if (!schema.properties) {
      return '{ [key: string]: unknown }';
    }
    
    const lines: string[] = ['{'];
    const required = schema.required || [];
    
    Object.entries(schema.properties).forEach(([propName, propSchema]) => {
      const prop = propSchema as OpenAPISchema;
      const isRequired = required.includes(propName);
      const optionalMarker = isRequired ? '' : '?';
      
      // Add property comment
      if (this.options.includeComments && prop.description) {
        lines.push(`  /** ${prop.description} */`);
      }
      
      const propType = this.schemaToTypeScript(prop);
      lines.push(`  ${propName}${optionalMarker}: ${propType};`);
    });
    
    lines.push('}');
    
    return lines.join('\n');
  }
  
  /**
   * Format type name with prefix/suffix
   */
  private formatTypeName(name: string): string {
    // Convert to PascalCase
    const pascalCase = name
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toUpperCase());
    
    return `${this.options.typePrefix}${pascalCase}${this.options.typeSuffix}`;
  }
  
  /**
   * Get list of generated type names
   */
  getGeneratedTypes(): string[] {
    return Array.from(this.generatedTypes);
  }
  
  /**
   * Clear generated types cache
   */
  clear(): void {
    this.generatedTypes.clear();
  }
}

// ===========================
// Helper Functions
// ===========================

/**
 * Create a type generator instance
 */
export function createTypeGenerator(options?: TypeGeneratorOptions): TypeGenerator {
  return new TypeGenerator(options);
}

/**
 * Generate types from OpenAPI spec
 */
export function generateTypes(spec: OpenAPISpec, options?: TypeGeneratorOptions): string {
  const generator = new TypeGenerator(options);
  return generator.generateFromSpec(spec);
}

/**
 * Generate types from OpenAPI components
 */
export function generateTypesFromComponents(
  components: OpenAPIComponents,
  options?: TypeGeneratorOptions
): string {
  const generator = new TypeGenerator(options);
  return generator.generateFromComponents(components);
}

// Default export
const typeGeneratorModule = {
  TypeGenerator,
  createTypeGenerator,
  generateTypes,
  generateTypesFromComponents
};

export default typeGeneratorModule;
