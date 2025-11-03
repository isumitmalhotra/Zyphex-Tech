/**
 * CMS Testing Utilities
 * Task #28: Comprehensive testing helpers and mock data generators
 */

import { PrismaClient } from '@prisma/client';

// Mock data generators
export class CMSTestData {
  /**
   * Generate mock page data
   */
  static mockPage(overrides?: Partial<{
    title: string;
    slug: string;
    status: string;
    userId: string;
  }>) {
    return {
      title: overrides?.title || 'Test Page',
      slug: overrides?.slug || 'test-page',
      metaTitle: 'Test Meta Title',
      metaDescription: 'Test meta description',
      status: overrides?.status || 'DRAFT',
      userId: overrides?.userId || 'test-user-id',
      content: {
        sections: [
          {
            type: 'hero',
            content: { title: 'Hero Title', subtitle: 'Hero Subtitle' },
          },
        ],
      },
    };
  }

  /**
   * Generate mock page section data
   */
  static mockPageSection(overrides?: Partial<{
    pageId: string;
    type: string;
    order: number;
  }>) {
    return {
      pageId: overrides?.pageId || 'test-page-id',
      type: overrides?.type || 'hero',
      name: 'Test Section',
      order: overrides?.order || 0,
      content: {
        title: 'Section Title',
        description: 'Section description',
      },
      visible: true,
    };
  }

  /**
   * Generate mock media asset data
   */
  static mockMediaAsset(overrides?: Partial<{
    fileName: string;
    fileSize: number;
    mimeType: string;
    userId: string;
  }>) {
    return {
      fileName: overrides?.fileName || 'test-image.jpg',
      fileSize: overrides?.fileSize || 1024000,
      mimeType: overrides?.mimeType || 'image/jpeg',
      url: '/uploads/test-image.jpg',
      storageProvider: 'local',
      uploadedBy: overrides?.userId || 'test-user-id',
      metadata: {
        width: 1920,
        height: 1080,
      },
    };
  }

  /**
   * Generate mock template data
   */
  static mockTemplate(overrides?: Partial<{
    name: string;
    category: string;
    userId: string;
  }>) {
    return {
      name: overrides?.name || 'Test Template',
      category: overrides?.category || 'landing',
      description: 'Test template description',
      previewImage: '/templates/test-template.jpg',
      structure: {
        sections: [
          { type: 'hero', required: true },
          { type: 'content', required: false },
        ],
      },
      metadata: {
        author: 'Test Author',
        version: '1.0.0',
      },
      isActive: true,
      createdBy: overrides?.userId || 'test-user-id',
    };
  }

  /**
   * Generate mock workflow data
   */
  static mockWorkflow(overrides?: Partial<{
    name: string;
    userId: string;
  }>) {
    return {
      name: overrides?.name || 'Test Workflow',
      description: 'Test workflow description',
      steps: [
        { name: 'Draft', order: 0, requiresApproval: false },
        { name: 'Review', order: 1, requiresApproval: true },
        { name: 'Published', order: 2, requiresApproval: false },
      ],
      metadata: {
        notifyOnStepChange: true,
      },
      isActive: true,
      createdBy: overrides?.userId || 'test-user-id',
    };
  }

