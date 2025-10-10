# Messaging System - Quick Start Guide (5 Minutes)

## 🚀 Test the System Right Now

### Step 1: Start Development Server
```powershell
cd C:\Projects\Zyphex-Tech
npm run dev
```

### Step 2: Test APIs in Browser Console

Open your browser to `http://localhost:3000` and log in. Then open the browser console (F12) and run:

#### Test 1: Get Your Channels
```javascript
fetch('/api/messaging/channels')
  .then(r => r.json())
  .then(data => {
    console.log('📁 Your Channels:', data.channels)
    console.log('📊 Total:', data.totalCount)
  })
```

#### Test 2: Get Available Users (Grouped)
```javascript
fetch('/api/messaging/users?grouped=true')
  .then(r => r.json())
  .then(data => {
    console.log('👥 Grouped Users:', data.grouped)
    console.log('👨‍💼 Admins:', data.grouped.admins.length)
    console.log('👨‍💻 Team Members:', data.grouped.teamMembers.length)
    console.log('👤 Clients:', data.grouped.clients.length)
  })
```

#### Test 3: Create a DM Channel
```javascript
// Replace USER_ID with an actual user ID from Test 2
fetch('/api/messaging/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test DM',
    type: 'DIRECT',
    memberIds: ['USER_ID_HERE']
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('💬 DM Channel:', data.channel)
    console.log('🆕 Was it new?', !data.existing)
    // Save this channel ID for next test
    window.testChannelId = data.channel.id
  })
```

#### Test 4: Send a Message
```javascript
// Use the channel ID from Test 3
fetch('/api/messaging/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Hello! This is a test message from the new messaging system! 🎉',
    channelId: window.testChannelId
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('✉️ Message Sent:', data.message)
  })
```

#### Test 5: Get Channel Messages
```javascript
fetch(`/api/messaging/channels/${window.testChannelId}`)
  .then(r => r.json())
  .then(data => {
    console.log('📨 Channel Info:', data.channel)
    console.log('💬 Messages:', data.messages)
    console.log('📊 Message Count:', data.messages.length)
  })
```

#### Test 6: Search Everything
```javascript
fetch('/api/messaging/search?q=test')
  .then(r => r.json())
  .then(data => {
    console.log('🔍 Search Results:', data.results)
    console.log('📊 Counts:', data.counts)
  })
```

### Step 3: Verify Role-Based Access

#### As a CLIENT/USER:
```javascript
// You should see:
// ✅ Admins in user list
// ✅ Team members on your projects
// ❌ Team members from other projects
// ❌ Other clients

fetch('/api/messaging/users?grouped=true')
  .then(r => r.json())
  .then(data => console.log('CLIENT View:', data.grouped))
```

#### As a TEAM_MEMBER:
```javascript
// You should see:
// ✅ All internal team members
// ✅ Clients ONLY on your projects
// ❌ Clients from other projects

fetch('/api/messaging/users?grouped=true')
  .then(r => r.json())
  .then(data => console.log('TEAM_MEMBER View:', data.grouped))
```

#### As an ADMIN:
```javascript
// You should see:
// ✅ Everyone (full access)

fetch('/api/messaging/users?grouped=true')
  .then(r => r.json())
  .then(data => console.log('ADMIN View:', data.grouped))
```

## 🧪 Quick Testing Checklist

Copy-paste this entire block into your browser console:

```javascript
// Complete Test Suite
async function testMessagingSystem() {
  console.log('🧪 Starting Messaging System Tests...\n')
  
  // Test 1: Get Channels
  console.log('1️⃣ Testing GET Channels...')
  const channelsRes = await fetch('/api/messaging/channels')
  const channelsData = await channelsRes.json()
  console.log(`✅ Found ${channelsData.totalCount} channels`)
  
  // Test 2: Get Users
  console.log('\n2️⃣ Testing GET Users (Grouped)...')
  const usersRes = await fetch('/api/messaging/users?grouped=true')
  const usersData = await usersRes.json()
  console.log(`✅ Admins: ${usersData.grouped.admins.length}`)
  console.log(`✅ Team Members: ${usersData.grouped.teamMembers.length}`)
  console.log(`✅ Clients: ${usersData.grouped.clients.length}`)
  
  // Test 3: Create DM (if users available)
  if (usersData.totalCount > 0) {
    console.log('\n3️⃣ Testing Create DM Channel...')
    const firstUser = [...usersData.grouped.admins, ...usersData.grouped.teamMembers][0]
    if (firstUser) {
      const dmRes = await fetch('/api/messaging/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `DM Test`,
          type: 'DIRECT',
          memberIds: [firstUser.id]
        })
      })
      const dmData = await dmRes.json()
      console.log(`✅ DM Channel ${dmData.existing ? 'found' : 'created'}: ${dmData.channel.id}`)
      
      // Test 4: Send Message
      console.log('\n4️⃣ Testing Send Message...')
      const msgRes = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Test message sent at ${new Date().toLocaleTimeString()}`,
          channelId: dmData.channel.id
        })
      })
      const msgData = await msgRes.json()
      console.log(`✅ Message sent: ${msgData.message.id}`)
      
      // Test 5: Get Channel Messages
      console.log('\n5️⃣ Testing GET Channel Messages...')
      const channelMsgRes = await fetch(`/api/messaging/channels/${dmData.channel.id}`)
      const channelMsgData = await channelMsgRes.json()
      console.log(`✅ Found ${channelMsgData.messages.length} messages in channel`)
    }
  }
  
  // Test 6: Search
  console.log('\n6️⃣ Testing Search...')
  const searchRes = await fetch('/api/messaging/search?q=test')
  const searchData = await searchRes.json()
  console.log(`✅ Search found ${searchData.totalResults} results`)
  console.log(`   - Messages: ${searchData.counts.messages}`)
  console.log(`   - Channels: ${searchData.counts.channels}`)
  console.log(`   - Users: ${searchData.counts.users}`)
  
  console.log('\n🎉 All tests completed!')
  console.log('📊 Summary:', {
    channels: channelsData.totalCount,
    users: usersData.totalCount,
    searchResults: searchData.totalResults
  })
}

