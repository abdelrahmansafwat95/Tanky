import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { logger } from "./logger";

type AuditAction =
  | "login"
  | "logout"
  | "login_failed"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "authorize_pump"
  | "complete_transaction"
  | "topup_budget"
  | "suspend_user"
  | "reactivate_user"
  | "export_data";

export async function audit(
  req: Request,
  action: AuditAction,
  opts: {
    userId?: string | null;
    entityType?: string;
    entityId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      userId: opts.userId ?? req.user?.sub ?? null,
      action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      description: opts.description,
      ipAddress: (req.ip ?? req.socket.remoteAddress ?? "").slice(0, 45),
      userAgent: req.headers["user-agent"] ?? null,
      metadata: opts.metadata ?? null,
    });
  } catch (err) {
    logger.warn({ err, action }, "Failed to write audit log");
  }
}
