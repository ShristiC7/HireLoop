import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
import { logger } from "../config/logger.js";

// ── Initialize payment gateways ───────────────────────────────────────────────
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ── Pricing Config ────────────────────────────────────────────────────────────
// Centralize pricing here so it's easy to update
export const PRICES = {
    JOB_LISTING: {
        amount: 499900, // ₹4,999 in paise (Razorpay uses smallest currency unit)
        amountINR: 4999,
        currency: "INR",
        description: "HireLoop Job Listing Fee",
    },
    STUDENT_PREMIUM_MONTHLY: {
        amountINR: 299,
        amount: 29900,
        currency: "INR",
        description: "HireLoop Premium — Monthly",
        durationDays: 30,
    },
    STUDENT_PREMIUM_YEARLY: {
        amountINR: 1999,
        amount: 199900,
        currency: "INR",
        description: "HireLoop Premium — Annual (Best Value)",
        durationDays: 365,
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// RAZORPAY
// ═══════════════════════════════════════════════════════════════════════════════

export async function createRazorpayOrder({ amount, currency = "INR", receipt, notes = {} }) {
    const order = await razorpay.orders.create({
        amount,         // in paise
        currency,
        receipt,        // your internal reference ID
        notes,
        payment_capture: 1, // auto-capture immediately
    });
    return order;
}

// Verifies that the payment actually came from Razorpay (not forged)
// Uses HMAC-SHA256 signature verification
export function verifyRazorpayPayment({ orderId, paymentId, signature }) {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    return expectedSignature === signature;
}

export async function getRazorpayPaymentDetails(paymentId) {
    return razorpay.payments.fetch(paymentId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE
// ═══════════════════════════════════════════════════════════════════════════════

export async function createStripePaymentIntent({ amount, currency = "inr", metadata = {} }) {
    const paymentIntent = await stripe.paymentIntents.create({
        amount,   // in smallest unit (paise for INR)
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
    });
    return paymentIntent;
}

export function verifyStripeWebhook(payload, signature) {
    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        logger.error("Stripe webhook verification failed:", err.message);
        return null;
    }
}