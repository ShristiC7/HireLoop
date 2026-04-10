import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development logs (human-readable)
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",

    transports: [
        // Console transport — always on
        new winston.transports.Console({
            format:
                process.env.NODE_ENV === "production"
                    ? combine(timestamp(), json())
                    : combine(colorize(), timestamp({ format: "HH:mm:ss" }), devFormat),
        }),

        // File transport — errors only, in production
        ...(process.env.NODE_ENV === "production"
            ? [
                new winston.transports.File({
                    filename: "logs/error.log",
                    level: "error",
                    format: combine(timestamp(), json()),
                }),
                new winston.transports.File({
                    filename: "logs/combined.log",
                    format: combine(timestamp(), json()),
                }),
            ]
            : []),
    ],

    // Don't crash on uncaught exceptions — log them instead
    exceptionHandlers: [
        new winston.transports.Console(),
        ...(process.env.NODE_ENV === "production"
            ? [new winston.transports.File({ filename: "logs/exceptions.log" })]
            : []),
    ],
});