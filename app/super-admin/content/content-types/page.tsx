'use client';

import { useState } from 'react';
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
  Database,
  Search,
  Plus,
  Settings,
  Trash2,
  Copy,
  Edit,
  Save,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  FileText,
  Image as ImageIcon,
  List,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  Eye
} from 'lucide-react';

interface Field {
  id: string;
  name: string;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'textarea' | 'image' | 'select';
  required: boolean;
  validation: string;
  defaultValue: string;
  order: number;
}

interface ContentType {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  fields: Field[];
  permissions: {
    create: string[];
    read: string[];
    update: string[];
    delete: string[];
  };
  template: string;
  entryCount: number;
  createdDate: string;
  lastModified: string;
}

export default function ContentTypesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Mock data - Replace with actual API calls
  const contentTypes: ContentType[] = [
    {
      id: 'CT-001',
      name: 'Blog Post',
      slug: 'blog-post',
      description: 'Standard blog post content type with rich text and media',
      icon: 'FileText',
      fields: [
        { id: 'F1', name: 'Title', fieldType: 'text', required: true, validation: 'min:10,max:100', defaultValue: '', order: 1 },
        { id: 'F2', name: 'Content', fieldType: 'textarea', required: true, validation: 'min:100', defaultValue: '', order: 2 },
        { id: 'F3', name: 'Featured Image', fieldType: 'image', required: false, validation: '', defaultValue: '', order: 3 },
        { id: 'F4', name: 'Publish Date', fieldType: 'date', required: true, validation: '', defaultValue: '', order: 4 },
        { id: 'F5', name: 'Published', fieldType: 'boolean', required: false, validation: '', defaultValue: 'false', order: 5 }
      ],
      permissions: {
        create: ['admin', 'editor'],
        read: ['admin', 'editor', 'author'],
        update: ['admin', 'editor'],
        delete: ['admin']
      },
      template: 'blog-post-template',
      entryCount: 45,
      createdDate: '2025-01-15',
      lastModified: '2025-10-20'
    },
    {
      id: 'CT-002',
      name: 'Product',
      slug: 'product',
      description: 'E-commerce product with pricing and inventory',
      icon: 'Database',
      fields: [
        { id: 'F1', name: 'Product Name', fieldType: 'text', required: true, validation: 'max:100', defaultValue: '', order: 1 },
        { id: 'F2', name: 'Price', fieldType: 'number', required: true, validation: 'min:0', defaultValue: '0', order: 2 },
        { id: 'F3', name: 'Description', fieldType: 'textarea', required: true, validation: '', defaultValue: '', order: 3 },
        { id: 'F4', name: 'In Stock', fieldType: 'boolean', required: false, validation: '', defaultValue: 'true', order: 4 },
        { id: 'F5', name: 'Product Image', fieldType: 'image', required: false, validation: '', defaultValue: '', order: 5 },
        { id: 'F6', name: 'SKU', fieldType: 'text', required: true, validation: '', defaultValue: '', order: 6 }
      ],
      permissions: {
        create: ['admin', 'manager'],
        read: ['admin', 'manager', 'sales'],
        update: ['admin', 'manager'],
        delete: ['admin']
      },
      template: 'product-template',
      entryCount: 128,
      createdDate: '2025-02-01',
      lastModified: '2025-10-22'
    },
    {
      id: 'CT-003',
      name: 'Team Member',
      slug: 'team-member',
      description: 'Team member profile with bio and contact info',
      icon: 'User',
      fields: [
        { id: 'F1', name: 'Full Name', fieldType: 'text', required: true, validation: 'max:50', defaultValue: '', order: 1 },
        { id: 'F2', name: 'Position', fieldType: 'text', required: true, validation: '', defaultValue: '', order: 2 },
        { id: 'F3', name: 'Bio', fieldType: 'textarea', required: false, validation: 'max:500', defaultValue: '', order: 3 },
        { id: 'F4', name: 'Profile Photo', fieldType: 'image', required: false, validation: '', defaultValue: '', order: 4 },
        { id: 'F5', name: 'Email', fieldType: 'text', required: true, validation: 'email', defaultValue: '', order: 5 }
      ],
      permissions: {
        create: ['admin', 'hr'],
        read: ['admin', 'hr', 'manager'],
        update: ['admin', 'hr'],
        delete: ['admin']
      },
      template: 'team-member-template',
      entryCount: 24,
      createdDate: '2025-03-10',
      lastModified: '2025-10-15'
    },
    {
      id: 'CT-004',
      name: 'Portfolio Project',
      slug: 'portfolio-project',
      description: 'Showcase project with images and details',
      icon: 'Image',
      fields: [
        { id: 'F1', name: 'Project Title', fieldType: 'text', required: true, validation: 'max:100', defaultValue: '', order: 1 },
        { id: 'F2', name: 'Client', fieldType: 'text', required: false, validation: '', defaultValue: '', order: 2 },
        { id: 'F3', name: 'Description', fieldType: 'textarea', required: true, validation: 'min:50', defaultValue: '', order: 3 },
        { id: 'F4', name: 'Cover Image', fieldType: 'image', required: true, validation: '', defaultValue: '', order: 4 },
        { id: 'F5', name: 'Completion Date', fieldType: 'date', required: false, validation: '', defaultValue: '', order: 5 },
        { id: 'F6', name: 'Featured', fieldType: 'boolean', required: false, validation: '', defaultValue: 'false', order: 6 }
      ],
      permissions: {
        create: ['admin', 'editor'],
        read: ['admin', 'editor', 'viewer'],
        update: ['admin', 'editor'],
        delete: ['admin']
      },
      template: 'portfolio-template',
      entryCount: 36,
      createdDate: '2025-04-05',
      lastModified: '2025-10-18'
    },
    {
      id: 'CT-005',
      name: 'FAQ Item',
      slug: 'faq-item',
      description: 'Frequently asked question and answer',
      icon: 'HelpCircle',
      fields: [
        { id: 'F1', name: 'Question', fieldType: 'text', required: true, validation: 'max:200', defaultValue: '', order: 1 },
        { id: 'F2', name: 'Answer', fieldType: 'textarea', required: true, validation: 'min:20', defaultValue: '', order: 2 },
        { id: 'F3', name: 'Category', fieldType: 'select', required: true, validation: '', defaultValue: 'general', order: 3 },
        { id: 'F4', name: 'Order', fieldType: 'number', required: false, validation: '', defaultValue: '0', order: 4 }
      ],
      permissions: {
        create: ['admin', 'support'],
        read: ['admin', 'support', 'editor'],
        update: ['admin', 'support'],
        delete: ['admin']
      },
      template: 'faq-template',
      entryCount: 18,
      createdDate: '2025-05-12',
      lastModified: '2025-10-10'
    }
  ];

  const filteredTypes = contentTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTypeData = contentTypes.find(t => t.id === selectedType);

  const totalTypes = contentTypes.length;
  const totalFields = contentTypes.reduce((sum, type) => sum + type.fields.length, 0);
  const totalEntries = contentTypes.reduce((sum, type) => sum + type.entryCount, 0);

  const handleSaveType = () => {
    toast({
      title: 'Content Type Saved',
      description: 'Content type configuration has been saved'
    });
    setEditMode(false);
  };

  const handleDeleteType = () => {
    toast({
      title: 'Content Type Deleted',
      description: 'Content type has been removed',
      variant: 'destructive'
    });
  };

  const handleDuplicateType = () => {
    toast({
      title: 'Content Type Duplicated',
      description: 'A copy of the content type has been created'
    });
  };

  const handleAddField = () => {
    toast({
      title: 'Field Added',
      description: 'New field has been added to content type'
    });
  };

  const handleDeleteField = (fieldId: string) => {
    toast({
      title: 'Field Deleted',
      description: `Field ${fieldId} has been removed`,
      variant: 'destructive'
    });
  };

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'boolean':
        return <ToggleLeft className="h-4 w-4" />;
      case 'textarea':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'select':
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Content Types
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Define and manage custom content structures
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="zyphex-card border-indigo-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Content Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading">
                    {totalTypes}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Custom types
                  </p>
                </div>
                <Database className="h-10 w-10 text-indigo-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-purple-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-purple-600">
                    {totalFields}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Field definitions
                  </p>
                </div>
                <Settings className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-blue-600">
                    {totalEntries}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Content entries
                  </p>
                </div>
                <FileText className="h-10 w-10 text-blue-500 opacity-20" />
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
                    placeholder="Search content types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <Button className="zyphex-button-primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Content Type
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Types List */}
          <div className="lg:col-span-1">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-500" />
                  Content Types
                </CardTitle>
                <CardDescription>
                  {filteredTypes.length} type(s) defined
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-450px)]">
                  <div className="space-y-2 pr-4">
                    {filteredTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedType === type.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{type.name}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {type.slug}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {type.entryCount}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {type.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {type.fields.length} fields
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {filteredTypes.length === 0 && (
                      <div className="text-center py-8">
                        <Database className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No content types found
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Content Type Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTypeData ? (
              <>
                {/* Type Details */}
                <Card className="zyphex-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-indigo-500" />
                        Type Configuration
                      </CardTitle>
                      <div className="flex gap-2 items-center">
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
                          Type Name
                        </Label>
                        <Input
                          value={selectedTypeData.name}
                          disabled={!editMode}
                          className="zyphex-input"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Slug
                        </Label>
                        <Input
                          value={selectedTypeData.slug}
                          disabled={!editMode}
                          className="zyphex-input"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Description
                      </Label>
                      <Input
                        value={selectedTypeData.description}
                        disabled={!editMode}
                        className="zyphex-input"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        Template
                      </Label>
                      <Input
                        value={selectedTypeData.template}
                        disabled={!editMode}
                        className="zyphex-input"
                      />
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Entries:</span>
                        <span className="ml-2 font-semibold">{selectedTypeData.entryCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Fields:</span>
                        <span className="ml-2 font-semibold">{selectedTypeData.fields.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Created:</span>
                        <span className="ml-2 font-semibold text-xs">{selectedTypeData.createdDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Modified:</span>
                        <span className="ml-2 font-semibold text-xs">{selectedTypeData.lastModified}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fields Configuration */}
                <Card className="zyphex-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5 text-indigo-500" />
                        Field Configuration
                      </CardTitle>
                      {editMode && (
                        <Button size="sm" variant="outline" onClick={handleAddField}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 pr-4">
                        {selectedTypeData.fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                {getFieldIcon(field.fieldType)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">{field.name}</span>
                                    {field.required && (
                                      <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                                        Required
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {field.fieldType}
                                    </Badge>
                                  </div>
                                  {field.validation && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      Validation: {field.validation}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {editMode && (
                                <div className="flex gap-1">
                                  {index > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {index < selectedTypeData.fields.length - 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600"
                                    onClick={() => handleDeleteField(field.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {field.defaultValue && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Default: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{field.defaultValue}</code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Permissions */}
                <Card className="zyphex-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-500" />
                      Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          Create
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTypeData.permissions.create.map((role, index) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {role}
                              {editMode && (
                                <X className="h-3 w-3 ml-1 cursor-pointer" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-600" />
                          Read
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTypeData.permissions.read.map((role, index) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {role}
                              {editMode && (
                                <X className="h-3 w-3 ml-1 cursor-pointer" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Edit className="h-4 w-4 text-yellow-600" />
                          Update
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTypeData.permissions.update.map((role, index) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {role}
                              {editMode && (
                                <X className="h-3 w-3 ml-1 cursor-pointer" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Trash2 className="h-4 w-4 text-red-600" />
                          Delete
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTypeData.permissions.delete.map((role, index) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {role}
                              {editMode && (
                                <X className="h-3 w-3 ml-1 cursor-pointer" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button className="zyphex-button-primary" onClick={handleSaveType}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleDuplicateType}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Type
                  </Button>
                  <Button variant="outline" onClick={handleDeleteType}>
                    <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                    Delete Type
                  </Button>
                </div>
              </>
            ) : (
              <Card className="zyphex-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Database className="h-24 w-24 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Content Type Selected</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Select a content type from the list to view and configure its fields
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
