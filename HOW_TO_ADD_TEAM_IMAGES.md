# 📸 How to Add Real Team Member Images

## Current Status
✅ Temporary professional placeholder images are now showing on the /about page
🔄 Ready to replace with actual photos

---

## 🎯 Recommended Method: Use ImgBB (Free & Easy)

This is the **EASIEST** method - no server configuration needed!

### Step-by-Step Instructions:

#### 1. Download Images from Google Drive
- Open your Google Drive links
- Click "Download" on each image
- Save to your computer

#### 2. Upload to ImgBB
1. Go to https://imgbb.com
2. Click "Start uploading"
3. Upload Sumit's photo
4. After upload, **RIGHT-CLICK** on the image → "Copy image address"
5. Save this URL somewhere (e.g., notepad)
6. Repeat for Ishaan's photo

#### 3. Update Database with Real Images
Create a file: `scripts/update-real-images.ts`

```typescript
import { prisma } from '../lib/prisma'

async function updateRealImages() {
  const teamMemberType = await prisma.contentType.findFirst({
    where: { name: 'team_member' }
  })

  if (!teamMemberType) return

  // Update Sumit
  const sumit = await prisma.dynamicContentItem.findFirst({
    where: { contentTypeId: teamMemberType.id, slug: 'sumit-malhotra' }
  })

  if (sumit) {
    const data = JSON.parse(sumit.data)
    await prisma.dynamicContentItem.update({
      where: { id: sumit.id },
      data: {
        data: JSON.stringify({
          ...data,
          imageUrl: 'PASTE_SUMIT_IMGBB_URL_HERE' // Replace with actual URL
        })
      }
    })
  }

  // Update Ishaan
  const ishaan = await prisma.dynamicContentItem.findFirst({
    where: { contentTypeId: teamMemberType.id, slug: 'ishaan-garg' }
  })

  if (ishaan) {
    const data = JSON.parse(ishaan.data)
    await prisma.dynamicContentItem.update({
      where: { id: ishaan.id },
      data: {
        data: JSON.stringify({
          ...data,
          imageUrl: 'PASTE_ISHAAN_IMGBB_URL_HERE' // Replace with actual URL
        })
      }
    })
  }

  console.log('✅ Real images updated!')
}

updateRealImages()
```

#### 4. Run the Script
```bash
npx tsx scripts/update-real-images.ts
```

#### 5. Refresh the Page
Visit http://localhost:3000/about - You'll see the real images!

---

## 🚀 Alternative Method: Upload to Your VPS Server

If you prefer to host images on your own server:

### Step 1: Prepare Images Locally
1. Download from Google Drive
2. Rename to:
   - `sumit-malhotra.jpg`
   - `ishaan-garg.jpg`
3. Save to `public/team/` folder in your project

### Step 2: Update Database
Run:
```bash
npx tsx scripts/update-team-images-local.ts
```

### Step 3: Deploy
```bash
git add public/team/
git commit -m "Add team member photos"
git push origin main
```

Images will be at:
- `https://yoursite.com/team/sumit-malhotra.jpg`
- `https://yoursite.com/team/ishaan-garg.jpg`

---

## 📋 Image Best Practices

### Recommended Specs:
- **Format**: JPG or PNG
- **Dimensions**: 400x400 pixels (square)
- **File Size**: < 200KB
- **Aspect Ratio**: 1:1 (perfect square)
- **Background**: Professional or consistent style

### Image Editing Tips:
1. Crop to square (1:1 ratio)
2. Use good lighting
3. Compress using:
   - https://tinypng.com
   - https://compressor.io
4. Ensure face is centered

---

## 🔧 Quick Reference

### Current Placeholder URLs:
- **Sumit**: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80`
- **Ishaan**: `https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&q=80`

### Google Drive IDs:
- **Sumit**: `14k-VnRnPmcJg5R9nGdeFPqHzCy4W55rw`
- **Ishaan**: `1s7Q4Ipx7YfijD1on0mqCm1dXROHD2RqF`

---

## ❓ Need Help?

If images don't show after updating:
1. Clear browser cache (Ctrl + Shift + Delete)
2. Check image URL is publicly accessible (open in incognito)
3. Verify database was updated: `npx tsx scripts/check-team.ts`
4. Check browser console for errors (F12 → Console tab)

---

## 🎯 Recommended: Use ImgBB

**Why ImgBB?**
- ✅ Free forever
- ✅ No account needed
- ✅ Unlimited storage
- ✅ Direct image links
- ✅ Works immediately
- ✅ CDN-backed (fast loading)

Just upload → copy URL → update script → run → done! 🎉
