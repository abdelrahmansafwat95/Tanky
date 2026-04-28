import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, eq, sql, gt } from "drizzle-orm";
import {
  db,
  authorizationsTable,
  transactionsTable,
  vehiclesTable,
  stationAttendantsTable,
  pumpsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  BadRequest,
  Forbidden,
  NotFound,
  Unauthorized,
} from "../lib/errors";
import { audit } from "../lib/audit";
import { generateTransactionRef, verifyPin } from "../lib/auth";

const router: IRouter = Router();

const ApproveBody = z.object({
  otpCode: z.string().length(6),
  attendantPin: z.string().min(4).max(10),
});

router.post(
  "/authorizations/:id/approve",
  requireAuth,
  requireRole("station_attendant", "station_manager"),
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      const body = ApproveBody.parse(req.body);

      const [auth] = await db
        .select()
        .from(authorizationsTable)
        .where(eq(authorizationsTable.id, String(req.params.id)))
        .limit(1);
      if (!auth) throw NotFound("Authorization not found");
      if (auth.status !== "pending") {
        throw BadRequest(`Authorization is ${auth.status}`);
      }
      if (auth.expiresAt < new Date()) {
        await db
          .update(authorizationsTable)
          .set({ status: "expired" })
          .where(eq(authorizationsTable.id, auth.id));
        throw BadRequest("Authorization has expired");
      }
      if (auth.otpCode !== body.otpCode) {
        throw Forbidden("Invalid OTP code");
      }

      const [attendant] = await db
        .select()
        .from(stationAttendantsTable)
        .where(eq(stationAttendantsTable.userId, req.user.sub))
        .limit(1);
      if (!attendant) throw NotFound("Attendant profile not found");
      if (attendant.stationId !== auth.stationId) {
        throw Forbidden("Attendant not assigned to this station");
      }
      const pinOk = await verifyPin(body.attendantPin, attendant.pinHash);
      if (!pinOk) throw Forbidden("Invalid attendant PIN");

      const [updated] = await db
        .update(authorizationsTable)
        .set({
          status: "approved",
          approvedAt: new Date(),
          attendantId: attendant.id,
        })
        .where(eq(authorizationsTable.id, auth.id))
        .returning();

      await db
        .update(pumpsTable)
        .set({ status: "in_use", lastAuthorizedAt: new Date() })
        .where(eq(pumpsTable.id, auth.pumpId));

      await audit(req, "approve", {
        entityType: "authorization",
        entityId: auth.id,
        description: `Attendant approved authorization ${auth.id}`,
      });

      res.json({ authorization: updated });
    } catch (e) {
      next(e);
    }
  },
);

const RejectBody = z.object({
  reason: z.string().min(1).max(500),
  attendantPin: z.string().min(4).max(10),
});

router.post(
  "/authorizations/:id/reject",
  requireAuth,
  requireRole("station_attendant", "station_manager"),
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      const body = RejectBody.parse(req.body);

      const [auth] = await db
        .select()
        .from(authorizationsTable)
        .where(eq(authorizationsTable.id, String(req.params.id)))
        .limit(1);
      if (!auth) throw NotFound("Authorization not found");
      if (auth.status !== "pending") {
        throw BadRequest(`Authorization is ${auth.status}`);
      }

      const [attendant] = await db
        .select()
        .from(stationAttendantsTable)
        .where(eq(stationAttendantsTable.userId, req.user.sub))
        .limit(1);
      if (!attendant) throw NotFound("Attendant profile not found");
      const pinOk = await verifyPin(body.attendantPin, attendant.pinHash);
      if (!pinOk) throw Forbidden("Invalid attendant PIN");

      const [updated] = await db
        .update(authorizationsTable)
        .set({
          status: "rejected",
          rejectionReason: body.reason,
          attendantId: attendant.id,
        })
        .where(eq(authorizationsTable.id, auth.id))
        .returning();

      await audit(req, "reject", {
        entityType: "authorization",
        entityId: auth.id,
        description: `Authorization rejected: ${body.reason}`,
      });

      res.json({ authorization: updated });
    } catch (e) {
      next(e);
    }
  },
);

