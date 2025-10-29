/**
 * CMS Settings Page
 * System configuration and administration
 */

import { Metadata } from 'next';
import { CmsSettings } from '@/components/cms/cms-settings';

export const metadata: Metadata = {
  title: 'Settings | CMS',
  description: 'Manage CMS settings, user roles, and permissions',
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <CmsSettings />
    </div>
  );
}
