import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
    register,
    login,
    logout,
    logoutAll,
    refreshToken,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    getMe,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from "../validators/auth.validators.js";

const router = Router();

// Stricter rate limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // only 10 attempts per 15 min
    message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
});

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refreshToken);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);

// ── Protected Routes (require login) ─────────────────────────────────────────
router.use(authenticate); // All routes below this line require auth

router.post("/logout", logout);
router.post("/logout-all", logoutAll);
router.put("/change-password", validate(changePasswordSchema), changePassword);
router.get("/me", getMe);

export default router;