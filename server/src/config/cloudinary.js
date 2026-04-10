import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // always use HTTPS
});

// Test connection on startup
export async function verifyCloudinaryConnection() {
    try {
        await cloudinary.api.ping();
        logger.info("✅ Cloudinary connected");
    } catch (error) {
        logger.warn("⚠️  Cloudinary connection failed:", error.message);
    }
}

// Helper: delete a file from Cloudinary (used when student deletes resume)
export async function deleteFromCloudinary(publicId, resourceType = "raw") {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (error) {
        logger.error("Cloudinary delete error:", error);
        throw error;
    }
}

export { cloudinary };