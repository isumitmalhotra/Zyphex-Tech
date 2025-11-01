import { getItemsByContentType } from '@/lib/content'

async function testTeamFetch() {
  console.log('Testing team member fetch...\n')
  
  try {
    const teamMembers = await getItemsByContentType('team_member', {
      limit: 10
    })
    
    console.log(`✅ Success! Found ${teamMembers.length} team members:\n`)
    
    teamMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.title}`)
      console.log(`   - Status: ${member.status}`)
      console.log(`   - Featured: ${member.featured}`)
      console.log(`   - Has data: ${Object.keys(member.data).length} fields`)
      console.log(`   - Image URL: ${member.data.imageUrl || 'missing'}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Error fetching team members:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack:', error.stack)
    }
  }
}

testTeamFetch()
