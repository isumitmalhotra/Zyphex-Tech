# Team Member Images

## Current Status
This folder contains team member profile images.

## How to Add Images

### Step 1: Download Images from Google Drive
1. Go to your Google Drive links:
   - Sumit Malhotra: https://drive.google.com/file/d/14k-VnRnPmcJg5R9nGdeFPqHzCy4W55rw/view
   - Ishaan Garg: https://drive.google.com/file/d/1s7Q4Ipx7YfijD1on0mqCm1dXROHD2RqF/view

2. Download both images to your computer

### Step 2: Save Images Here
Rename and save the downloaded images as:
- `sumit-malhotra.jpg` (or .png depending on the format)
- `ishaan-garg.jpg` (or .png depending on the format)

**Important**: Use lowercase, hyphenated names for consistency.

### Step 3: Update Database
After placing the images in this folder, run:
```bash
npx tsx scripts/update-team-images-local.ts
```

This will update the database to use the local image paths.

## Image Guidelines

### Recommended Specifications:
- **Format**: JPG or PNG
- **Size**: 400x400 pixels (square)
- **File size**: < 200KB for optimal loading
- **Aspect ratio**: 1:1 (square)

### Tips:
- Use professional headshots with good lighting
- Ensure consistent background style
- Compress images before uploading for better performance

## Deployment

After adding images locally and updating the database:

1. **Commit the images:**
   ```bash
   git add public/team/
   git commit -m "Add team member profile images"
   ```

2. **Push to production:**
   ```bash
   git push origin main
   ```

The images will be automatically deployed to your server and will be accessible at:
- `https://yoursite.com/team/sumit-malhotra.jpg`
- `https://yoursite.com/team/ishaan-garg.jpg`

## Alternative: Using External Hosting

If you prefer to use external image hosting (recommended for better performance):

1. Upload images to:
   - **Imgur**: https://imgur.com/upload
   - **Cloudinary**: https://cloudinary.com (free tier)
   - **AWS S3**: https://aws.amazon.com/s3/
   - **imgbb**: https://imgbb.com

2. Get the direct image URLs

3. Update the database manually or create a custom script
