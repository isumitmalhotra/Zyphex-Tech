/**
 * CMS Settings Component
 * System configuration, user roles, and permission management
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  Shield,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  defaultLanguage: string;
  timezone: string;
  itemsPerPage: number;
  autoSaveInterval: number;
  enableVersioning: boolean;
  enableWorkflows: boolean;
  enableScheduling: boolean;
  maxFileUploadSize: number;
}

interface UserRole {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  assignedAt: string;
  assignedBy: string;
}

interface PermissionGroup {
  category: string;
  permissions: Permission[];
}

interface Permission {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

export function CmsSettings() {
  const { toast } = useToast();
  const { hasPermission } = useCMSPermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: '',
    siteDescription: '',
    defaultLanguage: 'en',
    timezone: 'UTC',
    itemsPerPage: 20,
    autoSaveInterval: 60,
    enableVersioning: true,
    enableWorkflows: true,
    enableScheduling: true,
    maxFileUploadSize: 10,
  });

  // User Roles State
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Permissions State
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<string>('admin');

  // Check permissions
  const canManageSettings = hasPermission('cms.users.manage');
  const canManageRoles = hasPermission('cms.users.manage');
  const canManagePermissions = hasPermission('cms.users.manage');

  useEffect(() => {
    fetchSettings();
    fetchUserRoles();
    fetchAvailableUsers();
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/cms/settings');
      const data = await response.json();

      if (data.success) {
        setGeneralSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await fetch('/api/cms/users/roles');
      const data = await response.json();

      if (data.success) {
        setUserRoles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/cms/users');
      const data = await response.json();

      if (data.success) {
        setAvailableUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/cms/permissions?role=${selectedRoleForPermissions}`);
      const data = await response.json();

      if (data.success) {
        setPermissionGroups(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!canManageSettings) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to manage settings',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/cms/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalSettings),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async () => {
    if (!canManageRoles) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to assign roles',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedUser || !selectedRole) {
      toast({
        title: 'Validation Error',
        description: 'Please select both user and role',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/cms/users/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Role assigned successfully',
        });
        setShowAssignRoleDialog(false);
        setSelectedUser('');
        setSelectedRole('');
        fetchUserRoles();
      } else {
        throw new Error(data.message || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeRole = async (userId: string) => {
    if (!canManageRoles) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to revoke roles',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to revoke this role?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/users/${userId}/roles`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Role revoked successfully',
        });
        fetchUserRoles();
      } else {
        throw new Error(data.message || 'Failed to revoke role');
      }
    } catch (error) {
      console.error('Failed to revoke role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke role',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePermission = async (permissionKey: string, enabled: boolean) => {
    if (!canManagePermissions) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to manage permissions',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/cms/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRoleForPermissions,
          permissionKey,
          enabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setPermissionGroups((groups) =>
          groups.map((group) => ({
            ...group,
            permissions: group.permissions.map((perm) =>
              perm.key === permissionKey ? { ...perm, enabled } : perm
            ),
          }))
        );

        toast({
          title: 'Success',
          description: `Permission ${enabled ? 'enabled' : 'disabled'} successfully`,
        });
      } else {
        throw new Error(data.message || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Failed to update permission:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update permission',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role.toUpperCase()) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'default';
      case 'PROJECT_MANAGER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">CMS Settings</h2>
        <p className="text-muted-foreground">
          Manage system configuration, user roles, and permissions
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general" disabled={!canManageSettings}>
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="roles" disabled={!canManageRoles}>
            <Users className="w-4 h-4 mr-2" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" disabled={!canManagePermissions}>
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Configuration</CardTitle>
              <CardDescription>
                Basic site settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                    }
                    placeholder="My Website"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select
                    value={generalSettings.defaultLanguage}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, defaultLanguage: value })
                    }
                  >
                    <SelectTrigger id="defaultLanguage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })
                  }
                  placeholder="A brief description of your site"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, timezone: value })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemsPerPage">Items Per Page</Label>
                  <Input
                    id="itemsPerPage"
                    type="number"
                    min="10"
                    max="100"
                    value={generalSettings.itemsPerPage}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        itemsPerPage: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CMS Features</CardTitle>
              <CardDescription>
                Enable or disable CMS functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableVersioning" className="text-base">
                    Version Control
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keep track of page version history
                  </p>
                </div>
                <Switch
                  id="enableVersioning"
                  checked={generalSettings.enableVersioning}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, enableVersioning: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableWorkflows" className="text-base">
                    Workflow Management
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable submission and approval workflows
                  </p>
                </div>
                <Switch
                  id="enableWorkflows"
                  checked={generalSettings.enableWorkflows}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, enableWorkflows: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableScheduling" className="text-base">
                    Scheduled Publishing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow scheduling publish/unpublish actions
                  </p>
                </div>
                <Switch
                  id="enableScheduling"
                  checked={generalSettings.enableScheduling}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, enableScheduling: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>
                Configure performance-related options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="autoSaveInterval">
                    Auto-save Interval (seconds)
                  </Label>
                  <Input
                    id="autoSaveInterval"
                    type="number"
                    min="30"
                    max="300"
                    value={generalSettings.autoSaveInterval}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        autoSaveInterval: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileUploadSize">
                    Max File Upload Size (MB)
                  </Label>
                  <Input
                    id="maxFileUploadSize"
                    type="number"
                    min="1"
                    max="100"
                    value={generalSettings.maxFileUploadSize}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        maxFileUploadSize: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveGeneralSettings} disabled={saving || !canManageSettings}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* User Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Role Assignments</CardTitle>
                  <CardDescription>
                    Manage user roles and access levels
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAssignRoleDialog(true)}
                  disabled={!canManageRoles}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {userRoles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned At</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((userRole) => (
                      <TableRow key={userRole.userId}>
                        <TableCell className="font-medium">
                          {userRole.userName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {userRole.userEmail}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(userRole.role)}>
                            {userRole.role.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(userRole.assignedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {userRole.assignedBy}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeRole(userRole.userId)}
                            disabled={!canManageRoles}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No role assignments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permission Management</CardTitle>
                  <CardDescription>
                    Configure permissions for each role
                  </CardDescription>
                </div>
                <Select
                  value={selectedRoleForPermissions}
                  onValueChange={(value) => {
                    setSelectedRoleForPermissions(value);
                    fetchPermissions();
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                    <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {permissionGroups.map((group) => (
                <div key={group.category} className="space-y-3">
                  <h3 className="text-lg font-semibold capitalize">
                    {group.category.replace('_', ' ')}
                  </h3>
                  <div className="space-y-2">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.key}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-medium">
                              {permission.name}
                            </Label>
                            {permission.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                        <Switch
                          checked={permission.enabled}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(permission.key, checked)
                          }
                          disabled={!canManagePermissions}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignRoleDialog} onOpenChange={setShowAssignRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Select a user and role to assign
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole}>
              <Plus className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
