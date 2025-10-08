/*
  Warnings:

  - You are about to alter the column `value` on the `Deal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to drop the column `tax` on the `Invoice` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `total` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `value` on the `Lead` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `budget` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `budgetUsed` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.
  - You are about to alter the column `hourlyRate` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,2)` to `DoublePrecision`.
  - You are about to alter the column `hourlyRate` on the `ResourceProfile` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,2)` to `DoublePrecision`.
  - You are about to drop the column `dependencies` on the `Task` table. All the data in the column will be lost.
  - You are about to alter the column `hourlyRate` on the `TeamMember` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,2)` to `DoublePrecision`.
  - You are about to alter the column `hours` on the `TimeEntry` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `rate` on the `TimeEntry` table. The data in that column could be lost. The data in that column will be cast from `Decimal(8,2)` to `DoublePrecision`.
  - You are about to alter the column `amount` on the `TimeEntry` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - Added the required column `updatedAt` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `lineItems` on the `Invoice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `value` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Made the column `budget` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `budgetUsed` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hourlyRate` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hourlyRate` on table `ResourceProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hourlyRate` on table `TeamMember` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rate` on table `TimeEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `TimeEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ChannelType" AS ENUM ('TEAM', 'PROJECT', 'DIRECT', 'GENERAL', 'ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'CHECK', 'WIRE_TRANSFER', 'CASH', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED', 'PARTIALLY_PAID', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "public"."PaymentReminderType" AS ENUM ('BEFORE_DUE', 'ON_DUE_DATE', 'OVERDUE_1ST', 'OVERDUE_2ND', 'OVERDUE_FINAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('TRAVEL', 'MEALS', 'OFFICE_SUPPLIES', 'SOFTWARE', 'HARDWARE', 'MARKETING', 'PROFESSIONAL_SERVICES', 'TRAINING', 'UTILITIES', 'RENT', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BillingType" AS ENUM ('HOURLY', 'FIXED_FEE', 'RETAINER', 'SUBSCRIPTION', 'MILESTONE_BASED', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "public"."ProjectMethodology" AS ENUM ('AGILE', 'WATERFALL', 'HYBRID', 'KANBAN', 'SCRUM', 'LEAN', 'PRINCE2');

-- CreateEnum
CREATE TYPE "public"."DependencyType" AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');

-- CreateEnum
CREATE TYPE "public"."RiskCategory" AS ENUM ('TECHNICAL', 'BUSINESS', 'RESOURCE', 'SCHEDULE', 'BUDGET', 'EXTERNAL', 'QUALITY', 'COMMUNICATION');

-- CreateEnum
CREATE TYPE "public"."RiskStatus" AS ENUM ('OPEN', 'MITIGATED', 'CLOSED', 'MONITORING');

-- CreateEnum
CREATE TYPE "public"."MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CommunicationType" AS ENUM ('UPDATE', 'ANNOUNCEMENT', 'ALERT', 'REMINDER', 'REPORT', 'MEETING_MINUTES');

-- CreateEnum
CREATE TYPE "public"."DocumentCategory" AS ENUM ('GENERAL', 'REQUIREMENTS', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'CONTRACTS', 'REPORTS', 'PRESENTATIONS');

-- CreateEnum
CREATE TYPE "public"."BudgetCategory" AS ENUM ('LABOR', 'MATERIALS', 'EQUIPMENT', 'SOFTWARE', 'TRAVEL', 'TRAINING', 'OVERHEAD', 'CONTINGENCY');

-- CreateEnum
CREATE TYPE "public"."IntegrationType" AS ENUM ('SLACK', 'GITHUB', 'GOOGLE_ANALYTICS', 'TRELLO', 'ZOOM', 'HUBSPOT', 'JIRA', 'DISCORD', 'MICROSOFT_TEAMS', 'ASANA', 'LINEAR', 'NOTION', 'FIGMA', 'STRIPE', 'MAILCHIMP');

-- CreateEnum
CREATE TYPE "public"."IntegrationCategory" AS ENUM ('COMMUNICATION', 'DEVELOPMENT', 'ANALYTICS', 'PROJECT_MANAGEMENT', 'CRM', 'MEETINGS', 'DESIGN', 'PAYMENTS', 'MARKETING');

-- CreateEnum
CREATE TYPE "public"."IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."MeetingType" AS ENUM ('IN_PERSON', 'VIDEO_CALL', 'PHONE_CALL', 'CONFERENCE');

-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'RESCHEDULED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."AttendeeStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'TENTATIVE', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "public"."RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('PROJECT_STATUS', 'PROJECT_TIMELINE', 'TASK_COMPLETION', 'RESOURCE_ALLOCATION', 'RISK_ASSESSMENT', 'REVENUE_BY_PROJECT', 'PROFITABILITY_ANALYSIS', 'BUDGET_VS_ACTUAL', 'INVOICE_STATUS', 'PAYMENT_COLLECTION', 'TEAM_PRODUCTIVITY', 'INDIVIDUAL_PERFORMANCE', 'TIME_TRACKING', 'WORKLOAD_DISTRIBUTION', 'SKILL_UTILIZATION', 'CLIENT_SATISFACTION', 'PROJECT_DELIVERABLES', 'COMMUNICATION_LOGS', 'SERVICE_LEVEL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReportCategory" AS ENUM ('PROJECTS', 'FINANCIAL', 'TEAM', 'CLIENTS', 'TIME', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "public"."ReportFrequency" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterEnum
ALTER TYPE "public"."MessageType" ADD VALUE 'REPLY';

-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Deal" ADD COLUMN     "clientId" TEXT,
ALTER COLUMN "value" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "tax",
ADD COLUMN     "billingType" "public"."BillingType" NOT NULL DEFAULT 'HOURLY',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lastReminderAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "overdueAt" TIMESTAMP(3),
ADD COLUMN     "paymentInstructions" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "lineItems",
ADD COLUMN     "lineItems" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "budget" DOUBLE PRECISION,
ADD COLUMN     "companySize" INTEGER,
ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "convertedToClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailCampaignStatus" TEXT,
ADD COLUMN     "qualificationScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeline" TEXT,
ALTER COLUMN "value" SET NOT NULL,
ALTER COLUMN "value" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "channelId" TEXT;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "isClientVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "methodology" "public"."ProjectMethodology" NOT NULL DEFAULT 'AGILE',
ADD COLUMN     "riskTolerance" TEXT,
ADD COLUMN     "templateId" TEXT,
ALTER COLUMN "budget" SET NOT NULL,
ALTER COLUMN "budget" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "budgetUsed" SET NOT NULL,
ALTER COLUMN "budgetUsed" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "hourlyRate" SET NOT NULL,
ALTER COLUMN "hourlyRate" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."ResourceProfile" ALTER COLUMN "hourlyRate" SET NOT NULL,
ALTER COLUMN "hourlyRate" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "dependencies",
ADD COLUMN     "isBlocking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMilestone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skillsRequired" JSONB;

-- AlterTable
ALTER TABLE "public"."TeamMember" ALTER COLUMN "hourlyRate" SET NOT NULL,
ALTER COLUMN "hourlyRate" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."TimeEntry" ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "invoiceId" TEXT,
ALTER COLUMN "hours" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "rate" SET NOT NULL,
ALTER COLUMN "rate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "availability" JSONB,
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "skills" JSONB,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "paymentReference" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "refundReason" TEXT,
    "stripePaymentId" TEXT,
    "paypalOrderId" TEXT,
    "gatewayFees" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentReminder" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT,
    "type" "public"."PaymentReminderType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reminderText" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "smsGent" BOOLEAN NOT NULL DEFAULT false,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LateFee" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "flatFee" DOUBLE PRECISION,
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "waived" BOOLEAN NOT NULL DEFAULT false,
    "waivedAt" TIMESTAMP(3),
    "waivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LateFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentConfig" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "projectId" TEXT,
    "stripeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "paypalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bankTransferEnabled" BOOLEAN NOT NULL DEFAULT true,
    "checkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "stripePublishableKey" TEXT,
    "stripeSecretKey" TEXT,
    "paypalClientId" TEXT,
    "paypalClientSecret" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "lateFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lateFeePercentage" DOUBLE PRECISION,
    "lateFeeFlatAmount" DOUBLE PRECISION,
    "lateFeeGraceDays" INTEGER NOT NULL DEFAULT 0,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "reminderDaysAfter" INTEGER NOT NULL DEFAULT 7,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankRoutingNumber" TEXT,
    "bankSwiftCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "category" "public"."ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "reimbursed" BOOLEAN NOT NULL DEFAULT false,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillingContract" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT,
    "contractType" "public"."BillingType" NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "fixedAmount" DOUBLE PRECISION,
    "retainerAmount" DOUBLE PRECISION,
    "billingCycle" "public"."BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoInvoice" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ChannelType" NOT NULL DEFAULT 'TEAM',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT,
    "outcome" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "methodology" "public"."ProjectMethodology" NOT NULL,
    "industry" TEXT,
    "estimatedDuration" INTEGER,
    "tasksTemplate" JSONB,
    "milestonesTemplate" JSONB,
    "riskTemplate" JSONB,
    "resourceTemplate" JSONB,
    "budgetTemplate" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    "dependencyType" "public"."DependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
    "lagDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectRisk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."RiskCategory" NOT NULL DEFAULT 'TECHNICAL',
    "impactScore" INTEGER NOT NULL,
    "probabilityScore" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "status" "public"."RiskStatus" NOT NULL DEFAULT 'OPEN',
    "mitigationPlan" TEXT,
    "contingencyPlan" TEXT,
    "ownerId" TEXT,
    "identifiedBy" TEXT NOT NULL,
    "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "status" "public"."MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isKey" BOOLEAN NOT NULL DEFAULT false,
    "deliverables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChangeRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "impact" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "estimatedHours" INTEGER,
    "estimatedDays" INTEGER,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "implementedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceAllocation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "allocationPercentage" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "skills" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectCommunication" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "public"."CommunicationType" NOT NULL DEFAULT 'UPDATE',
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "isClientVisible" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "category" "public"."DocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "isClientVisible" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT NOT NULL,
    "parentDocumentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectBudgetItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" "public"."BudgetCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budgetedAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."IntegrationType" NOT NULL,
    "category" "public"."IntegrationCategory" NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB,
    "apiKey" TEXT,
    "webhookUrl" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "status" "public"."IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
    "errorMessage" TEXT,
    "syncFrequency" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" "public"."MeetingType" NOT NULL DEFAULT 'VIDEO_CALL',
    "status" "public"."MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "organizerId" TEXT NOT NULL,
    "projectId" TEXT,
    "clientId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceFreq" "public"."RecurrenceFrequency",
    "recurrenceEnd" TIMESTAMP(3),
    "parentMeetingId" TEXT,
    "agenda" TEXT,
    "notes" TEXT,
    "recordingUrl" TEXT,
    "attachments" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "clientId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "status" "public"."AttendeeStatus" NOT NULL DEFAULT 'INVITED',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeetingActionItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."ReportCategory" NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "layout" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."ReportCategory" NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "templateId" TEXT,
    "config" JSONB NOT NULL,
    "data" JSONB,
    "metadata" JSONB,
    "pdfUrl" TEXT,
    "excelUrl" TEXT,
    "csvUrl" TEXT,
    "fileSize" INTEGER,
    "generatedAt" TIMESTAMP(3),
    "generatedBy" TEXT,
    "generationTime" INTEGER,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "scheduleId" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "frequency" "public"."ReportFrequency" NOT NULL,
    "cronExpression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "format" "public"."ReportFormat" NOT NULL,
    "recipients" TEXT[],
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "category" "public"."ReportCategory" NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccess" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ChannelMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChannelMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_name_idx" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "public"."Permission"("category");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "public"."RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "public"."RolePermission"("role", "permissionId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "public"."UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_expiresAt_idx" ON "public"."UserPermission"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "public"."UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "public"."RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "public"."RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "public"."AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "public"."Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "public"."Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentId_idx" ON "public"."Payment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Payment_paypalOrderId_idx" ON "public"."Payment"("paypalOrderId");

-- CreateIndex
CREATE INDEX "PaymentReminder_invoiceId_idx" ON "public"."PaymentReminder"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentReminder_type_idx" ON "public"."PaymentReminder"("type");

-- CreateIndex
CREATE INDEX "PaymentReminder_sentAt_idx" ON "public"."PaymentReminder"("sentAt");

-- CreateIndex
CREATE INDEX "PaymentReminder_dueDate_idx" ON "public"."PaymentReminder"("dueDate");

-- CreateIndex
CREATE INDEX "LateFee_invoiceId_idx" ON "public"."LateFee"("invoiceId");

-- CreateIndex
CREATE INDEX "LateFee_appliedAt_idx" ON "public"."LateFee"("appliedAt");

-- CreateIndex
CREATE INDEX "LateFee_waived_idx" ON "public"."LateFee"("waived");

-- CreateIndex
CREATE INDEX "PaymentConfig_clientId_idx" ON "public"."PaymentConfig"("clientId");

-- CreateIndex
CREATE INDEX "PaymentConfig_projectId_idx" ON "public"."PaymentConfig"("projectId");

-- CreateIndex
CREATE INDEX "Expense_projectId_idx" ON "public"."Expense"("projectId");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "public"."Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "public"."Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "public"."Expense"("date");

-- CreateIndex
CREATE INDEX "BillingContract_clientId_idx" ON "public"."BillingContract"("clientId");

-- CreateIndex
CREATE INDEX "BillingContract_projectId_idx" ON "public"."BillingContract"("projectId");

-- CreateIndex
CREATE INDEX "BillingContract_contractType_idx" ON "public"."BillingContract"("contractType");

-- CreateIndex
CREATE INDEX "BillingContract_isActive_idx" ON "public"."BillingContract"("isActive");

-- CreateIndex
CREATE INDEX "Channel_projectId_idx" ON "public"."Channel"("projectId");

-- CreateIndex
CREATE INDEX "Channel_type_idx" ON "public"."Channel"("type");

-- CreateIndex
CREATE INDEX "Channel_createdAt_idx" ON "public"."Channel"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_name_projectId_key" ON "public"."Channel"("name", "projectId");

-- CreateIndex
CREATE INDEX "MessageRead_userId_idx" ON "public"."MessageRead"("userId");

-- CreateIndex
CREATE INDEX "MessageRead_readAt_idx" ON "public"."MessageRead"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "public"."MessageRead"("messageId", "userId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "public"."MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "public"."MessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "public"."MessageReaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "public"."LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_userId_idx" ON "public"."LeadActivity"("userId");

-- CreateIndex
CREATE INDEX "LeadActivity_type_idx" ON "public"."LeadActivity"("type");

-- CreateIndex
CREATE INDEX "LeadActivity_scheduledAt_idx" ON "public"."LeadActivity"("scheduledAt");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "public"."LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectTemplate_methodology_idx" ON "public"."ProjectTemplate"("methodology");

-- CreateIndex
CREATE INDEX "ProjectTemplate_isActive_idx" ON "public"."ProjectTemplate"("isActive");

-- CreateIndex
CREATE INDEX "TaskDependency_taskId_idx" ON "public"."TaskDependency"("taskId");

-- CreateIndex
CREATE INDEX "TaskDependency_dependsOnTaskId_idx" ON "public"."TaskDependency"("dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnTaskId_key" ON "public"."TaskDependency"("taskId", "dependsOnTaskId");

-- CreateIndex
CREATE INDEX "ProjectRisk_projectId_idx" ON "public"."ProjectRisk"("projectId");

-- CreateIndex
CREATE INDEX "ProjectRisk_status_idx" ON "public"."ProjectRisk"("status");

-- CreateIndex
CREATE INDEX "ProjectRisk_riskScore_idx" ON "public"."ProjectRisk"("riskScore");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_idx" ON "public"."ProjectMilestone"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_targetDate_idx" ON "public"."ProjectMilestone"("targetDate");

-- CreateIndex
CREATE INDEX "ProjectMilestone_status_idx" ON "public"."ProjectMilestone"("status");

-- CreateIndex
CREATE INDEX "ChangeRequest_projectId_idx" ON "public"."ChangeRequest"("projectId");

-- CreateIndex
CREATE INDEX "ChangeRequest_status_idx" ON "public"."ChangeRequest"("status");

-- CreateIndex
CREATE INDEX "ChangeRequest_priority_idx" ON "public"."ChangeRequest"("priority");

-- CreateIndex
CREATE INDEX "ResourceAllocation_projectId_idx" ON "public"."ResourceAllocation"("projectId");

-- CreateIndex
CREATE INDEX "ResourceAllocation_userId_idx" ON "public"."ResourceAllocation"("userId");

-- CreateIndex
CREATE INDEX "ResourceAllocation_startDate_endDate_idx" ON "public"."ResourceAllocation"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAllocation_projectId_userId_startDate_key" ON "public"."ResourceAllocation"("projectId", "userId", "startDate");

-- CreateIndex
CREATE INDEX "ProjectCommunication_projectId_idx" ON "public"."ProjectCommunication"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCommunication_type_idx" ON "public"."ProjectCommunication"("type");

-- CreateIndex
CREATE INDEX "ProjectCommunication_isClientVisible_idx" ON "public"."ProjectCommunication"("isClientVisible");

-- CreateIndex
CREATE INDEX "ProjectCommunication_sentAt_idx" ON "public"."ProjectCommunication"("sentAt");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "public"."ProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDocument_category_idx" ON "public"."ProjectDocument"("category");

-- CreateIndex
CREATE INDEX "ProjectDocument_isClientVisible_idx" ON "public"."ProjectDocument"("isClientVisible");

-- CreateIndex
CREATE INDEX "ProjectDocument_isLatest_idx" ON "public"."ProjectDocument"("isLatest");

-- CreateIndex
CREATE INDEX "ProjectBudgetItem_projectId_idx" ON "public"."ProjectBudgetItem"("projectId");

-- CreateIndex
CREATE INDEX "ProjectBudgetItem_category_idx" ON "public"."ProjectBudgetItem"("category");

-- CreateIndex
CREATE INDEX "Integration_type_idx" ON "public"."Integration"("type");

-- CreateIndex
CREATE INDEX "Integration_category_idx" ON "public"."Integration"("category");

-- CreateIndex
CREATE INDEX "Integration_status_idx" ON "public"."Integration"("status");

-- CreateIndex
CREATE INDEX "Integration_isEnabled_idx" ON "public"."Integration"("isEnabled");

-- CreateIndex
CREATE INDEX "IntegrationLog_integrationId_idx" ON "public"."IntegrationLog"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationLog_action_idx" ON "public"."IntegrationLog"("action");

-- CreateIndex
CREATE INDEX "IntegrationLog_status_idx" ON "public"."IntegrationLog"("status");

-- CreateIndex
CREATE INDEX "IntegrationLog_createdAt_idx" ON "public"."IntegrationLog"("createdAt");

-- CreateIndex
CREATE INDEX "Meeting_organizerId_idx" ON "public"."Meeting"("organizerId");

-- CreateIndex
CREATE INDEX "Meeting_projectId_idx" ON "public"."Meeting"("projectId");

-- CreateIndex
CREATE INDEX "Meeting_clientId_idx" ON "public"."Meeting"("clientId");

-- CreateIndex
CREATE INDEX "Meeting_startTime_idx" ON "public"."Meeting"("startTime");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "public"."Meeting"("status");

-- CreateIndex
CREATE INDEX "Meeting_type_idx" ON "public"."Meeting"("type");

-- CreateIndex
CREATE INDEX "MeetingAttendee_meetingId_idx" ON "public"."MeetingAttendee"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingAttendee_userId_idx" ON "public"."MeetingAttendee"("userId");

-- CreateIndex
CREATE INDEX "MeetingAttendee_clientId_idx" ON "public"."MeetingAttendee"("clientId");

-- CreateIndex
CREATE INDEX "MeetingAttendee_status_idx" ON "public"."MeetingAttendee"("status");

-- CreateIndex
CREATE INDEX "MeetingActionItem_meetingId_idx" ON "public"."MeetingActionItem"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_assigneeId_idx" ON "public"."MeetingActionItem"("assigneeId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_dueDate_idx" ON "public"."MeetingActionItem"("dueDate");

-- CreateIndex
CREATE INDEX "MeetingActionItem_completed_idx" ON "public"."MeetingActionItem"("completed");

-- CreateIndex
CREATE INDEX "ReportTemplate_category_idx" ON "public"."ReportTemplate"("category");

-- CreateIndex
CREATE INDEX "ReportTemplate_type_idx" ON "public"."ReportTemplate"("type");

-- CreateIndex
CREATE INDEX "ReportTemplate_isBuiltIn_idx" ON "public"."ReportTemplate"("isBuiltIn");

-- CreateIndex
CREATE INDEX "ReportTemplate_isActive_idx" ON "public"."ReportTemplate"("isActive");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "public"."Report"("category");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "public"."Report"("type");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_templateId_idx" ON "public"."Report"("templateId");

-- CreateIndex
CREATE INDEX "Report_scheduleId_idx" ON "public"."Report"("scheduleId");

-- CreateIndex
CREATE INDEX "Report_generatedAt_idx" ON "public"."Report"("generatedAt");

-- CreateIndex
CREATE INDEX "Report_expiresAt_idx" ON "public"."Report"("expiresAt");

-- CreateIndex
CREATE INDEX "ReportSchedule_templateId_idx" ON "public"."ReportSchedule"("templateId");

-- CreateIndex
CREATE INDEX "ReportSchedule_frequency_idx" ON "public"."ReportSchedule"("frequency");

-- CreateIndex
CREATE INDEX "ReportSchedule_isActive_idx" ON "public"."ReportSchedule"("isActive");

-- CreateIndex
CREATE INDEX "ReportSchedule_nextRunAt_idx" ON "public"."ReportSchedule"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCache_cacheKey_key" ON "public"."ReportCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ReportCache_cacheKey_idx" ON "public"."ReportCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ReportCache_category_idx" ON "public"."ReportCache"("category");

-- CreateIndex
CREATE INDEX "ReportCache_type_idx" ON "public"."ReportCache"("type");

-- CreateIndex
CREATE INDEX "ReportCache_expiresAt_idx" ON "public"."ReportCache"("expiresAt");

-- CreateIndex
CREATE INDEX "ReportCache_lastAccess_idx" ON "public"."ReportCache"("lastAccess");

-- CreateIndex
CREATE INDEX "_ChannelMembers_B_index" ON "public"."_ChannelMembers"("B");

-- CreateIndex
CREATE INDEX "Account_provider_idx" ON "public"."Account"("provider");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "Deal_clientId_idx" ON "public"."Deal"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_overdueAt_idx" ON "public"."Invoice"("overdueAt");

-- CreateIndex
CREATE INDEX "Lead_qualificationScore_idx" ON "public"."Lead"("qualificationScore");

-- CreateIndex
CREATE INDEX "Message_channelId_idx" ON "public"."Message"("channelId");

-- CreateIndex
CREATE INDEX "Project_managerId_idx" ON "public"."Project"("managerId");

-- CreateIndex
CREATE INDEX "Project_methodology_idx" ON "public"."Project"("methodology");

-- CreateIndex
CREATE INDEX "Project_templateId_idx" ON "public"."Project"("templateId");

-- CreateIndex
CREATE INDEX "Task_isBlocking_idx" ON "public"."Task"("isBlocking");

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeEntry" ADD CONSTRAINT "TimeEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentReminder" ADD CONSTRAINT "PaymentReminder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentReminder" ADD CONSTRAINT "PaymentReminder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LateFee" ADD CONSTRAINT "LateFee_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentConfig" ADD CONSTRAINT "PaymentConfig_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentConfig" ADD CONSTRAINT "PaymentConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillingContract" ADD CONSTRAINT "BillingContract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillingContract" ADD CONSTRAINT "BillingContract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Channel" ADD CONSTRAINT "Channel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Channel" ADD CONSTRAINT "Channel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deal" ADD CONSTRAINT "Deal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectRisk" ADD CONSTRAINT "ProjectRisk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectRisk" ADD CONSTRAINT "ProjectRisk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectRisk" ADD CONSTRAINT "ProjectRisk_identifiedBy_fkey" FOREIGN KEY ("identifiedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChangeRequest" ADD CONSTRAINT "ChangeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChangeRequest" ADD CONSTRAINT "ChangeRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChangeRequest" ADD CONSTRAINT "ChangeRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectCommunication" ADD CONSTRAINT "ProjectCommunication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectCommunication" ADD CONSTRAINT "ProjectCommunication_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectDocument" ADD CONSTRAINT "ProjectDocument_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectDocument" ADD CONSTRAINT "ProjectDocument_parentDocumentId_fkey" FOREIGN KEY ("parentDocumentId") REFERENCES "public"."ProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectBudgetItem" ADD CONSTRAINT "ProjectBudgetItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_parentMeetingId_fkey" FOREIGN KEY ("parentMeetingId") REFERENCES "public"."Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ReportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."ReportSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportSchedule" ADD CONSTRAINT "ReportSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChannelMembers" ADD CONSTRAINT "_ChannelMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChannelMembers" ADD CONSTRAINT "_ChannelMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
