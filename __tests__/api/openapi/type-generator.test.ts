/**
 * Type Generator Tests
 * Tests for TypeScript type generation from OpenAPI schemas
 */

import {
  TypeGenerator,
  createTypeGenerator,
  generateTypes,
  generateTypesFromComponents,
  type TypeGeneratorOptions
} from '../../../lib/api/openapi/type-generator';
import type { OpenAPISpec, OpenAPIComponents } from '../../../lib/api/openapi/generator';
import type { OpenAPISchema } from '../../../lib/api/openapi/zod-to-openapi';

describe('TypeGenerator', () => {
  let generator: TypeGenerator;

  beforeEach(() => {
    generator = new TypeGenerator();
  });

  describe('constructor', () => {
    it('should create generator with default options', () => {
      const gen = new TypeGenerator();
      expect(gen).toBeInstanceOf(TypeGenerator);
    });

    it('should create generator with custom options', () => {
      const options: TypeGeneratorOptions = {
        includeComments: false,
        useInterfaces: true,
        exportAll: false,
        typePrefix: 'Api',
        typeSuffix: 'Type'
      };
      const gen = new TypeGenerator(options);
      expect(gen).toBeInstanceOf(TypeGenerator);
    });
  });

  describe('generateType', () => {
    it('should generate a basic type', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        },
        required: ['id']
      };

      const result = generator.generateType('User', schema);
      
      expect(result).toContain('export type User');
      expect(result).toContain('id: string');
      expect(result).toContain('name?: string');
    });

    it('should include comments when enabled', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        description: 'User model',
        properties: {
          id: { type: 'string', description: 'User ID' }
        }
      };

      const result = generator.generateType('User', schema);
      
      expect(result).toContain('/**');
      expect(result).toContain('* User model');
      expect(result).toContain('/** User ID */');
    });

    it('should not include comments when disabled', () => {
      const gen = new TypeGenerator({ includeComments: false });
      const schema: OpenAPISchema = {
        type: 'object',
        description: 'User model',
        properties: {
          id: { type: 'string' }
        }
      };

      const result = gen.generateType('User', schema);
      
      expect(result).not.toContain('/**');
      expect(result).not.toContain('User model');
    });

    it('should use interfaces when specified', () => {
      const gen = new TypeGenerator({ useInterfaces: true });
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const result = gen.generateType('User', schema);
      
      expect(result).toContain('export interface User');
    });

    it('should apply type prefix and suffix', () => {
      const gen = new TypeGenerator({ 
        typePrefix: 'Api', 
        typeSuffix: 'Type' 
      });
      const schema: OpenAPISchema = {
        type: 'object',
        properties: { id: { type: 'string' } }
      };

      const result = gen.generateType('User', schema);
      
      expect(result).toContain('ApiUserType');
    });

    it('should handle string types', () => {
      const schema: OpenAPISchema = {
        type: 'string'
      };

      const result = generator.generateType('Name', schema);
      
      expect(result).toContain('export type Name = string');
    });

    it('should handle number types', () => {
      const schema: OpenAPISchema = {
        type: 'number'
      };

      const result = generator.generateType('Age', schema);
      
      expect(result).toContain('export type Age = number');
    });

    it('should handle boolean types', () => {
      const schema: OpenAPISchema = {
        type: 'boolean'
      };

      const result = generator.generateType('IsActive', schema);
      
      expect(result).toContain('export type IsActive = boolean');
    });

    it('should handle array types', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: { type: 'string' }
      };

      const result = generator.generateType('Tags', schema);
      
      expect(result).toContain('export type Tags = Array<string>');
    });

    it('should handle enum types', () => {
      const schema: OpenAPISchema = {
        type: 'string',
        enum: ['admin', 'user', 'guest']
      };

      const result = generator.generateType('Role', schema);
      
      expect(result).toContain("'admin' | 'user' | 'guest'");
    });

    it('should handle nested objects', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      };

      const result = generator.generateType('Response', schema);
      
      expect(result).toContain('user?: {');
      expect(result).toContain('id?: string');
      expect(result).toContain('name?: string');
    });

    it('should handle $ref types', () => {
      const schema: OpenAPISchema = {
        $ref: '#/components/schemas/User'
      };

      const result = generator.generateType('CurrentUser', schema);
      
      expect(result).toContain('export type CurrentUser = User');
    });
  });

  describe('generateFromComponents', () => {
    it('should generate types from components', () => {
      const components: OpenAPIComponents = {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' }
            }
          },
          Post: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' }
            }
          }
        }
      };

      const result = generator.generateFromComponents(components);
      
      expect(result).toContain('export type User');
      expect(result).toContain('export type Post');
      expect(result).toContain('Auto-generated TypeScript types');
    });

    it('should handle empty components', () => {
      const components: OpenAPIComponents = {};

      const result = generator.generateFromComponents(components);
      
      expect(result).toContain('Auto-generated TypeScript types');
    });
  });

  describe('generateFromSpec', () => {
    it('should generate types from full spec', () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      };

      const result = generator.generateFromSpec(spec);
      
      expect(result).toContain('Schema Types');
      expect(result).toContain('Request/Response Types');
      expect(result).toContain('export type User');
      expect(result).toContain('GetUsersResponse200'); // PascalCase conversion
    });

    it('should handle spec without components', () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {}
      };

      const result = generator.generateFromSpec(spec);
      
      expect(result).toContain('Auto-generated TypeScript types');
    });
  });

  describe('getGeneratedTypes', () => {
    it('should return list of generated types', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: { id: { type: 'string' } }
      };

      generator.generateType('User', schema);
      generator.generateType('Post', schema);

      const types = generator.getGeneratedTypes();
      
      expect(types).toContain('User');
      expect(types).toContain('Post');
    });
  });

  describe('clear', () => {
    it('should clear generated types cache', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: { id: { type: 'string' } }
      };

      generator.generateType('User', schema);
      expect(generator.getGeneratedTypes()).toHaveLength(1);

      generator.clear();
      expect(generator.getGeneratedTypes()).toHaveLength(0);
    });
  });
});

