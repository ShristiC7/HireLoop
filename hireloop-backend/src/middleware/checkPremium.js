import { prisma } from "../config/database.js";

export async function checkPremiumExpiry(req, res, next) {
    // Only relevant for students
    if (!req.user || req.user.role !== "STUDENT") return next();

    const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true, isPremium: true, premiumExpiresAt: true },
    });

    if (!profile) return next();

    // If premium but expiry date has passed — downgrade
    if (profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt < new Date()) {
        await prisma.studentProfile.update({
            where: { id: profile.id },
            data: { isPremium: false, premiumExpiresAt: null },
        });
    }

    next();
}