const CompleteBody = z.object({
  litersDispensed: z.number().positive(),
  odometerKm: z.number().int().nonnegative().optional(),
  attendantPin: z.string().min(4).max(10),
});

router.post(
  "/authorizations/:id/complete",
  requireAuth,
  requireRole("station_attendant", "station_manager"),
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      const body = CompleteBody.parse(req.body);

      const [auth] = await db
        .select()
        .from(authorizationsTable)
        .where(eq(authorizationsTable.id, String(req.params.id)))
        .limit(1);
      if (!auth) throw NotFound("Authorization not found");
      if (auth.status !== "approved") {
        throw BadRequest(`Authorization must be approved, currently ${auth.status}`);
      }

      const [attendant] = await db
        .select()
        .from(stationAttendantsTable)
        .where(eq(stationAttendantsTable.userId, req.user.sub))
        .limit(1);
      if (!attendant) throw NotFound("Attendant profile not found");
      const pinOk = await verifyPin(body.attendantPin, attendant.pinHash);
      if (!pinOk) throw Forbidden("Invalid attendant PIN");

      if (body.litersDispensed > Number(auth.maxAuthorizedLiters) + 0.01) {
        throw BadRequest(
          `Dispensed liters (${body.litersDispensed}) exceeds authorized maximum (${auth.maxAuthorizedLiters})`,
        );
      }

      const totalAmount = +(
        body.litersDispensed * Number(auth.pricePerLiterEgp)
      ).toFixed(2);

      const [vehicle] = await db
        .select({ companyId: vehiclesTable.companyId })
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, auth.vehicleId))
        .limit(1);
      if (!vehicle) throw NotFound("Vehicle not found");

      const transactionRef = generateTransactionRef();
      const dispensedAt = new Date();

      type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
      const result = await db.transaction(async (tx: Tx) => {
        const [tr] = await tx
          .insert(transactionsTable)
          .values({
            transactionRef,
            authorizationId: auth.id,
            vehicleId: auth.vehicleId,
            driverId: auth.driverId,
            pumpId: auth.pumpId,
            stationId: auth.stationId,
            attendantId: attendant.id,
            companyId: vehicle.companyId,
            fuelType: auth.fuelType,
            litersDispensed: body.litersDispensed.toFixed(3),
            pricePerLiterEgp: auth.pricePerLiterEgp,
            totalAmountEgp: totalAmount.toFixed(2),
            odometerKm: body.odometerKm ?? auth.odometerKm,
            status: "completed",
            dispensedAt,
          })
          .returning();

        await tx
          .update(authorizationsTable)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(authorizationsTable.id, auth.id));

        await tx
          .update(vehiclesTable)
          .set({
            currentDaySpentEgp: sql`${vehiclesTable.currentDaySpentEgp} + ${totalAmount}`,
            currentMonthSpentEgp: sql`${vehiclesTable.currentMonthSpentEgp} + ${totalAmount}`,
            odometerKm: body.odometerKm ?? vehiclesTable.odometerKm,
            updatedAt: new Date(),
          })
          .where(eq(vehiclesTable.id, auth.vehicleId));

        await tx
          .update(pumpsTable)
          .set({ status: "available" })
          .where(eq(pumpsTable.id, auth.pumpId));

        return tr;
      });

      await audit(req, "complete_transaction", {
        entityType: "transaction",
        entityId: result.id,
        description: `Dispensed ${body.litersDispensed}L (${totalAmount} EGP), ref ${transactionRef}`,
      });

      res.json({ transaction: result });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/authorizations/pending/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    if (req.user.role !== "station_attendant" && req.user.role !== "station_manager") {
      throw Forbidden("Only attendants can list pending authorizations");
    }
    if (!req.user.stationId) throw BadRequest("User has no station assignment");

    const list = await db
      .select()
      .from(authorizationsTable)
      .where(
        and(
          eq(authorizationsTable.stationId, req.user.stationId),
          eq(authorizationsTable.status, "pending"),
          gt(authorizationsTable.expiresAt, new Date()),
        ),
      );

    res.json({ authorizations: list });
  } catch (e) {
    next(e);
  }
});

export default router;
