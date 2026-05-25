import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import adminRouter from "./admin";
import authRouter from "./auth";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(adminRouter);
router.use(authRouter);
router.use(storageRouter);

export default router;
