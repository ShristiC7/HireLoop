import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate.js";
import { listJobs, getJobDetail, getRecommendedJobs, getFilterOptions } from "../controllers/job.controller.js";

const router = Router();

// ── IMPORTANT: Static routes MUST be registered before dynamic /:jobId ────────
// Otherwise Express matches the literal string "recommended" / "filters"
// as a jobId param and returns 404.

// Public — no auth required
router.get("/", listJobs);
router.get("/filters", getFilterOptions);

// Student-only — must come BEFORE /:jobId
router.get("/recommended", authenticate, getRecommendedJobs);

// Dynamic catch-all — must be LAST
// optionalAuthenticate: attaches req.user if logged in (used to check hasApplied),
// but never blocks unauthenticated users from viewing job details.
router.get("/:jobId", optionalAuthenticate, getJobDetail);

export default router;