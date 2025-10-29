/**
 * CMS Version History Component
 * Display and manage page version history
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  History, 
  RotateCcw, 
  Eye, 
  GitCompare,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PageVersion {
  id: string;
  versionNumber: number;
  pageTitle: string;
  slug: string;
  status: string;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  changeDescription?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  isCurrent: boolean;
}

interface VersionHistoryProps {
  pageId: string;
}

export function VersionHistory({ pageId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [compareVersion, setCompareVersion] = useState<PageVersion | null>(null);

  const { hasPermission } = useCMSPermissions();
  const { toast } = useToast();

  const canView = hasPermission('cms.versions.view');
  const canRestore = hasPermission('cms.versions.rollback');

  useEffect(() => {
    if (canView) {
      fetchVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, canView]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/versions/${selectedVersion.id}/restore`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Restored to version ${selectedVersion.versionNumber}`,
        });
        setShowRestoreDialog(false);
        fetchVersions();
      } else {
        throw new Error(data.message || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore version',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleCompare = (version: PageVersion) => {
    const currentVersion = versions.find(v => v.isCurrent);
    if (currentVersion) {
      setSelectedVersion(version);
      setCompareVersion(currentVersion);
      setShowDiffDialog(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view version history
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Version History
              </CardTitle>
              <CardDescription>
                View and restore previous versions of this page
              </CardDescription>
            </div>
            <Badge variant="outline">
              {versions.length} {versions.length === 1 ? 'version' : 'versions'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No version history available</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">
                            v{version.versionNumber}
                          </span>
                          {version.isCurrent && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(version.status)}>
                          {version.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm truncate">
                            {version.changeDescription || 'No description'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{version.createdBy.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {version.createdBy.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!version.isCurrent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompare(version)}
                            >
                              <GitCompare className="w-4 h-4 mr-1" />
                              Compare
                            </Button>
                          )}
                          {canRestore && !version.isCurrent && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedVersion(version);
                                setShowRestoreDialog(true);
                              }}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                          )}
                          {version.isCurrent && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Current
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore to version {selectedVersion?.versionNumber}?
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version</span>
                  <span className="font-mono">v{selectedVersion.versionNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={getStatusColor(selectedVersion.status)}>
                    {selectedVersion.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Author</span>
                  <span className="text-sm">{selectedVersion.createdBy.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date</span>
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(selectedVersion.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Restoring this version will create a new version and set it as current.
                  The current version will be preserved in history.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={restoring}
            >
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Restore Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare/Diff Dialog */}
      <Dialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Comparing v{selectedVersion?.versionNumber} with v{compareVersion?.versionNumber} (current)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Version being compared */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold">
                    Version {selectedVersion?.versionNumber}
                  </h3>
                  <Badge variant="secondary">Previous</Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Title:</span>
                    <p className="mt-1">{selectedVersion?.pageTitle}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Slug:</span>
                    <p className="mt-1 font-mono text-xs">{selectedVersion?.slug}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(selectedVersion?.status || '')}>
                        {selectedVersion?.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Changes:</span>
                    <p className="mt-1">{selectedVersion?.changeDescription || 'No description'}</p>
                  </div>
                </div>
              </div>

              {/* Current version */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold">
                    Version {compareVersion?.versionNumber}
                  </h3>
                  <Badge variant="default">Current</Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Title:</span>
                    <p className="mt-1">{compareVersion?.pageTitle}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Slug:</span>
                    <p className="mt-1 font-mono text-xs">{compareVersion?.slug}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(compareVersion?.status || '')}>
                        {compareVersion?.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Changes:</span>
                    <p className="mt-1">{compareVersion?.changeDescription || 'No description'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiffDialog(false)}>
              Close
            </Button>
            {canRestore && selectedVersion && (
              <Button
                onClick={() => {
                  setShowDiffDialog(false);
                  setShowRestoreDialog(true);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore This Version
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
