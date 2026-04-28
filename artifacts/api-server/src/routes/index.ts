import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";
import stationsRouter from "./stations";
import pumpsRouter from "./pumps";
import authorizationsRouter from "./authorizations";
import transactionsRouter from "./transactions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);
router.use(stationsRouter);
router.use(pumpsRouter);
router.use(authorizationsRouter);
router.use(transactionsRouter);

export default router;
