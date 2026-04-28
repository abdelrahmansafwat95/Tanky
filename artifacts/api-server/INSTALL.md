# How to install Step 3 (Backend API) into your repo

This zip contains everything you need for the FuelGo backend API. The driver mobile app and the database from earlier steps are not affected.

## What's inside

```
fuelgo-api-step3/
├── PROJECT.md                          (replace at repo root)
├── artifacts/api-server/
│   ├── package.json                    (replace — adds bcryptjs, jsonwebtoken, etc.)
│   ├── README.md                       (new — API reference)
│   ├── INSTALL.md                      (this file)
│   └── src/
│       ├── app.ts                      (replace — adds error handler, trust proxy)
│       ├── lib/
│       │   ├── env.ts                  (new)
│       │   ├── errors.ts               (new)
│       │   ├── auth.ts                 (new — bcrypt + JWT helpers)
│       │   └── audit.ts                (new — writes to audit_logs)
│       ├── middlewares/
│       │   ├── auth.ts                 (new — requireAuth + requireRole)
│       │   ├── error.ts                (new — JSON error responses)
│       │   └── rateLimit.ts            (new — login + scan limiters)
│       └── routes/
│           ├── index.ts                (replace)
│           ├── health.ts               (unchanged, kept for reference)
│           ├── auth.ts                 (new — login/refresh/logout)
│           ├── me.ts                   (new — profile + budget)
│           ├── stations.ts             (new — list/get stations)
│           ├── pumps.ts                (new — POST /pumps/scan)
│           ├── authorizations.ts       (new — approve/reject/complete)
│           └── transactions.ts         (new — me + company transactions)
└── lib/db/
    ├── package.json                    (replace — adds bcryptjs)
    └── src/seed.ts                     (replace — bcrypt password hashes)
```

## Step 1 — Unzip into the repo

From your repo root (the folder that contains `pnpm-workspace.yaml`):

```bash
unzip -o fuelgo-api-step3.zip
```

The `-o` flag overwrites existing files without prompting. Safe to re-run.

## Step 2 — Install the new packages

Still at the repo root:

```bash
pnpm install
```

This installs `bcryptjs`, `jsonwebtoken`, `express-rate-limit`, `zod`, and their type definitions.

## Step 3 — Set the JWT secrets

The API needs two random secrets. Generate them once and store them.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Run this twice. Save one as `JWT_ACCESS_SECRET` and the other as `JWT_REFRESH_SECRET`.

In Replit, go to **Tools → Secrets** and add:
- `JWT_ACCESS_SECRET` — first generated string
- `JWT_REFRESH_SECRET` — second generated string

(Your `DATABASE_URL` from Step 2 is already there.)

For your deployed/production environment, add the same two secrets there as well.

## Step 4 — Re-seed the database

The seed used to hash passwords with SHA-256 (placeholder). Step 3 switches to bcrypt. You must re-seed so the demo accounts match the new login route:

```bash
pnpm --filter @workspace/db run seed:reset
```

This wipes all data and re-creates the company, driver, vehicle, stations, pumps, prices, and attendant — this time with bcrypt-hashed passwords.

## Step 5 — Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

Wait for `Server listening — port: 8080`.

In Replit, the API Server workflow is configured for you and starts automatically.

## Step 6 — Smoke-test the full flow

In a second terminal:

```bash
# 1. Login as the driver
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"ahmed.hassan@cairoexpress.eg","password":"DriverPass123!"}'
```

You should see `accessToken`, `refreshToken`, and the user object. Copy the `accessToken` into a variable, then:

```bash
TOKEN=<paste accessToken>
curl -s http://localhost:8080/api/me/budget -H "authorization: Bearer $TOKEN"
```

Expected: Ahmed Hassan's vehicle, 8500 EGP monthly budget, 0 EGP spent.

The full QR-scan → OTP → attendant approve → complete flow is documented in `artifacts/api-server/README.md`.

## Step 7 — Push to GitHub

```bash
git add .
git commit -m "Step 3: Backend API with JWT auth, QR scan flow, atomic budget debits"
git push
```

## Demo credentials

| Role | Email | Password | PIN |
|---|---|---|---|
| Driver | `ahmed.hassan@cairoexpress.eg` | `DriverPass123!` | `1234` |
| Company admin | `admin@cairoexpress.eg` | `ChangeMe123!` | – |
| Station attendant | `attendant.maadi@wataniya.eg` | `AttendantPass123!` | `4321` |

## What's next (Step 4)

Wire the driver mobile app to this API: replace the mock auth with real login, fetch the budget on the home screen, scan a real pump QR code, and show the OTP modal. That's the next zip.
