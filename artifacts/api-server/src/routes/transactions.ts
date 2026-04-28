import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, transactionsTable, driversTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { Forbidden, Unauthorized } from "../lib/errors";

const router: IRouter = Router();

const ListQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

router.get("/me/transactions", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    const q = ListQuery.parse(req.query);

    const [driver] = await db
      .select({ id: driversTable.id })
      .from(driversTable)
      .where(eq(driversTable.userId, req.user.sub))
      .limit(1);
    if (!driver) {
      res.json({ transactions: [] });
      return;
    }

    const conds = [eq(transactionsTable.driverId, driver.id)];
    if (q.from) conds.push(gte(transactionsTable.dispensedAt, new Date(q.from)));
    if (q.to) conds.push(lte(transactionsTable.dispensedAt, new Date(q.to)));

    const list = await db
      .select()
      .from(transactionsTable)
      .where(and(...conds))
      .orderBy(desc(transactionsTable.dispensedAt))
      .limit(q.limit);

    res.json({ transactions: list });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/companies/:id/transactions",
  requireAuth,
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      if (
        req.user.role !== "super_admin" &&
        req.user.companyId !== String(req.params.id)
      ) {
        throw Forbidden("Cannot read another company's transactions");
      }

      const q = ListQuery.parse(req.query);
      const conds = [eq(transactionsTable.companyId, String(req.params.id))];
      if (q.from)
        conds.push(gte(transactionsTable.dispensedAt, new Date(q.from)));
      if (q.to) conds.push(lte(transactionsTable.dispensedAt, new Date(q.to)));

      const list = await db
        .select()
        .from(transactionsTable)
        .where(and(...conds))
        .orderBy(desc(transactionsTable.dispensedAt))
        .limit(q.limit);

      res.json({ transactions: list });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
