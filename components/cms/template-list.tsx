/**
 * CMS Template List Component
 * Browse and manage page templates
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Grid3x3,
  List,
  Loader2,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sections: number;
    pages: number;
  };
}

export function TemplateList() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { hasPermission } = useCMSPermissions();
  
  // Detect if we're in admin or super-admin section
  const basePath = pathname?.startsWith('/super-admin') ? '/super-admin' : '/admin';
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const canCreate = hasPermission('cms.templates.create');
  const canEdit = hasPermission('cms.templates.edit');
  const canDelete = hasPermission('cms.templates.delete');

  // Template categories
  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'landing', label: 'Landing Pages' },
    { value: 'blog', label: 'Blog' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);

      const response = await fetch(`/api/cms/templates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  // Handle delete
  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(templates.filter((t) => t.id !== templateId));
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle duplicate
  const handleDuplicate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/cms/templates/${templateId}/duplicate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setTemplates([...templates, data.data]);
        toast({
          title: 'Success',
          description: 'Template duplicated successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Manage reusable page templates
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => router.push(`${basePath}/cms/templates/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Templates Grid/List */}
      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || category !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first template'}
              </p>
              {canCreate && !search && category === 'all' && (
                <Button onClick={() => router.push(`${basePath}/cms/templates/new`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="aspect-video bg-muted relative">
                {template.thumbnail ? (
                  <Image
                    src={template.thumbnail}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 z-10" variant="secondary">
                  {template.category}
                </Badge>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/cms/templates/${template.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onClick={() => router.push(`/admin/cms/templates/${template.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canCreate && (
                        <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{template._count?.sections || 0} sections</span>
                  <span>•</span>
                  <span>{template._count?.pages || 0} pages</span>
                </div>
                <span>{format(new Date(template.updatedAt), 'MMM d, yyyy')}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                    {template.thumbnail ? (
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{template.name}</h3>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{template._count?.sections || 0} sections</span>
                      <span>•</span>
                      <span>{template._count?.pages || 0} pages</span>
                      <span>•</span>
                      <span>Updated {format(new Date(template.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/cms/templates/${template.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onClick={() => router.push(`/admin/cms/templates/${template.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canCreate && (
                        <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
