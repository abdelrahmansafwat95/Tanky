import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  driversTable,
  vehiclesTable,
  companiesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { NotFound, Unauthorized } from "../lib/errors";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        phone: usersTable.phone,
        fullName: usersTable.fullName,
        role: usersTable.role,
        companyId: usersTable.companyId,
        stationId: usersTable.stationId,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.sub))
      .limit(1);

    if (!user) throw NotFound("User not found");
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get("/me/budget", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    if (req.user.role !== "driver") {
      res.json({ message: "Only drivers have personal budgets" });
      return;
    }

    const [driver] = await db
      .select()
      .from(driversTable)
      .where(eq(driversTable.userId, req.user.sub))
      .limit(1);

    if (!driver) throw NotFound("Driver profile not found");

    const [company] = await db
      .select({
        id: companiesTable.id,
        nameEn: companiesTable.nameEn,
        nameAr: companiesTable.nameAr,
      })
      .from(companiesTable)
      .where(eq(companiesTable.id, driver.companyId))
      .limit(1);

    let vehicle = null;
    if (driver.assignedVehicleId) {
      const [v] = await db
        .select()
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, driver.assignedVehicleId))
        .limit(1);
      vehicle = v ?? null;
    }

    res.json({
      driver: {
        id: driver.id,
        employeeId: driver.employeeId,
        dailyLimitEgp: driver.dailyLimitEgp,
        monthlyLimitEgp: driver.monthlyLimitEgp,
        status: driver.status,
      },
      company,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            plateNumber: vehicle.plateNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            fuelType: vehicle.fuelType,
            tankCapacityLiters: vehicle.tankCapacityLiters,
            monthlyBudgetEgp: vehicle.monthlyBudgetEgp,
            currentMonthSpentEgp: vehicle.currentMonthSpentEgp,
            dailyBudgetEgp: vehicle.dailyBudgetEgp,
            currentDaySpentEgp: vehicle.currentDaySpentEgp,
            remainingMonthEgp: (
              Number(vehicle.monthlyBudgetEgp) -
              Number(vehicle.currentMonthSpentEgp)
            ).toFixed(2),
            remainingDayEgp: (
              Number(vehicle.dailyBudgetEgp) -
              Number(vehicle.currentDaySpentEgp)
            ).toFixed(2),
          }
        : null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
