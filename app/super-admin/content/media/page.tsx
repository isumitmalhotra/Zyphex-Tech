'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import {
  Image as ImageIcon,
  Search,
  Upload,
  Folder,
  FolderPlus,
  Grid3x3,
  List,
  Download,
  Trash2,
  Edit,
  Tag,
  FileText,
  Video,
  FileArchive,
  Calendar,
  HardDrive,
  TrendingUp,
  Eye,
  Check,
  Star,
  User
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type MediaType = 'image' | 'video' | 'document' | 'archive';

interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  size: number;
  dimensions?: string;
  url: string;
  thumbnail: string;
  uploadedBy: string;
  uploadedDate: string;
  lastModified: string;
  tags: string[];
  folder: string;
  usageCount: number;
  starred: boolean;
}

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentFolder] = useState('root');

  // Mock data - Replace with actual API calls
  const mediaFiles: MediaFile[] = [
    {
      id: 'MED-001',
      name: 'hero-banner.jpg',
      type: 'image',
      size: 2456789,
      dimensions: '1920x1080',
      url: '/media/hero-banner.jpg',
      thumbnail: '/media/thumbs/hero-banner.jpg',
      uploadedBy: 'Admin User',
      uploadedDate: '2025-10-25',
      lastModified: '2025-10-25',
      tags: ['hero', 'banner', 'homepage'],
      folder: 'root',
      usageCount: 45,
      starred: true
    },
    {
      id: 'MED-002',
      name: 'team-photo.jpg',
      type: 'image',
      size: 1893456,
      dimensions: '1600x900',
      url: '/media/team-photo.jpg',
      thumbnail: '/media/thumbs/team-photo.jpg',
      uploadedBy: 'John Smith',
      uploadedDate: '2025-10-24',
      lastModified: '2025-10-24',
      tags: ['team', 'about', 'company'],
      folder: 'root',
      usageCount: 23,
      starred: true
    },
    {
      id: 'MED-003',
      name: 'product-demo.mp4',
      type: 'video',
      size: 15678912,
      dimensions: '1280x720',
      url: '/media/product-demo.mp4',
      thumbnail: '/media/thumbs/product-demo.jpg',
      uploadedBy: 'Sarah Johnson',
      uploadedDate: '2025-10-23',
      lastModified: '2025-10-23',
      tags: ['demo', 'product', 'video'],
      folder: 'root',
      usageCount: 12,
      starred: false
    },
    {
      id: 'MED-004',
      name: 'company-profile.pdf',
      type: 'document',
      size: 456789,
      url: '/media/company-profile.pdf',
      thumbnail: '/media/thumbs/pdf-icon.png',
      uploadedBy: 'Admin User',
      uploadedDate: '2025-10-22',
      lastModified: '2025-10-22',
      tags: ['profile', 'company', 'document'],
      folder: 'root',
      usageCount: 34,
      starred: false
    },
    {
      id: 'MED-005',
      name: 'logo-variants.zip',
      type: 'archive',
      size: 3456789,
      url: '/media/logo-variants.zip',
      thumbnail: '/media/thumbs/zip-icon.png',
      uploadedBy: 'Design Team',
      uploadedDate: '2025-10-21',
      lastModified: '2025-10-21',
      tags: ['logo', 'branding', 'design'],
      folder: 'root',
      usageCount: 8,
      starred: false
    },
    {
      id: 'MED-006',
      name: 'services-illustration.svg',
      type: 'image',
      size: 123456,
      dimensions: 'Vector',
      url: '/media/services-illustration.svg',
      thumbnail: '/media/thumbs/services-illustration.svg',
      uploadedBy: 'Design Team',
      uploadedDate: '2025-10-20',
      lastModified: '2025-10-20',
      tags: ['illustration', 'services', 'svg'],
      folder: 'root',
      usageCount: 18,
      starred: true
    },
    {
      id: 'MED-007',
      name: 'client-testimonial.mp4',
      type: 'video',
      size: 8934567,
      dimensions: '1920x1080',
      url: '/media/client-testimonial.mp4',
      thumbnail: '/media/thumbs/client-testimonial.jpg',
      uploadedBy: 'Marketing Team',
      uploadedDate: '2025-10-19',
      lastModified: '2025-10-19',
      tags: ['testimonial', 'client', 'video'],
      folder: 'root',
      usageCount: 15,
      starred: false
    },
    {
      id: 'MED-008',
      name: 'pricing-table.png',
      type: 'image',
      size: 678912,
      dimensions: '1200x800',
      url: '/media/pricing-table.png',
      thumbnail: '/media/thumbs/pricing-table.png',
      uploadedBy: 'Admin User',
      uploadedDate: '2025-10-18',
      lastModified: '2025-10-18',
      tags: ['pricing', 'table', 'screenshot'],
      folder: 'root',
      usageCount: 0,
      starred: false
    },
    {
      id: 'MED-009',
      name: 'whitepaper.pdf',
      type: 'document',
      size: 2345678,
      url: '/media/whitepaper.pdf',
      thumbnail: '/media/thumbs/pdf-icon.png',
      uploadedBy: 'Content Team',
      uploadedDate: '2025-10-17',
      lastModified: '2025-10-17',
      tags: ['whitepaper', 'research', 'document'],
      folder: 'root',
      usageCount: 27,
      starred: false
    },
    {
      id: 'MED-010',
      name: 'office-tour.mp4',
      type: 'video',
      size: 12345678,
      dimensions: '1920x1080',
      url: '/media/office-tour.mp4',
      thumbnail: '/media/thumbs/office-tour.jpg',
      uploadedBy: 'HR Team',
      uploadedDate: '2025-10-16',
      lastModified: '2025-10-16',
      tags: ['office', 'tour', 'careers'],
      folder: 'root',
      usageCount: 9,
      starred: false
    }
  ];

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || file.type === selectedType;
    const matchesFolder = file.folder === currentFolder;
    return matchesSearch && matchesType && matchesFolder;
  });

  const totalFiles = mediaFiles.length;
  const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);
  const imageFiles = mediaFiles.filter(f => f.type === 'image').length;
  const videoFiles = mediaFiles.filter(f => f.type === 'video').length;
  const unusedFiles = mediaFiles.filter(f => f.usageCount === 0).length;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = () => {
    toast({
      title: 'Upload Started',
      description: 'Your files are being uploaded'
    });
  };

  const handleDelete = (fileId: string) => {
    toast({
      title: 'File Deleted',
      description: `File ${fileId} has been deleted`,
      variant: 'destructive'
    });
  };

  const handleBulkDelete = () => {
    toast({
      title: 'Files Deleted',
      description: `${selectedFiles.length} file(s) deleted`,
      variant: 'destructive'
    });
    setSelectedFiles([]);
  };

  const handleDownload = (fileId: string) => {
    toast({
      title: 'Download Started',
      description: `Downloading file ${fileId}`
    });
  };

  const handleEdit = (fileId: string) => {
    toast({
      title: 'Opening Editor',
      description: `Opening image editor for ${fileId}`
    });
  };

  const handleToggleStar = () => {
    toast({
      title: 'Updated',
      description: 'File starred status updated'
    });
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const getFileIcon = (type: MediaType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'archive':
        return <FileArchive className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: MediaType) => {
    switch (type) {
      case 'image':
        return 'text-blue-600';
      case 'video':
        return 'text-purple-600';
      case 'document':
        return 'text-green-600';
      case 'archive':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Media Library
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your images, videos, and documents
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="zyphex-card border-pink-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading">
                    {totalFiles}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Media files
                  </p>
                </div>
                <ImageIcon className="h-10 w-10 text-pink-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Storage Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-blue-600">
                    {formatFileSize(totalSize)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Of 10 GB
                  </p>
                </div>
                <HardDrive className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
              <Progress value={(totalSize / 10737418240) * 100} className="mt-3" />
            </CardContent>
          </Card>

          <Card className="zyphex-card border-purple-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Images/Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-purple-600">
                    {imageFiles}/{videoFiles}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Media breakdown
                  </p>
                </div>
                <Video className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-orange-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unused Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-orange-600">
                    {unusedFiles}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Not in use
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <Card className="zyphex-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by filename or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedType === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('image')}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Images
                </Button>
                <Button
                  variant={selectedType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('video')}
                >
                  <Video className="h-4 w-4 mr-1" />
                  Videos
                </Button>
                <Button
                  variant={selectedType === 'document' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('document')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Docs
                </Button>

                <Separator orientation="vertical" className="h-8" />

                {selectedFiles.length > 0 && (
                  <>
                    <Badge variant="outline">
                      {selectedFiles.length} selected
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-1 text-red-600" />
                      Delete
                    </Button>
                  </>
                )}

                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button className="zyphex-button-primary" size="sm" onClick={handleUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid/List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-pink-500" />
              Media Files ({filteredFiles.length})
            </CardTitle>
            <CardDescription>
              Browse and manage your media library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-550px)]">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`relative group rounded-lg border overflow-hidden cursor-pointer transition-all ${
                        selectedFiles.includes(file.id)
                          ? 'ring-2 ring-pink-500 border-pink-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-pink-500'
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                        {file.type === 'image' ? (
                          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-pink-500" />
                          </div>
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${getTypeColor(file.type)}`}>
                            {getFileIcon(file.type)}
                          </div>
                        )}
                        
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2">
                          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                            selectedFiles.includes(file.id)
                              ? 'bg-pink-500 border-pink-500'
                              : 'bg-white dark:bg-gray-800 border-gray-300'
                          }`}>
                            {selectedFiles.includes(file.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Star Icon */}
                        {file.starred && (
                          <div className="absolute top-2 right-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          </div>
                        )}

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(file.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.id);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="p-3 bg-white dark:bg-gray-800">
                        <p className="text-sm font-semibold truncate mb-1">
                          {file.name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {file.usageCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedFiles.includes(file.id)
                          ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-500'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-pink-500'
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Selection Checkbox */}
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedFiles.includes(file.id)
                            ? 'bg-pink-500 border-pink-500'
                            : 'bg-white dark:bg-gray-800 border-gray-300'
                        }`}>
                          {selectedFiles.includes(file.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        {/* File Icon */}
                        <div className={`${getTypeColor(file.type)}`}>
                          {getFileIcon(file.type)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold truncate">{file.name}</p>
                            {file.starred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(file.size)}
                            </span>
                            {file.dimensions && (
                              <span>{file.dimensions}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {file.uploadedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {file.uploadedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Used {file.usageCount} times
                            </span>
                          </div>
                          {file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {file.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar();
                            }}
                          >
                            <Star className={`h-4 w-4 ${file.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(file.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.id);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredFiles.length === 0 && (
                <div className="text-center py-16">
                  <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Files Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || selectedType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Upload your first media file to get started'}
                  </p>
                  <Button className="zyphex-button-primary" onClick={handleUpload}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