  /**
   * Generate mock version data
   */
  static mockVersion(overrides?: Partial<{
    pageId: string;
    version: number;
    userId: string;
  }>) {
    return {
      pageId: overrides?.pageId || 'test-page-id',
      version: overrides?.version || 1,
      content: {
        title: 'Version Content',
        sections: [],
      },
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
      },
      createdBy: overrides?.userId || 'test-user-id',
    };
  }

  /**
   * Generate mock schedule data
   */
  static mockSchedule(overrides?: Partial<{
    pageId: string;
    publishAt: Date;
    userId: string;
  }>) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    return {
      pageId: overrides?.pageId || 'test-page-id',
      action: 'publish',
      publishAt: overrides?.publishAt || futureDate,
      status: 'pending',
      createdBy: overrides?.userId || 'test-user-id',
    };
  }

  /**
   * Generate mock backup data
   */
  static mockBackup(overrides?: Partial<{
    name: string;
    userId: string;
  }>) {
    return {
      name: overrides?.name || 'Test Backup',
      description: 'Test backup description',
      type: 'full',
      status: 'completed',
      fileSize: BigInt(5000000),
      fileName: 'test-backup.zip',
      filePath: '/backups/test-backup.zip',
      metadata: {
        pageCount: 10,
        assetCount: 5,
      },
      createdBy: overrides?.userId || 'test-user-id',
    };
  }

  /**
   * Generate mock performance metric
   */
  static mockPerformanceMetric(overrides?: Partial<{
    metricType: string;
    value: number;
    userId: string;
  }>) {
    return {
      metricType: overrides?.metricType || 'api_response_time',
      metricName: 'Test Metric',
      value: overrides?.value || 150.5,
      unit: 'ms',
      context: {
        endpoint: '/api/test',
        method: 'GET',
      },
      recordedBy: overrides?.userId || 'test-user-id',
      tags: ['test', 'performance'],
    };
  }

  /**
   * Generate mock error log
   */
  static mockErrorLog(overrides?: Partial<{
    errorType: string;
    severity: string;
    userId: string;
  }>) {
    return {
      errorType: overrides?.errorType || 'internal_server_error',
      severity: overrides?.severity || 'high',
      message: 'Test error message',
      stackTrace: 'Error stack trace here',
      context: {
        component: 'TestComponent',
        action: 'testAction',
      },
      userId: overrides?.userId,
      endpoint: '/api/test',
      method: 'POST',
      statusCode: 500,
      tags: ['test', 'error'],
    };
  }

  /**
   * Generate mock API documentation
   */
  static mockApiDoc(overrides?: Partial<{
    endpoint: string;
    method: string;
    category: string;
  }>) {
    return {
      endpoint: overrides?.endpoint || '/api/cms/test',
      method: overrides?.method || 'GET',
      category: overrides?.category || 'Test',
      title: 'Test API Endpoint',
      description: 'This is a test API endpoint',
      requestSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      requestExample: {
        name: 'Test',
      },
      responseSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
        },
      },
      responseExample: {
        success: true,
        data: { id: '123' },
      },
      version: '1.0.0',
      deprecated: false,
      requiresAuth: true,
      requiredRoles: ['SUPER_ADMIN'],
      tags: ['test'],
    };
  }
}

// Test database helpers
export class CMSTestDB {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Clean up all CMS test data
   */
  async cleanup() {
    // Delete in order to avoid foreign key constraints
    await this.prisma.cmsPageSection.deleteMany({});
    await this.prisma.cmsPageVersion.deleteMany({});
    // await this.prisma.cmsPublishSchedule.deleteMany({});
    await this.prisma.cmsPage.deleteMany({});
    await this.prisma.cmsMediaAsset.deleteMany({});
    await this.prisma.cmsTemplate.deleteMany({});
    await this.prisma.cmsWorkflow.deleteMany({});
    await this.prisma.cmsBackup.deleteMany({});
    // Note: Uncomment these after running Prisma generate
    // await this.prisma.cmsPerformanceMetric.deleteMany({});
    // await this.prisma.cmsPerformanceAlert.deleteMany({});
    // await this.prisma.cmsErrorLog.deleteMany({});
    // await this.prisma.cmsApiDocumentation.deleteMany({});
  }

  /**
   * Create a test page with all related data
   * Note: Update this to match your actual Prisma schema field names
   */
  async createTestPage(userId: string) {
    const page = await this.prisma.cmsPage.create({
      data: {
        pageKey: 'test-page',
        pageTitle: 'Test Page',
        slug: 'test-page',
        metaTitle: 'Test Meta Title',
        metaDescription: 'Test meta description',
        status: 'DRAFT',
        pageContent: {} as never,
      } as never,
    });

    const section = await this.prisma.cmsPageSection.create({
      data: {
        pageId: page.id,
        sectionKey: 'test-section',
        sectionType: 'hero',
        order: 0,
        sectionContent: {} as never,
        visible: true,
      } as never,
    });

    const version = await this.prisma.cmsPageVersion.create({
      data: {
        pageId: page.id,
        versionNumber: 1,
        pageSnapshot: {} as never,
        sectionsSnapshot: {} as never,
        createdBy: userId,
      } as never,
    });

    return { page, section, version };
  }

