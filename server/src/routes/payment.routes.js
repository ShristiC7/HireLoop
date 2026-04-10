import { Router } from "express";
import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import {
    createJobListingOrder, verifyJobListingPayment,
    createPremiumOrder, verifyPremiumPayment,
    getPaymentHistory, stripeWebhook,
} from "../controllers/payment.controller.js";

const router = Router();

// Stripe webhook needs raw body (must come BEFORE json middleware)
router.post(
    "/stripe-webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

// All other payment routes require authentication
router.use(authenticate);

// Job listing payment (Recruiter)
router.post("/job-listing/create-order",
    authorize("RECRUITER"),
    validate(z.object({ body: z.object({ jobId: z.string().uuid() }) })),
    createJobListingOrder
);
router.post("/job-listing/verify",
    authorize("RECRUITER"),
    validate(z.object({
        body: z.object({
            orderId: z.string(),
            paymentId: z.string(),
            signature: z.string(),
            jobId: z.string().uuid(),
        })
    })),
    verifyJobListingPayment
);

// Student premium
router.post("/premium/create-order",
    authorize("STUDENT"),
    validate(z.object({ body: z.object({ plan: z.enum(["monthly", "yearly"]).optional() }) })),
    createPremiumOrder
);
router.post("/premium/verify",
    authorize("STUDENT"),
    validate(z.object({
        body: z.object({
            orderId: z.string(),
            paymentId: z.string(),
            signature: z.string(),
        })
    })),
    verifyPremiumPayment
);

// Payment history (any authenticated user)
router.get("/history", getPaymentHistory);

export default router;