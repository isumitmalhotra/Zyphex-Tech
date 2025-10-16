/**
 * Route Extractor for API Documentation
 * 
 * Extracts route metadata and generates markdown documentation.
 * Simplified version focused on documentation generation.
 */

import type { ZodSchema } from 'zod';

// ===========================
// Types & Interfaces
// ===========================

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Authentication requirement for a route
 */
export interface AuthRequirement {
  required: boolean;
  roles?: string[];
  description?: string;
}

/**
 * Rate limit information for a route
 */
export interface RateLimitInfo {
  enabled: boolean;
  multiplier?: {
    guest?: number;
    user?: number;
    admin?: number;
    super_admin?: number;
  };
  description?: string;
}

/**
 * Route parameter information
 */
export interface RouteParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  type?: string;
  example?: unknown;
}

/**
 * Request body information
 */
export interface RequestBodyInfo {
  description?: string;
  required: boolean;
  contentType?: string;
  schema?: ZodSchema | string;
}

/**
 * Response information
 */
export interface ResponseInfo {
  status: number;
  description: string;
  contentType?: string;
  schema?: ZodSchema | string;
}

/**
 * Complete route metadata
 */
export interface RouteMetadata {
  path: string;
  method: HttpMethod;
  summary: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  
  // Security
  auth?: AuthRequirement;
  rateLimit?: RateLimitInfo;
  
  // Request
  parameters?: RouteParameter[];
  requestBody?: RequestBodyInfo;
  
  // Response
  responses: ResponseInfo[];
  
  // Documentation
  deprecated?: boolean;
  externalDocs?: {
    description: string;
    url: string;
  };
}

/**
 * Route group for organizing routes
 */
export interface RouteGroup {
  name: string;
  description?: string;
  routes: RouteMetadata[];
}

// ===========================
// Route Extractor Class
// ===========================

export class RouteExtractor {
  private routes: Map<string, RouteMetadata[]> = new Map();
  private groups: Map<string, RouteGroup> = new Map();
  
  /**
   * Add a route to the extractor
   */
  addRoute(metadata: RouteMetadata): void {
    const key = metadata.path;
    const existing = this.routes.get(key) || [];
    existing.push(metadata);
    this.routes.set(key, existing);
  }
  
  /**
   * Add multiple routes at once
   */
  addRoutes(routes: RouteMetadata[]): void {
    routes.forEach(route => this.addRoute(route));
  }
  
  /**
   * Create a route group
   */
  createGroup(name: string, description?: string): void {
    this.groups.set(name, {
      name,
      description,
      routes: []
    });
  }
  
  /**
   * Add routes to a group
   */
  addToGroup(groupName: string, routes: RouteMetadata[]): void {
    const group = this.groups.get(groupName);
    if (!group) {
      this.createGroup(groupName);
    }
    const currentGroup = this.groups.get(groupName)!;
    currentGroup.routes.push(...routes);
  }
  
  /**
   * Get all routes
   */
  getRoutes(): RouteMetadata[] {
    const allRoutes: RouteMetadata[] = [];
    this.routes.forEach(routes => allRoutes.push(...routes));
    return allRoutes;
  }
  
  /**
   * Get routes by path
   */
  getRoutesByPath(path: string): RouteMetadata[] {
    return this.routes.get(path) || [];
  }
  
  /**
   * Get routes by tag
   */
  getRoutesByTag(tag: string): RouteMetadata[] {
    return this.getRoutes().filter(route => 
      route.tags?.includes(tag)
    );
  }
  
  /**
   * Get routes by method
   */
  getRoutesByMethod(method: HttpMethod): RouteMetadata[] {
    return this.getRoutes().filter(route => 
      route.method === method
    );
  }
  
  /**
   * Get all groups
   */
  getGroups(): RouteGroup[] {
    return Array.from(this.groups.values());
  }
  
  /**
   * Get group by name
   */
  getGroup(name: string): RouteGroup | undefined {
    return this.groups.get(name);
  }
  
  /**
   * Format rate limit description
   */
  private formatRateLimitDescription(rateLimit: RateLimitInfo): string {
    if (!rateLimit.multiplier) {
      return '**Rate Limiting**: Enabled';
    }
    
    const multipliers = Object.entries(rateLimit.multiplier)
      .map(([role, mult]) => {
        const displayRole = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${displayRole}: ${mult}x`;
      })
      .join(', ');
    
    return `**Rate Limiting**: ${multipliers}`;
  }
  
  /**
   * Generate markdown documentation
   */
  toMarkdown(): string {
    const lines: string[] = [];
    
    lines.push('# API Routes Documentation\n');
    lines.push('Auto-generated API documentation from route metadata.\n');
    lines.push(`**Total Routes**: ${this.getRoutes().length}\n`);
    lines.push(`**Last Generated**: ${new Date().toISOString()}\n`);
    lines.push('---\n');
    
    // Group routes by tag
    const routesByTag = new Map<string, RouteMetadata[]>();
    const untaggedRoutes: RouteMetadata[] = [];
    
    this.getRoutes().forEach(route => {
      if (route.tags && route.tags.length > 0) {
        route.tags.forEach(tag => {
          const existing = routesByTag.get(tag) || [];
          if (!existing.includes(route)) {
            existing.push(route);
          }
          routesByTag.set(tag, existing);
        });
      } else {
        untaggedRoutes.push(route);
      }
    });
    
    // Sort tags alphabetically
    const sortedTags = Array.from(routesByTag.keys()).sort();
    
    // Document tagged routes
    sortedTags.forEach(tag => {
      const routes = routesByTag.get(tag) || [];
      lines.push(`## ${tag}\n`);
      routes.forEach(route => {
        lines.push(this.routeToMarkdown(route));
      });
    });
    
    // Document untagged routes
    if (untaggedRoutes.length > 0) {
      lines.push('## Other Routes\n');
      untaggedRoutes.forEach(route => {
        lines.push(this.routeToMarkdown(route));
      });
    }
    
    return lines.join('\n');
  }
  
