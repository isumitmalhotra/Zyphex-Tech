import { z } from 'zod';
import {
  zodToOpenAPI,
  zodToOpenAPIWithMetadata,
  zodSchemasToComponents,
  createSchemaRef,
  extendSchema,
} from '@/lib/api/openapi/zod-to-openapi';

describe('zodToOpenAPI', () => {
  describe('String types', () => {
    it('should convert basic string', () => {
      const schema = z.string();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
      });
    });

    it('should handle minLength', () => {
      const schema = z.string().min(5);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        minLength: 5,
      });
    });

    it('should handle maxLength', () => {
      const schema = z.string().max(100);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        maxLength: 100,
      });
    });

    it('should handle min and max together', () => {
      const schema = z.string().min(5).max(100);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        minLength: 5,
        maxLength: 100,
      });
    });

    it('should detect email format', () => {
      const schema = z.string().email();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        format: 'email',
      });
    });

    it('should detect URL format', () => {
      const schema = z.string().url();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        format: 'uri',
      });
    });

    it('should detect UUID format', () => {
      const schema = z.string().uuid();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        format: 'uuid',
      });
    });

    it('should handle regex patterns', () => {
      const schema = z.string().regex(/^[A-Z]/);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        pattern: '^[A-Z]',
      });
    });
  });

  describe('Number types', () => {
    it('should convert basic number', () => {
      const schema = z.number();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'number',
      });
    });

    it('should detect integer type', () => {
      const schema = z.number().int();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'integer',
      });
    });

    it('should handle minimum', () => {
      const schema = z.number().min(0);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'number',
        minimum: 0,
      });
    });

    it('should handle maximum', () => {
      const schema = z.number().max(100);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'number',
        maximum: 100,
      });
    });

    it('should handle min and max together', () => {
      const schema = z.number().min(0).max(100);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'number',
        minimum: 0,
        maximum: 100,
      });
    });

    it('should handle positive numbers', () => {
      const schema = z.number().positive();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'number',
        minimum: 0,
      });
    });
  });

  describe('Boolean types', () => {
    it('should convert boolean', () => {
      const schema = z.boolean();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'boolean',
      });
    });
  });

  describe('Enum types', () => {
    it('should convert enum', () => {
      const schema = z.enum(['RED', 'GREEN', 'BLUE']);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        enum: ['RED', 'GREEN', 'BLUE'],
      });
    });

    it('should handle single value enum', () => {
      const schema = z.enum(['ONLY']);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        enum: ['ONLY'],
      });
    });
  });

  describe('Literal types', () => {
    it('should convert string literal', () => {
      const schema = z.literal('hello');
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        enum: ['hello'],
      });
    });

    it('should convert number literal', () => {
      const schema = z.literal(42);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'number',
        enum: [42],
      });
    });

    it('should convert boolean literal', () => {
      const schema = z.literal(true);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'boolean',
        enum: [true],
      });
    });
  });

  describe('Array types', () => {
    it('should convert basic array', () => {
      const schema = z.array(z.string());
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('should handle minItems', () => {
      const schema = z.array(z.string()).min(1);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
      });
    });

    it('should handle maxItems', () => {
      const schema = z.array(z.string()).max(10);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
        maxItems: 10,
      });
    });

    it('should handle complex item types', () => {
      const schema = z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      );
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      });
    });
  });

  describe('Object types', () => {
    it('should convert simple object', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      });
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
      });
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      });
    });

    it('should handle nullable fields', () => {
      const schema = z.object({
        name: z.string(),
        description: z.string().nullable(),
      });
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
        },
        required: ['name', 'description'],
      });
    });

    it('should handle default values', () => {
      const schema = z.object({
        name: z.string(),
        role: z.string().default('USER'),
      });
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', default: 'USER' },
        },
        required: ['name'],
      });
    });

    it('should handle nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name', 'email'],
          },
        },
        required: ['user'],
      });
    });

    it('should not mark optional fields as required', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        withDefault: z.string().default('default'),
      });
      const result = zodToOpenAPI(schema);

      expect(result.required).toEqual(['required']);
      expect(result.properties?.optional).toEqual({ type: 'string' });
      expect(result.properties?.withDefault).toEqual({ type: 'string', default: 'default' });
    });
  });

  describe('Union types', () => {
    it('should convert union', () => {
      const schema = z.union([z.string(), z.number()]);
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        anyOf: [{ type: 'string' }, { type: 'number' }],
      });
    });

    it('should handle complex unions', () => {
      const schema = z.union([
        z.object({ type: z.literal('A'), value: z.string() }),
        z.object({ type: z.literal('B'), value: z.number() }),
      ]);
      const result = zodToOpenAPI(schema);

      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(2);
    });
  });

  describe('Date types', () => {
    it('should convert date', () => {
      const schema = z.date();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        format: 'date-time',
      });
    });
  });

  describe('Record types', () => {
    it('should convert record', () => {
      const schema = z.record(z.number());
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({
        type: 'object',
        additionalProperties: { type: 'number' },
      });
    });
  });

  describe('Special types', () => {
    it('should handle any type', () => {
      const schema = z.any();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({});
    });

    it('should handle unknown type', () => {
      const schema = z.unknown();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({});
    });

    it('should handle never type', () => {
      const schema = z.never();
      const result = zodToOpenAPI(schema);

      expect(result).toEqual({ not: {} });
    });
  });
});

