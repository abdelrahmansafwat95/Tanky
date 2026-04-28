import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { stationsTable } from "./stations";

export const pumpStatusEnum = pgEnum("pump_status", [
  "available",
  "in_use",
  "out_of_service",
  "maintenance",
]);

export const fuelTypeEnum = pgEnum("fuel_type", [
  "gasoline_80",
  "gasoline_92",
  "gasoline_95",
  "diesel",
  "cng",
]);

export const pumpsTable = pgTable(
  "pumps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stationId: uuid("station_id")
      .notNull()
      .references(() => stationsTable.id, { onDelete: "cascade" }),
    pumpNumber: integer("pump_number").notNull(),
    qrCodeToken: varchar("qr_code_token", { length: 128 }).notNull().unique(),
    serialNumber: varchar("serial_number", { length: 100 }),
    supportedFuelTypes: fuelTypeEnum("supported_fuel_types")
      .array()
      .notNull()
      .default(["gasoline_92", "gasoline_95", "diesel"]),
    status: pumpStatusEnum("status").notNull().default("available"),
    lastAuthorizedAt: timestamp("last_authorized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("pumps_station_idx").on(t.stationId),
    index("pumps_status_idx").on(t.status),
  ],
);

export const insertPumpSchema = createInsertSchema(pumpsTable).omit({
  id: true,
  lastAuthorizedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPump = z.infer<typeof insertPumpSchema>;
export type Pump = typeof pumpsTable.$inferSelect;

export const fuelPricesTable = pgTable(
  "fuel_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    pricePerLiterEgp: varchar("price_per_liter_egp", { length: 20 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true })
      .notNull()
      .defaultNow(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fuel_prices_type_idx").on(t.fuelType),
    index("fuel_prices_effective_idx").on(t.effectiveFrom, t.effectiveTo),
  ],
);

export const insertFuelPriceSchema = createInsertSchema(fuelPricesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertFuelPrice = z.infer<typeof insertFuelPriceSchema>;
export type FuelPrice = typeof fuelPricesTable.$inferSelect;
