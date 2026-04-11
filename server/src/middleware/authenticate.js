import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { Unauthorized, Forbidden } from "./errorHandler.js";

// ── authenticate ─────────────────────────────────────────────────────────────
export async function authenticate(req, res, next) {
    // 1. Extract token from "Authorization: Bearer <token>" header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw Unauthorized("No authentication token provided.");
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // If invalid/expired, jwt.verify throws → caught by global error handler

    // 3. Check user still exists and is active (e.g., not banned)
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
        },
    });

    if (!user) {
        throw Unauthorized("User no longer exists.");
    }

    if (!user.isActive) {
        throw Unauthorized("Your account has been deactivated.");
    }

    // 4. Attach user to request — all subsequent middleware/controllers can use it
    req.user = user;
    next();
}

// ── authorize ─────────────────────────────────────────────────────────────────
// Returns middleware that checks if req.user.role is in the allowed roles array
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            throw Unauthorized("Not authenticated.");
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw Forbidden(
                `Access denied. Required role: ${allowedRoles.join(" or ")}.`
            );
        }

        next();
    };
}

// ── requireEmailVerified ──────────────────────────────────────────────────────
// Optional: blocks unverified emails from certain actions
export function requireEmailVerified(req, res, next) {
    if (!req.user.isEmailVerified) {
        throw Forbidden("Please verify your email address first.");
    }
    next();
}

// ── optionalAuthenticate ──────────────────────────────────────────────────────
// Attaches req.user if a valid Bearer token is present, but never blocks.
// Use for public endpoints that have enhanced behaviour when logged in.
export async function optionalAuthenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, isActive: true, isEmailVerified: true },
        });

        if (user && user.isActive) req.user = user;
    } catch {
        // Invalid/expired token — just continue as anonymous
    }
    next();
}