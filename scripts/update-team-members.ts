import { prisma } from '../lib/prisma'

async function main() {
  console.log('🚀 Starting team members update...')

  try {
    // First, get or create the team_member content type
    console.log('📋 Checking team_member content type...')
    let teamMemberType = await prisma.contentType.findFirst({
      where: { name: 'team_member' }
    })

    if (!teamMemberType) {
      console.log('Creating team_member content type...')
      teamMemberType = await prisma.contentType.create({
        data: {
          name: 'team_member',
          label: 'Team Member',
          description: 'Team member profiles',
          icon: 'Users',
          fields: JSON.stringify([
            { name: 'role', type: 'text', label: 'Role', required: true },
            { name: 'bio', type: 'textarea', label: 'Biography', required: true },
            { name: 'imageUrl', type: 'text', label: 'Image URL', required: true },
            { name: 'specialties', type: 'array', label: 'Specialties', required: false },
            { name: 'order', type: 'number', label: 'Display Order', required: false }
          ]),
          settings: JSON.stringify({})
        }
      })
    }
    console.log('✅ Content type ready:', teamMemberType.name)

    // Delete all existing team members
    console.log('🗑️  Deleting existing team members...')
    await prisma.dynamicContentItem.deleteMany({
      where: {
        contentTypeId: teamMemberType.id
      }
    })
    console.log('✅ Existing team members deleted')

    // Create new team members
    console.log('👥 Creating new team members...')

    // 1. Sumit Malhotra - Co-Founder & CTO
    const sumit = await prisma.dynamicContentItem.create({
      data: {
        contentTypeId: teamMemberType.id,
        title: 'Sumit Malhotra',
        slug: 'sumit-malhotra',
        status: 'published',
        featured: true,
        publishedAt: new Date(),
        order: 1,
        data: JSON.stringify({
          role: 'Co-Founder & CTO',
          bio: 'Innovative technology architect with 3+ years of experience in developing and architecting industry-grade solutions. Specializes in building scalable systems and leading technical teams to deliver cutting-edge products that drive business growth.',
          imageUrl: 'https://drive.google.com/uc?export=view&id=14k-VnRnPmcJg5R9nGdeFPqHzCy4W55rw',
          specialties: ['Solution Architecture', 'System Design', 'Technical Leadership'],
          order: 1
        })
      }
    })
    console.log('✅ Created:', sumit.title)

    // 2. Ishaan Garg - Co-Founder & CEO
    const ishaan = await prisma.dynamicContentItem.create({
      data: {
        contentTypeId: teamMemberType.id,
        title: 'Ishaan Garg',
        slug: 'ishaan-garg',
        status: 'published',
        featured: true,
        publishedAt: new Date(),
        order: 2,
        data: JSON.stringify({
          role: 'Co-Founder & CEO',
          bio: 'Strategic business leader with 3+ years of experience in driving organizational growth and executing business strategies. Passionate about building high-performing teams and fostering partnerships that create lasting value in the technology landscape.',
          imageUrl: 'https://drive.google.com/uc?export=view&id=1s7Q4Ipx7YfijD1on0mqCm1dXROHD2RqF',
          specialties: ['Business Strategy', 'Client Relations', 'Strategic Growth'],
          order: 2
        })
      }
    })
    console.log('✅ Created:', ishaan.title)

    // 3. Senior Development Team - Team Card
    const devTeam = await prisma.dynamicContentItem.create({
      data: {
        contentTypeId: teamMemberType.id,
        title: 'Our Senior Development Team',
        slug: 'senior-development-team',
        status: 'published',
        featured: true,
        publishedAt: new Date(),
        order: 3,
        data: JSON.stringify({
          role: 'Expert Engineering Team',
          bio: 'Our seasoned team of senior developers brings deep expertise across Cloud Architecture, Artificial Intelligence, Business Intelligence, Cybersecurity, and cutting-edge technologies. With proven track records in enterprise solutions, they drive innovation and excellence in every project.',
          imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80',
          specialties: ['Cloud & DevOps', 'AI & Machine Learning', 'Business Intelligence', 'Cybersecurity', 'Enterprise Solutions'],
          order: 3
        })
      }
    })
    console.log('✅ Created:', devTeam.title)

    console.log('\n🎉 Team members update completed successfully!')
    console.log('📊 Summary:')
    console.log('  - Sumit Malhotra (Co-Founder & CTO)')
    console.log('  - Ishaan Garg (Co-Founder & CEO)')
    console.log('  - Senior Development Team')

  } catch (error) {
    console.error('❌ Error updating team members:', error)
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
