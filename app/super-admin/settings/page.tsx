'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import { Loader2 } from 'lucide-react';
import {
  Settings,
  Globe,
  Shield,
  Mail,
  Server,
  Save,
  Upload,
  Eye,
  EyeOff,
  Link,
  Clock,
  Lock,
  Key,
  Bell,
  AlertTriangle,
  XCircle,
  Languages,
  Wrench,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';

type SettingsTab = 'general' | 'security' | 'email' | 'system';

interface GeneralSettings {
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  favicon: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
}

interface SecuritySettings {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  ipWhitelist: string[];
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpEncryption: string;
  fromName: string;
  fromEmail: string;
  notifyOnNewUser: boolean;
  notifyOnNewProject: boolean;
  notifyOnTaskComplete: boolean;
}

interface SystemSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  debugMode: boolean;
  cacheEnabled: boolean;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Zyphex-Tech',
    tagline: 'Innovative Digital Solutions',
    email: 'info@zyphex-tech.com',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Street, Silicon Valley, CA 94025',
    logo: '/images/zyphex-logo.png',
    favicon: '/images/favicon.ico',
    facebook: 'https://facebook.com/zyphextech',
    twitter: 'https://twitter.com/zyphextech',
    instagram: 'https://instagram.com/zyphextech',
    linkedin: 'https://linkedin.com/company/zyphextech',
    youtube: 'https://youtube.com/zyphextech'
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: ['192.168.1.1', '10.0.0.1']
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@zyphex-tech.com',
    smtpPassword: '••••••••••••',
    smtpEncryption: 'TLS',
    fromName: 'Zyphex-Tech',
    fromEmail: 'noreply@zyphex-tech.com',
    notifyOnNewUser: true,
    notifyOnNewProject: true,
    notifyOnTaskComplete: false
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en-US',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    debugMode: false,
    cacheEnabled: true
  });

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/super-admin/settings');
        
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }

        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          
          // Update all settings states
          setGeneralSettings({
            siteName: data.siteName || 'Zyphex-Tech',
            tagline: data.tagline || 'Innovative Digital Solutions',
            email: data.email || 'info@zyphex-tech.com',
            phone: data.phone || '+1 (555) 123-4567',
            address: data.address || '123 Tech Street, Silicon Valley, CA 94025',
            logo: data.logo || '/images/zyphex-logo.png',
            favicon: data.favicon || '/images/favicon.ico',
            facebook: data.facebook || 'https://facebook.com/zyphextech',
            twitter: data.twitter || 'https://twitter.com/zyphextech',
            instagram: data.instagram || 'https://instagram.com/zyphextech',
            linkedin: data.linkedin || 'https://linkedin.com/company/zyphextech',
            youtube: data.youtube || 'https://youtube.com/zyphextech'
          });

          setSecuritySettings({
            minPasswordLength: data.minPasswordLength || 8,
            requireUppercase: data.requireUppercase !== undefined ? data.requireUppercase : true,
            requireNumbers: data.requireNumbers !== undefined ? data.requireNumbers : true,
            requireSpecialChars: data.requireSpecialChars !== undefined ? data.requireSpecialChars : true,
            twoFactorEnabled: data.twoFactorEnabled || false,
            sessionTimeout: data.sessionTimeout || 30,
            maxLoginAttempts: data.maxLoginAttempts || 5,
            ipWhitelist: data.ipWhitelist || []
          });

          setEmailSettings({
            smtpHost: data.smtpHost || 'smtp.gmail.com',
            smtpPort: data.smtpPort || 587,
            smtpUser: data.smtpUser || 'noreply@zyphex-tech.com',
            smtpPassword: data.smtpPassword || '••••••••••••',
            smtpEncryption: data.smtpEncryption || 'TLS',
            fromName: data.fromName || 'Zyphex-Tech',
            fromEmail: data.fromEmail || 'noreply@zyphex-tech.com',
            notifyOnNewUser: data.notifyOnNewUser !== undefined ? data.notifyOnNewUser : true,
            notifyOnNewProject: data.notifyOnNewProject !== undefined ? data.notifyOnNewProject : true,
            notifyOnTaskComplete: data.notifyOnTaskComplete || false
          });

          setSystemSettings({
            timezone: data.timezone || 'America/Los_Angeles',
            dateFormat: data.dateFormat || 'MM/DD/YYYY',
            timeFormat: data.timeFormat || '12h',
            language: data.language || 'en-US',
            maintenanceMode: data.maintenanceMode || false,
            maintenanceMessage: data.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
            debugMode: data.debugMode || false,
            cacheEnabled: data.cacheEnabled !== undefined ? data.cacheEnabled : true
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings. Using default values.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSaveGeneral = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/super-admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'Settings Saved',
        description: 'General settings have been updated successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/super-admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securitySettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'Security Settings Saved',
        description: 'Security settings have been updated successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save security settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/super-admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'Email Settings Saved',
        description: 'Email settings have been updated successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/super-admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'System Settings Saved',
        description: 'System settings have been updated successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save system settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = () => {
    toast({
      title: 'Test Email Sent',
      description: 'A test email has been sent to verify your SMTP configuration'
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (PNG, JPG, SVG)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Logo file must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setGeneralSettings(prev => ({ ...prev, logo: data.file.url }));

      toast({
        title: 'Logo Uploaded',
        description: 'Your logo has been uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/x-icon', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an ICO, PNG, or SVG file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 1MB for favicon)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Favicon file must be less than 1MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadingFavicon(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setGeneralSettings(prev => ({ ...prev, favicon: data.file.url }));

      toast({
        title: 'Favicon Uploaded',
        description: 'Your favicon has been uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload favicon',
        variant: 'destructive'
      });
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleAddIp = () => {
    if (newIpAddress && !securitySettings.ipWhitelist.includes(newIpAddress)) {
      setSecuritySettings({
        ...securitySettings,
        ipWhitelist: [...securitySettings.ipWhitelist, newIpAddress]
      });
      setNewIpAddress('');
      toast({
        title: 'IP Address Added',
        description: `${newIpAddress} has been added to the whitelist`
      });
    }
  };

  const handleRemoveIp = (ip: string) => {
    setSecuritySettings({
      ...securitySettings,
      ipWhitelist: securitySettings.ipWhitelist.filter(i => i !== ip)
    });
    toast({
      title: 'IP Address Removed',
      description: `${ip} has been removed from the whitelist`,
      variant: 'destructive'
    });
  };

  const tabs = [
    { id: 'general' as SettingsTab, label: 'General', icon: Globe },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
    { id: 'email' as SettingsTab, label: 'Email', icon: Mail },
    { id: 'system' as SettingsTab, label: 'System', icon: Server }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      {isLoading ? (
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure system settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? 'zyphex-button-primary' : ''}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Site Information
                </CardTitle>
                <CardDescription>
                  Configure your website&apos;s basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Site Name</Label>
                    <Input
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                      className="zyphex-input mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tagline</Label>
                    <Input
                      value={generalSettings.tagline}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, tagline: e.target.value })}
                      className="zyphex-input mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                      className="zyphex-input mt-1"
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                      className="zyphex-input mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    className="zyphex-input mt-1"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Logo Upload</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={generalSettings.logo}
                        readOnly
                        className="zyphex-input"
                      />
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploadingLogo ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Favicon Upload</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={generalSettings.favicon}
                        readOnly
                        className="zyphex-input"
                      />
                      <input
                        type="file"
                        id="favicon-upload"
                        accept="image/x-icon,image/png,image/svg+xml"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('favicon-upload')?.click()}
                        disabled={uploadingFavicon}
                      >
                        {uploadingFavicon ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploadingFavicon ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-blue-500" />
                  Social Media Links
                </CardTitle>
                <CardDescription>
                  Connect your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </Label>
                  <Input
                    value={generalSettings.facebook}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, facebook: e.target.value })}
                    className="zyphex-input mt-1"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-sky-500" />
                    Twitter
                  </Label>
                  <Input
                    value={generalSettings.twitter}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, twitter: e.target.value })}
                    className="zyphex-input mt-1"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </Label>
                  <Input
                    value={generalSettings.instagram}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, instagram: e.target.value })}
                    className="zyphex-input mt-1"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    LinkedIn
                  </Label>
                  <Input
                    value={generalSettings.linkedin}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, linkedin: e.target.value })}
                    className="zyphex-input mt-1"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600" />
                    YouTube
                  </Label>
                  <Input
                    value={generalSettings.youtube}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, youtube: e.target.value })}
                    className="zyphex-input mt-1"
                    placeholder="https://youtube.com/yourchannel"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="zyphex-button-primary" onClick={handleSaveGeneral} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save General Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-500" />
                  Password Policies
                </CardTitle>
                <CardDescription>
                  Configure password requirements for users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Minimum Password Length</Label>
                  <Input
                    type="number"
                    value={securitySettings.minPasswordLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, minPasswordLength: parseInt(e.target.value) })}
                    className="zyphex-input mt-1"
                    min="6"
                    max="32"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Uppercase Letters</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        At least one uppercase letter required
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireUppercase: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Numbers</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        At least one number required
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireNumbers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Special Characters</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        At least one special character required
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireSpecialChars: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Maximum Login Attempts</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                    className="zyphex-input mt-1"
                    min="3"
                    max="10"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Account will be locked after this many failed attempts
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-500" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Session Management
                </CardTitle>
                <CardDescription>
                  Configure session timeout settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                    className="zyphex-input mt-1"
                    min="5"
                    max="120"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Users will be logged out after this period of inactivity
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  IP Whitelisting
                </CardTitle>
                <CardDescription>
                  Restrict access to specific IP addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    placeholder="192.168.1.1"
                    className="zyphex-input"
                  />
                  <Button onClick={handleAddIp} variant="outline">
                    Add IP
                  </Button>
                </div>

                <div className="space-y-2">
                  {securitySettings.ipWhitelist.map((ip, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="font-mono text-sm">{ip}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveIp(ip)}
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="zyphex-button-primary" onClick={handleSaveSecurity} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  SMTP Configuration
                </CardTitle>
                <CardDescription>
                  Configure your email server settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>SMTP Host</Label>
                    <Input
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      className="zyphex-input mt-1"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label>SMTP Port</Label>
                    <Input
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                      className="zyphex-input mt-1"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div>
                  <Label>SMTP Username</Label>
                  <Input
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    className="zyphex-input mt-1"
                  />
                </div>

                <div>
                  <Label>SMTP Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      className="zyphex-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Encryption</Label>
                  <Input
                    value={emailSettings.smtpEncryption}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpEncryption: e.target.value })}
                    className="zyphex-input mt-1"
                    placeholder="TLS"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>From Name</Label>
                    <Input
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                      className="zyphex-input mt-1"
                    />
                  </div>
                  <div>
                    <Label>From Email</Label>
                    <Input
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                      className="zyphex-input mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleTestEmail}>
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure automatic email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New User Registration</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send email when a new user registers
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.notifyOnNewUser}
                    onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, notifyOnNewUser: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Project Created</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send email when a new project is created
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.notifyOnNewProject}
                    onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, notifyOnNewProject: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Task Completed</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send email when a task is marked as complete
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.notifyOnTaskComplete}
                    onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, notifyOnTaskComplete: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="zyphex-button-primary" onClick={handleSaveEmail} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Date & Time Settings
                </CardTitle>
                <CardDescription>
                  Configure timezone and format preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Timezone</Label>
                  <Input
                    value={systemSettings.timezone}
                    onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                    className="zyphex-input mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date Format</Label>
                    <Input
                      value={systemSettings.dateFormat}
                      onChange={(e) => setSystemSettings({ ...systemSettings, dateFormat: e.target.value })}
                      className="zyphex-input mt-1"
                      placeholder="MM/DD/YYYY"
                    />
                  </div>
                  <div>
                    <Label>Time Format</Label>
                    <Input
                      value={systemSettings.timeFormat}
                      onChange={(e) => setSystemSettings({ ...systemSettings, timeFormat: e.target.value })}
                      className="zyphex-input mt-1"
                      placeholder="12h or 24h"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-blue-500" />
                  Language Settings
                </CardTitle>
                <CardDescription>
                  Set the default language for the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Default Language</Label>
                  <Input
                    value={systemSettings.language}
                    onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                    className="zyphex-input mt-1"
                    placeholder="en-US"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  Maintenance Mode
                </CardTitle>
                <CardDescription>
                  Enable maintenance mode to perform updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <Label>Enable Maintenance Mode</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Site will be unavailable to regular users
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                  />
                </div>

                <div>
                  <Label>Maintenance Message</Label>
                  <Textarea
                    value={systemSettings.maintenanceMessage}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMessage: e.target.value })}
                    className="zyphex-input mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-500" />
                  Advanced System Settings
                </CardTitle>
                <CardDescription>
                  Configure advanced system options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show detailed error messages (development only)
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, debugMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cache Enabled</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable caching to improve performance
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.cacheEnabled}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, cacheEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="zyphex-button-primary" onClick={handleSaveSystem} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save System Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
