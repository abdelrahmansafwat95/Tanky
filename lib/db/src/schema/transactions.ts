import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  integer,
  numeric,
  text,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { driversTable } from "./drivers";
import { pumpsTable, fuelTypeEnum } from "./pumps";
import { stationsTable } from "./stations";
import { stationAttendantsTable } from "./station_attendants";
import { companiesTable } from "./companies";

export const authorizationStatusEnum = pgEnum("authorization_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "completed",
  "cancelled",
]);

export const authorizationsTable = pgTable(
  "authorizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehiclesTable.id, { onDelete: "restrict" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => driversTable.id, { onDelete: "restrict" }),
    pumpId: uuid("pump_id")
      .notNull()
      .references(() => pumpsTable.id, { onDelete: "restrict" }),
    stationId: uuid("station_id")
      .notNull()
      .references(() => stationsTable.id, { onDelete: "restrict" }),
    attendantId: uuid("attendant_id").references(
      () => stationAttendantsTable.id,
      { onDelete: "set null" },
    ),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    requestedAmountEgp: numeric("requested_amount_egp", {
      precision: 10,
      scale: 2,
    }),
    requestedLiters: numeric("requested_liters", { precision: 8, scale: 3 }),
    maxAuthorizedLiters: numeric("max_authorized_liters", {
      precision: 8,
      scale: 3,
    }).notNull(),
    maxAuthorizedEgp: numeric("max_authorized_egp", {
      precision: 10,
      scale: 2,
    }).notNull(),
    pricePerLiterEgp: numeric("price_per_liter_egp", {
      precision: 8,
      scale: 3,
    }).notNull(),
    otpCode: varchar("otp_code", { length: 10 }),
    odometerKm: integer("odometer_km"),
    status: authorizationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("authz_vehicle_idx").on(t.vehicleId),
    index("authz_driver_idx").on(t.driverId),
    index("authz_pump_idx").on(t.pumpId),
    index("authz_status_idx").on(t.status),
    index("authz_created_idx").on(t.createdAt),
  ],
);

export const insertAuthorizationSchema = createInsertSchema(
  authorizationsTable,
).omit({
  id: true,
  approvedAt: true,
  completedAt: true,
  createdAt: true,
});

export type InsertAuthorization = z.infer<typeof insertAuthorizationSchema>;
export type Authorization = typeof authorizationsTable.$inferSelect;

export const transactionStatusEnum = pgEnum("transaction_status", [
  "completed",
  "disputed",
  "refunded",
  "voided",
]);

export const transactionsTable = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionRef: varchar("transaction_ref", { length: 30 })
      .notNull()
      .unique(),
    authorizationId: uuid("authorization_id")
      .notNull()
      .unique()
      .references(() => authorizationsTable.id, { onDelete: "restrict" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehiclesTable.id, { onDelete: "restrict" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => driversTable.id, { onDelete: "restrict" }),
    pumpId: uuid("pump_id")
      .notNull()
      .references(() => pumpsTable.id, { onDelete: "restrict" }),
    stationId: uuid("station_id")
      .notNull()
      .references(() => stationsTable.id, { onDelete: "restrict" }),
    attendantId: uuid("attendant_id").references(
      () => stationAttendantsTable.id,
      { onDelete: "set null" },
    ),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "restrict" }),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    litersDispensed: numeric("liters_dispensed", {
      precision: 8,
      scale: 3,
    }).notNull(),
    pricePerLiterEgp: numeric("price_per_liter_egp", {
      precision: 8,
      scale: 3,
    }).notNull(),
    totalAmountEgp: numeric("total_amount_egp", {
      precision: 10,
      scale: 2,
    }).notNull(),
    odometerKm: integer("odometer_km"),
    receiptUrl: text("receipt_url"),
    status: transactionStatusEnum("status").notNull().default("completed"),
    dispensedAt: timestamp("dispensed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("txn_company_idx").on(t.companyId),
    index("txn_vehicle_idx").on(t.vehicleId),
    index("txn_driver_idx").on(t.driverId),
    index("txn_station_idx").on(t.stationId),
    index("txn_dispensed_idx").on(t.dispensedAt),
    index("txn_status_idx").on(t.status),
  ],
);

export const insertTransactionSchema = createInsertSchema(
  transactionsTable,
).omit({ id: true, createdAt: true });

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
