import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db, usersTable, sessionsTable } from "@workspace/db";
import {
  verifyPassword,
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../lib/auth";
import { Unauthorized } from "../lib/errors";
import { authLimiter } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/auth";
import { audit } from "../lib/audit";
import { env } from "../lib/env";

const router: IRouter = Router();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceInfo: z.string().max(500).optional(),
});

router.post("/auth/login", authLimiter, async (req, res, next) => {
  try {
    const body = LoginBody.parse(req.body);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, body.email.toLowerCase()))
      .limit(1);

    if (!user || !user.isActive) {
      await audit(req, "login_failed", {
        userId: user?.id,
        description: `Login failed for ${body.email}`,
      });
      throw Unauthorized("Invalid email or password");
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      await audit(req, "login_failed", {
        userId: user.id,
        description: `Wrong password for ${body.email}`,
      });
      throw Unauthorized("Invalid email or password");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      companyId: user.companyId,
      stationId: user.stationId,
    });

    const { token: refreshToken, tokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

    await db.insert(sessionsTable).values({
      userId: user.id,
      tokenHash,
      deviceInfo: body.deviceInfo,
      ipAddress: (req.ip ?? "").slice(0, 45),
      userAgent: req.headers["user-agent"] ?? null,
      expiresAt,
    });

    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user.id));

    await audit(req, "login", {
      userId: user.id,
      description: `User ${user.email} logged in`,
    });

    res.json({
      accessToken,
      refreshToken,
      expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        stationId: user.stationId,
      },
    });
  } catch (e) {
    next(e);
  }
});

const RefreshBody = z.object({ refreshToken: z.string().min(1) });

router.post("/auth/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = RefreshBody.parse(req.body);
    const tokenHash = hashRefreshToken(refreshToken);

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.tokenHash, tokenHash),
          gt(sessionsTable.expiresAt, new Date()),
          isNull(sessionsTable.revokedAt),
        ),
      )
      .limit(1);

    if (!session) throw Unauthorized("Invalid or expired refresh token");

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    if (!user || !user.isActive) throw Unauthorized("User inactive");

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      companyId: user.companyId,
      stationId: user.stationId,
    });

    res.json({
      accessToken,
      expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/auth/logout", requireAuth, async (req, res, next) => {
  try {
    const { refreshToken } = z
      .object({ refreshToken: z.string().min(1) })
      .parse(req.body);
    const tokenHash = hashRefreshToken(refreshToken);
    await db
      .update(sessionsTable)
      .set({ revokedAt: new Date() })
      .where(eq(sessionsTable.tokenHash, tokenHash));

    await audit(req, "logout", { description: "User logged out" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
