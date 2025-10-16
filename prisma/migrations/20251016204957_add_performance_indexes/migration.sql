-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "public"."ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_createdAt_idx" ON "public"."ActivityLog"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "public"."ActivityLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_action_idx" ON "public"."ActivityLog"("userId", "action");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_entityType_idx" ON "public"."ActivityLog"("userId", "entityType");

-- CreateIndex
CREATE INDEX "BillingContract_startDate_idx" ON "public"."BillingContract"("startDate");

-- CreateIndex
CREATE INDEX "BillingContract_endDate_idx" ON "public"."BillingContract"("endDate");

-- CreateIndex
CREATE INDEX "BillingContract_billingCycle_idx" ON "public"."BillingContract"("billingCycle");

-- CreateIndex
CREATE INDEX "BillingContract_clientId_isActive_idx" ON "public"."BillingContract"("clientId", "isActive");

-- CreateIndex
CREATE INDEX "BillingContract_isActive_billingCycle_idx" ON "public"."BillingContract"("isActive", "billingCycle");

-- CreateIndex
CREATE INDEX "Channel_createdById_idx" ON "public"."Channel"("createdById");

-- CreateIndex
CREATE INDEX "Channel_isPrivate_idx" ON "public"."Channel"("isPrivate");

-- CreateIndex
CREATE INDEX "Channel_isPinned_idx" ON "public"."Channel"("isPinned");

-- CreateIndex
CREATE INDEX "Channel_projectId_type_idx" ON "public"."Channel"("projectId", "type");

-- CreateIndex
CREATE INDEX "Channel_type_isPrivate_idx" ON "public"."Channel"("type", "isPrivate");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "public"."Client"("createdAt");

-- CreateIndex
CREATE INDEX "Client_company_idx" ON "public"."Client"("company");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "public"."Client"("phone");

-- CreateIndex
CREATE INDEX "Client_name_deletedAt_idx" ON "public"."Client"("name", "deletedAt");

-- CreateIndex
CREATE INDEX "Client_email_deletedAt_idx" ON "public"."Client"("email", "deletedAt");

-- CreateIndex
CREATE INDEX "ContactLog_completedAt_idx" ON "public"."ContactLog"("completedAt");

-- CreateIndex
CREATE INDEX "ContactLog_clientId_type_idx" ON "public"."ContactLog"("clientId", "type");

-- CreateIndex
CREATE INDEX "ContactLog_userId_scheduledAt_idx" ON "public"."ContactLog"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Deal_createdAt_idx" ON "public"."Deal"("createdAt");

-- CreateIndex
CREATE INDEX "Deal_wonAt_idx" ON "public"."Deal"("wonAt");

-- CreateIndex
CREATE INDEX "Deal_lostAt_idx" ON "public"."Deal"("lostAt");

-- CreateIndex
CREATE INDEX "Deal_probability_idx" ON "public"."Deal"("probability");

-- CreateIndex
CREATE INDEX "Deal_stage_closeDate_idx" ON "public"."Deal"("stage", "closeDate");

-- CreateIndex
CREATE INDEX "Deal_assignedTo_stage_idx" ON "public"."Deal"("assignedTo", "stage");

-- CreateIndex
CREATE INDEX "Deal_stage_probability_idx" ON "public"."Deal"("stage", "probability");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "public"."Document"("createdAt");

-- CreateIndex
CREATE INDEX "Document_isPublic_idx" ON "public"."Document"("isPublic");

-- CreateIndex
CREATE INDEX "Document_projectId_category_idx" ON "public"."Document"("projectId", "category");

-- CreateIndex
CREATE INDEX "Document_userId_createdAt_idx" ON "public"."Document"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Expense_invoiceId_idx" ON "public"."Expense"("invoiceId");

-- CreateIndex
CREATE INDEX "Expense_reimbursed_idx" ON "public"."Expense"("reimbursed");

-- CreateIndex
CREATE INDEX "Expense_billable_idx" ON "public"."Expense"("billable");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "public"."Expense"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_projectId_billable_idx" ON "public"."Expense"("projectId", "billable");

-- CreateIndex
CREATE INDEX "Expense_userId_date_idx" ON "public"."Expense"("userId", "date");

