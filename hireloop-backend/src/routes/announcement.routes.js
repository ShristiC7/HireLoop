import { Router } from "express";
import { prisma } from "../config/database.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

// Public endpoint — any logged-in user can read announcements
router.get("/", async (req, res) => {
    const { role } = req.query;
    const announcements = await prisma.announcement.findMany({
        where: {
            ...(role && { OR: [{ targetRole: null }, { targetRole: role }] }),
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 20,
    });
    sendSuccess(res, { data: announcements });
});

export default router;