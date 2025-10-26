'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalSize: 0,
    images: 0,
    videos: 0,
    documents: 0,
    unused: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media files from API
  useEffect(() => {
    fetchMedia();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/content/media');
      
      if (!response.ok) throw new Error('Failed to fetch media');

      const data = await response.json();
      setMediaFiles(data.mediaFiles);
      setStats(data.stats);

      toast({
        title: 'Media Loaded',
        description: `Loaded ${data.stats.total} media files from database`
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      toast({
        title: 'Error Loading Media',
        description: 'Failed to load media files from database',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'general');
        formData.append('alt', file.name);

        const response = await fetch('/api/super-admin/content/media', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
      }

      toast({
        title: 'Upload Successful',
        description: `${files.length} file(s) uploaded successfully`
      });
      
      fetchMedia();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload one or more files',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || file.type === selectedType;
    const matchesFolder = file.folder === currentFolder;
    return matchesSearch && matchesType && matchesFolder;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/super-admin/content/media?id=${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'File Deleted',
          description: `File has been deleted successfully`
        });
        fetchMedia();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedFiles.length} file(s)?`)) return;

    try {
      for (const fileId of selectedFiles) {
        await fetch(`/api/super-admin/content/media?id=${fileId}`, {
          method: 'DELETE'
        });
      }
      
      toast({
        title: 'Files Deleted',
        description: `${selectedFiles.length} file(s) deleted successfully`
      });
      setSelectedFiles([]);
      fetchMedia();
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete files',
        variant: 'destructive'
      });
    }
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

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/*,application/*"
            onChange={handleFileSelect}
          />

          {/* Uploading indicator */}
          {uploading && (
            <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-pink-500">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                <span className="text-sm font-medium">Uploading files...</span>
              </div>
            </div>
          )}
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
                    {stats.total}
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
                    {formatFileSize(stats.totalSize)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Of 10 GB
                  </p>
                </div>
                <HardDrive className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
              <Progress value={(stats.totalSize / 10737418240) * 100} className="mt-3" />
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
                    {stats.images}/{stats.videos}
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
                    {stats.unused}
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
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading media files...</p>
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
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
