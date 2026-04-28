-- ============================================================================
-- FuelGo Database Schema (PostgreSQL)
-- ============================================================================
-- B2B fuel management ecosystem for the Egyptian market.
-- Run this in your PostgreSQL instance to create the full schema:
--   psql "$DATABASE_URL" -f 0000_init_fuelgo.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------- ENUM TYPES ----------------------------------
CREATE TYPE "company_status"        AS ENUM ('active','suspended','trial','closed');
CREATE TYPE "user_role"             AS ENUM ('super_admin','company_admin','company_manager','driver','station_attendant','station_manager');
CREATE TYPE "station_status"        AS ENUM ('active','inactive','maintenance');
CREATE TYPE "station_brand"         AS ENUM ('misr_petroleum','wataniya','totalenergies','chillout','mobil','shell','coop','emarat','other');
CREATE TYPE "pump_status"           AS ENUM ('available','in_use','out_of_service','maintenance');
CREATE TYPE "fuel_type"             AS ENUM ('gasoline_80','gasoline_92','gasoline_95','diesel','cng');
CREATE TYPE "vehicle_status"        AS ENUM ('active','inactive','maintenance','retired');
CREATE TYPE "nfc_tag_status"        AS ENUM ('unassigned','assigned','lost','disabled');
CREATE TYPE "driver_status"         AS ENUM ('active','suspended','on_leave','terminated');
CREATE TYPE "attendant_status"      AS ENUM ('active','off_shift','suspended','terminated');
CREATE TYPE "authorization_status"  AS ENUM ('pending','approved','rejected','expired','completed','cancelled');
CREATE TYPE "transaction_status"    AS ENUM ('completed','disputed','refunded','voided');
CREATE TYPE "budget_type"           AS ENUM ('company_topup','vehicle_allocation','driver_allocation','deduction','refund','transfer');
CREATE TYPE "audit_action"          AS ENUM ('login','logout','login_failed','create','update','delete','approve','reject','authorize_pump','complete_transaction','topup_budget','suspend_user','reactivate_user','export_data');

-- ----------------------------- COMPANIES -----------------------------------
CREATE TABLE "companies" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name_en"                  varchar(200) NOT NULL,
  "name_ar"                  varchar(200) NOT NULL,
  "commercial_register_no"   varchar(50)  NOT NULL UNIQUE,
  "tax_id"                   varchar(50)  NOT NULL UNIQUE,
  "address"                  text         NOT NULL,
  "city"                     varchar(100) NOT NULL,
  "governorate"              varchar(100) NOT NULL,
  "contact_person"           varchar(200) NOT NULL,
  "contact_phone"            varchar(20)  NOT NULL,
  "contact_email"            varchar(200) NOT NULL,
  "credit_limit_egp"         numeric(14,2) NOT NULL DEFAULT 0,
  "current_balance_egp"      numeric(14,2) NOT NULL DEFAULT 0,
  "status"                   "company_status" NOT NULL DEFAULT 'trial',
  "created_at"               timestamptz  NOT NULL DEFAULT now(),
  "updated_at"               timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX "companies_status_idx"      ON "companies" ("status");
CREATE INDEX "companies_governorate_idx" ON "companies" ("governorate");

-- ----------------------------- USERS ---------------------------------------
CREATE TABLE "users" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"               varchar(200) NOT NULL UNIQUE,
  "phone"               varchar(20)  NOT NULL UNIQUE,
  "password_hash"       text         NOT NULL,
  "full_name"           varchar(200) NOT NULL,
  "role"                "user_role"  NOT NULL,
  "company_id"          uuid REFERENCES "companies"("id") ON DELETE SET NULL,
  "station_id"          uuid,
  "is_active"           boolean      NOT NULL DEFAULT true,
  "email_verified_at"   timestamptz,
  "phone_verified_at"   timestamptz,
  "last_login_at"       timestamptz,
  "created_at"          timestamptz  NOT NULL DEFAULT now(),
  "updated_at"          timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX "users_role_idx"    ON "users" ("role");
