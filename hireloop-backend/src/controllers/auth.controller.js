import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    setRefreshTokenCookie,
    clearRefreshTokenCookie,
} from "../utils/jwt.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
} from "../utils/email.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { AppError, BadRequest, Unauthorized, NotFound, Conflict } from "../middleware/errorHandler.js";

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(req, res) {
    const { email, password, role, firstName, lastName } = req.body;

    // Check if email already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw Conflict("An account with this email already exists.");

    // Hash password — bcrypt with 12 rounds (strong security, ~300ms)
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate email verification token (random hex string)
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    // Create user + their role-specific profile in one DB transaction
    // Transactions ensure BOTH records are created, or NEITHER (data consistency)
    const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                email,
                passwordHash,
                role,
                emailVerifyToken,
            },
        });

        // Create the matching profile based on role
        if (role === "STUDENT") {
            await tx.studentProfile.create({
                data: {
                    userId: newUser.id,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    college: "",
                    department: "",
                    degree: "",
                    graduationYear: new Date().getFullYear() + 1,
                },
            });
        } else if (role === "RECRUITER") {
            await tx.recruiterProfile.create({
                data: {
                    userId: newUser.id,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    companyName: "",
                    status: "PENDING", // must be approved by admin
                },
            });
        }

        return newUser;
    });

    // Send verification email (non-blocking — don't await failure)
    sendVerificationEmail(
        { email, firstName: firstName || "there" },
        emailVerifyToken
    );

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    setRefreshTokenCookie(res, refreshToken);

    sendCreated(res, {
        message: "Account created! Please verify your email.",
        data: {
            user: { id: user.id, email: user.email, role: user.role },
            accessToken,
        },
    });
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(req, res) {
    const { email, password } = req.body;

    // Find user with their profile (for name in response)
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            studentProfile: { select: { firstName: true, lastName: true, isPremium: true } },
            recruiterProfile: { select: { firstName: true, lastName: true, companyName: true, status: true } },
            adminProfile: { select: { firstName: true, lastName: true } },
        },
    });

    if (!user) throw Unauthorized("Invalid email or password.");

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw Unauthorized("Invalid email or password.");

    if (!user.isActive) throw Unauthorized("Your account has been deactivated.");

    // Recruiter must be approved before logging in
    if (user.role === "RECRUITER" && user.recruiterProfile?.status === "PENDING") {
        throw Unauthorized("Your recruiter account is pending admin approval.");
    }
    if (user.role === "RECRUITER" && user.recruiterProfile?.status === "REJECTED") {
        throw Unauthorized("Your recruiter account application was rejected.");
    }

    // Update last login timestamp
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    setRefreshTokenCookie(res, refreshToken);

    // Build profile data for response
    const profile =
        user.studentProfile || user.recruiterProfile || user.adminProfile;

    sendSuccess(res, {
        message: "Login successful.",
        data: {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                ...(user.studentProfile && { isPremium: user.studentProfile.isPremium }),
                ...(user.recruiterProfile && { companyName: user.recruiterProfile.companyName }),
            },
            accessToken,
        },
    });
}

// ── Refresh Access Token ──────────────────────────────────────────────────────
export async function refreshToken(req, res) {
    const token = req.cookies.refreshToken;
    if (!token) throw Unauthorized("No refresh token.");

    const record = await verifyRefreshToken(token);
    if (!record) throw Unauthorized("Invalid or expired refresh token. Please login again.");

    if (!record.user.isActive) throw Unauthorized("Account deactivated.");

    // Issue new access token
    const accessToken = generateAccessToken(record.user);

    sendSuccess(res, {
        message: "Token refreshed.",
        data: { accessToken },
    });
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logout(req, res) {
    const token = req.cookies.refreshToken;
    if (token) await revokeRefreshToken(token);
    clearRefreshTokenCookie(res);

    sendSuccess(res, { message: "Logged out successfully." });
}

// ── Logout All Devices ────────────────────────────────────────────────────────
export async function logoutAll(req, res) {
    await revokeAllUserTokens(req.user.id);
    clearRefreshTokenCookie(res);

    sendSuccess(res, { message: "Logged out from all devices." });
}

// ── Verify Email ──────────────────────────────────────────────────────────────
export async function verifyEmail(req, res) {
    const { token } = req.query;
    if (!token) throw BadRequest("Verification token is required.");

    const user = await prisma.user.findFirst({
        where: { emailVerifyToken: token },
    });

    if (!user) throw BadRequest("Invalid or expired verification token.");

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            emailVerifyToken: null, // consume the token
        },
    });

    sendSuccess(res, { message: "Email verified successfully! You can now login." });
}

// ── Resend Verification Email ─────────────────────────────────────────────────
export async function resendVerification(req, res) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw NotFound("No account found with this email.");
    if (user.isEmailVerified) throw BadRequest("Email is already verified.");

    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyToken },
    });

    sendVerificationEmail({ email, firstName: "there" }, emailVerifyToken);

    sendSuccess(res, { message: "Verification email sent." });
}

// ── Forgot Password ───────────────────────────────────────────────────────────
export async function forgotPassword(req, res) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success even if email not found (prevents email enumeration)
    if (!user) {
        return sendSuccess(res, {
            message: "If an account exists, a reset link has been sent.",
        });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: resetToken,
            passwordResetExpiry: expiry,
        },
    });

    sendPasswordResetEmail(user, resetToken);

    sendSuccess(res, {
        message: "If an account exists, a reset link has been sent.",
    });
}

// ── Reset Password ────────────────────────────────────────────────────────────
export async function resetPassword(req, res) {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: token,
            passwordResetExpiry: { gt: new Date() }, // not expired
        },
    });

    if (!user) throw BadRequest("Invalid or expired password reset token.");

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            passwordResetToken: null,
            passwordResetExpiry: null,
        },
    });

    // Invalidate all sessions for security
    await revokeAllUserTokens(user.id);

    sendSuccess(res, { message: "Password reset successfully. Please login." });
}

// ── Change Password (authenticated) ──────────────────────────────────────────
export async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw BadRequest("Current password is incorrect.");

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
    });

    // Revoke other sessions but keep current
    const currentToken = req.cookies.refreshToken;
    await prisma.refreshToken.deleteMany({
        where: { userId: user.id, NOT: { token: currentToken } },
    });

    sendSuccess(res, { message: "Password changed successfully." });
}

// ── Get Current User (me) ─────────────────────────────────────────────────────
export async function getMe(req, res) {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            studentProfile: true,
            recruiterProfile: true,
            adminProfile: true,
        },
    });

    const profile =
        user.studentProfile || user.recruiterProfile || user.adminProfile;

    sendSuccess(res, {
        data: {
            id: user.id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            profile,
        },
    });
}