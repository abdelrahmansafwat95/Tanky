import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { companiesTable } from "./companies";
import { vehiclesTable } from "./vehicles";

export const driverStatusEnum = pgEnum("driver_status", [
  "active",
  "suspended",
  "on_leave",
  "terminated",
]);

export const driversTable = pgTable(
  "drivers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    nationalId: varchar("national_id", { length: 20 }).notNull().unique(),
    licenseNumber: varchar("license_number", { length: 50 })
      .notNull()
      .unique(),
    licenseExpiry: date("license_expiry").notNull(),
    assignedVehicleId: uuid("assigned_vehicle_id").references(
      () => vehiclesTable.id,
      { onDelete: "set null" },
    ),
    dailyLimitEgp: numeric("daily_limit_egp", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    monthlyLimitEgp: numeric("monthly_limit_egp", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    pinHash: varchar("pin_hash", { length: 255 }),
    status: driverStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("drivers_company_idx").on(t.companyId),
    index("drivers_employee_idx").on(t.companyId, t.employeeId),
    index("drivers_status_idx").on(t.status),
  ],
);

export const insertDriverSchema = createInsertSchema(driversTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
