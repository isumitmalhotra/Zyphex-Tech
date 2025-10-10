# Slack-Like Messaging System - Implementation Plan

## 🎯 Objective
Implement a production-ready, Slack-like messaging system with role-based access control, real-time sync, and search functionality across all dashboards.

## 📋 Requirements Analysis

### Role-Based Visibility Rules

#### **USER/CLIENT**
- ✅ Can see all SUPER_ADMIN and ADMIN users (for support requests)
- ✅ Can see project-specific channels when assigned to projects
- ✅ Can see all team members assigned to their projects
- ✅ Cannot see internal team channels

#### **DEVELOPER/TEAM_MEMBER**
- ✅ Can message anyone internally (all team members, PMs, admins)
- ✅ Can see only clients on projects they're assigned to
- ✅ Cannot see clients from other projects

#### **PROJECT_MANAGER**
- ✅ Can see all clients in the system (when projects are created)
- ✅ Can message all team members internally
- ✅ Full access to project channels they manage

#### **ADMIN/SUPER_ADMIN**
- ✅ Can see all clients and team members
- ✅ Full access to all channels
- ✅ Can create system-wide announcements

### Channel Groups
1. **Team Members** - Internal team communication
2. **Customers/Clients** - Client communication
3. **Projects** - Project-specific channels
4. **Direct Messages** - 1-on-1 conversations
5. **Announcements** - System-wide broadcasts (admin only)

## 🏗️ Architecture

### Database Schema (Already Exists - Just Need to Use)
```prisma
model Channel {
  id          String      @id @default(uuid())
  name        String
  description String?
  type        ChannelType @default(TEAM)  // TEAM, PROJECT, DIRECT, GENERAL, ADMIN, CLIENT
  isPrivate   Boolean     @default(false)
  projectId   String?
  createdById String
  members     User[]      @relation("ChannelMembers")
  messages    Message[]
}

model Message {
  id          String      @id @default(uuid())
  senderId    String
  receiverId  String?
  channelId   String?
  projectId   String?
  content     String
  messageType MessageType @default(DIRECT)  // DIRECT, BROADCAST, NOTIFICATION, SYSTEM, REPLY
  readAt      DateTime?
  parentId    String?     // For threading
  reads       MessageRead[]
  reactions   MessageReaction[]
}
```

### API Endpoints Structure

```
/api/messaging/
  ├── channels/
  │   ├── GET     - List channels based on user role
  │   ├── POST    - Create new channel (DM or group)
  │   └── [id]/
  │       ├── GET     - Get channel details + messages
  │       ├── PUT     - Update channel
  │       └── DELETE  - Archive channel
  │
  ├── messages/
  │   ├── GET     - Get messages (with pagination)
  │   ├── POST    - Send message
  │   └── [id]/
  │       ├── PUT     - Mark as read
  │       └── DELETE  - Delete message
  │
  ├── users/
  │   ├── GET     - List available users (role-based)
  │   └── search/
  │       └── GET - Search users
  │
  └── search/
      └── GET     - Global message/channel search
```

### Real-time Events (Socket.io)
```typescript
// Client → Server
'join:channel' - Join channel room
'leave:channel' - Leave channel room
'send:message' - Send message
'typing:start' - Start typing indicator
'typing:stop' - Stop typing indicator
'message:read' - Mark message as read

// Server → Client
'message:new' - New message received
'message:updated' - Message edited
'message:deleted' - Message deleted
'user:typing' - User is typing
'user:online' - User came online
'user:offline' - User went offline
'channel:updated' - Channel info changed
```

## 📁 File Structure

```
app/
├── api/
│   └── messaging/
│       ├── channels/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── messages/
│       │           └── route.ts
│       ├── messages/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── users/
│       │   ├── route.ts
│       │   └── search/
│       │       └── route.ts
│       └── search/
│           └── route.ts

components/
├── messaging/
│   ├── MessagingHub.tsx           # Main messaging component
│   ├── ChannelList.tsx            # Channel/user list with groups
│   ├── MessageThread.tsx          # Message display area
│   ├── MessageInput.tsx           # Message composition
│   ├── UserSearch.tsx             # Search functionality
│   ├── ChannelSelector.tsx        # Channel/group selector
│   └── types.ts                   # TypeScript interfaces

lib/
├── messaging/
│   ├── channel-access.ts          # Role-based access control
│   ├── channel-visibility.ts      # Channel visibility rules
│   └── message-utils.ts           # Message formatting utilities

hooks/
└── use-messaging.ts               # Unified messaging hook
```

## 🚀 Implementation Steps

### Phase 1: Database & API Foundation ✅ (Already Exists)
- [x] Database schema (already in place)
- [ ] Create unified messaging API
- [ ] Implement role-based access control

### Phase 2: Core Components
- [ ] Create MessagingHub component
- [ ] Create ChannelList with groups
- [ ] Create MessageThread
- [ ] Create MessageInput
- [ ] Create UserSearch

### Phase 3: Role-Based Logic
- [ ] Implement channel visibility rules
- [ ] Create user availability functions
- [ ] Add access control middleware

### Phase 4: Real-time Integration
- [ ] Connect Socket.io to components
- [ ] Implement typing indicators
- [ ] Add online/offline status
- [ ] Sync across all dashboards

### Phase 5: Search & Advanced Features
- [ ] Global message search
- [ ] User search with filters
- [ ] Thread replies
- [ ] Message reactions
- [ ] File attachments

### Phase 6: Integration
- [ ] Add to User Dashboard
- [ ] Add to Team Member Dashboard
- [ ] Add to Project Manager Dashboard
- [ ] Add to Client Dashboard
- [ ] Add to Admin/Super Admin Dashboard

## 🔐 Role-Based Access Control Functions