-- CreateIndex
CREATE INDEX "Expense_reimbursed_userId_idx" ON "public"."Expense"("reimbursed", "userId");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "public"."Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_sentAt_idx" ON "public"."Invoice"("sentAt");

-- CreateIndex
CREATE INDEX "Invoice_paidAt_idx" ON "public"."Invoice"("paidAt");

-- CreateIndex
CREATE INDEX "Invoice_billingType_idx" ON "public"."Invoice"("billingType");

-- CreateIndex
CREATE INDEX "Invoice_clientId_status_idx" ON "public"."Invoice"("clientId", "status");

-- CreateIndex
CREATE INDEX "Invoice_status_dueDate_idx" ON "public"."Invoice"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_clientId_status_dueDate_idx" ON "public"."Invoice"("clientId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_projectId_status_idx" ON "public"."Invoice"("projectId", "status");

-- CreateIndex
CREATE INDEX "Invoice_status_createdAt_idx" ON "public"."Invoice"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_clientId_dueDate_idx" ON "public"."Invoice"("clientId", "dueDate");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "public"."Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_convertedToClient_idx" ON "public"."Lead"("convertedToClient");

-- CreateIndex
CREATE INDEX "Lead_convertedAt_idx" ON "public"."Lead"("convertedAt");

-- CreateIndex
CREATE INDEX "Lead_status_assignedTo_idx" ON "public"."Lead"("status", "assignedTo");

-- CreateIndex
CREATE INDEX "Lead_status_nextFollowUp_idx" ON "public"."Lead"("status", "nextFollowUp");

-- CreateIndex
CREATE INDEX "Lead_assignedTo_nextFollowUp_idx" ON "public"."Lead"("assignedTo", "nextFollowUp");

-- CreateIndex
CREATE INDEX "Lead_qualificationScore_status_idx" ON "public"."Lead"("qualificationScore", "status");

