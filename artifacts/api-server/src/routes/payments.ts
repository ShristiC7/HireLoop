import { Router, type IRouter } from "express";
import { db, paymentsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import crypto from "crypto";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2024-12-18.acacia",
});

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

router.post("/payments/create-checkout-session", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { type } = req.body;

  if (!type || !["listing_fee", "premium_monthly", "premium_yearly"].includes(type)) {
    res.status(400).json({ error: "Invalid payment type" });
    return;
  }

  const amounts: Record<string, number> = {
    listing_fee: 999,
    premium_monthly: 299,
    premium_yearly: 2499,
  };
  
  const names: Record<string, string> = {
    listing_fee: "Job Post Listing Engine",
    premium_monthly: "HireLoop Premium (Monthly)",
    premium_yearly: "HireLoop Premium (Yearly)",
  };

  const amount = amounts[type];
  const origin = req.headers.origin || "http://localhost:5173";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: names[type],
            },
            unit_amount: amount * 100, // Stripe expects paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=${type}`,
      cancel_url: `${origin}`,
      metadata: {
        userId: req.userId!.toString(),
        type,
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/payments/verify-session", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: "No session ID provided" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      const type = session.metadata?.type as "listing_fee" | "premium_monthly" | "premium_yearly";
      const userId = parseInt(session.metadata?.userId || "0", 10);
      const amount = (session.amount_total || 0) / 100;
      
      if (userId !== req.userId) {
         res.status(403).json({ error: "Unauthorized session" });
         return;
      }
      
      // Store in DB
      const transactionId = session.payment_intent as string || `TXN_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      
      // Prevent duplicates
      const existing = await db.select().from(paymentsTable).where(eq(paymentsTable.transactionId, transactionId));
      if (existing.length > 0) {
        res.json({ success: true, message: "Payment already recorded" });
        return;
      }

      await db.insert(paymentsTable).values({
        userId,
        type,
        amount,
        status: "completed",
        transactionId,
        metadata: JSON.stringify({ stripeSessionId: session.id }),
      });

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ error: "Payment not completed" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
