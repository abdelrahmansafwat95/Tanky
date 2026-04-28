import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companyStatusEnum = pgEnum("company_status", [
  "active",
  "suspended",
  "trial",
  "closed",
]);

export const companiesTable = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameAr: varchar("name_ar", { length: 200 }).notNull(),
    commercialRegisterNo: varchar("commercial_register_no", { length: 50 })
      .notNull()
      .unique(),
    taxId: varchar("tax_id", { length: 50 }).notNull().unique(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    governorate: varchar("governorate", { length: 100 }).notNull(),
    contactPerson: varchar("contact_person", { length: 200 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    contactEmail: varchar("contact_email", { length: 200 }).notNull(),
    creditLimitEgp: numeric("credit_limit_egp", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    currentBalanceEgp: numeric("current_balance_egp", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0"),
    status: companyStatusEnum("status").notNull().default("trial"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("companies_status_idx").on(t.status),
    index("companies_governorate_idx").on(t.governorate),
  ],
);

export const insertCompanySchema = createInsertSchema(companiesTable).omit({
  id: true,
  currentBalanceEgp: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
