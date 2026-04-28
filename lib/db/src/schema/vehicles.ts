import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { fuelTypeEnum } from "./pumps";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "active",
  "inactive",
  "maintenance",
  "retired",
]);

export const vehiclesTable = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    plateNumber: varchar("plate_number", { length: 20 }).notNull().unique(),
    make: varchar("make", { length: 100 }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    year: integer("year").notNull(),
    color: varchar("color", { length: 50 }),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    tankCapacityLiters: numeric("tank_capacity_liters", {
      precision: 6,
      scale: 2,
    }).notNull(),
    nfcTagUid: varchar("nfc_tag_uid", { length: 64 }).unique(),
    monthlyBudgetEgp: numeric("monthly_budget_egp", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    dailyBudgetEgp: numeric("daily_budget_egp", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    currentMonthSpentEgp: numeric("current_month_spent_egp", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    currentDaySpentEgp: numeric("current_day_spent_egp", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    odometerKm: integer("odometer_km").notNull().default(0),
    status: vehicleStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("vehicles_company_idx").on(t.companyId),
    index("vehicles_status_idx").on(t.status),
    index("vehicles_nfc_idx").on(t.nfcTagUid),
  ],
);

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({
  id: true,
  currentMonthSpentEgp: true,
  currentDaySpentEgp: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;

export const nfcTagStatusEnum = pgEnum("nfc_tag_status", [
  "unassigned",
  "assigned",
  "lost",
  "disabled",
]);

export const nfcTagsTable = pgTable(
  "nfc_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    uid: varchar("uid", { length: 64 }).notNull().unique(),
    vehicleId: uuid("vehicle_id").references(() => vehiclesTable.id, {
      onDelete: "set null",
    }),
    status: nfcTagStatusEnum("status").notNull().default("unassigned"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("nfc_tags_status_idx").on(t.status),
    index("nfc_tags_vehicle_idx").on(t.vehicleId),
  ],
);

export type NfcTag = typeof nfcTagsTable.$inferSelect;
