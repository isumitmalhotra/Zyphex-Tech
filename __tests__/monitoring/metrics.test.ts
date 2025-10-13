import {
  BusinessMetrics,
  UserMetrics,
  ProjectMetrics,
  PaymentMetrics,
  EmailMetrics,
  FileMetrics,
  APIMetrics,
  FeatureMetrics,
} from '@/lib/monitoring/metrics';

// Mock Logger
jest.mock('@/lib/logger', () => ({
  Logger: {
    logBusinessMetric: jest.fn(),
    logUserAction: jest.fn(),
    logAuthEvent: jest.fn(),
    logPaymentEvent: jest.fn(),
    logEmailEvent: jest.fn(),
    logFileUpload: jest.fn(),
  },
}));

describe('Business Metrics', () => {
  beforeEach(() => {
    BusinessMetrics.clear();
    jest.clearAllMocks();
  });

  describe('BusinessMetrics', () => {
    it('should track metric values', () => {
      BusinessMetrics.track('test.metric', 100);
      
      const stats = BusinessMetrics.getStats('test.metric');
      expect(stats).toEqual({
        count: 1,
        sum: 100,
        avg: 100,
        max: 100,
        min: 100,
      });
    });

    it('should calculate statistics correctly', () => {
      BusinessMetrics.track('test.metric', 10);
      BusinessMetrics.track('test.metric', 20);
      BusinessMetrics.track('test.metric', 30);
      
      const stats = BusinessMetrics.getStats('test.metric');
      expect(stats).toEqual({
        count: 3,
        sum: 60,
        avg: 20,
        max: 30,
        min: 10,
      });
    });

    it('should increment counters', () => {
      BusinessMetrics.increment('test.counter');
      BusinessMetrics.increment('test.counter');
      BusinessMetrics.increment('test.counter');
      
      const stats = BusinessMetrics.getStats('test.counter');
      expect(stats?.count).toBe(3);
      expect(stats?.sum).toBe(3);
    });

    it('should return null for non-existent metrics', () => {
      const stats = BusinessMetrics.getStats('non.existent');
      expect(stats).toBeNull();
    });

    it('should clear specific metrics', () => {
      BusinessMetrics.track('test.metric1', 100);
      BusinessMetrics.track('test.metric2', 200);
      
      BusinessMetrics.clear('test.metric1');
      
      expect(BusinessMetrics.getStats('test.metric1')).toBeNull();
      expect(BusinessMetrics.getStats('test.metric2')).not.toBeNull();
    });

    it('should clear all metrics', () => {
      BusinessMetrics.track('test.metric1', 100);
      BusinessMetrics.track('test.metric2', 200);
      
      BusinessMetrics.clear();
      
      expect(BusinessMetrics.getStats('test.metric1')).toBeNull();
      expect(BusinessMetrics.getStats('test.metric2')).toBeNull();
    });
  });

  describe('UserMetrics', () => {
    it('should track user registration', () => {
      UserMetrics.trackRegistration('user123', 'email');
      
      const stats = BusinessMetrics.getStats('user.registration');
      expect(stats?.count).toBe(1);
    });

    it('should track OAuth registration', () => {
      UserMetrics.trackRegistration('user123', 'oauth', 'google');
      
      const stats = BusinessMetrics.getStats('user.registration');
      expect(stats?.count).toBe(1);
    });

    it('should track user login', () => {
      UserMetrics.trackLogin('user123', 'email');
      
      const stats = BusinessMetrics.getStats('user.login');
      expect(stats?.count).toBe(1);
    });

    it('should track user logout', () => {
      UserMetrics.trackLogout('user123');
      
      const stats = BusinessMetrics.getStats('user.logout');
      expect(stats?.count).toBe(1);
    });

    it('should track failed login attempts', () => {
      UserMetrics.trackFailedLogin('user@example.com', 'invalid_password');
      
      const stats = BusinessMetrics.getStats('user.failed_login');
      expect(stats?.count).toBe(1);
    });

    it('should track session duration', () => {
      UserMetrics.trackSessionDuration('user123', 3600);
      
      const stats = BusinessMetrics.getStats('user.session_duration');
      expect(stats?.sum).toBe(3600);
    });
  });

  describe('ProjectMetrics', () => {
    it('should track project creation', () => {
      ProjectMetrics.trackCreation('project123', 'user123');
      
      const stats = BusinessMetrics.getStats('project.created');
      expect(stats?.count).toBe(1);
    });

    it('should track project updates', () => {
      ProjectMetrics.trackUpdate('project123', 'user123', ['name', 'description']);
      
      const stats = BusinessMetrics.getStats('project.updated');
      expect(stats?.count).toBe(1);
    });

    it('should track project completion', () => {
      ProjectMetrics.trackCompletion('project123', 86400);
      
      const stats = BusinessMetrics.getStats('project.completion_time');
      expect(stats?.sum).toBe(86400);
    });

    it('should track status changes', () => {
      ProjectMetrics.trackStatusChange('project123', 'user123', 'IN_PROGRESS', 'COMPLETED');
      
      const stats = BusinessMetrics.getStats('project.status_change');
      expect(stats?.count).toBe(1);
    });
  });

  describe('PaymentMetrics', () => {
    it('should track payment attempts', () => {
      PaymentMetrics.trackAttempt(100, 'USD', 'card');
      
      const stats = BusinessMetrics.getStats('payment.attempted');
      expect(stats?.count).toBe(1);
    });

    it('should track successful payments', () => {
      PaymentMetrics.trackSuccess('txn_123', 100, 'USD', 'card');
      
      const stats = BusinessMetrics.getStats('payment.success');
      expect(stats?.count).toBe(1);
      
      const amountStats = BusinessMetrics.getStats('payment.amount_received');
      expect(amountStats?.sum).toBe(100);
    });

    it('should track failed payments', () => {
      PaymentMetrics.trackFailure('txn_123', 100, 'USD', 'insufficient_funds');
      
      const stats = BusinessMetrics.getStats('payment.failed');
      expect(stats?.count).toBe(1);
    });

    it('should track refunds', () => {
      PaymentMetrics.trackRefund('txn_123', 100, 'USD', 'customer_request');
      
      const stats = BusinessMetrics.getStats('payment.refunded');
      expect(stats?.count).toBe(1);
      
      const amountStats = BusinessMetrics.getStats('payment.amount_refunded');
      expect(amountStats?.sum).toBe(100);
    });

    it('should get payment statistics', () => {
      PaymentMetrics.trackSuccess('txn_1', 100, 'USD', 'card');
      PaymentMetrics.trackSuccess('txn_2', 200, 'USD', 'card');
      PaymentMetrics.trackFailure('txn_3', 50, 'USD', 'declined');
      
      const stats = PaymentMetrics.getStats();
      
      expect(stats.success?.count).toBe(2);
      expect(stats.failed?.count).toBe(1);
      expect(stats.totalReceived?.sum).toBe(300);
    });
  });

  describe('EmailMetrics', () => {
    it('should track sent emails', () => {
      EmailMetrics.trackSent('user@example.com', 'welcome');
      
      const stats = BusinessMetrics.getStats('email.sent');
      expect(stats?.count).toBe(1);
    });

    it('should track failed emails', () => {
      EmailMetrics.trackFailed('user@example.com', 'welcome', 'smtp_error');
      
      const stats = BusinessMetrics.getStats('email.failed');
      expect(stats?.count).toBe(1);
    });

    it('should track queued emails', () => {
      EmailMetrics.trackQueued('user@example.com', 'welcome');
      
      const stats = BusinessMetrics.getStats('email.queued');
      expect(stats?.count).toBe(1);
    });

    it('should get email statistics', () => {
      EmailMetrics.trackSent('user1@example.com', 'welcome');
      EmailMetrics.trackSent('user2@example.com', 'verification');
      EmailMetrics.trackFailed('user3@example.com', 'password_reset', 'error');
      
      const stats = EmailMetrics.getStats();
      
      expect(stats.sent?.count).toBe(2);
      expect(stats.failed?.count).toBe(1);
    });
  });

  describe('FileMetrics', () => {
    it('should track successful file uploads', () => {
      FileMetrics.trackUpload('user123', 'test.pdf', 1024, 'application/pdf', true);
      
      const stats = BusinessMetrics.getStats('file.upload_success');
      expect(stats?.count).toBe(1);
      
      const sizeStats = BusinessMetrics.getStats('file.size_uploaded');
      expect(sizeStats?.sum).toBe(1024);
    });

    it('should track failed file uploads', () => {
      FileMetrics.trackUpload('user123', 'test.pdf', 1024, 'application/pdf', false);
      
      const stats = BusinessMetrics.getStats('file.upload_failed');
      expect(stats?.count).toBe(1);
    });

    it('should track file downloads', () => {
      FileMetrics.trackDownload('user123', 'test.pdf', 1024, 'application/pdf');
      
      const stats = BusinessMetrics.getStats('file.download');
      expect(stats?.count).toBe(1);
    });

    it('should track file deletions', () => {
      FileMetrics.trackDeletion('user123', 'test.pdf');
      
      const stats = BusinessMetrics.getStats('file.deleted');
      expect(stats?.count).toBe(1);
    });

    it('should get file statistics', () => {
      FileMetrics.trackUpload('user1', 'file1.pdf', 1000, 'application/pdf', true);
      FileMetrics.trackUpload('user2', 'file2.pdf', 2000, 'application/pdf', true);
      FileMetrics.trackUpload('user3', 'file3.pdf', 1500, 'application/pdf', false);
      
      const stats = FileMetrics.getStats();
      
      expect(stats.uploadSuccess?.count).toBe(2);
      expect(stats.uploadFailed?.count).toBe(1);
      expect(stats.totalSizeUploaded?.sum).toBe(4500);
    });
  });

  describe('APIMetrics', () => {
    it('should track API calls', () => {
      APIMetrics.trackCall('/api/users', 'GET', 200, 150);
      
      const stats = BusinessMetrics.getStats('api.calls');
      expect(stats?.count).toBe(1);
    });

    it('should track API errors separately', () => {
      APIMetrics.trackCall('/api/users', 'GET', 404, 50);
      APIMetrics.trackCall('/api/users', 'GET', 500, 100);
      
      const errorStats = BusinessMetrics.getStats('api.errors');
      expect(errorStats?.count).toBe(2);
    });

    it('should track API duration', () => {
      APIMetrics.trackCall('/api/users', 'GET', 200, 100);
      APIMetrics.trackCall('/api/users', 'GET', 200, 200);
      
      const durationStats = BusinessMetrics.getStats('api.duration');
      expect(durationStats?.avg).toBe(150);
    });

    it('should get API statistics', () => {
      APIMetrics.trackCall('/api/users', 'GET', 200, 100);
      APIMetrics.trackCall('/api/users', 'POST', 201, 150);
      APIMetrics.trackCall('/api/users', 'GET', 500, 200);
      
      const stats = APIMetrics.getStats();
      
      expect(stats.totalCalls?.count).toBe(3);
      expect(stats.errors?.count).toBe(1);
    });
  });

  describe('FeatureMetrics', () => {
    it('should track feature usage', () => {
      FeatureMetrics.trackUsage('project_export', 'user123');
      
      const stats = FeatureMetrics.getUsageStats('project_export');
      expect(stats?.count).toBe(1);
    });

    it('should track multiple features', () => {
      FeatureMetrics.trackUsage('project_export', 'user1');
      FeatureMetrics.trackUsage('project_export', 'user2');
      FeatureMetrics.trackUsage('file_upload', 'user1');
      
      const exportStats = FeatureMetrics.getUsageStats('project_export');
      const uploadStats = FeatureMetrics.getUsageStats('file_upload');
      
      expect(exportStats?.count).toBe(2);
      expect(uploadStats?.count).toBe(1);
    });
  });
});
