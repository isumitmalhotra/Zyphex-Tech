-- Migration: Add Error Logs Table
-- Description: Create comprehensive error logging table for application monitoring
-- Created: 2025-10-11
-- Author: Zyphex Tech Development Team

-- Create error_logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id VARCHAR(255) PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  code VARCHAR(100),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Request Context
  route VARCHAR(500),
  method VARCHAR(10),
  status_code INTEGER,
  request_id VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  referer TEXT,
  
  -- User Context
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  
  -- System Context
  environment VARCHAR(50),
  build_version VARCHAR(100),
  
  -- Error Metadata
  context JSON,
  tags JSON,
  browser_info JSON,
  performance_context JSON,
  
  -- Resolution Tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  resolution_notes TEXT,
  
  -- Occurrence Tracking
  occurrence_count INTEGER DEFAULT 1,
  first_occurred TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_occurred TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Fingerprinting for grouping similar errors
  fingerprint VARCHAR(64),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_route ON error_logs(route);
CREATE INDEX IF NOT EXISTS idx_error_logs_code ON error_logs(code);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_last_occurred ON error_logs(last_occurred);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_created ON error_logs(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved_severity ON error_logs(resolved, severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_route ON error_logs(user_id, route);

-- Create error_log_aggregates table for pre-computed statistics
CREATE TABLE IF NOT EXISTS error_log_aggregates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  hour_of_day TINYINT,
  
  -- Aggregation dimensions
  route VARCHAR(500),
  method VARCHAR(10),
  severity VARCHAR(20),
  code VARCHAR(100),
  user_role VARCHAR(50),
  
  -- Metrics
  error_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  resolved_count INTEGER DEFAULT 0,
  avg_resolution_time INTEGER, -- in minutes
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Ensure unique combinations
  UNIQUE KEY unique_aggregate (date, hour_of_day, route, method, severity, code, user_role)
);

-- Indexes for aggregates table
CREATE INDEX IF NOT EXISTS idx_error_aggregates_date ON error_log_aggregates(date);
CREATE INDEX IF NOT EXISTS idx_error_aggregates_severity ON error_log_aggregates(severity);
CREATE INDEX IF NOT EXISTS idx_error_aggregates_route ON error_log_aggregates(route);

-- Create error_log_notifications table for alert management
CREATE TABLE IF NOT EXISTS error_log_notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  error_log_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'email', 'slack', 'webhook', etc.
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP NULL,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (error_log_id) REFERENCES error_logs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_error_notifications_status ON error_log_notifications(status);
CREATE INDEX IF NOT EXISTS idx_error_notifications_type ON error_log_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_error_notifications_created ON error_log_notifications(created_at);

-- Create error_log_trends table for trend analysis
CREATE TABLE IF NOT EXISTS error_log_trends (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  timeframe VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly'
  
  -- Trend metrics
  total_errors INTEGER DEFAULT 0,
  critical_errors INTEGER DEFAULT 0,
  high_errors INTEGER DEFAULT 0,
  medium_errors INTEGER DEFAULT 0,
  low_errors INTEGER DEFAULT 0,
  
  unique_error_types INTEGER DEFAULT 0,
  affected_users INTEGER DEFAULT 0,
  error_rate DECIMAL(5,4) DEFAULT 0.0000, -- percentage
  
  -- Performance correlation
  avg_response_time INTEGER,
  p95_response_time INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_trend (date, timeframe)
);

CREATE INDEX IF NOT EXISTS idx_error_trends_date ON error_log_trends(date);
CREATE INDEX IF NOT EXISTS idx_error_trends_timeframe ON error_log_trends(timeframe);

-- Create stored procedure for error log retention
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanupOldErrorLogs()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  
  -- Archive resolved errors older than 90 days
  CREATE TABLE IF NOT EXISTS error_logs_archive LIKE error_logs;
  
  INSERT INTO error_logs_archive 
  SELECT * FROM error_logs 
  WHERE resolved = TRUE 
    AND resolved_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
  
  DELETE FROM error_logs 
  WHERE resolved = TRUE 
    AND resolved_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
  
  -- Delete unresolved low/medium severity errors older than 180 days
  DELETE FROM error_logs 
  WHERE resolved = FALSE 
    AND severity IN ('LOW', 'MEDIUM')
    AND created_at < DATE_SUB(NOW(), INTERVAL 180 DAY);
  
  -- Clean up old aggregates (keep 1 year)
  DELETE FROM error_log_aggregates 
  WHERE date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);
  
  -- Clean up old trends (keep 2 years)
  DELETE FROM error_log_trends 
  WHERE date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR);
  
  -- Clean up old notifications (keep 30 days)
  DELETE FROM error_log_notifications 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  COMMIT;
