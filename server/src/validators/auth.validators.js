import { z } from "zod";

// ── Register ──────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .email("Invalid email address")
            .toLowerCase()
            .trim(),

        password: z
            .string({ required_error: "Password is required" })
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain uppercase, lowercase, and a number"
            ),

        role: z.enum(["STUDENT", "RECRUITER", "ADMIN"], {
            required_error: "Role is required",
            invalid_type_error: "Role must be STUDENT, RECRUITER, or ADMIN",
        }),

        // Optional on register, required in profile completion step
        firstName: z.string().trim().min(1).optional(),
        lastName: z.string().trim().min(1).optional(),
    }),
});

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(1, "Password is required"),
    }),
});

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase().trim(),
    }),
});

// ── Reset Password ────────────────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain uppercase, lowercase, and a number"
            ),
    }),
});

// ── Change Password ───────────────────────────────────────────────────────────
export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain uppercase, lowercase, and a number"
            ),
    }),
});