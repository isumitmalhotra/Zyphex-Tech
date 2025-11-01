'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { useRouter } from 'next/navigation';
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
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export default function ResponsivePagesManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePublish = async (pageId: string) => {
    try {
      const response = await fetch(`/api/super-admin/content/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      });

      if (!response.ok) throw new Error('Failed to publish page');

      toast({
        title: 'Page Published',
        description: 'Page is now live'
      });
      fetchPages();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to publish page',
        variant: 'destructive'
      });
    }
  };

  const handleArchive = async (pageId: string) => {
    try {
      const response = await fetch(`/api/super-admin/content/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });

      if (!response.ok) throw new Error('Failed to archive page');

      toast({
        title: 'Page Archived',
        description: 'Page has been archived'
      });
      fetchPages();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to archive page',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const response = await fetch(`/api/super-admin/content/pages/${pageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete page');

      toast({
        title: 'Page Deleted',
        description: 'Page has been permanently deleted'
      });
      fetchPages();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive'
      });
    }
  };

  const handleDuplicate = async (pageId: string) => {
    try {
      const response = await fetch(`/api/super-admin/content/pages/${pageId}/duplicate`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to duplicate page');

      toast({
        title: 'Page Duplicated',
        description: 'A copy has been created'
      });
      fetchPages();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate page',
        variant: 'destructive'
      });
    }
  };

  // Define columns for ResponsiveTable
  const columns: ResponsiveTableColumn<Page>[] = [
    {
      key: 'title',
      label: 'Title',
      mobileLabel: 'Title',
      render: (page: Page) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{page.title}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      mobileLabel: 'Status',
      render: (page: Page) => (
        <Badge
          variant={
            page.status === 'published'
              ? 'default'
              : page.status === 'draft'
              ? 'secondary'
              : 'outline'
          }
        >
          {page.status === 'published' && <CheckCircle className="mr-1 h-3 w-3" />}
          {page.status === 'draft' && <Clock className="mr-1 h-3 w-3" />}
          {page.status === 'archived' && <Archive className="mr-1 h-3 w-3" />}
          {page.status}
        </Badge>
      )
    },
    {
      key: 'author',
      label: 'Author',
      mobileLabel: 'Author',
      hideOnMobile: false,
      render: (page: Page) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <User className="h-3 w-3" />
          {page.author}
        </div>
      )
    },
    {
      key: 'lastModified',
      label: 'Last Modified',
      mobileLabel: 'Modified',
      hideOnMobile: true,
      render: (page: Page) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(page.lastModified).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'views',
      label: 'Views',
      mobileLabel: 'Views',
      hideOnMobile: true,
      render: (page: Page) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="h-3 w-3" />
          {page.views}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      mobileLabel: 'Actions',
      render: (page: Page) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/super-admin/content/pages/${page.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/${page.slug}`, '_blank')}>
              <Globe className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(page.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {page.status === 'draft' && (
              <DropdownMenuItem onClick={() => handlePublish(page.id)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
            )}
            {page.status === 'published' && (
              <DropdownMenuItem onClick={() => handleArchive(page.id)}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(page.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SubtleBackground />
      
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pages Management</h2>
          <p className="text-muted-foreground">
            Manage and organize all your website pages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push('/super-admin/content/pages/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Pages</CardTitle>
          <CardDescription>Search and filter your pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pages..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="pages-search-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('published')}
                size="sm"
              >
                {getStatusIcon('published')}
                <span className="ml-2">Published</span>
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
                size="sm"
              >
                {getStatusIcon('draft')}
                <span className="ml-2">Drafts</span>
              </Button>
              <Button
                variant={statusFilter === 'archived' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('archived')}
                size="sm"
              >
                {getStatusIcon('archived')}
                <span className="ml-2">Archived</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pages</CardTitle>
          <CardDescription>
            {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable<Page>
            data={filteredPages}
            columns={columns}
            keyExtractor={(page) => page.id}
            emptyMessage="No pages found. Create your first page to get started."
            onRowClick={(page) => router.push(`/super-admin/content/pages/${page.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
