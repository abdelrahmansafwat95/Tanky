import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stationStatusEnum = pgEnum("station_status", [
  "active",
  "inactive",
  "maintenance",
]);

export const stationBrandEnum = pgEnum("station_brand", [
  "misr_petroleum",
  "wataniya",
  "totalenergies",
  "chillout",
  "mobil",
  "shell",
  "coop",
  "emarat",
  "other",
]);

export const stationsTable = pgTable(
  "stations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    brand: stationBrandEnum("brand").notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    governorate: varchar("governorate", { length: 100 }).notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    is24Hours: text("is_24_hours").notNull().default("false"),
    openingTime: varchar("opening_time", { length: 5 }),
    closingTime: varchar("closing_time", { length: 5 }),
    status: stationStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("stations_status_idx").on(t.status),
    index("stations_city_idx").on(t.city),
    index("stations_brand_idx").on(t.brand),
  ],
);

export const insertStationSchema = createInsertSchema(stationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStation = z.infer<typeof insertStationSchema>;
export type Station = typeof stationsTable.$inferSelect;
