import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, stationsTable, pumpsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { NotFound } from "../lib/errors";

const router: IRouter = Router();

router.get("/stations", requireAuth, async (_req, res, next) => {
  try {
    const stations = await db
      .select()
      .from(stationsTable)
      .where(eq(stationsTable.status, "active"));
    res.json({ stations });
  } catch (e) {
    next(e);
  }
});

router.get("/stations/:id", requireAuth, async (req, res, next) => {
  try {
    const [station] = await db
      .select()
      .from(stationsTable)
      .where(eq(stationsTable.id, String(req.params.id)))
      .limit(1);
    if (!station) throw NotFound("Station not found");

    const pumps = await db
      .select({
        id: pumpsTable.id,
        pumpNumber: pumpsTable.pumpNumber,
        supportedFuelTypes: pumpsTable.supportedFuelTypes,
        status: pumpsTable.status,
      })
      .from(pumpsTable)
      .where(eq(pumpsTable.stationId, station.id));

    res.json({ station, pumps });
  } catch (e) {
    next(e);
  }
});

export default router;
