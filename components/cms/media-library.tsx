/**
 * CMS Media Library
 * Browse, upload, and manage media files
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Upload,
  Grid3x3,
  List,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  File,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Download,
  Loader2,
} from 'lucide-react';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { MediaUpload } from './media-upload';

interface MediaFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
  uploadedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MediaLibraryProps {
  onSelect?: (file: MediaFile) => void;
  allowMultiple?: boolean;
  acceptedTypes?: string[];
}

export function MediaLibrary({ 
  onSelect,
  allowMultiple = false,
  acceptedTypes 
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  
  const { hasPermission } = useCMSPermissions();
  const { toast } = useToast();

  const canCreate = hasPermission('cms.media.upload');
  const canEdit = hasPermission('cms.media.edit');
  const canDelete = hasPermission('cms.media.delete');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fileTypeFilter !== 'all') {
        params.append('fileType', fileTypeFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/cms/media?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTypeFilter]);

  const handleSearch = () => {
    fetchFiles();
  };

  const handleFileSelect = (file: MediaFile) => {
    if (onSelect) {
      if (allowMultiple) {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(file.id)) {
          newSelected.delete(file.id);
        } else {
          newSelected.add(file.id);
        }
        setSelectedFiles(newSelected);
      } else {
        onSelect(file);
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Success',
      description: 'URL copied to clipboard',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/media/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'File deleted successfully',
        });
        fetchFiles();
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    if (acceptedTypes && acceptedTypes.length > 0) {
      return acceptedTypes.some(type => file.mimeType.includes(type));
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            Search
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {canCreate && (
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredFiles.length} files</span>
        {selectedFiles.size > 0 && (
          <span>{selectedFiles.size} selected</span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || fileTypeFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Upload your first file to get started'
              }
            </p>
            {canCreate && !searchQuery && fileTypeFilter === 'all' && (
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <Card 
              key={file.id}
              className={`group cursor-pointer hover:shadow-md transition-shadow ${
                selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="aspect-square relative bg-muted rounded-t-lg overflow-hidden">
                  {file.mimeType.startsWith('image/') ? (
                    <Image
                      src={file.fileUrl}
                      alt={file.altText || file.fileName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getFileIcon(file.mimeType)}
                    </div>
                  )}
                  
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.fileUrl, '_blank');
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(file.fileUrl);
                        }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = file.fileUrl;
                          a.download = file.fileName;
                          a.click();
                        }}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* File type badge */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {file.fileType}
                    </Badge>
                  </div>
                </div>

                {/* File info */}
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(file.fileSize)}</span>
                    {file.width && file.height && (
                      <span>{file.width} × {file.height}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <Card 
              key={file.id}
              className={`group cursor-pointer hover:shadow-md transition-shadow ${
                selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 relative bg-muted rounded overflow-hidden flex-shrink-0">
                    {file.mimeType.startsWith('image/') ? (
                      <Image
                        src={file.fileUrl}
                        alt={file.altText || file.fileName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{file.fileName}</p>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {file.fileType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.fileSize)}</span>
                      {file.width && file.height && (
                        <span>{file.width} × {file.height}</span>
                      )}
                      <span>Uploaded {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                      <span>by {file.uploadedBy.name}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.fileUrl, '_blank');
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(file.fileUrl);
                        }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = file.fileUrl;
                          a.download = file.fileName;
                          a.click();
                        }}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <MediaUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        onSuccess={() => {
          fetchFiles();
          setShowUpload(false);
        }}
        acceptedTypes={acceptedTypes}
      />
    </div>
  );
}
