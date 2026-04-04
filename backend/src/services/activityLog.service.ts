// ============================================
// PulseOps CRM - Activity Log Service
// ============================================

import prisma from '../lib/prisma';
import { ActivityLogInput } from '../types/auth.types';

class ActivityLogService {
  /**
   * Log an activity to the audit trail
   */
  async log(input: ActivityLogInput): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          orgId: input.orgId,
          userId: input.userId,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          resourceName: input.resourceName,
          changes: input.changes ?? undefined,
          metadata: input.metadata ?? undefined,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      // Activity logging should never crash the main flow
      console.error('❌ Failed to log activity:', error);
    }
  }

  /**
   * Create a diff of changes between old and new values
   */
  diffChanges(
    before: Record<string, any>,
    after: Record<string, any>
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    for (const key of Object.keys(after)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = { old: before[key], new: after[key] };
      }
    }

    return changes;
  }
}

export const activityLogService = new ActivityLogService();
