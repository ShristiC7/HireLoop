import "express-async-errors"; // Must be first — patches async error handling
import dotenv from "dotenv";
dotenv.config(); // Load .env variables before anything else

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import { prisma } from "./config/database.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

// ── Route Imports ────────────────────────────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import recruiterRoutes from "./routes/recruiter.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ───────────────────────────────────────────────────────
// helmet adds secure HTTP headers automatically
app.use(helmet());

// CORS: only allow requests from your frontend URL
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true, // needed for cookies (refresh tokens)
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ── General Rate Limiting ─────────────────────────────────────────────────────
// Limits each IP to 1000 requests per 15 minutes to prevent abuse
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // 1000 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
});
app.use(generalLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── HTTP Logging ──────────────────────────────────────────────────────────────
// In development: colorful logs. In production: JSON logs via winston.
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ── Health Check ──────────────────────────────────────────────────────────────
// Used by hosting platforms (Railway, Render, etc.) to confirm server is alive
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "HireLoop API is running 🚀",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ────────────────────────────────────────────────────────────────
const API = "/api/v1";

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/student`, studentRoutes);
app.use(`${API}/recruiter`, recruiterRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/jobs`, jobRoutes);
app.use(`${API}/applications`, applicationRoutes);
app.use(`${API}/resumes`, resumeRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/announcements`, announcementRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must be LAST. Catches all errors thrown inside route handlers.
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
async function startServer() {
    try {
        // Test database connection before starting
        await prisma.$connect();
        logger.info("✅ Database connected successfully");

        app.listen(PORT, () => {
            logger.info(`🚀 HireLoop API running on http://localhost:${PORT}`);
            logger.info(`📋 Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Graceful shutdown: close DB connection when server stops
process.on("SIGINT", async () => {
    await prisma.$disconnect();
    logger.info("Server shut down gracefully.");
    process.exit(0);
});

startServer();

export default app;