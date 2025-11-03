# Image Loading Fix for Production

## Problem Identified
The live website is not showing images for:
1. **Blog Posts** - Images are not loading on Updates page
2. **Team Members** - Profile photos are not showing on About page
3. **Other Content** - Various image placeholders not appearing

## Root Cause Analysis

### 1. **Local File References**
The seed scripts reference images in `/public/images/` directory:
- Blog: `/images/blog/ai-development.jpg`, etc.
- Team: `/images/team/sumit-malhotra.jpg`, etc.

### 2. **Missing Image Files**
The `public/images/` directory structure:
```
public/
  images/
    blog/ (only 3 images exist: ai-integration.jpg, cloud-computing.jpg, cybersecurity.jpg)
    team/ (directory didn't exist - now created but empty)
```

### 3. **Production Build Issue**
When deployed to production:
- Static files in `/public` may not be properly uploaded
- Image paths need to be absolute or use CDN
- Vercel/Production server doesn't have access to local files

## Solutions

### Solution 1: Use Unsplash CDN (Recommended for Quick Fix) ✅

Update seed scripts to use Unsplash image URLs instead of local paths.

**Advantages:**
- Immediate availability
- High-quality images
- No file upload needed
- CDN performance
- Already configured in `next.config.mjs`

**Implementation:** See updated seed scripts below.

### Solution 2: Upload to Cloud Storage (Long-term)

Use Cloudinary or similar service (already in package.json):
- Upload all images to Cloudinary
- Update seed scripts with Cloudinary URLs
- Better control over images

### Solution 3: Commit Images to Repository

Add actual image files to the repository:
- Create/find appropriate images
- Add to `public/images/blog/` and `public/images/team/`
- Commit and push to repository

## Implementation Steps

### Step 1: Update Blog Posts Seed Script

Replace local image paths with Unsplash URLs in `scripts/seed-blog-posts.ts`

### Step 2: Update Team Members Seed Script

Replace local image paths with UI Avatars or Unsplash URLs in `scripts/seed-team-members.ts`

### Step 3: Re-seed Database

Run the updated seed scripts to update all content in the database:
```bash
npx tsx scripts/seed-blog-posts.ts
npx tsx scripts/seed-team-members.ts
```

### Step 4: Delete Existing Data (if needed)

If records already exist and aren't updating, delete and re-create:
```sql
-- Delete blog posts
DELETE FROM "DynamicContentItem" WHERE "contentTypeId" IN (
  SELECT id FROM "ContentType" WHERE name = 'blog'
);

-- Delete team members
DELETE FROM "DynamicContentItem" WHERE "contentTypeId" IN (
  SELECT id FROM "ContentType" WHERE name = 'team_member'
);
```

### Step 5: Deploy Changes

```bash
git add .
git commit -m "fix: Update image URLs to use CDN for production"
git push origin cms-consolidation
```

## Updated Seed Scripts

See:
- `scripts/seed-blog-posts-updated.ts`
- `scripts/seed-team-members-updated.ts`

## Verification Checklist

- [ ] Blog posts show images on `/updates` page
- [ ] Team members show profile photos on `/about` page
- [ ] All images load without 404 errors
- [ ] Images are optimized and load quickly
- [ ] Mobile view displays images correctly

## Alternative: Generate Placeholder Images

If you prefer consistent branded images, you can use:
1. **UI Avatars** for team members: `https://ui-avatars.com/api/?name=John+Doe&size=400`
2. **Placeholder services** for content: `https://placehold.co/600x400/1e293b/38bdf8?text=Blog+Title`

## Production Environment Variables

Ensure these are set in production (Vercel/your hosting):
```env
DATABASE_URL=your_production_database_url
NEXT_PUBLIC_APP_URL=https://zyphextech.com
```

## Next.js Image Configuration

Already configured in `next.config.mjs`:
```javascript
images: {
  domains: [
    'images.unsplash.com',
    'ui-avatars.com',
    // ... other domains
  ],
}
```

## Monitoring

After deployment, check:
1. Browser Console for 404 errors
2. Network tab for failed image requests
3. Lighthouse report for image optimization