  /**
   * Convert a single route to markdown
   */
  private routeToMarkdown(route: RouteMetadata): string {
    const lines: string[] = [];
    
    // Title
    lines.push(`### ${route.method} ${route.path}\n`);
    
    // Summary
    lines.push(`**${route.summary}**\n`);
    
    // Description
    if (route.description) {
      lines.push(`${route.description}\n`);
    }
    
    // Deprecated
    if (route.deprecated) {
      lines.push('> ⚠️ **DEPRECATED**: This endpoint is deprecated and may be removed in future versions.\n');
    }
    
    // Authentication
    if (route.auth?.required) {
      let authLine = '**Authentication**: Required';
      if (route.auth.roles && route.auth.roles.length > 0) {
        authLine += ` (${route.auth.roles.join(', ')})`;
      }
      lines.push(authLine + '\n');
      if (route.auth.description) {
        lines.push(`${route.auth.description}\n`);
      }
    } else {
      lines.push('**Authentication**: Not required\n');
    }
    
    // Rate Limiting
    if (route.rateLimit?.enabled) {
      lines.push(`${this.formatRateLimitDescription(route.rateLimit)}\n`);
      if (route.rateLimit.description) {
        lines.push(`${route.rateLimit.description}\n`);
      }
    }
    
    // Parameters
    if (route.parameters && route.parameters.length > 0) {
      lines.push('**Parameters**:\n');
      route.parameters.forEach(param => {
        const required = param.required ? '(required)' : '(optional)';
        const type = param.type ? `\`${param.type}\`` : '';
        lines.push(`- \`${param.name}\` (${param.in}) ${required} ${type}: ${param.description || 'No description'}`);
        if (param.example !== undefined) {
          lines.push(` Example: \`${JSON.stringify(param.example)}\``);
        }
        lines.push('');
      });
    }
    
    // Request Body
    if (route.requestBody) {
      let requestLine = '**Request Body**:';
      if (route.requestBody.required) {
        requestLine += ' (required)';
      }
      lines.push(requestLine + '\n');
      if (route.requestBody.description) {
        lines.push(`${route.requestBody.description}\n`);
      }
      if (route.requestBody.contentType) {
        lines.push(`Content-Type: \`${route.requestBody.contentType}\`\n`);
      }
    }
    
    // Responses
    if (route.responses.length > 0) {
      lines.push('**Responses**:\n');
      route.responses.forEach(response => {
        lines.push(`- \`${response.status}\`: ${response.description}`);
        if (response.contentType) {
          lines.push(` (${response.contentType})`);
        }
        lines.push('');
      });
    }
    
    // External Docs
    if (route.externalDocs) {
      lines.push(`**More Info**: [${route.externalDocs.description}](${route.externalDocs.url})\n`);
    }
    
    lines.push('---\n');
    
    return lines.join('\n');
  }
  
  /**
   * Clear all routes and groups
   */
  clear(): void {
    this.routes.clear();
    this.groups.clear();
  }
}

// ===========================
// Helper Functions
// ===========================

/**
 * Create a route metadata builder for fluent API
 */
export class RouteBuilder {
  private metadata: Partial<RouteMetadata> = {
    responses: []
  };
  
  constructor(path: string, method: HttpMethod) {
    this.metadata.path = path;
    this.metadata.method = method;
  }
  
  summary(summary: string): this {
    this.metadata.summary = summary;
    return this;
  }
  
  description(description: string): this {
    this.metadata.description = description;
    return this;
  }
  
  tags(...tags: string[]): this {
    this.metadata.tags = tags;
    return this;
  }
  
  operationId(id: string): this {
    this.metadata.operationId = id;
    return this;
  }
  
  auth(required: boolean, roles?: string[]): this {
    this.metadata.auth = { required, roles };
    return this;
  }
  
  rateLimit(enabled: boolean, multiplier?: RateLimitInfo['multiplier']): this {
    this.metadata.rateLimit = { enabled, multiplier };
    return this;
  }
  
  parameter(param: RouteParameter): this {
    if (!this.metadata.parameters) {
      this.metadata.parameters = [];
    }
    this.metadata.parameters.push(param);
    return this;
  }
  
  requestBody(body: RequestBodyInfo): this {
    this.metadata.requestBody = body;
    return this;
  }
  
  response(response: ResponseInfo): this {
    this.metadata.responses!.push(response);
    return this;
  }
  
  deprecated(deprecated: boolean = true): this {
    this.metadata.deprecated = deprecated;
    return this;
  }
  
  externalDocs(description: string, url: string): this {
    this.metadata.externalDocs = { description, url };
    return this;
  }
  
  build(): RouteMetadata {
    if (!this.metadata.summary) {
      throw new Error('Route must have a summary');
    }
    if (!this.metadata.responses || this.metadata.responses.length === 0) {
      throw new Error('Route must have at least one response');
    }
    return this.metadata as RouteMetadata;
  }
}

/**
 * Create a new route builder
 */
export function route(path: string, method: HttpMethod): RouteBuilder {
  return new RouteBuilder(path, method);
}

/**
 * Create a route extractor instance
 */
export function createRouteExtractor(): RouteExtractor {
  return new RouteExtractor();
}

// Default export
const routeExtractorModule = {
  RouteExtractor,
  RouteBuilder,
  route,
  createRouteExtractor
};

export default routeExtractorModule;
