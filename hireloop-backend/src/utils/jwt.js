import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/database.js";

// ── Generate Access Token ─────────────────────────────────────────────────────
export function generateAccessToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
    );
}

// ── Generate Refresh Token ────────────────────────────────────────────────────
export async function generateRefreshToken(userId) {
    const token = uuidv4(); // Random UUID as refresh token (not JWT)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Store in database so we can invalidate on logout
    await prisma.refreshToken.create({
        data: { token, userId, expiresAt },
    });

    return token;
}

// ── Verify Refresh Token ──────────────────────────────────────────────────────
export async function verifyRefreshToken(token) {
    const record = await prisma.refreshToken.findUnique({
        where: { token },
        include: {
            user: {
                select: { id: true, email: true, role: true, isActive: true },
            },
        },
    });

    if (!record) return null;
    if (record.expiresAt < new Date()) {
        // Expired — clean up
        await prisma.refreshToken.delete({ where: { token } });
        return null;
    }

    return record;
}

// ── Revoke Refresh Token (logout) ─────────────────────────────────────────────
export async function revokeRefreshToken(token) {
    try {
        await prisma.refreshToken.delete({ where: { token } });
    } catch {
        // Token didn't exist — that's fine
    }
}

// ── Revoke All Tokens (logout all devices) ────────────────────────────────────
export async function revokeAllUserTokens(userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ── Set Refresh Token Cookie ──────────────────────────────────────────────────
export function setRefreshTokenCookie(res, token) {
    res.cookie("refreshToken", token, {
        httpOnly: true, // JS cannot read this cookie
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: "/api/v1/auth", // Only sent on auth routes
    });
}

// ── Clear Refresh Token Cookie ────────────────────────────────────────────────
export function clearRefreshTokenCookie(res) {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth",
    });
}