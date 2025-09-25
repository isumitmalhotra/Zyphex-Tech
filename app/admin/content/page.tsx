"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useCMSApi, useContentTypes, useContentState, validateContentData, generateSlug } from "@/hooks/use-cms";
import { ContentType, ContentField, ContentTypeSettings } from "@/types/cms";

// Interfaces
interface FieldOption {
  label: string;
  value: string;
}

interface FormData {
  title: string;
  data: Record<string, unknown>;
}

// Import icons
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Settings,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";

// Content Management Interface Components
interface ContentFormProps {
  contentType: {
    id: string;
    name: string;
    label: string;
    fields: ContentField[];
    settings: ContentTypeSettings;
  };
  initialData?: {
    id?: string;
    title?: string;
    data?: string | Record<string, unknown>;
    slug?: string;
    status?: string;
  };
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function ContentForm({ contentType, initialData, onSave, onCancel, isLoading }: ContentFormProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    const initial: FormData = { title: '', data: {} };
    
    if (initialData) {
      initial.title = initialData.title || '';
      initial.data = typeof initialData.data === 'string' 
        ? JSON.parse(initialData.data || '{}') 
        : initialData.data || {};
    }
    
    return initial;
  });

  const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([]);

  const fields = Array.isArray(contentType.fields) ? contentType.fields : JSON.parse(contentType.fields || '[]');
  const settings = typeof contentType.settings === 'object' ? contentType.settings : JSON.parse(contentType.settings || '{}');

  const handleFieldChange = (fieldName: string, value: unknown) => {
    if (fieldName === 'title') {
      setFormData(prev => ({ ...prev, title: value as string }));
    } else {
      setFormData(prev => ({
        ...prev,
        data: { ...prev.data, [fieldName]: value }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateContentData(formData.data, fields);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Prepare save data
    const saveData: Record<string, unknown> = {
      title: formData.title,
      data: formData.data,
    };

    // Add slug if content type supports it
    if (settings.hasSlug && !initialData?.slug) {
      saveData.slug = generateSlug(formData.title);
    }

    // Add default status
    if (settings.hasStatus && !initialData?.status) {
      saveData.status = settings.defaultStatus || 'draft';
    }

    try {
      await onSave(saveData);
      setErrors([]);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const renderField = (field: ContentField) => {
    const value = field.name === 'title' ? formData.title : formData.data[field.name] || '';
    const error = errors.find(e => e.field === field.name);

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {field.helpText && <p className="text-sm text-gray-500">{field.helpText}</p>}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={error ? 'border-red-500' : ''}
            />
            {field.helpText && <p className="text-sm text-gray-500">{field.helpText}</p>}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={typeof value === 'string' ? value : ''} onValueChange={(val) => handleFieldChange(field.name, val)}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.validation?.options?.map((option: FieldOption) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && <p className="text-sm text-gray-500">{field.helpText}</p>}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={!!value}
                onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              />
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {field.helpText && <p className="text-sm text-gray-500">{field.helpText}</p>}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={typeof value === 'number' ? value.toString() : ''}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className={error ? 'border-red-500' : ''}
            />
            {field.helpText && <p className="text-sm text-gray-500">{field.helpText}</p>}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label} (Unsupported field type: {field.type})</Label>
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title field (always present) */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Enter content title"
          required
        />
      </div>

      {/* Dynamic fields */}
      {fields.map(renderField)}

      {/* Action buttons */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Content List Component
interface ContentListProps {
  contentType: ContentType;
}

function ContentList({ contentType }: ContentListProps) {
  const api = useCMSApi();
  const contentState = useContentState(contentType.id);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await api.createContent({
        contentTypeId: contentType.id,
        title: data.title as string,
        data: data.data as Record<string, unknown>,
        slug: data.slug as string,
        status: data.status as string
      });
      toast({
        title: "Success",
        description: "Content created successfully",
      });
      setShowForm(false);
      contentState.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editingItem || typeof editingItem.id !== 'string') return;
    
    try {
      await api.updateContent(editingItem.id as string, data);
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
      setEditingItem(null);
      contentState.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await api.deleteContent(id);
      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
      contentState.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  const filteredItems = contentState.items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm || editingItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <h3 className="text-lg font-medium">
            {editingItem ? 'Edit' : 'Create'} {contentType.label}
          </h3>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <ContentForm
              contentType={contentType}
              initialData={editingItem ? {
                id: editingItem.id as string,
                title: editingItem.title as string,
                data: editingItem.data as Record<string, unknown>,
                slug: editingItem.slug as string,
                status: editingItem.status as string
              } : undefined}
              onSave={editingItem ? handleEdit : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              isLoading={api.loading}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{contentType.label}</h2>
          <p className="text-gray-600">{contentType.description}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create {contentType.label}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Content List */}
      {contentState.loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading...
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No content found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      {item.featured && <Badge variant="outline">Featured</Badge>}
                      <span className="text-sm text-gray-500">
                        Updated {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem({
                        id: item.id,
                        title: item.title,
                        slug: item.slug,
                        status: item.status,
                        data: item.data
                      })}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {contentState.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(contentState.currentPage - 1) * contentState.pageSize + 1} to{' '}
            {Math.min(contentState.currentPage * contentState.pageSize, contentState.total)} of{' '}
            {contentState.total} results
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => contentState.setCurrentPage(contentState.currentPage - 1)}
              disabled={contentState.currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm">
              Page {contentState.currentPage} of {contentState.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => contentState.setCurrentPage(contentState.currentPage + 1)}
              disabled={contentState.currentPage === contentState.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main CMS Interface
export default function AdminContent() {
  const { contentTypes, loading, error } = useContentTypes();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (contentTypes.length > 0 && !activeTab) {
      setActiveTab(contentTypes[0].id);
    }
  }, [contentTypes, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin mr-3" />
        <p>Loading content management system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading CMS: {error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (contentTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No content types configured.</p>
        <p className="text-sm text-gray-500">
          Content types need to be set up before you can manage content.
        </p>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-gray-600">Manage all your website content from one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-auto">
          {contentTypes.map((contentType) => (
            <TabsTrigger key={contentType.id} value={contentType.id} className="flex items-center gap-2">
              {contentType.icon && <span>{contentType.icon}</span>}
              {contentType.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {contentTypes.map((contentType) => (
          <TabsContent key={contentType.id} value={contentType.id}>
            <ContentList contentType={contentType} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