END //
DELIMITER ;

-- Create event scheduler for automatic cleanup (run weekly)
-- Note: This requires EVENT scheduler to be enabled: SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS weekly_error_log_cleanup
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
  CALL CleanupOldErrorLogs();

-- Create view for error dashboard queries
CREATE VIEW IF NOT EXISTS error_dashboard_stats AS
SELECT 
  COUNT(*) as total_errors,
  COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_errors,
  COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_errors,
  COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium_errors,
  COUNT(CASE WHEN severity = 'LOW' THEN 1 END) as low_errors,
  COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_errors,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT route) as affected_routes,
  AVG(occurrence_count) as avg_occurrences,
  DATE(created_at) as error_date
FROM error_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY error_date DESC;

-- Create view for recent critical errors
CREATE VIEW IF NOT EXISTS recent_critical_errors AS
SELECT 
  id,
  message,
  code,
  route,
  method,
  user_email,
  occurrence_count,
  last_occurred,
  created_at,
  CASE 
    WHEN last_occurred > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'IMMEDIATE'
    WHEN last_occurred > DATE_SUB(NOW(), INTERVAL 6 HOUR) THEN 'URGENT'
    WHEN last_occurred > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 'HIGH'
    ELSE 'NORMAL'
  END as priority
FROM error_logs 
WHERE severity IN ('CRITICAL', 'HIGH')
  AND resolved = FALSE
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY 
  CASE priority
    WHEN 'IMMEDIATE' THEN 1
    WHEN 'URGENT' THEN 2  
    WHEN 'HIGH' THEN 3
    ELSE 4
  END,
  last_occurred DESC;

-- Create view for user impact analysis
CREATE VIEW IF NOT EXISTS user_error_impact AS
SELECT 
  user_id,
  user_email,
  user_role,
  COUNT(*) as total_errors,
  COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_errors,
  COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_errors,
  MAX(last_occurred) as last_error,
  COUNT(DISTINCT route) as affected_routes,
  AVG(occurrence_count) as avg_error_frequency
FROM error_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND user_id IS NOT NULL
GROUP BY user_id, user_email, user_role
HAVING total_errors > 1
ORDER BY 
  critical_errors DESC, 
  high_errors DESC, 
  total_errors DESC;

-- Insert initial configuration data
INSERT IGNORE INTO error_log_aggregates (date, hour_of_day, route, method, severity, code, user_role, error_count) 
VALUES (CURDATE(), 0, NULL, NULL, NULL, NULL, NULL, 0);

-- Add comments for documentation
ALTER TABLE error_logs COMMENT = 'Comprehensive error logging for application monitoring and debugging';
ALTER TABLE error_log_aggregates COMMENT = 'Pre-computed error statistics for dashboard performance';
ALTER TABLE error_log_notifications COMMENT = 'Error notification tracking and delivery status';
ALTER TABLE error_log_trends COMMENT = 'Historical error trends and patterns for analysis';

-- Grant necessary permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE ON error_logs TO 'app_user'@'%';
-- GRANT SELECT ON error_dashboard_stats TO 'app_user'@'%';
-- GRANT SELECT ON recent_critical_errors TO 'app_user'@'%';
-- GRANT SELECT ON user_error_impact TO 'app_user'@'%';