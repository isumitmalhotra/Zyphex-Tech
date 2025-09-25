# Enhanced Content Types System

## Overview

The Enhanced Content Types System provides a flexible, dynamic way to create and manage different types of content throughout your application. This system allows administrators to:

- Create custom content types with dynamic field configurations
- Manage content items based on these types
- Render content dynamically on the frontend
- Use pre-built templates for common content types

## Architecture

### Database Models

#### ContentType
- **Purpose**: Defines the structure and fields for a content type
- **Key Fields**:
  - `name`: Unique identifier (e.g., "hero_section")
  - `label`: Display name (e.g., "Hero Section")
  - `fields`: JSON string containing field definitions
  - `settings`: JSON string with content type settings
  - `isSystem`: Whether it's a built-in system type
  - `isActive`: Whether the content type is active

#### DynamicContentItem
- **Purpose**: Stores actual content instances based on content types
- **Key Fields**:
  - `contentTypeId`: Reference to the content type
  - `title`: Content item title
  - `data`: JSON string containing the actual field data
  - `status`: Publication status (draft, published, archived)
  - `featured`: Whether the item is featured
  - `categories`, `tags`: For organization

#### DynamicContentSection
- **Purpose**: Manages content sections on pages
- **Key Fields**:
  - `contentTypeId`: Reference to the content type
  - `sectionKey`: Unique identifier for the section
  - `layoutSettings`: JSON string for layout configuration

### API Endpoints

#### Content Types Management
```
GET    /api/admin/content/content-types         - List all content types
POST   /api/admin/content/content-types         - Create new content type
GET    /api/admin/content/content-types/[id]    - Get specific content type
PUT    /api/admin/content/content-types/[id]    - Update content type
DELETE /api/admin/content/content-types/[id]    - Delete content type
```

#### Dynamic Content Items
```
GET    /api/admin/content/dynamic-items         - List dynamic content items
POST   /api/admin/content/dynamic-items         - Create new content item
GET    /api/admin/content/dynamic-items/[id]    - Get specific content item
PUT    /api/admin/content/dynamic-items/[id]    - Update content item
DELETE /api/admin/content/dynamic-items/[id]    - Delete content item
```

## Content Type Templates

The system includes several pre-built templates:

### 1. Hero Section
- **Purpose**: Main banner sections with headlines and CTAs
- **Fields**: headline, subtitle, backgroundImage, ctaText, ctaUrl
- **Usage**: Landing pages, main site headers

### 2. Feature Block
- **Purpose**: Feature showcases with icons and descriptions
- **Fields**: icon, title, description, image, learnMoreUrl
- **Usage**: Feature listings, service descriptions

### 3. Testimonial
- **Purpose**: Customer testimonials with ratings
- **Fields**: quote, authorName, authorTitle, company, authorImage, rating
- **Usage**: Social proof sections, review displays

### 4. Team Member
- **Purpose**: Team member profiles
- **Fields**: name, position, bio, photo, email, socialLinks
- **Usage**: About pages, team sections

### 5. FAQ Item
- **Purpose**: Frequently asked questions
- **Fields**: question, answer, category
- **Usage**: Help sections, support pages

### 6. Gallery Item
- **Purpose**: Image gallery entries
- **Fields**: image, title, caption, altText, photographer
- **Usage**: Portfolio sections, image galleries

### 7. Pricing Plan
- **Purpose**: Pricing plan displays
- **Fields**: name, price, currency, billingPeriod, features, highlighted, ctaText, ctaUrl
- **Usage**: Pricing pages, subscription sections

## Field Types

The system supports various field types:

- **text**: Single-line text input
- **textarea**: Multi-line text input
- **richtext**: WYSIWYG editor
- **image**: Image upload with preview
- **url**: URL input with validation
- **number**: Numeric input
- **boolean**: Toggle/checkbox
- **select**: Single selection dropdown
- **multiselect**: Multiple selection
- **date**: Date picker
- **json**: Raw JSON input for complex data