```typescript
// lib/messaging/channel-access.ts

export function getAvailableUsers(currentUser: User, allUsers: User[]): User[] {
  switch (currentUser.role) {
    case 'CLIENT':
    case 'USER':
      // Can see admins, super admins, and team members on their projects
      return allUsers.filter(u => 
        u.role === 'ADMIN' || 
        u.role === 'SUPER_ADMIN' ||
        isOnSameProject(currentUser, u)
      )
    
    case 'TEAM_MEMBER':
      // Can see all internal team + clients on their projects
      return allUsers.filter(u => 
        u.role !== 'CLIENT' || 
        isOnSameProject(currentUser, u)
      )
    
    case 'PROJECT_MANAGER':
      // Can see all users
      return allUsers
    
    case 'ADMIN':
    case 'SUPER_ADMIN':
      // Can see everyone
      return allUsers
  }
}

export function getAvailableChannels(currentUser: User, allChannels: Channel[]): Channel[] {
  switch (currentUser.role) {
    case 'CLIENT':
    case 'USER':
      // Can see: GENERAL, CLIENT, PROJECT (if member), DIRECT (if participant)
      return allChannels.filter(c => 
        c.type === 'GENERAL' ||
        c.type === 'CLIENT' ||
        (c.type === 'PROJECT' && c.members.includes(currentUser.id)) ||
        (c.type === 'DIRECT' && c.members.includes(currentUser.id))
      )
    
    case 'TEAM_MEMBER':
      // Can see: All except CLIENT-only channels
      return allChannels.filter(c => 
        c.type !== 'CLIENT' || 
        c.members.includes(currentUser.id)
      )
    
    case 'PROJECT_MANAGER':
    case 'ADMIN':
    case 'SUPER_ADMIN':
      // Can see all channels
      return allChannels
  }
}
```

## 🎨 UI/UX Design

### Channel List Layout
```
┌─────────────────────────────────┐
│ 🔍 Search messages & users...   │
├─────────────────────────────────┤
│ ⭐ Starred                       │
│   • project-alpha (3)            │
│   • Sarah Johnson (1)            │
├─────────────────────────────────┤
│ 💬 Direct Messages               │
│   🟢 John Doe (2)                │
│   🟡 Jane Smith                  │
│   ⚫ Mike Wilson                 │
├─────────────────────────────────┤
│ 👥 Team Members                  │
│   # dev-team                     │
│   # design-team                  │
│   # qa-team                      │
├─────────────────────────────────┤
│ 👤 Customers                     │
│   🟢 Acme Corp (2)               │
│   🟡 TechStart Inc               │
├─────────────────────────────────┤
│ 📁 Projects                      │
│   # project-alpha (5)            │
│   # project-beta                 │
├─────────────────────────────────┤
│ 📢 Announcements                 │
│   # company-news                 │
│   # system-updates               │
└─────────────────────────────────┘
```

### Message Thread Layout
```
┌─────────────────────────────────────────┐
│ # project-alpha                  [⚙️]   │
│ Web App Development                     │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 👤 John Doe     10:30 AM        │    │
│ │ Can we discuss the new feature? │    │
│ │ 👍 2  💬 Reply                   │    │
│ └─────────────────────────────────┘    │
│                                         │
│     ┌─────────────────────────────┐    │
│     │ 👤 You     10:32 AM         │    │
│     │ Sure! I'll review it now.   │    │
│     └─────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 👤 Sarah ✏️ is typing...        │    │
│ └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│ ✉️ Message #project-alpha...     [📎] │
│                                  [Send] │
└─────────────────────────────────────────┘
```

## 🧪 Testing Checklist

### Functional Tests
- [ ] CLIENT can message ADMIN
- [ ] CLIENT can message team members on their project
- [ ] CLIENT cannot see other clients' projects
- [ ] TEAM_MEMBER can message internally
- [ ] TEAM_MEMBER can message clients on their projects
- [ ] TEAM_MEMBER cannot message clients from other projects
- [ ] PROJECT_MANAGER can message all clients
- [ ] PROJECT_MANAGER can message all team members
- [ ] ADMIN can access all channels
- [ ] Search finds messages across allowed channels
- [ ] DM creation works
- [ ] Group channel creation works (admins)

### Real-time Tests
- [ ] Messages appear instantly across dashboards
- [ ] Typing indicators work
- [ ] Online status updates
- [ ] Unread counts update
- [ ] Notifications trigger

### Performance Tests
- [ ] Message list pagination
- [ ] Channel list loads fast with 100+ channels
- [ ] Search is responsive
- [ ] Socket connections stable

## 📊 Success Metrics

- ✅ All roles can message appropriate users
- ✅ No unauthorized access to channels
- ✅ Real-time sync across all dashboards (<500ms)
- ✅ Search results return in <1s
- ✅ 99.9% Socket.io uptime
- ✅ Zero data leaks between unauthorized users

## 🚨 Security Considerations

1. **Authorization Middleware**: Every API call must verify user has access to channel
2. **Socket.io Room Security**: Users can only join channels they have access to
3. **Message Encryption**: Consider encrypting sensitive messages
4. **Rate Limiting**: Prevent spam (10 messages/minute per user)
5. **XSS Prevention**: Sanitize all message content
6. **Audit Logging**: Log all message access for compliance

## 🎬 Next Steps

1. Review and approve this plan
2. Start with Phase 1 (API Foundation)
3. Build core components (Phase 2)
4. Implement role-based logic (Phase 3)
5. Add real-time features (Phase 4)
6. Deploy and test across all dashboards

---

**Estimated Timeline**: 3-5 days for full implementation
**Priority**: HIGH - Core feature for production MVP
**Dependencies**: Socket.io (✅ already configured), Database (✅ schema ready)
