/**
 * CMS Dashboard - Main Entry Point
 * Shows overview of all content, pages, media, and statistics
 * 
 * @route /super-admin/cms
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Plus,
  Layout,
  RefreshCw,
  Edit,
  Eye,
  Image as ImageIcon,
  Activity,
  TrendingUp,
  Database,
  Settings2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  path: string;
  lastModified: string;
}

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  contentType?: {
    id: string;
    name: string;
    label: string;
  };
  categories?: string;
  featured?: boolean;
  updatedAt: string;
}

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedDate: string;
  mimeType: string;
}

interface Stats {
  pages: { total: number; published: number; draft: number };
  content: { total: number };
  media: { total: number; totalSize: number };
}

export default function CMSDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<Page[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [stats, setStats] = useState<Stats>({
    pages: { total: 0, published: 0, draft: 0 },
    content: { total: 0 },
    media: { total: 0, totalSize: 0 },
  });

  // Fetch all content data from both legacy and new CMS
  const fetchContentData = async () => {
    try {
      setLoading(true);

      // Try fetching from both old and new endpoints
      const [
        legacyPagesRes,
        legacyContentRes,
        legacyMediaRes,
        cmsPagesRes,
      ] = await Promise.all([
        fetch('/api/super-admin/content/pages').catch(() => null),
        fetch('/api/super-admin/content/manage').catch(() => null),
        fetch('/api/super-admin/content/media').catch(() => null),
        fetch('/api/cms/pages').catch(() => null),
      ]);

      // Combine data from both sources
      let allPages: Page[] = [];
      let allContent: ContentItem[] = [];
      let allMedia: MediaFile[] = [];
      const combinedStats: Stats = {
        pages: { total: 0, published: 0, draft: 0 },
        content: { total: 0 },
        media: { total: 0, totalSize: 0 },
      };

      // Process legacy pages
      if (legacyPagesRes?.ok) {
        const pagesData = await legacyPagesRes.json();
        allPages = [...allPages, ...(pagesData.pages || [])];
        Object.assign(combinedStats.pages, pagesData.stats || { total: 0, published: 0, draft: 0 });
      }

      // Process CMS pages
      if (cmsPagesRes?.ok) {
        const cmsData = await cmsPagesRes.json();
        if (cmsData.success && cmsData.data) {
          const cmsPages = cmsData.data.map((p: { id: string; pageTitle?: string; title: string; pageKey?: string; slug: string; status: string; updatedAt: string }) => ({
            id: p.id,
            title: p.pageTitle || p.title,
            slug: p.pageKey || p.slug,
            status: p.status,
            path: `/${p.pageKey || p.slug}`,
            lastModified: p.updatedAt,
          }));
          allPages = [...allPages, ...cmsPages];
        }
      }

      // Process legacy content
      if (legacyContentRes?.ok) {
        const contentData = await legacyContentRes.json();
        allContent = contentData.contentItems || [];
        combinedStats.content = { total: allContent.length };
      }

      // Process legacy media
      if (legacyMediaRes?.ok) {
        const mediaData = await legacyMediaRes.json();
        allMedia = mediaData.mediaFiles || [];
        combinedStats.media = mediaData.stats || { total: 0, totalSize: 0 };
      }

      // Remove duplicates based on ID
      const uniquePages = Array.from(new Map(allPages.map(p => [p.id, p])).values());

      setPages(uniquePages);
      setContentItems(allContent);
      setMediaFiles(allMedia);
      setStats({
        ...combinedStats,
        pages: {
          total: uniquePages.length,
          published: uniquePages.filter(p => p.status === 'PUBLISHED').length,
          draft: uniquePages.filter(p => p.status === 'DRAFT').length,
        },
      });

      console.log('✅ CMS Dashboard: Loaded', uniquePages.length, 'pages,', allContent.length, 'content items,', allMedia.length, 'media files');
    } catch (error) {
      console.error('Error fetching CMS data:', error);
      toast.error('Failed to load some CMS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentData();
  }, []);

  // Filter functions
  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContentItems = contentItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMediaFiles = mediaFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Management System</h2>
          <p className="text-muted-foreground">
            Manage your website content, pages, media, and templates
          </p>
        </div>
        <Button onClick={fetchContentData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pages.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pages.published} published, {stats.pages.draft} draft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dynamic Content</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.content.total}</div>
            <p className="text-xs text-muted-foreground">Content items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.media.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats.media.totalSize)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Link href="/super-admin/cms/pages">
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Page
                </Button>
              </Link>
              <Link href="/super-admin/cms/media">
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Media
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">
            Pages ({stats.pages.total})
          </TabsTrigger>
          <TabsTrigger value="content">
            Dynamic Content ({stats.content.total})
          </TabsTrigger>
          <TabsTrigger value="media">
            Media ({stats.media.total})
          </TabsTrigger>
        </TabsList>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Pages</CardTitle>
              <CardDescription>
                Manage all pages on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPages.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No pages found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery ? 'Try a different search term' : 'Create your first page to get started'}
                  </p>
                  {!searchQuery && (
                    <Link href="/super-admin/cms/pages">
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Page
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{page.title}</h4>
                          <Badge variant={page.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                            {page.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {page.path} • Updated {formatDate(page.lastModified)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={page.path} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/super-admin/cms/pages/${page.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dynamic Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Content Items</CardTitle>
              <CardDescription>
                Manage dynamic content sections from your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredContentItems.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No content items found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Dynamic content from your website will appear here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.title}</h4>
                          {item.featured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                          <Badge variant="outline">
                            {item.contentType?.label || 'Content'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.slug} • {item.categories}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link href={`/super-admin/content-legacy`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>
                Browse and manage your media files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMediaFiles.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No media files found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Upload your first media file to get started'}
                  </p>
                  {!searchQuery && (
                    <Link href="/super-admin/cms/media">
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Media
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredMediaFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {file.mimeType?.startsWith('image/') ? (
                        <Image
                          src={file.url}
                          alt={file.name}
                          width={200}
                          height={128}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access CMS features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/super-admin/cms/pages">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Manage Pages
              </Button>
            </Link>
            <Link href="/super-admin/cms/templates">
              <Button variant="outline" className="w-full justify-start">
                <Layout className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </Link>
            <Link href="/super-admin/cms/media">
              <Button variant="outline" className="w-full justify-start">
                <ImageIcon className="h-4 w-4 mr-2" />
                Media Library
              </Button>
            </Link>
            <Link href="/super-admin/cms/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/super-admin/content-legacy">
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Legacy Content
              </Button>
            </Link>
            <Link href="/super-admin/cms/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings2 className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
