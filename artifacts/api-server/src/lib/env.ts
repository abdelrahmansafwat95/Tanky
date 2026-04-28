function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.PORT ?? "8080",
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_TTL_SECONDS: Number(
    process.env.ACCESS_TOKEN_TTL_SECONDS ?? 60 * 15,
  ),
  REFRESH_TOKEN_TTL_SECONDS: Number(
    process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 30,
  ),
  AUTHORIZATION_TTL_SECONDS: Number(
    process.env.AUTHORIZATION_TTL_SECONDS ?? 60 * 5,
  ),
} as const;
