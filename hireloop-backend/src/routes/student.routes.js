import { Router } from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
    updateProfileSchema,
    resumeBuilderSchema,
    applyJobSchema,
    listQuerySchema,
} from "../validators/student.validators.js";
import {
    getMyProfile,
    updateMyProfile,
    uploadAvatar,
    getMyResumes,
    getResumeById,
    createResume,
    updateResume,
    uploadResumePDF,
    deleteResume,
    applyToJob,
    getMyApplications,
    getApplicationById,
    withdrawApplication,
    getMyStats,
} from "../controllers/student.controller.js";

const router = Router();

// All student routes require login + STUDENT role
router.use(authenticate, authorize("STUDENT"));

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/profile", getMyProfile);
router.put("/profile", validate(updateProfileSchema), updateMyProfile);
router.post("/profile/avatar", upload.avatar, uploadAvatar);
router.get("/stats", getMyStats);

// ── Resume Builder ────────────────────────────────────────────────────────────
router.get("/resumes", getMyResumes);
router.post("/resumes", validate(resumeBuilderSchema), createResume);
router.get("/resumes/:resumeId", getResumeById);
router.put("/resumes/:resumeId", validate(resumeBuilderSchema), updateResume);
router.post("/resumes/:resumeId/upload-pdf", upload.resumePDF, uploadResumePDF);
router.delete("/resumes/:resumeId", deleteResume);

// ── Applications ──────────────────────────────────────────────────────────────
router.post("/apply/:jobId", validate(applyJobSchema), applyToJob);
router.get("/applications", validate(listQuerySchema), getMyApplications);
router.get("/applications/:applicationId", getApplicationById);
router.delete("/applications/:applicationId/withdraw", withdrawApplication);

export default router;