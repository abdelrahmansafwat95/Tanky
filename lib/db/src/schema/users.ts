import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "company_admin",
  "company_manager",
  "driver",
  "station_attendant",
  "station_manager",
]);

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 200 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    role: userRoleEnum("role").notNull(),
    companyId: uuid("company_id").references(() => companiesTable.id, {
      onDelete: "set null",
    }),
    stationId: uuid("station_id"),
    isActive: boolean("is_active").notNull().default(true),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("users_role_idx").on(t.role),
    index("users_company_idx").on(t.companyId),
    index("users_station_idx").on(t.stationId),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const sessionsTable = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    deviceInfo: text("device_info"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);

export type Session = typeof sessionsTable.$inferSelect;