describe('Helper functions', () => {
  describe('createTypeGenerator', () => {
    it('should create a TypeGenerator instance', () => {
      const generator = createTypeGenerator();
      expect(generator).toBeInstanceOf(TypeGenerator);
    });

    it('should create a TypeGenerator with options', () => {
      const generator = createTypeGenerator({ useInterfaces: true });
      expect(generator).toBeInstanceOf(TypeGenerator);
    });
  });

  describe('generateTypes', () => {
    it('should generate types from spec', () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {},
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' }
              }
            }
          }
        }
      };

      const result = generateTypes(spec);
      
      expect(result).toContain('export type User');
    });

    it('should accept options', () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {},
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: { id: { type: 'string' } }
            }
          }
        }
      };

      const result = generateTypes(spec, { useInterfaces: true });
      
      expect(result).toContain('export interface User');
    });
  });

  describe('generateTypesFromComponents', () => {
    it('should generate types from components', () => {
      const components: OpenAPIComponents = {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' }
            }
          }
        }
      };

      const result = generateTypesFromComponents(components);
      
      expect(result).toContain('export type User');
    });
  });
});

describe('Type conversion edge cases', () => {
  let generator: TypeGenerator;

  beforeEach(() => {
    generator = new TypeGenerator();
  });

  it('should handle unknown types', () => {
    const schema: OpenAPISchema = {
      type: undefined
    };

    const result = generator.generateType('Unknown', schema);
    
    expect(result).toContain('export type Unknown = unknown');
  });

  it('should handle integer type', () => {
    const schema: OpenAPISchema = {
      type: 'integer'
    };

    const result = generator.generateType('Count', schema);
    
    expect(result).toContain('export type Count = number');
  });

  it('should handle objects without properties', () => {
    const schema: OpenAPISchema = {
      type: 'object'
    };

    const result = generator.generateType('GenericObject', schema);
    
    expect(result).toContain('[key: string]: unknown');
  });

  it('should convert kebab-case to PascalCase', () => {
    const schema: OpenAPISchema = {
      type: 'object',
      properties: { id: { type: 'string' } }
    };

    const result = generator.generateType('user-profile', schema);
    
    expect(result).toContain('UserProfile');
  });

  it('should convert snake_case to PascalCase', () => {
    const schema: OpenAPISchema = {
      type: 'object',
      properties: { id: { type: 'string' } }
    };

    const result = generator.generateType('user_profile', schema);
    
    expect(result).toContain('UserProfile');
  });
});
