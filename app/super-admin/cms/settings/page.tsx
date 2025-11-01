/**
 * CMS Settings Page
 * System configuration and administration
 */

import { Metadata } from 'next';
import { CmsSettings } from '@/components/cms/cms-settings';
import { UsageInfo } from '@/components/cms/usage-info';

export const metadata: Metadata = {
  title: 'Settings | CMS',
  description: 'Manage CMS settings, user roles, and permissions',
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <UsageInfo
        title="⚙️ CMS Settings & Configuration"
        description="Configure global CMS settings, manage user roles and permissions, set up content workflows, and customize system behavior. This is your control center for all CMS-related configurations."
        features={[
          "Manage user roles and permissions",
          "Configure content approval workflows",
          "Set up SEO defaults and templates",
          "Customize editor settings and options",
          "Manage content categories and taxonomies",
          "Configure media upload restrictions",
          "Set up automated backups and versioning"
        ]}
        tips={[
          "Review permissions carefully before granting access",
          "Set up approval workflows for quality control",
          "Configure SEO defaults to save time on each page",
          "Regular backups prevent content loss",
          "Test configuration changes in a safe environment first"
        ]}
      />
      <CmsSettings />
    </div>
  );
}
