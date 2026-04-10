import { prisma } from "../config/database.js";
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    verifyStripeWebhook,
    PRICES,
} from "../services/payment.service.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { BadRequest, NotFound, Forbidden } from "../middleware/errorHandler.js";
import { logger } from "../config/logger.js";
import { v4 as uuidv4 } from "uuid";

// ═══════════════════════════════════════════════════════════════════════════════
// JOB LISTING PAYMENT (Recruiter)
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Create a payment order for publishing a job
export async function createJobListingOrder(req, res) {
    const { jobId } = req.body;

    const recruiter = await prisma.recruiterProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true, status: true },
    });
    if (!recruiter || recruiter.status !== "APPROVED") {
        throw Forbidden("Your account must be approved before posting jobs.");
    }

    const job = await prisma.job.findFirst({
        where: { id: jobId, recruiterId: recruiter.id },
    });
    if (!job) throw NotFound("Job not found.");
    if (job.status === "ACTIVE") throw BadRequest("Job is already published.");

    // Check if payment already exists and succeeded
    const existingPayment = await prisma.payment.findFirst({
        where: { jobId, status: "SUCCESS" },
    });
    if (existingPayment) throw BadRequest("This job has already been paid for.");

    const receiptId = `job_${jobId.slice(0, 8)}_${Date.now()}`;

    // Create Razorpay order
    const order = await createRazorpayOrder({
        amount: PRICES.JOB_LISTING.amount,
        currency: "INR",
        receipt: receiptId,
        notes: {
            jobId,
            recruiterId: recruiter.id,
            type: "JOB_LISTING",
        },
    });

    // Save pending payment to DB
    await prisma.payment.upsert({
        where: { jobId },
        update: {
            gatewayOrderId: order.id,
            status: "PENDING",
        },
        create: {
            userId: req.user.id,
            type: "JOB_LISTING",
            status: "PENDING",
            amount: PRICES.JOB_LISTING.amountINR,
            currency: "INR",
            gateway: "razorpay",
            gatewayOrderId: order.id,
            recruiterId: recruiter.id,
            jobId,
        },
    });

    sendCreated(res, {
        message: "Payment order created.",
        data: {
            orderId: order.id,
            amount: PRICES.JOB_LISTING.amount,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID, // frontend needs this for checkout
            description: PRICES.JOB_LISTING.description,
        },
    });
}

// Step 2: Verify payment and publish the job
export async function verifyJobListingPayment(req, res) {
    const { orderId, paymentId, signature, jobId } = req.body;

    // Cryptographic verification
    const isValid = verifyRazorpayPayment({
        orderId,
        paymentId,
        signature,
    });

    if (!isValid) {
        // Mark as failed in DB
        await prisma.payment.updateMany({
            where: { gatewayOrderId: orderId },
            data: { status: "FAILED" },
        });
        throw BadRequest("Payment verification failed. Invalid signature.");
    }

    // Payment is verified — update DB and publish job atomically
    await prisma.$transaction([
        prisma.payment.updateMany({
            where: { gatewayOrderId: orderId },
            data: {
                status: "SUCCESS",
                gatewayPaymentId: paymentId,
                gatewaySignature: signature,
            },
        }),
        prisma.job.update({
            where: { id: jobId },
            data: { status: "ACTIVE" },
        }),
    ]);

    sendSuccess(res, {
        message: "Payment successful! Your job is now live.",
        data: { jobId, status: "ACTIVE" },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT PREMIUM PAYMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function createPremiumOrder(req, res) {
    const { plan = "monthly" } = req.body; // "monthly" | "yearly"

    const pricing =
        plan === "yearly"
            ? PRICES.STUDENT_PREMIUM_YEARLY
            : PRICES.STUDENT_PREMIUM_MONTHLY;

    const receiptId = `premium_${req.user.id.slice(0, 8)}_${Date.now()}`;

    const order = await createRazorpayOrder({
        amount: pricing.amount,
        currency: "INR",
        receipt: receiptId,
        notes: { userId: req.user.id, type: "STUDENT_PREMIUM", plan },
    });

    // Save pending payment
    await prisma.payment.create({
        data: {
            userId: req.user.id,
            type: "STUDENT_PREMIUM",
            status: "PENDING",
            amount: pricing.amountINR,
            currency: "INR",
            gateway: "razorpay",
            gatewayOrderId: order.id,
            metadata: { plan, durationDays: pricing.durationDays },
        },
    });

    sendCreated(res, {
        message: "Premium order created.",
        data: {
            orderId: order.id,
            amount: pricing.amount,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            description: pricing.description,
            plan,
        },
    });
}

export async function verifyPremiumPayment(req, res) {
    const { orderId, paymentId, signature } = req.body;

    const isValid = verifyRazorpayPayment({ orderId, paymentId, signature });
    if (!isValid) {
        await prisma.payment.updateMany({
            where: { gatewayOrderId: orderId },
            data: { status: "FAILED" },
        });
        throw BadRequest("Payment verification failed.");
    }

    // Get payment record to know the plan duration
    const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId: orderId },
    });
    if (!payment) throw NotFound("Payment record not found.");

    const durationDays = payment.metadata?.durationDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Update payment + activate premium atomically
    await prisma.$transaction([
        prisma.payment.updateMany({
            where: { gatewayOrderId: orderId },
            data: {
                status: "SUCCESS",
                gatewayPaymentId: paymentId,
                gatewaySignature: signature,
            },
        }),
        prisma.studentProfile.update({
            where: { userId: req.user.id },
            data: {
                isPremium: true,
                premiumExpiresAt: expiresAt,
            },
        }),
    ]);

    sendSuccess(res, {
        message: "Premium activated successfully!",
        data: { isPremium: true, premiumExpiresAt: expiresAt },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

export async function getPaymentHistory(req, res) {
    const payments = await prisma.payment.findMany({
        where: { userId: req.user.id },
        include: {
            job: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    sendSuccess(res, { data: payments });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE WEBHOOK
// ═══════════════════════════════════════════════════════════════════════════════

// This endpoint is called directly by Stripe (not by the frontend)
// Must receive the raw body — configured in route with express.raw()
export async function stripeWebhook(req, res) {
    const signature = req.headers["stripe-signature"];
    const event = verifyStripeWebhook(req.body, signature);

    if (!event) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const intent = event.data.object;
                await prisma.payment.updateMany({
                    where: { gatewayOrderId: intent.id },
                    data: {
                        status: "SUCCESS",
                        gatewayPaymentId: intent.id,
                    },
                });
                break;
            }

            case "payment_intent.payment_failed": {
                const intent = event.data.object;
                await prisma.payment.updateMany({
                    where: { gatewayOrderId: intent.id },
                    data: { status: "FAILED" },
                });
                break;
            }

            default:
                logger.info(`Unhandled Stripe event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        logger.error("Stripe webhook processing error:", error);
        res.status(500).json({ success: false });
    }
}