import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Basic Landing Page',
    description: 'A simple landing page template with hero, features, and CTA sections',
    category: 'landing',
    thumbnailUrl: '/templates/basic-landing.jpg',
    isActive: true,
    isSystem: false,
    templateStructure: {
      sections: [
        { type: 'hero', order: 1, required: true },
        { type: 'features', order: 2, required: false },
        { type: 'cta', order: 3, required: false },
      ],
    },
    defaultContent: {
      hero: {
        title: 'Welcome to Your Website',
        subtitle: 'Build something amazing',
        buttonText: 'Get Started',
        buttonLink: '/contact',
      },
    },
    order: 1,
  },
  {
    name: 'Blog Post',
    description: 'Standard blog post template with header, content, and related posts',
    category: 'blog',
    thumbnailUrl: '/templates/blog-post.jpg',
    isActive: true,
    isSystem: false,
    templateStructure: {
      sections: [
        { type: 'header', order: 1, required: true },
        { type: 'content', order: 2, required: true },
        { type: 'related', order: 3, required: false },
      ],
    },
    defaultContent: {
      header: {
        showAuthor: true,
        showDate: true,
        showReadTime: true,
      },
    },
    order: 2,
  },
  {
    name: 'Portfolio Showcase',
    description: 'Display your work with project grid and case studies',
    category: 'portfolio',
    thumbnailUrl: '/templates/portfolio-showcase.jpg',
    isActive: true,
    isSystem: false,
    templateStructure: {
      sections: [
        { type: 'hero', order: 1, required: true },
        { type: 'portfolio-grid', order: 2, required: true },
        { type: 'testimonials', order: 3, required: false },
        { type: 'cta', order: 4, required: false },
      ],
    },
    defaultContent: {
      portfolioGrid: {
        columns: 3,
        showFilters: true,
        showPagination: true,
      },
    },
    order: 3,
  },
  {
    name: 'Standard Content Page',
    description: 'Flexible content page with text, images, and media',
    category: 'general',
    thumbnailUrl: '/templates/standard-content.jpg',
    isActive: true,
    isSystem: false,
    templateStructure: {
      sections: [
        { type: 'page-header', order: 1, required: true },
        { type: 'rich-content', order: 2, required: true },
        { type: 'image-gallery', order: 3, required: false },
      ],
    },
    defaultContent: {
      pageHeader: {
        showBreadcrumbs: true,
        showLastUpdated: false,
      },
    },
    order: 4,
  },
  {
    name: 'Contact Page',
    description: 'Contact form with location and contact information',
    category: 'general',
    thumbnailUrl: '/templates/contact-page.jpg',
    isActive: true,
    isSystem: false,
    templateStructure: {
      sections: [
        { type: 'page-header', order: 1, required: true },
        { type: 'contact-form', order: 2, required: true },
        { type: 'contact-info', order: 3, required: false },
        { type: 'map', order: 4, required: false },
      ],
    },
    defaultContent: {
      contactForm: {
        fields: ['name', 'email', 'subject', 'message'],
        showPrivacyConsent: true,
      },
    },
    order: 5,
  },
  {
    name: 'Services Page',
    description: 'Showcase your services with cards and pricing',
    category: 'marketing',
    thumbnailUrl: '/templates/services-page.jpg',
    isActive: true,
    isSystem: false,
    templateStructure: {
      sections: [
        { type: 'hero', order: 1, required: true },
        { type: 'services-grid', order: 2, required: true },
        { type: 'pricing', order: 3, required: false },
        { type: 'faq', order: 4, required: false },
        { type: 'cta', order: 5, required: false },
      ],
    },
    defaultContent: {
      servicesGrid: {
        columns: 3,
        showIcons: true,
        showPricing: false,
      },
    },
    order: 6,
  },
];

async function seedTemplates() {
  console.log('🌱 Seeding CMS Templates...\n');

  for (const template of templates) {
    // Check if template already exists
    const existing = await prisma.cmsTemplate.findFirst({
      where: { name: template.name },
    });

    if (existing) {
      console.log(`⏭️  Template already exists: ${template.name}`);
      continue;
    }

    // Create template
    await prisma.cmsTemplate.create({
      data: template,
    });

    console.log(`✅ Created template: ${template.name}`);
  }

  console.log(`\n✅ CMS Templates seeded successfully!`);
  console.log(`\nYou can now view and use these templates in:`);
  console.log(`  - /admin/cms/templates`);
  console.log(`  - /super-admin/cms/templates`);
}

seedTemplates()
  .catch((error) => {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
