# @workspace/db — FuelGo Database

PostgreSQL schema for the **FuelGo** B2B fuel management platform (Egyptian market).

Powered by **Drizzle ORM** + **drizzle-zod** for type-safe queries and validation.

## What's Inside

13 tables organized by domain:

| Domain        | Tables                                                    |
| ------------- | --------------------------------------------------------- |
| Tenants       | `companies`                                               |
| Identity      | `users`, `sessions`                                       |
| Fleet         | `vehicles`, `nfc_tags`, `drivers`                         |
| Stations      | `stations`, `pumps`, `fuel_prices`, `station_attendants`  |
| Operations    | `authorizations`, `transactions`                          |
| Finance       | `budget_allocations`                                      |
| Security      | `audit_logs`                                              |

## Folder Structure

```
lib/db/
├── drizzle/
│   └── 0000_init_fuelgo.sql      ← Pure SQL — run with psql to create everything
├── src/
│   ├── index.ts                  ← Drizzle client (db, pool)
│   ├── seed.ts                   ← Demo data: Cairo Express Logistics + Ahmed Hassan
│   └── schema/
│       ├── index.ts              ← Re-exports every table
│       ├── companies.ts
│       ├── users.ts              ← + sessions
│       ├── stations.ts
│       ├── pumps.ts              ← + fuel_prices + fuel_type enum
│       ├── vehicles.ts           ← + nfc_tags
│       ├── drivers.ts
│       ├── station_attendants.ts
│       ├── transactions.ts       ← authorizations + transactions
│       ├── budgets.ts
│       └── audit_logs.ts
├── drizzle.config.ts
└── package.json
```

## Setup — Two Paths

### Path A: Pure SQL (any PostgreSQL host)

```bash
psql "$DATABASE_URL" -f lib/db/drizzle/0000_init_fuelgo.sql
```

That's it — every table, enum, and index is created.

### Path B: Drizzle Kit (recommended in this repo)

```bash
# 1. Make sure DATABASE_URL is set in your environment
export DATABASE_URL="postgres://user:pass@host:5432/fuelgo"

# 2. Push the schema to the DB
pnpm --filter @workspace/db run push

# 3. (Optional) Seed demo data
pnpm --filter @workspace/db run seed

# 4. (Optional) Open Drizzle Studio to browse tables
pnpm --filter @workspace/db run studio
```

## Importing in Your Code

```ts
import { db, vehiclesTable, transactionsTable, eq } from "@workspace/db";

const myVehicles = await db
  .select()
  .from(vehiclesTable)
  .where(eq(vehiclesTable.companyId, companyId));
```

## Demo Credentials (after `seed`)

| Role            | Email                              | Password           |
| --------------- | ---------------------------------- | ------------------ |
| Company admin   | `admin@cairoexpress.eg`            | `ChangeMe123!`     |
| Driver          | `ahmed.hassan@cairoexpress.eg`     | `DriverPass123!`   |
| Attendant       | `attendant.maadi@wataniya.eg`      | `AttendantPass123!`|

> The seed uses **SHA-256** hashing for clarity. Replace with **bcrypt/argon2** before going to production.
