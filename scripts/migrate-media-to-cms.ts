import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateMediaAssets() {
  console.log('🔄 Migrating MediaAsset to CmsMediaAsset...\n');

  try {
    // Get all MediaAsset records
    const mediaAssets = await prisma.mediaAsset.findMany();
    console.log(`📦 Found ${mediaAssets.length} media assets to migrate\n`);

    if (mediaAssets.length === 0) {
      console.log('⚠️  No media assets to migrate');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const asset of mediaAssets) {
      // Check if already migrated (by checking filename)
      const existing = await prisma.cmsMediaAsset.findFirst({
        where: {
          originalName: asset.originalName,
          filename: asset.filename,
        },
      });

      if (existing) {
        console.log(`⏭️  Already migrated: ${asset.filename}`);
        skipped++;
        continue;
      }

      // Determine asset type from mimeType
      let assetType = 'other';
      if (asset.mimeType.startsWith('image/')) assetType = 'image';
      else if (asset.mimeType.startsWith('video/')) assetType = 'video';
      else if (asset.mimeType.startsWith('audio/')) assetType = 'audio';
      else if (asset.mimeType.includes('pdf') || asset.mimeType.includes('document')) assetType = 'document';

      // Create CmsMediaAsset
      await prisma.cmsMediaAsset.create({
        data: {
          filename: asset.filename,
          originalName: asset.originalName,
          filePath: `/uploads/${asset.filename}`,  // Assuming local storage path
          fileUrl: asset.url,
          mimeType: asset.mimeType,
          fileSize: asset.size,
          assetType,
          altText: asset.alt,
          caption: asset.alt, // Use alt as caption if available
          width: null, // Could be extracted if needed
          height: null,
          uploadedBy: asset.uploadedBy || 'system',
          tags: [],
          categories: asset.category ? [asset.category] : [],
          processingStatus: 'completed',
          usageCount: 0,
        },
      });

      console.log(`✅ Migrated: ${asset.filename} (${assetType})`);
      migrated++;
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipped}`);
    console.log(`   📦 Total: ${mediaAssets.length}`);
    
    console.log(`\n✅ Media migration complete!`);
    console.log(`\nYou can now use the media library at:`);
    console.log(`  - /admin/cms/media`);
    console.log(`  - /super-admin/cms/media`);

  } catch (error) {
    console.error('❌ Error migrating media assets:', error);
    throw error;
  }
}

migrateMediaAssets()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
