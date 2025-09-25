# Content Management System (CMS) Module

A robust, production-ready Content Management System built with Next.js 14, TypeScript, and Prisma. This CMS provides dynamic content management capabilities with a modern admin interface.

## 🚀 Features

### Core Features
- **Dynamic Content Types**: Create custom content types with flexible field definitions
- **Rich Content Editor**: Support for text, rich text, images, files, and custom fields
- **Media Management**: Advanced file upload with image optimization and thumbnail generation
- **Bulk Operations**: Efficiently manage multiple content items simultaneously
- **Content Versioning**: Track changes and maintain content history
- **Role-Based Access Control**: Secure admin access with user permissions
- **Search & Filtering**: Advanced content discovery and organization
- **API-First Architecture**: RESTful APIs for all CMS operations

### Advanced Features
- **Responsive Admin Interface**: Mobile-friendly admin dashboard
- **Activity Logging**: Comprehensive audit trail for all CMS actions
- **Performance Optimization**: Caching, pagination, and query optimization
- **Image Processing**: Automatic image optimization and multiple format support
- **Type Safety**: Full TypeScript integration with comprehensive type definitions
- **Extensible Architecture**: Modular design for easy customization and extension

## 📁 Project Structure

```
cms-module/
├── app/
│   ├── api/admin/cms/          # CMS API endpoints
│   │   ├── content/            # Content management APIs
│   │   ├── content-types/      # Content type management
│   │   ├── media/              # Media management APIs
│   │   └── activity/           # Activity logging
│   └── admin/content/          # Admin UI pages
├── components/cms/             # React components
├── hooks/                      # Custom React hooks
├── lib/                        # Utility libraries
├── types/                      # TypeScript definitions
├── docs/                       # Documentation
└── __tests__/                  # Test utilities
```

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Prisma ORM (SQLite, PostgreSQL, MySQL)
- **Authentication**: NextAuth.js
- **UI Components**: Custom React components with Tailwind CSS
- **Icons**: Lucide React
- **Validation**: Zod
- **Image Processing**: Sharp
- **Testing**: Jest & React Testing Library

## 📋 Prerequisites

- Node.js 18+
- Database (SQLite for dev, PostgreSQL/MySQL for production)
- Next.js 14+
- TypeScript

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or copy the CMS module files to your Next.js project
# Ensure all required files are in place as shown in the project structure
```

### 2. Environment Setup

Create `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev --name init-cms
npx prisma generate
```

### 4. Create Admin User

```bash
# Run the admin user creation script
npx tsx scripts/create-admin-user.ts
```

### 5. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000/admin/content` to access the CMS.

## 📖 Usage Guide

### Creating Content Types

1. Navigate to the admin dashboard
2. Go to "Content Types" section
3. Click "Create Content Type"
4. Define fields:
   - **Text**: Single-line text input
   - **Textarea**: Multi-line text input
   - **Rich Text**: WYSIWYG editor
   - **Number**: Numeric input
   - **Boolean**: Checkbox
   - **Date**: Date picker
   - **Select**: Dropdown selection
   - **File**: File upload
   - **Image**: Image upload with optimization

### Managing Content

1. Select a content type
2. Click "Create Content"
3. Fill in the form fields
4. Save as draft or publish immediately
5. Use bulk operations for managing multiple items

### Media Management

- Upload images and files through the media section
- Automatic image optimization and thumbnail generation
- Support for multiple formats (JPEG, PNG, WebP, AVIF)
- Metadata management and alt text

## 🔧 API Reference

### Content API

```typescript
// Get all content
GET /api/admin/cms/content
Query: page, pageSize, contentType, status, search

// Create content
POST /api/admin/cms/content
Body: { title, slug, contentTypeId, status, fields }

// Update content
PUT /api/admin/cms/content/[id]
Body: { title, slug, status, fields }

// Delete content
DELETE /api/admin/cms/content/[id]

// Bulk operations
POST /api/admin/cms/content/bulk
Body: { action, ids, status? }
```

### Content Types API

