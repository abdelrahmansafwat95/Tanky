import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, eq, gte, lte, isNull, or, desc } from "drizzle-orm";
import {
  db,
  pumpsTable,
  stationsTable,
  driversTable,
  vehiclesTable,
  fuelPricesTable,
  authorizationsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { scanLimiter } from "../middlewares/rateLimit";
import {
  BadRequest,
  Forbidden,
  NotFound,
  Unauthorized,
} from "../lib/errors";
import { generateOtp } from "../lib/auth";
import { audit } from "../lib/audit";
import { env } from "../lib/env";

const router: IRouter = Router();

const ScanBody = z.object({
  qrCodeToken: z.string().min(8),
  fuelType: z.enum([
    "gasoline_80",
    "gasoline_92",
    "gasoline_95",
    "diesel",
    "cng",
  ]),
  requestedAmountEgp: z.number().positive().optional(),
  requestedLiters: z.number().positive().optional(),
  odometerKm: z.number().int().nonnegative().optional(),
  driverLatitude: z.number().min(-90).max(90).optional(),
  driverLongitude: z.number().min(-180).max(180).optional(),
});

function metersBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

router.post(
  "/pumps/scan",
  requireAuth,
  requireRole("driver"),
  scanLimiter,
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      const body = ScanBody.parse(req.body);

      const [pump] = await db
        .select()
        .from(pumpsTable)
        .where(eq(pumpsTable.qrCodeToken, body.qrCodeToken))
        .limit(1);
      if (!pump) throw NotFound("Pump not found for this QR code");
      if (pump.status !== "available") {
        throw BadRequest(`Pump is ${pump.status}`);
      }
      if (!pump.supportedFuelTypes.includes(body.fuelType)) {
        throw BadRequest(`This pump does not support ${body.fuelType}`);
      }

      const [station] = await db
        .select()
        .from(stationsTable)
        .where(eq(stationsTable.id, pump.stationId))
        .limit(1);
      if (!station || station.status !== "active") {
        throw BadRequest("Station is not active");
      }

      if (
        body.driverLatitude !== undefined &&
        body.driverLongitude !== undefined
      ) {
        const distance = metersBetween(
          body.driverLatitude,
          body.driverLongitude,
          Number(station.latitude),
          Number(station.longitude),
        );
        if (distance > 500) {
          throw Forbidden(
            `You are ${Math.round(distance)}m from this station. Get closer to scan.`,
          );
        }
      }

      const [driver] = await db
        .select()
        .from(driversTable)
        .where(eq(driversTable.userId, req.user.sub))
        .limit(1);
      if (!driver) throw NotFound("Driver profile not found");
      if (driver.status !== "active") {
        throw Forbidden(`Driver status is ${driver.status}`);
      }
      if (!driver.assignedVehicleId) {
        throw BadRequest("No vehicle assigned to this driver");
      }

      const [vehicle] = await db
        .select()
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, driver.assignedVehicleId))
        .limit(1);
      if (!vehicle) throw NotFound("Vehicle not found");
      if (vehicle.status !== "active") {
        throw Forbidden(`Vehicle status is ${vehicle.status}`);
      }
      if (vehicle.fuelType !== body.fuelType) {
        throw BadRequest(
          `Vehicle uses ${vehicle.fuelType}, not ${body.fuelType}`,
        );
      }

      const now = new Date();
      const [price] = await db
        .select()
        .from(fuelPricesTable)
        .where(
          and(
            eq(fuelPricesTable.fuelType, body.fuelType),
            lte(fuelPricesTable.effectiveFrom, now),
            or(
              isNull(fuelPricesTable.effectiveTo),
              gte(fuelPricesTable.effectiveTo, now),
            ),
          ),
        )
        .orderBy(desc(fuelPricesTable.effectiveFrom))
        .limit(1);
      if (!price) {
        throw BadRequest(`No active price for ${body.fuelType}`);
      }
      const pricePerLiter = Number(price.pricePerLiterEgp);

      const remainingMonth =
        Number(vehicle.monthlyBudgetEgp) -
        Number(vehicle.currentMonthSpentEgp);
      const remainingDay =
        Number(vehicle.dailyBudgetEgp) -
        Number(vehicle.currentDaySpentEgp);
      const driverDailyRemaining = Number(driver.dailyLimitEgp);

      const caps = [remainingMonth, remainingDay, driverDailyRemaining].filter(
        (n) => n > 0,
      );
      if (caps.length === 0) {
        throw Forbidden("No remaining budget for today/this month");
      }
      const maxAuthorizedEgp = Math.min(...caps);

      let authorizedEgp = maxAuthorizedEgp;
      if (body.requestedAmountEgp) {
        authorizedEgp = Math.min(maxAuthorizedEgp, body.requestedAmountEgp);
      } else if (body.requestedLiters) {
        authorizedEgp = Math.min(
          maxAuthorizedEgp,
          body.requestedLiters * pricePerLiter,
        );
      }

      if (authorizedEgp < 1) {
        throw Forbidden("Authorized amount is below 1 EGP");
      }

      const authorizedLiters = authorizedEgp / pricePerLiter;
      const tankRemainingLiters =
        Number(vehicle.tankCapacityLiters) - 0;
      const finalLiters = Math.min(authorizedLiters, tankRemainingLiters);
      const finalEgp = +(finalLiters * pricePerLiter).toFixed(2);

      const otp = generateOtp(6);
      const expiresAt = new Date(
        Date.now() + env.AUTHORIZATION_TTL_SECONDS * 1000,
      );

      const [authorization] = await db
        .insert(authorizationsTable)
        .values({
          vehicleId: vehicle.id,
          driverId: driver.id,
          pumpId: pump.id,
          stationId: station.id,
          fuelType: body.fuelType,
          requestedAmountEgp: body.requestedAmountEgp?.toFixed(2),
          requestedLiters: body.requestedLiters?.toFixed(3),
          maxAuthorizedLiters: finalLiters.toFixed(3),
          maxAuthorizedEgp: finalEgp.toFixed(2),
          pricePerLiterEgp: pricePerLiter.toFixed(3),
          otpCode: otp,
          odometerKm: body.odometerKm,
          status: "pending",
          expiresAt,
        })
        .returning();

      await audit(req, "authorize_pump", {
        entityType: "authorization",
        entityId: authorization.id,
        description: `Driver ${driver.employeeId} requested ${finalLiters.toFixed(2)}L of ${body.fuelType} at pump ${pump.pumpNumber}, station ${station.name}`,
        metadata: {
          stationId: station.id,
          pumpId: pump.id,
          vehicleId: vehicle.id,
        },
      });

      res.json({
        authorization: {
          id: authorization.id,
          fuelType: authorization.fuelType,
          maxAuthorizedLiters: authorization.maxAuthorizedLiters,
          maxAuthorizedEgp: authorization.maxAuthorizedEgp,
          pricePerLiterEgp: authorization.pricePerLiterEgp,
          otpCode: otp,
          expiresAt: authorization.expiresAt,
          status: authorization.status,
          station: {
            id: station.id,
            name: station.name,
            brand: station.brand,
          },
          pump: { id: pump.id, pumpNumber: pump.pumpNumber },
          vehicle: { id: vehicle.id, plateNumber: vehicle.plateNumber },
        },
        message:
          "Show the OTP to the station attendant. They will confirm the dispense in their app.",
      });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
