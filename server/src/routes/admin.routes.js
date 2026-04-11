import { Router } from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
    getDashboard, getPendingRecruiters, approveRecruiter, rejectRecruiter,
    suspendRecruiter, getAllStudents, getStudentDetail, getPlacementAnalytics,
    generateReport, createAnnouncement, getAnnouncements, updateAnnouncement,
    deleteAnnouncement, getAllJobs, forceCloseJob,
} from "../controllers/admin.controller.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", getDashboard);

// Recruiters
router.get("/recruiters", getPendingRecruiters);
router.patch("/recruiters/:recruiterId/approve", approveRecruiter);
router.patch("/recruiters/:recruiterId/reject",
    validate(z.object({ body: z.object({ reason: z.string().optional() }) })),
    rejectRecruiter
);
router.patch("/recruiters/:recruiterId/suspend", suspendRecruiter);

// Students
router.get("/students", getAllStudents);
router.get("/students/:studentId", getStudentDetail);

// Analytics
router.get("/analytics/placement", getPlacementAnalytics);
router.get("/analytics/report", generateReport);

// Jobs
router.get("/jobs", getAllJobs);
router.patch("/jobs/:jobId/archive", forceCloseJob);

// Announcements
router.post("/announcements",
    validate(z.object({
        body: z.object({
            title: z.string().min(3).max(200),
            content: z.string().min(10),
            isPinned: z.boolean().optional(),
            targetRole: z.enum(["STUDENT", "RECRUITER"]).optional().nullable(),
            expiresAt: z.string().datetime().optional().nullable(),
        }),
    })),
    createAnnouncement
);
router.get("/announcements", getAnnouncements);
router.put("/announcements/:announcementId", updateAnnouncement);
router.delete("/announcements/:announcementId", deleteAnnouncement);

export default router;