## Admin Interface

### Content Types Management
- **Location**: `/admin/content/content-types`
- **Features**:
  - Grid view of all content types
  - Template selection for new types
  - Drag-and-drop field editor
  - Real-time field configuration
  - Content type settings management

### Content Items Management
- **Location**: `/admin/content/dynamic-items`
- **Features**:
  - Dynamic form generation based on content type
  - Status management (draft, published, archived)
  - Category and tag organization
  - Featured content marking
  - Bulk operations

## Frontend Rendering

### DynamicContentRenderer Component

The `DynamicContentRenderer` component automatically renders content based on content type definitions:

```tsx
import DynamicContentRenderer from '@/components/dynamic-content-renderer'

// Render hero sections
<DynamicContentRenderer
  contentTypeNames={['hero_section']}
  renderMode="hero"
  maxItems={1}
  featured={true}
/>

// Render feature grid
<DynamicContentRenderer
  contentTypeNames={['feature_block']}
  renderMode="grid"
  maxItems={6}
  showMetadata={true}
/>

// Render testimonials slider
<DynamicContentRenderer
  contentTypeNames={['testimonial']}
  renderMode="slider"
  featured={true}
/>
```

### Render Modes

- **grid**: Responsive grid layout (default)
- **list**: Vertical list layout
- **hero**: Full-width hero display
- **slider**: Horizontal scrolling layout

## Usage Examples

### Creating a New Content Type

1. Navigate to `/admin/content/content-types`
2. Click "Create Content Type"
3. Choose a template or start from scratch
4. Configure fields using the drag-and-drop editor
5. Set content type settings (slug, publishing, etc.)
6. Save the content type

### Adding Content Items

1. Navigate to content items management
2. Select the content type
3. Fill in the dynamic form based on the content type fields
4. Set status, categories, and metadata
5. Publish the content

### Displaying Content on Frontend

```tsx
// In your page component
import DynamicContentRenderer from '@/components/dynamic-content-renderer'

export default function HomePage() {
  return (
    <div>
      {/* Hero section */}
      <DynamicContentRenderer
        contentTypeNames={['hero_section']}
        renderMode="hero"
        maxItems={1}
      />
      
      {/* Features grid */}
      <section className="py-16">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <DynamicContentRenderer
            contentTypeNames={['feature_block']}
            renderMode="grid"
            maxItems={6}
          />
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Testimonials</h2>
          <DynamicContentRenderer
            contentTypeNames={['testimonial']}
            renderMode="slider"
            featured={true}
          />
        </div>
      </section>
    </div>
  )
}
```

## Benefits

1. **Flexibility**: Create any type of content structure needed
2. **Reusability**: Content types can be reused across different pages
3. **Consistency**: Enforced structure ensures consistent content
4. **Scalability**: Easy to add new content types as needs grow
5. **User-Friendly**: Non-technical users can manage content easily
6. **Performance**: Type-safe rendering with efficient queries

## Development Notes

### Adding New Field Types

To add a new field type:

1. Update the `ContentField` type in `/types/content.ts`
2. Add rendering logic in the admin form component
3. Update the `DynamicContentRenderer` for display logic
4. Add validation rules if needed

### Extending Templates

To add new templates:

1. Add to `/lib/content-type-templates.ts`
2. Include field definitions and settings
3. Add specific rendering logic if needed
4. Update the template selector component

### Performance Considerations

- Content is cached at the API level
- Images are optimized using Next.js Image component
- Pagination is implemented for large content sets
- Database queries are optimized with proper indexing

## Security

- All content creation/editing requires admin authentication
- Input validation on both frontend and backend
- XSS protection for rich text content
- File upload validation for images
- SQL injection protection via Prisma ORM

This enhanced content types system provides a solid foundation for managing dynamic content while maintaining flexibility and ease of use.