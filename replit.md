# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: FuelGo

B2B fuel management ecosystem for the Egyptian market. Build order:
1. Driver mobile app (Expo) — IN PROGRESS
2. PostgreSQL database
3. Backend API + security
4. Wire driver app to API
5. Station attendant mobile app
6. Company web dashboard
7. Pump integration

### Driver App — `artifacts/driver-app`
- Expo SDK 54, expo-router 6, React 19, react-native-web 0.21, TypeScript
- AsyncStorage-based mock auth (no backend yet); driver "Ahmed Hassan" / "EMP-2841"
- All amounts in EGP, stations in Cairo/Giza

### Web Compatibility Rules (CRITICAL)
React Native Web 0.21 + React 19 has strict CSSStyleDeclaration handling. The following patterns CRASH the app on web ("Failed to set an indexed property [0] on CSSStyleDeclaration"):

- **NEVER** use `<Link href="..." asChild><TouchableOpacity>...</TouchableOpacity></Link>` on routes rendered on web. Instead, use `onPress={() => router.push("...")}` directly on TouchableOpacity.
- **NEVER** use `react-native-reanimated` layout animations (`entering={FadeIn}`, `exiting`, `Animated.View` with layout props) on web. Wrap them in `Platform.OS !== "web"` checks or use plain `View`.
- **AVOID** `shadow*` style props on web — use `boxShadow` or remove them. They emit warnings and may interact badly with React 19.
- Wrap `KeyboardProvider` from `react-native-keyboard-controller` to be a no-op on web (already done in `_layout.tsx` via `KeyboardProviderSafe`).

### Free Tier
- Only 1 artifact at a time. Driver app currently active. Other artifacts will be added later.
