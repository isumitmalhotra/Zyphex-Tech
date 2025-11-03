/**
 * CMS Media Library Page
 * Browse and manage media files
 * 
 * @route /super-admin/cms/media
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageInfo } from '@/components/cms/usage-info';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MediaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <UsageInfo
        title="🖼️ Media Library Management"
        description="The Media Library is your centralized hub for all website media files including images, videos, documents, and other assets. Upload, organize, and manage all media used across your website."
        features={[
          "Upload multiple files at once (drag & drop)",
          "Organize media into categories (team, blog, portfolio, services)",
          "Preview images and videos",
          "Copy media URLs for easy embedding",
          "Delete unused media files",
          "Search and filter media by name or category",
          "View file details (size, dimensions, upload date)"
        ]}
        tips={[
          "Organize files by category for easier management",
          "Use descriptive file names for better searchability",
          "Compress images before uploading for better performance",
          "Maximum file size: 10MB per file",
          "Supported formats: JPG, PNG, GIF, WebP, MP4, PDF"
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
          <CardDescription>
            Upload and manage your images, videos, documents, and other media files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Media Library UI - Coming Soon</AlertTitle>
            <AlertDescription>
              The Media Library UI component is currently being rebuilt. The backend APIs and services are fully functional.
              <br /><br />
              <strong>Available Backend Services:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>11 REST API endpoints for media management</li>
                <li>Media upload service with image optimization</li>
                <li>Folder organization service</li>
                <li>Full documentation in TASK_9_MEDIA_LIBRARY_UI_COMPLETE.md</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
