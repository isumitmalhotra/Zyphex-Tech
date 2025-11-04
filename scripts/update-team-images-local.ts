import { prisma } from '../lib/prisma'

async function updateTeamImages() {
  console.log('🖼️  Updating team member images to use local paths...\n')

  try {
    const teamMemberType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    })

    if (!teamMemberType) {
      throw new Error('team_member content type not found')
    }

    // Update Sumit Malhotra
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
            imageUrl: '/team/sumit-malhotra.jpg'
          })
        }
      })
      console.log('✅ Updated Sumit Malhotra image to /team/sumit-malhotra.jpg')
    }

    // Update Ishaan Garg
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
            imageUrl: '/team/ishaan-garg.jpg'
          })
        }
      })
      console.log('✅ Updated Ishaan Garg image to /team/ishaan-garg.jpg')
    }

    console.log('\n🎉 Team images updated successfully!')
    console.log('\n📝 Images are now served from:')
    console.log('   - http://localhost:3000/team/sumit-malhotra.jpg')
    console.log('   - http://localhost:3000/team/ishaan-garg.jpg')
    console.log('\n🚀 To deploy to production VPS:')
    console.log('   1. git add public/team/')
    console.log('   2. git commit -m "Add team member photos"')
    console.log('   3. git push origin main')
    console.log('\n   Images will be automatically deployed to your VPS!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

updateTeamImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
