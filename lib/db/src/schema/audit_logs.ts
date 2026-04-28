import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  text,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const auditActionEnum = pgEnum("audit_action", [
  "login",
  "logout",
  "login_failed",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "authorize_pump",
  "complete_transaction",
  "topup_budget",
  "suspend_user",
  "reactivate_user",
  "export_data",
]);

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: varchar("entity_id", { length: 100 }),
    description: text("description"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_user_idx").on(t.userId),
    index("audit_action_idx").on(t.action),
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_created_idx").on(t.createdAt),
  ],
);

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
