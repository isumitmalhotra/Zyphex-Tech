/**
 * CMS Media Library Page
 * Browse and manage media files
 * 
 * @route /admin/cms/media
 */

'use client';

import { MediaLibrary } from '@/components/cms/media-library';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MediaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
          <CardDescription>
            Upload and manage your images, videos, documents, and other media files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaLibrary />
        </CardContent>
      </Card>
    </div>
  );
}
