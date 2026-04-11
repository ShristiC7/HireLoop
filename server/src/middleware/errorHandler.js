import { Prisma } from "@prisma/client";
import { logger } from "../config/logger.js";

// Custom error class so we can set HTTP status codes on errors
export class AppError extends Error {
    constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // distinguish from unexpected crashes
    }
}

// Shorthand factories for common errors
export const BadRequest = (msg) => new AppError(msg, 400, "BAD_REQUEST");
export const Unauthorized = (msg = "Not authenticated") =>
    new AppError(msg, 401, "UNAUTHORIZED");
export const Forbidden = (msg = "Access denied") =>
    new AppError(msg, 403, "FORBIDDEN");
export const NotFound = (msg = "Resource not found") =>
    new AppError(msg, 404, "NOT_FOUND");
export const Conflict = (msg) => new AppError(msg, 409, "CONFLICT");

// ── Main Error Handler ────────────────────────────────────────────────────────
export function errorHandler(err, req, res, next) {
    // Log the error
    if (err.isOperational) {
        logger.warn(`[${req.method} ${req.path}] ${err.message}`);
    } else {
        logger.error(`[${req.method} ${req.path}] Unexpected error:`, err);
    }

    // ── Prisma specific errors ────────────────────────────────────────────────

    // Unique constraint violation (e.g., email already exists)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] || "field";
            return res.status(409).json({
                success: false,
                message: `A record with this ${field} already exists.`,
                code: "DUPLICATE_ENTRY",
            });
        }

        // Record not found
        if (err.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "The requested record was not found.",
                code: "NOT_FOUND",
            });
        }

        // Foreign key constraint
        if (err.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "Related record does not exist.",
                code: "INVALID_REFERENCE",
            });
        }
    }

    // Prisma validation errors
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            success: false,
            message: "Invalid data provided.",
            code: "VALIDATION_ERROR",
        });
    }

    // JWT errors (handled in auth middleware but caught here too)
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token.",
            code: "INVALID_TOKEN",
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token has expired.",
            code: "TOKEN_EXPIRED",
        });
    }

    // ── Operational errors (thrown with AppError) ────────────────────────────
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
        });
    }

    // ── Unknown/unexpected errors ─────────────────────────────────────────────
    return res.status(500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Something went wrong. Please try again."
                : err.message,
        code: "INTERNAL_ERROR",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}