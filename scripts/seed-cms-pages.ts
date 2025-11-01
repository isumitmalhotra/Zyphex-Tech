/**
 * Seed CMS Pages
 * Creates initial pages for Home, About, Services, Contact, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCMSPages() {
  console.log('🌱 Seeding CMS Pages...');

  try {
    // Create sample pages
    const pages = [
      {
        pageKey: 'home',
        pageTitle: 'Home',
        slug: '',
        pageType: 'landing',
        metaTitle: 'Zyphex Tech - Custom Software Development Services',
        metaDescription: 'Expert software development services. We build custom web applications, mobile apps, and enterprise solutions.',
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
      {
        pageKey: 'about',
        pageTitle: 'About Us',
        slug: 'about',
        pageType: 'standard',
        metaTitle: 'About Us | Zyphex Tech',
        metaDescription: 'Learn about Zyphex Tech, our team, mission, and values.',
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
      {
        pageKey: 'services',
        pageTitle: 'Services',
        slug: 'services',
        pageType: 'standard',
        metaTitle: 'Our Services | Zyphex Tech',
        metaDescription: 'Explore our comprehensive software development services including web apps, mobile apps, cloud solutions, and more.',
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
      {
        pageKey: 'portfolio',
        pageTitle: 'Portfolio',
        slug: 'portfolio',
        pageType: 'standard',
        metaTitle: 'Our Portfolio | Zyphex Tech',
        metaDescription: 'View our portfolio of successful projects and case studies.',
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
      {
        pageKey: 'contact',
        pageTitle: 'Contact',
        slug: 'contact',
        pageType: 'standard',
        metaTitle: 'Contact Us | Zyphex Tech',
        metaDescription: 'Get in touch with us for your software development needs.',
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
      {
        pageKey: 'updates',
        pageTitle: 'Updates',
        slug: 'updates',
        pageType: 'blog',
        metaTitle: 'Latest Updates | Zyphex Tech',
        metaDescription: 'Stay updated with our latest news, blog posts, and announcements.',
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
      {
        pageKey: 'careers',
        pageTitle: 'Careers',
        slug: 'careers',
        pageType: 'standard',
        metaTitle: 'Careers | Zyphex Tech',
        metaDescription: 'Join our team! Explore current job openings at Zyphex Tech.',
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
    ];

    for (const pageData of pages) {
      const existingPage = await prisma.cmsPage.findUnique({
        where: { pageKey: pageData.pageKey },
      });

      if (!existingPage) {
        const page = await prisma.cmsPage.create({
          data: pageData,
        });
        console.log(`✅ Created page: ${pageData.pageTitle} (${pageData.slug || '/'})`);

        // Create a hero section for each page
        await prisma.cmsPageSection.create({
          data: {
            pageId: page.id,
            sectionKey: 'hero',
            sectionType: 'hero',
            title: `Welcome to ${pageData.pageTitle}`,
            subtitle: 'Edit this section to customize your content',
            content: {
              heading: pageData.pageTitle,
              subheading: pageData.metaDescription || `Learn more about ${pageData.pageTitle}`,
              ctaText: 'Get Started',
              ctaLink: '/contact',
              backgroundImage: '/images/hero-bg.jpg',
            },
            order: 0,
            isVisible: true,
          },
        });

        console.log(`  ├─ Added hero section`);
      } else {
        console.log(`⏭️  Page already exists: ${pageData.pageTitle}`);
      }
    }

    console.log('\n✅ CMS Pages seeded successfully!');
    console.log('\nYou can now view and edit these pages in:');
    console.log('  - /admin/cms/pages');
    console.log('  - /super-admin/cms/pages\n');

  } catch (error) {
    console.error('❌ Error seeding CMS pages:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCMSPages()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