// Run the tests
testMessagingSystem()
```

## 🎯 Expected Results by Role

### CLIENT/USER Should See:
```javascript
{
  grouped: {
    admins: [2-3 users],      // ✅ Can see
    projectManagers: [0-1],    // ✅ If on shared project
    teamMembers: [0-3],        // ✅ If on shared project
    clients: []                // ❌ Cannot see other clients
  }
}
```

### TEAM_MEMBER Should See:
```javascript
{
  grouped: {
    admins: [2-3 users],          // ✅ Can see all
    projectManagers: [1-5 users], // ✅ Can see all
    teamMembers: [3-10 users],    // ✅ Can see all
    clients: [0-2 users]          // ✅ Only on their projects
  }
}
```

### PROJECT_MANAGER Should See:
```javascript
{
  grouped: {
    admins: [2-3 users],          // ✅ Can see all
    projectManagers: [1-5 users], // ✅ Can see all
    teamMembers: [5-15 users],    // ✅ Can see all
    clients: [5-20 users]         // ✅ Can see ALL clients
  }
}
```

### ADMIN/SUPER_ADMIN Should See:
```javascript
{
  grouped: {
    admins: [2-3 users],          // ✅ All
    projectManagers: [1-5 users], // ✅ All
    teamMembers: [5-15 users],    // ✅ All
    clients: [10-50 users]        // ✅ All
  }
}
```

## 🔍 Verify Access Control

### Test CLIENT Restrictions:
```javascript
// Log in as a CLIENT user
// Try to get users
fetch('/api/messaging/users?grouped=true')
  .then(r => r.json())
  .then(data => {
    const clients = data.grouped.clients
    console.log('CLIENT Access Test:')
    console.log('❌ Should NOT see other clients:', clients.length === 0)
    console.log('✅ Should see admins:', data.grouped.admins.length > 0)
  })
```

### Test TEAM_MEMBER Restrictions:
```javascript
// Log in as a TEAM_MEMBER
// Try to get users
fetch('/api/messaging/users?grouped=true')
  .then(r => r.json())
  .then(data => {
    console.log('TEAM_MEMBER Access Test:')
    console.log('✅ Can see all team:', data.grouped.teamMembers.length > 0)
    console.log('✅ Can see PMs:', data.grouped.projectManagers.length > 0)
    console.log('⚠️ Clients (project-based):', data.grouped.clients.length)
  })
```

## 📱 Test on Different Dashboards

### 1. User Dashboard
```
Navigate to: /user/dashboard
Expected: Should see admins + team from their projects
```

### 2. Team Member Dashboard
```
Navigate to: /team-member/dashboard
Expected: Should see all internal team + clients from assigned projects
```

### 3. Project Manager Dashboard
```
Navigate to: /project-manager/dashboard
Expected: Should see everyone
```

### 4. Admin Dashboard
```
Navigate to: /super-admin
Expected: Should see everyone, full access
```

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error
**Solution**: Make sure you're logged in
```javascript
// Check session
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => console.log('Session:', session))
```

### Issue: Empty User Lists
**Solution**: Check database has users with proper roles
```javascript
// Count users by role
fetch('/api/messaging/users?grouped=true')
  .then(r => r.json())
  .then(data => {
    const total = Object.values(data.grouped).flat().length
    console.log('Total accessible users:', total)
    if (total === 0) {
      console.warn('⚠️ No users found - check database seeding')
    }
  })
```

### Issue: Cannot Create DM
**Solution**: Verify target user exists and you have permission
```javascript
// Debug DM creation
fetch('/api/messaging/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test DM',
    type: 'DIRECT',
    memberIds: ['USER_ID']
  })
})
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Error:', data.error)
    } else {
      console.log('✅ Success:', data)
    }
  })
```

## ✅ Success Criteria

After running all tests, you should see:
- ✅ All API endpoints return 200 status
- ✅ Role-based filtering works correctly
- ✅ DM channels can be created
- ✅ Messages can be sent and received
- ✅ Search returns relevant results
- ✅ Unread counts are accurate
- ✅ No authorization errors for valid requests

## 🎉 Ready for UI Integration

Once all tests pass:
1. Create the `MessagingHub` React component
2. Integrate into dashboard layouts
3. Connect Socket.io for real-time updates
4. Deploy to production!

Need help with the React component? Just ask!
