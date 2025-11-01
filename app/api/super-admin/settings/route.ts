import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions, AuthenticatedRequest } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

// GET - Fetch all system settings
export const GET = withPermissions([Permission.MANAGE_SYSTEM])(async () => {
  try {
    const settings = await prisma.systemSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: getDefaultSettings(),
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
});

// POST - Create or update system settings
export const POST = withPermissions([Permission.MANAGE_SYSTEM])(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      // General
      siteName,
      tagline,
      email,
      phone,
      address,
      logo,
      favicon,
      facebook,
      twitter,
      instagram,
      linkedin,
      youtube,
      // Security
      minPasswordLength,
      requireUppercase,
      requireNumbers,
      requireSpecialChars,
      twoFactorEnabled,
      sessionTimeout,
      maxLoginAttempts,
      ipWhitelist,
      // Email
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpEncryption,
      fromName,
      fromEmail,
      notifyOnNewUser,
      notifyOnNewProject,
      notifyOnTaskComplete,
      // System
      timezone,
      dateFormat,
      timeFormat,
      language,
      maintenanceMode,
      maintenanceMessage,
      debugMode,
      cacheEnabled,
    } = body;

    // Get existing settings or create new
    let settings = await prisma.systemSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (settings) {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          // General
          ...(siteName !== undefined && { siteName }),
          ...(tagline !== undefined && { tagline }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(logo !== undefined && { logo }),
          ...(favicon !== undefined && { favicon }),
          ...(facebook !== undefined && { facebook }),
          ...(twitter !== undefined && { twitter }),
          ...(instagram !== undefined && { instagram }),
          ...(linkedin !== undefined && { linkedin }),
          ...(youtube !== undefined && { youtube }),
          // Security
          ...(minPasswordLength !== undefined && { minPasswordLength }),
          ...(requireUppercase !== undefined && { requireUppercase }),
          ...(requireNumbers !== undefined && { requireNumbers }),
          ...(requireSpecialChars !== undefined && { requireSpecialChars }),
          ...(twoFactorEnabled !== undefined && { twoFactorEnabled }),
          ...(sessionTimeout !== undefined && { sessionTimeout }),
          ...(maxLoginAttempts !== undefined && { maxLoginAttempts }),
          ...(ipWhitelist !== undefined && { ipWhitelist }),
          // Email
          ...(smtpHost !== undefined && { smtpHost }),
          ...(smtpPort !== undefined && { smtpPort }),
          ...(smtpUser !== undefined && { smtpUser }),
          ...(smtpPassword !== undefined && { smtpPassword }),
          ...(smtpEncryption !== undefined && { smtpEncryption }),
          ...(fromName !== undefined && { fromName }),
          ...(fromEmail !== undefined && { fromEmail }),
          ...(notifyOnNewUser !== undefined && { notifyOnNewUser }),
          ...(notifyOnNewProject !== undefined && { notifyOnNewProject }),
          ...(notifyOnTaskComplete !== undefined && { notifyOnTaskComplete }),
          // System
          ...(timezone !== undefined && { timezone }),
          ...(dateFormat !== undefined && { dateFormat }),
          ...(timeFormat !== undefined && { timeFormat }),
          ...(language !== undefined && { language }),
          ...(maintenanceMode !== undefined && { maintenanceMode }),
          ...(maintenanceMessage !== undefined && { maintenanceMessage }),
          ...(debugMode !== undefined && { debugMode }),
          ...(cacheEnabled !== undefined && { cacheEnabled }),
        },
      });
    } else {
      // Create new settings
      settings = await prisma.systemSettings.create({
        data: {
          // General
          siteName: siteName || 'Zyphex-Tech',
          tagline: tagline || 'Innovative Digital Solutions',
          email: email || 'info@zyphex-tech.com',
          phone: phone || '+1 (555) 123-4567',
          address: address || '',
          logo: logo || '/images/zyphex-logo.png',
          favicon: favicon || '/images/favicon.ico',
          facebook: facebook || '',
          twitter: twitter || '',
          instagram: instagram || '',
          linkedin: linkedin || '',
          youtube: youtube || '',
          // Security
          minPasswordLength: minPasswordLength || 8,
          requireUppercase: requireUppercase !== undefined ? requireUppercase : true,
          requireNumbers: requireNumbers !== undefined ? requireNumbers : true,
          requireSpecialChars: requireSpecialChars !== undefined ? requireSpecialChars : true,
          twoFactorEnabled: twoFactorEnabled || false,
          sessionTimeout: sessionTimeout || 30,
          maxLoginAttempts: maxLoginAttempts || 5,
          ipWhitelist: ipWhitelist || [],
          // Email
          smtpHost: smtpHost || '',
          smtpPort: smtpPort || 587,
          smtpUser: smtpUser || '',
          smtpPassword: smtpPassword || '',
          smtpEncryption: smtpEncryption || 'TLS',
          fromName: fromName || 'Zyphex-Tech',
          fromEmail: fromEmail || 'noreply@zyphex-tech.com',
          notifyOnNewUser: notifyOnNewUser !== undefined ? notifyOnNewUser : true,
          notifyOnNewProject: notifyOnNewProject !== undefined ? notifyOnNewProject : true,
          notifyOnTaskComplete: notifyOnTaskComplete || false,
          // System
          timezone: timezone || 'America/Los_Angeles',
          dateFormat: dateFormat || 'MM/DD/YYYY',
          timeFormat: timeFormat || '12h',
          language: language || 'en-US',
          maintenanceMode: maintenanceMode || false,
          maintenanceMessage: maintenanceMessage || 'We are currently performing scheduled maintenance.',
          debugMode: debugMode || false,
          cacheEnabled: cacheEnabled !== undefined ? cacheEnabled : true,
        },
      });
    }

    // Log activity
    const authenticatedRequest = request as AuthenticatedRequest
    await prisma.activityLog.create({
      data: {
        userId: authenticatedRequest.user.id,
        action: 'UPDATE',
        entityType: 'SETTINGS',
        entityId: settings.id,
        changes: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
});

function getDefaultSettings() {
  return {
    // General
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
    youtube: 'https://youtube.com/zyphextech',
    // Security
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: [],
    // Email
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@zyphex-tech.com',
    smtpPassword: '',
    smtpEncryption: 'TLS',
    fromName: 'Zyphex-Tech',
    fromEmail: 'noreply@zyphex-tech.com',
    notifyOnNewUser: true,
    notifyOnNewProject: true,
    notifyOnTaskComplete: false,
    // System
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en-US',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    debugMode: false,
    cacheEnabled: true,
  };
}
