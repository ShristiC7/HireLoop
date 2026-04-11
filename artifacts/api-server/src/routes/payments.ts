import { Router, type IRouter } from "express";
import { db, paymentsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import crypto from "crypto";

const router: IRouter = Router();

router.get("/payments/history", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, req.userId!))
    .orderBy(desc(paymentsTable.createdAt));
  res.json(payments);
});

router.get("/payments/check-listing-fee", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const payments = await db
    .select()
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.userId, req.userId!),
        eq(paymentsTable.type, "listing_fee"),
        eq(paymentsTable.status, "completed")
      )
    )
    .orderBy(desc(paymentsTable.createdAt))
    .limit(1);

  const hasValidFee = payments.length > 0 && new Date(payments[0].createdAt) > thirtyDaysAgo;
  res.json({ hasValidListingFee: hasValidFee, lastPayment: payments[0] ?? null });
});

router.get("/payments/check-premium", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.userId, req.userId!),
        eq(paymentsTable.status, "completed")
      )
    )
    .orderBy(desc(paymentsTable.createdAt))
    .limit(1);

  const premiumPayments = payments.filter(p => p.type === "premium_monthly" || p.type === "premium_yearly");

  let isPremium = false;
  let expiresAt: Date | null = null;

  if (premiumPayments.length > 0) {
    const last = premiumPayments[0];
    const paidAt = new Date(last.createdAt);
    const days = last.type === "premium_yearly" ? 365 : 30;
    expiresAt = new Date(paidAt.getTime() + days * 24 * 60 * 60 * 1000);
    isPremium = expiresAt > new Date();
  }

  res.json({ isPremium, expiresAt });
});

router.post("/payments/process", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { type, cardNumber, cardExpiry, cardCvv, cardName } = req.body;

  if (!type || !["listing_fee", "premium_monthly", "premium_yearly"].includes(type)) {
    res.status(400).json({ error: "Invalid payment type" });
    return;
  }

  if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
    res.status(400).json({ error: "Card details required" });
    return;
  }

  const cleanCard = cardNumber.replace(/\s/g, "");
  if (cleanCard.length < 16) {
    res.status(400).json({ error: "Invalid card number" });
    return;
  }

  const amounts: Record<string, number> = {
    listing_fee: 999,
    premium_monthly: 299,
    premium_yearly: 2499,
  };

  const amount = amounts[type];
  const transactionId = `TXN_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

  await new Promise(resolve => setTimeout(resolve, 800));

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      userId: req.userId!,
      type: type as "listing_fee" | "premium_monthly" | "premium_yearly",
      amount,
      status: "completed",
      transactionId,
      metadata: JSON.stringify({ cardLast4: cleanCard.slice(-4) }),
    })
    .returning();

  res.status(201).json({
    success: true,
    payment,
    message: `Payment of ₹${amount} processed successfully`,
    transactionId,
  });
});

export default router;