describe('zodToOpenAPIWithMetadata', () => {
  it('should add title', () => {
    const schema = z.string();
    const result = zodToOpenAPIWithMetadata(schema, {
      title: 'User Name',
    });

    expect(result.title).toBe('User Name');
  });

  it('should add description', () => {
    const schema = z.string();
    const result = zodToOpenAPIWithMetadata(schema, {
      description: 'The user\'s full name',
    });

    expect(result.description).toBe('The user\'s full name');
  });

  it('should add example', () => {
    const schema = z.string();
    const result = zodToOpenAPIWithMetadata(schema, {
      example: 'John Doe',
    });

    expect(result.example).toBe('John Doe');
  });

  it('should add deprecated flag', () => {
    const schema = z.string();
    const result = zodToOpenAPIWithMetadata(schema, {
      deprecated: true,
    });

    expect(result.deprecated).toBe(true);
  });

  it('should add all metadata', () => {
    const schema = z.string();
    const result = zodToOpenAPIWithMetadata(schema, {
      title: 'User Name',
      description: 'The user\'s full name',
      example: 'John Doe',
      deprecated: false,
    });

    expect(result.title).toBe('User Name');
    expect(result.description).toBe('The user\'s full name');
    expect(result.example).toBe('John Doe');
  });
});

describe('zodSchemasToComponents', () => {
  it('should convert multiple schemas', () => {
    const schemas = {
      User: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      Team: z.object({
        name: z.string(),
        members: z.array(z.string()),
      }),
    };

    const components = zodSchemasToComponents(schemas);

    expect(components.User).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['name', 'email'],
    });

    expect(components.Team).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        members: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['name', 'members'],
    });
  });

  it('should handle empty schemas object', () => {
    const components = zodSchemasToComponents({});
    expect(components).toEqual({});
  });
});

describe('createSchemaRef', () => {
  it('should create schema reference', () => {
    const ref = createSchemaRef('User');
    expect(ref).toEqual({
      $ref: '#/components/schemas/User',
    });
  });
});

describe('extendSchema', () => {
  it('should extend schema with allOf', () => {
    const extended = extendSchema('#/components/schemas/BaseUser', {
      type: 'object',
      properties: {
        additionalField: { type: 'string' },
      },
    });

    expect(extended).toEqual({
      allOf: [
        { $ref: '#/components/schemas/BaseUser' },
        {
          type: 'object',
          properties: {
            additionalField: { type: 'string' },
          },
        },
      ],
    });
  });
});
