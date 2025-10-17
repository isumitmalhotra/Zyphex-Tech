-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_deletedAt_idx" ON "public"."Task"("deletedAt");

-- CreateIndex
CREATE INDEX "Task_id_deletedAt_idx" ON "public"."Task"("id", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_status_deletedAt_idx" ON "public"."Task"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_priority_deletedAt_idx" ON "public"."Task"("priority", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_projectId_deletedAt_idx" ON "public"."Task"("projectId", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_assigneeId_deletedAt_idx" ON "public"."Task"("assigneeId", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_projectId_status_deletedAt_idx" ON "public"."Task"("projectId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_deletedAt_idx" ON "public"."Task"("assigneeId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_assigneeId_dueDate_deletedAt_idx" ON "public"."Task"("assigneeId", "dueDate", "deletedAt");
