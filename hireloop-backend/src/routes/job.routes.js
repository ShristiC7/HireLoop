import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { listJobs, getJobDetail, getRecommendedJobs, getFilterOptions } from "../controllers/job.controller.js";

const router = Router();

// Public
router.get("/", listJobs);
router.get("/filters", getFilterOptions);
router.get("/:jobId", authenticate, getJobDetail); // authenticate is optional here — controller handles both

// Student-only
router.get("/recommended", authenticate, getRecommendedJobs);

export default router;