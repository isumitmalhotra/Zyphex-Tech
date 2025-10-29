/**
 * CMS API Documentation - OpenAPI 3.0 Specification
 * 
 * This file contains the complete API documentation for the CMS system
 * Access via: /api/cms/docs
 */

export const cmsApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Zyphex-Tech CMS API',
    version: '1.0.0',
    description: 'Enterprise-grade Content Management System API with granular section editing, version control, and workflow management',
    contact: {
      name: 'Zyphex-Tech Support',
      email: 'support@zyphextech.com',
      url: 'https://zyphextech.com/support',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/cms',
      description: 'Development server',
    },
    {
      url: 'https://zyphextech.com/api/cms',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Pages',
      description: 'CMS page management endpoints',
    },
    {
      name: 'Sections',
      description: 'Page section management endpoints',
    },
    {
      name: 'Templates',
      description: 'Page template management endpoints',
    },
    {
      name: 'Media',
      description: 'Media asset management endpoints',
    },
    {
      name: 'Versions',
      description: 'Version control and rollback endpoints',
    },
    {
      name: 'Workflows',
      description: 'Content approval workflow endpoints',
    },
    {
      name: 'Schedules',
      description: 'Content scheduling endpoints',
    },
  ],
  paths: {
    '/pages': {
      get: {
        tags: ['Pages'],
        summary: 'List all CMS pages',
        description: 'Retrieve a paginated list of CMS pages with filtering and sorting options',
        operationId: 'listPages',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10,
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by page status',
            required: false,
            schema: {
              type: 'string',
              enum: ['draft', 'review', 'scheduled', 'published', 'archived', 'all'],
              default: 'all',
            },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search in page title, key, or slug',
            required: false,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Field to sort by',
            required: false,
            schema: {
              type: 'string',
              enum: ['createdAt', 'updatedAt', 'pageTitle', 'publishedAt'],
              default: 'createdAt',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            description: 'Sort order',
            required: false,
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Page' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                    filters: { $ref: '#/components/schemas/Filters' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
      post: {
        tags: ['Pages'],
        summary: 'Create a new CMS page',
        description: 'Create a new page with metadata and initial version',
        operationId: 'createPage',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePage' },
            },
          },
        },
        responses: {
          201: {
            description: 'Page created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Page created successfully' },
                    data: { $ref: '#/components/schemas/Page' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/pages/{id}': {
      get: {
        tags: ['Pages'],
        summary: 'Get a specific page',
        description: 'Retrieve detailed information about a specific page including sections and version history',
        operationId: 'getPage',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Page UUID',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PageDetailed' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
      patch: {
        tags: ['Pages'],
        summary: 'Update a page',
        description: 'Update page properties and create a new version',
        operationId: 'updatePage',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Page UUID',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePage' },
            },
          },
        },
        responses: {
          200: {
            description: 'Page updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Page updated successfully' },
                    data: { $ref: '#/components/schemas/Page' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
      delete: {
        tags: ['Pages'],
        summary: 'Delete a page',
        description: 'Soft delete a page (can be restored)',
        operationId: 'deletePage',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Page UUID',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          200: {
            description: 'Page deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Page deleted successfully' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/pages/{id}/sections': {
      get: {
        tags: ['Sections'],
        summary: 'List all sections for a page',
        description: 'Retrieve all sections of a page ordered by their position',
        operationId: 'listSections',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Page UUID',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Section' },
                    },
                    count: { type: 'integer', example: 5 },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
      post: {
        tags: ['Sections'],
        summary: 'Create a new section',
        description: 'Add a new section to a page',
        operationId: 'createSection',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Page UUID',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSection' },
            },
          },
        },
        responses: {
          201: {
            description: 'Section created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Section created successfully' },
                    data: { $ref: '#/components/schemas/Section' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
      patch: {
        tags: ['Sections'],
        summary: 'Reorder sections',
        description: 'Update the order of multiple sections at once',
        operationId: 'reorderSections',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Page UUID',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        order: { type: 'integer', minimum: 0 },
                      },
                      required: ['id', 'order'],
                    },
                  },
                },
                required: ['sections'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sections reordered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Sections reordered successfully' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
  components: {
    schemas: {
      Page: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          pageKey: { type: 'string', example: 'home' },
          pageTitle: { type: 'string', example: 'Home Page' },
          slug: { type: 'string', example: '/' },
          pageType: { type: 'string', enum: ['standard', 'landing', 'blog', 'custom'] },
          status: { type: 'string', enum: ['draft', 'review', 'scheduled', 'published', 'archived'] },
          templateId: { type: 'string', format: 'uuid', nullable: true },
          metaTitle: { type: 'string', nullable: true },
          metaDescription: { type: 'string', nullable: true },
          metaKeywords: { type: 'string', nullable: true },
          ogImage: { type: 'string', nullable: true },
          ogTitle: { type: 'string', nullable: true },
          ogDescription: { type: 'string', nullable: true },
          structuredData: { type: 'object', nullable: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          scheduledPublishAt: { type: 'string', format: 'date-time', nullable: true },
          scheduledUnpublishAt: { type: 'string', format: 'date-time', nullable: true },
          authorId: { type: 'string', format: 'uuid', nullable: true },
          lastEditedBy: { type: 'string', format: 'uuid', nullable: true },
          isPublic: { type: 'boolean' },
          requiresAuth: { type: 'boolean' },
          allowComments: { type: 'boolean' },
          layout: { type: 'string', nullable: true },
          seoScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      PageDetailed: {
        allOf: [
          { $ref: '#/components/schemas/Page' },
          {
            type: 'object',
            properties: {
              template: { $ref: '#/components/schemas/Template' },
              sections: {
                type: 'array',
                items: { $ref: '#/components/schemas/Section' },
              },
              versions: {
                type: 'array',
                items: { $ref: '#/components/schemas/VersionSummary' },
              },
              _count: {
                type: 'object',
                properties: {
                  sections: { type: 'integer' },
                  versions: { type: 'integer' },
                  workflows: { type: 'integer' },
                  schedules: { type: 'integer' },
                },
              },
            },
          },
        ],
      },
      CreatePage: {
        type: 'object',
        required: ['pageKey', 'pageTitle', 'slug'],
        properties: {
          pageKey: { type: 'string', pattern: '^[a-z0-9-]+$' },
          pageTitle: { type: 'string', minLength: 1, maxLength: 255 },
          slug: { type: 'string', pattern: '^[a-z0-9-/]+$' },
          pageType: { type: 'string', enum: ['standard', 'landing', 'blog', 'custom'], default: 'standard' },
          templateId: { type: 'string', format: 'uuid' },
          metaTitle: { type: 'string', maxLength: 60 },
          metaDescription: { type: 'string', maxLength: 160 },
          metaKeywords: { type: 'string', maxLength: 255 },
          ogImage: { type: 'string', format: 'uri' },
          ogTitle: { type: 'string', maxLength: 60 },
          ogDescription: { type: 'string', maxLength: 160 },
          structuredData: { type: 'object' },
          isPublic: { type: 'boolean', default: true },
          requiresAuth: { type: 'boolean', default: false },
          allowComments: { type: 'boolean', default: false },
          layout: { type: 'string' },
        },
      },
      UpdatePage: {
        type: 'object',
        properties: {
          pageKey: { type: 'string', pattern: '^[a-z0-9-]+$' },
          pageTitle: { type: 'string', minLength: 1, maxLength: 255 },
          slug: { type: 'string', pattern: '^[a-z0-9-/]+$' },
          pageType: { type: 'string', enum: ['standard', 'landing', 'blog', 'custom'] },
          templateId: { type: 'string', format: 'uuid', nullable: true },
          status: { type: 'string', enum: ['draft', 'review', 'scheduled', 'published', 'archived'] },
          metaTitle: { type: 'string', maxLength: 60, nullable: true },
          metaDescription: { type: 'string', maxLength: 160, nullable: true },
          metaKeywords: { type: 'string', maxLength: 255, nullable: true },
          ogImage: { type: 'string', format: 'uri', nullable: true },
          ogTitle: { type: 'string', maxLength: 60, nullable: true },
          ogDescription: { type: 'string', maxLength: 160, nullable: true },
          structuredData: { type: 'object', nullable: true },
          scheduledPublishAt: { type: 'string', format: 'date-time', nullable: true },
          scheduledUnpublishAt: { type: 'string', format: 'date-time', nullable: true },
          isPublic: { type: 'boolean' },
          requiresAuth: { type: 'boolean' },
          allowComments: { type: 'boolean' },
          layout: { type: 'string', nullable: true },
          seoScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
          changeDescription: { type: 'string' },
        },
      },
      Section: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          pageId: { type: 'string', format: 'uuid' },
          sectionKey: { type: 'string' },
          sectionType: { type: 'string', enum: ['hero', 'features', 'testimonials', 'cta', 'content', 'gallery', 'faq', 'custom'] },
          title: { type: 'string', nullable: true },
          subtitle: { type: 'string', nullable: true },
          content: { type: 'object' },
          order: { type: 'integer', minimum: 0 },
          isVisible: { type: 'boolean' },
          cssClasses: { type: 'string', nullable: true },
          customStyles: { type: 'object', nullable: true },
          showOnMobile: { type: 'boolean' },
          showOnTablet: { type: 'boolean' },
          showOnDesktop: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateSection: {
        type: 'object',
        required: ['sectionKey', 'sectionType', 'content'],
        properties: {
          sectionKey: { type: 'string', pattern: '^[a-z0-9-]+$' },
          sectionType: { type: 'string', enum: ['hero', 'features', 'testimonials', 'cta', 'content', 'gallery', 'faq', 'custom'] },
          title: { type: 'string', maxLength: 255, nullable: true },
          subtitle: { type: 'string', maxLength: 500, nullable: true },
          content: { type: 'object' },
          order: { type: 'integer', minimum: 0, default: 0 },
          isVisible: { type: 'boolean', default: true },
          cssClasses: { type: 'string', nullable: true },
          customStyles: { type: 'object', nullable: true },
          showOnMobile: { type: 'boolean', default: true },
          showOnTablet: { type: 'boolean', default: true },
          showOnDesktop: { type: 'boolean', default: true },
        },
      },
      Template: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          category: { type: 'string' },
          thumbnailUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          isSystem: { type: 'boolean' },
        },
      },
      VersionSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          versionNumber: { type: 'integer' },
          changeDescription: { type: 'string', nullable: true },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          isPublished: { type: 'boolean' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalCount: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
      Filters: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          search: { type: 'string', nullable: true },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized - Authentication required',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Unauthorized' },
                message: { type: 'string', example: 'You must be logged in' },
              },
            },
          },
        },
      },
      BadRequest: {
        description: 'Bad Request - Invalid input',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation Error - Invalid data format',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Validation Error' },
                message: { type: 'string', example: 'Invalid data' },
                details: {
                  type: 'array',
                  items: { type: 'object' },
                },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Not Found - Resource does not exist',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Not Found' },
                message: { type: 'string', example: 'Resource not found' },
              },
            },
          },
        },
      },
      Conflict: {
        description: 'Conflict - Resource already exists',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Conflict' },
                message: { type: 'string', example: 'Resource already exists' },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Internal Server Error' },
                message: { type: 'string', example: 'Something went wrong' },
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
