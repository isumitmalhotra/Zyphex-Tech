/**
 * CMS Schedule Manager Component
 * Create and manage scheduled publish/unpublish actions
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

interface Schedule {
  id: string;
  scheduleType: 'publish' | 'unpublish';
  scheduledFor: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timezone: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  executedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

interface ScheduleManagerProps {
  pageId: string;
}

export function ScheduleManager({ pageId }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    scheduleType: 'publish' as 'publish' | 'unpublish',
    scheduledDate: '',
    scheduledTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: '',
  });

  const { hasPermission } = useCMSPermissions();
  const { toast } = useToast();

  const canView = hasPermission('cms.schedules.view');
  const canCreate = hasPermission('cms.schedules.create');
  const canEdit = hasPermission('cms.schedules.edit');
  const canDelete = hasPermission('cms.schedules.delete');
  const canCancel = hasPermission('cms.schedules.cancel');

  useEffect(() => {
    if (canView) {
      fetchSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, canView]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/schedules`);
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      scheduleType: 'publish',
      scheduledDate: '',
      scheduledTime: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.scheduledDate || !formData.scheduledTime) {
      toast({
        title: 'Validation Error',
        description: 'Please select date and time',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const scheduledFor = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

      const response = await fetch(`/api/cms/pages/${pageId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleType: formData.scheduleType,
          scheduledFor,
          timezone: formData.timezone,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `${formData.scheduleType === 'publish' ? 'Publish' : 'Unpublish'} scheduled successfully`,
        });
        setShowCreateDialog(false);
        resetForm();
        fetchSchedules();
      } else {
        throw new Error(data.message || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create schedule',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedSchedule || !formData.scheduledDate || !formData.scheduledTime) {
      return;
    }

    setActionLoading(true);
    try {
      const scheduledFor = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

      const response = await fetch(`/api/cms/pages/${pageId}/schedules/${selectedSchedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleType: formData.scheduleType,
          scheduledFor,
          timezone: formData.timezone,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
        });
        setShowEditDialog(false);
        setSelectedSchedule(null);
        resetForm();
        fetchSchedules();
      } else {
        throw new Error(data.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update schedule',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled action?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/pages/${pageId}/schedules/${scheduleId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Schedule cancelled successfully',
        });
        fetchSchedules();
      } else {
        throw new Error(data.message || 'Failed to cancel schedule');
      }
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel schedule',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/pages/${pageId}/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Schedule deleted successfully',
        });
        fetchSchedules();
      } else {
        throw new Error(data.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (schedule: Schedule) => {
    const scheduledDate = new Date(schedule.scheduledFor);
    setFormData({
      scheduleType: schedule.scheduleType,
      scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
      scheduledTime: format(scheduledDate, 'HH:mm'),
      timezone: schedule.timezone,
      notes: schedule.notes || '',
    });
    setSelectedSchedule(schedule);
    setShowEditDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    return action === 'publish' ? 'default' : 'secondary';
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view schedules
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

  const pendingSchedules = schedules.filter(s => s.status === 'pending');
  const completedSchedules = schedules.filter(s => s.status === 'completed');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Actions
              </CardTitle>
              <CardDescription>
                Schedule content to publish or unpublish automatically
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Action
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Schedules */}
          {pendingSchedules.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingSchedules.length})
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <Badge variant={getActionColor(schedule.scheduleType)}>
                            {schedule.scheduleType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {format(new Date(schedule.scheduledFor), 'PPP')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(schedule.scheduledFor), 'p')} ({schedule.timezone})
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(schedule.scheduledFor), { addSuffix: true })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(schedule.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(schedule.status)}
                            {schedule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{schedule.createdBy.name}</p>
                            <p className="text-xs text-muted-foreground">{schedule.createdBy.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(schedule)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canCancel && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(schedule.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(schedule.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Completed/Historical Schedules */}
          {completedSchedules.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                History ({completedSchedules.length})
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Executed At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedSchedules.slice(0, 5).map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <Badge variant={getActionColor(schedule.scheduleType)}>
                            {schedule.scheduleType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(new Date(schedule.scheduledFor), 'PPp')}
                          </p>
                        </TableCell>
                        <TableCell>
                          {schedule.executedAt && (
                            <p className="text-sm">
                              {format(new Date(schedule.executedAt), 'PPp')}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(schedule.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(schedule.status)}
                            {schedule.status}
                          </Badge>
                          {schedule.errorMessage && (
                            <p className="text-xs text-destructive mt-1">{schedule.errorMessage}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{schedule.createdBy.name}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {schedules.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No scheduled actions</h3>
              <p className="mb-4">Schedule content to publish or unpublish automatically</p>
              {canCreate && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Schedule
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Action</DialogTitle>
            <DialogDescription>
              Schedule this page to publish or unpublish automatically
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleType">Action *</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value: 'publish' | 'unpublish') => 
                  setFormData({ ...formData, scheduleType: value })
                }
              >
                <SelectTrigger id="scheduleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="unpublish">Unpublish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Using your browser timezone
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this schedule"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update the scheduled action details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-scheduleType">Action *</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value: 'publish' | 'unpublish') => 
                  setFormData({ ...formData, scheduleType: value })
                }
              >
                <SelectTrigger id="edit-scheduleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="unpublish">Unpublish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time *</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this schedule"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedSchedule(null);
                resetForm();
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