CREATE INDEX "users_company_idx" ON "users" ("company_id");
CREATE INDEX "users_station_idx" ON "users" ("station_id");

-- ----------------------------- SESSIONS ------------------------------------
CREATE TABLE "sessions" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"      uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"   text NOT NULL UNIQUE,
  "device_info"  text,
  "ip_address"   varchar(45),
  "user_agent"   text,
  "expires_at"   timestamptz NOT NULL,
  "revoked_at"   timestamptz,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "sessions_user_idx"    ON "sessions" ("user_id");
CREATE INDEX "sessions_expires_idx" ON "sessions" ("expires_at");

-- ----------------------------- STATIONS ------------------------------------
CREATE TABLE "stations" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"          varchar(200) NOT NULL,
  "brand"         "station_brand" NOT NULL,
  "address"       text NOT NULL,
  "city"          varchar(100) NOT NULL,
  "governorate"   varchar(100) NOT NULL,
  "latitude"      numeric(10,7) NOT NULL,
  "longitude"     numeric(10,7) NOT NULL,
  "phone"         varchar(20),
  "is_24_hours"   text NOT NULL DEFAULT 'false',
  "opening_time"  varchar(5),
  "closing_time"  varchar(5),
  "status"        "station_status" NOT NULL DEFAULT 'active',
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "updated_at"    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "stations_status_idx" ON "stations" ("status");
CREATE INDEX "stations_city_idx"   ON "stations" ("city");
CREATE INDEX "stations_brand_idx"  ON "stations" ("brand");

