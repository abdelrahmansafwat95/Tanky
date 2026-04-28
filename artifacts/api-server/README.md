# FuelGo Backend API (Step 3)

Express 5 + TypeScript + Drizzle ORM + JWT.
Bundles to a single `dist/index.mjs` via esbuild.

## Endpoints

All routes are prefixed with `/api`.

### Auth
| Method | Path | Body | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | `{ email, password, deviceInfo? }` | – |
| `POST` | `/auth/refresh` | `{ refreshToken }` | – |
| `POST` | `/auth/logout` | `{ refreshToken }` | Bearer |

Login returns:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresInSeconds": 900,
  "user": { "id", "email", "fullName", "role", "companyId", "stationId" }
}
```
Access tokens last 15 min. Refresh tokens last 30 days, are stored as SHA-256 hashes in `sessions`, and are single-row revocable on logout.

### Profile
| Method | Path | Auth |
|---|---|---|
| `GET` | `/me` | driver/admin/attendant |
| `GET` | `/me/budget` | driver |
| `GET` | `/me/transactions?from&to&limit` | driver |

### Stations
| Method | Path | Auth |
|---|---|---|
| `GET` | `/stations` | any |
| `GET` | `/stations/:id` | any |

### Pumps
| Method | Path | Body | Auth |
|---|---|---|---|
| `POST` | `/pumps/scan` | `{ qrCodeToken, fuelType, requestedAmountEgp?, requestedLiters?, odometerKm?, driverLatitude?, driverLongitude? }` | driver |

What `/pumps/scan` does, atomically:
1. Resolves pump by QR token, validates it is `available` and supports the fuel type.
2. (Optional) If `driverLatitude`/`driverLongitude` are sent, enforces 500 m geofence to the station.
3. Loads driver + assigned vehicle, validates active status and matching fuel type.
4. Looks up the currently-effective `fuel_prices` row.
5. Computes the cap = `min(remaining month, remaining day, driver daily limit, requested amount)`.
6. Inserts an `authorizations` row with a 6-digit OTP, valid for 5 minutes.
7. Returns the OTP and the maximum litres / EGP the attendant is allowed to dispense.

### Authorizations (attendant flow)
| Method | Path | Body | Auth |
|---|---|---|---|
| `GET` | `/authorizations/pending/me` | – | attendant/manager |
| `POST` | `/authorizations/:id/approve` | `{ otpCode, attendantPin }` | attendant/manager |
| `POST` | `/authorizations/:id/reject` | `{ reason, attendantPin }` | attendant/manager |
| `POST` | `/authorizations/:id/complete` | `{ litersDispensed, odometerKm?, attendantPin }` | attendant/manager |

`approve` validates the 6-digit OTP shown by the driver and the attendant's PIN, marks the pump `in_use`, and the authorization `approved`.

`complete` runs inside a single PostgreSQL transaction:
1. Insert a row into `transactions` (with a generated `TXN-…` reference).
2. Mark the authorization `completed`.
3. Atomically increment `vehicles.current_day_spent_egp` and `vehicles.current_month_spent_egp` using `SQL`-side arithmetic (no read-modify-write race).
4. Mark the pump `available` again.

### Reporting
| Method | Path | Auth |
|---|---|---|
| `GET` | `/companies/:id/transactions?from&to&limit` | super_admin or that company |

## Security

- **Passwords** — bcryptjs, cost 12 (users) / 10 (PINs).
- **JWT** — HS256, signed with `JWT_ACCESS_SECRET`. Refresh tokens are random 48-byte strings; only their SHA-256 hash is stored.
- **Rate limiting** — 20 login attempts per IP per 15 min, 30 scans per IP per minute.
- **Audit log** — every login, login_failed, authorize, approve, reject, complete writes a row to `audit_logs` with IP + user agent.
- **Geofence** — opt-in 500 m radius check on `/pumps/scan`.
- **Trust proxy** — `app.set('trust proxy', 1)` so Replit / Cloudflare client IPs are read correctly.

## Required environment

| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | – | Supabase pooler URL (port 6543, `?sslmode=require`) |
| `JWT_ACCESS_SECRET` | – | random 48-byte base64url string |
| `JWT_REFRESH_SECRET` | – | random 48-byte base64url string |
| `PORT` | `8080` | |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` | 15 min |
| `REFRESH_TOKEN_TTL_SECONDS` | `2592000` | 30 days |
| `AUTHORIZATION_TTL_SECONDS` | `300` | 5 min |

## Demo credentials (after `pnpm --filter @workspace/db run seed`)

- **Driver** — `ahmed.hassan@cairoexpress.eg` / `DriverPass123!` (PIN `1234`)
- **Company admin** — `admin@cairoexpress.eg` / `ChangeMe123!`
- **Attendant** — `attendant.maadi@wataniya.eg` / `AttendantPass123!` (PIN `4321`)