-- CreateIndex
CREATE INDEX "LeadActivity_completedAt_idx" ON "public"."LeadActivity"("completedAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_type_idx" ON "public"."LeadActivity"("leadId", "type");

-- CreateIndex
CREATE INDEX "LeadActivity_userId_scheduledAt_idx" ON "public"."LeadActivity"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "LeadActivity_type_scheduledAt_idx" ON "public"."LeadActivity"("type", "scheduledAt");

-- CreateIndex
CREATE INDEX "Message_parentId_idx" ON "public"."Message"("parentId");

-- CreateIndex
CREATE INDEX "Message_messageType_idx" ON "public"."Message"("messageType");

-- CreateIndex
CREATE INDEX "Message_priority_idx" ON "public"."Message"("priority");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "public"."Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_readAt_idx" ON "public"."Message"("receiverId", "readAt");

-- CreateIndex
CREATE INDEX "Message_channelId_createdAt_idx" ON "public"."Message"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_projectId_createdAt_idx" ON "public"."Message"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_readAt_createdAt_idx" ON "public"."Message"("receiverId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReaction_emoji_idx" ON "public"."MessageReaction"("emoji");

-- CreateIndex
CREATE INDEX "MessageReaction_createdAt_idx" ON "public"."MessageReaction"("createdAt");

-- CreateIndex
CREATE INDEX "MessageRead_messageId_idx" ON "public"."MessageRead"("messageId");

-- CreateIndex
CREATE INDEX "MessageRead_userId_readAt_idx" ON "public"."MessageRead"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_projectId_idx" ON "public"."Notification"("projectId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "public"."Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "public"."Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "public"."Notification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_processedAt_idx" ON "public"."Payment"("processedAt");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_status_idx" ON "public"."Payment"("invoiceId", "status");

-- CreateIndex
CREATE INDEX "Payment_status_processedAt_idx" ON "public"."Payment"("status", "processedAt");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_status_idx" ON "public"."Payment"("paymentMethod", "status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "public"."Project"("createdAt");

-- CreateIndex
CREATE INDEX "Project_updatedAt_idx" ON "public"."Project"("updatedAt");

-- CreateIndex
CREATE INDEX "Project_completionRate_idx" ON "public"."Project"("completionRate");

-- CreateIndex
CREATE INDEX "Project_isClientVisible_idx" ON "public"."Project"("isClientVisible");

-- CreateIndex
CREATE INDEX "Project_clientId_status_idx" ON "public"."Project"("clientId", "status");

-- CreateIndex
CREATE INDEX "Project_managerId_status_idx" ON "public"."Project"("managerId", "status");

-- CreateIndex
CREATE INDEX "Project_clientId_status_deletedAt_idx" ON "public"."Project"("clientId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Project_status_priority_createdAt_idx" ON "public"."Project"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Project_status_updatedAt_idx" ON "public"."Project"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Project_managerId_priority_status_idx" ON "public"."Project"("managerId", "priority", "status");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "public"."Task"("createdAt");

-- CreateIndex
CREATE INDEX "Task_updatedAt_idx" ON "public"."Task"("updatedAt");

-- CreateIndex
CREATE INDEX "Task_completedAt_idx" ON "public"."Task"("completedAt");

-- CreateIndex
CREATE INDEX "Task_startDate_idx" ON "public"."Task"("startDate");

-- CreateIndex
CREATE INDEX "Task_isMilestone_idx" ON "public"."Task"("isMilestone");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "public"."Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_idx" ON "public"."Task"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Task_projectId_assigneeId_idx" ON "public"."Task"("projectId", "assigneeId");

-- CreateIndex
CREATE INDEX "Task_status_priority_dueDate_idx" ON "public"."Task"("status", "priority", "dueDate");

-- CreateIndex
CREATE INDEX "Task_assigneeId_dueDate_status_idx" ON "public"."Task"("assigneeId", "dueDate", "status");

-- CreateIndex
CREATE INDEX "Task_projectId_priority_status_idx" ON "public"."Task"("projectId", "priority", "status");

-- CreateIndex
CREATE INDEX "Task_status_dueDate_idx" ON "public"."Task"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Task_assigneeId_priority_idx" ON "public"."Task"("assigneeId", "priority");

-- CreateIndex
CREATE INDEX "Team_createdAt_idx" ON "public"."Team"("createdAt");

-- CreateIndex
CREATE INDEX "Team_name_deletedAt_idx" ON "public"."Team"("name", "deletedAt");

-- CreateIndex
CREATE INDEX "TeamMember_isActive_idx" ON "public"."TeamMember"("isActive");

-- CreateIndex
CREATE INDEX "TeamMember_startDate_idx" ON "public"."TeamMember"("startDate");

-- CreateIndex
CREATE INDEX "TeamMember_endDate_idx" ON "public"."TeamMember"("endDate");

-- CreateIndex
CREATE INDEX "TeamMember_projectId_isActive_idx" ON "public"."TeamMember"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "TeamMember_userId_isActive_idx" ON "public"."TeamMember"("userId", "isActive");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_role_idx" ON "public"."TeamMember"("teamId", "role");

-- CreateIndex
CREATE INDEX "TimeEntry_status_idx" ON "public"."TimeEntry"("status");

-- CreateIndex
CREATE INDEX "TimeEntry_invoiceId_idx" ON "public"."TimeEntry"("invoiceId");

-- CreateIndex
CREATE INDEX "TimeEntry_createdAt_idx" ON "public"."TimeEntry"("createdAt");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_date_idx" ON "public"."TimeEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_projectId_date_idx" ON "public"."TimeEntry"("projectId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_status_idx" ON "public"."TimeEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "TimeEntry_billable_status_date_idx" ON "public"."TimeEntry"("billable", "status", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_projectId_billable_status_idx" ON "public"."TimeEntry"("projectId", "billable", "status");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_projectId_date_idx" ON "public"."TimeEntry"("userId", "projectId", "date");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "public"."User"("updatedAt");

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "public"."User"("emailVerified");

-- CreateIndex
CREATE INDEX "User_role_deletedAt_idx" ON "public"."User"("role", "deletedAt");

-- CreateIndex
CREATE INDEX "User_role_createdAt_idx" ON "public"."User"("role", "createdAt");

-- CreateIndex
CREATE INDEX "User_email_deletedAt_idx" ON "public"."User"("email", "deletedAt");
