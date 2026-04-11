import { Router } from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { handleUpload, uploadCompanyLogo } from "../middleware/upload.js";
import {
    getProfile, updateProfile, uploadCompanyLogo as uploadLogoController,
    getDashboard, createJob, getMyJobs, getJob, updateJob,
    publishJob, closeJob, deleteJob, getApplicants, getApplicant,
    updateApplicationStatus, bulkUpdateStatus, scheduleInterview,
    getInterviews, updateInterview,
} from "../controllers/recruiter.controller.js";
import { createJobSchema, updateJobSchema } from "../validators/job.validators.js";
import { z } from "zod";

const router = Router();
router.use(authenticate, authorize("RECRUITER"));

router.get("/dashboard", getDashboard);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/profile/logo", handleUpload(uploadCompanyLogo), uploadLogoController);

router.post("/jobs", validate(createJobSchema), createJob);
router.get("/jobs", getMyJobs);
router.get("/jobs/:jobId", getJob);
router.put("/jobs/:jobId", validate(updateJobSchema), updateJob);
router.patch("/jobs/:jobId/publish", publishJob);
router.patch("/jobs/:jobId/close", closeJob);
router.delete("/jobs/:jobId", deleteJob);

router.get("/jobs/:jobId/applicants", getApplicants);
router.get("/applications/:applicationId", getApplicant);
router.patch("/applications/:applicationId/status",
    validate(z.object({
        body: z.object({
            status: z.enum(["SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFER", "REJECTED"]),
            recruiterNotes: z.string().max(1000).optional(),
        })
    })),
    updateApplicationStatus
);
router.patch("/applications/bulk-status",
    validate(z.object({
        body: z.object({
            applicationIds: z.array(z.string().uuid()).min(1).max(100),
            status: z.enum(["SHORTLISTED", "REJECTED"]),
        })
    })),
    bulkUpdateStatus
);

router.post("/interviews",
    validate(z.object({
        body: z.object({
            applicationId: z.string().uuid(),
            scheduledAt: z.string().datetime(),
            duration: z.number().int().min(15).max(240).optional(),
            mode: z.enum(["Online", "In-person"]).optional(),
            meetLink: z.string().url().optional(),
            venue: z.string().optional(),
            instructions: z.string().optional(),
        })
    })),
    scheduleInterview
);
router.get("/interviews", getInterviews);
router.put("/interviews/:interviewId", updateInterview);

export default router;