```typescript
// Get all content types
GET /api/admin/cms/content-types

// Create content type
POST /api/admin/cms/content-types
Body: { name, slug, fields }

// Update content type
PUT /api/admin/cms/content-types/[id]
Body: { name, fields }

// Delete content type
DELETE /api/admin/cms/content-types/[id]
```

### Media API

```typescript
// Get all media
GET /api/admin/cms/media
Query: page, pageSize, type

// Upload media
POST /api/admin/cms/media
Body: FormData with file

// Update media
PUT /api/admin/cms/media/[id]
Body: { alt, caption, metadata }

// Delete media
DELETE /api/admin/cms/media/[id]
```

## 🎨 Customization

### Adding Custom Field Types

1. Extend the field type definitions in `types/cms.ts`
2. Add validation in `lib/cms-validation.ts`
3. Create UI components for the field type
4. Update the form renderer

### Custom Validation

```typescript
// lib/custom-validation.ts
import { z } from 'zod'

export const customContentSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  // Add custom validation rules
})
```

### Styling Customization

The CMS uses Tailwind CSS classes. Customize the appearance by:

1. Modifying component styles
2. Creating custom CSS classes
3. Using CSS-in-JS solutions
4. Updating the Tailwind configuration

## 🧪 Testing

### Setup Testing Environment

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Examples

```typescript
// API endpoint test
import { GET } from '@/app/api/admin/cms/content/route'

test('should return paginated content', async () => {
  const request = new NextRequest('http://localhost/api/admin/cms/content')
  const response = await GET(request)
  const data = await response.json()
  
  expect(data.success).toBe(true)
  expect(data.data).toHaveProperty('data')
})
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

```env
# Production environment
DATABASE_URL="postgresql://user:pass@host:5432/cms_db"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://yourdomain.com"
REDIS_URL="redis://localhost:6379"
```

### Deploy to Vercel

1. Connect your repository to Vercel
2. Set environment variables in dashboard
3. Deploy automatically

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance

### Database Optimization

- Proper indexing on frequently queried fields
- Query optimization with Prisma
- Connection pooling for production

### Caching Strategy

- Redis for session and content caching
- Next.js built-in caching
- CDN for media assets

### Image Optimization

- Automatic format conversion (WebP, AVIF)
- Multiple thumbnail sizes
- Lazy loading implementation

## 🔒 Security

### Access Control

- Role-based permissions (USER, ADMIN, SUPER_ADMIN)
- Session-based authentication
- API route protection

### Data Validation

- Zod schema validation
- Input sanitization
- XSS protection

### File Upload Security

- File type validation
- Size limits
- Secure storage paths
- Malware scanning (recommended)

## 🐛 Troubleshooting

### Common Issues

**Database Connection**
```bash
# Check connection
npx prisma db pull
```

**Migration Issues**
```bash
# Reset database (development only)
npx prisma migrate reset
```

**Permission Errors**
- Verify user roles in database
- Check authentication middleware
- Validate session configuration

## 📚 Documentation

- [Setup Guide](./docs/CMS_SETUP_GUIDE.md) - Complete setup instructions
- [Testing Guide](./docs/CMS_TESTING_GUIDE.md) - Testing strategies and examples
- [API Documentation](./docs/API_REFERENCE.md) - Detailed API reference
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This CMS module is part of the ZyphexTech platform. All rights reserved.

## 🆘 Support

- Create an issue for bug reports
- Join discussions for feature requests
- Check documentation for common solutions
- Contact support for enterprise needs

## 🗺 Roadmap

### Version 1.1
- [ ] Content scheduling
- [ ] Advanced permissions
- [ ] Workflow management
- [ ] Content templates

### Version 1.2
- [ ] Multi-language support
- [ ] Advanced search
- [ ] Content relationships
- [ ] API versioning

### Version 2.0
- [ ] GraphQL API
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Plugin system

---

**Built with ❤️ for modern web applications**

This CMS module provides a solid foundation for content management needs while maintaining flexibility for custom requirements. The modular architecture ensures easy maintenance and extensibility for future enhancements.