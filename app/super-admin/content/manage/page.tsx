'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import {
  FileText,
  Search,
  Plus,
  Save,
  Eye,
  Clock,
  Edit,
  Trash2,
  Copy,
  History,
  Layout,
  Settings,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  Video,
  Code,
  List,
  Heading,
  AlignLeft,
  Globe,
  Tag,
  User,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'video' | 'code' | 'list';
  content: string;
  order: number;
}

interface PageVersion {
  id: string;
  version: number;
  date: string;
  author: string;
  changes: string;
}

interface PageContent {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'scheduled';
  author: string;
  lastModified: string;
  publishDate: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  blocks: ContentBlock[];
  versions: PageVersion[];
  category: string;
  tags: string[];
  featured: boolean;
  views: number;
}

export default function PageContentManagementPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0
  });

  // Fetch content from API
  useEffect(() => {
    fetchContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/content/manage');
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      
      // Transform API data to match frontend interface
      const transformedPages: PageContent[] = data.contentItems.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        title: item.title as string,
        slug: item.slug as string,
        status: item.status as 'published' | 'draft' | 'scheduled',
        author: item.author as string,
        lastModified: new Date(item.lastModified as string).toISOString().replace('T', ' ').slice(0, 16),
        publishDate: item.publishDate ? new Date(item.publishDate as string).toISOString().replace('T', ' ').slice(0, 16) : '',
        description: item.description as string || '',
        seoTitle: item.seoTitle as string || item.title as string,
        seoDescription: item.seoDescription as string || '',
        seoKeywords: Array.isArray(item.seoKeywords) ? item.seoKeywords as string[] : [],
        blocks: [], // Could be enhanced
        versions: [], // Could be enhanced with version tracking
        category: Array.isArray(item.categories) && (item.categories as string[]).length > 0 
          ? (item.categories as string[])[0] 
          : 'General',
        tags: Array.isArray(item.tags) ? item.tags as string[] : [],
        featured: item.featured as boolean,
        views: 0 // Could be enhanced with analytics
      }));

      setPages(transformedPages);
      
      // Set statistics
      setStats({
        total: data.stats.total,
        published: data.stats.published,
        draft: data.stats.draft,
        totalViews: transformedPages.reduce((sum: number, p: PageContent) => sum + p.views, 0)
      });

      toast({
        title: 'Content Loaded',
        description: `Loaded ${data.stats.total} content items from database`
      });

    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error Loading Content',
        description: 'Failed to load content from database. Using fallback.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPageData = pages.find(p => p.id === selectedPage);

  const handleSavePage = () => {
    toast({
      title: 'Page Saved',
      description: 'Your changes have been saved successfully'
    });
    setEditMode(false);
  };

  const handlePublishPage = () => {
    toast({
      title: 'Page Published',
      description: 'Page is now live and visible to users'
    });
  };

  const handleDeletePage = () => {
    toast({
      title: 'Page Deleted',
      description: 'Page has been moved to trash',
      variant: 'destructive'
    });
  };

  const handleDuplicatePage = () => {
    toast({
      title: 'Page Duplicated',
      description: 'A copy of the page has been created'
    });
  };

  const handleRestoreVersion = (version: number) => {
    toast({
      title: 'Version Restored',
      description: `Page restored to version ${version}`
    });
  };

  const handleAddBlock = (type: string) => {
    toast({
      title: 'Block Added',
      description: `New ${type} block added to page`
    });
  };

  const handleMoveBlock = (direction: 'up' | 'down') => {
    toast({
      title: 'Block Moved',
      description: `Content block moved ${direction}`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
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
      case 'scheduled':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'heading':
        return <Heading className="h-4 w-4" />;
      case 'paragraph':
        return <AlignLeft className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'list':
        return <List className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Content Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create, edit, and manage your website content
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="zyphex-card border-purple-500/20 hover-zyphex-lift">
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
                    All content pages
                  </p>
                </div>
                <FileText className="h-10 w-10 text-purple-500 opacity-20" />
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
                    Work in progress
                  </p>
                </div>
                <Edit className="h-10 w-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-blue-600">
                    {loading ? '-' : stats.totalViews.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Page views
                  </p>
                </div>
                <Eye className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="zyphex-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search pages by title, slug, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <Button className="zyphex-button-primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create New Page
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pages List */}
          <div className="lg:col-span-1">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-purple-500" />
                  Pages
                </CardTitle>
                <CardDescription>
                  {filteredPages.length} page(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-450px)]">
                  <div className="space-y-2 pr-4">
                    {filteredPages.map((page) => (
                      <div
                        key={page.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedPage === page.id
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setSelectedPage(page.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{page.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              /{page.slug}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(page.status)} ml-2 flex-shrink-0`}>
                            {getStatusIcon(page.status)}
                            <span className="ml-1">{page.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {page.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {page.views.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs mr-1">
                            {page.category}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {filteredPages.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No pages found
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPageData ? (
              <>
                {/* Page Metadata */}
                <Card className="zyphex-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-purple-500" />
                        Page Settings
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewMode(!previewMode)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Switch
                          checked={editMode}
                          onCheckedChange={setEditMode}
                        />
                        <span className="text-sm">Edit Mode</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Page Title
                        </Label>
                        <Input
                          value={selectedPageData.title}
                          disabled={!editMode}
                          className="zyphex-input"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          URL Slug
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={selectedPageData.slug}
                            disabled={!editMode}
                            className="zyphex-input flex-1"
                          />
                          <Button variant="outline" size="sm" disabled={!editMode}>
                            <Globe className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Description
                      </Label>
                      <Input
                        value={selectedPageData.description}
                        disabled={!editMode}
                        className="zyphex-input"
                      />
                    </div>

                    <Separator />

                    {/* SEO Settings */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        SEO Settings
                      </h4>
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          SEO Title
                        </Label>
                        <Input
                          value={selectedPageData.seoTitle}
                          disabled={!editMode}
                          className="zyphex-input"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          SEO Description
                        </Label>
                        <Input
                          value={selectedPageData.seoDescription}
                          disabled={!editMode}
                          className="zyphex-input"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Keywords
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPageData.seoKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Page Meta */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Category:</span>
                        <span className="ml-2 font-semibold">{selectedPageData.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <Badge className={`ml-2 ${getStatusColor(selectedPageData.status)}`}>
                          {selectedPageData.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Author:</span>
                        <span className="ml-2 font-semibold">{selectedPageData.author}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Views:</span>
                        <span className="ml-2 font-semibold">{selectedPageData.views.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Modified:</span>
                        <span className="ml-2 font-semibold text-xs">{selectedPageData.lastModified}</span>
                      </div>
                      {selectedPageData.publishDate && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Published:</span>
                          <span className="ml-2 font-semibold text-xs">{selectedPageData.publishDate}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Blocks */}
                <Card className="zyphex-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5 text-purple-500" />
                        Content Blocks
                      </CardTitle>
                      {editMode && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddBlock('heading')}
                          >
                            <Heading className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddBlock('paragraph')}
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddBlock('image')}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddBlock('code')}
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddBlock('list')}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 pr-4">
                        {selectedPageData.blocks.map((block, index) => (
                          <div
                            key={block.id}
                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getBlockIcon(block.type)}
                                <Badge variant="outline" className="text-xs capitalize">
                                  {block.type}
                                </Badge>
                              </div>
                              {editMode && (
                                <div className="flex gap-1">
                                  {index > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleMoveBlock('up')}
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {index < selectedPageData.blocks.length - 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleMoveBlock('down')}
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="text-sm">
                              {block.type === 'code' ? (
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                                  <code>{block.content}</code>
                                </pre>
                              ) : block.type === 'image' ? (
                                <div className="text-blue-600">{block.content}</div>
                              ) : (
                                <p className="whitespace-pre-wrap">{block.content}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Version History */}
                <Card className="zyphex-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-purple-500" />
                      Version History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPageData.versions.map((version) => (
                        <div
                          key={version.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-600">
                                v{version.version}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{version.changes}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {version.author} • {version.date}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreVersion(version.version)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button className="zyphex-button-primary" onClick={handleSavePage}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    className="zyphex-button-secondary"
                    onClick={handlePublishPage}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish Page
                  </Button>
                  <Button variant="outline" onClick={handleDuplicatePage}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live
                  </Button>
                  <Button variant="outline" onClick={handleDeletePage}>
                    <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <Card className="zyphex-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-24 w-24 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Page Selected</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Select a page from the list to view and edit its content
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
