/**
 * CMS API Documentation Service
 * Task #27: Comprehensive API documentation with OpenAPI/Swagger specs
 */

import { prisma } from '@/lib/prisma';

// Types
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ApiDocumentation {
  id: string;
  endpoint: string;
  method: string;
  category: string;
  title: string;
  description: string;
  requestSchema?: JsonValue;
  requestExample?: JsonValue;
  queryParameters?: JsonValue;
  pathParameters?: JsonValue;
  headers?: JsonValue;
  responseSchema?: JsonValue;
  responseExample?: JsonValue;
  errorResponses?: JsonValue;
  version: string;
  deprecated: boolean;
  requiresAuth: boolean;
  requiredRoles: string[];
  rateLimits?: JsonValue;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

export interface ApiCategory {
  name: string;
  description: string;
  endpoints: ApiDocumentation[];
}

// API Documentation Service
class ApiDocumentationService {
  /**
   * Create or update API documentation
   */
  async upsertDocumentation(
    data: Omit<ApiDocumentation, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ): Promise<ApiDocumentation> {
    // Check if documentation exists for this endpoint and method
    const existing = await prisma.cmsApiDocumentation.findFirst({
      where: {
        endpoint: data.endpoint,
        method: data.method,
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.cmsApiDocumentation.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedBy: userId,
        } as never,
      });
      return updated as ApiDocumentation;
    } else {
      // Create new
      const created = await prisma.cmsApiDocumentation.create({
        data: {
          ...data,
          createdBy: userId,
          updatedBy: userId,
        } as never,
      });
      return created as ApiDocumentation;
    }
  }

  /**
   * Get API documentation by ID
   */
  async getDocumentation(id: string): Promise<ApiDocumentation | null> {
    const doc = await prisma.cmsApiDocumentation.findUnique({
      where: { id },
    });
    return doc as ApiDocumentation | null;
  }

  /**
   * Get API documentation by endpoint and method
   */
  async getDocumentationByEndpoint(
    endpoint: string,
    method: string
  ): Promise<ApiDocumentation | null> {
    const doc = await prisma.cmsApiDocumentation.findFirst({
      where: {
        endpoint,
        method: method.toUpperCase(),
      },
    });
    return doc as ApiDocumentation | null;
  }

  /**
   * Get all API documentation with filters
   */
  async getAllDocumentation(filters?: {
    category?: string;
    deprecated?: boolean;
    requiresAuth?: boolean;
    tags?: string[];
    search?: string;
  }): Promise<ApiDocumentation[]> {
    const where: Record<string, unknown> = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.deprecated !== undefined) {
      where.deprecated = filters.deprecated;
    }

    if (filters?.requiresAuth !== undefined) {
      where.requiresAuth = filters.requiresAuth;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.search) {
      where.OR = [
        { endpoint: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const docs = await prisma.cmsApiDocumentation.findMany({
      where,
      orderBy: [{ category: 'asc' }, { endpoint: 'asc' }, { method: 'asc' }],
    });

    return docs as ApiDocumentation[];
  }

  /**
   * Get documentation grouped by category
   */
  async getDocumentationByCategory(): Promise<ApiCategory[]> {
    const allDocs = await this.getAllDocumentation();

    const categories = new Map<string, ApiDocumentation[]>();

    allDocs.forEach((doc) => {
      const existing = categories.get(doc.category) || [];
      existing.push(doc);
      categories.set(doc.category, existing);
    });

    const result: ApiCategory[] = [];
    categories.forEach((endpoints, name) => {
      result.push({
        name,
        description: this.getCategoryDescription(name),
        endpoints,
      });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get category description
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      Pages: 'Manage CMS pages, sections, and content',
      Media: 'Handle media assets, uploads, and transformations',
      Templates: 'Manage page templates and layouts',
      Workflows: 'Control content workflows and approvals',
      Versioning: 'Track content versions and history',
      Publishing: 'Manage content publishing schedules',
      Backup: 'Backup and restore CMS content',
      Analytics: 'View CMS analytics and insights',
      Automation: 'Automated tasks and scheduled operations',
      Performance: 'Monitor system performance and metrics',
      Errors: 'Error logging and tracking',
      Documentation: 'API documentation endpoints',
    };

    return descriptions[category] || 'CMS API endpoints';
  }

  /**
   * Generate OpenAPI 3.0 specification
   */
  async generateOpenApiSpec(): Promise<OpenApiSpec> {
    const allDocs = await this.getAllDocumentation({ deprecated: false });

    const paths: Record<string, Record<string, unknown>> = {};
    const schemas: Record<string, unknown> = {};
    const tags = new Set<string>();

    allDocs.forEach((doc) => {
      // Add to tags
      tags.add(doc.category);

      // Initialize path if not exists
      if (!paths[doc.endpoint]) {
        paths[doc.endpoint] = {};
      }

      // Build operation
      interface Parameter {
        name: string;
        in: string;
        required: boolean;
        description: string;
        schema: unknown;
      }

      const operation: Record<string, unknown> = {
        summary: doc.title,
        description: doc.description,
        tags: [doc.category],
        operationId: `${doc.method.toLowerCase()}_${doc.endpoint.replace(/\//g, '_')}`,
      };

      // Add parameters
      const parameters: Parameter[] = [];

      if (doc.pathParameters) {
        Object.entries(doc.pathParameters as Record<string, unknown>).forEach(([name, param]) => {
          const p = param as Record<string, unknown>;
          parameters.push({
            name,
            in: 'path',
            required: (p.required as boolean) || true,
            description: (p.description as string) || '',
            schema: p.schema || { type: 'string' },
          });
        });
      }

      if (doc.queryParameters) {
        Object.entries(doc.queryParameters as Record<string, unknown>).forEach(([name, param]) => {
          const p = param as Record<string, unknown>;
          parameters.push({
            name,
            in: 'query',
            required: (p.required as boolean) || false,
            description: (p.description as string) || '',
            schema: p.schema || { type: 'string' },
          });
        });
      }

      if (parameters.length > 0) {
        operation.parameters = parameters;
      }

      // Add request body
      if (doc.requestSchema && ['POST', 'PUT', 'PATCH'].includes(doc.method)) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: doc.requestSchema,
              example: doc.requestExample,
            },
          },
        };
      }

      // Add responses
      operation.responses = {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: doc.responseSchema || { type: 'object' },
              example: doc.responseExample,
            },
          },
        },
      };

      // Add error responses
      if (doc.errorResponses) {
        Object.entries(doc.errorResponses as Record<string, unknown>).forEach(([code, response]) => {
          (operation.responses as Record<string, unknown>)[code] = response;
        });
      }

      // Add security
      if (doc.requiresAuth) {
        operation.security = [{ bearerAuth: [] }];
      }

      // Add to paths
      paths[doc.endpoint][doc.method.toLowerCase()] = operation;
    });

    // Build spec
    const spec: OpenApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Zyphex Tech CMS API',
        version: '1.0.0',
        description: 'Comprehensive API documentation for Zyphex Tech CMS',
        contact: {
          name: 'Zyphex Tech Support',
          email: 'support@zyphextech.com',
          url: 'https://zyphextech.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://api.zyphextech.com',
          description: 'Production server',
        },
      ],
      paths,
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: Array.from(tags).map((tag) => ({
        name: tag,
        description: this.getCategoryDescription(tag),
      })),
    };

    return spec;
  }

  /**
   * Delete API documentation
   */
  async deleteDocumentation(id: string): Promise<void> {
    await prisma.cmsApiDocumentation.delete({
      where: { id },
    });
  }

  /**
   * Bulk import API documentation
   */
  async bulkImport(
    docs: Array<Omit<ApiDocumentation, 'id' | 'createdAt' | 'updatedAt'>>,
    userId?: string
  ): Promise<{ imported: number; updated: number }> {
    let imported = 0;
    let updated = 0;

    for (const doc of docs) {
      const existing = await prisma.cmsApiDocumentation.findFirst({
        where: {
          endpoint: doc.endpoint,
          method: doc.method,
        },
      });

      if (existing) {
        await prisma.cmsApiDocumentation.update({
          where: { id: existing.id },
          data: {
            ...doc,
            updatedBy: userId,
          } as never,
        });
        updated++;
      } else {
        await prisma.cmsApiDocumentation.create({
          data: {
            ...doc,
            createdBy: userId,
            updatedBy: userId,
          } as never,
        });
        imported++;
      }
    }

    return { imported, updated };
  }

  /**
   * Get API statistics
   */
  async getStatistics(): Promise<{
    totalEndpoints: number;
    endpointsByCategory: Record<string, number>;
    endpointsByMethod: Record<string, number>;
    deprecatedCount: number;
    authRequiredCount: number;
  }> {
    const allDocs = await this.getAllDocumentation();

    const endpointsByCategory: Record<string, number> = {};
    const endpointsByMethod: Record<string, number> = {};
    let deprecatedCount = 0;
    let authRequiredCount = 0;

    allDocs.forEach((doc) => {
      // Count by category
      endpointsByCategory[doc.category] = (endpointsByCategory[doc.category] || 0) + 1;

      // Count by method
      endpointsByMethod[doc.method] = (endpointsByMethod[doc.method] || 0) + 1;

      // Count deprecated
      if (doc.deprecated) {
        deprecatedCount++;
      }

      // Count auth required
      if (doc.requiresAuth) {
        authRequiredCount++;
      }
    });

    return {
      totalEndpoints: allDocs.length,
      endpointsByCategory,
      endpointsByMethod,
      deprecatedCount,
      authRequiredCount,
    };
  }
}

// Export singleton instance
export const apiDocsService = new ApiDocumentationService();

// Export class for testing
export { ApiDocumentationService };
