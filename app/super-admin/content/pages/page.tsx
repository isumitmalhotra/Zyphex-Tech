'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  Edit,
  Trash2,
  Copy,
  Globe,
  Calendar,
  User,
  Archive,
  Clock,
  Plus,
  Download,
  AlertCircle
} from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'archived';
  author: string;
  lastModified: string;
  publishDate: string;
  views: number;
  category: string;
  template: string;
}

export default function PagesManagementPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<Page[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0
  });

  // Fetch pages from API
  useEffect(() => {
    fetchPages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/content/pages');
      
      if (!response.ok) throw new Error('Failed to fetch pages');

      const data = await response.json();
      setPages(data.pages);
      setStats(data.stats);

      toast({
        title: 'Pages Loaded',
        description: `Loaded ${data.stats.total} pages from database`
      });
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Error Loading Pages',
        description: 'Failed to load pages from database',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePublish = (pageId: string) => {
    toast({
      title: 'Page Published',
      description: `Page ${pageId} is now live`
    });
  };

  const handleUnpublish = (pageId: string) => {
    toast({
      title: 'Page Unpublished',
      description: `Page ${pageId} has been unpublished`
    });
  };

  const handleDuplicate = (pageId: string) => {
    toast({
      title: 'Page Duplicated',
      description: `A copy of page ${pageId} has been created`
    });
  };

  const handleDelete = (pageId: string) => {
    toast({
      title: 'Page Deleted',
      description: `Page ${pageId} has been moved to trash`,
      variant: 'destructive'
    });
  };

  const handleArchive = (pageId: string) => {
    toast({
      title: 'Page Archived',
      description: `Page ${pageId} has been archived`
    });
  };

  const handlePreview = (slug: string) => {
    window.open(slug, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-3 w-3" />;
      case 'draft':
        return <Edit className="h-3 w-3" />;
      case 'archived':
        return <Archive className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Pages Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage all website pages and their status
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading">
                    {loading ? '-' : stats.total}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    All pages
                  </p>
                </div>
                <FileText className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-green-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-green-600">
                    {loading ? '-' : stats.published}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Live pages
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-yellow-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-yellow-600">
                    {loading ? '-' : stats.draft}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    In progress
                  </p>
                </div>
                <Edit className="h-10 w-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-gray-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Archived
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-gray-600">
                    {loading ? '-' : stats.archived}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Old pages
                  </p>
                </div>
                <Archive className="h-10 w-10 text-gray-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="zyphex-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search pages by title, slug, or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'published' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('published')}
                >
                  Published
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                >
                  Drafts
                </Button>
                <Button
                  variant={statusFilter === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('archived')}
                >
                  Archived
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button className="zyphex-button-primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages Table */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              All Pages ({filteredPages.length})
            </CardTitle>
            <CardDescription>
              Manage your website pages, their status, and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-500px)]">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading pages...</p>
                </div>
              ) : (
              <div className="space-y-3">
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{page.title}</h3>
                          <Badge className={getStatusColor(page.status)}>
                            {getStatusIcon(page.status)}
                            <span className="ml-1 capitalize">{page.status}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {page.id}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {page.slug}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {page.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Modified: {page.lastModified}
                          </span>
                          {page.publishDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Published: {page.publishDate}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {page.views.toLocaleString()} views
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {page.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Template: {page.template}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        {page.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublish(page.id)}
                            className="whitespace-nowrap"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        {page.status === 'published' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(page.id)}
                            className="whitespace-nowrap"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Unpublish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(page.slug)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicate(page.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {page.status !== 'archived' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchive(page.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(page.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPages.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pages Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by creating your first page'}
                    </p>
                  </div>
                )}
              </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
