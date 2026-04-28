import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { stationsTable } from "./stations";

export const attendantStatusEnum = pgEnum("attendant_status", [
  "active",
  "off_shift",
  "suspended",
  "terminated",
]);

export const stationAttendantsTable = pgTable(
  "station_attendants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    stationId: uuid("station_id")
      .notNull()
      .references(() => stationsTable.id, { onDelete: "cascade" }),
    employeeNumber: varchar("employee_number", { length: 50 }).notNull(),
    nationalId: varchar("national_id", { length: 20 }).notNull().unique(),
    pinHash: varchar("pin_hash", { length: 255 }).notNull(),
    shiftStart: varchar("shift_start", { length: 5 }),
    shiftEnd: varchar("shift_end", { length: 5 }),
    status: attendantStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("attendants_station_idx").on(t.stationId),
    index("attendants_status_idx").on(t.status),
  ],
);

export const insertStationAttendantSchema = createInsertSchema(
  stationAttendantsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertStationAttendant = z.infer<
  typeof insertStationAttendantSchema
>;
export type StationAttendant = typeof stationAttendantsTable.$inferSelect;
