# Avatar Generation - Quick Reference Guide

## 🚀 Quick Start

### 1. Generate Avatar (Utility Function)
```typescript
import { generateAvatar } from '@/lib/utils/avatar'

// Basic usage
const avatarDataUri = generateAvatar("John Doe", 40)
// Returns: data:image/svg+xml;base64,PHN2ZyB3...

// Use in img tag
<img src={generateAvatar("Jane Smith", 48)} alt="Jane Smith" />
```

### 2. UserAvatar Component (Recommended)
```tsx
import { UserAvatar } from '@/components/ui/user-avatar'

// Simple avatar
<UserAvatar name="John Doe" />

// With optional image (falls back to generated if image fails/missing)
<UserAvatar 
  name="John Doe" 
  imageUrl={user.profilePicture}
  size="lg"
/>

// With online indicator
<UserAvatar 
  name="John Doe"
  showOnline={true}
  isOnline={user.isOnline}
/>
```

### 3. Avatar Group
```tsx
import { AvatarGroup } from '@/components/ui/user-avatar'

<AvatarGroup
  avatars={[
    { name: "John Doe" },
    { name: "Jane Smith", imageUrl: "/jane.jpg" },
    { name: "Bob Wilson" },
  ]}
  max={3}
/>
```

---

## 📏 Size Options

| Size | Pixels | Use Case |
|------|--------|----------|
| `xs` | 24px | Compact lists, tags |
| `sm` | 32px | Sidebar, small cards |
| `md` | 40px | **Default**, standard lists |
| `lg` | 56px | Profile headers |
| `xl` | 80px | Large displays |
| `2xl` | 128px | Profile pages |

---

## 🎨 Examples

### In a Table/List
```tsx
<UserAvatar name={user.name} imageUrl={user.avatar} size="sm" />
```

### In a Card Header
```tsx
<div className="flex items-center gap-3">
  <UserAvatar name={client.name} imageUrl={client.logo} size="md" />
  <div>
    <h3>{client.name}</h3>
    <p>{client.email}</p>
  </div>
</div>
```

### Team Display
```tsx
<AvatarGroup
  avatars={project.teamMembers.map(m => ({
    name: m.name,
    imageUrl: m.avatar,
  }))}
  max={5}
  size="sm"
/>
```

---

## 🔧 Migration Pattern

### Before (Broken Placeholder)
```tsx
const user = {
  name: "John Doe",
  avatar: "/placeholder-user.jpg" // ❌ Broken image
}

<Avatar>
  <AvatarImage src={user.avatar} />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### After (Generated Avatar)
```tsx
import { generateAvatar } from '@/lib/utils/avatar'

const user = {
  name: "John Doe",
  avatar: "" // or null
}

<Avatar>
  <AvatarImage src={user.avatar || generateAvatar(user.name, 40)} />
  <AvatarFallback>
    <img src={generateAvatar(user.name, 40)} alt={user.name} />
  </AvatarFallback>
</Avatar>
```

### Best (UserAvatar Component)
```tsx
import { UserAvatar } from '@/components/ui/user-avatar'

<UserAvatar name={user.name} imageUrl={user.avatar} size="md" />
```

---

## ✨ Helper Functions

### Get Initials
```typescript
import { getInitials } from '@/lib/utils/avatar'

getInitials("John Doe") // "JD"
getInitials("Alice") // "AL"
getInitials("") // "U"
```

### Cache Management
```typescript
import { clearAvatarCache, getAvatarCacheSize } from '@/lib/utils/avatar'

// Check cache size
console.log(getAvatarCacheSize()) // Number of cached avatars

// Clear cache (free memory)
clearAvatarCache()
```

---

## 🎯 Common Use Cases

### 1. User Profile
```tsx
<UserAvatar 
  name={user.name}
  imageUrl={user.profilePicture}
  size="xl"
  showOnline={true}
  isOnline={user.isOnline}
/>
```

### 2. Comment/Message Author
```tsx
<div className="flex gap-2">
  <UserAvatar name={comment.author} size="sm" />
  <div>
    <p className="font-semibold">{comment.author}</p>
    <p>{comment.text}</p>
  </div>
</div>
```

### 3. Team Members List
```tsx
{teamMembers.map(member => (
  <div key={member.id} className="flex items-center gap-3">
    <UserAvatar 
      name={member.name}
      imageUrl={member.avatar}
      size="md"
    />
    <div>
      <p>{member.name}</p>
      <p className="text-sm text-muted-foreground">{member.role}</p>
    </div>
  </div>
))}
```

### 4. Client/Company Logo
```tsx
<UserAvatar 
  name={client.companyName}
  imageUrl={client.logo}
  size="lg"
  alt={`${client.companyName} logo`}
/>
```

---

## 🎨 Customization

### Custom Size
```tsx
<UserAvatar 
  name="John Doe"
  customSize={64}
/>
```

### Custom CSS Classes
```tsx
<UserAvatar 
  name="John Doe"
  className="ring-2 ring-blue-500 ring-offset-2"
/>
```

### Online Indicator Styling
The online indicator automatically adjusts:
- Green dot for online
- Gray dot for offline
- Size is 25% of avatar size (min 8px)
- Positioned bottom-right with ring

---

## ⚡ Performance Tips

1. **Caching is Automatic**: Same name + size = cached result
2. **Clear Cache Periodically**: If memory is a concern
3. **Use Consistent Sizes**: Improves cache hit rate
4. **Prefer UserAvatar Component**: Handles all edge cases

---

## 🐛 Troubleshooting

### Avatar Not Showing
- Check if name is provided
- Verify import statement
- Check browser console for errors

### Wrong Initials
- Ensure name is passed correctly
- Use `getInitials()` to test

### TypeScript Errors
- Run `npm install` to ensure deps installed
- Check import paths are correct

### Performance Issues
```typescript
// Clear cache if too large
import { clearAvatarCache } from '@/lib/utils/avatar'
clearAvatarCache()
```

---

## 📚 API Reference

### `generateAvatar(name: string, size?: number): string`
- **name**: Person's name for initials and color
- **size**: Avatar size in pixels (default: 40)
- **Returns**: Data URI string for SVG avatar

### `UserAvatar` Component Props
```typescript
interface UserAvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  customSize?: number
  className?: string
  alt?: string
  showOnline?: boolean
  isOnline?: boolean
}
```

### `AvatarGroup` Component Props
```typescript
interface AvatarGroupProps {
  avatars: Array<{
    name: string
    imageUrl?: string | null
    isOnline?: boolean
  }>
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  customSize?: number
  className?: string
}
```

---

## ✅ Checklist for New Features

When adding avatars to new features:

- [ ] Import `UserAvatar` component
- [ ] Provide user/entity name
- [ ] Pass optional imageUrl if available
- [ ] Choose appropriate size
- [ ] Add proper alt text for accessibility
- [ ] Consider online indicator if relevant
- [ ] Test with empty/null image URLs
- [ ] Test with long names
- [ ] Test on mobile devices

---

**Need Help?** Check `AVATAR_IMPLEMENTATION_COMPLETE.md` for full documentation.