  /**
   * Create test media assets
   * Note: Update to match actual schema
   */
  async createTestMedia(userId: string, count = 3) {
    const assets = [];
    for (let i = 0; i < count; i++) {
      const asset = await this.prisma.cmsMediaAsset.create({
        data: {
          filename: `test-image-${i}.jpg`,
          originalName: `test-image-${i}.jpg`,
          filePath: `/uploads/test-image-${i}.jpg`,
          fileUrl: `/uploads/test-image-${i}.jpg`,
          fileSize: 1024000,
          mimeType: 'image/jpeg',
          assetType: 'image',
          uploadedBy: userId,
        } as never,
      });
      assets.push(asset);
    }
    return assets;
  }

  /**
   * Create test template
   * Note: Update to match actual schema
   */
  async createTestTemplate(userId: string) {
    return await this.prisma.cmsTemplate.create({
      data: {
        name: 'Test Template',
        category: 'landing',
        description: 'Test template description',
        templateStructure: {} as never,
        isActive: true,
        createdBy: userId,
      } as never,
    });
  }

  /**
   * Create test workflow
   * Note: Update to match actual schema
   */
  async createTestWorkflow(userId: string) {
    return await this.prisma.cmsWorkflow.create({
      data: {
        name: 'Test Workflow',
        description: 'Test workflow description',
        workflowSteps: {} as never,
        isActive: true,
        createdBy: userId,
      } as never,
    });
  }

  /**
   * Create test performance metrics
   * Note: Uncomment after Prisma client regenerates
   */
  async createTestMetrics(_userId: string, _count = 5) {
    // Commented out until Prisma client is refreshed
    // const metrics = [];
    // for (let i = 0; i < count; i++) {
    //   const metric = await this.prisma.cmsPerformanceMetric.create({
    //     data: CMSTestData.mockPerformanceMetric({
    //       value: 100 + i * 10,
    //       userId,
    //     }) as never,
    //   });
    //   metrics.push(metric);
    // }
    // return metrics;
    return [];
  }

  /**
   * Create test error logs
   * Note: Uncomment after Prisma client regenerates
   */
  async createTestErrors(_count = 5) {
    // Commented out until Prisma client is refreshed
    // const errors = [];
    // for (let i = 0; i < count; i++) {
    //   const error = await this.prisma.cmsErrorLog.create({
    //     data: {
    //       ...CMSTestData.mockErrorLog({}),
    //       message: `Test error ${i}`,
    //     } as never,
    //   });
    //   errors.push(error);
    // }
    // return errors;
    return [];
  }
}

// API testing helpers
export class CMSTestAPI {
  /**
   * Create mock NextAuth session
   */
  static mockSession(overrides?: Partial<{
    userId: string;
    role: string;
    email: string;
  }>) {
    return {
      user: {
        id: overrides?.userId || 'test-user-id',
        email: overrides?.email || 'test@example.com',
        name: 'Test User',
        role: overrides?.role || 'SUPER_ADMIN',
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  /**
   * Create mock request with auth
   */
  static mockRequest(options?: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
    session?: ReturnType<typeof CMSTestAPI.mockSession>;
  }) {
    const url = new URL('http://localhost:3000/api/test');
    if (options?.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return {
      method: options?.method || 'GET',
      url: url.toString(),
      json: async () => options?.body || {},
      session: options?.session,
    };
  }

  /**
   * Assert successful API response
   */
  static assertSuccess(response: { success: boolean; data?: unknown }) {
    if (!response.success) {
      throw new Error('Expected successful response');
    }
    return response.data;
  }

  /**
   * Assert error API response
   */
  static assertError(response: { success: boolean; error?: string }) {
    if (response.success) {
      throw new Error('Expected error response');
    }
    return response.error;
  }

  /**
   * Create paginated response
   */
  static paginatedResponse<T>(data: T[], page = 1, limit = 10) {
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = data.slice(start, end);

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }
}

// Performance testing helpers
export class CMSTestPerformance {
  /**
   * Measure execution time
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * Run benchmark
   */
  static async benchmark(
    name: string,
    fn: () => Promise<void>,
    iterations = 100
  ): Promise<{
    name: string;
    iterations: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await this.measureTime(fn);
      times.push(duration);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      name,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
    };
  }

  /**
   * Assert performance threshold
   */
  static assertPerformance(duration: number, maxDuration: number) {
    if (duration > maxDuration) {
      throw new Error(
        `Performance threshold exceeded: ${duration}ms > ${maxDuration}ms`
      );
    }
  }
}

// Export all utilities
export const cmsTestData = CMSTestData;
export const cmsTestAPI = CMSTestAPI;
export const cmsTestPerformance = CMSTestPerformance;
