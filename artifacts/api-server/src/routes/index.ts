import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import authGoogleRouter from "./auth-google";
import studentsRouter from "./students";
import recruitersRouter from "./recruiters";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import aiRouter from "./ai";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import adminReportsRouter from "./admin/reports";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(authGoogleRouter);
router.use(studentsRouter);
router.use(recruitersRouter);
router.use(jobsRouter);
router.use(applicationsRouter);
router.use(aiRouter);
router.use(announcementsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(adminReportsRouter);
router.use(paymentsRouter);

export default router;
