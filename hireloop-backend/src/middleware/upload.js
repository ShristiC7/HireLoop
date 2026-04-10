import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";
import { BadRequest } from "./errorHandler.js";

// ── Storage configurations ────────────────────────────────────────────────────

const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "hireloop/avatars",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
        public_id: (req) => `avatar_${req.user.id}_${Date.now()}`,
    },
});

const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "hireloop/resumes",
        resource_type: "raw",
        allowed_formats: ["pdf"],
        public_id: (req) => `resume_${req.user.id}_${Date.now()}`,
    },
});

const logoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "hireloop/logos",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
        transformation: [{ width: 200, height: 200, crop: "fit", quality: "auto" }],
        public_id: (req) => `logo_${req.user.id}_${Date.now()}`,
    },
});

// ── File filters ──────────────────────────────────────────────────────────────

function imageFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(BadRequest("Only image files are allowed."), false);
    }
}

function pdfFilter(req, file, cb) {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(BadRequest("Only PDF files are allowed."), false);
    }
}

// ── Multer instances ──────────────────────────────────────────────────────────

// Named export for recruiter logo (used with handleUpload wrapper)
export const uploadCompanyLogo = multer({
    storage: logoStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("logo");

// Object export for student routes (cleaner import syntax)
export const upload = {
    avatar: multer({
        storage: avatarStorage,
        fileFilter: imageFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }).single("avatar"),

    resumePDF: multer({
        storage: resumeStorage,
        fileFilter: pdfFilter,
        limits: { fileSize: 10 * 1024 * 1024 },
    }).single("resume"),

    companyLogo: uploadCompanyLogo,
};

// ── Error-catching wrapper ────────────────────────────────────────────────────
// Express does not automatically catch multer errors — this wrapper does.
// Usage: router.post("/logo", handleUpload(uploadCompanyLogo), controller)
export function handleUpload(multerMiddleware) {
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (!err) return next();
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return next(BadRequest("File is too large. Please upload a smaller file."));
                }
                return next(BadRequest(`Upload error: ${err.message}`));
            }
            next(err);
        });
    };
}