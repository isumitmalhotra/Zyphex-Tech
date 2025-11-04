import { prisma } from '../lib/prisma'

async function useTemporaryPlaceholders() {
  console.log('🖼️  Setting temporary professional placeholder images...\n')

  try {
    const teamMemberType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    })

    if (!teamMemberType) {
      throw new Error('team_member content type not found')
    }

    // Update Sumit Malhotra - Professional male placeholder
    const sumit = await prisma.dynamicContentItem.findFirst({
      where: {
        contentTypeId: teamMemberType.id,
        slug: 'sumit-malhotra'
      }
    })

    if (sumit) {
      const sumitData = JSON.parse(sumit.data)
      await prisma.dynamicContentItem.update({
        where: { id: sumit.id },
        data: {
          data: JSON.stringify({
            ...sumitData,
            // Professional business headshot placeholder (male)
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80'
          })
        }
      })
      console.log('✅ Updated Sumit Malhotra with placeholder image')
    }

    // Update Ishaan Garg - Professional male placeholder
    const ishaan = await prisma.dynamicContentItem.findFirst({
      where: {
        contentTypeId: teamMemberType.id,
        slug: 'ishaan-garg'
      }
    })

    if (ishaan) {
      const ishaanData = JSON.parse(ishaan.data)
      await prisma.dynamicContentItem.update({
        where: { id: ishaan.id },
        data: {
          data: JSON.stringify({
            ...ishaanData,
            // Professional business headshot placeholder (male)
            imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&q=80'
          })
        }
      })
      console.log('✅ Updated Ishaan Garg with placeholder image')
    }

    console.log('\n🎉 Temporary placeholders set successfully!')
    console.log('\n📝 These are professional placeholder images from Unsplash')
    console.log('Replace them with actual photos when ready using one of these methods:\n')
    console.log('Option 1: Upload to public/team/ folder and run update-team-images-local.ts')
    console.log('Option 2: Use imgbb.com or imgur.com and update the imageUrl in database')
    console.log('Option 3: Upload to your VPS in /var/www/zyphex-tech/public/team/')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

useTemporaryPlaceholders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
