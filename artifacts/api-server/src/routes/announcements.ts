import { Router, type IRouter } from "express";
import { db, announcementsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { CreateAnnouncementBody, DeleteAnnouncementParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/announcements", async (_req, res): Promise<void> => {
  const rows = await db.select({
    id: announcementsTable.id,
    title: announcementsTable.title,
    content: announcementsTable.content,
    type: announcementsTable.type,
    createdAt: announcementsTable.createdAt,
    authorId: announcementsTable.authorId,
    authorName: usersTable.name,
  })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .orderBy(announcementsTable.createdAt);

  res.json(rows.map(r => ({
    id: r.id,
    title: r.title,
    content: r.content,
    type: r.type,
    createdAt: r.createdAt,
    authorName: r.authorName ?? "Admin",
  })));
});

router.post("/announcements", requireAuth, requireRole("admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ann] = await db.insert(announcementsTable).values({
    authorId: req.userId!,
    title: parsed.data.title,
    content: parsed.data.content,
    type: parsed.data.type,
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    ...ann,
    authorName: user?.name ?? "Admin",
  });
});

router.delete("/announcements/:announcementId", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.announcementId) ? req.params.announcementId[0] : req.params.announcementId;
  const params = DeleteAnnouncementParams.safeParse({ announcementId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.announcementId));
  res.json({ message: "Announcement deleted" });
});

export default router;