-- ----------------------------- PUMPS ---------------------------------------
CREATE TABLE "pumps" (
  "id"                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "station_id"             uuid NOT NULL REFERENCES "stations"("id") ON DELETE CASCADE,
  "pump_number"            integer NOT NULL,
  "qr_code_token"          varchar(128) NOT NULL UNIQUE,
  "serial_number"          varchar(100),
  "supported_fuel_types"   "fuel_type"[] NOT NULL DEFAULT ARRAY['gasoline_92','gasoline_95','diesel']::"fuel_type"[],
  "status"                 "pump_status" NOT NULL DEFAULT 'available',
  "last_authorized_at"     timestamptz,
  "created_at"             timestamptz NOT NULL DEFAULT now(),
  "updated_at"             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "pumps_station_idx" ON "pumps" ("station_id");
CREATE INDEX "pumps_status_idx"  ON "pumps" ("status");

-- ----------------------------- FUEL PRICES ---------------------------------
CREATE TABLE "fuel_prices" (
  "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "fuel_type"            "fuel_type" NOT NULL,
  "price_per_liter_egp"  varchar(20) NOT NULL,
  "effective_from"       timestamptz NOT NULL DEFAULT now(),
  "effective_to"         timestamptz,
  "created_at"           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "fuel_prices_type_idx"      ON "fuel_prices" ("fuel_type");
CREATE INDEX "fuel_prices_effective_idx" ON "fuel_prices" ("effective_from","effective_to");

-- ----------------------------- VEHICLES ------------------------------------
CREATE TABLE "vehicles" (
  "id"                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id"                  uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "plate_number"                varchar(20) NOT NULL UNIQUE,
  "make"                        varchar(100) NOT NULL,
  "model"                       varchar(100) NOT NULL,
  "year"                        integer NOT NULL,
  "color"                       varchar(50),
  "fuel_type"                   "fuel_type" NOT NULL,
  "tank_capacity_liters"        numeric(6,2) NOT NULL,
  "nfc_tag_uid"                 varchar(64) UNIQUE,
  "monthly_budget_egp"          numeric(12,2) NOT NULL DEFAULT 0,
  "daily_budget_egp"            numeric(12,2) NOT NULL DEFAULT 0,
  "current_month_spent_egp"     numeric(12,2) NOT NULL DEFAULT 0,
  "current_day_spent_egp"       numeric(12,2) NOT NULL DEFAULT 0,
  "odometer_km"                 integer NOT NULL DEFAULT 0,
  "status"                      "vehicle_status" NOT NULL DEFAULT 'active',
  "created_at"                  timestamptz NOT NULL DEFAULT now(),
  "updated_at"                  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "vehicles_company_idx" ON "vehicles" ("company_id");
CREATE INDEX "vehicles_status_idx"  ON "vehicles" ("status");
CREATE INDEX "vehicles_nfc_idx"     ON "vehicles" ("nfc_tag_uid");

-- ----------------------------- NFC TAGS ------------------------------------
CREATE TABLE "nfc_tags" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "uid"          varchar(64) NOT NULL UNIQUE,
  "vehicle_id"   uuid REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "status"       "nfc_tag_status" NOT NULL DEFAULT 'unassigned',
  "assigned_at"  timestamptz,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "nfc_tags_status_idx"  ON "nfc_tags" ("status");
CREATE INDEX "nfc_tags_vehicle_idx" ON "nfc_tags" ("vehicle_id");

-- ----------------------------- DRIVERS -------------------------------------
CREATE TABLE "drivers" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"               uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id"            uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "employee_id"           varchar(50) NOT NULL,
  "national_id"           varchar(20) NOT NULL UNIQUE,
  "license_number"        varchar(50) NOT NULL UNIQUE,
  "license_expiry"        date NOT NULL,
  "assigned_vehicle_id"   uuid REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "daily_limit_egp"       numeric(10,2) NOT NULL DEFAULT 0,
  "monthly_limit_egp"     numeric(12,2) NOT NULL DEFAULT 0,
  "pin_hash"              varchar(255),
  "status"                "driver_status" NOT NULL DEFAULT 'active',
  "created_at"            timestamptz NOT NULL DEFAULT now(),
  "updated_at"            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "drivers_company_idx"  ON "drivers" ("company_id");
CREATE INDEX "drivers_employee_idx" ON "drivers" ("company_id","employee_id");
CREATE INDEX "drivers_status_idx"   ON "drivers" ("status");

-- ----------------------------- STATION ATTENDANTS --------------------------
CREATE TABLE "station_attendants" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "station_id"        uuid NOT NULL REFERENCES "stations"("id") ON DELETE CASCADE,
  "employee_number"   varchar(50) NOT NULL,
  "national_id"       varchar(20) NOT NULL UNIQUE,
  "pin_hash"          varchar(255) NOT NULL,
  "shift_start"       varchar(5),
  "shift_end"         varchar(5),
  "status"            "attendant_status" NOT NULL DEFAULT 'active',
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_at"        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "attendants_station_idx" ON "station_attendants" ("station_id");
CREATE INDEX "attendants_status_idx"  ON "station_attendants" ("status");

-- ----------------------------- AUTHORIZATIONS ------------------------------
CREATE TABLE "authorizations" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id"               uuid NOT NULL REFERENCES "vehicles"("id") ON DELETE RESTRICT,
  "driver_id"                uuid NOT NULL REFERENCES "drivers"("id") ON DELETE RESTRICT,
  "pump_id"                  uuid NOT NULL REFERENCES "pumps"("id") ON DELETE RESTRICT,
  "station_id"               uuid NOT NULL REFERENCES "stations"("id") ON DELETE RESTRICT,
  "attendant_id"             uuid REFERENCES "station_attendants"("id") ON DELETE SET NULL,
  "fuel_type"                "fuel_type" NOT NULL,
  "requested_amount_egp"     numeric(10,2),
  "requested_liters"         numeric(8,3),
  "max_authorized_liters"    numeric(8,3) NOT NULL,
  "max_authorized_egp"       numeric(10,2) NOT NULL,
  "price_per_liter_egp"      numeric(8,3) NOT NULL,
  "otp_code"                 varchar(10),
  "odometer_km"              integer,
  "status"                   "authorization_status" NOT NULL DEFAULT 'pending',
  "expires_at"               timestamptz NOT NULL,
  "approved_at"              timestamptz,
  "completed_at"             timestamptz,
  "rejection_reason"         text,
  "created_at"               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "authz_vehicle_idx" ON "authorizations" ("vehicle_id");
CREATE INDEX "authz_driver_idx"  ON "authorizations" ("driver_id");
CREATE INDEX "authz_pump_idx"    ON "authorizations" ("pump_id");
CREATE INDEX "authz_status_idx"  ON "authorizations" ("status");
CREATE INDEX "authz_created_idx" ON "authorizations" ("created_at");

-- ----------------------------- TRANSACTIONS --------------------------------
CREATE TABLE "transactions" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_ref"     varchar(30) NOT NULL UNIQUE,
  "authorization_id"    uuid NOT NULL UNIQUE REFERENCES "authorizations"("id") ON DELETE RESTRICT,
  "vehicle_id"          uuid NOT NULL REFERENCES "vehicles"("id") ON DELETE RESTRICT,
  "driver_id"           uuid NOT NULL REFERENCES "drivers"("id") ON DELETE RESTRICT,
  "pump_id"             uuid NOT NULL REFERENCES "pumps"("id") ON DELETE RESTRICT,
  "station_id"          uuid NOT NULL REFERENCES "stations"("id") ON DELETE RESTRICT,
  "attendant_id"        uuid REFERENCES "station_attendants"("id") ON DELETE SET NULL,
  "company_id"          uuid NOT NULL REFERENCES "companies"("id") ON DELETE RESTRICT,
  "fuel_type"           "fuel_type" NOT NULL,
  "liters_dispensed"    numeric(8,3) NOT NULL,
  "price_per_liter_egp" numeric(8,3) NOT NULL,
  "total_amount_egp"    numeric(10,2) NOT NULL,
  "odometer_km"         integer,
  "receipt_url"         text,
  "status"              "transaction_status" NOT NULL DEFAULT 'completed',
  "dispensed_at"        timestamptz NOT NULL,
  "created_at"          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "txn_company_idx"   ON "transactions" ("company_id");
CREATE INDEX "txn_vehicle_idx"   ON "transactions" ("vehicle_id");
CREATE INDEX "txn_driver_idx"    ON "transactions" ("driver_id");
CREATE INDEX "txn_station_idx"   ON "transactions" ("station_id");
CREATE INDEX "txn_dispensed_idx" ON "transactions" ("dispensed_at");
CREATE INDEX "txn_status_idx"    ON "transactions" ("status");

-- ----------------------------- BUDGET ALLOCATIONS --------------------------
CREATE TABLE "budget_allocations" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id"          uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "vehicle_id"          uuid REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "driver_id"           uuid REFERENCES "drivers"("id") ON DELETE SET NULL,
  "type"                "budget_type" NOT NULL,
  "amount_egp"          numeric(12,2) NOT NULL,
  "description"         text,
  "reference_number"    varchar(100),
  "effective_from"      timestamptz NOT NULL DEFAULT now(),
  "effective_to"        timestamptz,
  "created_by_user_id"  uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at"          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "budgets_company_idx" ON "budget_allocations" ("company_id");
CREATE INDEX "budgets_vehicle_idx" ON "budget_allocations" ("vehicle_id");
CREATE INDEX "budgets_driver_idx"  ON "budget_allocations" ("driver_id");
CREATE INDEX "budgets_type_idx"    ON "budget_allocations" ("type");
CREATE INDEX "budgets_created_idx" ON "budget_allocations" ("created_at");

-- ----------------------------- AUDIT LOGS ----------------------------------
CREATE TABLE "audit_logs" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"       uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action"        "audit_action" NOT NULL,
  "entity_type"   varchar(100),
  "entity_id"     varchar(100),
  "description"   text,
  "ip_address"    varchar(45),
  "user_agent"    text,
  "metadata"      jsonb,
  "created_at"    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "audit_user_idx"    ON "audit_logs" ("user_id");
CREATE INDEX "audit_action_idx"  ON "audit_logs" ("action");
CREATE INDEX "audit_entity_idx"  ON "audit_logs" ("entity_type","entity_id");
CREATE INDEX "audit_created_idx" ON "audit_logs" ("created_at");

-- ============================================================================
-- End of schema. Total tables: 13.
-- ============================================================================
