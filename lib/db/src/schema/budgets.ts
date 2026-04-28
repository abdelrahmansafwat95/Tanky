import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  numeric,
  text,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { vehiclesTable } from "./vehicles";
import { driversTable } from "./drivers";
import { usersTable } from "./users";

export const budgetTypeEnum = pgEnum("budget_type", [
  "company_topup",
  "vehicle_allocation",
  "driver_allocation",
  "deduction",
  "refund",
  "transfer",
]);

export const budgetAllocationsTable = pgTable(
  "budget_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id, {
      onDelete: "set null",
    }),
    driverId: uuid("driver_id").references(() => driversTable.id, {
      onDelete: "set null",
    }),
    type: budgetTypeEnum("type").notNull(),
    amountEgp: numeric("amount_egp", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    referenceNumber: varchar("reference_number", { length: 100 }),
    effectiveFrom: timestamp("effective_from", { withTimezone: true })
      .notNull()
      .defaultNow(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("budgets_company_idx").on(t.companyId),
    index("budgets_vehicle_idx").on(t.vehicleId),
    index("budgets_driver_idx").on(t.driverId),
    index("budgets_type_idx").on(t.type),
    index("budgets_created_idx").on(t.createdAt),
  ],
);

export const insertBudgetAllocationSchema = createInsertSchema(
  budgetAllocationsTable,
).omit({ id: true, createdAt: true });

export type InsertBudgetAllocation = z.infer<
  typeof insertBudgetAllocationSchema
>;
export type BudgetAllocation = typeof budgetAllocationsTable.$inferSelect;
