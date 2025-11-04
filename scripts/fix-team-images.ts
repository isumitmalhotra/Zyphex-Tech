import { prisma } from '../lib/prisma'

async function main() {
  console.log('🖼️  Fixing team member images...')

  try {
    // Get the team_member content type
    const teamMemberType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    })

    if (!teamMemberType) {
      throw new Error('team_member content type not found')
    }

    // Get all team members
    const teamMembers = await prisma.dynamicContentItem.findMany({
      where: { contentTypeId: teamMemberType.id }
    })

    console.log(`Found ${teamMembers.length} team members`)

    for (const member of teamMembers) {
      const data = JSON.parse(member.data)
      let needsUpdate = false
      let newImageUrl = data.imageUrl

      // Fix Google Drive URLs
      if (data.imageUrl && data.imageUrl.includes('drive.google.com/file/d/')) {
        const match = data.imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
        if (match) {
          const fileId = match[1]
          newImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`
          needsUpdate = true
          console.log(`📝 Updating ${member.title}: ${data.imageUrl} -> ${newImageUrl}`)
        }
      }

      if (needsUpdate) {
        await prisma.dynamicContentItem.update({
          where: { id: member.id },
          data: {
            data: JSON.stringify({
              ...data,
              imageUrl: newImageUrl
            })
          }
        })
        console.log(`✅ Updated ${member.title}`)
      }
    }

    console.log('\n🎉 Image URLs fixed successfully!')

  } catch (error) {
    console.error('❌ Error fixing images:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
