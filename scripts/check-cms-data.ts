import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCmsData() {
  console.log('🔍 Checking CMS data...\n');

  try {
    // Check CmsPage
    const cmsPages = await prisma.cmsPage.findMany({
      take: 10,
      select: {
        id: true,
        pageKey: true,
        pageTitle: true,
        slug: true,
        status: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    console.log('📄 CmsPage table:');
    console.log(`   Found ${cmsPages.length} pages`);
    if (cmsPages.length > 0) {
      cmsPages.forEach(page => {
        console.log(`   - ${page.pageTitle} (${page.pageKey}) - ${page.status} - ${page._count.sections} sections`);
      });
    } else {
      console.log('   ⚠️  NO PAGES FOUND!');
    }

    console.log('\n📄 PageContent table:');
    const pageContents = await prisma.pageContent.findMany({
      take: 10,
      select: {
        id: true,
        pageKey: true,
        name: true,
        slug: true,
        status: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    console.log(`   Found ${pageContents.length} pages`);
    if (pageContents.length > 0) {
      pageContents.forEach(page => {
        console.log(`   - ${page.name} (${page.pageKey}) - ${page.status} - ${page._count.sections} sections`);
      });
    } else {
      console.log('   ⚠️  NO PAGES FOUND!');
    }

    console.log('\n🖼️  MediaAsset table:');
    const mediaAssets = await prisma.mediaAsset.findMany({
      take: 10,
      select: {
        id: true,
        filename: true,
        mimeType: true,
        url: true,
      },
    });

    console.log(`   Found ${mediaAssets.length} media assets`);
    if (mediaAssets.length > 0) {
      mediaAssets.forEach(asset => {
        console.log(`   - ${asset.filename} (${asset.mimeType})`);
      });
    } else {
      console.log('   ⚠️  NO MEDIA ASSETS FOUND!');
    }

    console.log('\n📝 CmsTemplate table:');
    const templates = await prisma.cmsTemplate.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        category: true,
        isActive: true,
      },
    });

    console.log(`   Found ${templates.length} templates`);
    if (templates.length > 0) {
      templates.forEach(template => {
        console.log(`   - ${template.name} (${template.category}) - ${template.isActive ? 'active' : 'inactive'}`);
      });
    } else {
      console.log('   ⚠️  NO TEMPLATES FOUND!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCmsData();
